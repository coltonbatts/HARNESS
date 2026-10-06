import {LauncherController,routeFor,processState} from './launcher-core.js';
export const launcherModule={
  id:'launcher',version:1,title:'Launcher',capabilities:['filter','keyboard-select','request-url','report-outcome'],
  availability:'url-verified-native-unverified',configuration:{installedRecordDate:'2026-10-06',nativeSchemes:['cursor','claude','hermes'],atlasTarget:'https://chatgpt.com/'},
  authority:'Trusted user-initiated anchor navigation only; no native helper, process observation, app control or automatic retry',
  errors:['missing-app-record','unknown-scheme','browser-blocked','unhandled-or-missing','outcome-unknown'],
  mount(root){
    root.innerHTML=`<div class="tbar"><span class="tab on">launch</span><span class="rt">PROCESS STATE UNKNOWN</span></div><div class="pbody"><div class="filter"><label for="launcher-filter"># filter</label><input id="launcher-filter" placeholder="tool / scheme" autocomplete="off"><span>▸ select ◂</span></div><div class="launcher-table-head"><span>PID</span><span>PROGRAM</span><span>STATE</span><span>CPU</span></div><div id="launcher-list" role="list" aria-label="Tool destinations"></div><div id="launcher-info" class="src"></div><div class="launcher-feedback" role="status" aria-live="polite" id="launcher-feedback">Select a route. Browser dispatch is not proof of app activation.</div><div class="launcher-reports" aria-label="Report selected route outcome"><span class="src">After trying, report:</span><button data-result="opened">[ opened ]</button><button data-result="blocked">[ blocked ]</button><button data-result="not-handled">[ nothing opened ]</button></div><div class="pfoot"><span><b>↑↓ select</b> · Enter focuses link</span><span id="launcher-count" class="c"></span></div></div>`;
    const find=id=>root.querySelector(`#${id}`),controller=new LauncherController();let disposed=false;
    function render(){
      if(disposed)return;
      const list=find('launcher-list');list.replaceChildren();
      for(const tool of controller.rows){
        const state=processState(),route=routeFor(tool),selected=tool.id===controller.selectedId;
        const row=document.createElement('div');row.className='launcher-row'+(selected?' sel':'');row.setAttribute('role','listitem');
        const pid=document.createElement('span');pid.className='pid';pid.textContent=state.pid;
        const link=document.createElement('a');link.textContent=tool.name;link.setAttribute('aria-label',`${tool.kind==='url-target'?'Open URL for':'Request app link for'} ${tool.name} · ${tool.verification}`);
        if(route.available){link.href=route.url;link.target='_blank';link.rel='noopener noreferrer';}else{link.setAttribute('aria-disabled','true');link.tabIndex=-1;}
        link.dataset.tool=tool.id;link.setAttribute('aria-current',selected?'true':'false');
        link.addEventListener('focus',()=>{controller.selectedId=tool.id;details();for(const el of list.children)el.classList.toggle('sel',el.querySelector('a').dataset.tool===tool.id);});
        link.addEventListener('click',event=>{
          controller.selectedId=tool.id;
          const outcome=controller.activate(tool.id,{userInitiated:event.isTrusted});
          if(!outcome.dispatch)event.preventDefault();
          find('launcher-feedback').textContent=outcome.message;
          details();
          // The anchor's default action performs navigation. No JS app invocation.
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
      find('launcher-info').textContent=`${tool.bundleId} · ${tool.version}\nInstalled record 06 Oct 2026 · route ${tool.verification}\n${route.url||route.reason}\n${tool.kind==='url-target'?'URL target · does not select or activate Atlas':'External scheme · handler/focus outcome unverified'}\nPID/STATE/CPU UNKNOWN: browser cannot observe processes\n${outcome?`${outcome.source}: ${outcome.message}`:'No activation outcome observed'}`;
      for(const button of root.querySelectorAll('[data-result]'))button.disabled=!controller.lastAttempts.has(tool.id);
    }
    function navigate(event){
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){
        event.preventDefault();controller.select(event.key);render();
        if(event.currentTarget.tagName==='A')find('launcher-list').querySelector(`[data-tool="${controller.selectedId}"]`)?.focus();
      }else if(event.key==='Enter'&&event.currentTarget.tagName==='INPUT'){
        event.preventDefault();find('launcher-list').querySelector(`[data-tool="${controller.selectedId}"]`)?.focus();
      }
    }
    find('launcher-filter').oninput=event=>{controller.filter(event.target.value);render();};
    find('launcher-filter').onkeydown=navigate;
    for(const button of root.querySelectorAll('[data-result]'))button.onclick=()=>{controller.report(controller.selectedId,button.dataset.result);details();find('launcher-feedback').textContent=controller.outcomes.get(controller.selectedId)?.message||'Try the route before reporting its outcome';};
    render();
    return {submit(){},dispose(){disposed=true;root.replaceChildren();}};
  }
};
