import {coverageText,recapCandidates,generateRecap,generatedText,validGenerated} from './journal-activity.js';
import {journalDay,journalMarkdown} from './journal-core.js';
export const journalModule={
  id:'journal',version:1,title:'Journal',capabilities:['daily-capture','local-file-save','history','export','read-selected-records','local-model-recap'],availability:'local-bridge-required-for-files',
  authority:'Read/write dated journal files through authenticated local bridge. Browser recovery drafts. Read fixed selected project records; explicit local Ollama recap. No external memory writes.',
  mount(root,{now=()=>new Date()}={}){
    root.innerHTML=`<div class="tbar"><span class="tab on">journal</span><span class="rt">LOCAL · CT</span></div><div class="pbody journal-body"><div class="journal-nav"><button id="journal-today">[ today ]</button><label for="journal-date" class="src">Entry</label><input id="journal-date" type="date" min="2000-01-01" aria-label="Journal date"><select id="journal-history" aria-label="Saved journal history"><option value="">history</option></select></div><p class="journal-question">What’s on your mind after today?</p><label for="journal-reflection" class="src">MY REFLECTION</label><textarea id="journal-reflection" maxlength="32000" placeholder="A thought, a win, something unfinished. A few words count."></textarea><details><summary class="src">Activity notes — written by me</summary><label for="journal-recap" class="src">Activity notes — written by me</label><textarea id="journal-recap" maxlength="16000" placeholder="Add anything you want to remember about the day."></textarea><p class="src">These are your words. Copying a generated recap here is an explicit edit by you.</p></details><section aria-label="Connected activity and generated recap"><p class="src">INCOMPLETE SOURCE COVERAGE · Hermes activity: not connected</p><pre id="journal-coverage" class="journal-evidence"></pre><details><summary class="src">Candidate record quotes for recap</summary><p class="src">Candidates: at most 24 sentences, 250 characters each, 4,000 characters total JSON. Long sentences and excess candidates are excluded; this is partial coverage.</p><pre id="journal-excerpts" class="journal-evidence"></pre></details><p class="src">Generate sends these record excerpts, My reflection and your activity notes to the selected local Ollama model. Content stays on this machine. The model selects exact record quotes; invented text is refused. Reports may be stale or incomplete; review sources.</p><div class="journal-nav"><button id="journal-sources">[ read records ]</button><button id="journal-models">[ refresh models ]</button><select id="journal-model" aria-label="Journal local recap model"><option value="">no local model selected</option></select><button id="journal-generate">[ generate recap ]</button><button id="journal-cancel" hidden>[ cancel recap ]</button></div><p class="src">GENERATED RECAP — MODEL-AUTHORED SELECTION</p><pre id="journal-generated" class="journal-evidence" aria-live="polite"></pre><button id="journal-copy">[ copy recap into my notes ]</button></section><div class="journal-actions"><button id="journal-save">[ save entry ]</button><button id="journal-export">[ export .md ]</button><button id="journal-saved">[ view saved ]</button><button id="journal-draft" hidden>[ return to draft ]</button></div><div id="journal-export-fallback" hidden><label for="journal-export-text" class="src">Copy Markdown</label><textarea id="journal-export-text" readonly></textarea></div><p id="journal-status" class="notice" role="status" aria-live="polite"></p></div>`;
    const q=id=>root.querySelector('#journal-'+id),date=q('date'),reflection=q('reflection'),recap=q('recap'),status=q('status'),history=q('history');
    const token=document.querySelector('meta[name="bridge-token"]')?.content;
    let coverage=null,recapController=null;
    let entry={day:journalDay(now()),revision:0,reflection:'',recap:''},busy=false,disposed=false;
    const controllers=new Set();
    const draftKey=day=>'home-journal-draft-v1:'+day;
    let draftStorage;try{draftStorage=window.localStorage;}catch{}
    function announce(text){if(!disposed)status.textContent=text;}
    function draft(){return {...entry,reflection:reflection.value,recap:recap.value};}
    function remember(){
      q('export-fallback').hidden=true;
      try{if(!draftStorage)throw Error();draftStorage.setItem(draftKey(entry.day),JSON.stringify(draft()));announce('Draft kept in this browser · save entry to keep a local file.');return true;}
      catch{announce('Browser draft storage unavailable. Save or export before leaving.');return false;}
    }
    function lock(value){busy=value;for(const id of ['today','date','history','save','saved','draft','export','sources','models','model','generate','copy'])q(id).disabled=value;reflection.disabled=value;recap.disabled=value;}
    async function request(url,body,controller=new AbortController(),deadline=6000){
      if(!token)throw Error('Local bridge unavailable. Your draft can still be exported.');
      controllers.add(controller);const timeout=setTimeout(()=>controller.abort(),deadline);
      try{
        const result=await fetch(url,{method:body?'POST':'GET',headers:{'X-Bridge-Token':token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:controller.signal});
        const data=await result.json();if(!result.ok)throw Error(data.error||'Local journal unavailable');return data;
      }finally{clearTimeout(timeout);controllers.delete(controller);}
    }
    function restore(day){
      try{const saved=JSON.parse(draftStorage?.getItem(draftKey(day))||'null');if(saved?.day===day&&Number.isSafeInteger(saved.revision)&&typeof saved.reflection==='string'&&typeof saved.recap==='string'&&(saved.generated===undefined||validGenerated(saved.generated,day)))return saved;}catch{}
      return null;
    }
    function renderActivity(){q('coverage').textContent=coverageText(coverage);q('excerpts').textContent=coverage?recapCandidates(coverage).map(c=>c.number+' · '+c.id+':L'+c.line+'\n'+c.quote).join('\n\n'):'Read records to preview the data.';q('generated').textContent=generatedText(entry.generated);q('copy').disabled=busy||!entry.generated;}
    function display(value){entry=value;coverage=null;date.value=entry.day;reflection.value=entry.reflection;recap.value=entry.recap;renderActivity();}
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
      lock(false);renderActivity();
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
        const result=await request('/api/journal', {day:value.day,revision:value.revision,reflection:value.reflection,recap:value.recap,...(value.generated!==undefined?{generated:value.generated}:{})});
        if(disposed)return;display(result.entry);
        try{draftStorage?.removeItem(draftKey(entry.day));}catch{}
        q('draft').hidden=true;announce('Saved locally · '+new Date(entry.updatedAt).toLocaleTimeString('en-US',{timeZone:'America/Chicago'}));
        await refreshHistory();
      }catch(error){if(!disposed)announce(error.message+' Your text is still here.');}
      finally{if(!disposed){lock(false);renderActivity();}}
    }
    q('sources').onclick=async()=>{
      if(busy||disposed)return;
      lock(true);announce('Reading selected records…');
      try{coverage=await request('/api/journal/activity?day='+encodeURIComponent(entry.day));announce('Selected records observed. Coverage remains incomplete.');}
      catch(error){coverage=null;announce('Record read failed: '+error.message);}
      finally{if(!disposed){lock(false);renderActivity();}}
    };
    q('models').onclick=async()=>{
      if(busy||disposed)return;
      lock(true);announce('Reading local Ollama models…');
      try{const data=await request('/api/ollama');if(disposed)return;q('model').replaceChildren(new Option('select local model',''));for(const model of data.models.filter(m=>m.local))q('model').add(new Option(model.name,model.name));announce('Local model list read; select a model for recap.');}
      catch(error){if(!disposed)announce(error.message);}
      finally{if(!disposed){lock(false);renderActivity();}}
    };
    q('generate').onclick=async()=>{
      if(busy||disposed)return;
      if(!q('model').value){announce('Select a local model using refresh models first.');return;}
      const owner=draft();lock(true);const controller=new AbortController();recapController=controller;q('cancel').hidden=false;announce('Reading selected records, then requesting local recap…');
      try{
        const snapshot=await request('/api/journal/activity?day='+encodeURIComponent(entry.day),undefined,controller);if(disposed||controller.signal.aborted)return;
        coverage=snapshot;renderActivity();
        announce('Generating recap with local Ollama…');
        const generated=await generateRecap(snapshot,owner,q('model').value,body=>request('/api/ollama',body,controller,125000));
        if(disposed||controller.signal.aborted)return;
        entry={...entry,generated};const kept=remember();announce('Generated recap ready · model-authored '+(kept?'browser draft. Save entry to archive it.':'text. Browser draft storage unavailable; save or export before leaving.'));
      }catch(error){if(!disposed)announce(controller.signal.aborted?'Recap canceled or timed out; entry untouched. Ollama may already have processed it.':error.message+' Entry untouched.');}
      finally{recapController=null;if(!disposed){q('cancel').hidden=true;lock(false);renderActivity();}}
    };
    q('cancel').onclick=()=>recapController?.abort();
    q('copy').onclick=()=>{
      if(busy||disposed||!entry.generated)return;
      const text=recap.value+(recap.value?'\n\n':'')+'Copied from generated recap ('+entry.generated.model+'):\n'+entry.generated.text;
      if(text.length>16000){announce('Copy refused: activity notes would exceed 16,000 characters.');return;}
      recap.value=text;remember();announce('Copied into your editable activity notes by your explicit action. Original generated recap retained.');
    };
    reflection.oninput=remember;recap.oninput=remember;
    date.onchange=()=>{if(date.validity.valid&&date.value)load(date.value);else date.value=entry.day;};
    history.onchange=()=>{if(history.value)load(history.value);};
    q('today').onclick=()=>load(journalDay(now()));
    q('saved').onclick=()=>load(entry.day,{savedOnly:true});
    q('draft').onclick=()=>load(entry.day,{rebase:true});
    q('save').onclick=save;
    q('export').onclick=async()=>{
      if(!token){
        q('export-text').value=journalMarkdown(draft());q('export-fallback').hidden=false;
        announce('Bridge unavailable. Copy the Markdown below to keep your entry.');return;
      }
      const value=draft();lock(true);
      try{const result=await request('/api/journal/export',{day:value.day,revision:value.revision,reflection:value.reflection,recap:value.recap,...(value.generated!==undefined?{generated:value.generated}:{})});if(!disposed)announce('Exported Markdown to '+result.path);}
      catch(error){if(!disposed){q('export-text').value=journalMarkdown(value);q('export-fallback').hidden=false;announce('File export unavailable. Copy the Markdown below. '+error.message);}}
      finally{if(!disposed){lock(false);renderActivity();}}
    };
    reflection.onkeydown=event=>{if((event.metaKey||event.ctrlKey)&&event.key==='Enter'){event.preventDefault();if(!busy)save();}};
    load(entry.day).then(()=>{if(!disposed)refreshHistory();});
    return {submit(){reflection.focus();},dispose(){disposed=true;for(const controller of controllers)controller.abort();root.replaceChildren();}};
  }
};
