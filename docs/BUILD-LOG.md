# Build log

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
