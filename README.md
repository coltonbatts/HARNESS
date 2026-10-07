# HARNESS — Colton's Home

October 7 completion plan: [current assessment](docs/STATUS-2026-10-07.md), [new v1 specification](docs/PRODUCT-SPEC.md), and [stages 07–15 build prompts](docs/BUILD-PROMPTS.md). Stages 01–09 are complete locally. Colton-selected Stage 09 adds live read-only Codex usage and replaces ChatGPT/Atlas with Codex; shell/settings moves to the next slot. **80/80 tests pass** under ordinary and controlled dates. Stage 08's ChatGPT HTTPS evidence remains dated history. Stage 07 restored the baseline: **63/63 tests pass** at ordinary time and controlled Chicago dates on both sides of midnight. The earlier October 7 58/59 assessment and October 6 59/59 evidence remain dated history. Journal date/reload/recovery and conflicts were verified in an isolated real UI; no new user-facing feature was added.

Journal is now available: click workspace **2**, press **Alt+2**, or type **`/journal`**. Write a few words and click `[ save entry ]` (Cmd/Ctrl+Enter in the reflection box). Choose a date or saved history to edit earlier entries. Browser drafts recover unsaved text; a successful save writes a private dated JSON file under `.journal/`, outside Git and static serving. `[ export .md ]` writes current text to `.journal/exports/YYYY-MM-DD-journal.md`; repeated exports replace that day's export. If the bridge is unavailable, export offers copyable Markdown. Layout reset does not touch entries. Reload the page after a bridge restart to get its new token.

Activity notes are written by you. Journal can now read selected project/task records and generate a separate recap of model-selected exact source quotes through local Ollama: `[ refresh models ]`, select a local model, then `[ generate recap ]`. Processing stays on this machine; coverage is explicitly incomplete. Save archives the generated field; copying into your notes requires an explicit action. Hermes activity, assistant retrieval and scheduled reminders remain pending. See [Journal design and implemented scope](docs/DAILY-JOURNAL.md).

A stable shell with swappable modules. The [terminal layout reference](docs/design/home-harness-mockup.html) retains its tile structure; the October 7 [gothic CRT visual pass](docs/UI-STYLE.md) supersedes its palette. The old fixed five-pane prototype is superseded and preserved in `prototype/`.

Stages 01–06: runnable local bridge and web shell, **real local Ollama Chat and labeled OpenRouter stub**, and registered **Claude subscription Usage**. WM bar, translucent terminal tiles, bottom command input, text-prefix chat, backend selection, local layout/selection persistence and explicit proposed local actions. Usage supports Claude subscription captures and account-wide Codex subscription windows through the official local daemon protocol. Plan/duration/source/reset/observation labels are shown; no account identifiers are exposed. The Codex daemon must already be running; HARNESS never starts it or touches credentials. Real local Claude capture coverage is **2/2 windows**; current readings retain their source and freshness labels. Launcher reads real main-process PID/state/CPU through the bridge and dispatches fixed app paths on user activation. Cursor/Claude/Codex/Hermes are the four destinations. Codex native dispatch plus the exact already-running process verified October 7; its filename is ChatGPT.app but its pinned bundle identity is com.openai.codex. Atlas and its HTTPS route are removed. Focus is UNKNOWN. Browser-only fallback keeps all process fields UNKNOWN. Native Mac packaging remains unimplemented.

## Run

Requires Node.js 22 or newer. Clone and run:

```sh
git clone https://github.com/coltonbatts/HARNESS.git
cd HARNESS
node bridge/server.mjs
```

In an existing checkout, run `node bridge/server.mjs` from its root. The active local checkout is `/Users/coltonbatts/Documents/ChatGPT/DASHBOARD`.

Open <http://127.0.0.1:4175>. Node stdlib only; no installation or build step. This supersedes the Python command for normal use. ES modules require serving; file URLs retain a static UNKNOWN Launcher fallback. Stop with Ctrl+C. The prior prototype uses port 4173 and is a historical artifact.

Type in the bottom bar and press Enter or `[ send ]`. Switch Ollama/OpenRouter in the Chat header. **Ollama is real local Chat** at `127.0.0.1:11434`, using the existing bridge with no `OLLAMA_ORIGINS` changes. Start Ollama yourself with an installed chat-capable model, then use **models → refresh models**. Selection comes from real `/api/tags` (first local model initially selected); each reply records the model used. Chat capability is verified only by a successful reply. **OpenRouter stays STUB** with its original local receipt and labeled unavailable test; no OpenRouter requests or credentials. Cancel pending input explicitly; a submitted Ollama request may already have been processed. No automatic retries or fallback. Connection/HTTP/model errors and timeouts preserve their observed reason; missing or empty output stays UNKNOWN. Replies are non-streaming, with a 120s upstream deadline. Messages stay in memory and clear on reload without resend; backend/layout persist locally. Model selection is tab-local. Prior completed exchanges for the selected model supply context; failed/canceled inputs are excluded.

