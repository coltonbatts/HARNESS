import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
function forbiddenAttributes(text){
  const tags=text.match(/<[a-z][^<>]*>/gi)||[];
  return tags.flatMap(tag=>tag.match(/\s(?:style|on[a-z0-9_-]+)\s*=/gi)||[]);
}
async function files(dir){
  const paths=[];
  for(const e of await readdir(dir,{withFileTypes:true})){
    const url=new URL(e.name+(e.isDirectory()?'/':''),dir);
    if(e.isDirectory())paths.push(...await files(url));else paths.push(url);
  }
  return paths;
}
test('every file under harness is free of inline style and event attributes',async()=>{
  for(const file of await files(root))assert.deepEqual(forbiddenAttributes(await readFile(file,'utf8')),[],file.pathname);
});
test('every registered module generates markup without inline attributes',async()=>{
  const shell=await readFile(new URL('shell.js',root),'utf8');
  const registrations=[...shell.matchAll(/registry\.register\((\w+)\)/g)].map(m=>m[1]);
  assert.ok(registrations.length);
  for(const name of registrations){
    const declaration=[...shell.matchAll(/import\s*\{\s*(\w+)\s*\}\s*from\s*['"]([^'"]+)['"]/g)].find(m=>m[1]===name);
    assert.ok(declaration,`Import for registered ${name}`);
    const module=(await import(new URL(declaration[2],root)))[name];
    const captured=Symbol('captured');let markup;
    const tile={set innerHTML(value){markup=value;throw captured;}};
    // Capture the actual evaluated template before mount starts sources/timers.
    assert.throws(()=>module.mount(tile,{config:{backend:'ollama'}}),error=>error===captured);
    assert.equal(typeof markup,'string');assert.deepEqual(forbiddenAttributes(markup),[],module.id);
  }
});
test('attribute guard detects mixed-case/whitespace handlers, not JS event bindings',()=>{
  for(const attribute of ['style','STYLE','onclick','onKeyDown']){
    assert.equal(forbiddenAttributes(`<span ${attribute} = "value">`).length,1);
  }
  assert.equal(forbiddenAttributes('button.onclick = handler;').length,0);
});
