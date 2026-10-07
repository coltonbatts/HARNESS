import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {assertRead,READ_METHODS,READ_PARAMS,sanitizeRateLimits,sanitizeTokenUsage,CodexConnection,CodexUsageService} from '../../bridge/codex-usage.mjs';
import {normalizeCodex,createCodexController,encodeCodexCache,decodeCodexCache,codexWindowLabel,makeCodexSource} from '../modules/codex-usage-core.js';
import {freshness} from '../modules/usage-core.js';
import {createBridge} from '../../bridge/server.mjs';
const now=Date.parse('2026-10-07T19:00:00Z');
const rates=()=>({planType:'plus',primary:{usedPercent:22,windowDurationMins:300,resetsAt:now/1000+3600},secondary:{usedPercent:8,windowDurationMins:10080,resetsAt:now/1000+86400}});
const snapshot=()=>({schema:1,source:'codex-app-server',status:'available',observed_at:new Date(now).toISOString(),rates:rates()});
test('Demo schema-pinned method allowlist refuses EVERY other generated method before dispatch',async()=>{
 const {methods}=JSON.parse(await readFile(new URL('../../docs/protocol/codex-0.160.0/methods.json',import.meta.url)));
 let connects=0,writes=0;const c=new CodexConnection({connect:()=>{connects++;},verify:async()=>{}});
 for(const m of [...methods,'thread/private/read','account/token/refresh','fs/read','plugin/list','marketplace/list','constructor','__proto__','unknown']){
  if(READ_METHODS.includes(m)){assert.doesNotThrow(()=>assertRead(m));continue;}
  assert.throws(()=>c.request(m,{}),/refused before dispatch/);
 }
 for(const [m,p] of [['account/read',{refreshToken:true}],['account/read',{}],['account/rateLimits/read',{supportsLunaReserve:true}],['account/usage/read',{threadId:'Demo-private'}],['account/usage/read',{path:'Demo'}]])assert.throws(()=>c.request(m,p),/refused before dispatch/);
 for(const params of [new Date(),()=>{},Object.create({toJSON:()=>({threadId:'Demo-private'})})])assert.throws(()=>c.request('account/usage/read',params),/refused/);
 assert.equal(connects,0);assert.equal(writes,0);
});
test('Demo schema parser strips identifiers, chooses Codex bucket, treats absent/malformed as UNKNOWN and keeps USD separate',()=>{
 const clean=sanitizeRateLimits({accountId:'Demo-private',rateLimits:rates(),rateLimitsByLimitId:{codex:{...rates(),limitId:'Demo-private',credits:{balance:'Demo-private'}}}});
 assert.equal(JSON.stringify(clean).includes('Demo-private'),false);assert.equal(clean.planType,'plus');
 assert.throws(()=>sanitizeRateLimits({rateLimits:rates(),rateLimitsByLimitId:{other:rates()}}),/bucket unavailable/);
 for(const v of [null,undefined,'0',false,-1,101,NaN,Infinity]){const r=rates();r.primary.usedPercent=v;assert.equal(normalizeCodex({...snapshot(),rates:sanitizeRateLimits({rateLimits:r})},now)[0].remaining,null);}
 for(const field of ['windowDurationMins','resetsAt']){const r=rates();r.primary[field]=null;assert.equal(normalizeCodex({...snapshot(),rates:r},now)[0].remaining,null);}
 const rows=normalizeCodex(snapshot(),now);assert.equal(rows[0].remaining,78);assert.equal(rows[1].remaining,92);assert.equal(codexWindowLabel(rows[0]),'Codex · 5-hour');assert.match(codexWindowLabel(rows[1]),/weekly/);
 const r=rates();r.primary.windowDurationMins=60;assert.match(codexWindowLabel(normalizeCodex({...snapshot(),rates:r},now)[0]),/60 min/);
 assert.throws(()=>normalizeCodex({...snapshot(),observed_at:'2026-02-30T00:00:00Z'},now));
 const tokens=sanitizeTokenUsage({dailyUsageBuckets:[{startDate:'2026-10-06',tokens:123,accountId:'Demo-private'}],threadUsage:{estimatedUsageUsdMicros:1200000,threadId:'Demo-private'}});assert.equal(tokens.estimatedUsageUsdMicros,null);assert.equal(JSON.stringify(tokens).includes('Demo-private'),false);assert.equal(tokens.dailyUsageBuckets[0].tokens,123);
});
test('Demo Codex stale last-good/cache, partial windows, backoff, no overlap and cancellation',async()=>{
 let time=now,calls=0;const c=createCodexController({now:()=>time,source:async()=>{if(++calls===1)return snapshot();throw Error('Demo offline');}});
 await c.refresh();time=c.nextRefresh;await c.refresh();assert.equal(c.rows[0].remaining,78);assert.equal(freshness(c.rows[0],time),'stale');assert.equal(await c.refresh(),false);
 for(const delay of [60000,120000,240000,300000]){time=c.nextRefresh;await c.refresh();assert.equal(c.nextRefresh-time,delay);}
 const cache=encodeCodexCache(c.rows);cache.observations[0].accountId='Demo-private';const recovered=decodeCodexCache(cache,now);assert.equal(recovered[0].remaining,78);assert.equal(recovered[0].status,'stale');assert.equal(JSON.stringify(recovered).includes('Demo-private'),false);
 const partial=createCodexController({now:()=>now,source:async()=>({...snapshot(),rates:{...rates(),secondary:null}})});await partial.refresh();assert.equal(partial.rows[1].remaining,null);assert.equal(partial.rows[0].remaining,78);
 let aborted=false;const waiting=createCodexController({source:({signal})=>new Promise((_,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('Canceled','AbortError'));}))});const p=waiting.refresh();assert.equal(await waiting.refresh(),false);waiting.dispose();await p;assert.equal(aborted,true);assert.equal(waiting.pending,null);
});
function serverFrame(data,op=1,fin=true){const b=Buffer.from(typeof data==='string'?data:JSON.stringify(data));const h=Buffer.alloc(b.length<126?2:4);h[0]=(fin?128:0)|op;h[1]=b.length<126?b.length:126;if(b.length>=126)h.writeUInt16BE(b.length,2);return Buffer.concat([h,b]);}
function demoSocket({error=null,hang=false,malformed=false}={}){
 const socket=new EventEmitter();const sent=[];socket.destroy=()=>{socket.destroyed=true;};socket.write=b=>{
  if(typeof b==='string'){
   const key=b.match(/Sec-WebSocket-Key: ([^\r]+)/)[1],accept=createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');queueMicrotask(()=>socket.emit('data',Buffer.from(`HTTP/1.1 101 Switching Protocols\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`)));return;
  }
  const op=b[0]&15;if(op===10){sent.push({pong:true});return;}let n=b[1]&127,start=2;if(n===126){n=b.readUInt16BE(2);start=4;}const mask=b.subarray(start,start+4),body=Buffer.from(b.subarray(start+4));for(let i=0;i<body.length;i++)body[i]^=mask[i%4];const m=JSON.parse(body.toString());sent.push(m);
  if(!Object.hasOwn(m,'id')||hang)return;
  queueMicrotask(()=>{
   if(malformed){socket.emit('data',serverFrame('{bad'));return;}
   let result=m.method==='initialize'?{}:m.method==='account/read'?{account:{type:'chatgpt',email:'Demo-private',accountId:'Demo-private'}}:m.method==='account/rateLimits/read'?{rateLimits:rates(),accountId:'Demo-private'}:{dailyUsageBuckets:[{startDate:'2026-10-06',tokens:123}]};
   socket.emit('data',serverFrame({method:'thread/started',params:{private:'Demo-private'}}));
   if(m.method==='account/rateLimits/read')socket.emit('data',serverFrame({method:'account/rateLimits/updated',params:{rateLimits:{primary:null}}}));
   const reply=JSON.stringify(error&&m.method==='account/rateLimits/read'?{id:m.id,error:{code:error,message:'Demo-private'}}:{id:m.id,result});const half=Math.floor(reply.length/2);const frames=Buffer.concat([serverFrame(reply.slice(0,half),1,false),serverFrame(reply.slice(half),0,true)]);
   socket.emit('data',frames.subarray(0,3));socket.emit('data',frames.subarray(3));
  });
 };
 return {socket,sent,connect:()=>{queueMicrotask(()=>socket.emit('connect'));return socket;}};
}
test('Demo documented Unix WebSocket route pins handshake/reads, handles fragmented notifications and never responds to private events',async()=>{
 const f=demoSocket();const service=new CodexUsageService({now:()=>now,connection:()=>new CodexConnection({connect:f.connect,verify:async()=>{}})});
 const r=await service.snapshot();assert.equal(r.status,'available');assert.equal(r.rates.primary.usedPercent,22);assert.equal(r.notificationObserved,true);assert.equal(JSON.stringify(r).includes('Demo-private'),false);assert.equal(f.socket.destroyed,true);
 assert.deepEqual(f.sent.map(m=>m.method),['initialize','initialized',...READ_METHODS]);assert.deepEqual(f.sent.find(m=>m.method==='account/read').params,{refreshToken:false});assert.deepEqual(f.sent.find(m=>m.method==='account/usage/read').params,{});
 assert.equal(f.sent[0].params.capabilities.requestAttestation,false);assert.ok(f.sent[0].params.capabilities.optOutNotificationMethods.includes('thread/started'));
 assert.equal(f.sent[0].params.capabilities.optOutNotificationMethods.includes('account/rateLimits/updated'),false);
});
test('Demo daemon missing/unauthenticated/older versions, stale data, timeout and cancel remain bounded',async()=>{
 for(const error of [-32601,-32602]){const f=demoSocket({error});const s=new CodexUsageService({now:()=>now,connection:()=>new CodexConnection({connect:f.connect,verify:async()=>{}})});const r=await s.snapshot();assert.equal(r.status,'unavailable');assert.match(r.reason,new RegExp(String(error)));assert.equal(r.reason.includes('Demo-private'),false);assert.equal(r.nextRefresh-now,30000);}
 const unavailable=new CodexUsageService({now:()=>now,connection:()=>new CodexConnection({verify:async()=>{throw Object.assign(Error(),{code:'ENOENT'});}})});assert.match((await unavailable.snapshot()).reason,/socket absent/);
 const unauth=new CodexUsageService({now:()=>now,connection:()=>({open:async()=>{},initialize:async()=>{},request:async()=>({account:null}),close(){}})});assert.match((await unauth.snapshot()).reason,/unauthenticated/);
 for(const behavior of [{hang:true},{malformed:true}]){const f=demoSocket(behavior);const s=new CodexUsageService({now:()=>now,connection:()=>new CodexConnection({connect:f.connect,verify:async()=>{},timeoutMs:10})});assert.equal((await s.snapshot()).status,'unavailable');assert.equal(f.socket.destroyed,true);}
 const f=demoSocket({hang:true}),abort=new AbortController(),s=new CodexUsageService({connection:()=>new CodexConnection({connect:f.connect,verify:async()=>{}})});const p=s.snapshot(abort.signal);await new Promise(r=>setImmediate(r));abort.abort();assert.match((await p).reason,/canceled/);assert.equal(f.socket.destroyed,true);
 let time=now,good=true,calls=0;const last=new CodexUsageService({now:()=>time,connection:()=>({open:async()=>{calls++;if(!good)throw Error('Demo offline');},initialize:async()=>{},request:async m=>m==='account/read'?{account:{}}:m==='account/rateLimits/read'?{rateLimits:rates()}:{},close(){}})});
 const first=await last.snapshot();good=false;time=first.nextRefresh;const stale=await last.snapshot();assert.equal(stale.status,'unavailable');assert.equal(stale.rates.primary.usedPercent,22);assert.equal(stale.observed_at,first.observed_at);await last.snapshot();assert.equal(calls,2);
});
test('Demo Codex endpoint preserves auth/Origin/Host/Fetch Metadata, rejects all parameters/methods and cancels disconnected reads',async t=>{
 let reads=0;const bridge=createBridge({codexUsage:{snapshot:async()=>{reads++;return snapshot();}}});const origin=await bridge.listen(0);t.after(()=>new Promise(r=>bridge.server.close(r)));const html=await(await fetch(origin)).text(),token=html.match(/name="bridge-token" content="([a-f0-9]+)"/)[1];const headers={'X-Bridge-Token':token,'Sec-Fetch-Site':'same-origin',Origin:origin};
 for(const change of [{'X-Bridge-Token':'bad'},{Origin:'https://evil.test'},{Origin:'null'},{'Sec-Fetch-Site':'same-site'},{'Sec-Fetch-Site':'cross-site'},{'Sec-Fetch-Site':'none'}])assert.equal((await fetch(origin+'/api/usage/codex',{headers:{...headers,...change}})).status,403);
 assert.equal(reads,0);assert.equal((await fetch(origin+'/api/usage/codex?method=account/logout',{headers})).status,400);assert.equal((await fetch(origin+'/api/usage/codex',{method:'POST',headers})).status,404);assert.equal(reads,0);
 const r=await fetch(origin+'/api/usage/codex',{headers});assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/connect-src 'self'/);assert.equal(reads,1);
 const source=makeCodexSource(token,async(url,o)=>{assert.equal(url,'/api/usage/codex');assert.equal(o.headers['X-Bridge-Token'],token);return {ok:true,text:async()=>JSON.stringify(snapshot())};});assert.equal((await source({})).rates.planType,'plus');
 await assert.rejects(makeCodexSource(null)({}),/bridge required/);
});

