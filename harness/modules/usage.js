import {UsageController,makeLocalSource,freshness,chicagoTime,meter,encodeCache} from './usage-core.js';
import {createCodexController,makeCodexSource,encodeCodexCache,codexWindowLabel} from './codex-usage-core.js';
export const usageModule = {
  id:'usage',version:1,title:'Subscription Usage',
  capabilities:['read-local-snapshot','refresh','cancel','open-usage-page'],
  availability:'local-Claude-capture-and-Codex-daemon',
  configuration:{providers:['Anthropic','OpenAI'],products:['Claude subscription','Codex subscription'],windows:['five_hour','seven_day','primary','secondary'],sources:['data/claude-usage.json','/api/usage/codex'],pollIntervalMs:30_000,staleAfterMs:300_000},
  authority:'Read sanitized Claude capture and fixed read-only local Codex daemon account/usage protocol; browser-local last-good caches. No credential access, account changes, session reads or model calls.',
  errors:['unavailable','malformed','offline','auth','rate_limit','timeout','canceled'],
  mount(root) {
    root.innerHTML=`<div class="tbar"><button class="tab on" id="usage-tab" aria-pressed="true">usage</button><button class="tab" id="sources-tab" aria-pressed="false">sources</button><span class="rt" id="usage-coverage"></span></div><div class="pbody" id="usage-body"><div class="uhead"><span class="usage-heading-label">SUBSCRIPTIONS · WINDOW</span><span>REMAINING</span></div><div id="usage-rows"></div><div class="notice" id="usage-status" role="status" aria-live="polite"></div><div class="usage-actions"><button id="usage-refresh">[ refresh local ]</button><button id="usage-cancel" hidden>[ cancel ]</button><a href="https://claude.ai/settings/usage" target="_blank" rel="noopener noreferrer">[ Claude usage ↗ ]</a></div><div class="src">UNKNOWN is not zero · account identifiers omitted<br>Claude local capture + Codex local daemon · freshness ≤5m · America/Chicago</div></div><div class="pbody" id="usage-sources" hidden><p class="src">Claude Code 2.1.287: installed statusline fields verified. Real account payload not yet observed. Project-local collector configured (runtime capture unverified); awaits Claude Code activity in this repo. No model request started to obtain usage.</p><p class="src">Reads only sanitized 5-hour/weekly fields from data/claude-usage.json. Missing windows stay UNKNOWN; last good readings survive failures as STALE. Refresh checks this local file, never a provider API.</p><p class="src">API organization billing does not expose consumer subscription capacity. No cookies, session credentials or undocumented endpoints are used.</p><p class="src">Claude plan/account identity and all window starts remain UNKNOWN. Remaining = 100 − explicit used %. Local source reports are labeled authoritative to that interface, not a billing audit.</p></div>`;
    const find=id=>root.querySelector(`#${id}`);
    let storage,cached,storageFailed=false;
    try { storage=window.localStorage; cached=JSON.parse(storage.getItem('home-claude-usage-v1')); } catch {}
    const controller=new UsageController({source:makeLocalSource(),cached,save:rows=>{
      try { storage?.setItem('home-claude-usage-v1',JSON.stringify(encodeCache(rows))); if (!storage) storageFailed=true; }
      catch { storageFailed=true; }
    },onChange:render});
    let codexCache;try{codexCache=JSON.parse(storage?.getItem('home-codex-usage-v1'));}catch{}
    const codex=createCodexController({source:makeCodexSource(document.querySelector('meta[name=bridge-token]')?.content),cached:codexCache,save:rows=>{try{storage?.setItem('home-codex-usage-v1',JSON.stringify(encodeCodexCache(rows)));}catch{storageFailed=true;}},onChange:render});
    function render() {
      if (controller.disposed) return;
      const now=Date.now(); const container=find('usage-rows');container.replaceChildren();
      for (const row of [...codex.rows,...controller.rows]) {
        const status=freshness(row,now);
        const line=document.createElement('div');line.className='usage-measurement';
        const head=document.createElement('div');head.className='urow';
        const label=document.createElement('span');label.className='lab';label.textContent=row.provider==='OpenAI'?codexWindowLabel(row):row.window==='five_hour'?'Claude · 5-hour':'Claude · weekly · 7-day';
        const blocks=document.createElement('span');blocks.className='g '+(status==='stale'?'y':'k');blocks.textContent=meter(row.remaining) || '—';
        const value=document.createElement('span');value.className='usage-value '+(status==='stale'?'y':'k');value.textContent=row.remaining === null ? 'UNKNOWN' : `${Number(row.remaining.toFixed(1))}%`;
        head.append(label,blocks,value);
        const detail=document.createElement('div');detail.className='src';
        const age=row.observed_at ? Math.max(0,Math.floor((now-Date.parse(row.observed_at))/60000))+'m old' : 'age UNKNOWN';
        detail.textContent=row.remaining === null ? `UNAVAILABLE · ${row.reason}\nused / reset / start / end: UNKNOWN\nobserved ${chicagoTime(row.observed_at)} · ${row.source_method}\nscope ${row.provider==='OpenAI'?'account-wide Codex subscription':'Claude subscription capture'} · confidence unavailable` : `${status==='stale'?'STALE':'LOCAL'} · ${row.confidence} · ${age} · used ${row.used}%${row.provider==='OpenAI'?' · '+row.duration+' min':''}\nreset/end ${chicagoTime(row.resets_at)} · start UNKNOWN\nobserved ${chicagoTime(row.observed_at)} · ${row.provider==='OpenAI'?'local daemon · account-wide Codex subscription · plan '+(row.plan||'UNKNOWN'):'local statusline · Claude subscription scope'}`;
        line.append(head,detail);container.append(line);
      }
      const usd=document.createElement('div');usd.className='src';usd.textContent='Codex estimated USD · UNKNOWN · account-wide estimate absent from schema; subscription % is separate';container.append(usd);
      const usage=codex.snapshot?.usage;const activity=document.createElement('div');activity.className='src';activity.textContent=Array.isArray(usage?.dailyUsageBuckets)?`${codex.error?'STALE · ':''}Codex token activity · ${usage.dailyUsageBuckets.length} account-wide daily buckets observed · latest ${usage.dailyUsageBuckets.at(-1)?.startDate||'UNKNOWN'} · ${usage.dailyUsageBuckets.at(-1)?.tokens??'UNKNOWN'} tokens · ${chicagoTime(codex.snapshot.observed_at)} · daemon report, not billing audit`:'Codex account token activity · UNKNOWN'+(codex.snapshot?.usageReason?' · '+codex.snapshot.usageReason:'');container.append(activity);
      const fresh=[...codex.rows,...controller.rows].filter(row=>freshness(row,now)==='available').length;
      find('usage-coverage').textContent=`${fresh}/4 fresh windows`;
      const wait=Math.max(0,Math.ceil((Math.min(controller.nextRefresh,codex.nextRefresh)-now)/1000));
      find('usage-refresh').disabled=Boolean(controller.pending||codex.pending)||wait>0;
      find('usage-cancel').hidden=!(controller.pending||codex.pending);
      find('usage-status').textContent=([controller.pending?'Reading Claude capture…':controller.error||'Claude local capture',codex.pending?'Reading Codex daemon…':codex.error||'Codex local daemon'].join(' · '))+(wait ? ` · next check ≥${wait}s` : '')+(storageFailed ? ' · cache unavailable' : '');
      const hasReading=controller.rows.some(row=>row.remaining !== null);
      find('usage-sources').querySelector('p').textContent=`Claude Code 2.1.287: installed statusline fields verified. ${hasReading?'A local capture has been read; account identity is unverified.':'Real account payload not yet observed.'} Project-local collector configured (runtime capture unverified); awaits Claude Code activity in this repo. No model request started to obtain usage.`;
    }
    const codexInfo=document.createElement('p');codexInfo.className='src';codexInfo.textContent='Codex: authenticated local daemon account/read (no refresh), account/rateLimits/read and account/usage/read only. Account-wide scope; pinned PlanType and duration/reset evidence; no account identifiers, credentials or session access. Sparse account/rateLimits/updated notifications trigger bounded re-read. Failure keeps last-good readings STALE; absent data UNKNOWN. USD is unavailable account-wide in this schema. Refresh never starts a daemon or model.';find('usage-sources').append(codexInfo);
    function view(name) {
      find('usage-body').hidden=name!=='usage';find('usage-sources').hidden=name!=='sources';
      for (const tab of ['usage','sources']) {find(`${tab}-tab`).classList.toggle('on',tab===name);find(`${tab}-tab`).setAttribute('aria-pressed',String(tab===name));}
    }
    find('usage-tab').onclick=()=>view('usage'); find('sources-tab').onclick=()=>view('sources');
    find('usage-refresh').onclick=()=>{controller.refresh();codex.refresh();};find('usage-cancel').onclick=()=>{controller.cancel();codex.cancel();};
    render();controller.refresh();codex.refresh();
    const timer=setInterval(()=>{ render(); if (Date.now()>=controller.nextRefresh) controller.refresh(); if(Date.now()>=codex.nextRefresh)codex.refresh(); },1000);
    return {submit(){},dispose(){clearInterval(timer);controller.dispose();codex.dispose();root.replaceChildren();}};
  }
};
