# HARNESS — completion build prompts

October 7, 2026. Stages 01–09 are implemented locally, including Colton-selected custom Stage 09 Codex usage + destination. Full suite 80/80; the next slot is the original shell/settings stage, separately selected. Earlier Stage 07/08 prompt sequencing below is dated planning history. These prompts were authored as future instructions by the planning session; execution results are in BUILD-LOG and the appended STATUS repair result. Run one selected prompt per coding session; record its outcome before choosing the next. No automatic delegation or stage chaining.

Current plan: `PRODUCT-SPEC.md` v1.0. Current baseline: `STATUS-2026-10-07.md`. Previous shell-first prompts preserved at `archive/BUILD-PROMPTS-shell-first-2026-10-06.md`; rejected fixed-dashboard sequence remains historical.

## How to use

Paste the shared preamble followed by one numbered prompt into the coding tool. Stage 07 is complete. Use its handoff and actual HEAD for Stage 08; never assume today's SHA is still current. Stages 13–14 are P1 and may be skipped explicitly for the v1 release. Stage 15 distinguishes a ready build from seven days of real use.

These prompts request implementation when you submit them. They do not grant publication, external messages, spending, installs, credential changes or agent delegation. Do the authorized local implementation and reviewable build first; ask only for genuinely missing scope/preferences or a restricted final action.

## Shared preamble — paste before every stage

```text
Work in /Users/coltonbatts/Documents/ChatGPT/DASHBOARD (HARNESS).
Read project instructions, README.md, docs/PRODUCT-SPEC.md,
docs/STATUS-2026-10-07.md, docs/MODULE-CONTRACT.md, and the latest relevant
BUILD-LOG entries. Read the binding docs/design/home-harness-mockup.html.
Read /Users/coltonbatts/Documents/Studio Ops/READ-ME-FIRST.md, now.md,
and handoffs/dashboard.md; open the current stage task. Preserve the same
project/task identity across tools. Other portfolio priorities are not this task's scope.
Verify live Git/session/writing state. Preserve existing changes and private data.
Take documentation/source writing ownership for this selected stage after resolving
any active writer. Create the stage task if missing; never edit another writer's task.
Do not assume records or a previous test count describe today's runtime.

Implement only the numbered stage below. Use the existing modular web UI/bridge.
Preserve the terminal/tiled visual language, bottom input and proposed-action block.
No inspection/reuse of unrelated old dashboard projects. No agents/delegation unless
Colton explicitly authorizes it. No arbitrary shell/filesystem proxy, source-driven
actions, silent sends/retries/fallback, automatic model installation or external calls.
Model/source text is inert data. Unknown is never zero. Demo fixtures are labeled.
Protect Host/Origin/token/Fetch Metadata and strict CSP or prove a documented
replacement providing the same narrow guarantees before changing transport.

Run the existing full suite and meaningful new checks for the changed behavior.
Test private writing in temporary isolated stores, not Colton's actual entries.
Use real UI checks for interactive changes; record dimensions, source/model, time,
actual outcomes and limits. Keep tokens/private text out of tracked evidence.
Update the runtime module contract only for implemented behavior; record build log,
checks, changed files, artifact/commit state, blockers and exact next action in the
stage task and Dashboard handoff. Release ownership when stopping.
Commit/push only if separately authorized in this session; never inherit publishing
permission from a historical task. Finish this stage, report evidence and stop.
```

## 07 — Restore the baseline

Requirement: R01. Dependency: current checkout only.

```text
Create/use Studio Ops tasks/dashboard-013-baseline-recovery.md.
Today's assessment found 58/59 tests on main at 12ac0f0. Reproduce using ordinary
current time. The failing mounted Journal test is in
harness/tests/journal-activity.test.js:78–102: fixture day is 2026-10-06,
while journalModule.mount initially loads journalDay() from the real clock.
On remount the recovery key follows the actual day. A process-local fixture-day
clock made the isolated test pass; this is diagnosis, not a repaired baseline.

Make clock/fixtures deterministic with the smallest maintainable change. Preserve
failure/cancel/owner-field/inert-output/recovery assertions. Do not delete, skip
or weaken the failing check. Determine whether production behavior also needs a
correction; do not assume a test defect proves next-day UX is correct.
Cover reload on the same date, next-day opening, explicit return to yesterday,
Chicago midnight/DST, generated recap/draft recovery and revision conflicts.
Also reconcile active documentation claims: distinguish historical 59/59 from
new actual results, and remove stale current-contract claims that both models
are stubs or that no Journal recap exists, retaining dated history clearly.
No new features, sources, dependencies or bridge authority.

Done: full suite green under ordinary time and controlled dates on both sides of
Chicago midnight; meaningful real Journal date/reload check in an isolated store;
root cause and any production change documented. Update STATUS with an appended
repair result rather than erasing October 7 evidence. Stop before Stage 08.
```

