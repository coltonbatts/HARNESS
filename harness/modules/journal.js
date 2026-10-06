import {journalDay,journalMarkdown} from './journal-core.js';
export const journalModule={
  id:'journal',version:1,title:'Journal',capabilities:['daily-capture','local-file-save','history','export'],availability:'local-bridge-required-for-files',
  authority:'Read/write dated journal files through authenticated local bridge. Browser recovery drafts. No model requests or external memory writes.',
  mount(root){
    root.innerHTML=`<div class="tbar"><span class="tab on">journal</span><span class="rt">LOCAL · CT</span></div><div class="pbody journal-body"><div class="journal-nav"><button id="journal-today">[ today ]</button><label for="journal-date" class="src">Entry</label><input id="journal-date" type="date" min="2000-01-01" aria-label="Journal date"><select id="journal-history" aria-label="Saved journal history"><option value="">history</option></select></div><p class="journal-question">What’s on your mind after today?</p><label for="journal-reflection" class="src">MY REFLECTION</label><textarea id="journal-reflection" maxlength="32000" placeholder="A thought, a win, something unfinished. A few words count."></textarea><details><summary class="src">Activity notes · automatic recap not connected</summary><label for="journal-recap" class="src">What I worked on — written by me</label><textarea id="journal-recap" maxlength="16000" placeholder="Add anything you want to remember about the day."></textarea><p class="src">Hermes activity and intelligence retrieval are pending. These notes stay local.</p></details><div class="journal-actions"><button id="journal-save">[ save entry ]</button><button id="journal-export">[ export .md ]</button><button id="journal-saved">[ view saved ]</button><button id="journal-draft" hidden>[ return to draft ]</button></div><div id="journal-export-fallback" hidden><label for="journal-export-text" class="src">Copy Markdown</label><textarea id="journal-export-text" readonly></textarea></div><p id="journal-status" class="notice" role="status" aria-live="polite"></p></div>`;
    const q=id=>root.querySelector('#journal-'+id),date=q('date'),reflection=q('reflection'),recap=q('recap'),status=q('status'),history=q('history');
    const token=document.querySelector('meta[name="bridge-token"]')?.content;
    let entry={day:journalDay(),revision:0,reflection:'',recap:''},busy=false,disposed=false;
    const controllers=new Set();
    const draftKey=day=>'home-journal-draft-v1:'+day;
    let draftStorage;try{draftStorage=window.localStorage;}catch{}
    function announce(text){status.textContent=text;}
    function draft(){return {...entry,reflection:reflection.value,recap:recap.value};}
    function remember(){
      q('export-fallback').hidden=true;
      try{if(!draftStorage)throw Error();draftStorage.setItem(draftKey(entry.day),JSON.stringify(draft()));announce('Draft kept in this browser · save entry to keep a local file.');}
      catch{announce('Browser draft storage unavailable. Save or export before leaving.');}
    }
    function lock(value){busy=value;for(const id of ['today','date','history','save','saved','draft','export'])q(id).disabled=value;reflection.disabled=value;recap.disabled=value;}
    async function request(url,body){
      if(!token)throw Error('Local bridge unavailable. Your draft can still be exported.');
      const controller=new AbortController();controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),6000);
      try{
        const result=await fetch(url,{method:body?'POST':'GET',headers:{'X-Bridge-Token':token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal});
        const data=await result.json();if(!result.ok)throw Error(data.error||'Local journal unavailable');return data;
      }finally{clearTimeout(timeout);controllers.delete(controller);}
    }
    function restore(day){
      try{const saved=JSON.parse(draftStorage?.getItem(draftKey(day))||'null');if(saved?.day===day&&Number.isSafeInteger(saved.revision)&&typeof saved.reflection==='string'&&typeof saved.recap==='string')return saved;}catch{}
      return null;
    }
    function display(value){entry=value;date.value=entry.day;reflection.value=entry.reflection;recap.value=entry.recap;}
    async function load(day,{savedOnly=false,rebase=false}={}){
      lock(true);q('draft').hidden=true;q('export-fallback').hidden=true;announce('Opening entry…');
      let saved={day,revision:0,reflection:'',recap:''},problem;
      try{saved=(await request('/api/journal?day='+encodeURIComponent(day))).entry;}catch(error){problem=error.message;}
      if(disposed)return;
      const recovery=restore(day);
      if(rebase&&recovery&&!problem)recovery.revision=saved.revision;
      display(!savedOnly&&recovery?recovery:saved);
      q('draft').hidden=!(savedOnly&&recovery);
      announce(problem||(!savedOnly&&recovery?'Recovered browser draft · save when ready.':saved.updatedAt?'Saved locally · '+new Date(saved.updatedAt).toLocaleString('en-US',{timeZone:'America/Chicago'}):'No entry yet. A few words count.'));
      lock(false);
    }
    async function refreshHistory(){
      try{
        const {days}=await request('/api/journal');if(disposed)return;
        history.replaceChildren(new Option('history',''));
        for(const day of days)history.add(new Option(day,day));
      }catch{/* Capture remains usable when history is unavailable. */}
    }
    async function save(){
      remember();const value=draft();lock(true);announce('Saving local file…');
      try{
        const result=await request('/api/journal', {day:value.day,revision:value.revision,reflection:value.reflection,recap:value.recap});
        if(disposed)return;display(result.entry);
        try{draftStorage?.removeItem(draftKey(entry.day));}catch{}
        q('draft').hidden=true;announce('Saved locally · '+new Date(entry.updatedAt).toLocaleTimeString('en-US',{timeZone:'America/Chicago'}));
        await refreshHistory();
      }catch(error){if(!disposed)announce(error.message+' Your text is still here.');}
      finally{if(!disposed)lock(false);}
    }
    reflection.oninput=remember;recap.oninput=remember;
    date.onchange=()=>{if(date.validity.valid&&date.value)load(date.value);else date.value=entry.day;};
    history.onchange=()=>{if(history.value)load(history.value);};
    q('today').onclick=()=>load(journalDay());
    q('saved').onclick=()=>load(entry.day,{savedOnly:true});
    q('draft').onclick=()=>load(entry.day,{rebase:true});
    q('save').onclick=save;
    q('export').onclick=async()=>{
      if(!token){
        q('export-text').value=journalMarkdown(draft());q('export-fallback').hidden=false;
        announce('Bridge unavailable. Copy the Markdown below to keep your entry.');return;
      }
      const value=draft();lock(true);
      try{const result=await request('/api/journal/export',{day:value.day,revision:value.revision,reflection:value.reflection,recap:value.recap});if(!disposed)announce('Exported Markdown to '+result.path);}
      catch(error){if(!disposed){q('export-text').value=journalMarkdown(value);q('export-fallback').hidden=false;announce('File export unavailable. Copy the Markdown below. '+error.message);}}
      finally{if(!disposed)lock(false);}
    };
    reflection.onkeydown=event=>{if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();if(!busy)save();}};
    load(entry.day).then(()=>{if(!disposed)refreshHistory();});
    return {submit(){reflection.focus();},dispose(){disposed=true;for(const controller of controllers)controller.abort();root.replaceChildren();}};
  }
};
