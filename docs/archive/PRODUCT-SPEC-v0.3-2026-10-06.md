# Colton's Home — personal Mac harness

Version 0.3 · October 6, 2026 · Historical planning draft

> Direction reset (October 6, 2026): fixed tool panes and delivery gates below are superseded by the harness task and shell-first BUILD-PROMPTS.md. The binding target is docs/design/home-harness-mockup.html. Shell + Chat is the current stage; Usage and Launcher follow one per stage. Truth, authority, source and session rules below remain in force. See MODULE-CONTRACT.md for the implemented boundary. Native packaging is not yet implemented.

## Product definition

A dedicated Mac app that is Colton's home for his machine: model usage, agent harnesses, sessions, local tools, and eventually everything he can access or do. The opening experience is a real dashboard of useful panes. Cursor, Claude, ChatGPT, and Hermes each have a dedicated place; model usage has a shared pane. Modules let this grow without starting over.

The first question the product answers is: “What is available, what is happening, and where can I work?” Opening a tool, seeing its state, and interacting with it are separate capabilities. Home should grow into Colton's own harness through demonstrated integrations.

## Confirmed direction and remaining decisions

Confirmed by Colton:
- Dedicated Mac app with access to local tools.
- Model usage visible together in a dashboard.
- Hermes and other harnesses/tools arranged in their own panes.
- Personal to Colton; ultimately his own harness.
- Greenfield, first principles. Do not reuse or inspect previous dashboard attempts or assume their product decisions.

Additional clarification from Colton:
- The first tools are Cursor, Claude, ChatGPT, and Hermes, each already used as its own app.
- X means the social feed visited through Dia, a source of distraction, not an X11 window requirement.
- Context switching and forgetting tools exist are the immediate problems.
- v0.1 should gather everything in one space and be modular enough to build on.

Still open: exact accounts/products and usage metrics; preferred visual density; which tool should first support interaction inside Home. These do not block a dashboard prototype or real app opening.

v0.1 interpretation: one modular dashboard with reliable access to all four apps and an honest usage hub. Existing apps may remain separate destinations initially. Embedded sessions and control are the next layer, not implied by having a pane. No social feed, website blocking, or browser surveillance is proposed.

Studio continuity records track this planning task; they do not supply product requirements or import old project knowledge.

## Problem and first-principles reasoning

Colton's capabilities are scattered across tabs and apps. To understand his working environment, he must remember where each tool lives, whether it is running, and whether he has model capacity left. That switching creates overwhelm.

The raw ingredients are: resources he can access, capabilities those resources support, changing state, and interactions he can initiate. The dashboard puts these together in a consistent shell while retaining each tool's real limits.

Four layers:
1. **See:** usage, availability, running sessions, and meaningful failures.
2. **Reach:** open a tool, session, file, or workspace with its context.
3. **Work:** converse with an agent or use a terminal inside Home where supported.
4. **Coordinate:** send a task to a selected harness, track its outcome, and deliberately hand it off.

The long-term vision includes all four. Prove See and Reach, then one complete Work flow. Coordinating agents comes after sessions and ownership are dependable.

## Experience

Home is a persistent, customizable workspace. Initial proposed layout:

| Pane | Useful contents | Primary action |
| --- | --- | --- |
| Model usage | Separate accounts/products, remaining limits or API spend, reset times, freshness | Refresh or open provider usage |
| Hermes | Connection state, explicitly supported session information, selected session | Open Hermes; later interact when verified |
| Cursor / Claude / ChatGPT | Dedicated tool panes with actual supported state and actions | Open/focus; later interact if supported |
| Local workspace (later module) | User-added folders, tools, or project context | Open/reveal |

A status strip reports connections that need attention without flooding the workspace. A command palette finds tools, sessions, destinations, and supported actions. Tool-specific details open within a selected pane. The workspace layout and selection survive relaunch.

Allow resizing, rearranging, collapsing, focusing one pane, and restoring the default layout. Begin with a bounded split/grid layout, not a custom window manager. Pop-out windows and elaborate docking come later if needed. On a small display, panes become selectable views rather than unreadably tiny tiles.

Personal styling matters: substantial workspace, strong typography, clear state indicators, useful density, and restrained animation. This can feel like a cockpit while staying legible. Do not substitute a generic project-card launcher for the requested dashboard.

## Core workflows

**Orient:** launch Home; see connected tools and usage with clear time windows. Identify an agent that needs attention. Missing integrations show their limitations rather than fake values.

**Use Hermes:** choose its pane; see the available connection/session state; open or focus its real interface. Once supported interaction is proven, send input and receive streamed output within Home. Existing sessions must not be silently duplicated or taken over.