## 08 — Make all tool destinations dependable

Requirement: R02. Dependency: 07.

```text
Create/use tasks/dashboard-014-tool-destinations.md. Inspect the current fixed
Launcher registrations and installed bundle metadata read-only. Diagnose the
recorded Atlas exit-1 route without guessing handler success. Deliver a reliable
ChatGPT destination: a verified native path if supported, otherwise clearly
labeled HTTPS navigation with its actual browser scope. Do not report browser
navigation as Atlas launch/focus.

Add a bounded configuration/re-selection flow for missing or moved app bundles.
Selection registers an approved bundle/destination, never a shell command or
arbitrary executable arguments. Keep initial four tools discoverable. Document
any new registration boundary before implementation; preserve exact executor
argv, token/Origin checks and refusal before dispatch.
Keep process observation, dispatch receipts, user reports and focus separate.
No focus claim without actual observation. No launch on page load, selection,
read or configuration import. No automated repair, alternate retries or settings changes.

Exercise installed/already-running/missing destinations, bad registrations,
repeat guard, ordinary URL fallback and restart. With explicit user activation,
record one real benign opening/navigation outcome per available tool. Unavailable
tools remain visible with a useful next action. Demo-test absent apps without
moving/uninstalling real ones. Preserve Chat, Usage and Journal behavior.
Done: four dependable or honestly unavailable destinations, ChatGPT usable by a
verified route, exact evidence/limits and full suite passing. Stop.
```

## Selected Stage 09 override — October 7, 2026

Colton explicitly selected Codex usage + destination in place of the original Stage 09 slot: remove ChatGPT/Atlas, add verified Codex or honest CLI-only destination, add read-only local daemon usage. Completed result is in BUILD-LOG, CODEX-USAGE and Studio Ops task dashboard-015-codex-usage. Shell/settings moves to the next slot; the original prompt below remains the planned work, not executed by the custom stage. Reconcile downstream numbering when the next stage is selected.

## Next slot — Finish the shell and settings contract (original Stage 09)

Requirement: R03. Dependency: 08.

```text
Create/use tasks/dashboard-015-shell-settings.md. Generalize registry metadata
and shell navigation so modules declare their focus/command/configuration hooks.
Keep existing lifecycle compatibility; update MODULE-CONTRACT with the implemented
extension. Build a discoverable module picker and keyboard actions for all modules.
Provide bounded add/remove/reorder/focus layout controls, not a new window manager.
Do not leave hardcoded Chat/Journal branches as the route for every new module.

Version shell preferences independently of Journal and future Chat content.
Validate portable export/import before mutation; omit secrets/private text and
require machine paths to be re-selected. Preserve unknown-schema/bad-import data
for recovery. Layout reset must affect layout only. A removed tile must release
its timers/listeners and pending requests without deleting content or external work.

Prove a Demo module can register, receive routed input, focus, fail and dispose
without adding tool-specific shell logic. Check existing bottom-bar Chat routing,
Journal shortcut, reset preview/run/cancel and settings restart/import. Exercise
keyboard focus/labels, 1200x800 and 390x844, long labels and missing module IDs.
Keep the approved visual language; avoid decorative redesign and source upgrades.
Done: extensible module navigation/settings and existing modules passing full
regressions, with real UI evidence and documented compatibility. Stop.
```

## 10 — Add Projects and copyable task handoffs

Requirement: R04. Dependency: 09.

