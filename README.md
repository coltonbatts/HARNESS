# Colton's Home — harness

A stable shell with swappable modules. The approved [visual target](docs/design/home-harness-mockup.html) is binding for this and all later stages. The old fixed five-pane prototype is superseded and preserved in `prototype/`.

Stage 01 (harness reset): runnable web shell and **Chat module with labeled stub backends**. WM bar, translucent terminal tiles, bottom command input, text-prefix chat, backend selection, local layout/selection persistence and explicit proposed local actions. Usage and Launcher are labeled design previews; neither is a live module. Native Mac packaging remains unimplemented.

## Run

```sh
cd /Users/coltonbatts/Documents/ChatGPT/DASHBOARD
python3 -m http.server 4174 --bind 127.0.0.1 --directory harness
```

Open <http://127.0.0.1:4174>. No installation or build step. ES modules require the server. Stop with Ctrl+C. The prior prototype uses port 4173 and is a historical artifact.

Type in the bottom bar and press Enter or `[ send ]`. Switch Ollama/OpenRouter in the Chat header. **Both are STUB**: local transport receipts only, no generated model output, provider calls, credentials or external sessions. The models view offers a labeled unavailable-transport test. Cancel pending input explicitly; no automatic retries. Messages stay in memory and clear on reload; backend/layout persist locally.

Cmd/Ctrl+K focuses input. Alt+0 tiles; Alt+1 focuses Chat. `/help` lists commands. `/layout reset` proposes a layout-only local storage write; `[ run ]` applies it, `[ cancel ]` writes nothing, and `[ stage for review ]` keeps the proposal visible. Unsupported commands never execute. Launcher filtering only filters DEMO rows.

## Checks and boundaries

```sh
node --test harness/tests/core.test.js
```

See [Build log](docs/BUILD-LOG.md) for evidence and limits, [Module contract](docs/MODULE-CONTRACT.md) for the implemented boundary, and [Build prompts](docs/BUILD-PROMPTS.md) for the shell-first sequence. [Product specification](docs/PRODUCT-SPEC.md) preserves historical context and truth rules; fixed-pane requirements are superseded.

No external app embedding, launching, provider connection, session fabrication or shell execution. Unknown is never zero; subscription percentages and API dollars stay separate. This stage stops after shell + Chat. No next stage started.

Current Studio Ops task: `/Users/coltonbatts/Documents/Studio Ops/tasks/dashboard-003-harness-reframe.md`.
Handoff: `/Users/coltonbatts/Documents/Studio Ops/handoffs/dashboard.md`.
