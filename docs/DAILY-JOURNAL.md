# Daily journal — direction and implementation

October 6, 2026. Colton wants a quick place to get thoughts out and a journal informed by what he did across his tools, especially Hermes. The local capture milestone is implemented; intelligence integration remains pending.

## Available now

Journal is a registered fourth module, under Chat in the tiled workspace. Workspace 2, Alt+2 and `/journal` open its focused view. One editable reflection and a separate authored activity-notes field are stored per Chicago calendar day. Save writes private, revisioned JSON to `.journal/YYYY-MM-DD.json`; Cmd/Ctrl+Enter also saves. The date picker and history reopen past entries. Save timestamps describe document revisions, rather than an immutable timeline of individual thoughts.

Typing retains per-day browser recovery drafts under `home-journal-draft-v1:YYYY-MM-DD`. These are separate from shell preferences and survive layout resets. Files are the archive; successful saves clear the draft. Errors preserve visible text and the recovery draft when storage works. Conflicting revisions return an error; `[ view saved ]` lets you inspect the file, then `[ return to draft ]` recovers your text against that reviewed revision before you save again.

Export writes current text as Markdown to `.journal/exports/YYYY-MM-DD-journal.md` and displays its path. Repeated exports replace that day's export. Unavailable bridge exports offer copyable Markdown. Created directories use mode 0700 and files 0600, with atomic file replacement; no power-loss durability guarantee or automatic backups. Both folders are ignored by Git and outside the static web root. Read, write and export APIs use the bridge's existing Host/token/Origin/Fetch Metadata gates. No arbitrary file path is accepted.

Manual capture, history and export work now. Automatic recaps, Hermes activity ingestion, assistant retrieval, voice input and scheduled evening reminders are not implemented. The sections below describe the intended full product.

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

The current harness has no working model transport or Hermes session reader. Those are prerequisites for automatic recaps and retrieval by an assistant. A journal UI alone cannot provide them. When a model is connected, disclose which content leaves the machine and which provider receives it. Missing sources or failed generation must leave manual journaling available.

## First implementation milestone

Build one Journal module with quick capture, dated history, reliable local persistence and export. Match the approved shell design. Verify saving/reloading, midnight date handling, literal text rendering, failed-write recovery, and isolation from layout reset. Then add one verified activity connector and a real recap transport, with source coverage visible. Voice capture can follow after the text flow works.
