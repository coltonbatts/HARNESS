# HARNESS — completion specification

Version 1.0 · October 7, 2026 · Proposed v1 scope

This is the current planning specification, superseding the October 6 v0.3 fixed-pane draft and stale stage descriptions. Existing runtime behavior remains governed by `MODULE-CONTRACT.md`; future stages update that contract as they are implemented. The approved `design/home-harness-mockup.html` remains the visual target. Prior spec: `archive/PRODUCT-SPEC-v0.3-2026-10-06.md`. Current evidence: `STATUS-2026-10-07.md`.

## Product and problem

HARNESS is Colton's personal Mac home for choosing work, reaching his tools, conversing with local models, and remembering the day. The core problem is loss of context across apps and sessions: available tools, the next task and prior decisions live in different places. A persistent workspace should make returning to work straightforward.

The current product already has useful Chat, Usage, Launcher and Journal modules. It lacks durable conversation/project continuity and a normal Mac launch experience. Finishing v1 means closing those gaps and proving the daily workflow, rather than adding an unbounded collection of integrations.

This proposed v1 is a work hub with local intelligence. A full agent harness would also own or explicitly attach tool-capable sessions, execute scoped work, track outcomes and recover interruption. Those capabilities remain a later milestone; local Ollama chat alone does not satisfy them.

## Goals and release evidence

| Goal | Proposed acceptance target | Measurement |
| --- | --- | --- |
| Start work without setup friction | App opens without a terminal command or separately installed Node; usable shell within 5 seconds on Colton's Mac with external sources unavailable | Three timed cold launches of the packaged artifact; machine/build identified |
| Recover context | Selected project, layout and saved conversations survive quit/relaunch; pending sends never replay | Automated persistence checks plus actual quit/relaunch |
| Reach the four original tools | Each configured destination has a successful observed launch/navigation receipt or a clear unavailable reason and working alternative destination | One real check per tool, including ChatGPT; separate dispatch, process and focus evidence |
| Keep personal writing | Journal text survives write failure/restart/relaunch; backup/export can be restored in an isolated store | Recovery/conflict/date tests and restore drill |
| Earn daily use | Colton starts from HARNESS on at least 5 of 7 trial days and reports whether returning to a project is easier | Voluntary daily check in `TRIAL.md`; target is a hypothesis, no fabricated telemetry |

No fixed delivery deadline. Stage gates govern progress; the seven-day trial requires seven real days and cannot be marked complete in one build session.

## User stories

- As Colton, I want to launch one familiar workspace so I can see my tools and choose what to work on.
- As Colton, I want the selected project and next action to remain visible so I can switch tools without losing the task.
- As Colton, I want to reopen a saved conversation so I can continue without reconstructing its context.
- As Colton, I want to preview selected project/journal context before a model sees it so I decide what the conversation includes.
- As Colton, I want clear stale, missing and failed source states so I can act on evidence rather than guessed status.
- As Colton, I want to capture a short reflection even when models or integrations fail.
- As Colton, I want a copyable task handoff so I can continue in Codex, Claude or Hermes using the same project and task.

## Daily experience

**Orient:** open HARNESS. Keep the terminal/tiled visual language: WM strip, monospace text, translucent dark panels, block gauges, bottom input and visible proposed actions. Show selected project and source problems in compact form. External sources must not delay the shell.

**Choose work:** select or explicitly add a project. Show its path, selected task, next action and observed handoff source. User selection determines focus. Studio Ops records are continuity data; do not automatically infer priorities or rewrite ownership.

**Continue:** reopen a local conversation with its project/model label. Preview any attached text and press Send. Completed messages provide context; failed/canceled exchanges do not silently resend. Choose another installed model explicitly if the former one is missing.

**Switch tools:** select an exact destination. Show requested dispatch, observed process presence and unsupported focus separately. Copy the current handoff for use in another harness. Copying is a local action; sending to another agent is not implied.

**Close the day:** open Journal, capture a few words, optionally select source quotes, save. Missing activity or model failure leaves manual capture usable. Export/backup is available independently of generation.

## Required v1 work — P0

### R01 — Reliable baseline

Restore the failing date-dependent Journal recovery test without weakening its assertions. Use controlled/injectable time or coherent fixtures. Cover actual next-day navigation, Chicago midnight/DST and generated-field/draft recovery. Existing strict CSP, bridge authorization, revision conflicts, output validation and UNKNOWN rules remain intact.

