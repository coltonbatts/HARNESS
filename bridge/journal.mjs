import {mkdir,readFile,readdir,writeFile,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {validGenerated} from '../harness/modules/journal-activity.js';
import {journalMarkdown} from '../harness/modules/journal-core.js';
function validInput(input){return input&&['day,recap,reflection,revision','day,generated,recap,reflection,revision'].includes(Object.keys(input).sort().join(','))&&validDay(input.day)&&Number.isSafeInteger(input.revision)&&input.revision>=0&&typeof input.reflection==='string'&&typeof input.recap==='string'&&input.reflection.length<=32000&&input.recap.length<=16000&&(input.generated===undefined||validGenerated(input.generated,input.day));}
export function validDay(day){
  if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day)||Number(day.slice(0,4))<2000)return false;
  const date=new Date(day+'T12:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===day;
}
export class JournalStore{
  constructor(root){this.root=root;this.pending=new Map();}
  async read(day){
    if(!validDay(day))throw Error('Invalid journal date');
    try{
      const entry=JSON.parse(await readFile(path.join(this.root,day+'.json'),'utf8'));
      if((entry.generated!==undefined&&!validGenerated(entry.generated,day))||entry?.version!==1||entry.day!==day||!Number.isSafeInteger(entry.revision)||entry.revision<1||typeof entry.reflection!=='string'||typeof entry.recap!=='string'||entry.reflection.length>32000||entry.recap.length>16000||!Number.isFinite(Date.parse(entry.createdAt))||!Number.isFinite(Date.parse(entry.updatedAt)))throw Error('Malformed journal file');
      return entry;
    }
    catch(error){if(error.code==='ENOENT')return {version:1,day,revision:0,reflection:'',recap:'',createdAt:null,updatedAt:null};throw error;}
  }
  async list(){
    try{return (await readdir(this.root)).filter(name=>/^\d{4}-\d{2}-\d{2}\.json$/.test(name)).map(name=>name.slice(0,10)).sort().reverse();}
    catch(error){if(error.code==='ENOENT')return [];throw error;}
  }
  async save(input){
    if(!validInput(input))return {status:400,error:'Invalid journal entry'};
    const {day}=input,prior=this.pending.get(day)||Promise.resolve();
    const operation=prior.catch(()=>{}).then(async()=>{
      const current=await this.read(day);
      if(current.revision!==input.revision)return {status:409,error:'Entry changed elsewhere. Your draft is retained; review the saved entry before replacing it.'};
      await mkdir(this.root,{recursive:true,mode:0o700});
      const at=new Date().toISOString();
      const entry={version:1,day,revision:current.revision+1,reflection:input.reflection,recap:input.recap,...(input.generated!==undefined?{generated:input.generated}:current.generated!==undefined?{generated:current.generated}:{}),createdAt:current.createdAt||at,updatedAt:at};
      const file=path.join(this.root,day+'.json'),temporary=path.join(this.root,day+'.'+randomUUID()+'.tmp');
      try{await writeFile(temporary,JSON.stringify(entry,null,2)+'\n',{mode:0o600,flag:'wx'});await rename(temporary,file);}
      finally{await unlink(temporary).catch(()=>{});}
      return {status:200,entry};
    });
    this.pending.set(day,operation);
    try{return await operation;}finally{if(this.pending.get(day)===operation)this.pending.delete(day);}
  }
  async export(input){
    if(!validInput(input))return {status:400,error:'Invalid journal entry'};
    const entry=await this.read(input.day),folder=path.join(this.root,'exports');
    await mkdir(folder,{recursive:true,mode:0o700});
    const file=path.join(folder,input.day+'-journal.md'),temporary=path.join(folder,randomUUID()+'.tmp');
    try{await writeFile(temporary,journalMarkdown({...input,updatedAt:entry.updatedAt}),{mode:0o600,flag:'wx'});await rename(temporary,file);}
    finally{await unlink(temporary).catch(()=>{});}
    return {status:200,path:file};
  }
}
