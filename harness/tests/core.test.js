import test from 'node:test';
import assert from 'node:assert/strict';
import { ChatController, stubSend } from '../modules/chat-core.js';
import { ModuleRegistry, readConfig } from '../registry.js';
test('Demo historical stub backend flows produce honest receipts with isolated history', async () => {
  const chat = new ChatController({ transport: stubSend });
  await chat.send('local input');
  assert.match(chat.conversations.ollama[0].receipt, /STUB.*Ollama.*No provider contacted; no model output/);
  chat.switchBackend('openrouter'); assert.equal(chat.conversations.openrouter.length, 0);
  await chat.send('router input');
  assert.match(chat.conversations.openrouter[0].receipt, /STUB.*OpenRouter/);
  assert.equal(chat.conversations.ollama[0].text, 'local input');
});
test('Demo stub pending duplicate rejected, switching locked, cancellation never resends', async () => {
  let calls = 0;
  const chat = new ChatController({ transport: args => { calls++; return stubSend(args); } });
  const first = chat.send('one');
  assert.equal(await chat.send('duplicate'), false);
  assert.throws(() => chat.switchBackend('openrouter'), /Cancel/);
  chat.cancel(); await first;
  assert.equal(chat.conversations.ollama[0].status, 'canceled'); assert.equal(calls, 1); assert.equal(chat.pending, null);
  chat.switchBackend('openrouter');
});
test('Demo stub unavailable transport releases input and retains explicit error', async () => {
  const chat = new ChatController({ transport: stubSend }); await chat.send('test', 'unavailable');
  assert.equal(chat.conversations.ollama[0].status, 'error'); assert.match(chat.conversations.ollama[0].receipt, /STUB.*No provider contacted/); assert.equal(chat.pending, null);
  await chat.send('manual retry'); assert.equal(chat.conversations.ollama[1].status, 'receipt');
});
test('malformed storage and unknown versions recover without replay', () => {
  for (const raw of ['{', '{"version":99}', null]) assert.deepEqual(readConfig({getItem: () => raw}), {version:1,layout:'tiled',backend:'ollama'});
  assert.deepEqual(readConfig({getItem: () => '{"version":1,"layout":"chat","backend":"openrouter","secret":"ignored"}'}), {version:1,layout:'chat',backend:'openrouter'});
  assert.equal(new ChatController().conversations.ollama.length, 0);
});
test('registry rejects duplicates and isolates missing/throwing module', () => {
  const registry = new ModuleRegistry();
  const module = {id:'chat',version:1,capabilities:[],mount(){throw new Error('offline');}};
  registry.register(module); assert.throws(() => registry.register(module), /Duplicate/);
  for (const id of ['chat','missing']) {
    const root = {textContent:'',classList:{add(){}}};
    const instance = registry.mount(id,root,{notify(){}});
    assert.match(root.textContent,/unavailable/); instance.submit('ignored'); instance.dispose();
  }
});