test('Demo open connection still refuses all non-read methods and parameter widening before writing',async()=>{
 const f=demoSocket(),c=new CodexConnection({connect:f.connect,verify:async()=>{}});await c.open();await c.initialize();const count=f.sent.length;const {methods}=JSON.parse(await readFile(new URL('../../docs/protocol/codex-0.160.0/methods.json',import.meta.url)));
 for(const method of methods.filter(m=>!READ_METHODS.includes(m)))assert.throws(()=>c.request(method,{}),/refused before dispatch/);
 assert.throws(()=>c.request('account/read',{refreshToken:true}),/refused/);assert.throws(()=>c.request('account/usage/read',{threadId:'Demo'}),/refused/);assert.equal(f.sent.length,count);c.close();
});
test('Demo endpoint Host/body refusal and real HTTP disconnect abort before further daemon reads',async t=>{
 const {request}=await import('node:http');let reads=0,aborted;const abortSeen=new Promise(r=>aborted=r);
 const bridge=createBridge({codexUsage:{snapshot:async signal=>{reads++;return new Promise(resolve=>signal.addEventListener('abort',()=>{aborted();resolve({status:'unavailable',reason:'Demo canceled'});}));}}});const origin=await bridge.listen(0);t.after(()=>new Promise(r=>bridge.server.close(r)));const token=(await(await fetch(origin)).text()).match(/name="bridge-token" content="([a-f0-9]+)"/)[1];const headers={'X-Bridge-Token':token,'Sec-Fetch-Site':'same-origin',Origin:origin};
 for(const change of [{Host:'evil.test'},{'Content-Length':'2'}]){
  const status=await new Promise((resolve,reject)=>{const req=request(origin+'/api/usage/codex',{headers:{...headers,...change}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end(change['Content-Length']?'{}':undefined);});assert.equal(status,change.Host?403:400);
 }
 assert.equal(reads,0);const req=request(origin+'/api/usage/codex',{headers});req.on('error',()=>{});req.end();while(reads===0)await new Promise(r=>setImmediate(r));req.destroy();await abortSeen;assert.equal(reads,1);
});

test('Demo token buckets validate real dates and numbers; unknown cost cannot become zero',()=>{
 for(const b of [{startDate:'2026-02-30',tokens:12},{startDate:'2026-10-06',tokens:null},{startDate:'2026-10-06',tokens:Number.MAX_SAFE_INTEGER+1}])assert.equal(sanitizeTokenUsage({dailyUsageBuckets:[b]}).dailyUsageBuckets,null);
 assert.equal(sanitizeTokenUsage({}).estimatedUsageUsdMicros,null);assert.equal(sanitizeTokenUsage({dailyUsageBuckets:[]}).dailyUsageBuckets.length,0);
 const r=sanitizeTokenUsage({dailyUsageBuckets:[{startDate:'2026-10-06',tokens:2},{startDate:'2026-10-05',tokens:1}]});assert.equal(r.dailyUsageBuckets.at(-1).startDate,'2026-10-06');
});
test('Demo browser source unavailable/unauthorized/oversized/malformed states remain observed failures',async()=>{
 for(const status of [403,404])await assert.rejects(makeCodexSource('Demo',async()=>({ok:false,status}))({}),e=>e.kind===(status===403?'auth':'unavailable'));
 for(const text of ['{bad','x'.repeat(65537)])await assert.rejects(makeCodexSource('Demo',async()=>({ok:true,text:async()=>text}))({}),e=>e.kind==='malformed');
 await assert.rejects(makeCodexSource('Demo',async()=>({ok:true,text:async()=>JSON.stringify({status:'unavailable',reason:'Demo daemon unavailable'})}))({}),/Demo daemon unavailable/);
});
