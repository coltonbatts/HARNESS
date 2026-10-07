import {UsageController,SourceError,parseTime} from './usage-core.js';
const source='codex-app-server';
const plans=['free','go','plus','pro','prolite','promax','team','self_serve_business_prolite','self_serve_business_usage_based','business','ent26','enterprise_cbp_automation','enterprise_cbp_usage_based','enterprise','edu','edu_plus','edu_pro','unknown'];
export function codexUnknown(window){return {provider:'OpenAI',account:'local-codex-subscription',product:'Codex subscription',window,unit:'percent',used:null,remaining:null,window_start:null,window_end:null,resets_at:null,observed_at:null,source_method:source,confidence:'unavailable',status:'unavailable',reason:'No local daemon reading',duration:null,plan:null};}
export function normalizeCodex(snapshot,now=Date.now()){
 if(snapshot?.schema!==1||snapshot.source!==source||snapshot.status!=='available')throw Error('Codex snapshot unavailable or malformed');
 const stamp=parseTime(snapshot.observed_at);if(stamp===null||stamp>now+5000)throw Error('Invalid Codex observation');
 return ['primary','secondary'].map(window=>{
  const w=snapshot.rates?.[window],duration=w?.windowDurationMins,used=w?.usedPercent,reset=w?.resetsAt;
  const validDuration=Number.isSafeInteger(duration)&&duration>0&&duration<=525600;
  const validUsed=typeof used==='number'&&Number.isFinite(used)&&used>=0&&used<=100;
  const validReset=Number.isSafeInteger(reset)&&reset*1000>stamp&&reset*1000<=stamp+(validDuration?duration*60000:0)+300000;
  const valid=validDuration&&validUsed&&validReset;
  return {...codexUnknown(window),used:valid?used:null,remaining:valid?100-used:null,duration:validDuration?duration:null,plan:plans.includes(snapshot.rates?.planType)?snapshot.rates.planType:null,resets_at:validReset?new Date(reset*1000).toISOString():null,window_end:validReset?new Date(reset*1000).toISOString():null,observed_at:new Date(stamp).toISOString(),status:valid?'available':'unavailable',confidence:valid?'authoritative to daemon':'unavailable',reason:valid?'':w?'Window percentage/duration/reset absent or invalid':'Window absent from daemon'};
 });
}
export function encodeCodexCache(rows){return {schema:1,observations:rows.filter(r=>r.remaining!==null).map(r=>({window:r.window,observed_at:r.observed_at,used:r.used,duration:r.duration,resets_at:r.resets_at,plan:r.plan}))};}
export function decodeCodexCache(cache,now=Date.now()){
 let rows=['primary','secondary'].map(codexUnknown);
 if(cache?.schema!==1||!Array.isArray(cache.observations)||cache.observations.length>2)return rows;
 for(const o of cache.observations){if(!['primary','secondary'].includes(o?.window))continue;try{
  const row=normalizeCodex({schema:1,source,status:'available',observed_at:o.observed_at,rates:{planType:o.plan,[o.window]:{usedPercent:o.used,windowDurationMins:o.duration,resetsAt:Date.parse(o.resets_at)/1000}}},now).find(r=>r.window===o.window);
  rows=rows.map(r=>r.window===row.window?{...row,status:row.remaining===null?'unavailable':'stale',reason:'Cached daemon reading; awaiting refresh'}:r);
 }catch{}}
 return rows;
}
export function makeCodexSource(token,fetcher=(...args)=>fetch(...args)){
 return async({signal})=>{
  if(!token){const e=new SourceError('unavailable');e.message='Codex unavailable: local bridge required';throw e;}
  let response;try{response=await fetcher('/api/usage/codex',{signal,cache:'no-store',credentials:'omit',headers:{'X-Bridge-Token':token}});}catch(e){if(e.name==='AbortError')throw e;throw new SourceError('offline');}
  if(!response.ok)throw new SourceError(response.status===403?'auth':'unavailable');
  const text=await response.text();if(text.length>65536)throw new SourceError('malformed');let data;try{data=JSON.parse(text);}catch{throw new SourceError('malformed');}
  if(data.status!=='available'){const e=new SourceError('unavailable',Math.min(300000,Math.max(0,(data.nextRefresh||0)-Date.now())));e.message=typeof data.reason==='string'&&data.reason.length<200?data.reason:'Codex daemon unavailable';throw e;}
  return data;
 };
}
export function createCodexController(options){return new UsageController({...options,timeoutMs:10000,pollIntervalMs:10000,normalize:normalizeCodex,initialRows:['primary','secondary'].map(codexUnknown),decode:decodeCodexCache});}
export function codexWindowLabel(row){return row.duration===300?'Codex · 5-hour':row.duration===10080?'Codex · weekly · 7-day':row.duration?`Codex · ${row.duration} min`:`Codex · ${row.window} · duration UNKNOWN`;}
