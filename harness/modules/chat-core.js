// OpenRouter remains a local receipt stub; Ollama output is explicitly typed.
export const backends = Object.freeze({
  ollama: { label: 'Ollama · local', model: 'UNKNOWN · select an installed model' },
  openrouter: { label: 'OpenRouter', model: 'not configured' }
});
export function stubSend({ backend, signal, outcome = 'receipt' }) {
  return new Promise((resolve, reject) => {
    if (!backends[backend]) return reject(new Error('Unknown backend'));
    const abort = () => { clearTimeout(timer); reject(new DOMException('Canceled', 'AbortError')); };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      if (outcome === 'unavailable') reject(new Error('STUB: simulated unavailable transport. No provider contacted.'));
      else resolve(`STUB receipt · ${backends[backend].label}: input handled locally. No provider contacted; no model output generated.`);
    }, 650);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}
export class ChatController {
  constructor({ backend = 'ollama', transport = sendChat, model = null, onChange = () => {} } = {}) {
    this.backend = backends[backend] ? backend : 'ollama';
    this.transport = transport; this.model = model; this.onChange = onChange;
    this.conversations = { ollama: [], openrouter: [] }; this.pending = null;
  }
  switchBackend(id) {
    if (this.pending) throw new Error('Cancel or finish pending input before switching.');
    if (!backends[id]) throw new Error('Unknown backend');
    this.backend = id; this.onChange();
  }
  selectModel(model) {
    if (this.pending) throw new Error('Cancel or finish pending input before changing model.');
    this.model = model; this.onChange();
  }
  async send(text, outcome = 'receipt') {
    text = text.trim();
    if (!text || this.pending) return false;
    const backend = this.backend;
    const model = backend === 'ollama' ? this.model : null;
    const message = { text, model, actualModel: null, status: 'pending', receipt: '', at: Date.now() };
    const messages = this.conversations[backend].filter(m => m.status === 'reply' && m.actualModel === model).slice(-99)
      .flatMap(m => [{ role: 'user', content: m.text }, { role: 'assistant', content: m.receipt }]);
    messages.push({ role: 'user', content: text });
    const conversation = this.conversations[backend];
    // Bounded, in-memory history. Eviction never triggers resend.
    if (conversation.length >= 100) conversation.shift();
    conversation.push(message);
    const abort = new AbortController();
    this.pending = { abort, message }; this.onChange();
    try {
      const result = await this.transport({ backend, model, messages, signal: abort.signal, outcome });
      // A late completion cannot turn a user cancel into success.
      if (abort.signal.aborted) throw new DOMException('Canceled', 'AbortError');
      if (typeof result === 'string') { message.receipt = result; message.status = 'receipt'; }
      else {
        if (result?.type !== 'model-output' || result.model !== model || typeof result.content !== 'string' || !result.content.trim()) throw new Error('Model reply invalid; output UNKNOWN');
        message.receipt = result.content; message.actualModel = result.model; message.status = 'reply';
      }
    } catch (error) {
      message.status = error.name === 'AbortError' ? 'canceled' : 'error';
      message.receipt = error.name === 'AbortError' ? (backend === 'openrouter' ? 'STUB canceled locally. Nothing sent; no automatic retry.' : 'Canceled by user. Reply UNKNOWN; Ollama may already have processed input. No automatic retry.') : error.message;
    } finally { this.pending = null; this.onChange(); }
    return true;
  }
  cancel() { this.pending?.abort.abort(); }
  dispose() { this.cancel(); }
}

export async function bridgeRequest({ token, signal, body, fetcher = globalThis.fetch.bind(globalThis), timeoutMs = 125000 }) {
  if (!token) throw new Error('Bridge token unavailable; Ollama connection UNKNOWN. Run node bridge/server.mjs and reload.');
  const abort = new AbortController();
  const cancel = () => abort.abort();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; abort.abort(); }, timeoutMs);
  if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
  try {
    const response = await fetcher('/api/ollama', {
      method: body ? 'POST' : 'GET', signal: abort.signal, credentials: 'same-origin', cache: 'no-store',
      headers: { 'X-Bridge-Token': token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    let data;
    try { data = await response.json(); } catch { throw new Error(`Bridge HTTP ${response.status}: invalid JSON; output UNKNOWN`); }
    if (!response.ok || data?.error) throw new Error(data?.error || `Bridge HTTP ${response.status}; output UNKNOWN`);
    return data;
  } catch (error) {
    if (timedOut) throw new Error(`Chat transport timeout after ${timeoutMs / 1000}s; output UNKNOWN. No automatic retry.`);
    if (signal.aborted) throw new DOMException('Canceled', 'AbortError');
    if (error instanceof TypeError) throw new Error(`Bridge unreachable: ${error.message}; Ollama state UNKNOWN`);
    throw error;
  } finally { clearTimeout(timer); signal.removeEventListener('abort', cancel); }
}
export async function listModels(options) {
  const data = await bridgeRequest({ ...options, timeoutMs: 6000 });
  if (!Array.isArray(data?.models) || data.models.some(m => typeof m?.name !== 'string' || !m.name || typeof m.local !== 'boolean')) throw new Error('Model list malformed; models UNKNOWN');
  return data.models.filter(m => m.local).map(m => m.name);
}
export async function sendChat(args) {
  if (args.backend === 'openrouter') return stubSend(args);
  if (!args.model) throw new Error('Model UNKNOWN: select a model from the real Ollama list. No chat sent.');
  return bridgeRequest({ token: globalThis.document?.querySelector('meta[name="bridge-token"]')?.content,
    signal: args.signal, body: { model: args.model, messages: args.messages } });
}