Acceptance: full suite passes on ordinary current time and controlled Chicago dates on both sides of midnight. All original protections remain exercised. Record regression cause and distinguish fixture repair from any production correction.

### R02 — Dependable tool access

Support configured Cursor, Claude, ChatGPT and Hermes destinations, with missing/changed installation handling. Preserve fixed user-selected app registrations and bounded dispatch. A failed Atlas route needs investigation; a clearly labeled ordinary ChatGPT HTTPS destination may be a supported fallback. Native Atlas success cannot be inferred from another browser loading ChatGPT.

Acceptance: existing-instance and stopped-app checks where available; unavailable app and invalid registration refusal; no launch on read/reload; no shell interpolation. A destination opened and an app focused are separate facts. Allowlisted registration updates may choose an app bundle; no arbitrary executable command field.

### R03 — Extensible shell and recoverable settings

Generalize module metadata so navigation, focus modes, commands and disposal derive from registered capabilities. Discoverable module picker and keyboard access for every module; add/remove a registered tile, reorder tiles, persist a bounded layout and reset only layout. Freeform docking and plugins loaded from arbitrary code are out of scope.

Separate shell configuration from module data and temporary requests. Version settings; validate imports before changing anything; export portable preferences without secrets/private writing. Missing module IDs or future schemas produce a recoverable warning. Machine paths require explicit re-selection after import.

Acceptance: a test module can be registered/focused/disposed without new tool-specific shell branches. Bad settings do not erase Journal/Chat stores. Keyboard and narrow-view navigation remain usable; no overflow at 390px; desktop tested at 1200×800. Test labels, visible focus, tab order and reduced motion.

### R04 — Projects and task continuity

Add a Projects module with explicit project registration, selected task and next action. Start from user-selected records, not filesystem discovery. Read source text only under registered project/source boundaries with size limits and provenance. Show file-missing/stale/unknown states without scanning other projects.

Produce a copyable Markdown handoff containing project/task identity, working directory, selected next action and source references. Local authored project state remains distinct from read-only Studio Ops records. Source text cannot change writing ownership or authorize execution. No automatic external task creation or messaging.

Acceptance: two Demo projects remain isolated; one real user-selected project is readable; selection survives reload; missing source preserves authored next action; copy contains correct paths and no unrelated/private content. Task handoff can be used manually in another tool.

### R05 — Durable conversations and explicit context

Store local conversations in a private, versioned file store outside Git/static serving, using opaque validated IDs, atomic writes and revision conflict detection. Include title, timestamps, optional project ID, requested/returned model and message outcomes. Persist completed exchanges and interrupted/failed user inputs visibly; never treat incomplete output as success or replay input on startup.

Add new/open/rename/export conversation actions. Preserve existing successful local transport, history bounds, cancellation and OpenRouter STUB truth. Context attachment is explicit: user selects registered project/task text, sees the exact bounded snapshot, source/time and recipient, then confirms Send. No folder-wide ingestion or hidden Journal attachment. The request contains exactly the previewed text and relevant conversation context, with disclosed bounds.

Acceptance: conversations survive bridge/app restart; projects/models remain isolated; missing model requests explicit selection; canceled/disconnected exchanges are labeled and never resend; context bounds/refusals preserve text; literal rendering; private files cannot be served. Invalid data is preserved for recovery, not silently overwritten.

### R06 — Local Mac app delivery

Package the existing web UI and narrow bridge as a dedicated Mac app. Choose the smallest wrapper that passes a lifecycle/authentication proof; the stack decision is a stage deliverable. Avoid a UI rewrite. Development remains runnable with `node bridge/server.mjs`; packaged operation does not rely on the development checkout or separately installed Node.

Before packaging, define an application-support data root and migration manifest for journals, conversations and settings. Keep old data until validated copy/restore; do not automatically move or delete `.journal/`. Browser drafts/preferences belong to the old origin and require an explicit export/import path. Selected Studio Ops source paths remain external configurable dependencies. Collector setup must work after relocation and report not configured honestly.

Own only the app's bridge process. Handle second launch, port collision, crash, token refresh and quit without killing another process or silently changing authority. Validate packaged webview request headers: retain the security guarantees or document/test an equally narrow native channel; never simply remove Origin/token/CSP protections to make packaging work.

Acceptance: launch/relaunch/quit with no orphan helper; known port collision preserves the unrelated listener; disconnected Ollama still permits Projects/Journal; isolated install/upgrade retains data; backup restore drill; export/logs redact tokens. Deliver build instructions, artifact location, migration/recovery notes and unsigned/signed status. Building a local artifact does not authorize installation, signing purchases, publishing or changing login items.

