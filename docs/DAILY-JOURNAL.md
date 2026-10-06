# Daily journal — direction and implementation

October 6, 2026. Colton wants a quick place to get thoughts out and a journal informed by what he did across his tools, especially Hermes. Local capture and the selected project-record connector/local recap milestone are implemented; broader intelligence integration remains pending.

## Available now

Journal is a registered fourth module, under Chat in the tiled workspace. Workspace 2, Alt+2 and `/journal` open its focused view. One editable reflection and a separate authored activity-notes field are stored per Chicago calendar day. Save writes private, revisioned JSON to `.journal/YYYY-MM-DD.json`; Cmd/Ctrl+Enter also saves. The date picker and history reopen past entries. Save timestamps describe document revisions, rather than an immutable timeline of individual thoughts.

Typing retains per-day browser recovery drafts under `home-journal-draft-v1:YYYY-MM-DD`. These are separate from shell preferences and survive layout resets. Files are the archive; successful saves clear the draft. Errors preserve visible text and the recovery draft when storage works. Conflicting revisions return an error; `[ view saved ]` lets you inspect the file, then `[ return to draft ]` recovers your text against that reviewed revision before you save again.

Export writes current text as Markdown to `.journal/exports/YYYY-MM-DD-journal.md` and displays its path. Repeated exports replace that day's export. Unavailable bridge exports offer copyable Markdown. Created directories use mode 0700 and files 0600, with atomic file replacement; no power-loss durability guarantee or automatic backups. Both folders are ignored by Git and outside the static web root. Read, write and export APIs use the bridge's existing Host/token/Origin/Fetch Metadata gates. No arbitrary file path is accepted.

Manual capture, history and export work now. Stage 06 adds explicit on-demand local Ollama recaps from selected project/task records; automatic scheduling, Hermes activity ingestion, assistant retrieval, voice input and evening reminders are not implemented. The sections below describe the intended full product.

## Everyday flow

Keep a small Journal tile in the existing harness visual language. One action opens today's entry. A text box accepts a rough thought without requiring a title, mood score, or completed template. Save timestamped snippets throughout the day and retain editable entries from previous days. Use America/Chicago for day boundaries.

An evening check-in offers a draft recap of known activity, followed by a single prompt: “What’s on your mind after today?” Colton can correct the recap, add his reflection, and save. A short entry counts; there is no catch-up backlog or streak penalty. If the evening is missed, the next opening can offer yesterday's unfinished reflection without blocking today's capture. Reminder timing and delivery need a user preference before installing a schedule.

For today, a possible recap is “Built the Home dashboard.” That can be grounded in this project's build records. “Did other work in Hermes” is currently Colton's report; details require an actual source. The interface must show incomplete coverage instead of pretending it knows the whole day.

## Activity and reflection

Keep the activity recap and Colton's own words distinct. Recaps carry source references and observation times; user edits retain their authorship. Completed work, plans, failed attempts, and unknown outcomes must remain distinguishable. Deduplicate work described in multiple tools. Treat imported tool content as data, never executable instructions.

The first journal should store durable local files through a narrow bridge API, with explicit saved/error status and exportable entries. Browser drafts can aid recovery but should not be the sole archive. Journal content should remain outside Git. Preserve text across errors, reloads and bridge restarts; layout reset must not affect entries.

Connect activity sources individually. Start with explicitly selected project/task records, then verify the installed Hermes app's supported session export or read interface. Process observation only proves the app is running. No source is connected by this proposal, and no broad transcript scan is required to make initial capture useful.

## Intelligence connection

The intended loop is: selected activity → sourced recap → personal reflection → saved journal → retrievable context for future assistance. The intelligence layer can use finalized entries to recall decisions, unfinished work and recurring themes. Raw thoughts should not silently become permanent profile facts; durable memory promotion should be explicit and editable.

The harness now has local Ollama transport and a selected project-record connector. It has no Hermes session reader or assistant retrieval. A journal UI alone cannot provide them. When a model is connected, disclose which content leaves the machine and which provider receives it. Missing sources or failed generation must leave manual journaling available.

## First implementation milestone

Build one Journal module with quick capture, dated history, reliable local persistence and export. Match the approved shell design. Verify saving/reloading, midnight date handling, literal text rendering, failed-write recovery, and isolation from layout reset. Then add one verified activity connector and a real recap transport, with source coverage visible. Voice capture can follow after the text flow works.

## Stage 06 — implemented selected-record recap

Use `[ read records ]` to inspect coverage and excerpts for the selected day; `[ refresh models ]`, select a real local model, then `[ generate recap ]`. Generation rereads the fixed records, includes only date-matched excerpts and the two owner-written fields, and sends one constructed request through the existing authenticated `/api/ollama` route. The UI discloses this local processing. No automatic model calls or model installation; Chat state is independent.

The fixed inventory is this project's `docs/BUILD-LOG.md`, `/Users/coltonbatts/Documents/Studio Ops/handoffs/dashboard.md`, and exactly the eleven `dashboard-001` through `dashboard-011` Markdown task paths named in `bridge/activity.mjs`. No wildcard enumeration, path input, transcripts or Hermes session reads. Future task files require a reviewed inventory change. Each read reports its path, observation time, status, line references and excerpt truncation. Dates come from Markdown headings/preamble (English month dates or ISO), never file modification time. Historical/superseded sections are excluded. Build/handoff excerpts select the first 3,000 date-matched characters each; task excerpts select the last 650 to prefer latest outcomes. Files over 256 KiB, symlinks, missing/unreadable files and dates with no nonempty body are refused per source. This is incomplete document coverage, not a full event timeline.

Generated recap is a separate readonly model-authored selection field with model, generation time and source snapshot references. It becomes a browser draft on success and is archived only by `[ save entry ]`; it survives date/history/reload and Markdown export. `[ copy recap into my notes ]` explicitly appends a labeled copy to owner-editable notes; reflection is untouched. Optional `generated` data extends existing version-1 files without migration. Failed/refused/canceled/oversized generation leaves the existing entry and recovery draft unchanged; manual capture remains available. The local model returns only 1–24 unique valid candidate numbers. The app validates the exact JSON schema, unique in-range integer selections, then renders at most the first four selected record/owner sentences verbatim with deterministic citations and a visible omitted-selection count. Candidates are capped at 24 sentences and 4,000 characters of JSON, with a 6,000-character total prompt limit. Whole owner fields are included or generation is refused. Candidate sentences are capped at 250 characters; oversized sentences, metadata and cut boundary fragments are omitted rather than paraphrased. Candidate limits and actual transmitted record quotes are previewable in the UI. Imported content is untrusted JSON data with no tools or action authority; arbitrary prose, invented quotes, invalid selections and extra keys are refused. The generated recap is explicitly a model-authored selection of source quotes, not independently verified prose. Source reports can still be stale, contradictory or wrong; review them.

Recaps are bounded, non-streaming, use only installed local models, and have the existing 120s upstream deadline plus a 125s browser deadline. There is no retry/fallback. Cancellation cannot establish that model computation stopped. Source reads are sequential snapshots, not an atomic cross-file transaction; cited line numbers can move after a file edit. Draft/storage/export privacy and revision conflict behavior remain unchanged.
