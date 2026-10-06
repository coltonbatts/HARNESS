import test from 'node:test';
import assert from 'node:assert/strict';
import {OllamaService,validateChat,ollamaRequest} from '../../bridge/ollama.mjs';
import {createBridge} from '../../bridge/server.mjs';
import {ChatController,bridgeRequest,listModels,stubSend} from '../modules/chat-core.js';

const model='phi3:mini';
const input={model,messages:[{role:'user',content:'What is 2 + 2? Reply with one short sentence.'}]};
const tags={models:[{name:model}]};
const demo=(result)=>new OllamaService({request:async endpoint=>endpoint==='/api/tags'?tags:result});

test('Demo fixed route refuses arbitrary options, URLs, tools, roles and oversized messages before transport',async()=>{
 for(const value of [null,{}, {...input,url:'http://evil'}, {...input,tools:[]}, {...input,model:'../?bad'}, {...input,messages:[]}, {...input,messages:[{role:'system',content:'x'}]}, {...input,messages:[{role:'user',content:'x',tool:'x'}]}, {...input,messages:[{role:'user',content:'x'.repeat(32001)}]}, {...input,messages:Array(200).fill(input.messages[0])}]) assert.throws(()=>validateChat(value));
 assert.deepEqual(validateChat(input),input);
 let calls=[];
 const service=new OllamaService({request:async(path,body,signal,timeout)=>{calls.push({path,body,timeout});return {models:[{name:'other'},{name:model,remote_host:'cloud'}]};}});
 await assert.rejects(()=>service.chat(input,new AbortController().signal),/missing.*remote-only/);
 assert.deepEqual(calls.map(c=>c.path),['/api/tags']);
});

test('Demo errors retain observed reason and reject incomplete/empty/mismatched output',async()=>{
 for(const result of [{}, {model,done:false,message:{role:'assistant',content:''}}, {model,done:true,message:{role:'assistant',content:'',thinking:''}}, {model:'other',done:true,message:{role:'assistant',content:''}}]) await assert.rejects(()=>demo(result).chat(input,new AbortController().signal),/UNKNOWN/);
 const failed=new OllamaService({request:async()=>{throw Error('Ollama HTTP 400: model does not support chat');}});
 await assert.rejects(()=>failed.chat(input,new AbortController().signal),/does not support chat/);
 await assert.rejects(()=>new OllamaService({request:async()=>({models:null})}).tags(new AbortController().signal),/models UNKNOWN/);
});

test('Demo authenticated single HTTP route rejects before contacting Ollama and preserves strict CSP',async(t)=>{
 let calls=0;
 const bridge=createBridge({ollama:{tags:async()=>{calls++;return {models:[]};},chat:async()=>{calls++;throw Error('Ollama HTTP 404: model missing');}}});
 const origin=await bridge.listen(0);t.after(()=>new Promise(r=>bridge.server.close(r)));
 const page=await fetch(origin);const html=await page.text();const token=html.match(/name="bridge-token" content="([a-f0-9]+)"/)[1];
 assert.equal(bridge.server.address().address,'127.0.0.1');assert.ok(page.headers.get('content-security-policy').includes("connect-src 'self'"));
 const headers={'Content-Type':'application/json',Origin:origin,'Sec-Fetch-Site':'same-origin','X-Bridge-Token':token};
 for(const override of [{'X-Bridge-Token':'bad'},{Origin:'null'},{Origin:'http://evil'},{'Sec-Fetch-Site':'same-site'},{'Sec-Fetch-Site':'cross-site'},{'Sec-Fetch-Site':'none'}])assert.equal((await fetch(origin+'/api/ollama',{method:'POST',headers:{...headers,...override},body:JSON.stringify(input)})).status,403);
 for(const field of ['Origin','Sec-Fetch-Site','X-Bridge-Token']){const missing={...headers};delete missing[field];assert.equal((await fetch(origin+'/api/ollama',{method:'POST',headers:missing,body:JSON.stringify(input)})).status,403);}
 for(const pathname of ['/api/ollama?url=http://evil','/api/ollama/chat'])assert.notEqual((await fetch(origin+pathname,{method:'POST',headers,body:JSON.stringify(input)})).status,200);
 assert.equal((await fetch(origin+'/api/ollama',{method:'POST',headers,body:JSON.stringify({...input,url:'evil'})})).status,400);
 assert.equal((await fetch(origin+'/api/ollama',{method:'POST',headers,body:'x'.repeat(200001)})).status,413);
 for(const override of [{'X-Bridge-Token':'bad'},{Origin:'null'},{'Sec-Fetch-Site':'cross-site'}])assert.equal((await fetch(origin+'/api/ollama',{headers:{...headers,...override}})).status,403);
 assert.equal(calls,0);
 assert.deepEqual(await (await fetch(origin+'/api/ollama',{headers})).json(),{models:[]});assert.equal(calls,1);
 const failed=await fetch(origin+'/api/ollama',{method:'POST',headers,body:JSON.stringify(input)});assert.equal(failed.status,502);assert.match((await failed.json()).error,/model missing/);assert.equal(calls,2);
});

