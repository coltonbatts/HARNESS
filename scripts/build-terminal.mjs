import {build} from 'esbuild';
import {copyFile, mkdir, readFile} from 'node:fs/promises';
await mkdir('harness/vendor', {recursive:true});
// xterm creates three runtime stylesheets (geometry/theme/scrollbar). Give only
// those styles the bridge nonce; retain strict CSP without unsafe-inline.
await build({stdin:{contents:"export {Terminal} from '@xterm/xterm'; export {FitAddon} from '@xterm/addon-fit';",resolveDir:process.cwd()},bundle:true,format:'esm',minify:true,outfile:'harness/vendor/terminal.js',legalComments:'eof',plugins:[{
  name:'xterm-style-nonce', setup(build) {
    build.onLoad({filter:/@xterm\/xterm\/lib\/xterm\.mjs$/},async ({path})=>{
      const source=await readFile(path,'utf8');
      const pattern=/[\w.]+\.createElement\("style"\)/g;
      if([...source.matchAll(pattern)].length!==3)throw Error('Review xterm runtime styles before rebuilding');
      const inline='t.setAttribute("style",`${t.getAttribute("style")||""}${e};`)';
      if(source.split(inline).length!==2)throw Error('Review xterm DOM color setter before rebuilding');
      const patched=source.replace(pattern,match=>`harnessStyle(${match})`).replace(inline,'harnessColor(t,e)');
      return {contents:'function harnessStyle(node){node.nonce=document.querySelector("meta[name=terminal-style-nonce]")?.content||"";return node;}\nfunction harnessColor(node,text){const i=text.indexOf(":");node.style.setProperty(text.slice(0,i),text.slice(i+1));}\n'+patched,loader:'js'};
    });
  }
}]});
await copyFile('node_modules/@xterm/xterm/css/xterm.css','harness/vendor/terminal.css');
await copyFile('node_modules/@xterm/xterm/LICENSE','harness/vendor/XTERM-LICENSE.txt');
await copyFile('node_modules/@xterm/addon-fit/LICENSE','harness/vendor/FIT-LICENSE.txt');