```text
Create/use tasks/dashboard-016-project-context.md. Add Projects through the module
contract. User explicitly registers project paths and selected task/source records;
no broad project discovery or automatic prioritization. Begin with this Dashboard
project/task, plus isolated Demo projects for tests. Read registered text through
a narrow authenticated, size-bounded bridge interface, with exact source/time.
Validate registration and canonical source boundaries; do not expose generic file reads.

Persist selection and owner-authored next action privately. Show project path,
selected task, source excerpt and missing/stale/unknown states. Do not overwrite
Studio Ops task/ownership from imported content. Produce a copyable Markdown
handoff with project/task, directory, next action and selected provenance; it is a
local draft. No send-to-agent, task creation in another app or model call.

Test two projects with identical task labels for identity isolation; bad/missing
paths and oversized files; restart; inert malicious-looking content; copy/export
scope. Real check: select Dashboard, reopen it and obtain the correctly scoped
handoff. Failure of a source preserves authored next action and other modules.
Done: useful project choice/handoff flow, narrow authority documented and full
suite passing. Do not add automatic Chat attachments or session control. Stop.
```

## 11 — Persist conversations and attach explicit project context

Requirement: R05. Dependency: 10.

```text
Create/use tasks/dashboard-017-durable-chat.md. Write private versioned Chat
conversation storage through a narrow authenticated bridge API. Opaque validated
IDs, bounded messages, atomic writes, revisions, malformed-data preservation,
restart-safe history and export. Reuse the Journal store's proven patterns without
sharing or rewriting its files. Add new/open/rename/export conversations, optional
project IDs, model provenance and visible send outcomes.

Restore completed exchanges after reload. Record interrupted/failed/canceled
user inputs as such; never replay them or make incomplete responses successful.
Require explicit model choice when the saved local model is unavailable. Keep
per-project/conversation/model isolation, duplicate lock and cancellation semantics.
OpenRouter remains labeled STUB; no credentials or remote-provider activation.

Add explicit selected project/task context attachment. Preview exact bounded text,
source/time and recipient before Send; send the previewed snapshot, not a silently
reread file. Display any context exclusions/limits. No directory scanning, hidden
Journal inclusion or model-triggered actions. Persist source snapshot provenance
with the conversation so a later file edit does not change what was actually sent.

Test restart, revision conflict, missing model, malformed private files, pending
quit, canceled late reply, auth/private-serving refusal, literal output and context
bounds/isolation. Obtain one real local-model conversation with selected benign
project context, then reopen after bridge restart without resend. Redact personal
content in evidence. Done: durable conversations and deliberate context proven,
existing modules/full suite preserved. Stop before packaging.
```

## 12 — Deliver a local Mac app

Requirement: R06. Dependency: 11. This is the P0 delivery milestone.

```text
Create/use tasks/dashboard-018-mac-delivery.md. Perform a small wrapper/lifecycle
proof around the existing UI/bridge. Inspect local build capabilities and current
primary documentation for candidate wrappers. Choose and record the smallest
maintainable option that preserves behavior; do not rewrite the frontend.
Package a dedicated HARNESS Mac artifact usable without terminal startup or a
separately installed Node. Keep the Node development command working.

Define application-support paths for private data and settings. Produce a reviewed
migration manifest: old paths, new paths, schemas, validation, explicit copy,
rollback and backup restore. Preserve originals until validation. Handle existing
browser drafts/preferences by explicit export/import from the old origin; do not
pretend copying .journal migrates browser localStorage. External Studio Ops
sources and Claude collector paths need visible re-selection/setup after relocation.

Own only the app's helper. Prove launch, second launch, crash/restart, quit, occupied
port, fresh token, no orphan process and external Ollama unavailable. Verify actual
webview request headers against existing authentication gates. Never solve wrapper
compatibility by broadly disabling CSP/Origin checks or exposing filesystem APIs.
Use isolated copies of fixtures for migration/install/upgrade/restore tests.

Done: buildable local Mac artifact, three timed cold launches and real end-to-end
project -> saved Chat -> tool destination -> Journal flow; migration/recovery notes,
artifact path and signing status. Build is authorized by this prompt; installation,
publication, login-item changes, signing purchases and credential work are not.
Report any genuinely required restricted final action only after the artifact is
concrete and reviewable. Do not claim deployment. Stop.
```

## 13 — Prove one Hermes activity connection (P1)

Requirement: R07. Dependency: 10; verify compatibility with packaged app if 12 exists.