**Choose capacity:** compare comparable usage windows by account/product, then choose a tool. Subscription percentages and API dollars are separate measurements, never a single blended “usage score.”

**Continue a session:** choose a tool and session, see its context and supported actions, then open or attach explicitly. Home-owned sessions and externally observed sessions have different controls.

**Recover:** one disconnected source shows its last successful observation, marked stale, plus a retry/open-source action. Other panes continue to work. A dropped connection never causes silent message resend.

## Release scope and acceptance criteria

| Priority | Requirement | Acceptance criteria |
| --- | --- | --- |
| P0 | Native Mac shell | Runnable dedicated app, responsive split/grid dashboard, accessible pane navigation, persistent layout, reset layout, empty and disconnected states. |
| P0 | Usage pane | Display selected products/accounts separately; support multiple windows; show unit, period, source, observation time, and whether values are authoritative, estimated, manual, or unavailable. Missing values never appear as zero. |
| P0 | Honest usage coverage | Implement verified sources relevant to Colton's selected accounts when authorized access exists. Unsupported products have explicit coverage labels and direct usage-page actions; optional manual snapshots remain labeled. Report the automated coverage achieved; do not claim all-model monitoring if it is incomplete. |
| P0 | Hermes pane | At least one real supported connection/open flow for the installed Hermes environment. Implement only verified session/status capabilities; failures remain local to the pane. Opening an app alone is labeled Open, not Connected. |
| P0 | Four real tool modules | Cursor, Claude, ChatGPT, and Hermes each have a dedicated module and verified open/focus path. Missing apps can be located manually. Running state is distinct from connected/session state. No invented session enumeration. |
| P0 | Durable local configuration | Preserve pane arrangement, tool registrations, account labels, selected context, and metadata across relaunch. Credentials stored outside exported configuration. Versioned migrations and recovery/export path. |
| P0 | Command palette | Find configured tools, destinations, exposed sessions, and available actions; keyboard selection and explicit action names; disabled actions explain why. |
| P0 | Controlled access | Connect sources individually through supported authentication. Observe existing sessions by default; control only explicitly attached or Home-owned sessions. No hidden automation or arbitrary model-generated shell execution. |
| P1 | First in-app work flow | Interactive Hermes pane if supported, otherwise one chosen harness/terminal proved end to end. Stream output, show pending/error states, isolate session identities, prevent duplicate sends, and handle reconnect/cancel explicitly. |
| P1 | Additional usage sources | Add one at a time using verified account-specific access, with clear limitations and independently paced refresh. |
| P1 | Terminal sessions | Use a maintained terminal component and PTY bridge; support resizing, Unicode, control keys, exit codes, bounded output, and explicit process lifecycle. Launch only configured tools/actions. |
| P1 | Workspace context | Explicit directory/context for each Home-owned session; local files/apps/resources reachable from the dashboard. No inferred project priorities. |
| P2 | Task coordination | Explicit dispatch to selected harness, provenance, session ownership, progress, handoff, and action history. No automatic provider switching or delegation. |
| P2 | Broader machine access | Browser tabs, files, creative apps, services, and machine controls added as separate capability adapters. |

v0.1 is the modular dashboard and access foundation Colton requested. Its coverage is explicit: four real app destinations, usage according to available sources, and no promised universal embedding. The next milestone proves working inside a pane and grows toward the full harness.

## Model usage: truth and coverage

Account/product identity matters more than a model label. A provider may expose API usage but not subscription capacity, or expose an aggregate plan limit without a per-model breakdown. Display the source's actual granularity. Never manufacture model-level allocation.

Canonical measurement fields: provider, account reference, product, model if supplied, metric type, used value, limit/remaining if known, unit, window start/end, reset time if supplied, observed time, source method, confidence, and status. Support multiple simultaneous windows. User-facing times use America/Chicago with an explicit timezone; persist timestamps consistently.

When a source provides used percent, derive remaining percent only from that explicit measure. Clamp display rounding without hiding malformed source data. A token-based estimate requires a dated price basis and excludes unknown charges. Do not sum API spend and subscription percentages. Deduplicate account-wide usage shown by multiple harnesses; per-session estimates are separate from provider billing.

Source preference: documented provider API → documented local harness interface → user-imported report → manually entered snapshot with timestamp → unavailable plus a direct usage-page action. Do not scrape browser cookies, reuse this chat's credentials, or assume tools available inside Codex can ship as APIs inside an independent app.

