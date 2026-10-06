import http from 'node:http';

const MODEL = /^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,199}$/;
export function validateChat(input) {
  if (!input || Array.isArray(input) || Object.keys(input).sort().join(',') !== 'messages,model' ||
      typeof input.model !== 'string' || !MODEL.test(input.model) ||
      !Array.isArray(input.messages) || !input.messages.length || input.messages.length > 199 ||
      input.messages.some(m => !m || Object.keys(m).sort().join(',') !== 'content,role' ||
        !['user', 'assistant'].includes(m.role) || typeof m.content !== 'string' || !m.content.trim() || m.content.length > 32000) ||
      input.messages.at(-1).role !== 'user') throw new Error('Expected model and bounded user/assistant messages only');
  return input;
}
// Fixed loopback destination, no redirects, environment proxy, URL or header input.
export function ollamaRequest(endpoint, body, signal, timeoutMs) {
  return new Promise((resolve, reject) => {
    let timer;
    const request = http.request({ hostname: '127.0.0.1', port: 11434, path: endpoint,
      method: body ? 'POST' : 'GET', headers: body ? { 'Content-Type': 'application/json' } : {} }, response => {
      const chunks = []; let bytes = 0;
      response.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > 2 * 1024 * 1024) request.destroy(new Error('Ollama response exceeds 2 MiB; output UNKNOWN'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        let data;
        try { data = JSON.parse(Buffer.concat(chunks).toString()); }
        catch { return reject(new Error(`Ollama HTTP ${response.statusCode}: invalid JSON; output UNKNOWN`)); }
        if (response.statusCode !== 200 || data?.error) return reject(new Error(`Ollama HTTP ${response.statusCode}: ${typeof data?.error === 'string' ? data.error.slice(0, 2000) : 'request refused; output UNKNOWN'}`));
        resolve(data);
      });
    });
    const abort = () => request.destroy(new DOMException('Canceled', 'AbortError'));
    request.on('error', error => reject(typeof error.code === 'string' ? new Error(`Ollama connection failed (${error.code}); output UNKNOWN`) : error));
    request.on('close', () => { clearTimeout(timer); signal.removeEventListener('abort', abort); });
    timer = setTimeout(() => request.destroy(new Error(`Ollama timeout after ${timeoutMs / 1000}s; output UNKNOWN`)), timeoutMs);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
    request.end(body ? JSON.stringify(body) : undefined);
  });
}
export class OllamaService {
  constructor({ request = ollamaRequest } = {}) { this.request = request; }
  async tags(signal) {
    const data = await this.request('/api/tags', null, signal, 5000);
    if (!Array.isArray(data?.models) || data.models.some(m => typeof m?.name !== 'string' || !MODEL.test(m.name))) throw new Error('Ollama model list malformed; models UNKNOWN');
    return { models: data.models.map(m => ({ name: m.name, local: !m.remote_host && !m.remote_model && !m.name.endsWith(':cloud') })) };
  }
  async chat(input, signal) {
    validateChat(input);
    const { models } = await this.tags(signal);
    if (!models.some(m => m.name === input.model && m.local)) throw new Error(`Model ${input.model} missing from local tags or remote-only; no chat sent`);
    const data = await this.request('/api/chat', { model: input.model, messages: input.messages, stream: false }, signal, 120000);
    if (data?.done !== true || typeof data.model !== 'string' || data.model !== input.model ||
        data.message?.role !== 'assistant' || typeof data.message.content !== 'string' || !data.message.content.trim() || data.message.content.length > 32000) {
      throw new Error(`Ollama reply incomplete, empty, oversized or model mismatch (returned ${typeof data?.model === 'string' ? data.model.slice(0, 200) : 'UNKNOWN'}); output UNKNOWN`);
    }
    return { type: 'model-output', model: data.model, content: data.message.content };
  }
}
