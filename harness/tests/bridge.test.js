import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProcessTable,normalizeState,unknownState,observeProcesses,BridgeService,destinations} from '../../bridge/core.mjs';
import {createBridge,authorize} from '../../bridge/server.mjs';
import {LauncherBridge,normalizeBridgeState} from '../modules/launcher-bridge.js';
const at='2026-10-06T22:00:00.000Z',clock=()=>Date.parse(at);
const rows=[{pid:101,stat:'S',cpuPercent:0.7,executable:destinations[0].executable}];
const observed=()=>({observedAt:at,tools:normalizeState(rows,at)});

test('process parsing matches exact executable, keeps absent and UNKNOWN distinct',async()=>{
 const parsed=parseProcessTable(`101 S 0.7 ${destinations[0].executable}\n102 S 0.0 ${destinations[2].executable}\n103 S 1.0 ${destinations[0].executable} Helper`);
 assert.equal(normalizeState(parsed,at)[0].pids.length,1);assert.equal(normalizeState(parsed,at)[2].running,true);
 const state=normalizeState(rows,at);assert.equal(state[1].running,false);assert.equal(state[1].status,'observed');assert.equal(state[0].focus.status,'unknown');
 assert.equal(normalizeState([{...rows[0],stat:'Z'}],at)[0].running,false);
 for(const malformed of ['',null,'101 S nope /a','0 S 0 /a'])assert.throws(()=>parseProcessTable(malformed));
 const failed=await observeProcesses({execute:async()=>{throw Error('offline');},now:()=>at});assert.equal(failed.tools[0].running,null);assert.equal(failed.tools[0].pids,null);assert.equal(failed.tools[0].status,'unknown');
});
test('unknown and malformed/expired bridge data never become zero or running',()=>{
 const ids=destinations.map(d=>d.id);
 const result=normalizeBridgeState({tools:[unknownState('cursor','probe denied',at)]},ids,clock());assert.equal(result.tools[0].running,null);assert.equal(result.tools[1].pids,null);
 for(const mutation of [{running:null},{pids:[101],processes:[{pid:101,stat:'S',cpuPercent:null}]},{observedAt:'bad'},{observedAt:'2026-10-06T21:00:00Z'}]){
 const bad=normalizeBridgeState({tools:[{...observed().tools[0],...mutation}]},['cursor'],clock());assert.equal(bad.tools[0].status,'unknown');}
 assert.equal(normalizeBridgeState({tools:[observed().tools[0],observed().tools[0]]},['cursor'],clock()).tools[0].status,'unknown');
});
test('dispatch is separate from observation, argv is fixed and refusal performs no command',async()=>{
 let calls=[],now=0;const service=new BridgeService({execute:async(file,argv,options)=>{calls.push({file,argv,options});},observe:async()=>observed(),now:()=>at,clock:()=>now});
 assert.equal((await service.open('cursor; touch /tmp/no')).httpStatus,400);assert.equal(calls.length,0);
 const result=await service.open('cursor');assert.equal(result.dispatch.status,'dispatched');assert.equal(result.observation.status,'observed');assert.equal(result.observation.running,true);assert.equal(result.observation.focus.status,'unknown');assert.equal(result.verification,'verified-dispatch-and-running');
 assert.deepEqual(calls[0].argv,destinations[0].argv);assert.equal(calls[0].file,'/usr/bin/open');assert.equal(calls[0].options.shell,false);
 assert.equal((await service.open('cursor')).httpStatus,429);now=1000;assert.equal((await service.open('cursor')).httpStatus,200);
 const unavailable=new BridgeService({execute:async()=>{},observe:async()=>({tools:destinations.map(d=>unknownState(d.id,'offline',at))}),now:()=>at});
 const unobserved=await unavailable.open('claude');assert.equal(unobserved.dispatch.status,'dispatched');assert.equal(unobserved.observation.running,null);assert.equal(unobserved.verification,'unverified');
 const failure=new BridgeService({execute:async()=>{throw Error('denied');},observe:async()=>observed(),now:()=>at});const failed=await failure.open('cursor');assert.equal(failed.dispatch.status,'failed');assert.equal(failed.observation.running,true);assert.equal(failed.verification,'unverified');
});
test('pending activation and process reads do not overlap',async()=>{
 let release,reads=0;const observe=()=>{reads++;return new Promise(r=>release=r);};const service=new BridgeService({observe,execute:async()=>{}});
 const a=service.state(),b=service.state();await Promise.resolve();assert.equal(reads,1);release(observed());await Promise.all([a,b]);
 let finish;const blocked=new BridgeService({execute:()=>new Promise(r=>finish=r),observe:async()=>observed()});const first=blocked.open('cursor');assert.equal((await blocked.open('cursor')).httpStatus,429);finish();await first;
});
test('HTTP requires token AND own Origin AND same-origin fetch metadata, rejects cross-origin POST',async(t)=>{
 let opens=0;const bridge=createBridge({service:new BridgeService({execute:async()=>{opens++;},observe:async()=>observed(),now:()=>at})});const origin=await bridge.listen(0);t.after(()=>new Promise(r=>bridge.server.close(r)));
 assert.equal(bridge.server.address().address,'127.0.0.1');
 const html=await (await fetch(origin)).text();assert.ok(html.includes('Static fallback: browser cannot observe'));const token=html.match(/name="bridge-token" content="([a-f0-9]+)"/)[1];
 const headers={'Content-Type':'application/json',Origin:origin,'Sec-Fetch-Site':'same-origin','X-Bridge-Token':token};
 for(const override of [{'X-Bridge-Token':'bad'},{Origin:'https://evil.example'},{Origin:origin.replace('127.0.0.1','localhost')},{'Sec-Fetch-Site':'cross-site'},{'Sec-Fetch-Site':'same-site'},{'Sec-Fetch-Site':'none'},{Origin:'null'}]){
  const r=await fetch(origin+'/api/open',{method:'POST',headers:{...headers,...override},body:'{"tool":"cursor"}'});assert.equal(r.status,403);
 }
 const noOrigin={...headers};delete noOrigin.Origin;assert.equal((await fetch(origin+'/api/open',{method:'POST',headers:noOrigin,body:'{"tool":"cursor"}'})).status,403);
 const noSite={...headers};delete noSite['Sec-Fetch-Site'];assert.equal((await fetch(origin+'/api/open',{method:'POST',headers:noSite,body:'{"tool":"cursor"}'})).status,403);
 assert.equal(opens,0);
 assert.equal((await fetch(origin+'/api/open',{method:'POST',headers,body:'{"tool":"unknown"}'})).status,400);assert.equal(opens,0);
 assert.equal((await fetch(origin+'/api/open',{method:'POST',headers,body:'{"tool":"cursor","command":"bad"}'})).status,400);assert.equal(opens,0);
 assert.equal((await fetch(origin+'/api/open',{method:'POST',headers,body:'{"tool":"unknown"}'})).status,400);assert.equal(opens,0);
 assert.equal((await fetch(origin+'/api/open',{method:'POST',headers,body:'{"tool":"cursor"}'})).status,200);assert.equal(opens,1);
 const state=await fetch(origin+'/api/state',{headers});assert.equal(state.status,200);assert.equal((await state.text()).includes(token),false);
 assert.equal((await fetch(origin,{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
 assert.equal(authorize({...headers,host:'evil.example'},{origin,token},true),false);
 assert.equal((await fetch(origin+'/.claude/settings.json')).status,404);
});
test('unreachable/plain-server bridge falls back and disposal cancels reads',async()=>{
 for(const fetcher of [async()=>{throw Error('offline');},async()=>({ok:false,status:404}),async()=>({ok:true,json:async()=>({})})]){
  const bridge=new LauncherBridge({token:'test',ids:['cursor'],fetcher,now:clock});assert.equal(await bridge.refresh(),null);assert.equal(bridge.snapshot,null);assert.ok((await bridge.open('cursor')).error);bridge.dispose();
 }
 let requests=0;const plain=new LauncherBridge({ids:['cursor'],fetcher:async()=>{requests++;}});assert.equal(await plain.refresh(),null);assert.equal(requests,0);
 let signal;const client=new LauncherBridge({token:'test',ids:['cursor'],fetcher:async(_,o)=>{signal=o.signal;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('cancel'))));}});const pending=client.refresh();client.dispose();await pending;assert.equal(signal.aborted,true);assert.equal(client.snapshot,null);
});


test('post-dispatch observation discards a probe that started before dispatch',async()=>{
 let finishOld,reads=0;
 const service=new BridgeService({execute:async()=>{},observe:()=>{reads++;return reads===1?new Promise(r=>finishOld=r):Promise.resolve(observed());},now:()=>at});
 const old=service.state();await Promise.resolve();
 const opening=service.open('cursor');await Promise.resolve();assert.equal(reads,1);
 finishOld({tools:destinations.map(d=>unknownState(d.id,'old probe',at))});await old;
 const result=await opening;assert.equal(reads,2);assert.equal(result.observation.running,true);
});
