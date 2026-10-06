// No network or generated model text: the adapter returns an explicit transport receipt.
export const backends = Object.freeze({
  ollama: { label: 'Ollama · local', model: 'qwen3-coder (unverified)' },
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
  constructor({ backend = 'ollama', transport = stubSend, onChange = () => {} } = {}) {
    this.backend = backends[backend] ? backend : 'ollama';
    this.transport = transport; this.onChange = onChange;
    this.conversations = { ollama: [], openrouter: [] }; this.pending = null;
  }
  switchBackend(id) {
    if (this.pending) throw new Error('Cancel or finish pending input before switching.');
    if (!backends[id]) throw new Error('Unknown backend');
    this.backend = id; this.onChange();
  }
  async send(text, outcome = 'receipt') {
    text = text.trim();
    if (!text || this.pending) return false;
    const backend = this.backend;
    const message = { text, status: 'pending', receipt: '', at: Date.now() };
    const conversation = this.conversations[backend];
    // Bounded, in-memory history. Eviction never triggers resend.
    if (conversation.length >= 100) conversation.shift();
    conversation.push(message);
    const abort = new AbortController();
    this.pending = { abort, message }; this.onChange();
    try {
      message.receipt = await this.transport({ backend, signal: abort.signal, outcome });
      message.status = 'receipt';
    } catch (error) {
      message.status = error.name === 'AbortError' ? 'canceled' : 'error';
      message.receipt = error.name === 'AbortError' ? 'STUB canceled locally. Nothing sent; no automatic retry.' : error.message;
    } finally { this.pending = null; this.onChange(); }
    return true;
  }
  cancel() { this.pending?.abort.abort(); }
  dispose() { this.cancel(); }
}
