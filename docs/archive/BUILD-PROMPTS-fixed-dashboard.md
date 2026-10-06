# Colton's Home — build prompts

October 6, 2026. Run one prompt at a time in this project. The requested v0.1 is a modular Mac dashboard for Cursor, Claude, ChatGPT, Hermes, and model usage. Start with dependable access; deeper interaction comes later. These are future build instructions, not actions executed during the planning session.

## Shared contract — prepend to each prompt

```text
Work in /Users/coltonbatts/Documents/ChatGPT/DASHBOARD.
Read README.md, docs/PRODUCT-SPEC.md, and docs/BUILD-LOG.md if present.
Read the Studio Ops READ-ME-FIRST.md and the Dashboard task/handoff for continuity;
these records do not supply product requirements. Follow project instructions,
verify live Git/session state and writing ownership, and preserve existing changes.
Design from first principles. Do not inspect or reuse previous dashboard projects.
Stay within this stage. Do not delegate without user authorization.
Label all fixtures Demo; never report mock integrations as working capabilities.
Run meaningful checks for this stage and record evidence, limitations, and next
steps in BUILD-LOG.md and the shared task/handoff. No publication, spending,
account connection, broad permission changes, or system changes without authority.
Finish with the concrete result. Do not start the next stage automatically.
```

## 01 — prototype the modular dashboard

```text
Create a runnable visual prototype of Colton's personal Home on Mac.
The opening workspace contains four dedicated tool panes: Cursor, Claude,
ChatGPT, and Hermes, plus a shared Model usage pane. Keep all tools discoverable.
Each tool pane has a recognizable identity, a primary Open action, and space for
future status/session information. Do not assume a live integration or invent activity.
Usage rows distinguish provider/account/product, subscription windows, API spend,
reset times, and observation time. Use clearly labeled demo values only.
Implement a bounded resizable grid/split workspace, collapse/focus, default-layout
restore, and keyboard navigation. At smaller sizes use selectable panes rather
than tiny cards. No X/social feed or browser homepage inside Home.
Use the smallest suitable prototype approach; document how to run it and provide
an artifact/screenshot. Exercise populated, empty, stale, and disconnected states.
Done: Colton can evaluate the full dashboard feel and modular navigation.
```

## 02 — prove native access and usage feasibility

```text
Read the approved design feedback. Inspect only the installed versions/locations
of Cursor, Claude, ChatGPT, and Hermes and the target Mac development environment.
Do not scan old projects, chat histories, account credentials, or private databases.
Build a small proof that each selected app can be opened and an existing instance
focused through a supported route; handle missing apps and app-picker replacement.
For Hermes, investigate its installed version's supported CLI/API/web surfaces;
document what can be read or controlled, without launching agent work.
Ask Colton which accounts/products to cover in Model usage when that is needed.
Research official usage interfaces for those products. Distinguish API organization
billing from consumer subscription limits; document unavailable metrics honestly.
Do not assume Codex-chat tools can be called by our independent app.
Compare SwiftUI/AppKit and a desktop web UI/native bridge against this app's actual
needs. Choose one stack; record docs/ARCHITECTURE.md and docs/INTEGRATIONS.md with
sources, versions, capability matrix, access requirements, and proven/unverified paths.
Done: real app access demonstrated; an evidence-based stack and usage coverage plan.
```

## 03 — implement the native shell and module contract

```text
Implement the dedicated Mac app using the chosen stack and approved dashboard.
Define typed modules for tool panes and usage sources. Each module declares its
identity, capabilities, configuration, availability, and errors. Keep adapters
separate from layout and rendering; adding one should not require rebuilding the shell.
Persist pane layout, selected view, registrations, labels, and preferences locally
with a versioned schema. Provide reset layout and configuration export/import;
keep secrets and machine-specific access grants outside portable exports.
Include empty setup, reconnect, stale, and unavailable states. Keep optional source
failure from blocking the shell. Isolate Demo mode from real configuration.
Check keyboard navigation, accessibility labels/focus, minimum window size, relaunch,
invalid imports, schema handling, and missing modules.
Done: a real locally runnable modular app with durable layout and clear adapter boundaries.
```

