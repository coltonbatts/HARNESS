export const btopModule = {
  id:'btop', version:1, title:'BTOP', availability:'live-or-unavailable', capabilities:['local-terminal','start','stop','resize'],
  mount(root) {
    root.innerHTML = `<div class="tbar"><span class="tab on">btop</span><span class="rt"><span id="btop-status" role="status">STOPPED</span><button id="btop-start">[ start ]</button><button id="btop-stop" disabled>[ stop ]</button><button id="btop-expand">[ expand ]</button><button id="btop-back">[ tiles ]</button></span></div><div id="btop-terminal" aria-label="Interactive btop terminal"></div><div class="btop-foot">Real local btop · click terminal for keyboard controls · Esc menu · q quit · process actions affect this Mac · scroll on narrow screens</div>`;
    const host=root.querySelector('#btop-terminal'), status=root.querySelector('#btop-status');
    const startButton=root.querySelector('#btop-start'),stopButton=root.querySelector('#btop-stop');
    let term,fit,socket,loading,disposed=false,ready=false,resizeTimer;
    const token=document.querySelector('meta[name="bridge-token"]')?.content;
    const setStatus=text=>{status.textContent=text;};
    const send=message=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(message));};
    const dimensions=()=>({cols:Math.max(40,Math.min(500,term.cols)),rows:Math.max(10,Math.min(200,term.rows))});
    function resize(){
      if(!term||!host.clientWidth||!host.clientHeight)return;
      const expanded=root.parentElement.classList.contains('layout-btop');
      const fontSize=expanded?12:9;
      term.options.lineHeight=expanded?1.1:1.0;
      if(term.options.fontSize!==fontSize)term.options.fontSize=fontSize;
      fit.fit();
      term.resize(Math.max(80,Math.min(500,term.cols)),Math.max(24,Math.min(200,term.rows)));
      if(ready)send({type:'resize',...dimensions()});
    }
    const observer=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,80);});observer.observe(host);
    async function initialize(){
      if(term)return;
      if(!loading)loading=import('../vendor/terminal.js').then(({Terminal,FitAddon})=>{
        if(disposed)return;
        term=new Terminal({fontSize:12,fontFamily:'Menlo, Monaco, monospace',lineHeight:1.1,scrollback:0,
          allowProposedApi:false,theme:{background:'#000000',foreground:'#f5f5f5',cursor:'#72e69a'}});
        fit=new FitAddon();term.loadAddon(fit);term.open(host);
        term.onData(data=>{if(ready&&new TextEncoder().encode(data).length<=4096)send({type:'input',data});});
        term.attachCustomKeyEventHandler(event=>!((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k')&&!(event.altKey&&/^[0-3]$/.test(event.key)));
      });
      await loading;
    }
    async function start({focus=true}={}){
      if(disposed||socket||startButton.disabled)return;
      if(!token){setStatus('UNAVAILABLE · start the local bridge');return;}
      startButton.disabled=true;setStatus('STARTING');
      try {
        await initialize();if(disposed)return;
        resize();term.reset();
        const current=new WebSocket(`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/api/btop`,['harness-btop',token]);
        socket=current;stopButton.disabled=false;
        current.onopen=()=>{send({type:'start',...dimensions()});if(focus)term.focus();};
        current.onmessage=event=>{
          if(disposed||socket!==current)return;
          const message=JSON.parse(event.data);
          if(message.type==='data')term.write(message.data);
          if(message.type==='started'){ready=true;setStatus(`LIVE · PID ${message.pid}`);}
          if(message.type==='error'){setStatus(message.message);}
          if(message.type==='exit'){ready=false;setStatus(`EXITED · ${message.exitCode} · Start to reopen`);}
        };
        current.onerror=()=>setStatus('UNAVAILABLE · reload after a bridge restart');
        current.onclose=()=>{if(socket!==current)return;socket=undefined;ready=false;startButton.disabled=false;stopButton.disabled=true;if(status.textContent.startsWith('LIVE')||status.textContent==='STARTING')setStatus('DISCONNECTED · Start to reconnect');};
      } catch(error){setStatus(`UNAVAILABLE · ${error.message}`);startButton.disabled=false;}
    }
    function stop(){const current=socket;socket=undefined;ready=false;current?.close();startButton.disabled=false;stopButton.disabled=true;setStatus('STOPPED');}
    startButton.onclick=()=>start();stopButton.onclick=stop;
    return {submit:start,focus(){resize();term?.focus();},dispose(){disposed=true;stop();clearTimeout(resizeTimer);observer.disconnect();term?.dispose();}};
  }
};