Cmd/Ctrl+K focuses input. Alt+0 tiles; Alt+1 focuses Chat. `/help` lists commands. `/layout reset` proposes a layout-only local storage write; `[ run ]` applies it, `[ cancel ]` writes nothing, and `[ stage for review ]` keeps the proposal visible. Unsupported commands never execute. Launcher filters installed-tool destinations; arrows/Home/End select, Enter focuses the selected button/link and a second Enter requests activation/navigation. Reports are explicitly user observations, never process knowledge.

## Tool destinations

Cursor, Claude, Codex and Hermes use verified approved bundles. Codex is pinned to `com.openai.codex` / executable `ChatGPT`, currently `/Applications/ChatGPT.app`. Without the local bridge, Codex is CLI-only: run `codex` in your terminal. Process observation, dispatch receipts and user reports remain separate; focus is UNKNOWN.

Missing/moved app: select its row (filter/arrow keys), expand **Configure / re-select app bundle**, enter its canonical `.app` path under `/Applications` or your `~/Applications`, then press **register bundle · does not open**. Only the selected tool's approved bundle identity/main executable is accepted; no command/argument field. Registering never launches. Open separately with the tool button. Failed re-selection preserves the previous registration. Paths persist privately in git-ignored `.launcher/registrations.json`; restart revalidates them, clears receipts and requires page reload for a new token. Malformed stores are preserved and refused. See [registration boundary](docs/LAUNCHER-REGISTRATION.md) for exact authority, argv and recovery limits. Browser-only Cursor/Claude/Hermes scheme links remain explicitly unverified; Codex offers the terminal next action.

Codex Usage reads only `account/read` (no token refresh), `account/rateLimits/read`, and account-wide `account/usage/read` through the fixed local daemon Unix WebSocket route. Missing/unauthenticated/old daemons show the observed unavailable reason; last-good windows remain STALE and missing values stay UNKNOWN. Refresh/cancel/backoff is bounded. USD estimates remain UNKNOWN because the pinned schema exposes them only for forbidden thread-scoped reads. See [Codex usage boundary](docs/CODEX-USAGE.md).

## Checks and boundaries

```sh
node --test harness/tests/*.test.js
HARNESS_TEST_NOW=2026-10-07T04:59:59Z node --import ./harness/tests/helpers/controlled-clock.mjs --test harness/tests/*.test.js
HARNESS_TEST_NOW=2026-10-07T05:00:00Z node --import ./harness/tests/helpers/controlled-clock.mjs --test harness/tests/*.test.js
```

See [Build log](docs/BUILD-LOG.md) for evidence and limits, [Module contract](docs/MODULE-CONTRACT.md) for the implemented boundary, and [Build prompts](docs/BUILD-PROMPTS.md) for the completion sequence. [Product specification](docs/PRODUCT-SPEC.md) defines the proposed completion scope; prior specifications/prompts are preserved under `docs/archive/`.

The local bridge reads ps, dispatches three approved app bundles via execFile without a shell, reads fixed selected project/task records, stores dated journal files through a narrow API, and exposes one authenticated `/api/ollama` route for fixed local model-list reads and chat only. Per-run page token, strict own Origin/Fetch Metadata and Host checks protect activation. No external embedding, remote provider connection, session fabrication or arbitrary execution. Ollama has only fixed loopback `/api/tags` and `/api/chat` destinations; no URL/options/tools proxy or model download. Without the bridge, browser links request navigation only. Unknown is never zero; subscription percentages and API dollars stay separate. Local journal capture plus its selected-record connector and local Ollama recap are implemented; Hermes sessions, retrieval and native packaging remain pending.

Completion planning task: `/Users/coltonbatts/Documents/Studio Ops/tasks/dashboard-012-completion-plan.md`. Latest implementation task: `/Users/coltonbatts/Documents/Studio Ops/tasks/dashboard-014-tool-destinations.md` (Stage 08).
Handoff: `/Users/coltonbatts/Documents/Studio Ops/handoffs/dashboard.md`.

## Claude subscription Usage

Installed Claude Code 2.1.287 has the documented statusline fields. The project-only `.claude/settings.json` configures `scripts/claude-statusline.mjs`, which writes sanitized percentage/reset pairs to git-ignored `harness/data/claude-usage.json` when Claude Code passes its normal statusline payload. Global Claude settings and credentials are untouched. The project command currently uses this checkout's absolute path; update it after relocating. No model request was started to collect data; a real capture has now been observed (2/2 aggregate windows); account/plan identity remains unverified.

Usage polls that local file with bounded refresh/backoff/cancel and keeps last-good data stale on failure. Missing fields remain UNKNOWN; remaining comes only from explicit used percentage. Reset/observation times use America/Chicago; UTC ISO timestamps persist. For fresh data, continue normal Claude Code activity here; use `[ Claude usage ↗ ]` to open Claude Settings > Usage. No cookies, credentials or undocumented endpoints. No other provider, API spend, manual snapshots or native packaging was added. See [Integration findings](docs/INTEGRATIONS.md) for verified support, source setup and coverage limits.
