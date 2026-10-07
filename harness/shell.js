import { ModuleRegistry, readConfig } from './registry.js';
import { chatModule } from './modules/chat.js';
import { usageModule } from './modules/usage.js';
import { launcherModule } from './modules/launcher.js';
import { journalModule } from './modules/journal.js';
import { btopModule } from './modules/btop.js';
let storage; try { storage = window.localStorage; } catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); } }; }
const config = readConfig(storage);
const registry = new ModuleRegistry(); registry.register(chatModule); registry.register(usageModule); registry.register(launcherModule); registry.register(journalModule);
registry.register(btopModule);
const input = document.querySelector('#command');
const grid = document.querySelector('#grid');
function layout() {
  grid.classList.toggle('layout-chat', config.layout === 'chat');
  grid.classList.toggle('layout-journal', config.layout === 'journal');
  grid.classList.toggle('layout-btop', config.layout === 'btop');
  document.querySelector('#focus-btop').setAttribute('aria-pressed', String(config.layout === 'btop'));
  document.querySelector('#focus-btop').classList.toggle('cur', config.layout === 'btop');
  document.querySelector('#focus-journal').setAttribute('aria-pressed', String(config.layout === 'journal'));
  document.querySelector('#focus-journal').classList.toggle('cur', config.layout === 'journal');
  document.querySelector('#tile').setAttribute('aria-pressed', String(config.layout === 'tiled'));
  document.querySelector('#focus-chat').setAttribute('aria-pressed', String(config.layout === 'chat'));
  document.querySelector('#tile').classList.toggle('cur', config.layout === 'tiled');
  document.querySelector('#focus-chat').classList.toggle('cur', config.layout === 'chat');
}
function save(patch) {
  Object.assign(config, patch); layout();
  try { storage.setItem('home-harness-v1', JSON.stringify(config)); }
  catch { chat.notify('Local storage unavailable. Preferences apply to this tab only.'); }
  if(patch.layout==='tiled')btop.submit({focus:false});
}
const chat = registry.mount('chat', document.querySelector('#chat-slot'), {
  config, save, notify: text => { input.placeholder = text; },
  setPending: pending => { document.querySelector('#send').disabled = pending; }
});
const usage = registry.mount('usage', document.querySelector('#usage-slot'), { notify() {} });
const launcher = registry.mount('launcher', document.querySelector('#launcher-slot'), { notify() {} });
const journal = registry.mount('journal', document.querySelector('#journal-slot'), { notify() {} });
const btop = registry.mount('btop', document.querySelector('#btop-slot'), { notify() {} });
function openBtop(){save({layout:'btop'});btop.submit();btop.focus?.();}
document.querySelector('#btop-expand').onclick=openBtop;
document.querySelector('#btop-back').onclick=()=>save({layout:'tiled'});
function proposeReset() {
  chat.propose?.({ command: '/layout reset', effects: 'writes browser-local home-harness-v1 layout=tiled only · no files, processes, or provider calls', run: () => save({ layout: 'tiled' }) });
}
document.querySelector('#command-form').addEventListener('submit', event => {
  event.preventDefault(); if (document.querySelector('#send').disabled) return;
  const text = input.value.trim(); if (!text) return;
  if (text === '/help') chat.notify?.('Local commands: /help · /journal · /btop · /layout reset. Other slash commands are unsupported; ordinary text goes to the selected Chat backend (Ollama local / OpenRouter STUB). Cmd/Ctrl+K focuses input; Alt+0 tiles; Alt+1 focuses Chat; Alt+2 focuses Journal; Alt+3 opens real btop.');
  else if (text === '/journal') { save({ layout: 'journal' }); journal.submit(); }
  else if (text === '/btop') openBtop();
  else if (text === '/layout reset') proposeReset();
  else if (text.startsWith('/')) chat.notify?.('Unsupported command. Nothing executed. Use /help.');
  else chat.submit(text);
  input.value = ''; if (!['/journal','/btop'].includes(text)) input.focus();
});
document.querySelector('#tile').onclick = () => save({ layout: 'tiled' });
document.querySelector('#focus-chat').onclick = () => save({ layout: 'chat' });
document.querySelector('#focus-journal').onclick = () => { save({ layout: 'journal' }); journal.submit(); };
document.querySelector('#focus-btop').onclick = openBtop;
document.querySelector('#reset').onclick = proposeReset;
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.focus(); }
  if (event.altKey && ['0', '1', '2', '3'].includes(event.key)) { event.preventDefault(); if(event.key==='3'){openBtop();return;} save({ layout: event.key === '0' ? 'tiled' : event.key === '1' ? 'chat' : 'journal' }); if (event.key === '2') journal.submit(); }
});
function tick() { document.querySelector('#clk').textContent = new Date().toLocaleString('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit', weekday: 'short', day: '2-digit', month: '2-digit' }) + ' CT'; }
tick(); const clock = setInterval(tick, 1000);
window.addEventListener('pagehide', () => { clearInterval(clock); chat.dispose(); usage.dispose(); launcher.dispose(); journal.dispose(); btop.dispose(); }, { once: true });

layout();
if(config.layout==='tiled')btop.submit({focus:false});
