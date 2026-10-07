// node-pty 1.1.0's macOS prebuilt spawn helper ships without its executable bit.
import {chmod,stat} from 'node:fs/promises';
if(process.platform==='darwin') {
  for(const relative of [`../node_modules/node-pty/prebuilds/darwin-${process.arch}/spawn-helper`, '../node_modules/node-pty/build/Release/spawn-helper']) {
    const file=new URL(relative,import.meta.url);
    try {const info=await stat(file);await chmod(file,info.mode|0o111);} catch(error) {if(error.code!=='ENOENT')throw error;}
  }
}
