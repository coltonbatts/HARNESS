// Documented statusLine stdin only. Never read settings, sessions or credentials.
import {mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {normalizeSnapshot} from '../harness/modules/usage-core.js';
export function sanitizeStatusline(input, now = Date.now()) {
  const candidate = {schema:1,source:'claude-code-statusline',observed_at:new Date(now).toISOString(),rate_limits:{}};
  for (const window of ['five_hour','seven_day']) {
    const value=input?.rate_limits?.[window];
    candidate.rate_limits[window]=value && typeof value === 'object' ? {used_percentage:value.used_percentage,resets_at:value.resets_at} : null;
  }
  const rows=normalizeSnapshot(candidate,now);
  candidate.rate_limits=Object.fromEntries(rows.map(row=>[row.window,row.remaining === null ? null : {used_percentage:row.used,resets_at:Date.parse(row.resets_at)/1000}]));
  return candidate;
}
export async function captureStatusline(input, output, now=Date.now()) {
  const snapshot=sanitizeStatusline(input,now);
  await mkdir(dirname(output),{recursive:true});
  const temp=`${output}.${process.pid}.tmp`;
  await writeFile(temp,JSON.stringify(snapshot)+'\n',{mode:0o600});
  await rename(temp,output); return snapshot;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    let input='';
    for await (const chunk of process.stdin) { input+=chunk; if (input.length>1048576) throw new Error('Input too large'); }
    const output=fileURLToPath(new URL('../harness/data/claude-usage.json',import.meta.url));
    const snapshot=await captureStatusline(JSON.parse(input),output);
    const parts=['five_hour','seven_day'].map((window,index)=>`${index===0?'5h':'weekly'}: ${snapshot.rate_limits[window] == null ? 'UNKNOWN' : snapshot.rate_limits[window].used_percentage+'% used'}`);
    process.stdout.write('Claude · '+parts.join(' · '));
  } catch {
    try { await captureStatusline({},fileURLToPath(new URL('../harness/data/claude-usage.json',import.meta.url))); } catch {}
    process.stdout.write('Claude usage UNKNOWN · capture unavailable');
  }
}