### R09 — Release acceptance and personal trial

Create `RELEASE-CHECKLIST.md` and `TRIAL.md`. Validate R01–R06 against the exact release artifact and record actual evidence, limitations and failures. Verify keyboard/narrow layouts, malformed config, restart, offline sources, journal conflicts, no replay and data restoration. Preserve manual Node workflow.

Acceptance: no unresolved data-loss, unauthorized-action or duplicate-send defect; P0 criteria pass or are explicitly unresolved (no false release completion). Record a local candidate, not a deployment. Collect seven real days of voluntary feedback. Declare release engineering complete separately from trial validation.

## Useful follow-ups — P1

### R07 — One verified Hermes activity source

Discover the installed Hermes version's supported read/export surface from local documentation and current official references. Metadata/process observation is not session access. Document capabilities and exact access scope before implementing an adapter. No broad profile/session database scan or app embedding assumption.

If supported and selected, import/read only explicit sessions/exports with stable source identity, timestamps, bounded text and duplicate handling. Display observed/connected versus running accurately. Read-only activity does not authorize sending, attachment or takeover. If no supported source is available, deliver the capability report and keep “Hermes activity: not connected”; a selected export can be considered separately.

Acceptance: a real selected source verified end to end, or an honest documented feasibility result. Untrusted source text remains inert. No credentials/transcripts enter Git/evidence. This is a P1 gate, not a reason to delay all P0 completion.

### R08 — Saved-journal recall

Search saved Journal entries locally by date and literal text. Results show snippets, source date/revision and whether text is owner writing or generated quote selection. Explicitly attach selected entries/excerpts to Chat with preview and provenance. Start with deterministic search; no embeddings service required.

Acceptance: only explicitly chosen excerpts enter a request; unsaved drafts excluded by default; failed search or oversized context leaves writing intact; old entries/schema supported. No silent durable-memory promotion, profile inference or external upload.

## Deferred — P2 and non-goals

- Full agent runtime: tools, workspace execution, explicitly owned/attached sessions, streamed progress, resumable jobs and scoped action approval. Requires its own spec and one demonstrated adapter.
- External provider chat and more usage products: each needs account/product choice, verified APIs, secure credentials and spending scope. OpenRouter STUB must remain labeled until selected.
- Streaming local chat: useful after persistence/context; requires interrupted partial-output semantics and new transport tests.
- Voice, evening reminders and auto recap: timing/delivery/user preference and scheduling lifecycle are separate decisions. No background model calls in v1.
- Universal embedding, browser surveillance, arbitrary shell execution, autonomous provider switching/delegation, social feeds and an open-ended plugin marketplace are outside this release.

## Architecture and data rules

Preserve `harness/` UI, pure module cores and `bridge/` adapters. Existing module v1 lifecycle remains the compatibility baseline; evolve the contract explicitly rather than relabeling old modules as live. UI/shell owns layout and routing; modules own their state; bridge owns narrow privileged operations; model text has no action authority.

Separate portable preferences, machine registrations and private content. Use Chicago calendar dates for Journal and UTC timestamps for persisted observations. Unknown is never zero. Reading old data never creates a fresh measurement. No source read or project switch sends to a model automatically. Existing quote-selection recap guarantees remain; better prose is a separate quality decision with evaluation evidence.

All future endpoints require exact input validation, bounded content, authorization and private-data serving refusal. Never expose a generic filesystem or shell proxy. Module errors stay local. A migration/export includes format version and clear exclusions; an import validates before applying. No private entries or tokens in screenshots/commits.

## Stage sequence and decisions

Stages 07–15 in `BUILD-PROMPTS.md`: baseline → destinations → shell/settings → projects → conversations/context → Mac packaging → Hermes feasibility (P1) → Journal recall (P1) → release/trial. Stage 12 can package the completed P0 product before optional connectors. P1 stages may be skipped explicitly in the release checklist.

Nonblocking decisions for Colton: preferred app name (default HARNESS), first real project/task to register (default current Dashboard task), additional usage/account coverage, evening reminder preference. Hermes protocol feasibility is an engineering investigation; stack selection is resolved by the packaging proof. Direct agent control and remote model spending require a newly selected scope. This spec is proposed direction, not evidence that these features already exist or authorization to run every prompt automatically.
