# Build log

## Stage 02 — Claude subscription Usage · October 6, 2026

Completed only the registered Usage module for **Claude subscription 5-hour + weekly windows**. Replaced its design preview; no other provider or API-dollar reading. Chat source files, registry, command input routing, Launcher implementation and binding mockup are unchanged. Shell edits are only import/register/mount/dispose for Usage; layout boundaries are retained.

### Checkpoint and implementation

First created root checkpoint **`b1f8cbd`**, `[codex] Checkpoint stage 01 prototype and harness shell with Chat`, covering all existing planning, prototype and harness files before Stage 02 edits. The Stage 02 commit includes this record; its hash is recorded in Studio Ops after commit creation. No push/deployment.

Run remains `python3 -m http.server 4174 --bind 127.0.0.1 --directory harness`; open http://127.0.0.1:4174. Existing server retained and deliverable browser tab left open.

- `usageModule` registered through the existing version-1 registry, with declared capabilities/configuration/availability/errors/authority and disposal in `harness/modules/usage.js`; contract documented in MODULE-CONTRACT.md.
- `usage-core.js` normalizes separate provider/account/product/window measurements with explicit used/remaining percent, supplied end/reset, unknown start, UTC observation/reset, local source method and authoritative/unavailable confidence. Missing values never coerce to zero. No inferred model allocations.
- `scripts/claude-statusline.mjs` reads documented stdin only, validates and allowlists the two window pairs, drops all other payload fields, atomically writes a 0600 sanitized local file. Runtime captures are git-ignored. Project `.claude/settings.json` configures this collector; no global Claude configuration/credentials changed. Runtime Claude invocation is unverified; command uses this checkout's absolute path and requires node on PATH.
- Local same-origin fetch only; credentials omitted. 30-second minimum refresh, exponential failure backoff to 5 minutes, bounded Retry-After handling, 5-second timeout, no overlap, explicit cancel and disposal abort. Missing/failed/older windows retain individual last-good readings stale with original age. Five-minute TTL/reset expiry also mark stale. Rereading a file never changes its observation timestamp.
- Browser cache stores only whitelisted individual observations and starts stale on reload. Invalid cache ignored; storage failure reported. Sources disclosure explains interface and account limits; direct Claude usage link supplies the fallback.

Research preceded implementation. Colton explicitly answered **Yes, I use Claude Code**. `claude --version` returned 2.1.287; installed program inspection confirmed the two documented emitter field shapes. No existing user statusLine was configured. Official sources and precise evidence are in INTEGRATIONS.md. Correction recorded there: current Spend Limits API serves Claude Enterprise organizations, so the requested blanket “API billing only” claim is too broad. None of the three organization APIs supplies consumer subscription capacity; none was used.

### Verification evidence

| Check | Result |
| --- | --- |
| Full Node suite | **16/16 pass** — 5 unchanged Chat/registry tests + 11 Usage checks |
| Missing/null/malformed | Absent, null, string, boolean, NaN/Infinity/out-of-range percentages → unavailable/null; explicit 0/100 remain valid |
| Window/time validation | Invalid observation/calendar dates, timezone-less/future timestamps, malformed/reset-expired/out-of-window resets rejected; no invented start |
| Timezone | Chicago daylight-saving and standard time produce CDT/CST; persisted observations normalize to UTC ISO |
| Scope/cache | Duplicate measurements deduplicated; partial/older windows retain stale last good; separate original timestamps survive cache |
| Stale/offline/auth/429 | Failures preserve data, release pending state, respect backoff; same old capture stays stale; TTL and reset expiration tested |
| Cancel/timeout/dispose | No overlapping refresh; cancel aborts, disposed source stops; even a source ignoring abort cannot hang past timeout |
| Backoff | 30/60/120/240/300/300 second sequence; reads blocked before next permitted time |
| Source fetch | Same-origin data file, no-store, credentials omitted, passed abort signal; HTTP missing/auth/429, malformed JSON, offline failures handled without leaking exception detail |
| Collector | Synthetic documented input written to isolated temporary file, only allowed fields survive, malformed/missing windows null; test files removed |
| Browser live fallback | Exactly 5-hour and weekly rows UNKNOWN; 0/2 fresh windows; no other Usage provider or demo quota |
| Browser sources/link | Source limitations visible; direct link href verified as https://claude.ai/settings/usage; no external navigation performed |
| Failure isolation | Chat still returned its honest STUB receipt alongside unavailable Usage |
| Narrow 390×844 | Scroll width equals viewport width (390); input bottom 827px remains in viewport; Usage visible/scrollable |
| Desktop 1200×752 | Binding tile proportions preserved, bottom input visible; sources tab works |
| Console/syntax/diff | Checked browser warning/error list empty; JS syntax checks and git diff --check pass |
| Preservation | `git diff` confirms Chat files, registry and binding mockup unchanged |

Screenshots: `docs/evidence/usage-unknown.jpg`, `usage-sources.jpg`, `usage-narrow.jpg`. Numeric/failed/stale scenarios were tested with synthetic inputs in isolated Node tests, never presented in the browser as live capacity. A test-helper default incorrectly replaced undefined with 32; corrected the fixture to explicitly assign undefined, then all checks passed. No provider data was invented to make the UI populated.

