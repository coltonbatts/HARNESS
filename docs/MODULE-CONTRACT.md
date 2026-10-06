# Home module contract — version 1

The shell is a stable frame; modules own their behavior. The binding visual target for this and later stages is `design/home-harness-mockup.html`, copied unchanged from the approved Studio Ops artifact. The old five-pane prototype is superseded and retained in `prototype/`.

This stage runs as a dependency-free browser app in `harness/`. Native packaging and provider access are unimplemented. Usage and Launcher tiles are labeled design previews, not registered integrations. Only Chat is registered.

## Boundary

`harness/shell.js` owns layout, the WM bar and America/Chicago clock, the primary bottom command input, local configuration, registry, and routing of supported local commands. It never parses model text as an action. It does not own Chat transcripts or transport logic.

`harness/registry.js` validates module identity, version, capability list and mount lifecycle. Missing modules and mount failures render unavailable without blocking the rest of the workspace. Register a new module and assign a shell slot in a future authorized stage; no shell-specific backend branches are needed.

A module exports this shape:

```js
{
  id: 'chat',                 // unique stable lowercase identifier
  version: 1,                // module contract version
  title: 'Chat',
  capabilities: ['submit', 'cancel', 'backend-select'],
  availability: 'stub',      // actual capability status, never upgraded by layout
  mount(root, context) {     // root is the module's isolated tile
    return { submit(text), dispose(), notify(text), propose(action) };
  }
}
```

`submit` and `dispose` are required by the registry; `notify` and `propose` are optional UI services implemented by Chat. `context` supplies validated `config`, `save(patch)`, `setPending(boolean)`, and `notify(text)`. Modules must not access another module's DOM or state. A future module with a different primary input capability must explicitly declare its command routing before adding it. All modules must declare configuration, source/availability, errors, authority, and disposal behavior in their stage documentation.

Chat owns backend selection, separate in-memory conversations, text-prefix rendering, model labels, pending/error/canceled/receipt states and proposed-action presentation. `chat-core.js` owns the transport boundary and lifecycle. The transport takes `{backend, signal, outcome}` and returns a receipt Promise in this stub implementation. A future real transport must introduce an explicitly distinguished model-output type and verified configuration; it must never present these receipts as generated output.

## State and truth

- Persisted key: `home-harness-v1`; schema `{version:1, layout:'tiled'|'chat', backend:'ollama'|'openrouter'}`. Only these fields are loaded; malformed/unknown versions fall back to defaults. Storage errors leave the shell usable for the tab and report the limit.
- Messages are bounded to 100 inputs per backend and kept in memory only. Reload begins an empty conversation and never resends. No external sessions exist or are enumerated. Selecting a backend is not attaching a session.
- Both Ollama and OpenRouter are explicitly **STUB**. Ollama's model name is an unverified visual placeholder; OpenRouter has no configured model. Neither adapter performs network I/O, reads credentials, probes processes, or invokes an external app.
- A send records the user's actual input, locks duplicate sends and backend switching, and returns a labeled transport receipt. Cancellation is local; unavailable is a labeled test outcome. No automatic retries or fallback between providers. Disposal cancels pending input.
- Backend/source output is inert text via `textContent`. It cannot authorize actions. Slash commands are an allowlist: `/help`, `/layout reset`; unsupported commands are rejected. Arbitrary shell execution is absent.
- `/layout reset` drafts a local action naming the storage key and effect. `[ stage for review ]` keeps it in the tile; `[ cancel ]` writes nothing; `[ run ]` writes only the selected layout. This block is authored by the shell, never inferred from chat output.
- Usage figures and process values are DEMO. UNKNOWN is not zero, API dollars and subscription percentages remain separate, run is not connected. Usage sources: 0. Launcher execution: absent.

## Stage acceptance

Prove both backend stub paths through the bottom command input; separate histories, pending lock, cancel, explicit unavailable/recovery, literal text rendering, reload without resend, layout persistence, and proposed action run/cancel. Check registry failure isolation and malformed state recovery. Document native/live integration limitations. Add only one module in each later authorized stage.
