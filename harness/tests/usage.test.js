import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {normalizeSnapshot,unknown,mergeMeasurements,freshness,chicagoTime,meter,SourceError,makeLocalSource,UsageController,encodeCache,decodeCache,STALE_MS} from '../modules/usage-core.js';
import {sanitizeStatusline,captureStatusline} from '../../scripts/claude-statusline.mjs';
const now=Date.parse('2026-10-06T20:00:00Z');
function snapshot(used=32) {return {schema:1,source:'claude-code-statusline',observed_at:new Date(now).toISOString(),rate_limits:{five_hour:{used_percentage:used,resets_at:now/1000+3600},seven_day:{used_percentage:58,resets_at:now/1000+86400}}};}
test('missing/null/malformed percentages never coerce to zero',()=>{
  for (const used of [null,undefined,'0',false,-1,101,NaN,Infinity]) {
    const input=snapshot();input.rate_limits.five_hour.used_percentage=used;
    const row=normalizeSnapshot(input,now)[0];assert.equal(row.remaining,null);assert.equal(row.confidence,'unavailable');
  }
  for (const value of [null,{}, {five_hour:null}]) {
    const s=snapshot();s.rate_limits=value;assert.equal(normalizeSnapshot(s,now)[0].remaining,null);
  }
  assert.equal(normalizeSnapshot(snapshot(0),now)[0].remaining,100);
  assert.equal(normalizeSnapshot(snapshot(100),now)[0].remaining,0);
  assert.equal(meter(null),null);assert.equal(meter(100),'█'.repeat(18));
});
test('invalid timestamps and window reset boundaries rejected; no invented start',()=>{
  for (const reset of [null,'123',NaN,0,now/1000,now/1000+5*3600+301]) {
    const s=snapshot();s.rate_limits.five_hour.resets_at=reset;assert.equal(normalizeSnapshot(s,now)[0].remaining,null);
  }
  const s=snapshot();s.observed_at='2026-10-06T20:00:00';assert.throws(()=>normalizeSnapshot(s,now),/timestamp/);
  s.observed_at='2026-02-30T20:00:00Z';assert.throws(()=>normalizeSnapshot(s,now),/timestamp/);
  s.observed_at=new Date(now+6000).toISOString();assert.throws(()=>normalizeSnapshot(s,now),/timestamp/);
  const row=normalizeSnapshot(snapshot(),now)[0];assert.equal(row.window_start,null);assert.equal(row.window_end,row.resets_at);
  assert.equal(freshness(row,Date.parse(row.resets_at)),'stale');
});
test('Chicago timezone respects daylight saving; persisted timestamps are UTC',()=>{
  assert.match(chicagoTime('2026-07-01T18:00:00Z'),/13:00.*CDT/);
  assert.match(chicagoTime('2026-01-01T18:00:00Z'),/12:00.*CST/);
  assert.equal(chicagoTime(null),'UNKNOWN');
  assert.equal(normalizeSnapshot(snapshot(),now)[0].observed_at,'2026-10-06T20:00:00.000Z');
});
test('duplicate scope deduplicates; partial/older input retains last good stale window',()=>{
  const rows=normalizeSnapshot(snapshot(),now);
  assert.equal(mergeMeasurements(rows,[rows[0],rows[0]]).length,2);
  const missing=snapshot();missing.rate_limits.five_hour=null;
  const merged=mergeMeasurements(rows,normalizeSnapshot(missing,now));
  assert.equal(merged[0].remaining,68);assert.equal(merged[0].status,'stale');assert.equal(merged[1].status,'available');
  const older={...rows[0],observed_at:new Date(now-1000).toISOString(),remaining:99};
  assert.equal(mergeMeasurements(rows,[older])[0].remaining,68);
});
test('offline/auth/rate-limit failures preserve data and isolate backoff',async()=>{
  for (const kind of ['offline','auth','rate_limit']) {
    let time=now,calls=0;
    const controller=new UsageController({now:()=>time,source:async()=>{calls++;if(calls===1)return snapshot();throw new SourceError(kind,120000);}});
    await controller.refresh();time+=30000;await controller.refresh();
    assert.equal(controller.rows[0].remaining,68);assert.equal(freshness(controller.rows[0],time),'stale');
    assert.ok(controller.nextRefresh>=time+120000);
    assert.equal(await controller.refresh(),false);assert.equal(calls,2);
    assert.equal(controller.pending,null);
  }
});
test('no overlap; cancellation and disposal abort pending work',async()=>{
  let aborted=false;
  const controller=new UsageController({now:()=>now,source:({signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>{aborted=true;reject(new DOMException('Canceled','AbortError'));}))});
  const pending=controller.refresh();assert.equal(await controller.refresh(),false);controller.cancel();await pending;
  assert.equal(aborted,true);assert.match(controller.error,/canceled/);assert.equal(controller.pending,null);
  const other=new UsageController({source:async()=>snapshot(),now:()=>now});other.dispose();assert.equal(await other.refresh(),false);
});
test('freshness does not reset on rereading old file; cache has separate observations',()=>{
  const rows=normalizeSnapshot(snapshot(),now);assert.equal(freshness(rows[0],now+STALE_MS),'stale');
  rows[1].observed_at=new Date(now-20000).toISOString();
  const decoded=decodeCache(encodeCache(rows),now);
  assert.equal(decoded[0].observed_at,rows[0].observed_at);assert.equal(decoded[1].observed_at,rows[1].observed_at);
  assert.equal(decoded[0].status,'stale');assert.equal(decodeCache({schema:99},now)[0].remaining,null);
});
test('HTTP source handles missing, malformed, offline, auth, rate limit and passes cancellation',async()=>{
  for (const [status,kind] of [[404,'unavailable'],[401,'auth'],[403,'auth'],[429,'rate_limit']]) {
    const source=makeLocalSource(async()=>({ok:false,status,headers:{get:()=> '60'}}));
    await assert.rejects(source({signal:new AbortController().signal}),e=>e.kind===kind && (status!==429 || e.retryAfter===60000));
  }
  await assert.rejects(makeLocalSource(async()=>{throw new Error('private detail');})({}),e=>e.kind==='offline'&&!e.message.includes('private'));
  await assert.rejects(makeLocalSource(async()=>({ok:true,text:async()=>'{bad'}))({}),e=>e.kind==='malformed');
  const signal=new AbortController().signal;
  const source=makeLocalSource(async(url,options)=>{assert.equal(url,'data/claude-usage.json');assert.equal(options.credentials,'omit');assert.equal(options.signal,signal);return {ok:true,text:async()=>JSON.stringify(snapshot())};});
  assert.deepEqual(await source({signal}),snapshot());
});
test('collector writes only whitelisted fields atomically; missing windows remain null',async()=>{
  const raw={version:'2.1.287',session_id:'secret-session',transcript_path:'/private',token:'secret-token',rate_limits:{...snapshot().rate_limits,spend_limit:{used_percentage:90},per_model:{used_percentage:80}}};
  const result=sanitizeStatusline(raw,now);assert.equal(JSON.stringify(result).includes('secret'),false);assert.equal(Object.keys(result.rate_limits).length,2);
  const dir=await mkdtemp(join(tmpdir(),'home-usage-'));
  try {const path=join(dir,'usage.json');await captureStatusline(raw,path,now);assert.deepEqual(JSON.parse(await readFile(path,'utf8')),result);}
  finally {await rm(dir,{recursive:true,force:true});}
  assert.equal(sanitizeStatusline({},now).rate_limits.five_hour,null);
});

test('timeout releases busy state even when a source ignores abort',async()=>{
 const controller=new UsageController({source:()=>new Promise(()=>{}),now:()=>now,timeoutMs:10});
 await controller.refresh();assert.equal(controller.pending,null);assert.match(controller.error,/timed out/);
});

test('failure backoff grows to bounded five-minute checks',async()=>{
 let time=now,calls=0;const controller=new UsageController({now:()=>time,source:async()=>{calls++;throw new SourceError('offline');}});
 for (const delay of [30000,60000,120000,240000,300000,300000]) {
  await controller.refresh();assert.equal(controller.nextRefresh-time,delay);
  assert.equal(await controller.refresh(),false);time=controller.nextRefresh;
 }
 assert.equal(calls,6);
});
