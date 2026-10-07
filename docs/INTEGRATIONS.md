# Current Stage 09 amendment — October 7, 2026

Active destinations: Cursor, Claude, Codex, Hermes. Atlas/ChatGPT HTTPS routes below are dated history, removed from current registrations and UI. Codex verified com.openai.codex / ChatGPT main executable in /Applications/ChatGPT.app, 26.930.61225; standard registration rules apply. Read-only Codex account-wide usage now implemented; exact protocol, socket, authority and schema limits in CODEX-USAGE.md. No credentials, account identifiers or private sessions read/exported.

# Claude subscription Usage — Stage 02

Research and local verification: October 6, 2026. Scope fixed by Colton: **Claude subscription only**, 5-hour and weekly windows. Colton explicitly confirmed that he uses Claude Code on this Mac. No other provider was added; no model-level allocations or API-dollar readings are shown.

## Official interfaces and limits

The [Usage & Cost Admin API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) reports organization API consumption and costs; individual accounts cannot use it. The [Rate Limits API](https://platform.claude.com/docs/en/manage-claude/rate-limits-api) reports configured organization/workspace API limits. Neither exposes consumer subscription capacity.

The requested blanket “API organization billing only” characterization needs one correction: current [Spend Limits API documentation](https://platform.claude.com/docs/en/manage-claude/spend-limits-api) explicitly covers **Claude Enterprise organizations**, not Claude Console organizations. It controls enterprise member spend, not consumer subscription 5-hour/weekly capacity. These organization billing/limit interfaces are not a permitted source for this module; none was connected.

Preferred candidate: the documented local Claude Code statusline interface. The [official 2.1.80 release notes](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md#2180) introduce `rate_limits`; [statusline documentation](https://code.claude.com/docs/en/statusline) specifies `five_hour` and `seven_day`, each with `used_percentage` and Unix-seconds `resets_at`. Claude Code passes JSON to a configured statusLine command via stdin. These windows may be absent independently; for consumer subscribers they appear after a session's first API response. Reset windows disappear when they expire. A local statusline command itself consumes no API tokens.

Fallback: UNKNOWN/unavailable and a direct [Claude Settings > Usage](https://claude.ai/settings/usage) link. Its destination is linked from [official Claude Code costs documentation](https://code.claude.com/docs/en/costs). No automatic browser reads, sign-in or account changes. Manual snapshots are optional and were not added this stage.

## Installed-version evidence

- `command -v claude`: `/Users/coltonbatts/.local/bin/claude`.
- `claude --version`: **2.1.287 (Claude Code)**.
- Resolved installed executable: `/Users/coltonbatts/.local/share/claude/versions/2.1.287`.
- Read-only inspection of that installed program confirmed the emitter shape `five_hour: {used_percentage: ..., resets_at: ...}` and `seven_day: {used_percentage: ..., resets_at: ...}`. Version check alone was not treated as evidence of account data.
- A narrowly scoped read of user settings reported **no user statusLine configured**; no other settings, credentials or histories were printed or used.

The interface exists in the installed version. **A real Claude Code capture has now been observed (2/2 windows), confirmed by Colton and present in the sanitized local file at 2026-10-06T21:02:17.197Z (16:02:17 CDT).** Account identity and exact subscription plan remain unverified. Installed program inspection alone establishes supported code; the subsequent capture establishes aggregate window coverage, not account/plan identity. No inference request was started to populate rate limits.

## Implemented route and authority

The repo's `.claude/settings.json` configures `scripts/claude-statusline.mjs` for Claude Code activity **in this project**. It does not modify global Claude settings. It currently uses this checkout's absolute script path and `node` on PATH; relocation requires updating that project setting. Normal Claude Code workspace trust/settings precedence still applies. Configuration is prepared; invocation by the installed runtime remains unverified until Colton uses Claude Code here. This does not capture usage from other projects automatically.

Collector behavior:

1. Read only the documented stdin payload; no settings, auth/session files, cookie stores, OS keychain, transcript paths or provider endpoints.
2. Allowlist the two aggregate windows and their numeric percentage/reset fields. Discard session IDs, model names, cost, transcript paths, account tokens and all other fields.
3. Validate percentage 0–100 and reset bounds; absent/malformed windows remain null. Capture time is local observation time, **not an upstream provider refresh timestamp**. Claude Code may itself supply cached information; that age is not present in this interface.
4. Atomically write a small sanitized `harness/data/claude-usage.json` with mode 0600. It is git-ignored. Invalid stdin attempts an unavailable snapshot so the UI can retain stale last-good data. File-write failure leaves the prior file; its age continues growing.

The browser module fetches only that same-origin local file with credentials omitted. The supported run command binds the server to 127.0.0.1. No external requests occur except if the user deliberately opens the usage-page link. Runtime data is not committed or exported. No secrets are required, so no credential-storage integration was needed or authorized.

**Forbidden routes were not implemented:** cookie scraping/decryption, using another app's session credentials, credential extraction, or undocumented authenticated endpoints. If those become the only route, they remain not permitted; use UNKNOWN and the usage-page link.

## Measurement and lifecycle

Canonical rows separately contain provider, local scope alias, product, window, used/remaining value, percent unit, window start/end, reset, observation timestamp, source method, confidence, status and error reason. The account alias `local-claude-subscription` means the single configured local source; it is not a discovered account ID. Product/plan is labeled unverified. Model data is absent.

- Remaining = 100 − an explicit valid used percentage. Missing/null/string/NaN/out-of-range data never becomes zero. No quota is inferred from tokens or price.
- Window start is UNKNOWN; the interface does not supply it. Window end/reset is the provided reset timestamp. UTC ISO timestamps are persisted consistently; reset and observation times render in America/Chicago with CST/CDT.
- `authoritative` means faithfully reported by the documented local interface, not independently audited billing. Confidence remains authoritative while status becomes STALE. Unavailable rows carry null values and unavailable confidence. No estimated/manual measurements are produced.
- Single-window missing/invalid/older observations retain that window's last good reading marked STALE with age; duplicate scope is deduplicated and percentages are never summed.
- Old captures become STALE at five minutes or when the reset expires. Rereading the same file never advances its observation timestamp. Refresh failure marks last-good values stale immediately. Cached last-good rows also start stale on reload.
- Poll floor 30 seconds; failure backoff 30/60/120/240/300 seconds, including bounded Retry-After handling. No overlapping reads; refresh controls honor backoff. Five-second timeout, explicit cancel, abort on disposal; failures do not block Chat or the shell.
- Browser-local cache key `home-claude-usage-v1` stores only whitelisted window observations, each with its own original timestamp. Malformed cache is ignored; storage errors leave Usage usable and report cache unavailability.

## Measured coverage and validation

**Real account coverage: 2/2 aggregate windows observed.** A real Claude Code capture was confirmed by Colton and the sanitized local file was read during Stage 04: observed_at 2026-10-06T21:02:17.197Z, used 45% five_hour and 22% seven_day (remaining 55% and 78%). These are timestamped historical readings, currently STALE; 2/2 coverage is not 2/2 fresh windows. Account/plan identity remains unverified. No Usage code, source data or cache was changed. Installed interface and collector validation remain as recorded in Stage 02.

No model inference, provider authentication, publication, spending or global configuration change was performed. Further fresh readings require ordinary Claude Code statusline updates; stale and unavailable handling remain essential. Full check/evidence record: `BUILD-LOG.md`. Stage 02 acceptance history is preserved there; Stage 04 current status appears below.

## Stage 03 — browser Launcher (2026-10-06)

This stage is a browser page. It can request navigation on trusted user activation; it cannot open/focus apps through a native API or inspect processes. PID, STATE and CPU are always UNKNOWN, including after an outcome report. `run` does not mean connected. No helper, child process, AppleScript, credential access or app embedding was added. [MDN URI schemes](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes) describes URL routing; [web protocol handlers](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/registerProtocolHandler) do not provide native process observation.

Read-only verification of each `/Applications/<name>.app/Contents/Info.plist` on this machine:

| Installed app | Bundle ID | Version | Declared schemes | Launcher destination |
|---|---|---|---|---|
| Cursor | com.todesktop.230313mzl4w4u92 | 3.22.7 | cursor | cursor:// |
| Claude | com.anthropic.claudefordesktop | 2.19675.1 | claude; msauth.com.anthropic.claudefordesktop | claude:// |
| ChatGPT Atlas | com.openai.atlas | 1.2025.337.4 | com.openai.atlas; openai; http; https; file | https://chatgpt.com/ |
| Hermes | com.nousresearch.hermes | 0.0.0 | hermes | hermes:// |

Installed identity/version and scheme declarations are verified metadata, not working-handler evidence. The installation record is dated, not a live browser inventory. Native routes use bare roots without file/task arguments. Atlas is expressly a URL target: the browser controls where HTTPS opens. The module does not use `openai://` or claim Atlas activation; [Atlas browsing documentation](https://help.openai.com/en/articles/12628371-browsing-the-web-with-chatgpt-atlas) identifies the product as a browser.

### Actual route observations

| Route | Test performed | Observed result | Verification |
|---|---|---|---|
| cursor:// | Tried clicking the Launcher link using the in-app browser tool | Tool blocked custom-scheme navigation before dispatch; page still showed no activation outcome and report buttons disabled | Handler/focus unverified; automation unavailable |
| claude:// | Installation metadata read; keyboard filter selected/focused its link, without activation | Correct link and selection visible; custom-scheme activation not attempted after the browser restriction | Handler/focus unverified |
| hermes:// | Installation metadata read; End + Enter selected/focused its link, without activation | Correct link and selection visible; custom-scheme activation not attempted after the browser restriction | Handler/focus unverified |
| https://chatgpt.com/ | Clicked the Launcher URL link | New in-app browser tab loaded signed-out ChatGPT, title “ChatGPT: Chat, Work, Create & Code with AI”; source tile reported URL requested, not success | URL load verified; Atlas activation unverified |

The browser tool restriction was not bypassed with another browser, OS launch, helper or indirect execution. Colton said he will test the three native links and report each route. Those results are pending. Screenshot `evidence/launcher-url-destination.jpg` records the HTTPS destination. No prompt or credentials were submitted; the test-created destination tab was closed.

### Failure and truth handling

The route allowlist rejects missing, malformed, mismatched/unknown schemes, wrong route kinds and unexpected destinations. A known missing-app record disables dispatch. At runtime this page cannot reliably distinguish missing app, unhandled scheme, browser blocking or a canceled prompt. Requests remain outcome UNKNOWN until an explicitly labeled user report; report buttons allow “opened”, “blocked” or “nothing opened”, and the last never diagnoses which failure occurred. Reports are in-memory per route and never prove process state. There is no automatic success detector, visibility/blur heuristic, retry or fallback. Repeated requests to the same route are held for one second, then require another user activation. No launch runs on load, filter, selection, timers or disposal.

## Stage 04 — authorized local bridge (current, 2026-10-06)

Run `node bridge/server.mjs` from the checkout. Node stdlib only, no install/dependencies/node_modules. One bridge binds **127.0.0.1:4175 only** and serves existing `harness/`; visit http://127.0.0.1:4175/. The earlier Python command is superseded for normal use (it remains a supported UNKNOWN fallback). This origin has separate browser-local configuration/cache from port 4174. Chat and Usage code and source capture are unchanged.

### Exact authority and allowlist

The only subprocess operations are `execFile('/bin/ps', ['-axo','pid=,stat=,%cpu=,comm=','-ww'], ...)` for read-only snapshots and `execFile('/usr/bin/open', fixedArgv, ...)` for trusted user activation. Both set `shell:false`; no exec/execSync, request-derived command/argv, AppleScript, UI scripting, credentials, provider calls or arbitrary execution. Only these four IDs select a fixed argv:

| ID | Fixed open argv | Exact main executable for observation |
|---|---|---|
| cursor | `['-a','/Applications/Cursor.app']` | `/Applications/Cursor.app/Contents/MacOS/Cursor` |
| claude | `['-a','/Applications/Claude.app']` | `/Applications/Claude.app/Contents/MacOS/Claude` |
| atlas | `['-a','/Applications/ChatGPT Atlas.app','https://chatgpt.com/']` | `/Applications/ChatGPT Atlas.app/Contents/MacOS/ChatGPT Atlas` |
| hermes | `['-a','/Applications/Hermes.app']` | `/Applications/Hermes.app/Contents/MacOS/Hermes` |

Installed IDs/versions/executables were re-read from those four plists and all main executable files exist; IDs and versions match Stage 03's table. Atlas remains a URL destination, now explicitly requested in Atlas via `open -a`. This is a new native dispatch route; none of these results proves a custom-scheme handler. There is no default-browser fallback or arbitrary URL/path picker.

### Endpoints and security

- `GET /api/state`: allowlisted main-process measurements (`observed`/`unknown`, running boolean/null, PIDs, individual main-process stat/%CPU, reason, UTC ISO observation timestamp, focus UNKNOWN), plus this run's route verification evidence. The full process table/arguments never leave the bridge; helper processes are excluded.
- `POST /api/open`: JSON **exactly** `{ "tool": "cursor"|"claude"|"atlas"|"hermes" }`. Returns separate `dispatch` (dispatched/failed, completion timestamp) and post-dispatch `observation` (timestamp/running/UNKNOWN), plus scoped verification. Unknown IDs/extra fields refuse before execution. Requests hold per-tool pending work and a one-second repeat guard. No launch on load, reload, polling, filtering or selection.
- A fresh 256-bit token is generated per run and inserted only in the served index page's meta element; the page sends it as `X-Bridge-Token`. Never persisted, logged, in a URL, exported with evidence, or included in state/error responses. A restart requires page reload; old tokens fail closed.
- Both APIs require the exact Host `127.0.0.1:<actual port>`, constant-time token comparison and `Sec-Fetch-Site: same-origin`. POST additionally requires exact `Origin: http://127.0.0.1:<port>`; absent/null/foreign Origin is refused. GET validates Origin if supplied (same-origin GET browsers can omit it). Same-site, cross-site, none and missing fetch metadata refuse for APIs. No CORS allow headers; OPTIONS never grants mutation access.
- Static requests reject foreign Origin/fetch metadata; canonical real paths remain inside harness, with dotfiles/unknown extensions and symlink escapes refused. Responses use no-store, nosniff, same-origin resource policy, no-referrer and CSP (self scripts/connect, no framing/base/form escape). Token-bearing page cannot be framed. No server uploads/writes.
- The token protects browser cross-origin writes in combination with Origin/Fetch Metadata, not hostile local software capable of reading local HTTP and forging headers. The source checkout/served same-origin scripts are trusted. This is an explicit local capability, not public/network authorization. [Node execFile documentation](https://nodejs.org/api/child_process.html#child_processexecfilefile-args-options-callback), [MDN Fetch Metadata](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Fetch_metadata) and [CSRF](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/CSRF) support the chosen mechanics.

### Observation semantics, focus and failure

Exact executable equality avoids helper/name/argument false positives. `run` means a non-zombie main process was observed, not connected, responsive or focused. A successful process snapshot with no match reports observed absent; failed/empty/malformed snapshots report UNKNOWN (never absent/zero). CPU is ps %CPU per main process only, not a live whole-app total; absent CPU is UNKNOWN. PIDs are real or null/absent, never seeded. Observation persists only in memory; exported evidence is a dated snapshot.

Focus probe: `/bin/ps -L` enumerated available fields and `pid/stat/%cpu/comm` was examined. No reliable frontmost/focused application field exists there; process stat/terminal foreground flags are not GUI focus. Node stdlib supplies no AppKit frontmost interface. No AppleScript/UI scripting was used. **Focus remains UNKNOWN for all routes.** Dispatch verification is bounded to exit-0 plus subsequent exact executable presence; it does not prove a window was displayed, existing instance focused, new process causally launched or Atlas loaded its URL.

ps timeout 3s; open timeout 5s; bounded post-dispatch probes at most three (250ms waits, no additional launch). Concurrent ps reads coalesce. Launcher refreshes every 5s, coalesces pending reads, bounds requests at 6s and validates measurements (including 15s expiry). On network/auth/parse failure it drops current observed values to UNKNOWN, preserving dated dispatch receipts separately. No automatic activation retry or silent URL fallback after a bridge failure. Without a page token (file/plain server), the original browser links and UNKNOWN measurements remain. Disposal cancels polling/fetches; an already submitted native dispatch cannot be undone by a client abort. User reports stay explicitly separate from measured process state.

### Actual per-route evidence

Activation used the served page's trusted user buttons. First run: before activation Cursor and Atlas were absent; Claude PID 12566 and Hermes PID 71781 were present. Cursor then appeared as PID 21234 after exit-0 dispatch at 16:21:38 CDT. The final build was restarted and tested again (verification is per run):

| Route | Final build observation on Oct 6 (America/Chicago) | Status and limits |
|---|---|---|
| Cursor fixed app path | Dispatch completed 16:29:25; exact executable PID 21234 observed afterward | Verified dispatch + running; focus UNKNOWN; final test reused existing instance |
| Claude fixed app path | Dispatch completed 16:29:26; exact executable PID 12566 observed afterward | Verified dispatch + running; already running, focus UNKNOWN |
| Hermes fixed app path | Dispatch completed 16:29:26; exact executable PID 71781 observed afterward | Verified dispatch + running; already running, focus UNKNOWN; no agent prompt sent |
| ChatGPT HTTPS URL in Atlas | `open` failed, exit 1 at 16:29:26; successful ps snapshot found no exact executable afterward | Dispatch unavailable in this installation; native route unverified; URL load/focus unverified. No system repair, reinstall or alternate route attempted |

`evidence/bridge-state.json` contains sanitized UTC process/route evidence from the final run (`bridge-state-initial.json` preserves the first run); screenshots record the final UI and failed Atlas dispatch. Cross-origin/token/unknown-tool rejection is proven with isolated HTTP integration tests and an injected executor count (zero rejected activations), not by a malicious live launch. Plain-server and stopped-bridge fallback were checked in the browser. Stage 03 HTTPS navigation evidence remains historical and does not upgrade Atlas native dispatch.

## Stage 08 current destinations — October 7, 2026

Supersedes Stage 04's fixed Atlas dispatch route only. Read-only live metadata: Cursor 3.23.23 (`com.todesktop.230313mzl4w4u92`), Claude 2.26454.2 (`com.anthropic.claudefordesktop`), Hermes 0.0.0 (`com.nousresearch.hermes`); approved executable files present. `/Applications/ChatGPT Atlas.app` is absent today. `/Applications/ChatGPT.app` identifies as `com.openai.codex`, executable ChatGPT, version 26.930.61225; native ChatGPT support is not inferred. Historical Atlas failure retained exit 1/absence but no platform error in the sanitized record, so the exact October 6 cause remains unproven. Current missing bundle explains today's refusal; no handler success, repair or alternate native retry claimed.

ChatGPT is now explicit ordinary HTTPS navigation. Trusted Launcher click loaded `https://chatgpt.com/` with ChatGPT composer in a new **Codex in-app browser tab** at approximately 13:53 CDT; no message sent. Target handling in other browsers is unverified. Native Cursor/Claude/Hermes trusted clicks returned exit 0 and exact already-running processes afterward at 13:53:07/12/12 CDT. Focus UNKNOWN for all; no fresh-window claim. Exact sanitized times/PIDs in `evidence/stage08-destinations.json`.

`LAUNCHER-REGISTRATION.md` defines the new narrow authority recorded before implementation: three approved identities, canonical app paths, exact plutil/open argv, bounded body/metadata, authenticated explicit registration and private atomic persistence. No arbitrary command, argument, URL or filesystem proxy. All earlier transport protections persist. New `/api/launcher/registration` uses the same refusal-before-dispatch gates; Atlas `/api/open` is refused. All four rows remain discoverable. State/configuration/reload never open apps. No native packaging or sessions added.