### Actual coverage and limits

**Real account readings observed: 0/2 windows.** Installed interface existence is verified statically; installed runtime delivery of a real account payload is unverified. The project collector is configured for ordinary Claude Code activity in this repo and normal trust/settings precedence. No model request was launched to obtain a reading. Until such a payload arrives both rows correctly stay UNKNOWN, with direct usage-page action. Exact plan/account identity and window starts remain unknown. “Authoritative” is local-interface provenance, not independent billing verification; capture age cannot reveal the upstream age of cached data inside Claude Code.

No cookies scraped/decrypted, no session credentials reused/extracted, no undocumented authenticated endpoints, no provider billing access, no external app embedding/control, no sessions invented, no publication/spending/credential/permission changes, no global settings changes or agents. No manual snapshot UI added. Native packaging remains unimplemented. Stage 03 not started. Next action: user review / normal Claude Code use here to observe a real payload; any broader capture scope or next module is a separate request.

## Stage 01 — harness reset: shell + Chat · October 6, 2026

Completed the authorized shell and first module only. Runnable dependency-free web shell in `harness/`; native Mac packaging remains unimplemented. Old `prototype/` and its evidence are preserved. The approved mockup is copied byte-for-byte to `docs/design/home-harness-mockup.html` and binds this and later stages. No rejected glass mockup was used.

### Run and artifacts

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory harness
node --test harness/tests/core.test.js
```

Open http://127.0.0.1:4174. Loopback-only server left running in this session, app tab marked as deliverable. Historical prototype's existing port 4173 server was left alone. No dependency installation/build step.

- `harness/index.html`, `style.css`, `shell.js`: WM bar, Chicago clock, translucent tiled layout, bottom primary input, focus/tile navigation, configuration and allowlisted local commands.
- `harness/registry.js`: versioned module contract validation and mount failure isolation; defensive versioned local configuration.
- `harness/modules/chat.js`, `chat-core.js`: only registered module. One surface, two explicitly labeled STUB backends, separate real user-input histories, pending/error/cancel/receipt states and text prefixes. No fabricated model output.
- `docs/MODULE-CONTRACT.md`: interface, state, authority, transport and lifecycle.
- `docs/BUILD-PROMPTS.md`: shell-first Stage 01; Usage only in Stage 02, Launcher only in Stage 03; one selected module per later stage. All original honesty instructions retained verbatim in a clearly superseded reference block and `docs/archive/BUILD-PROMPTS-fixed-dashboard.md` (verified exact containment). README and spec direction note now reflect the reset.

Usage and Launcher are design previews outside the registry, not completed modules. Block-character Demo gauges, separate API USD and honest UNKNOWN rows; Demo process table with working local filter and accurate displayed count. No app-opening or signals capability.

### Evidence and checks

| Check | Observed result |
| --- | --- |
| Mockup copy | `cmp` passed against approved Studio Ops file |
| Node tests | 5/5 passed: both stub backend receipts/isolated histories; pending duplicate lock and cancel; unavailable/recovery; malformed/unknown storage; duplicate/missing/throwing modules |
| Syntax | `node --check` passed for shell and Chat rendering |
| Browser Ollama | Actual typed input via bottom bar → STUB receipt explicitly saying no provider contacted/no model output |
| Browser OpenRouter | Actual typed input → OpenRouter STUB receipt; switch back restored only Ollama input history |
| Pending | Send and backend selection disabled; explicit cancel gave local canceled receipt, no resend |
| Unavailable | Models test outcome produced labeled simulated error; restored receipt mode allowed manual new input |
| Literal text | HTML-looking user input rendered as text; transcript contained 0 img elements |
| Relaunch | Selected OpenRouter and Chat-focused layout restored; conversations empty; no resend |
| Proposed action | Cancel kept Chat-focused layout; stage kept proposal without applying; explicit run restored tiled layout |
| Keyboard | Cmd+K focused command input |
| Launcher filter | `hermes` produced one Demo row and 1/6; clearing restored 6/6 |
| Default desktop | 1280×720 tiled layout and visible bottom input |
| Compact and narrow | 800×900 and 390×844 stacked/scrollable tiles; document scroll widths equal viewport widths; bottom input visible |
| Console | No warning/error entries in checked tab |

Final screenshots: `docs/evidence/harness-desktop.jpg`, `harness-compact.jpg`, `harness-narrow.jpg`, `harness-proposed-action.jpg`. Desktop screenshot contains actual user test input and a STUB receipt, not a staged model conversation. Top-bar wrapping and scrollable preview bodies were corrected during checks; final narrow/compact captures refreshed.

### Limits and stopping point

The browser blocked the approved mockup's file URL because only http/https are allowed. Browser reference inspection is **unverified**; its HTML/CSS was read directly, copied unchanged, and used as the layout/style basis. No attempt was made to bypass that URL policy. The independently implemented runnable app was inspected through its own loopback URL.

Live chat providers: **0**; usage sources: **0**; external sessions attached: **0**. Both chat adapters are local transport stubs; Ollama model label is explicitly unverified; OpenRouter model is not configured. No real generated/streamed output or credential flow proved. Cancel/error are transport-stub checks, not provider protocol claims. Chat history is in-memory, bounded to 100 inputs per backend; only backend/layout preferences persist, with fallback on unavailable or malformed storage. No external app embedding/opening/control, process observation, publication, spending, credential/permission changes, agents, or arbitrary shell execution.

Original checkout remains unborn `master`; original and new files remain uncommitted/untracked. No deployment or installation. Studio Ops task/handoff updated and writing ownership released. Stage 02 was not started. Next action is user review of this shell; any live Usage, Launcher, native packaging or provider work requires a separate stage request.

## Historical Stage 01 — fixed five-pane visual prototype · SUPERSEDED · October 6, 2026

Completed only the visual-prototype stage. Runnable, dependency-free HTML/CSS/JavaScript in `prototype/`. The dark, warm workspace uses a fixed tool rail, a two-by-two tool split, and a shared usage column. All four tools stay discoverable when panes are collapsed or focused. No previous Dashboard attempts were inspected or imported.

### Run

From `/Users/coltonbatts/Documents/ChatGPT/DASHBOARD`:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory prototype
```