test('Demo client discovery, offline, missing token, malformed reply, timeout and user cancel stay errors',async()=>{
 const signal=new AbortController().signal;
 assert.deepEqual(await listModels({token:'Demo',signal,fetcher:async()=>({ok:true,json:async()=>({models:[{name:model,local:true},{name:'remote',local:false}]})})}),[model]);
 await assert.rejects(()=>bridgeRequest({signal,fetcher:async()=>{throw Error('must not call');}}),/token unavailable/);
 await assert.rejects(()=>bridgeRequest({token:'Demo',signal,fetcher:async()=>{throw new TypeError('network offline');}}),/unreachable.*UNKNOWN/);
 await assert.rejects(()=>listModels({token:'Demo',signal,fetcher:async()=>({ok:true,json:async()=>({})})}),/models UNKNOWN/);
 const blocked=async(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));
 await assert.rejects(()=>bridgeRequest({token:'Demo',signal,timeoutMs:10,fetcher:blocked}),/timeout.*UNKNOWN/);
 const abort=new AbortController();const work=bridgeRequest({token:'Demo',signal:abort.signal,fetcher:blocked});abort.abort();await assert.rejects(()=>work,{name:'AbortError'});
});

test('Demo pending lock, actual cancel and failure never resend after backend switch or reload',async()=>{
 let calls=0;const chat=new ChatController({model,transport:args=>{calls++;return bridgeRequest({token:'Demo',signal:args.signal,fetcher:async(_,options)=>new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))))});}});
 const work=chat.send('one');assert.equal(await chat.send('duplicate'),false);assert.throws(()=>chat.selectModel('other'),/Cancel/);assert.throws(()=>chat.switchBackend('openrouter'),/Cancel/);chat.cancel();await work;
 assert.equal(chat.conversations.ollama[0].status,'canceled');assert.match(chat.conversations.ollama[0].receipt,/may already have processed/);assert.equal(chat.conversations.ollama[0].actualModel,null);assert.equal(calls,1);
 chat.switchBackend('openrouter');chat.transport=stubSend;await chat.send('router');assert.equal(chat.conversations.openrouter[0].receipt,'STUB receipt · OpenRouter: input handled locally. No provider contacted; no model output generated.');chat.switchBackend('ollama');assert.equal(chat.conversations.ollama.length,1);
 assert.equal(new ChatController().conversations.ollama.length,0);
 const failed=new ChatController({model,transport:async()=>{throw Error('Ollama HTTP 400: incapable');}});await failed.send('one');assert.equal(failed.pending,null);assert.equal(failed.conversations.ollama[0].status,'error');assert.match(failed.conversations.ollama[0].receipt,/incapable/);
});

test('Demo replay of captured REAL response verifies context, model provenance and isolation without inventing output',async()=>{
 const {readFile}=await import('node:fs/promises');
 const evidence=JSON.parse(await readFile(new URL('../../docs/evidence/ollama-roundtrip.json',import.meta.url),'utf8'));
 const calls=[];
 const service=new OllamaService({request:async(endpoint,body,signal,timeout)=>{
  calls.push({endpoint,body,timeout});
  return endpoint==='/api/tags'?tags:{done:true,model:evidence.result.model,message:{role:'assistant',content:evidence.result.content}};
 }});
 const transport=async args=>args.backend==='openrouter'?stubSend(args):service.chat({model:args.model,messages:args.messages},args.signal);
 const chat=new ChatController({model,transport});await chat.send(evidence.prompt);
 assert.equal(chat.conversations.ollama[0].status,'reply');assert.equal(chat.conversations.ollama[0].actualModel,model);assert.equal(chat.conversations.ollama[0].receipt,evidence.result.content);
 assert.deepEqual(calls.map(c=>c.endpoint),['/api/tags','/api/chat']);assert.equal(calls[1].body.stream,false);assert.equal(calls[1].timeout,120000);
 await chat.send('Repeat the answer.');assert.deepEqual(calls[3].body.messages,[...input.messages,{role:'assistant',content:evidence.result.content},{role:'user',content:'Repeat the answer.'}]);
 chat.transport=async()=>{throw Error('Demo connection refused');};await chat.send('failed input');
 chat.transport=transport;await chat.send('Manual new input.');assert.equal(calls.at(-1).body.messages.some(m=>m.content==='failed input'),false);
 chat.selectModel('other');chat.transport=async args=>{assert.deepEqual(args.messages,[{role:'user',content:'new model context'}]);throw Error('Demo missing model');};await chat.send('new model context');
 chat.switchBackend('openrouter');assert.equal(chat.conversations.openrouter.length,0);chat.switchBackend('ollama');assert.equal(chat.conversations.ollama.length,5);
});

