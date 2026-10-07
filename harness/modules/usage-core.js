export const WINDOWS = ['five_hour', 'seven_day'];
export const DURATIONS = {five_hour: 5 * 3600_000, seven_day: 7 * 86400_000};
export const STALE_MS = 5 * 60_000;
export function parseTime(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const [year,month,day]=value.slice(0,10).split('-').map(Number);
  if (month<1 || month>12 || day<1 || day>new Date(Date.UTC(year,month,0)).getUTCDate()) return null;
  const ms = Date.parse(value); return Number.isFinite(ms) ? ms : null;
}
export function normalizeSnapshot(snapshot, now = Date.now()) {
  if (snapshot?.schema !== 1 || snapshot?.source !== 'claude-code-statusline') throw new Error('Malformed local snapshot');
  const observed = parseTime(snapshot.observed_at);
  if (observed === null || observed > now + 5000) throw new Error('Invalid observation timestamp');
  return WINDOWS.map(window => {
    const value = snapshot.rate_limits?.[window];
    const used = value?.used_percentage;
    const reset = value?.resets_at;
    const validUsed = typeof used === 'number' && Number.isFinite(used) && used >= 0 && used <= 100;
    const validReset = typeof reset === 'number' && Number.isSafeInteger(reset) && reset > 0 && reset * 1000 <= observed + DURATIONS[window] + 300_000 && reset * 1000 > observed;
    const valid = validUsed && validReset;
    return {
      provider: 'Anthropic', account: 'local-claude-subscription', product: 'Claude subscription (plan/account unverified)',
      window, unit: 'percent', used: valid ? used : null, remaining: valid ? 100 - used : null,
      window_start: null, window_end: valid ? new Date(reset * 1000).toISOString() : null,
      resets_at: valid ? new Date(reset * 1000).toISOString() : null,
      observed_at: new Date(observed).toISOString(), source_method: 'claude-code-statusline',
      confidence: valid ? 'authoritative' : 'unavailable',
      status: valid ? 'available' : 'unavailable',
      reason: valid ? '' : value == null ? 'Window absent from local source' : 'Malformed percentage/reset'
    };
  });
}
export function unknown(window) {
  return {provider:'Anthropic',account:'local-claude-subscription',product:'Claude subscription (plan/account unverified)',window,unit:'percent',used:null,remaining:null,window_start:null,window_end:null,resets_at:null,observed_at:null,source_method:'claude-code-statusline',confidence:'unavailable',status:'unavailable',reason:'No captured statusline reading'};
}
export function measurementKey(row) { return [row.provider,row.account,row.product,row.window].join('|'); }
export function mergeMeasurements(previous, incoming) {
  const map = new Map(previous.map(row => [measurementKey(row),row]));
  for (const row of incoming) {
    const key = measurementKey(row), old = map.get(key);
    if (old?.remaining != null && (row.remaining == null || Date.parse(row.observed_at) < Date.parse(old.observed_at))) map.set(key, {...old,status:'stale',reason:row.reason || 'Older observation ignored'});
    else map.set(key,row);
  }
  return [...map.values()];
}
export function freshness(row, now = Date.now()) {
  if (row.remaining === null) return 'unavailable';
  return row.status === 'stale' || now - Date.parse(row.observed_at) >= STALE_MS || now >= Date.parse(row.resets_at) ? 'stale' : 'available';
}
export function chicagoTime(value) {
  const ms = parseTime(value); return ms === null ? 'UNKNOWN' : new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',month:'short',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false,timeZoneName:'short'}).format(ms);
}
export function meter(remaining, blocks = 18) {
  if (typeof remaining !== 'number' || !Number.isFinite(remaining)) return null;
  const full = Math.round(remaining / 100 * blocks); return '█'.repeat(full) + '░'.repeat(blocks - full);
}
export class SourceError extends Error {
  constructor(kind, retryAfter = 0) { super({unavailable:'No captured statusline data',auth:'Local source access denied',rate_limit:'Local source rate limited',offline:'Local source offline',malformed:'Local source malformed',timeout:'Local source timed out'}[kind] || 'Local source unavailable'); this.kind=kind; this.retryAfter=retryAfter; }
}
export function makeLocalSource(fetchImpl = fetch) {
  return async ({signal}) => {
    let response;
    try { response = await fetchImpl('data/claude-usage.json',{signal,cache:'no-store',credentials:'omit'}); }
    catch (error) { if (error.name === 'AbortError') throw error; throw new SourceError('offline'); }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new SourceError('auth');
      if (response.status === 429) {
        const header = response.headers.get('Retry-After');
        const seconds = /^\d+$/.test(header || '') ? Number(header) : Math.max(0,(Date.parse(header) - Date.now()) / 1000);
        throw new SourceError('rate_limit',Math.min(300_000,Number.isFinite(seconds) ? seconds * 1000 : 0));
      }
      throw new SourceError('unavailable');
    }
    const text = await response.text();
    if (text.length > 4096) throw new SourceError('malformed');
    try { return JSON.parse(text); } catch { throw new SourceError('malformed'); }
  };
}
export class UsageController {
  constructor({source, now=Date.now, onChange=()=>{}, cached=null, save=()=>{}, timeoutMs=5000,normalize=normalizeSnapshot,initialRows=WINDOWS.map(unknown),decode=decodeCache}) {
    this.normalize=normalize;this.timeoutMs=timeoutMs; this.source=source; this.now=now; this.onChange=onChange; this.save=save;
    this.rows=initialRows; this.error=''; this.pending=null; this.failures=0; this.nextRefresh=0; this.disposed=false;
    if (cached) this.rows=decode(cached,now());
  }
  async refresh() {
    if (this.disposed || this.pending || this.now() < this.nextRefresh) return false;
    const abort=new AbortController(); this.pending=abort; this.error=''; this.onChange();
    const timeout=setTimeout(()=>{this.timedOut=true;abort.abort();},this.timeoutMs); this.timedOut=false;
    try {
      const canceled=new Promise((_,reject)=>abort.signal.addEventListener('abort',()=>reject(new DOMException('Canceled','AbortError')),{once:true}));
      const snapshot=await Promise.race([this.source({signal:abort.signal}),canceled]);
      if (abort.signal.aborted) throw new DOMException('Canceled','AbortError');
      const rows=this.normalize(snapshot,this.now());this.snapshot=snapshot;
      this.rows=mergeMeasurements(this.rows,rows);
      const available=this.rows.some(row=>row.remaining !== null);
      const missing=rows.some(row=>row.remaining === null);
      this.failures=missing ? this.failures+1 : 0;
      this.nextRefresh=this.now()+(missing ? Math.min(300_000,30_000*2**Math.min(this.failures-1,4)) : 30_000);
      this.error=missing ? 'Some subscription windows absent or malformed' : '';
      // Preserve last good windows independently in a whitelisted cache.
      if (available) this.save(this.rows);
    } catch (error) {
      this.rows=this.rows.map(row=>row.remaining === null ? row : {...row,status:'stale',reason:'Refresh failed; last good reading'});
      this.failures++;
      this.nextRefresh=this.now()+Math.max(Math.min(300_000,30_000*2**Math.min(this.failures-1,4)), error.retryAfter || 0);
      this.error=error.name === 'AbortError' ? this.timedOut ? 'Local source timed out' : 'Refresh canceled; no retry before backoff' : error instanceof SourceError ? error.message : 'Local snapshot invalid';
    } finally { clearTimeout(timeout); this.pending=null; if (!this.disposed) this.onChange(); }
    return true;
  }
  cancel() { this.pending?.abort(); }
  dispose() { this.disposed=true; this.cancel(); }
}
export function encodeCache(rows) {
  return {schema:1,observations:rows.filter(row=>row.remaining !== null).map(row=>({window:row.window,observed_at:row.observed_at,used_percentage:row.used,resets_at:Date.parse(row.resets_at)/1000}))};
}
export function decodeCache(value, now=Date.now()) {
  if (value?.schema !== 1 || !Array.isArray(value.observations) || value.observations.length>2) return WINDOWS.map(unknown);
  let rows=WINDOWS.map(unknown);
  for (const item of value.observations) {
    if (!WINDOWS.includes(item?.window)) continue;
    try {
      const normalized=normalizeSnapshot({schema:1,source:'claude-code-statusline',observed_at:item.observed_at,rate_limits:{[item.window]:{used_percentage:item.used_percentage,resets_at:item.resets_at}}},now).filter(row=>row.window===item.window);
      rows=mergeMeasurements(rows,normalized);
    } catch {}
  }
  return rows.map(row=>({...row,status:row.remaining === null ? 'unavailable' : 'stale',reason:'Cached reading; awaiting local refresh'}));
}
