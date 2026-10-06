const unknown=id=>({id,status:'unknown',running:null,pids:null,processes:[],observedAt:null,reason:'Local bridge unavailable; browser cannot observe processes',focus:{status:'unknown',value:null,reason:'No reliable focus observation'}});
export function normalizeBridgeState(payload,ids,now=Date.now()){
  if(!payload||!Array.isArray(payload.tools))return null;
  const tools=ids.map(id=>{
    const matches=payload.tools.filter(t=>t?.id===id),t=matches[0];
    const stamp=Date.parse(t?.observedAt);
    if(matches.length!==1||t.status!=='observed'||typeof t.running!=='boolean'||!Number.isFinite(stamp)||stamp>now+1000||now-stamp>15000||!Array.isArray(t.pids)||!Array.isArray(t.processes)||t.pids.length!==t.processes.length||t.running&&t.pids.length===0||!t.processes.every((p,i)=>Number.isSafeInteger(p.pid)&&p.pid>0&&p.pid===t.pids[i]&&typeof p.cpuPercent==='number'&&Number.isFinite(p.cpuPercent)&&p.cpuPercent>=0&&typeof p.stat==='string')||t.running!==t.processes.some(p=>!p.stat.startsWith('Z')))return {...unknown(id),reason:t?.status==='unknown'&&typeof t.reason==='string'?t.reason:'Bridge observation missing, malformed or expired'};
    // Focus is deliberately never upgraded by process presence or a response flag.
    return {...t,focus:{status:'unknown',value:null,reason:'ps does not establish frontmost/focused application'}};
  });
  const routes=ids.map(id=>{
    const rows=Array.isArray(payload.routes)?payload.routes.filter(r=>r?.id===id):[],r=rows[0];
    const e=r?.evidence;
    return rows.length===1&&r.verification==='verified-dispatch-and-running'&&Number.isFinite(Date.parse(e?.dispatchAt))&&Number.isFinite(Date.parse(e?.observedAt))?{id,verification:r.verification,evidence:e}:{id,verification:'unverified',evidence:null};
  });
  return {tools,routes};
}
export class LauncherBridge{
  constructor({token,ids,fetcher=(...args)=>fetch(...args),now=Date.now}={}){this.token=token;this.ids=ids;this.fetcher=fetcher;this.now=now;this.snapshot=null;this.error='Local bridge unavailable';this.pending=null;this.aborters=new Set();this.disposed=false;}
  async request(url,options={}){
    const abort=new AbortController();this.aborters.add(abort);let timer;
    try{
      const response=await Promise.race([
        this.fetcher(url,{...options,cache:'no-store',credentials:'omit',signal:abort.signal,headers:{'X-Bridge-Token':this.token,...options.headers}}),
        new Promise((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(new Error('Bridge timed out'));},6000);})
      ]);
      if(!response.ok)throw new Error(`Bridge refused/unavailable (${response.status})`);
      return await response.json();
    }finally{clearTimeout(timer);this.aborters.delete(abort);}
  }
  async refresh(){
    if(this.disposed)return null;if(this.pending)return this.pending;
    if(!this.token){this.snapshot=null;return null;}
    this.pending=(async()=>{try{
      const normalized=normalizeBridgeState(await this.request('/api/state'),this.ids,this.now());
      if(!normalized)throw new Error('Invalid bridge response');
      if(!this.disposed){this.snapshot=normalized;this.error='';}return normalized;
    }catch{if(!this.disposed){this.snapshot=null;this.error='Local bridge unavailable or refused; state UNKNOWN';}return null;}finally{this.pending=null;}})();
    return this.pending;
  }
  async open(id){
    if(this.disposed||!this.token||!this.ids.includes(id))return {error:'Bridge unavailable or destination unknown'};
    try{
      const result=await this.request('/api/open',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:id})});
      if(result.id!==id||!['dispatched','failed'].includes(result.dispatch?.status)||!Number.isFinite(Date.parse(result.dispatch.at)))throw new Error('Invalid dispatch result');
      const data=normalizeBridgeState({tools:[result.observation]},[id],this.now());
      return {dispatch:result.dispatch,observation:data.tools[0],verification:result.verification};
    }catch{this.snapshot=null;this.error='Bridge activation unavailable/refused; outcome UNKNOWN';return {error:this.error};}
  }
  dispose(){this.disposed=true;for(const abort of this.aborters)abort.abort();this.aborters.clear();this.snapshot=null;}
}
