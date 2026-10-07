import test from 'node:test';
import assert from 'node:assert/strict';
import {tools,routeFor,processState,filterTools,moveSelection,LauncherController} from '../modules/launcher-core.js';

test('four destinations are allowlisted; Codex requires a verified bridge and has CLI-only fallback',()=>{
  assert.deepEqual(tools.map(t=>t.id),['cursor','claude','codex','hermes']);
  for(const tool of tools) assert.equal(routeFor(tool,{bridge:true}).available,true);
  assert.equal(routeFor(tools[2]).available,false);assert.match(routeFor(tools[2]).reason,/run codex in your terminal/);
  assert.equal(routeFor(tools[2],{bridge:true}).kind,'native-bundle');
  for(const tool of [null,{}, {...tools[0],scheme:null}, {...tools[0],installed:'missing'}, {...tools[0],scheme:'unknown'}, {...tools[0],url:'claude://'}, {...tools[0],url:'bad url'}, {...tools[0],url:'cursor://payload'}, {...tools[0],kind:'unknown'}, {...tools[2],url:'https://example.com/'}]) assert.equal(routeFor(tool).available,false);
});
test('only user activation dispatches; repeated requests are bounded per route',()=>{
  let now=1000;const c=new LauncherController({now:()=>now});
  assert.equal(c.activate('cursor').dispatch,false);
  assert.equal(c.activate('absent',{userInitiated:true}).dispatch,false);
  assert.equal(c.activate('cursor',{userInitiated:true}).dispatch,true);
  assert.equal(c.activate('cursor',{userInitiated:true}).dispatch,false);
  assert.equal(c.activate('claude',{userInitiated:true}).dispatch,true);
  now=1999;assert.equal(c.activate('cursor',{userInitiated:true}).dispatch,false);
  now=2000;assert.equal(c.activate('cursor',{userInitiated:true}).dispatch,true);
  assert.equal(c.outcomes.get('cursor').status,'unknown');
});
test('missing installation and unknown scheme are unavailable',()=>{
  for(const tool of [{...tools[0],installed:'missing'},{...tools[0],scheme:'unknown'}]){
    const c=new LauncherController({list:[tool]});assert.equal(c.activate('cursor',{userInitiated:true}).dispatch,false);assert.equal(c.outcomes.get('cursor').status,'unavailable');
  }
});
test('filtering and keyboard selection follow visible rows and empty lists',()=>{
  const c=new LauncherController();c.select('End');assert.equal(c.selectedId,'hermes');c.select('ArrowDown');assert.equal(c.selectedId,'cursor');c.select('ArrowUp');assert.equal(c.selectedId,'hermes');c.select('Home');assert.equal(c.selectedId,'cursor');
  c.filter(' CLAUDE ');assert.equal(c.selectedId,'claude');assert.equal(c.rows.length,1);c.select('ArrowDown');assert.equal(c.selectedId,'claude');
  c.filter('no match');assert.equal(c.selectedId,null);c.select('End');assert.equal(c.selectedId,null);assert.equal(moveSelection([],null,'ArrowUp'),null);
  assert.equal(filterTools('com.nousresearch')[0].id,'hermes');assert.equal(filterTools('https').length,0);assert.equal(filterTools('com.openai.codex')[0].id,'codex');
});
test('dispatch and manual outcomes never create process knowledge or automatic success',()=>{
  const c=new LauncherController();assert.equal(c.report('cursor','opened'),false);
  c.activate('cursor',{userInitiated:true});assert.equal(c.outcomes.get('cursor').status,'unknown');
  for(const status of ['opened','blocked','not-handled']){
    assert.equal(c.report('cursor',status),true);assert.equal(c.outcomes.get('cursor').source,'user-report');
    assert.deepEqual(processState(),{pid:'UNKNOWN',state:'UNKNOWN',cpu:'UNKNOWN',reason:'Browser has no native process observation capability'});
  }
  assert.equal(c.report('cursor','running'),false);assert.equal(c.report('absent','opened'),false);
});
