# HARNESS — Colton's Home

Journal is now available: click workspace **2**, press **Alt+2**, or type **`/journal`**. Write a few words and click `[ save entry ]` (Cmd/Ctrl+Enter in the reflection box). Choose a date or saved history to edit earlier entries. Browser drafts recover unsaved text; a successful save writes a private dated JSON file under `.journal/`, outside Git and static serving. `[ export .md ]` writes current text to `.journal/exports/YYYY-MM-DD-journal.md`; repeated exports replace that day's export. If the bridge is unavailable, export offers copyable Markdown. Layout reset does not touch entries. Reload the page after a bridge restart to get its new token.

Activity notes are currently written by you. Hermes activity ingestion, AI recaps, assistant memory retrieval and scheduled reminders are pending. See [Journal design and implemented scope](docs/DAILY-JOURNAL.md).

A stable shell with swappable modules. The approved [visual target](docs/design/home-harness-mockup.html) is binding for this and all later stages. The old fixed five-pane prototype is superseded and preserved in `prototype/`.

Stage 05: runnable local bridge and web shell, **real local Ollama Chat and labeled OpenRouter stub**, and registered **Claude subscription Usage**. WM bar, translucent terminal tiles, bottom command input, text-prefix chat, backend selection, local layout/selection persistence and explicit proposed local actions. Usage supports only 5-hour and weekly Claude subscription windows through documented local statusline captures. Real local Claude capture coverage is **2/2 windows**; current readings retain their source and freshness labels. Launcher reads real main-process PID/state/CPU through the bridge and dispatches fixed app paths on user activation. Cursor/Claude/Hermes dispatch plus running verified; Atlas dispatch failed and remains unverified. Focus is UNKNOWN. Browser-only fallback keeps all process fields UNKNOWN. Native Mac packaging remains unimplemented.

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

## Checks and boundaries

```sh
node --test harness/tests/*.test.js
```

See [Build log](docs/BUILD-LOG.md) for evidence and limits, [Module contract](docs/MODULE-CONTRACT.md) for the implemented boundary, and [Build prompts](docs/BUILD-PROMPTS.md) for the shell-first sequence. [Product specification](docs/PRODUCT-SPEC.md) preserves historical context and truth rules; fixed-pane requirements are superseded.

The local bridge reads ps, dispatches four fixed app/URL destinations via execFile without a shell, stores dated journal files through a narrow API, and exposes one authenticated `/api/ollama` route for fixed local model-list reads and chat only. Per-run page token, strict own Origin/Fetch Metadata and Host checks protect activation. No external embedding, remote provider connection, session fabrication or arbitrary execution. Ollama has only fixed loopback `/api/tags` and `/api/chat` destinations; no URL/options/tools proxy or model download. Without the bridge, browser links request navigation only. Unknown is never zero; subscription percentages and API dollars stay separate. The local journal milestone is implemented; intelligence connectors and native packaging remain pending.

Current Studio Ops task: `/Users/coltonbatts/Documents/Studio Ops/tasks/dashboard-010-ollama-chat.md`.
Handoff: `/Users/coltonbatts/Documents/Studio Ops/handoffs/dashboard.md`.

## Claude subscription Usage

Installed Claude Code 2.1.287 has the documented statusline fields. The project-only `.claude/settings.json` configures `scripts/claude-statusline.mjs`, which writes sanitized percentage/reset pairs to git-ignored `harness/data/claude-usage.json` when Claude Code passes its normal statusline payload. Global Claude settings and credentials are untouched. The project command currently uses this checkout's absolute path; update it after relocating. No model request was started to collect data; a real capture has now been observed (2/2 aggregate windows); account/plan identity remains unverified.

Usage polls that local file with bounded refresh/backoff/cancel and keeps last-good data stale on failure. Missing fields remain UNKNOWN; remaining comes only from explicit used percentage. Reset/observation times use America/Chicago; UTC ISO timestamps persist. For fresh data, continue normal Claude Code activity here; use `[ Claude usage ↗ ]` to open Claude Settings > Usage. No cookies, credentials or undocumented endpoints. No other provider, API spend, manual snapshots or native packaging was added. See [Integration findings](docs/INTEGRATIONS.md) for verified support, source setup and coverage limits.