Open <http://127.0.0.1:4173>. Stop with Ctrl+C. No build step, package installation, network fonts, or dependencies. `prototype/index.html` can also be opened as a local file, though browser storage behavior for file URLs varies. Use the loopback server for the verified experience.

### Implemented

- Dedicated Cursor, Claude, ChatGPT, Hermes panes; shared Model usage.
- Pointer and keyboard resizing of tool columns, tool rows, and tool/usage split. Splitters have accessible names, bounds, and current values; focus one and use arrow keys.
- Collapse/expand, focus/unfocus, swap tool rows, restore default arrangement.
- Browser-local persistence of arrangement, selected/focused pane, collapse state, resize values, and demo scenario; versioned prototype storage key with validation and fallback.
- Cmd/Ctrl+1–4 selects the tools; Cmd/Ctrl+5 selects usage; Cmd/Ctrl+0 returns Home. Cmd/Ctrl+K opens the searchable command palette; arrows/Enter choose; Escape dismisses dialogs or returns from focus.
- Below 900px, a selected-pane view replaces tiny tiles. Tool navigation remains available; at phone widths, labeled accessible icon buttons save space.
- Overview illustrates empty Cursor, stale Claude fixture, disconnected ChatGPT, and unavailable Hermes. The scenario selector exercises each state across all panes and usage.
- Usage distinguishes example provider/account/product, subscription windows, API dollars, source method, observation timestamps, demo resets, and America/Chicago timezone. Unknown values do not become zero.
- Every Open action displays a preview dialog. Refresh demo gives local-only feedback; it does not request account data. All usage, status, and session context are explicitly Demo.

### Verification evidence

Ran the loopback server and exercised the UI in the Codex browser:

| Check | Observed result |
| --- | --- |
| Four Open previews | Correct named dialogs; no external app launched |
| Collapse/expand and reload | Tool and usage bodies collapse; saved usage collapse survives reload |
| Focus/unfocus | Tool and usage fill the workspace; Escape restores grid |
| Row swap/reset | Hermes moves to first row; reset restores original order and 69/50/50 splits |
| Three keyboard splitters | Values changed to 67/52/48 and survived reload |
| Pointer resize | Tool/usage divider dragged from 69 to 66 |
| Pane shortcuts/palette | Cmd+4 selected Hermes; search + arrow + Enter focused Hermes |
| Empty/disconnected/unavailable | Explicit states; both missing usage values shown as Unknown |
| Stale | Dated fixture retained and labeled stale |
| Refresh demo | Toast explicitly says no provider contacted |
| Desktop 1440×900 | Five panes; scrolling usage body; persistent refresh footer |
| Compact 800×900 | One selected pane; all four tools and usage in rail; usage appears at workspace top |
| Narrow 390×844 | Selected pane; document width and scroll width both 390px |
| Browser console | No warning/error entries during checks |
| JavaScript syntax | `node --check prototype/app.js` passed |

A responsive/focused usage-placement defect was found and corrected during verification. Removed a decorative session arrow to avoid implying an unsupported session action. Final captures:

- `evidence/home-desktop.jpg`
- `evidence/home-compact.jpg`
- `evidence/home-narrow.jpg`
- `evidence/home-commands.jpg`

### Limits and next action

This is a visual prototype, not the native Mac v0.1 release. Live sources: **0**. No external apps embedded/opened/controlled, no accounts connected, no installation, permission changes, publication, or agents launched. Browser-local persistence is an experience prototype, not the final durable configuration system. Rearrangement is bounded row swapping, not arbitrary docking. At short heights, panes can scroll. Demo time is fixed to October 6, 2026; it is not a live status clock.

Review the feel, density, default arrangement, and compact navigation with Colton. Only after that feedback and a separate request, proceed to stage 02: prove native app access, identify usage accounts/products, and evaluate supported Hermes surfaces before choosing architecture. No commit or deployment created. Existing planning files preserved.