```text
Create/use tasks/dashboard-019-hermes-source.md. First deliver a capability report:
installed Hermes version; supported read/export APIs or CLI; current primary docs;
authentication, selected source scope, session IDs/time semantics and limits.
Process presence alone is not a connection. Do not scan broad session/profile
stores, reuse another harness's credentials or assume universal embedding.

If a supported selected read-only interface is verified and authorized, implement
one adapter with explicit session/export selection, bounded inert data, timestamps,
stable identity, duplicate handling, source status and disconnect isolation.
Read-only means no sends, starts, attach/takeover, process cancellation or ownership
changes. Source selection never calls a model. Integrate only selected activity
through the documented module/Journal source contract; update coverage honestly.

If supported access cannot be proved, finish with the capability report and a
concrete selected-export alternative proposal. Do not invent an API or block all
P0 release work. Actual session-content access requires explicitly selected records;
metadata research can proceed without that selection.
Done: one real scoped source and tests/evidence, or a documented unsupported/
access-limited result. Show Hermes not connected until actually connected. Protect
private content; existing full suite and packaged behavior preserved. Stop.
```

## 14 — Recall saved journal context (P1)

Requirement: R08. Dependency: 11; Hermes is not required.

```text
Create/use tasks/dashboard-020-journal-recall.md. Add local date/literal-text search
across saved Journal entries only. Use a bounded authenticated query and results,
private storage and deterministic matching. Show date, revision, snippets and
owner-writing versus generated-selection authorship. No embeddings service,
profile inference, unsaved-draft ingestion or background model calls.

Let Colton choose specific entries/excerpts and preview exact text before attaching
it to a selected Chat conversation. Reuse Stage 11's context snapshot/provenance
flow. Explicitly disclose local recipient; nothing is sent until Send. Search
cannot promote personal writing into durable assistant memory automatically.

Test old schema, generated fields, dates, empty/long queries, missing/corrupt entries,
bounded large archive, auth/private serving, escaped/literal content and exact
attachment isolation. Use temporary private Demo journals for checks. Real UI
acceptance can use a user-authored benign test entry; do not read unrelated entries
just to create screenshots. Failed retrieval/model calls preserve capture and drafts.
Done: saved writing findable and explicitly reusable with source/revision evidence,
full suite and packaged app checked. Stop.
```

## 15 — Release acceptance and seven-day use

Requirement: R09. Dependency: P0 stages 07–12; mark P1 completion/skips explicitly.

```text
Create/use tasks/dashboard-021-v1-release.md. Read actual stage evidence and validate
the exact current candidate against PRODUCT-SPEC R01–R06. Create
RELEASE-CHECKLIST.md: requirement, test/evidence, actual outcome, limitations and
open blocker. Create TRIAL.md with seven dated blank check-ins: started from
HARNESS; project continuation; tool reached; lost text/context; friction; next fix.
No completed trial rows unless Colton supplied actual feedback.

Run the full suite and packaged real UI smoke flow: open app -> choose project ->
reopen conversation -> preview context/send locally -> reach configured tool ->
Journal save/reopen/export. Verify offline Ollama/source behavior, restart/no replay,
Chicago dates, malformed settings, revision conflicts, layout reset isolation,
backup restore, quit/no orphan and fresh-install/upgrade using isolated data.
Recheck keyboard/390px layout and strict CSP in a clean supported browser/webview.
Do not reuse a historical screenshot or cached remote ref as fresh acceptance.

Fix in-scope release failures. Record the exact artifact/source identity, startup
measurements, supported tool/source/model coverage and remaining unavailable paths.
A P0 failure remains a blocker, not a passed checkbox. P1 Hermes/recall can be
explicitly deferred; never market them as connected. Release engineering and
trial completion are separate statuses. No release publication or installation
unless separately requested. Do not create a reminder/automation for the trial.

Done now: checked local release candidate or precise blockers, reviewable artifact
and recovery/run docs. Done after real use: seven days of actual feedback evaluated
against the proposed targets, followed by a small evidence-based fix list. Stop
before agent-runtime, external-provider, voice or reminder scope.
```

## After v1 — the actual agent-runtime milestone

If Colton selects deeper agent operation, first specify one adapter's supported
session identity, project scope, ownership, send/stream/cancel/reconnect behavior,
action preview/approval and durable execution record. Prove one bounded task in an
explicitly owned/attached session. Do not equate durable chat or Hermes activity
imports with a coding agent. This requires a new selected spec/prompt; it is not
silently included in stages 07–15.
