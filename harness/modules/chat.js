import { ChatController, backends, listModels } from './chat-core.js';
export const chatModule = {
  id: 'chat', version: 1, title: 'Chat', capabilities: ['submit', 'cancel', 'backend-select', 'model-list', 'model-select'], availability: 'ollama-live-or-unavailable/openrouter-stub',
  mount(root, context) {
    root.innerHTML = `<div class="tbar"><button class="tab on" id="command-tab" aria-pressed="true">command</button><button class="tab" id="models-tab" aria-pressed="false">models</button><span class="rt"><select aria-label="Chat backend" id="backend"><option value="ollama">◉ ollama</option><option value="openrouter">◉ OpenRouter</option></select><span class="notice" id="backend-status">UNKNOWN</span></span></div><div class="pbody" id="chat-body"><div class="ctx">Home-owned, in-memory conversation · 0 external sessions attached<br><span id="model"></span> · <span id="source"></span></div><div id="transcript" role="log" aria-label="Chat transcript" aria-live="polite"></div><div class="notice" id="chat-state" role="status"></div><div id="proposal"></div><button id="cancel" hidden>[ cancel pending input ]</button></div><div class="pbody models" id="models-body" hidden><div id="ollama-models"><label>Installed local Ollama model<select id="ollama-model" aria-label="Ollama model"></select></label><button id="refresh-models">[ refresh models ]</button><p id="model-state" role="status">Models UNKNOWN</p></div><div id="stub-models"><p>OpenRouter is STUB. No credentials, provider request, or model output.</p><label>Test transport<select id="outcome" aria-label="Test transport"><option value="receipt">STUB receipt</option><option value="unavailable">STUB unavailable</option></select></label></div><p>Chat messages live only in this tab. Reload clears them; selected backend and layout persist locally. Cancel/finish before changing backend. No automatic retries.</p></div>`;
    const find = id => root.querySelector(`#${id}`);
    const controller = new ChatController({ backend: context.config.backend, onChange: render });
    let disposed = false, models = [], modelState = 'Models UNKNOWN', discovery = null;
    const token = document.querySelector('meta[name="bridge-token"]')?.content;
    async function refreshModels() {
      if (discovery || controller.pending || disposed) return;
      discovery = new AbortController(); modelState = 'Reading real Ollama /api/tags…'; render();
      try {
        models = await listModels({ token, signal: discovery.signal });
        if (!models.includes(controller.model)) controller.model = models[0] || null;
        modelState = models.length ? `Observed ${models.length} local model(s) from /api/tags. Chat capability is verified only by a successful reply.` : 'No local models reported; model UNKNOWN. Install a chat-capable model in Ollama yourself, then refresh.';
      } catch (error) { models = []; controller.model = null; modelState = error.message; }
      finally { discovery = null; render(); }
    }
    function render() {
      if (disposed) return;
      find('backend').value = controller.backend;
      find('backend').disabled = Boolean(controller.pending);
      const local = controller.backend === 'ollama';
      find('backend-status').textContent = local ? 'LOCAL · Ollama' : 'STUB';
      find('source').textContent = local ? '127.0.0.1:11434 · no external sessions' : 'STUB · no provider connection';
      find('model').textContent = local ? (controller.model || 'model UNKNOWN') : backends.openrouter.model;
      find('ollama-models').hidden = !local; find('stub-models').hidden = local;
      find('refresh-models').disabled = Boolean(discovery || controller.pending);
      find('ollama-model').disabled = Boolean(discovery || controller.pending || !models.length);
      find('model-state').textContent = modelState;
      const select = find('ollama-model'); select.replaceChildren();
      for (const name of models.length ? models : ['UNKNOWN']) {
        const option = document.createElement('option'); option.value = name; option.textContent = name; select.append(option);
      }
      select.value = controller.model || 'UNKNOWN';
      find('cancel').hidden = !controller.pending;
      context.setPending(Boolean(controller.pending));
      const list = find('transcript'); list.replaceChildren();
      for (const msg of controller.conversations[controller.backend]) {
        line('you', msg.text, msg.at);
        const pendingText = local ? `Ollama pending · requested ${msg.model || 'UNKNOWN'} · waiting for actual reply` : 'STUB transport pending · nothing sent to a provider';
        line(msg.status === 'reply' ? 'ollama' : 'home', msg.status === 'pending' ? pendingText : msg.receipt, msg.at);
        if (local) line('home', `${msg.status} · requested model: ${msg.model || 'UNKNOWN'} · returned model: ${msg.actualModel || 'UNKNOWN'}`, msg.at);
      }
      function line(who, text, at) {
        const row = document.createElement('div'); row.className = 'line';
        const speaker = document.createElement('span'); speaker.className = `who ${who}`; speaker.textContent = who;
        const time = document.createElement('span'); time.className = 'ts'; time.textContent = new Date(at).toLocaleTimeString('en-GB', { timeZone: 'America/Chicago', hour: '2-digit', minute: '2-digit' });
        const said = document.createElement('span'); said.className = 'said'; said.textContent = text;
        row.append(speaker, time, said); list.append(row);
      }
      find('chat-state').textContent = local && !controller.model ? modelState : controller.conversations[controller.backend].length ? (local ? 'Local Ollama · actual replies only · America/Chicago' : 'STUB · no model output · America/Chicago') : 'Empty conversation · type in the command bar below. /help lists local commands.';
      if (controller.pending) find('chat-body').scrollTop = find('chat-body').scrollHeight;
    }
    function showTab(name) {
      find('chat-body').hidden = name !== 'command'; find('models-body').hidden = name !== 'models';
      for (const id of ['command', 'models']) { find(`${id}-tab`).classList.toggle('on', id === name); find(`${id}-tab`).setAttribute('aria-pressed', String(id === name)); }
    }
    find('backend').onchange = event => { controller.switchBackend(event.target.value); context.save({ backend: controller.backend }); };
    find('command-tab').onclick = () => showTab('command');
    find('models-tab').onclick = () => showTab('models');
    find('cancel').onclick = () => controller.cancel();
    find('refresh-models').onclick = refreshModels;
    find('ollama-model').onchange = event => controller.selectModel(event.target.value);
    render();
    refreshModels();
    return {
      submit(text) { showTab('command'); if (controller.backend === 'ollama' && discovery) { this.notify('Wait for model discovery to finish before sending. Nothing sent.'); return false; } return controller.send(text, find('outcome').value); },
      notify(text) { showTab('command'); find('chat-state').textContent = text; },
      propose({ command, effects, run }) {
        showTab('command');
        const container = find('proposal'); container.replaceChildren();
        const block = document.createElement('div'); block.className = 'act';
        const heading = document.createElement('div'); heading.className = 'h'; heading.textContent = '⚠ PROPOSED LOCAL ACTION — runs only after [ run ]';
        const cmd = document.createElement('div'); cmd.className = 'cmd'; cmd.textContent = `▸ ${command}`;
        const effect = document.createElement('div'); effect.className = 'f'; effect.textContent = effects;
        const buttons = document.createElement('div'); buttons.className = 'btns';
        for (const action of ['run', 'stage for review', 'cancel']) {
          const button = document.createElement('button'); button.className = `btn ${action === 'run' ? 'run' : ''}`; button.textContent = `[ ${action} ]`;
          button.onclick = () => { if (action === 'stage for review') { effect.textContent = `${effects} · staged here only; not executed`; return; } container.replaceChildren(); if (action === 'run') { run(); this.notify('Local layout action completed. No external command executed.'); } else this.notify('Proposed action canceled. Nothing written.'); };
          buttons.append(button);
        }
        block.append(heading, cmd, effect, buttons); container.append(block);
      },
      dispose() { disposed = true; discovery?.abort(); controller.dispose(); root.replaceChildren(); }
    };
  }
};
