import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
export const destinations=Object.freeze([
  {id:'cursor',executable:'/Applications/Cursor.app/Contents/MacOS/Cursor',argv:['-a','/Applications/Cursor.app'],route:'open -a Cursor.app'},
  {id:'claude',executable:'/Applications/Claude.app/Contents/MacOS/Claude',argv:['-a','/Applications/Claude.app'],route:'open -a Claude.app'},
  {id:'atlas',executable:'/Applications/ChatGPT Atlas.app/Contents/MacOS/ChatGPT Atlas',argv:['-a','/Applications/ChatGPT Atlas.app','https://chatgpt.com/'],route:'ChatGPT URL in Atlas'},
  {id:'hermes',executable:'/Applications/Hermes.app/Contents/MacOS/Hermes',argv:['-a','/Applications/Hermes.app'],route:'open -a Hermes.app'}
].map(d=>Object.freeze({...d,argv:Object.freeze(d.argv)})));
const focus=()=>({status:'unknown',value:null,reason:'ps has no reliable frontmost application field; no UI scripting used'});
export function unknownState(id,reason,observedAt){return {id,status:'unknown',running:null,pids:null,processes:[],observedAt,reason,focus:focus()};}
export function parseProcessTable(text){
  if(typeof text!=='string'||!text.trim()) throw new Error('Empty process table');
  return text.trim().split('\n').map(line=>{
    const m=line.match(/^\s*(\d+)\s+(\S+)\s+(\d+(?:\.\d+)?)\s+(.+?)\s*$/);
    if(!m||Number(m[1])<=0||!Number.isSafeInteger(Number(m[1]))||!Number.isFinite(Number(m[3]))) throw new Error('Malformed process table');
    return {pid:Number(m[1]),stat:m[2],cpuPercent:Number(m[3]),executable:m[4]};
  });
}
export function normalizeState(rows,observedAt){
  return destinations.map(d=>{
    const matches=rows.filter(p=>p.executable===d.executable);
    return {id:d.id,status:'observed',observedAt,running:matches.some(p=>!p.stat.startsWith('Z')),pids:matches.map(p=>p.pid),processes:matches.map(({pid,stat,cpuPercent})=>({pid,stat,cpuPercent})),reason:matches.length?'Exact main executable match; running means non-zombie process present, not connected':'No exact main executable match in successful process snapshot',focus:focus()};
  });
}
export async function observeProcesses({execute=run,now=()=>new Date().toISOString()}={}){
  try{
    const {stdout}=await execute('/bin/ps',['-axo','pid=,stat=,%cpu=,comm=','-ww'],{shell:false,timeout:3000,maxBuffer:4*1024*1024,env:{PATH:'/usr/bin:/bin',LC_ALL:'C'}});
    const observedAt=now();return {observedAt,tools:normalizeState(parseProcessTable(stdout),observedAt)};
  }catch{return {observedAt:now(),tools:destinations.map(d=>unknownState(d.id,'Process observation failed or table malformed',now()))};}
}
export class BridgeService{
  constructor({execute=run,observe=()=>observeProcesses(),now=()=>new Date().toISOString(),clock=Date.now}={}){this.execute=execute;this.observe=observe;this.now=now;this.clock=clock;this.attempts=new Map();this.pending=new Set();this.evidence=new Map();this.statePending=null;}
  async state(){
    // Coalesce concurrent read requests; never overlap ps probes.
    if(!this.statePending)this.statePending=Promise.resolve().then(()=>this.observe()).finally(()=>{this.statePending=null;});
    const state=await this.statePending;
    return {...state,routes:destinations.map(d=>({id:d.id,route:d.route,verification:this.evidence.has(d.id)?'verified-dispatch-and-running':'unverified',evidence:this.evidence.get(d.id)||null}))};
  }
  async open(id){
    const d=destinations.find(d=>d.id===id);
    if(!d)return {httpStatus:400,error:'Destination not allowlisted'};
    const tick=this.clock(),last=this.attempts.get(id);
    if(this.pending.has(id)||(last!==undefined&&tick-last<1000))return {httpStatus:429,error:'Repeated activation held; no second dispatch'};
    this.attempts.set(id,tick);this.pending.add(id);
    try{
      let dispatch;
      try{
        await this.execute('/usr/bin/open',[...d.argv],{shell:false,timeout:5000,maxBuffer:16384});
        dispatch={status:'dispatched',at:this.now(),reason:'open exited 0; this alone does not prove activation or focus'};
      }catch(error){dispatch={status:'failed',at:this.now(),exitCode:typeof error.code==='number'?error.code:null,platformCode:String(error.stderr||'').match(/Code=(-?\d+)/)?.[1]||null,reason:'open failed or timed out; no activation success claimed'};}
      let snapshot;
      // Discard any probe started before dispatch; the outcome requires a fresh probe.
      if(this.statePending)await this.statePending;
      // Bounded observation after dispatch, never another launch or automatic retry.
      for(let probe=0;probe<3;probe++){
        snapshot=await this.state();
        if(dispatch.status!=='dispatched'||snapshot.tools.find(t=>t.id===id)?.running===true||probe===2)break;
        await new Promise(resolve=>setTimeout(resolve,250));
      }
      const observation=snapshot.tools.find(t=>t.id===id)||unknownState(id,'No observation returned',this.now());
      if(dispatch.status==='dispatched'&&observation.status==='observed'&&observation.running===true)this.evidence.set(id,{dispatchAt:dispatch.at,observedAt:observation.observedAt,pids:observation.pids,reason:'Dispatch completed and exact executable was subsequently present; existing instance vs newly launched and focus not distinguished'});
      return {httpStatus:200,id,route:d.route,dispatch,observation,verification:this.evidence.has(id)?'verified-dispatch-and-running':'unverified'};
    }finally{this.pending.delete(id);}
  }
}
