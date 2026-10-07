import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {stat} from 'node:fs/promises';
export const READ_METHODS=Object.freeze(['account/read','account/rateLimits/read','account/usage/read']);
export const READ_PARAMS=Object.freeze({'account/read':Object.freeze({refreshToken:false}),'account/rateLimits/read':Object.freeze({excludeResetCreditDetails:true}),'account/usage/read':Object.freeze({})});
export function assertRead(method,params=READ_PARAMS[method]){
 if(!READ_METHODS.includes(method)||!params||typeof params!=='object'||Array.isArray(params)||![Object.prototype,null].includes(Object.getPrototypeOf(params))||Object.keys(params).sort().join(',')!==Object.keys(READ_PARAMS[method]).sort().join(',')||Object.entries(READ_PARAMS[method]).some(([k,v])=>params[k]!==v))throw Error('Codex method/parameters refused before dispatch');
}
export const PLAN_TYPES=Object.freeze(['free','go','plus','pro','prolite','promax','team','self_serve_business_prolite','self_serve_business_usage_based','business','ent26','enterprise_cbp_automation','enterprise_cbp_usage_based','enterprise','edu','edu_plus','edu_pro','unknown']);
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const day=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
export function sanitizeRateLimits(result){
 const multi=result?.rateLimitsByLimitId;
 const bucket=multi&&Object.keys(multi).length?multi.codex:result?.rateLimits;
 if(!bucket||typeof bucket!=='object')throw Error('Codex window bucket unavailable');
 const clean=w=>!w||typeof w!=='object'?null:{usedPercent:typeof w.usedPercent==='number'&&Number.isFinite(w.usedPercent)&&w.usedPercent>=0&&w.usedPercent<=100?w.usedPercent:null,windowDurationMins:integer(w.windowDurationMins)&&w.windowDurationMins>0&&w.windowDurationMins<=525600?w.windowDurationMins:null,resetsAt:integer(w.resetsAt)&&w.resetsAt>0&&w.resetsAt<=8640000000000?w.resetsAt:null};
 return {planType:PLAN_TYPES.includes(bucket.planType)?bucket.planType:null,primary:clean(bucket.primary),secondary:clean(bucket.secondary)};
}
export function sanitizeTokenUsage(result){
 const buckets=Array.isArray(result?.dailyUsageBuckets)?result.dailyUsageBuckets:null;
 return {dailyUsageBuckets:buckets&&buckets.length<=366&&buckets.every(b=>day(b?.startDate)&&integer(b.tokens))?buckets.map(b=>({startDate:b.startDate,tokens:b.tokens})).sort((a,b)=>a.startDate.localeCompare(b.startDate)):null,estimatedUsageUsdMicros:null,usdReason:'Account-wide USD estimate absent from pinned schema; thread-scoped reads forbidden'};
}
export function rpcReason(error){
 const code=Number.isSafeInteger(error?.code)?error.code:null;
 return code===-32601?'Older daemon: usage method unsupported (-32601)':code===-32602?'Daemon rejected pinned read parameters (-32602)':`Daemon account/usage read failed (${code??'UNKNOWN code'})`;
}
// RFC6455 client frames. Only fixed local daemon socket; no user-selected URL/path.
export function clientFrame(payload,opcode=1){
 const data=Buffer.from(payload),mask=randomBytes(4),size=data.length;
 if(size>65535)throw Error('Codex frame oversized');
 const head=Buffer.alloc(size<126?6:8);head[0]=0x80|opcode;head[1]=0x80|(size<126?size:126);if(size>=126)head.writeUInt16BE(size,2);mask.copy(head,head.length-4);
 const body=Buffer.from(data);for(let i=0;i<size;i++)body[i]^=mask[i%4];return Buffer.concat([head,body]);
}
export const SOCKET_PATH=path.join(os.homedir(),'.codex/app-server-control/app-server-control.sock');
export class CodexConnection{
 constructor({connect=()=>net.createConnection(SOCKET_PATH),verify=async()=>{const s=await stat(SOCKET_PATH);if(!s.isSocket()||s.uid!==process.getuid()||(s.mode&0o077))throw Error('Codex daemon socket ownership/permissions refused');},timeoutMs=8000,optOut=JSON.parse(readFileSync(new URL('./codex-notifications.json',import.meta.url),'utf8'))}={}){this.connect=connect;this.verify=verify;this.timeoutMs=timeoutMs;this.optOut=optOut;this.pending=new Map();this.id=0;this.changed=false;}
 async open(signal){
  if(signal?.aborted)throw Error('Codex refresh canceled');
  try{await this.verify();}catch(e){throw Error(e.code==='ENOENT'?'Codex daemon unavailable: local control socket absent':'Codex daemon socket unavailable or permissions refused');}
  return new Promise((resolve,reject)=>{
   this.rejectOpen=reject;this.abort=()=>this.fail('Codex refresh canceled');this.signal=signal;signal?.addEventListener('abort',this.abort,{once:true});
   this.timer=setTimeout(()=>this.fail('Codex daemon timed out'),this.timeoutMs);this.socket=this.connect();this.buffer=Buffer.alloc(0);this.bytes=0;this.upgraded=false;this.fragments=[];
   const key=randomBytes(16).toString('base64');this.accept=createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
   this.socket.on('error',()=>this.fail('Codex daemon unavailable: local connection failed'));this.socket.on('close',()=>{if(!this.closed)this.fail('Codex daemon connection closed');});
   this.socket.on('connect',()=>this.socket.write(`GET / HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`));
   this.socket.on('data',chunk=>{try{
    this.bytes+=chunk.length;if(this.bytes>262144)throw Error('Codex daemon response oversized');this.buffer=Buffer.concat([this.buffer,chunk]);
    if(!this.upgraded){const end=this.buffer.indexOf('\r\n\r\n');if(end<0)return;const head=this.buffer.subarray(0,end).toString();if(!/^HTTP\/1\.1 101\b/.test(head)||head.match(/^sec-websocket-accept:\s*(\S+)\s*$/im)?.[1]!==this.accept)throw Error('Codex daemon handshake refused');this.buffer=this.buffer.subarray(end+4);this.upgraded=true;this.rejectOpen=null;resolve();}
    this.frames();
   }catch(e){this.fail(e.message);}});
  });
 }
 frames(){
  while(this.buffer.length>=2){
   const b=this.buffer,fin=Boolean(b[0]&128),op=b[0]&15;let len=b[1]&127,offset=2;
   if(b[0]&112||b[1]&128)throw Error('Codex daemon framing invalid');
   if(len===126){if(b.length<4)return;len=b.readUInt16BE(2);offset=4;}else if(len===127){if(b.length<10)return;const n=b.readBigUInt64BE(2);if(n>262144n)throw Error('Codex daemon frame oversized');len=Number(n);offset=10;}
   if(len>262144)throw Error('Codex daemon frame oversized');if(b.length<offset+len)return;const data=b.subarray(offset,offset+len);this.buffer=b.subarray(offset+len);
   if(op>=8){if(!fin||len>125)throw Error('Codex daemon control frame invalid');if(op===8)throw Error('Codex daemon connection closed');if(op===9)this.socket.write(clientFrame(data,10));else if(op!==10)throw Error('Codex daemon framing invalid');continue;}
   if(op===1){if(this.fragments.length)throw Error('Codex daemon framing invalid');this.fragments=[data];}else if(op===0&&this.fragments.length)this.fragments.push(data);else throw Error('Codex daemon framing invalid');
   if(fin){const raw=Buffer.concat(this.fragments).toString('utf8');this.fragments=[];let m;try{m=JSON.parse(raw);}catch{throw Error('Codex daemon JSON malformed');}
    if(m.method){if(m.method==='account/rateLimits/updated'&&!Object.hasOwn(m,'id'))this.changed=true;continue;}
    const request=this.pending.get(m.id);if(!request)continue;this.pending.delete(m.id);m.error?request.reject(Error(rpcReason(m.error))):request.resolve(m.result);
   }
  }
 }
 #send(frame){if(this.closed)throw Error('Codex daemon connection closed');this.socket.write(clientFrame(JSON.stringify(frame)));}
 request(method,params){assertRead(method,params);return this.#internalRequest(method,READ_PARAMS[method]);}
 #internalRequest(method,params){return new Promise((resolve,reject)=>{const id=++this.id;this.pending.set(id,{resolve,reject});try{this.#send({id,method,params});}catch(e){this.pending.delete(id);reject(e);}});}
 async initialize(){await this.#internalRequest('initialize',{clientInfo:{name:'harness_usage',title:'HARNESS subscription usage',version:'1.0.0'},capabilities:{experimentalApi:false,requestAttestation:false,optOutNotificationMethods:this.optOut}});this.#send({method:'initialized'});}
 fail(reason){const error=Error(reason);this.rejectOpen?.(error);this.rejectOpen=null;for(const p of this.pending.values())p.reject(error);this.pending.clear();this.close();}
 close(){this.closed=true;clearTimeout(this.timer);this.signal?.removeEventListener('abort',this.abort);this.socket?.destroy();}
}
export class CodexUsageService{
 constructor({connection=()=>new CodexConnection(),now=Date.now}={}){this.connection=connection;this.now=now;this.nextRefresh=0;this.failures=0;this.pending=null;this.last=null;}
 async snapshot(signal){
  if(this.pending)return this.pending;
  if(this.last&&this.now()<this.nextRefresh)return this.last;
  this.pending=(async()=>{
   const c=this.connection();
   try{
    await c.open(signal);await c.initialize();const account=await c.request('account/read',READ_PARAMS['account/read']);
    if(!account||!account.account)throw Error('Codex unavailable: daemon reports unauthenticated');
    const rates=sanitizeRateLimits(await c.request('account/rateLimits/read',READ_PARAMS['account/rateLimits/read']));
    let usage,usageReason='';try{usage=sanitizeTokenUsage(await c.request('account/usage/read',READ_PARAMS['account/usage/read']));}catch(e){usage=sanitizeTokenUsage(null);usageReason=e.message;}
    this.failures=0;this.nextRefresh=this.now()+10000;
    this.last={schema:1,source:'codex-app-server',scope:'account-wide Codex subscription',observed_at:new Date(this.now()).toISOString(),status:'available',rates,usage,usageReason,reason:'',nextRefresh:this.nextRefresh,notificationObserved:c.changed};
   }catch(e){this.failures++;this.nextRefresh=this.now()+Math.min(300000,30000*2**Math.min(this.failures-1,4));this.last={schema:1,source:'codex-app-server',scope:'account-wide Codex subscription',...this.last,status:'unavailable',reason:e.message,nextRefresh:this.nextRefresh};}
   finally{c.close();this.pending=null;}
   return this.last;
  })();return this.pending;
 }
}
