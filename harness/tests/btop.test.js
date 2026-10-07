import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import WebSocket from 'ws';
import {createBridge} from '../../bridge/server.mjs';
import {validSize} from '../../bridge/btop.mjs';
import {readConfig} from '../registry.js';

async function fixture(t,spawn){
  const bridge=createBridge({btopSpawn:spawn});const origin=await bridge.listen(0);
  t.after(()=>{bridge.btop.dispose();return new Promise(r=>bridge.server.close(r));});
  const token=(await(await fetch(origin)).text()).match(/name="bridge-token" content="([a-f0-9]+)"/)[1];
  const connect=(options={})=>new WebSocket(origin.replace('http:','ws:')+(options.path||'/api/btop'),options.protocols||['harness-btop',token],{origin:options.origin||origin});
  return {connect};
}
function next(ws){return once(ws,'message').then(([data])=>JSON.parse(data.toString()));}
const size={cols:120,rows:40};
test('BTOP refuses missing/wrong token, cross-origin and arbitrary routes before spawning',async t=>{
  let calls=0;const {connect}=await fixture(t,()=>{calls++;});
  for(const options of [{protocols:['harness-btop']},{protocols:['harness-btop','bad']},{origin:'https://evil.example'},{path:'/api/btop?command=sh'},{protocols:['shell','bad']}]){
    const ws=connect(options);const error=await once(ws,'error');assert.match(error[0].message,/403/);
  }
  assert.equal(calls,0);
});
test('BTOP start/input/resize/exit and disconnect cleanup target only its PTY',async t=>{
  const calls=[];let onData,onExit,kills=0,killed;const stopped=new Promise(r=>killed=r);
  const child={pid:123,onData(fn){onData=fn;},onExit(fn){onExit=fn;},resize(...args){calls.push(['resize',...args]);},write(data){calls.push(['input',data]);},kill(){kills++;killed();}};
  const {connect}=await fixture(t,(...args)=>{calls.push(['spawn',...args]);return child;});
  const ws=connect();await once(ws,'open');let received=next(ws);ws.send(JSON.stringify({type:'start',...size}));assert.deepEqual(await received,{type:'started',pid:123});
  received=next(ws);onData('\x1b[32mCPU');assert.deepEqual(await received,{type:'data',data:'\x1b[32mCPU'});
  ws.send(JSON.stringify({type:'resize',cols:90,rows:30}));ws.send(JSON.stringify({type:'input',data:'m'}));
  // A data round trip also orders the preceding frames, avoiding timer assertions.
  const closed=once(ws,'close');ws.send(JSON.stringify({type:'input',data:'q',command:'sh'}));await closed;await stopped;
  assert.deepEqual(calls,[['spawn',120,40],['resize',90,30],['input','m']]);assert.equal(kills,1);
  const second=connect();await once(second,'open');received=next(second);second.send(JSON.stringify({type:'start',...size}));await received;
  const exited=next(second);const ended=once(second,'close');onExit({exitCode:0});assert.deepEqual(await exited,{type:'exit',exitCode:0});await ended;assert.equal(kills,1);
});
test('BTOP rejects oversized/invalid geometry and command fields without launching',async t=>{
  let calls=0;const {connect}=await fixture(t,()=>{calls++;});
  for(const input of [{type:'start',cols:0,rows:40},{type:'start',cols:120,rows:1000},{type:'start',...size,command:'bash'},null]){
    const ws=connect();await once(ws,'open');const closed=once(ws,'close');ws.send(JSON.stringify(input));assert.equal((await closed)[0],1008);
  }
  assert.equal(calls,0);assert.equal(validSize(size),true);assert.equal(validSize({cols:1.5,rows:20}),false);
  assert.equal(readConfig({getItem:()=>JSON.stringify({version:1,layout:'btop'})}).layout,'btop');
});
test('disconnect while PTY startup is pending kills the eventual child',async t=>{
  let resolve,started,kills=0,killed;const began=new Promise(r=>started=r),stopped=new Promise(r=>killed=r);
  const {connect}=await fixture(t,()=>{started();return new Promise(r=>resolve=r);});
  const ws=connect();await once(ws,'open');ws.send(JSON.stringify({type:'start',...size}));await began;
  const closed=once(ws,'close');ws.close();await closed;
  resolve({onData(){},onExit(){},kill(){kills++;killed();}});await stopped;assert.equal(kills,1);
});