test('Demo socket fixture proves fixed localhost target, error codes, response bounds, timeout and abort',async(t)=>{
 const http=await import('node:http');const {EventEmitter}=await import('node:events');
 const {readFile}=await import('node:fs/promises');const evidence=JSON.parse(await readFile(new URL('../../docs/evidence/ollama-roundtrip.json',import.meta.url),'utf8'));
 let options,ended,request,response,mode='success';
 t.mock.method(http.default,'request',(o,cb)=>{
  options=o;request=new EventEmitter();response=new EventEmitter();response.statusCode=200;
  request.destroy=error=>{request.emit('error',error);request.emit('close');};
  request.end=body=>{ended=body;queueMicrotask(()=>{
   if(mode==='blocked')return;
   if(mode==='refused')return request.destroy(Object.assign(Error('refused'),{code:'ECONNREFUSED'}));
   cb(response);
   if(mode==='large')return response.emit('data',Buffer.alloc(2*1024*1024+1));
   if(mode==='invalid')response.emit('data',Buffer.from('invalid'));
   else if(mode==='redirect'){response.statusCode=302;response.emit('data',Buffer.from('{}'));}
   else if(mode==='missing'){response.statusCode=404;response.emit('data',Buffer.from('{"error":"model missing"}'));}
   else response.emit('data',Buffer.from(JSON.stringify(evidence.result)));
   response.emit('end');request.emit('close');
  });};return request;
 });
 const signal=new AbortController().signal;
 assert.deepEqual(await ollamaRequest('/api/chat',{model,messages:input.messages,stream:false},signal,1000),evidence.result);
 assert.equal(options.hostname,'127.0.0.1');assert.equal(options.port,11434);assert.equal(options.path,'/api/chat');assert.equal(options.method,'POST');assert.equal(JSON.parse(ended).stream,false);
 for(const [scenario,pattern] of [['refused',/ECONNREFUSED/],['large',/exceeds/],['invalid',/invalid JSON/],['redirect',/HTTP 302/],['missing',/model missing/],['blocked',/timeout/]]){mode=scenario;await assert.rejects(()=>ollamaRequest('/api/tags',null,signal,10),pattern);}
 const abort=new AbortController();const pending=ollamaRequest('/api/chat',input,abort.signal,1000);abort.abort();await assert.rejects(()=>pending,{name:'AbortError'});
});

test('Demo HTTP disconnect aborts upstream rather than leaving a silent pending exchange',async(t)=>{
 let started,upstream;
 const ready=new Promise(r=>started=r);
 const bridge=createBridge({ollama:{chat:async(_,signal)=>{upstream=signal;started();return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Canceled','AbortError'))));}}});
 const origin=await bridge.listen(0);t.after(()=>new Promise(r=>bridge.server.close(r)));
 const html=await (await fetch(origin)).text();const token=html.match(/name="bridge-token" content="([a-f0-9]+)"/)[1];
 const abort=new AbortController();const pending=fetch(origin+'/api/ollama',{method:'POST',signal:abort.signal,headers:{Origin:origin,'Sec-Fetch-Site':'same-origin','X-Bridge-Token':token,'Content-Type':'application/json'},body:JSON.stringify(input)});
 await ready;const canceled=new Promise(r=>upstream.addEventListener('abort',r));abort.abort();await assert.rejects(()=>pending,{name:'AbortError'});await canceled;assert.equal(upstream.aborted,true);
});

test('Demo canceled late response remains canceled, history and context stay bounded',async()=>{
 const {readFile}=await import('node:fs/promises');const evidence=JSON.parse(await readFile(new URL('../../docs/evidence/ollama-roundtrip.json',import.meta.url),'utf8'));
 let finish;
 const chat=new ChatController({model,transport:()=>new Promise(r=>finish=r)});const work=chat.send('canceled input');chat.cancel();finish(evidence.result);await work;assert.equal(chat.conversations.ollama[0].status,'canceled');assert.equal(chat.conversations.ollama[0].actualModel,null);
 let count=0;chat.transport=async args=>{count++;assert.ok(args.messages.length<=199);assert.equal(args.messages.some(m=>m.content==='canceled input'),false);return evidence.result;};
 for(let i=0;i<105;i++)await chat.send(`Demo replay input ${i}`);
 assert.equal(count,105);assert.equal(chat.conversations.ollama.length,100);assert.equal(chat.conversations.ollama[0].text,'Demo replay input 5');
});

test('Demo Chat disposal aborts pending work and default Ollama cannot return a stub success',async()=>{
 let signal;
 const chat=new ChatController({model,transport:args=>{signal=args.signal;return new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(new DOMException('Canceled','AbortError'))));}});
 const pending=chat.send('dispose input');chat.dispose();await pending;assert.equal(signal.aborted,true);assert.equal(chat.pending,null);assert.equal(chat.conversations.ollama[0].status,'canceled');
 const unknown=new ChatController();await unknown.send('model not selected');assert.equal(unknown.conversations.ollama[0].status,'error');assert.match(unknown.conversations.ollama[0].receipt,/Model UNKNOWN/);
 const empty=new ChatController({model,transport:async()=>({type:'model-output',model,content:''})});await empty.send('empty invalid response');assert.equal(empty.conversations.ollama[0].status,'error');assert.equal(empty.conversations.ollama[0].actualModel,null);
});
