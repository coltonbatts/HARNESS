# Current boundary — Stage 09

Four active IDs: cursor, claude, codex, hermes. Atlas and its HTTPS destination are removed. Codex extends the same canonical bundle re-selection, identity, executable, persistence and pre-dispatch checks below: com.openai.codex / ChatGPT, default /Applications/ChatGPT.app. Verified read-only installed metadata + executable, not filename, establishes this native route. Without bridge verification the Codex row is CLI-only (run codex in your terminal), never an unverified scheme dispatch. Version-1 stores containing the prior three native IDs load without rewriting, adding the pinned Codex default in memory; subsequent explicit registration persists all four. Invalid stores remain refused/preserved.

The following dated Stage 08 boundary is historical; its Atlas/HTTPS behavior is superseded above.

# Stage 08 registration boundary

Recorded before implementation, October 7, 2026. Only Launcher destinations are in scope.

Keep stable IDs cursor, claude, atlas, hermes (atlas is the historical ChatGPT row ID). ChatGPT defaults to an explicit ordinary https://chatgpt.com/ anchor with target _blank and noopener/noreferrer. The current browser controls tab/window handling; no default-browser, Atlas launch or focus claim. No native ChatGPT registration is offered without supported identity verification; today's ChatGPT.app identifies as com.openai.codex.

Cursor/Claude/Hermes registration accepts exactly {tool,bundlePath} through POST /api/launcher/registration under the existing Host/token/exact Origin/same-origin Fetch Metadata gate, JSON only, 1024-byte bound, no query. User enters/selects a bundle path and explicitly presses Register; selecting a row or editing a path does not register or launch. No configuration import endpoint.

Paths must be canonical absolute .app directories strictly below /Applications or this user's ~/Applications. No traversal, control characters, symlinks/aliases, arbitrary executable or arguments. Read only Contents/Info.plist (bounded 64KiB) via fixed /usr/bin/plutil -convert json -o - <plist>; require the exact approved bundle ID and fixed executable basename for the selected tool. Verify the actual executable is a regular executable file within that bundle. No scanning, executing the bundle, repair or settings changes.

Approved identities: cursor=com.todesktop.230313mzl4w4u92 / Cursor; claude=com.anthropic.claudefordesktop / Claude; hermes=com.nousresearch.hermes / Hermes. ChatGPT HTTPS is fixed and cannot become a arbitrary URL/command. App registrations persist in private git-ignored .launcher/registrations.json outside static serving, version 1; atomic 0600 writes in 0700 directory. Corrupt stores are preserved and native dispatch/updates refused with a recovery reason. Registration failures preserve the preceding registration. Revalidate metadata/path before each dispatch; missing/moved/mismatched bundles refuse before /usr/bin/open. No automatic alternate route/retry.

Native executor remains /usr/bin/open with exactly ['-a', validatedCanonicalBundlePath], shell:false, 5s deadline and bounded output. Process observation uses only the corresponding validated exact main executable; HTTP exposes only registered tool rows. HTTPS has UNKNOWN native process/CPU/focus and never calls the native executor. Per-tool pending and one-second guard retained. Registration clears prior evidence for that destination; restart clears receipts and revalidates persisted paths without launching.

GET /api/state includes registration availability/path/version/reason and per-run evidence. These are read-only observations, not activation. All four original rows remain discoverable even when missing; Configure provides the explicit next action. Browser without bridge retains labeled scheme-request links with unknown native availability; ChatGPT always retains the explicit HTTPS navigation. Tokens/private text are excluded from tracked evidence.
