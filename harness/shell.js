import { ModuleRegistry, readConfig } from './registry.js';
import { chatModule } from './modules/chat.js';
import { usageModule } from './modules/usage.js';
import { launcherModule } from './modules/launcher.js';
let storage; try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
const config = readConfig(storage);
const registry = new ModuleRegistry(); registry.register(chatModule); registry.register(usageModule); registry.register(launcherModule);
const input = document.querySelector('#command');
const grid = document.querySelector('#grid');
function layout() {
  grid.classList.toggle('layout-chat', config.layout === 'chat');
  document.querySelector('#tile').setAttribute('aria-pressed', String(config.layout === 'tiled'));
  document.querySelector('#focus-chat').setAttribute('aria-pressed', String(config.layout === 'chat'));
  document.querySelector('#tile').classList.toggle('cur', config.layout === 'tiled');
  document.querySelector('#focus-chat').classList.toggle('cur', config.layout === 'chat');
}
function save(patch) {
  Object.assign(config, patch); layout();
  try { storage.setItem('home-harness-v1', JSON.stringify(config)); }
  catch { chat.notify('Local storage unavailable. Preferences apply to this tab only.'); }
}
const chat = registry.mount('chat', document.querySelector('#chat-slot'), {
  config, save, notify: text => { input.placeholder = text; },
  setPending: pending => { document.querySelector('#send').disabled = pending; }
});
const usage = registry.mount('usage', document.querySelector('#usage-slot'), { notify() {} });
const launcher = registry.mount('launcher', document.querySelector('#launcher-slot'), { notify() {} });
function proposeReset() {
  chat.propose?.({ command: '/layout reset', effects: 'writes browser-local home-harness-v1 layout=tiled only · no files, processes, or provider calls', run: () => save({ layout: 'tiled' }) });
}
document.querySelector('#command-form').addEventListener('submit', event => {
  event.preventDefault(); if (document.querySelector('#send').disabled) return;
  const text = input.value.trim(); if (!text) return;
  if (text === '/help') chat.notify?.('Local commands: /help · /layout reset. Other slash commands are unsupported; ordinary text goes to the selected STUB backend. Cmd/Ctrl+K focuses input; Alt+0 tiles; Alt+1 focuses Chat.');
  else if (text === '/layout reset') proposeReset();
  else if (text.startsWith('/')) chat.notify?.('Unsupported command. Nothing executed. Use /help.');
  else chat.submit(text);
  input.value = ''; input.focus();
});
document.querySelector('#tile').onclick = () => save({ layout: 'tiled' });
document.querySelector('#focus-chat').onclick = () => save({ layout: 'chat' });
document.querySelector('#reset').onclick = proposeReset;
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.focus(); }
  if (event.altKey && ['0', '1'].includes(event.key)) { event.preventDefault(); save({ layout: event.key === '0' ? 'tiled' : 'chat' }); }
});
function tick() { document.querySelector('#clk').textContent = new Date().toLocaleString('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', weekday: 'short', day: '2-digit', month: '2-digit' }) + ' CT'; }
tick(); const clock = setInterval(tick, 1000);
window.addEventListener('pagehide', () => { clearInterval(clock); chat.dispose(); usage.dispose(); launcher.dispose(); }, { once: true });

layout();
