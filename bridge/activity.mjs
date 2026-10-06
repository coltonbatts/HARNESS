import {open,realpath} from 'node:fs/promises';
import {constants} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validDay} from './journal.mjs';

const studio='/Users/coltonbatts/Documents/Studio Ops';
// Explicit inventory selected in Stage 06. Never enumerate directories or accept paths.
const tasks=['011-journal-recap','010-ollama-chat','009-harness-repository','008-daily-journal','007-csp-fix','006-local-bridge','005-launcher','004-claude-usage','003-harness-reframe','002-visual-prototype','001-product-plan'];
export const ACTIVITY_FILES=Object.freeze([
  {id:'build-log',path:fileURLToPath(new URL('../docs/BUILD-LOG.md',import.meta.url)),limit:3000},
  {id:'dashboard-handoff',path:studio+'/handoffs/dashboard.md',limit:3000},
  ...tasks.map(name=>({id:'dashboard-'+name,path:studio+'/tasks/dashboard-'+name+'.md',limit:650,preferTail:true}))
].map(Object.freeze));
const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
function dates(text){
  return [...text.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map(m=>m[1]).concat(
    [...text.matchAll(new RegExp(`\\b(${months.join('|')})\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b`,'g'))].map(m=>`${m[3]}-${String(months.indexOf(m[1])+1).padStart(2,'0')}-${m[2].padStart(2,'0')}`));
}
// Date scope comes from dated headings/preamble, not mtime. Historical sections excluded.
export function extractDay(text,day,limit=3000,preferTail=false){
  const lines=text.replace(/\r\n/g,'\n').split('\n'),stack=[];let scope=[],historical=false,used=0,total=0;const excerpts=[];let fence=null;
  for(let i=0;i<lines.length;i++){
    const line=lines[i],marker=/^\s*(`{3,}|~{3,})/.exec(line);
    if(marker){if(!fence)fence=marker[1][0];else if(fence===marker[1][0])fence=null;}
    const heading=!fence&&!marker&&/^(#{1,6})\s+(.+)/.exec(line);
    if(heading){
      const level=heading[1].length;while(stack.length&&stack.at(-1).level>=level)stack.pop();
      const found=dates(heading[2]);
      const parent=stack.at(-1);scope=found.length?found:(parent?.scope||[]);
      historical=/historical|superseded|^history\b/i.test(heading[2])||Boolean(parent?.historical);
      stack.push({level,scope,historical});
    }else if(!fence&&!marker&&dates(line).length&&(!scope.length||/^\s*(20\d{2}-|(?:Updated )?October\b)/.test(line))){scope=dates(line);if(stack.length)stack.at(-1).scope=scope;}
    if(historical||!scope.includes(day)||!line.trim())continue;
    total+=line.length+1;
    if(preferTail){excerpts.push({line:i+1,text:line});continue;}
    if(used>=limit)continue;
    const content=line.slice(0,limit-used);used+=content.length+1;
    excerpts.push({line:i+1,text:content,partialEnd:content.length<line.length});
  }
  if(preferTail){
    let budget=limit;const tail=[];
    for(const excerpt of excerpts.toReversed()){if(budget<=0)break;const text=excerpt.text.slice(-budget);tail.unshift({...excerpt,text,partialStart:text.length<excerpt.text.length});budget-=text.length+1;}
    return {excerpts:tail,truncated:total>limit};
  }
  return {excerpts,truncated:total>limit};
}
export async function readFixed(file){
  // Refuse symlinks, including symlinked parents, before opening the literal path.
  if(await realpath(file)!==file)throw Error('Symlink path refused');
  const handle=await open(file,constants.O_RDONLY|constants.O_NOFOLLOW);
  try{
    const info=await handle.stat();if(!info.isFile()||info.size>256*1024)throw Error('Not a regular file or exceeds 256 KiB');
    const buffer=Buffer.alloc(256*1024+1),{bytesRead}=await handle.read(buffer,0,buffer.length,0);
    if(bytesRead>256*1024)throw Error('Record exceeds 256 KiB');
    return {text:buffer.subarray(0,bytesRead).toString('utf8'),modifiedAt:info.mtime.toISOString()};
  }finally{await handle.close();}
}
export class ActivityReader{
  constructor({read=readFixed,now=()=>new Date()}={}){this.read=read;this.now=now;}
  async snapshot(day){
    if(!validDay(day))throw Error('Invalid activity date');
    const sources=[];
    for(const file of ACTIVITY_FILES){
      const observedAt=this.now().toISOString();
      try{
        const record=await this.read(file.path),parsed=extractDay(record.text,day,file.limit,file.preferTail);
        const hasBody=parsed.excerpts.some(e=>!/^#{1,6}\s/.test(e.text)&&/[a-z]/i.test(e.text.replace(/\b20\d{2}-\d{2}-\d{2}\b/g,'').replace(new RegExp(String.raw`\b(${months.join('|')})\s+\d{1,2},?\s+20\d{2}\b`,'g'),'')));
        if(!hasBody)parsed.excerpts=[];
        sources.push({id:file.id,path:file.path,observedAt,modifiedAt:record.modifiedAt,status:parsed.excerpts.length?'read':'empty',reason:parsed.excerpts.length?'Date-matched record excerpts; not a complete activity timeline':'No nonempty date-matched content',...parsed});
      }catch(error){sources.push({id:file.id,path:file.path,observedAt,status:'unavailable',reason:error.code==='ENOENT'?'File missing':error.message,excerpts:[],truncated:false});}
    }
    return {day,sources,notConnected:['Hermes activity: not connected','Other projects, chats and transcripts: not connected']};
  }
}
