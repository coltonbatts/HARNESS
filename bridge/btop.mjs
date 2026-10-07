import {timingSafeEqual} from 'node:crypto';
import {access} from 'node:fs/promises';
import {constants} from 'node:fs';
import pty from 'node-pty';
import {WebSocketServer, WebSocket} from 'ws';

// Fixed program only. The client cannot select an executable, arguments, cwd or environment.
const binaries = ['/opt/homebrew/bin/btop', '/usr/local/bin/btop', '/usr/bin/btop'];
export async function spawnBtop(cols, rows) {
  let binary;
  for (const candidate of binaries) {
    try { await access(candidate, constants.X_OK); binary = candidate; break; } catch {}
  }
  if (!binary) throw Error('btop is not installed in a supported location. Install btop, then press Start.');
  return pty.spawn(binary, ['--force-utf', '--no-tty', '--update', '2000'], {
    name:'xterm-256color', cols, rows, cwd:process.env.HOME,
    env:{HOME:process.env.HOME, PATH:'/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin',
      TERM:'xterm-256color', COLORTERM:'truecolor', LANG:'en_US.UTF-8'}
  });
}
export function validSize(message) {
  return Number.isInteger(message.cols) && message.cols >= 40 && message.cols <= 500 &&
    Number.isInteger(message.rows) && message.rows >= 10 && message.rows <= 200;
}
export function attachBtop(server, {getOrigin, token, spawn = spawnBtop}) {
  const sockets = new WebSocketServer({noServer:true, maxPayload:8192,
    handleProtocols: protocols => protocols.has('harness-btop') ? 'harness-btop' : false});
  server.on('upgrade', (req, socket, head) => {
    const origin = getOrigin();
    const protocols = (req.headers['sec-websocket-protocol'] || '').split(',').map(s => s.trim());
    const supplied = protocols[1];
    // Browser WebSocket handshakes have no custom token header or reliable Fetch Metadata.
    // Require the exact own Origin/Host and per-run token carried as a subprotocol instead.
    if (!origin || req.url !== '/api/btop' || req.headers.host !== new URL(origin).host ||
      req.headers.origin !== origin || protocols.length !== 2 || protocols[0] !== 'harness-btop' ||
      typeof supplied !== 'string' || Buffer.byteLength(supplied) !== Buffer.byteLength(token) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(token)) || sockets.clients.size >= 4) {
      socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return;
    }
    sockets.handleUpgrade(req, socket, head, ws => sockets.emit('connection', ws));
  });
  sockets.on('connection', ws => {
    let child, starting = false, closed = false, alive = true;
    const send = message => {
      if (ws.readyState !== WebSocket.OPEN) return;
      if (ws.bufferedAmount > 1024 * 1024) { ws.terminate(); return; }
      ws.send(JSON.stringify(message));
    };
    const cleanup = () => { closed = true; clearTimeout(startDeadline); clearInterval(heartbeat); if(child) { try {child.kill();} catch {} child = undefined; } };
    const startDeadline = setTimeout(() => ws.close(1008, 'Start required'), 10000);
    const heartbeat = setInterval(() => { if (!alive) { ws.terminate(); return; } alive = false; ws.ping(); }, 15000);
    heartbeat.unref(); startDeadline.unref();
    ws.on('pong', () => {alive = true;}); ws.on('close', cleanup); ws.on('error', cleanup);
    ws.on('message', async (data, binary) => {
      let message;
      try { if(binary) throw Error(); message = JSON.parse(data.toString()); } catch { ws.close(1008,'Invalid message'); return; }
      if (!message || typeof message !== 'object' || Array.isArray(message)) { ws.close(1008,'Invalid message'); return; }
      const keys = Object.keys(message).sort().join(',');
      if (message.type === 'start' && keys === 'cols,rows,type' && validSize(message) && !child && !starting) {
        starting = true; clearTimeout(startDeadline);
        try {
          const process = await spawn(message.cols, message.rows);
          if(closed) {process.kill(); return;}
          child = process;
          child.onData(data => send({type:'data',data}));
          child.onExit(({exitCode}) => {child = undefined; send({type:'exit',exitCode}); ws.close(1000,'btop exited');});
          send({type:'started',pid:child.pid});
        } catch(error) { send({type:'error',message:error.message}); ws.close(1011,'btop unavailable'); }
        return;
      }
      if (child && message.type === 'resize' && keys === 'cols,rows,type' && validSize(message)) { child.resize(message.cols,message.rows); return; }
      if (child && message.type === 'input' && keys === 'data,type' && typeof message.data === 'string' && Buffer.byteLength(message.data) <= 4096) { child.write(message.data); return; }
      ws.close(1008,'Unsupported btop message');
    });
  });
  return {dispose(){for(const ws of sockets.clients) ws.terminate(); sockets.close();}};
}
