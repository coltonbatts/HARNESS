import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,stat,symlink} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {approved,inspectBundle,RegistrationStore} from '../../bridge/registrations.mjs';
import {BridgeService,normalizeState} from '../../bridge/core.mjs';
import {createBridge} from '../../bridge/server.mjs';
async function fixture(t){
 const root=await mkdtemp(path.join(os.tmpdir(),'harness-launcher-'));const canonical=await (await import('node:fs/promises')).realpath(root);t.after(()=>rm(canonical,{recursive:true,force:true}));
 const apps=path.join(canonical,'Applications');await mkdir(apps);
 const make=async(name='Cursor',info={CFBundleIdentifier:approved.cursor.bundleId,CFBundleExecutable:'Cursor'})=>{
  const bundle=path.join(apps,name+'.app');await mkdir(path.join(bundle,'Contents/MacOS'),{recursive:true});await writeFile(path.join(bundle,'Contents/Info.plist'),JSON.stringify(info));await writeFile(path.join(bundle,'Contents/MacOS/Cursor'),'Demo inert executable',{mode:0o700});return bundle;
 };
 const plistCalls=[];const inspect=(id,p)=>inspectBundle(id,p,{roots:[apps],execute:async(file,argv,opts)=>{plistCalls.push({file,argv,opts});return {stdout:await readFile(argv.at(-1),'utf8')};}});
 const store=new RegistrationStore({root:path.join(canonical,'store'),inspect});return {root:canonical,apps,make,inspect,store,plistCalls};
}
test('Demo approved registration validates identity/path/executable, persists privately and never launches',async t=>{
 const f=await fixture(t),bundle=await f.make();
 for(const input of [null,{tool:'removed-tool',bundlePath:bundle},{tool:'cursor',bundlePath:bundle,argv:['bad']},{tool:'__proto__',bundlePath:bundle},{tool:'cursor',bundlePath:'/bin/sh'},{tool:'cursor',bundlePath:bundle+'/../Cursor.app'},{tool:'cursor',bundlePath:bundle+'\n'}])assert.equal((await f.store.register(input)).httpStatus,400);
 assert.equal((await f.store.register({tool:'cursor',bundlePath:bundle})).httpStatus,200);
 assert.deepEqual((await f.store.get('cursor')).argv,['-a',bundle]);assert.ok(f.plistCalls.every(c=>c.file==='/usr/bin/plutil'&&c.opts.shell===false&&c.argv.join(' ').startsWith('-convert json -o - ')));
 assert.equal((await stat(path.join(f.root,'store/registrations.json'))).mode&0o777,0o600);assert.equal((await stat(path.join(f.root,'store'))).mode&0o777,0o700);
 const restarted=new RegistrationStore({root:path.join(f.root,'store'),inspect:f.inspect});assert.equal((await restarted.get('cursor')).bundlePath,bundle);
 await rm(bundle,{recursive:true});assert.equal((await restarted.get('cursor')).available,false);
 const moved=await f.make('Moved Cursor');assert.equal((await restarted.register({tool:'cursor',bundlePath:moved})).httpStatus,200);
 assert.equal((await restarted.get('cursor')).bundlePath,moved);
});
test('Demo bad metadata/symlinks/oversize/corrupt stores preserve registration and refuse before dispatch',async t=>{
 const f=await fixture(t),bundle=await f.make();await f.store.register({tool:'cursor',bundlePath:bundle});
 const before=await readFile(path.join(f.root,'store/registrations.json'),'utf8');
 const bad=await f.make('Bad',{CFBundleIdentifier:'com.evil',CFBundleExecutable:'Cursor'});assert.equal((await f.store.register({tool:'cursor',bundlePath:bad})).httpStatus,400);
 await symlink(bundle,path.join(f.apps,'Alias.app'));assert.equal((await f.store.register({tool:'cursor',bundlePath:path.join(f.apps,'Alias.app')})).httpStatus,400);
 await writeFile(path.join(bad,'Contents/Info.plist'),'x'.repeat(65537));assert.equal((await f.store.register({tool:'cursor',bundlePath:bad})).httpStatus,400);
 assert.equal(await readFile(path.join(f.root,'store/registrations.json'),'utf8'),before);
 let calls=0;const service=new BridgeService({registrations:f.store,execute:async()=>calls++});
 await rm(bundle,{recursive:true});assert.equal((await service.open('cursor')).httpStatus,409);assert.equal(calls,0);
 assert.equal((await service.open('removed-tool')).httpStatus,400);assert.equal(calls,0);
 await writeFile(path.join(f.root,'store/registrations.json'),'BROKEN');const restarted=new RegistrationStore({root:path.join(f.root,'store'),inspect:f.inspect});assert.equal((await restarted.get('cursor')).available,false);assert.equal((await restarted.register({tool:'cursor',bundlePath:bad})).httpStatus,409);assert.equal(await readFile(path.join(f.root,'store/registrations.json'),'utf8'),'BROKEN');
});
test('Demo stopped/running observations, repeat guard, restart and configuration never dispatch on reads',async t=>{
 const f=await fixture(t),bundle=await f.make();await f.store.register({tool:'cursor',bundlePath:bundle});
 let running=false,calls=[],tick=0;const at=new Date().toISOString();const service=new BridgeService({registrations:f.store,clock:()=>tick,execute:async(file,argv,options)=>{calls.push({file,argv,options});running=true;},observe:async()=>({tools:normalizeState(running?[{pid:45,stat:'S',cpuPercent:0,executable:bundle+'/Contents/MacOS/Cursor'}]:[],at,[{id:'cursor',executable:bundle+'/Contents/MacOS/Cursor'}])})});
 assert.equal((await service.state()).tools[0].running,false);assert.equal(calls.length,0);
 const result=await service.open('cursor');assert.equal(result.dispatch.status,'dispatched');assert.equal(result.observation.running,true);assert.equal(result.observation.focus.status,'unknown');assert.deepEqual(calls[0].argv,['-a',bundle]);assert.equal(calls[0].file,'/usr/bin/open');assert.equal(calls[0].options.shell,false);
 assert.equal((await service.open('cursor')).httpStatus,429);tick=1000;assert.equal((await service.open('cursor')).observation.running,true);assert.equal(calls.length,2);
 assert.equal((await service.register({tool:'cursor',bundlePath:bundle})).httpStatus,200);assert.equal(service.evidence.has('cursor'),false);assert.equal(calls.length,2);
 const restarted=new BridgeService({registrations:new RegistrationStore({root:f.store.root,inspect:f.inspect}),execute:async()=>calls.push('unexpected')});const state=await restarted.state();assert.equal(state.routes[0].verification,'unverified');assert.equal(calls.length,2);
});
test('Demo registration HTTP gates body/query/identity before reads/writes/executor; private file cannot serve',async t=>{
 const f=await fixture(t),bundle=await f.make();let calls=0;const bridge=createBridge({service:new BridgeService({registrations:f.store,execute:async()=>calls++})});const origin=await bridge.listen(0);t.after(()=>new Promise(r=>bridge.server.close(r)));
 const html=await (await fetch(origin)).text(),token=html.match(/name="bridge-token" content="([a-f0-9]+)"/)[1];const headers={'Content-Type':'application/json',Origin:origin,'Sec-Fetch-Site':'same-origin','X-Bridge-Token':token};const body=JSON.stringify({tool:'cursor',bundlePath:bundle});
 for(const change of [{Origin:'null'},{Origin:'https://evil.test'},{'Sec-Fetch-Site':'same-site'},{'Sec-Fetch-Site':'cross-site'},{'X-Bridge-Token':'wrong'}])assert.equal((await fetch(origin+'/api/launcher/registration',{method:'POST',headers:{...headers,...change},body})).status,403);
 const {request}=await import('node:http');
 const hostStatus=await new Promise((resolve,reject)=>{const req=request(origin+'/api/launcher/registration',{method:'POST',headers:{...headers,Host:'evil.test'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end(body);});assert.equal(hostStatus,403);
 assert.equal(f.plistCalls.length,0);assert.equal(calls,0);
 for(const [suffix,payload,status] of [['?path=x',body,400],['',JSON.stringify({tool:'cursor',bundlePath:bundle,command:'bad'}),400],['','x'.repeat(1025),413],['','{',400]])assert.equal((await fetch(origin+'/api/launcher/registration'+suffix,{method:'POST',headers,body:payload})).status,status);
 assert.equal((await fetch(origin+'/api/launcher/registration',{method:'POST',headers,body})).status,200);assert.equal(calls,0);
 assert.equal((await fetch(origin+'/.launcher/registrations.json')).status,404);
 await new Promise(r=>bridge.server.close(r));const next=createBridge({service:new BridgeService({registrations:new RegistrationStore({root:f.store.root,inspect:f.inspect})})});const nextOrigin=await next.listen(0);t.after(()=>new Promise(r=>next.server.close(r)));assert.equal((await fetch(nextOrigin+'/api/state',{headers:{...headers,Origin:nextOrigin}})).status,403);
});

test('Demo changed metadata and executable symlink refuse a previously registered app before executor',async t=>{
 const f=await fixture(t),bundle=await f.make();await f.store.register({tool:'cursor',bundlePath:bundle});let calls=0;
 const service=new BridgeService({registrations:f.store,execute:async()=>calls++});
 await writeFile(path.join(bundle,'Contents/Info.plist'),JSON.stringify({CFBundleIdentifier:'com.changed',CFBundleExecutable:'Cursor'}));
 assert.equal((await service.open('cursor')).httpStatus,409);assert.equal(calls,0);
 await writeFile(path.join(bundle,'Contents/Info.plist'),JSON.stringify({CFBundleIdentifier:approved.cursor.bundleId,CFBundleExecutable:'Cursor'}));
 await rm(path.join(bundle,'Contents/MacOS/Cursor'));await symlink('/bin/sh',path.join(bundle,'Contents/MacOS/Cursor'));
 assert.equal((await f.store.get('cursor')).available,false);assert.equal(calls,0);
});
test('Demo registration/dispatch serialize; selecting/reading/configuring is never a native launch',async()=>{
 let finish,calls=0;const registrations={register:()=>new Promise(r=>finish=r),list:async()=>[],get:async()=>({available:true,argv:['-a','Demo.app']})};
 const service=new BridgeService({registrations,execute:async()=>calls++,observe:async()=>({tools:[]})});
 const first=service.register({tool:'cursor',bundlePath:'Demo.app'});assert.equal((await service.open('cursor')).httpStatus,409);assert.equal((await service.register({tool:'cursor',bundlePath:'Demo.app'})).httpStatus,409);await service.state();assert.equal(calls,0);finish({httpStatus:200});await first;assert.equal(calls,0);
});

test('Demo Codex pinned bundle re-selection, old three-tool store compatibility and refusal before native dispatch',async t=>{
 const f=await fixture(t);const bundle=path.join(f.apps,'Renamed.app');await mkdir(path.join(bundle,'Contents/MacOS'),{recursive:true});await writeFile(path.join(bundle,'Contents/MacOS/ChatGPT'),'Demo inert executable',{mode:0o700});const plist=path.join(bundle,'Contents/Info.plist');await writeFile(plist,JSON.stringify({CFBundleIdentifier:'com.openai.codex',CFBundleExecutable:'ChatGPT',CFBundleShortVersionString:'Demo'}));
 assert.equal((await f.store.register({tool:'codex',bundlePath:bundle})).httpStatus,200);assert.equal((await f.store.get('codex')).bundleId,'com.openai.codex');assert.equal((await f.store.list()).length,4);assert.equal((await f.store.get('removed-tool')),null);
 let calls=0;const service=new BridgeService({registrations:f.store,execute:async(file,argv)=>{calls++;assert.equal(file,'/usr/bin/open');assert.deepEqual(argv,['-a',bundle]);},observe:async()=>({tools:normalizeState([{pid:99,stat:'S',cpuPercent:1,executable:bundle+'/Contents/MacOS/ChatGPT'}],new Date().toISOString(),[{id:'codex',executable:bundle+'/Contents/MacOS/ChatGPT'}])})});
 assert.equal((await service.open('codex')).verification,'verified-dispatch-and-running');assert.equal(calls,1);
 await writeFile(plist,JSON.stringify({CFBundleIdentifier:'com.openai.chatgpt',CFBundleExecutable:'ChatGPT'}));service.clock=()=>Date.now()+1001;assert.equal((await service.open('codex')).httpStatus,409);assert.equal(calls,1);
 const file=path.join(f.root,'store/registrations.json'),old=JSON.stringify({version:1,paths:{cursor:approved.cursor.bundlePath,claude:approved.claude.bundlePath,hermes:approved.hermes.bundlePath}});await writeFile(file,old);const oldStore=new RegistrationStore({root:f.store.root,inspect:f.inspect});await oldStore.load();assert.equal(oldStore.paths.codex,approved.codex.bundlePath);assert.equal(await readFile(file,'utf8'),old);
});
