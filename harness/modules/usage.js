import {UsageController,makeLocalSource,freshness,chicagoTime,meter,encodeCache} from './usage-core.js';
export const usageModule = {
  id:'usage',version:1,title:'Claude subscription Usage',
  capabilities:['read-local-snapshot','refresh','cancel','open-usage-page'],
  availability:'local-statusline-awaiting-data',
  configuration:{provider:'Anthropic',product:'Claude subscription',windows:['five_hour','seven_day'],source:'data/claude-usage.json',pollIntervalMs:30_000,staleAfterMs:300_000},
  authority:'Read sanitized local statusline snapshot; browser-local last-good cache. No provider requests, credentials, account changes, sessions or commands.',
  errors:['unavailable','malformed','offline','auth','rate_limit','timeout','canceled'],
  mount(root) {
    root.innerHTML=`<div class="tbar"><button class="tab on" id="usage-tab" aria-pressed="true">usage</button><button class="tab" id="sources-tab" aria-pressed="false">sources</button><span class="rt" id="usage-coverage"></span></div><div class="pbody" id="usage-body"><div class="uhead"><span style="flex:1">CLAUDE SUBSCRIPTION · WINDOW</span><span>REMAINING</span></div><div id="usage-rows"></div><div class="notice" id="usage-status" role="status" aria-live="polite"></div><div class="usage-actions"><button id="usage-refresh">[ refresh local ]</button><button id="usage-cancel" hidden>[ cancel ]</button><a href="https://claude.ai/settings/usage" target="_blank" rel="noopener noreferrer">[ Claude usage ↗ ]</a></div><div class="src">UNKNOWN is not zero · account/plan not identified<br>Local capture only · freshness ≤5m · America/Chicago</div></div><div class="pbody" id="usage-sources" hidden><p class="src">Claude Code 2.1.287: installed statusline fields verified. Real account payload not yet observed. Project-local collector configured (runtime capture unverified); awaits Claude Code activity in this repo. No model request started to obtain usage.</p><p class="src">Reads only sanitized 5-hour/weekly fields from data/claude-usage.json. Missing windows stay UNKNOWN; last good readings survive failures as STALE. Refresh checks this local file, never a provider API.</p><p class="src">API organization billing does not expose consumer subscription capacity. No cookies, session credentials or undocumented endpoints are used.</p><p class="src">Plan/account identity and window starts remain UNKNOWN. Remaining = 100 − explicit used %. Local source reports are labeled authoritative to that interface, not a billing audit.</p></div>`;
    const find=id=>root.querySelector(`#${id}`);
    let storage,cached,storageFailed=false;
    try { storage=window.localStorage; cached=JSON.parse(storage.getItem('home-claude-usage-v1')); } catch {}
    const controller=new UsageController({source:makeLocalSource(),cached,save:rows=>{
      try { storage?.setItem('home-claude-usage-v1',JSON.stringify(encodeCache(rows))); if (!storage) storageFailed=true; }
      catch { storageFailed=true; }
    },onChange:render});
    function render() {
      if (controller.disposed) return;
      const now=Date.now(); const container=find('usage-rows');container.replaceChildren();
      for (const row of controller.rows) {
        const status=freshness(row,now);
        const line=document.createElement('div');line.className='usage-measurement';
        const head=document.createElement('div');head.className='urow';
        const label=document.createElement('span');label.className='lab';label.textContent=row.window==='five_hour'?'5-hour':'weekly · 7-day';
        const blocks=document.createElement('span');blocks.className='g '+(status==='stale'?'y':'k');blocks.textContent=meter(row.remaining) || '—';
        const value=document.createElement('span');value.className='usage-value '+(status==='stale'?'y':'k');value.textContent=row.remaining === null ? 'UNKNOWN' : `${Number(row.remaining.toFixed(1))}%`;
        head.append(label,blocks,value);
        const detail=document.createElement('div');detail.className='src';
        const age=row.observed_at ? Math.max(0,Math.floor((now-Date.parse(row.observed_at))/60000))+'m old' : 'age UNKNOWN';
        detail.textContent=row.remaining === null ? `UNAVAILABLE · ${row.reason}\nused / reset / start / end: UNKNOWN\nobserved ${chicagoTime(row.observed_at)}` : `${status==='stale'?'STALE':'LOCAL'} · ${row.confidence} · ${age} · used ${row.used}%\nreset/end ${chicagoTime(row.resets_at)} · start UNKNOWN\nobserved ${chicagoTime(row.observed_at)} · local statusline`;
        line.append(head,detail);container.append(line);
      }
      const fresh=controller.rows.filter(row=>freshness(row,now)==='available').length;
      find('usage-coverage').textContent=`${fresh}/2 fresh windows`;
      const wait=Math.max(0,Math.ceil((controller.nextRefresh-now)/1000));
      find('usage-refresh').disabled=Boolean(controller.pending)||wait>0;
      find('usage-cancel').hidden=!controller.pending;
      find('usage-status').textContent=(controller.pending ? 'Reading local capture…' : controller.error || 'Local statusline source')+(wait ? ` · next check ≥${wait}s` : '')+(storageFailed ? ' · cache unavailable' : '');
      const hasReading=controller.rows.some(row=>row.remaining !== null);
      find('usage-sources').querySelector('p').textContent=`Claude Code 2.1.287: installed statusline fields verified. ${hasReading?'A local capture has been read; account identity is unverified.':'Real account payload not yet observed.'} Project-local collector configured (runtime capture unverified); awaits Claude Code activity in this repo. No model request started to obtain usage.`;
    }
    function view(name) {
      find('usage-body').hidden=name!=='usage';find('usage-sources').hidden=name!=='sources';
      for (const tab of ['usage','sources']) {find(`${tab}-tab`).classList.toggle('on',tab===name);find(`${tab}-tab`).setAttribute('aria-pressed',String(tab===name));}
    }
    find('usage-tab').onclick=()=>view('usage'); find('sources-tab').onclick=()=>view('sources');
    find('usage-refresh').onclick=()=>controller.refresh();find('usage-cancel').onclick=()=>controller.cancel();
    render();controller.refresh();
    const timer=setInterval(()=>{ render(); if (Date.now()>=controller.nextRefresh) controller.refresh(); },1000);
    return {submit(){},dispose(){clearInterval(timer);controller.dispose();root.replaceChildren();}};
  }
};
