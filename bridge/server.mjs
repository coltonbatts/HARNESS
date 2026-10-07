import http from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CodexUsageService} from './codex-usage.mjs';
import {BridgeService} from './core.mjs';
import {OllamaService,validateChat} from './ollama.mjs';
import {ActivityReader} from './activity.mjs';
import {JournalStore,validDay} from './journal.mjs';
const harnessRoot=fileURLToPath(new URL('../harness/',import.meta.url));
export function authorize(headers,{origin,token},mutation=false){
  if(headers.host!==new URL(origin).host)return false;
  if(headers['sec-fetch-site']!=='same-origin')return false;
  if(mutation?headers.origin!==origin:(headers.origin!==undefined&&headers.origin!==origin))return false;
  const supplied=headers['x-bridge-token'];
  return typeof supplied==='string'&&Buffer.byteLength(supplied)===Buffer.byteLength(token)&&timingSafeEqual(Buffer.from(supplied),Buffer.from(token));
}
export function createBridge({codexUsage=new CodexUsageService(),service=new BridgeService(),activity=new ActivityReader(),ollama=new OllamaService(),root=harnessRoot,journal=new JournalStore(fileURLToPath(new URL('../.journal/',import.meta.url)))}={}){
  const token=randomBytes(32).toString('hex');let origin;
  const server=http.createServer(async(req,res)=>{
    const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
    function reply(code,body,type='application/json'){res.writeHead(code,{...headers,'Content-Type':type});res.end(type==='application/json'?JSON.stringify(body):body);}
    try{
      if(!origin||req.headers.host!==new URL(origin).host)return reply(403,{error:'Host refused'});
      const url=new URL(req.url,origin);
      if(url.pathname.startsWith('/api/')){
        if(!authorize(req.headers,{origin,token},req.method==='POST'))return reply(403,{error:'Bridge authorization refused'});
        if(url.pathname==='/api/ollama'&&['GET','POST'].includes(req.method)){
          if(url.search)return reply(400,{error:'Ollama route accepts no query parameters'});
          let input;
          if(req.method==='POST'){
            if(req.headers['content-type']!=='application/json')return reply(415,{error:'JSON required'});
            const chunks=[];let bytes=0;
            for await(const chunk of req){bytes+=chunk.length;if(bytes>200000)return reply(413,{error:'Body too large'});chunks.push(chunk);}
            try{input=validateChat(JSON.parse(Buffer.concat(chunks).toString()));}catch(error){return reply(400,{error:error.message});}
          }
          const abort=new AbortController();
          const disconnected=()=>{if(!res.writableEnded)abort.abort();};
          res.on('close',disconnected);
          try{return reply(200,await (req.method==='GET'?ollama.tags(abort.signal):ollama.chat(input,abort.signal)));}
          catch(error){if(!res.destroyed)return reply(502,{error:error.message});}
          finally{res.removeListener('close',disconnected);}
          return;
        }
        if(req.method==='GET'&&url.pathname==='/api/journal/activity'){
          const day=url.searchParams.get('day');
          if([...url.searchParams.keys()].join(',')!=='day'||!validDay(day))return reply(400,{error:'Expected one activity date; no paths accepted'});
          return reply(200,await activity.snapshot(day));
        }
        if(req.method==='GET'&&url.pathname==='/api/usage/codex'){
          if(url.search||req.headers['content-length']&&req.headers['content-length']!=='0'||req.headers['transfer-encoding'])return reply(400,{error:'Codex usage accepts no parameters/body'});
          const abort=new AbortController(),disconnected=()=>{if(!res.writableEnded)abort.abort();};res.on('close',disconnected);
          try{const data=await codexUsage.snapshot(abort.signal);if(!res.destroyed)return reply(200,data);}finally{res.removeListener('close',disconnected);}
          return;
        }
        if(req.method==='GET'&&url.pathname==='/api/state')return reply(200,await service.state());
        if(req.method==='GET'&&url.pathname==='/api/journal'){
          if(!url.search)return reply(200,{days:await journal.list()});
          const day=url.searchParams.get('day');
          if([...url.searchParams.keys()].join(',')!=='day'||!validDay(day))return reply(400,{error:'Invalid journal date'});
          return reply(200,{entry:await journal.read(day)});
        }
        if(req.method==='POST'&&['/api/journal','/api/journal/export'].includes(url.pathname)){
          if(req.headers['content-type']!=='application/json')return reply(415,{error:'JSON required'});
          let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>200000)return reply(413,{error:'Body too large'});}
          let input;try{input=JSON.parse(body);}catch{return reply(400,{error:'Invalid JSON'});}
          const result=await (url.pathname==='/api/journal/export'?journal.export(input):journal.save(input));return reply(result.status,result);
        }
        if(req.method==='POST'&&url.pathname==='/api/launcher/registration'){
          if(url.search)return reply(400,{error:'Registration accepts no query parameters'});
          if(req.headers['content-type']!=='application/json')return reply(415,{error:'JSON required'});
          let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1024)return reply(413,{error:'Body too large'});}
          let input;try{input=JSON.parse(body);}catch{return reply(400,{error:'Invalid JSON'});}
          const result=await service.register(input);return reply(result.httpStatus,result);
        }
        if(req.method==='POST'&&url.pathname==='/api/open'){
          if(url.search)return reply(400,{error:'Open accepts no query parameters'});
          if(req.headers['content-type']!=='application/json')return reply(415,{error:'JSON required'});
          let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>1024)return reply(413,{error:'Body too large'});}
          let input;try{input=JSON.parse(body);}catch{return reply(400,{error:'Invalid JSON'});}
          if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).length!==1||typeof input.tool!=='string')return reply(400,{error:'Expected one allowlisted tool ID only'});
          const result=await service.open(input.tool);return reply(result.httpStatus,result);
        }
        return reply(404,{error:'Unknown bridge endpoint/method'});
      }
      if(req.method!=='GET'&&req.method!=='HEAD')return reply(405,{error:'Read-only static files'});
      // Reject cross-origin document/subresource requests; direct address navigation is allowed.
      if(req.headers.origin&&req.headers.origin!==origin)return reply(403,{error:'Origin refused'});
      if(req.headers['sec-fetch-site']&&!['none','same-origin'].includes(req.headers['sec-fetch-site']))return reply(403,{error:'Cross-origin static request refused'});
      let rel;try{rel=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html';}catch{return reply(404,{error:'File unavailable'});}
      if(rel.split('/').some(p=>p.startsWith('.'))||rel.includes('\\')||rel.includes('\0'))return reply(404,{error:'File unavailable'});
      const base=await realpath(root),candidate=path.resolve(root,rel);
      if(!candidate.startsWith(base+path.sep))return reply(404,{error:'File unavailable'});
      let resolved;try{resolved=await realpath(candidate);}catch(error){if(['ENOENT','ENOTDIR','EINVAL'].includes(error.code))return reply(404,{error:'File unavailable'});throw error;}
      if(!resolved.startsWith(base+path.sep)||(await stat(resolved)).isDirectory())return reply(404,{error:'File unavailable'});
      const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
      const type=types[path.extname(resolved)];if(!type)return reply(404,{error:'File unavailable'});
      let data=await readFile(resolved);
      if(resolved===path.join(base,'index.html'))data=Buffer.from(data.toString().replace('</head>',`<meta name="bridge-token" content="${token}"></head>`));
      res.writeHead(200,{...headers,'Content-Type':type});res.end(req.method==='HEAD'?undefined:data);
    }catch{return reply(500,{error:'Bridge request failed'});}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;
  return {server,listen(port=4175){return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',()=>{origin=`http://127.0.0.1:${server.address().port}`;resolve(origin);});});}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const bridge=createBridge();
  bridge.listen().then(origin=>console.log(`Harness bridge: ${origin} (loopback only)`)).catch(()=>{console.error('Bridge could not bind 127.0.0.1:4175; no fallback address used');process.exitCode=1;});
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>bridge.server.close(()=>process.exit(0)));
}