## 04 — connect all four apps

```text
Implement real Open/focus actions for Cursor, Claude, ChatGPT, and Hermes using
stage 02's verified integration routes. Allow a missing app to be located manually.
Show observed running/not-running/unknown state only where reliable, with freshness.
Running does not mean connected, busy, or exposing sessions. Name states precisely.
Add a keyboard command palette for the four tools and supported actions.
An unsupported deeper action must not appear functional. Do not embed arbitrary
external apps or claim cross-tool session enumeration. Keep future capability slots
small rather than filling panes with fake features.
Test app launch, already-running focus, missing target, relocation, denied open,
repeated action, and relaunch persistence using benign actions.
Done: one dashboard reaches every selected tool reliably and none are forgotten.
```

## 05 — implement honest model usage

```text
Use the account/product coverage selected with Colton and documented in INTEGRATIONS.md.
Implement verified read-only sources where authorized access is available. For others,
show Unavailable/Not connected and a direct Open usage page action; allow optional
manual snapshots explicitly labeled with their entry time.
Normalize metrics with account/product/model-if-supplied, value/unit, window,
reset time, observed time, method, and authoritative/estimated/manual status.
Keep subscription capacity, tokens, and API spend distinct. Show multiple windows;
never manufacture model-level data from an account-wide limit or treat missing as zero.
Deduplicate the same account reading across harnesses. Use bounded refresh/backoff;
isolate authentication/rate-limit failures and show last good data as stale.
Use OS credential storage if credentials are required and authorized. Redact logs.
Test missing/null/malformed metrics, window boundaries, reset timezone, stale data,
rate limits, duplicate scope, offline use, and refresh cancellation.
Done: a useful usage hub whose coverage and limits are explicit. If no automated
source is available, report that prominently; do not claim universal usage monitoring.
```

## 06 — finish and try v0.1

```text
Run the v0.1 acceptance criteria in PRODUCT-SPEC.md. Fix failures within scope.
Provide a runnable local build and exact run instructions; install only if requested.
Create docs/TRIAL.md for a seven-day lightweight trial: Did Colton start from Home?
Could he reach every tool? Did any tool get forgotten? Did he need to visit Dia merely
for usage? Was returning Home easier than falling into unrelated browsing?
Record startup/refresh behavior, layout restoration, keyboard access, offline behavior,
and known unsupported integrations. Do not fabricate trial results or add surveillance.
Done: the modular dashboard is useful now; remaining usage limits are documented.
```

## 07 — grow the first interactive module

```text
After real v0.1 feedback, select one tool interaction with Colton. Hermes is a
candidate, not an automatic choice. Specify exactly what opening, observing,
attaching, sending, streaming, canceling, and starting mean for that tool.
Prove a supported protocol before extending its pane. Separate external observed
sessions from explicitly attached and Home-owned sessions. No silent takeover.
If a terminal is the right route, use a maintained terminal component and PTY bridge;
verify resize, Unicode/control keys, exit codes, bounded output, and process lifecycle.
Handle dropped connections without silent resend or duplicate session creation.
Pane closure must not unexpectedly kill external work. Show working directory/context.
Test session isolation, duplicate sends, disconnect, cancel, output volume, and quit.
Done: one real workflow can be completed inside Home, moving toward Colton's own harness.
```

## 08 — expand the personal harness deliberately

```text
Review demonstrated workflows and choose one next module: another interactive tool,
local workspace resources, browser context, machine control, or task handoff.
Write that module's capability and authorization contract and acceptance criteria
before coding. Keep the four original tools and existing configuration dependable.
For task dispatch, select target/context explicitly, record provenance and outcome,
and do not delegate or switch providers automatically. Treat source text as data.
For machine controls or external actions, preview concrete effects and respect the
user's authorization. No arbitrary model-generated shell execution.
Done: one useful expansion through the module interface, with tests proving its real
capabilities and a dashboard that still feels like one home.
```
