import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {JournalStore} from '../../bridge/journal.mjs';
import {journalModule} from '../modules/journal.js';
import {journalDay} from '../modules/journal-core.js';

function fakeRoot(){
  const elements=new Map();
  return {
    set innerHTML(html){for(const match of html.matchAll(/id="(journal-[^"]+)"/g))elements.set('#'+match[1],{value:'',textContent:'',disabled:false,hidden:false,validity:{valid:true},replaceChildren(){},add(){},focus(){}});},
    querySelector:id=>elements.get(id),replaceChildren(){elements.clear();}
  };
}
async function opened(root){
  const deadline=performance.now()+2000;
  while(performance.now()<deadline){
    if(!root.querySelector('#journal-date').disabled)return;
    await new Promise(resolve=>setTimeout(resolve,1));
  }
  assert.fail('Demo Journal did not finish opening');
}

for(const [label,before,after] of [
  ['Chicago midnight','2026-10-07T04:59:59Z','2026-10-07T05:00:00Z'],
  ['spring DST day opening','2026-03-08T05:59:59Z','2026-03-08T06:00:00Z'],
  ['fall DST day opening','2026-11-01T04:59:59Z','2026-11-01T05:00:00Z']
])test(`Demo mounted recovery across ${label}: reload, yesterday, today, generated save and conflict`,async(t)=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'demo-journal-recovery-'));
  const store=new JournalStore(directory),stored=new Map(),reads=[];
  const prior=Object.fromEntries(['document','window','fetch','Option'].map(key=>[key,globalThis[key]]));
  let instance;
  t.after(async()=>{
    instance?.dispose();
    for(const [key,value] of Object.entries(prior)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
    await rm(directory,{recursive:true,force:true});
  });
  globalThis.document={querySelector:()=>({content:'Demo-token'})};
  globalThis.window={localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value),removeItem:key=>stored.delete(key)}};
  globalThis.Option=class{constructor(label,value){this.label=label;this.value=value;}};
  globalThis.fetch=async(url,options)=>{
    if(url==='/api/journal'&&options.method==='POST'){
      const result=await store.save(JSON.parse(options.body));return {ok:result.status===200,json:async()=>result};
    }
    const parsed=new URL(url,'http://demo.invalid'),day=parsed.searchParams.get('day');
    if(day){reads.push(day);return {ok:true,json:async()=>({entry:await store.read(day)})};}
    return {ok:true,json:async()=>({days:await store.list()})};
  };
  let at=before;
  const clock={now:()=>new Date(at)},yesterday=journalDay(new Date(before)),today=journalDay(new Date(after));
  assert.notEqual(yesterday,today);
  const generated={day:yesterday,text:'Demo <script>literal recap</script>',model:'Demo fixture',generatedAt:before,sources:[],notConnected:['Hermes']};
  stored.set('home-journal-draft-v1:'+yesterday,JSON.stringify({day:yesterday,revision:0,reflection:'Demo owner reflection',recap:'Demo owner notes',generated}));
  let root;
  const q=id=>root.querySelector('#journal-'+id);
  async function mount(){root=fakeRoot();instance=journalModule.mount(root,clock);await opened(root);}
  await mount();assert.equal(q('date').value,yesterday);assert.equal(q('reflection').value,'Demo owner reflection');assert.ok(q('generated').textContent.includes(generated.text));
  instance.dispose();await mount();assert.equal(q('recap').value,'Demo owner notes');assert.ok(q('status').textContent.includes('Recovered browser draft'));
  at=after;
  // An open entry never moves its owner text to a new date automatically.
  assert.equal(q('date').value,yesterday);
  instance.dispose();await mount();assert.equal(q('date').value,today);assert.equal(q('reflection').value,'');assert.equal(q('recap').value,'');assert.ok(!q('generated').textContent.includes(generated.text));
  q('reflection').value='Demo today draft';q('reflection').oninput();
  q('date').value=yesterday;q('date').onchange();await opened(root);
  assert.equal(q('reflection').value,'Demo owner reflection');assert.equal(q('recap').value,'Demo owner notes');assert.ok(q('generated').textContent.includes(generated.text));
  await q('save').onclick();assert.ok(q('status').textContent.startsWith('Saved locally'));assert.equal(stored.has('home-journal-draft-v1:'+yesterday),false);
  assert.deepEqual((await new JournalStore(directory).read(yesterday)).generated,generated);
  q('reflection').value='Demo unsaved revision';q('reflection').oninput();
  assert.equal((await store.save({day:yesterday,revision:1,reflection:'Demo other writer',recap:'Demo newer notes',generated})).status,200);
  await q('save').onclick();assert.ok(q('status').textContent.includes('Entry changed elsewhere'));assert.equal(q('reflection').value,'Demo unsaved revision');
  assert.equal(JSON.parse(stored.get('home-journal-draft-v1:'+yesterday)).revision,1);assert.equal((await store.read(yesterday)).reflection,'Demo other writer');
  await q('saved').onclick();assert.equal(q('reflection').value,'Demo other writer');assert.equal(q('draft').hidden,false);
  await q('draft').onclick();assert.equal(q('reflection').value,'Demo unsaved revision');assert.equal(q('recap').value,'Demo owner notes');assert.ok(q('generated').textContent.includes(generated.text));
  await q('save').onclick();assert.equal((await store.read(yesterday)).revision,3);assert.equal((await store.read(yesterday)).reflection,'Demo unsaved revision');
  await q('today').onclick();assert.equal(q('date').value,today);assert.equal(q('reflection').value,'Demo today draft');assert.equal(q('recap').value,'');
  instance.dispose();await mount();assert.equal(q('reflection').value,'Demo today draft');
  q('date').value=yesterday;q('date').onchange();await opened(root);assert.equal(q('reflection').value,'Demo unsaved revision');assert.ok(q('generated').textContent.includes(generated.text));
  assert.ok(reads.includes(yesterday)&&reads.includes(today));
});

test('Chicago date handles both DST shifts and their changed midnight offsets',()=>{
  for(const [at,expected] of [
    ['2026-03-08T07:59:59Z','2026-03-08'],['2026-03-08T08:00:00Z','2026-03-08'],
    ['2026-03-09T04:59:59Z','2026-03-08'],['2026-03-09T05:00:00Z','2026-03-09'],
    ['2026-11-01T06:59:59Z','2026-11-01'],['2026-11-01T07:00:00Z','2026-11-01'],
    ['2026-11-02T05:59:59Z','2026-11-01'],['2026-11-02T06:00:00Z','2026-11-02']
  ])assert.equal(journalDay(new Date(at)),expected,at);
});