Verified planning references:
- OpenAI documents an organization [Costs API](https://developers.openai.com/api/reference/resources/admin/subresources/organization/subresources/usage/methods/costs). This is evidence for API organization cost access, not proof of consumer subscription-limit access.
- Anthropic's [Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api) describes API organization reporting and admin credentials. Subscription coverage requires its own feasibility work.
- Hermes documents a [web dashboard](https://hermes-agent.nousresearch.com/docs/user-guide/features/web-dashboard). Its existence provides a possible integration route; installed-version behavior, authentication, and embedding remain unverified.

## Architecture proposal

Choose the stack after small spikes for real app opening, selected usage-source feasibility, and Hermes integration capabilities. Interactive Hermes work is a later gate; its feasibility should inform the module boundary now. Native feel is required; native UI technology is not yet prescribed.

Candidate approaches: SwiftUI/AppKit shell with isolated adapters, or a desktop web UI with a native bridge if terminal/embedded-tool requirements make that substantially simpler. Evaluate against streaming, terminal support, accessibility, persistence, distribution, and maintainability. Do not build two full applications to compare them.

Boundaries:
- Workspace shell owns pane layout, navigation, and visual state.
- Adapter registry advertises capabilities: usage, list sessions, read state/output, open, attach, send, cancel.
- Observation pipeline normalizes snapshots without upgrading estimates to facts.
- Session broker distinguishes observed, attached, and Home-owned sessions.
- Action router validates target/session and authority before execution.
- Local store persists configuration and appropriate metadata; OS credential storage holds secrets.

Each adapter declares supported versions, account scope, authentication, refresh policy, errors, and resource lifecycle. Prefer supported APIs/CLI protocols over private database writes or UI scraping. A process running is not evidence that a specific agent session is busy.

Native file/app opening can use Apple's [NSWorkspace](https://developer.apple.com/documentation/appkit/nsworkspace). A sandboxed app's persistent file access requires explicit handling of [user-selected resources](https://developer.apple.com/documentation/security/accessing-files-from-the-macos-app-sandbox). Validate sandbox/signing behavior in the actual target configuration.

Embedding an existing app is not universally supported. Choose per tool: native adapter, supported web surface, terminal, or open/focus. Ordinary web embedding may fail due to authentication or frame restrictions; never promise it before a spike.

## Failure and trust rules

- Stale data stays labeled stale; unknown usage stays unknown.
- One adapter crash/time-out cannot block Home or every refresh.
- Background refresh uses bounded polling, backoff, cancellation, and no overlap.
- No secret values in logs, screenshots, configuration exports, or model context.
- Source output is data; it cannot authorize commands, tool calls, or credential changes.
- Starting, attaching, sending, and stopping are distinct actions. Closing a pane does not implicitly kill a tool. Quit behavior for Home-owned sessions is explicit.
- Retries cannot duplicate a message or accidentally start a second session.
- External publication, messages, spending, destructive changes, and permission changes require applicable explicit authorization. Dashboard visibility alone grants no authority.

## Success criteria and validation

Proposed targets, to be measured rather than assumed:
- Within ten seconds of launch, Colton can identify tool availability and the freshness of connected usage readings.
- Reach a configured tool/session within two deliberate actions from Home.
- Core shell remains responsive offline and with one broken adapter.
- Relaunch restores layout and configuration without silently starting or resending work.
- For interactive release: send a message, see streamed output, interrupt supported Home-owned work, and recover from a disconnect with session identity intact.
- During a seven-day trial, Home becomes the voluntary starting point on five days and Colton reports less tab/app switching and less overwhelm.

Validation covers empty setup, disconnected/stale sources, simultaneous usage windows, duplicate account data, timezone/reset handling, rate limits, malformed readings, keyboard navigation, relaunch, and layout reset. Interactive checks additionally cover session isolation, duplicate sends, output volume, resize, process exit, reconnect, and unauthorized control.

## Delivery gates

1. Prototype the confirmed four-tool dashboard; clarify usage accounts when needed.
2. Prototype the pane experience with unmistakable demo data.
3. Prove usage and Hermes access; choose architecture from evidence.
4. Build persistent shell and adapter contracts.
5. Ship all four real open/focus modules and honest usage coverage; evaluate v0.1.
6. Deliver one real in-app work flow; evaluate the harness release.
7. Expand providers, tools, and machine capabilities one demonstrated workflow at a time.

No deadline is assumed. No previous implementation, machine inventory, or old project context is required. The vision stays broad; each gate yields a concrete working slice of Colton's personal harness.

## v0.1 release checklist

- Cursor, Claude, ChatGPT, and Hermes are always discoverable and each opens/focuses through a real supported path.
- The dashboard is modular, keyboard-accessible, resizable, and restores its saved arrangement.
- Usage shows source, scope, freshness, windows, and coverage limits; unavailable data never appears as zero.
- Missing apps, offline sources, and failed refreshes do not block the other tools.
- No old dashboard context or implementation is imported; no X feed is embedded.
- A short trial assesses forgotten tools, context switching, and whether Home helps Colton return to work. No attention tracking or browser blocking is required.
