import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,realpath,stat,access,mkdir,writeFile,rename,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const run=promisify(execFile);
export const approved=Object.freeze({
 cursor:{bundleId:'com.todesktop.230313mzl4w4u92',main:'Cursor',bundlePath:'/Applications/Cursor.app'},
 claude:{bundleId:'com.anthropic.claudefordesktop',main:'Claude',bundlePath:'/Applications/Claude.app'},
 codex:{bundleId:'com.openai.codex',main:'ChatGPT',bundlePath:'/Applications/ChatGPT.app'},
 hermes:{bundleId:'com.nousresearch.hermes',main:'Hermes',bundlePath:'/Applications/Hermes.app'}
});
export function validateRegistration(input){
 if(!input||Array.isArray(input)||Object.keys(input).sort().join(',')!=='bundlePath,tool'||!Object.hasOwn(approved,input.tool)||typeof input.bundlePath!=='string'||input.bundlePath.length>512)throw Error('Expected an approved tool and bundlePath only');
 return input;
}
export async function inspectBundle(tool,bundlePath,{roots=['/Applications',path.join(os.homedir(),'Applications')],execute=run}={}){
 const rule=approved[tool];
 if(!rule||typeof bundlePath!=='string'||bundlePath.length>512||/[\x00-\x1f\x7f]/.test(bundlePath)||!path.isAbsolute(bundlePath)||path.normalize(bundlePath)!==bundlePath||!bundlePath.endsWith('.app')||!roots.some(root=>bundlePath.startsWith(root+path.sep)))throw Error('Select a canonical .app below /Applications or ~/Applications');
 const canonical=await realpath(bundlePath);
 if(canonical!==bundlePath||!(await stat(canonical)).isDirectory())throw Error('Bundle aliases or symlinks refused');
 const plist=path.join(canonical,'Contents/Info.plist'),executable=path.join(canonical,'Contents/MacOS',rule.main);
 if(await realpath(plist)!==plist)throw Error('Bundle metadata symlinks refused');
 const metadata=await stat(plist);if(!metadata.isFile()||metadata.size>65536)throw Error('Bundle metadata unavailable or oversized');
 const {stdout}=await execute('/usr/bin/plutil',['-convert','json','-o','-',plist],{shell:false,timeout:3000,maxBuffer:65536});
 const info=JSON.parse(stdout);
 if(info.CFBundleIdentifier!==rule.bundleId||info.CFBundleExecutable!==rule.main)throw Error('Bundle identity/executable does not match approved tool');
 if(await realpath(executable)!==executable)throw Error('Bundle executable symlinks refused');
 if(!(await stat(executable)).isFile())throw Error('Main executable missing');await access(executable,constants.X_OK);
 const version=typeof info.CFBundleShortVersionString==='string'?info.CFBundleShortVersionString.slice(0,80):'UNKNOWN';
 return {tool,bundlePath:canonical,bundleId:rule.bundleId,version,executable,argv:['-a',canonical],available:true,reason:'Approved bundle metadata and executable verified'};
}
export class RegistrationStore{
 constructor({root=fileURLToPath(new URL('../.launcher/',import.meta.url)),inspect=inspectBundle}={}){this.root=path.resolve(root);this.inspect=inspect;this.paths=Object.fromEntries(Object.entries(approved).map(([id,r])=>[id,r.bundlePath]));this.ready=null;this.error=null;this.busy=false;}
 async load(){
  if(!this.ready)this.ready=(async()=>{
   try{
    const file=path.join(this.root,'registrations.json');
    if((await lstat(this.root)).isSymbolicLink()||(await lstat(file)).isSymbolicLink())throw Error('Registration symlinks refused');
    if((await stat(file)).size>4096)throw Error('Registration store oversized');
    const data=JSON.parse(await readFile(file,'utf8'));
    if(!data||Object.keys(data).sort().join(',')!=='paths,version'||data.version!==1||!data.paths||!['claude,cursor,hermes','claude,codex,cursor,hermes'].includes(Object.keys(data.paths).sort().join(','))||!Object.values(data.paths).every(p=>typeof p==='string'&&p.length<=512))throw Error('Invalid registration store');
    this.paths={...this.paths,...data.paths};
   }catch(e){if(e.code!=='ENOENT')this.error='Registration store invalid; preserved. Restore a valid version-1 file manually before registering or opening native tools';}
  })();
  await this.ready;
 }
 async get(id){
  await this.load();
  if(!Object.hasOwn(approved,id))return null;
  if(this.error)return {tool:id,available:false,bundlePath:this.paths[id],reason:this.error};
  try{return {...await this.inspect(id,this.paths[id]),kind:'native'};}catch(e){return {tool:id,available:false,kind:'native',bundlePath:this.paths[id],reason:e.code==='ENOENT'?'Bundle missing or moved; Configure and register its approved .app path':e.message};}
 }
 async list(){return Promise.all(['cursor','claude','codex','hermes'].map(id=>this.get(id)));}
 async register(input){
  try{validateRegistration(input);}catch(e){return {httpStatus:400,error:e.message};}
  await this.load();if(this.error)return {httpStatus:409,error:this.error};
  if(this.busy)return {httpStatus:409,error:'Registration update pending; no second write'};this.busy=true;
  try{
   const registration=await this.inspect(input.tool,input.bundlePath),paths={...this.paths,[input.tool]:registration.bundlePath};
   await mkdir(this.root,{recursive:true,mode:0o700});
   if((await realpath(this.root))!==this.root)throw Error('Registration directory aliases refused');
   const tmp=path.join(this.root,'registrations.tmp');await writeFile(tmp,JSON.stringify({version:1,paths}),{mode:0o600,flag:'wx'});await rename(tmp,path.join(this.root,'registrations.json'));
   this.paths=paths;return {httpStatus:200,registration:{...registration,kind:'native'},message:'Registered only; press the tool button separately to open'};
  }catch(e){return {httpStatus:400,error:e.code==='ENOENT'?'Bundle missing; select its current approved path':e.message};}finally{this.busy=false;}
 }
}
