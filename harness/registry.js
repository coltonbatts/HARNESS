export class ModuleRegistry {
  constructor() { this.modules = new Map(); }
  register(module) {
    if (module.version !== 1 || !/^[a-z][a-z0-9-]*$/.test(module.id) || typeof module.mount !== 'function' || !Array.isArray(module.capabilities)) throw new Error('Invalid module contract');
    if (this.modules.has(module.id)) throw new Error('Duplicate module id');
    this.modules.set(module.id, module);
  }
  mount(id, root, context) {
    try {
      const module = this.modules.get(id);
      if (!module) throw new Error(`Module unavailable: ${id}`);
      const instance = module.mount(root, context);
      if (typeof instance?.submit !== 'function' || typeof instance?.dispose !== 'function') throw new Error('Invalid module lifecycle');
      return instance;
    } catch (error) {
      root.textContent = `Module unavailable · ${error.message}`;
      root.classList.add('module-error');
      return { submit: () => context.notify('Module unavailable; input not sent.'), dispose() {} };
    }
  }
}
export function readConfig(storage) {
  try {
    const value = JSON.parse(storage.getItem('home-harness-v1'));
    if (value?.version !== 1) return { version: 1, layout: 'tiled', backend: 'ollama' };
    return { version: 1, layout: ['chat','journal','btop'].includes(value.layout) ? value.layout : 'tiled', backend: value.backend === 'openrouter' ? 'openrouter' : 'ollama' };
  } catch { return { version: 1, layout: 'tiled', backend: 'ollama' }; }
}
