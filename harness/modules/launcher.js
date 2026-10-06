import {LauncherBridge} from './launcher-bridge.js';
import {LauncherController,routeFor,processState} from './launcher-core.js';
export const launcherModule={
  id:'launcher',version:1,title:'Launcher',capabilities:['filter','keyboard-select','request-url','report-outcome','read-local-processes','allowlisted-native-dispatch'],
  availability:'local-bridge-or-browser-fallback',configuration:{installedRecordDate:'2026-10-06',nativeSchemes:['cursor','claude','hermes'],atlasTarget:'https://chatgpt.com/',bridgeOrigin:'same-origin',pollMs:5000,requestTimeoutMs:6000},
  authority:'Trusted user activation only; same-origin token-protected bridge reads ps and dispatches fixed destinations; browser fallback requests URL; no shell, focus claim or automatic retry',
  errors:['missing-app-record','unknown-scheme','browser-blocked','unhandled-or-missing','outcome-unknown','bridge-unreachable-or-refused','observation-unknown','activation-failed'],
  mount(root){
    root.innerHTML=`<div class="tbar"><span class="tab on">launch</span><span class="rt">BRIDGE / UNKNOWN</span></div><div class="pbody"><div class="filter"><label for="launcher-filter"># filter</label><input id="launcher-filter" placeholder="tool / scheme" autocomplete="off"><span>▸ select ◂</span></div><div class="launcher-table-head"><span>PID</span><span>PROGRAM</span><span>STATE</span><span>CPU</span></div><div id="launcher-list" role="list" aria-label="Tool destinations"></div><div id="launcher-info" class="src"></div><div class="launcher-feedback" role="status" aria-live="polite" id="launcher-feedback">Select a route. Browser dispatch is not proof of app activation.</div><div class="launcher-reports" aria-label="Report selected route outcome"><span class="src">After trying, report:</span><button data-result="opened">[ opened ]</button><button data-result="blocked">[ blocked ]</button><button data-result="not-handled">[ nothing opened ]</button></div><div class="pfoot"><span><b>↑↓ select</b> · Enter focuses link</span><span id="launcher-count" class="c"></span></div></div>`;
    const find=id=>root.querySelector(`#${id}`),controller=new LauncherController();let disposed=false,poll;
    const bridge=new LauncherBridge({token:document.querySelector('meta[name=bridge-token]')?.content,ids:controller.list.map(t=>t.id)});
    const receipts=new Map();
    const time=value=>value?new Date(value).toLocaleString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false})+' CT':'UNKNOWN';
    function render(){
      if(disposed)return;
      root.querySelector('.tbar .rt').textContent=bridge.snapshot?.tools.some(t=>t.status==='observed')?'OBSERVED · FOCUS UNKNOWN':'PROCESS STATE UNKNOWN';
      const list=find('launcher-list');list.replaceChildren();
      for(const tool of controller.rows){
        const observed=bridge.snapshot?.tools.find(t=>t.id===tool.id);
        const state=observed?.status==='observed'?{pid:observed.pids.length?observed.pids.join(','):'—',state:observed.running?'run':observed.pids.length?'zombie':'absent',cpu:observed.processes.length?observed.processes.map(p=>p.cpuPercent+'%').join(','):'UNKNOWN'}:processState(),route=routeFor(tool),selected=tool.id===controller.selectedId;
        const row=document.createElement('div');row.className='launcher-row'+(selected?' sel':'');row.setAttribute('role','listitem');
        const pid=document.createElement('span');pid.className='pid';pid.textContent=state.pid;
        const link=document.createElement(bridge.token?'button':'a');if(bridge.token)link.type='button';link.textContent=tool.name;link.setAttribute('aria-label',`${bridge.token?'Activate via local bridge:':tool.kind==='url-target'?'Open URL for':'Request app link for'} ${tool.name}`);
        if(route.available){if(!bridge.token){link.href=route.url;link.target='_blank';link.rel='noopener noreferrer';}}else{link.setAttribute('aria-disabled','true');link.tabIndex=-1;}
        link.dataset.tool=tool.id;link.setAttribute('aria-current',selected?'true':'false');
        link.addEventListener('focus',()=>{controller.selectedId=tool.id;details();for(const el of list.children)el.classList.toggle('sel',el.querySelector('[data-tool]').dataset.tool===tool.id);});
        link.addEventListener('click',async event=>{
          controller.selectedId=tool.id;
          const outcome=controller.activate(tool.id,{userInitiated:event.isTrusted});
          if(!outcome.dispatch||bridge.token)event.preventDefault();
          if(outcome.dispatch&&bridge.token)controller.outcomes.set(tool.id,{status:'unknown',source:'bridge-request',message:'Native dispatch requested; awaiting independent process observation',at:Date.now()});
          find('launcher-feedback').textContent=bridge.token&&outcome.dispatch?'Native dispatch requested; awaiting observation':outcome.message;
          details();
          if(outcome.dispatch&&bridge.token){
            const result=await bridge.open(tool.id);if(disposed)return;receipts.set(tool.id,result);
            if(controller.outcomes.get(tool.id)?.source!=='user-report')controller.outcomes.set(tool.id,{status:'unknown',source:'bridge-response',message:result.error||`${result.dispatch.status}; running ${result.observation.running===null?'UNKNOWN':result.observation.running?'observed':'not observed'}; focus UNKNOWN`});
            find('launcher-feedback').textContent=result.error||`${result.dispatch.status} ${time(result.dispatch.at)} · ${result.observation.status==='observed'?(result.observation.running?'observed running':'observed absent'):'running UNKNOWN'} ${time(result.observation.observedAt)} · focus UNKNOWN`;
            await refresh();
          }
          // Without a bridge token, only the anchor's default URL navigation runs.
        });
        link.addEventListener('keydown',event=>navigate(event));
        const st=document.createElement('span');st.textContent=state.state;
        const cpu=document.createElement('span');cpu.textContent=state.cpu;
        row.append(pid,link,st,cpu);list.append(row);
      }
      if(!controller.rows.length){const empty=document.createElement('div');empty.className='src';empty.textContent='No matching tools';list.append(empty);}
      find('launcher-count').textContent=`${controller.rows.length} / ${controller.list.length}`;details();
    }
    function details(){
      const tool=controller.list.find(tool=>tool.id===controller.selectedId);
      if(!tool){find('launcher-info').textContent='No selection';for(const button of root.querySelectorAll('[data-result]'))button.disabled=true;return;}
      const route=routeFor(tool),outcome=controller.outcomes.get(tool.id);
      const sample=bridge.snapshot?.tools.find(t=>t.id===tool.id),evidence=bridge.snapshot?.routes.find(r=>r.id===tool.id),receipt=receipts.get(tool.id);
      const measured=sample?.status==='observed'?`OBSERVED ${time(sample.observedAt)} · ${sample.reason}`:`UNKNOWN: ${bridge.error||sample?.reason||'browser cannot observe processes'}`;
      find('launcher-info').textContent=`${tool.bundleId} · ${tool.version}\n${bridge.token?'Native bridge route':'Browser route'} · ${bridge.token?(evidence?.verification||'unverified'):tool.verification}\n${bridge.token?(tool.id==='atlas'?'https://chatgpt.com/ in Atlas via fixed open argv':'fixed open -a app path'):route.url||route.reason}\n${measured}\nFOCUS UNKNOWN: ps cannot establish frontmost application\nrun ≠ connected; CPU is ps main-process % only\n${evidence?.evidence?`dispatch ${time(evidence.evidence.dispatchAt)} / running observed ${time(evidence.evidence.observedAt)}`:'No verified native dispatch evidence this run'}\n${receipt?receipt.error||`${receipt.dispatch.status}${receipt.dispatch.exitCode!==null&&receipt.dispatch.exitCode!==undefined?' (exit '+receipt.dispatch.exitCode+')':''} ${time(receipt.dispatch.at)} / observation ${time(receipt.observation.observedAt)}`:''}\n${outcome?`${outcome.source}: ${outcome.message}`:'No activation requested'}`;
      for(const button of root.querySelectorAll('[data-result]'))button.disabled=!controller.lastAttempts.has(tool.id);
    }
    function navigate(event){
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();controller.select(event.key);render();
        if(['A','BUTTON'].includes(event.currentTarget.tagName))find('launcher-list').querySelector(`[data-tool="${controller.selectedId}"]`)?.focus();
      }else if(event.key==='Enter'&&event.currentTarget.tagName==='INPUT'){
        event.preventDefault();find('launcher-list').querySelector(`[data-tool="${controller.selectedId}"]`)?.focus();
      }
    }
    find('launcher-filter').oninput=event=>{controller.filter(event.target.value);render();};
    find('launcher-filter').onkeydown=navigate;
    for(const button of root.querySelectorAll('[data-result]'))button.onclick=()=>{controller.report(controller.selectedId,button.dataset.result);if(bridge.token){const outcome=controller.outcomes.get(controller.selectedId);if(outcome)outcome.message='User reports '+(button.dataset.result==='opened'?'destination opened':button.dataset.result==='blocked'?'activation blocked':'nothing opened')+'; independent bridge measurement unchanged';}details();find('launcher-feedback').textContent=controller.outcomes.get(controller.selectedId)?.message||'Try the route before reporting its outcome';};
    async function refresh(){await bridge.refresh();if(!disposed){const active=document.activeElement?.dataset?.tool;render();if(active)find('launcher-list').querySelector(`[data-tool="${active}"]`)?.focus();}}
    render();refresh();if(bridge.token)poll=setInterval(refresh,5000);
    return {submit(){},dispose(){disposed=true;clearInterval(poll);bridge.dispose();root.replaceChildren();}};
  }
};
