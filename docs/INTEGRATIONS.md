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

The interface exists in the installed version. **A real account payload has not been observed.** Account identity and exact subscription plan remain unverified. Installed program inspection establishes supported code, not runtime account coverage. No inference request was started to populate rate limits.

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

**Real account coverage: 0/2 windows.** Both render UNKNOWN because no real statusline capture exists. Installed interface: verified statically. Collector parsing/atomic write, adapter normalization, stale/cache/backoff/cancel and failure handling: verified using synthetic inputs in isolated temporary test files, never displayed as live readings. Runtime Claude Code emission and account capacity: unverified.

No model inference, provider authentication, publication, spending or global configuration change was performed. The first real reading requires Colton's ordinary Claude Code activity in this repo after applicable project trust. Until then the fallback is the correct result. Full check/evidence record: `BUILD-LOG.md`. Stage 03 is not started.

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
