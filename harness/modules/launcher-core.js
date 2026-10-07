export const tools = Object.freeze([
  {id:'cursor',name:'Cursor',bundleId:'com.todesktop.230313mzl4w4u92',version:'3.22.7',scheme:'cursor',url:'cursor://',kind:'native-scheme',installed:'verified-2026-10-06',verification:'unverified'},
  {id:'claude',name:'Claude',bundleId:'com.anthropic.claudefordesktop',version:'2.19675.1',scheme:'claude',url:'claude://',kind:'native-scheme',installed:'verified-2026-10-06',verification:'unverified'},
  {id:'codex',name:'Codex',bundleId:'com.openai.codex',version:'live metadata required',scheme:null,url:null,kind:'native-bundle',installed:'verification-required',verification:'unverified'},
  {id:'hermes',name:'Hermes',bundleId:'com.nousresearch.hermes',version:'0.0.0',scheme:'hermes',url:'hermes://',kind:'native-scheme',installed:'verified-2026-10-06',verification:'unverified'}
]);
export function routeFor(tool,{bridge=false}={}) {
  if(tool?.id==='codex')return tool.kind==='native-bundle'&&bridge?{available:true,kind:'native-bundle'}:{available:false,reason:'CLI-only without verified local bridge · run codex in your terminal'};
  if (!tool || !tool.url || !tool.scheme) return {available:false,reason:'No configured route'};
  if (tool.installed==='missing' && tool.kind==='native-scheme') return {available:false,reason:'App missing in installation record'};
  try {
    const url=new URL(tool.url);
    const expected={cursor:'cursor:',claude:'claude:',hermes:'hermes:'}[tool.id];
    if (tool.kind !== 'native-scheme') return {available:false,reason:'Unknown route kind'};
    if (!expected || url.protocol!==expected || tool.scheme+':'!==expected) return {available:false,reason:'Unknown or mismatched scheme'};
    if (tool.kind==='native-scheme' && url.href!==`${tool.scheme}://`) return {available:false,reason:'Unapproved app route'};
    return {available:true,url:url.href,kind:tool.kind};
  } catch {return {available:false,reason:'Malformed route'};}
}
export function processState() { return {pid:'UNKNOWN',state:'UNKNOWN',cpu:'UNKNOWN',reason:'Browser has no native process observation capability'}; }
export function filterTools(query,list=tools) {
  const q=query.trim().toLocaleLowerCase();
  return list.filter(tool=>[tool.name,tool.bundleId,tool.scheme].join(' ').toLocaleLowerCase().includes(q));
}
export function moveSelection(rows,selectedId,key) {
  if (!rows.length) return null;
  const i=rows.findIndex(row=>row.id===selectedId);
  if (key==='Home') return rows[0].id;
  if (key==='End') return rows.at(-1).id;
  if (key==='ArrowDown') return rows[(i+1+rows.length)%rows.length].id;
  if (key==='ArrowUp') return rows[((i<0?0:i)+rows.length-1)%rows.length].id;
  return i<0 ? rows[0].id : selectedId;
}
export class LauncherController {
  constructor({list=tools,now=Date.now}={}) {this.list=list;this.now=now;this.query='';this.selectedId=list[0]?.id ?? null;this.lastAttempts=new Map();this.outcomes=new Map();}
  get rows(){return filterTools(this.query,this.list);}
  filter(query){this.query=query;this.selectedId=this.rows.some(row=>row.id===this.selectedId)?this.selectedId:this.rows[0]?.id??null;}
  select(key){this.selectedId=moveSelection(this.rows,this.selectedId,key);}
  activate(id,{userInitiated=false,bridge=false}={}) {
    const tool=this.list.find(tool=>tool.id===id),route=routeFor(tool,{bridge});
    if (!userInitiated) return {dispatch:false,message:'User activation required'};
    if (!route.available) {this.outcomes.set(id,{status:'unavailable',source:'configuration',message:route.reason});return {dispatch:false,message:route.reason};}
    const at=this.now(),last=this.lastAttempts.get(id);
    if (last!==undefined && at-last<1000) return {dispatch:false,message:'Repeated activation held for 1 second; no second request'};
    this.lastAttempts.set(id,at);
    const message=route.kind==='native-bundle'?'Native dispatch requested; open/focus outcome UNKNOWN':'Scheme requested; open/focus outcome UNKNOWN. Browser may block, prompt, or have no handler';
    this.outcomes.set(id,{status:'unknown',source:'browser-request',message,at});
    return {dispatch:true,url:route.url,message};
  }
  report(id,status) {
    if (!this.list.some(tool=>tool.id===id) || !this.lastAttempts.has(id) || !['opened','blocked','not-handled'].includes(status)) return false;
    this.outcomes.set(id,{status,source:'user-report',at:this.now(),message:status==='opened'?'User reports destination opened; process state remains UNKNOWN':status==='blocked'?'User reports browser blocked navigation':'User reports no destination opened; app missing vs unhandled scheme cannot be distinguished'});return true;
  }
}
