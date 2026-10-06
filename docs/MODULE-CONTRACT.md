# Home module contract — version 1

The shell is a stable frame; modules own their behavior. The binding visual target for this and later stages is `design/home-harness-mockup.html`, copied unchanged from the approved Studio Ops artifact. The old five-pane prototype is superseded and retained in `prototype/`.

This stage runs as a dependency-free browser app in `harness/`. Native packaging and provider access are unimplemented. Chat and Claude subscription Usage are registered. Launcher remains a labeled design preview. Claude Code statusline support is verified in installed version 2.1.287; actual account payload coverage is 0/2 windows. See INTEGRATIONS.md.

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
- Usage now shows only real local Claude subscription readings or UNKNOWN; no demo gauges or other providers. Launcher process values are always UNKNOWN. UNKNOWN is not zero; run is not connected. Native activation outcomes remain unverified; documented route evidence is separate from process state.

## Stage acceptance

Prove both backend stub paths through the bottom command input; separate histories, pending lock, cancel, explicit unavailable/recovery, literal text rendering, reload without resend, layout persistence, and proposed action run/cancel. Check registry failure isolation and malformed state recovery. Document native/live integration limitations. Add only one module in each later authorized stage.

## Usage module — Stage 02

`usageModule` declares `id:usage`, version 1, read-local-snapshot/refresh/cancel/open-usage-page capabilities, source configuration, initial awaiting-data availability, authority and an explicit error list. It mounts only in `#usage-slot` through the existing registry. Shell changes are restricted to import/register/mount/dispose and replacing that preview slot; Chat files and command routing are unchanged.

Usage has no primary command routing; its required `submit` is a no-op. It owns rendering, local snapshot fetch, refresh state, last-good cache, source disclosure and read-only external usage link. Configuration and authority are exported on the module and detailed in INTEGRATIONS.md. It reads the allowlisted collector file, uses its own `home-claude-usage-v1` cache, and never touches shell/Chat state or another tile's DOM. Invalid cached data is ignored.

Canonical measurements use independent five_hour/seven_day rows with provider/account/product, used/remaining percent, unknown start, supplied end/reset, UTC ISO observation/reset, local source method, authoritative/unavailable confidence and available/stale/unavailable status. No estimates, manual rows, model allocations or other providers. Identity remains unverified; source alias is not a discovered account.

`dispose()` clears the age/refresh timer, aborts in-flight work and releases the tile. Refresh floor 30s with bounded exponential failure backoff to 300s, timeout 5s, no overlap, explicit cancel. Missing/failed windows preserve individual last-good data as stale with original age; reset expiration never manufactures fresh capacity. No credentials, account changes, provider requests, process execution or app embedding. See BUILD-LOG.md for measured evidence and limits.

## Launcher module — Stage 03

`launcherModule` declares identity `launcher`, version 1, filter/keyboard-select/request-url/report-outcome capabilities, dated installation/configuration record, URL-verified/native-unverified availability, explicit errors and authority. Registered/mounted through the existing registry into only `#launcher-slot`. Chat and Usage implementations and command routing are unchanged. Required `submit()` is a no-op: Launcher input is its own labeled filter and links.

Authority is trusted user anchor navigation only. The module owns selection and in-memory request/user-report outcomes; there is no process observation, credential access, native bridge, helper, app control, automatic retry or stored sessions. `dispose()` releases the tile and its element handlers; there are no timers or pending native operations to cancel. Route status separates installation declaration, URL load evidence, unknown activation outcome and user report. PID/STATE/CPU remain UNKNOWN for every route and outcome. Atlas is a URL target, not a native app activation. See INTEGRATIONS.md for actual evidence and the native verification limitation.
