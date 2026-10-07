# Real BTOP in HARNESS

October 7, 2026. Workspace **0** shows live BTOP in the lower-left tile (replacing Journal). Journal remains on workspace **2**. **Expand**, workspace **3**, **Alt+3**, or **/btop** opens an actual installed btop process in a PTY, rendered by local xterm.js. This is the native program’s live output and controls. Current verified executable: `/opt/homebrew/bin/btop`, version 1.4.6. CPU, memory, disks, network and process values come directly from that program.

Click the terminal to focus input. `m` / Esc opens the btop menu, `q` exits. Mouse controls are passed through xterm’s terminal mouse reports. Stop closes this window’s connection and kills only its PTY process. Start opens a new one. Tiles/other workspaces retain the session. Page reload/tab teardown closes it; a heartbeat catches vanished clients within about 30 seconds. The tiled workspace starts BTOP on load without taking keyboard focus. Returning to workspace0 starts it if stopped. A saved full BTOP layout does not auto-start after reload; click Start or workspace3. The same session moves between tile/full views, with compact tile typography. At least 80×24 characters are retained on narrow screens with scrolling inside the terminal.

## Installation

Run `npm ci` at repository root, then `npm start` or `node bridge/server.mjs`. Installed btop must exist at one of `/opt/homebrew/bin/btop`, `/usr/local/bin/btop`, `/usr/bin/btop`. A missing binary gives an unavailable reason. Native terminal dependency: node-pty1.1.0; websocket ws8.22.0; browser xterm6.0.0 / fit0.11.0. Exact dependency resolution is in package-lock.json. The root postinstall corrects the macOS packaged node-pty spawn-helper executable bit inside node_modules only.

The bundled terminal JS/CSS and MIT licenses are checked in under harness/vendor. Rebuild with `npm run build:terminal`. The build applies guarded CSP compatibility changes to xterm’s three runtime stylesheets and single color setter: styles receive the bridge nonce, colors use CSS property setters. It fails if upstream patterns change. No unsafe-inline script/style allowance or remote CDN is used. esbuild is a development dependency.

## Authority and transport

The bridge remains loopback-only. `/api/btop` WebSocket handshake requires the exact own Host, exact Origin, and per-run bridge token in a subprotocol (no query token). Browser WebSockets do not supply custom authorization headers or dependable Fetch Metadata; the websocket boundary checks its Origin directly. Only the harness-btop subprotocol is negotiated; the token is never returned as a protocol. Query strings/other routes and unauthorized connections refuse before spawning.

Only strict start/resize `{type,cols,rows}` and input `{type,data}` messages are accepted. Geometry bounds40–500×10–200; browser retains80×24 minimum. WebSocket frame limit8KiB, input4KiB; four simultaneous connections maximum,10s initial-start deadline,1MiB slow-output-client cutoff,15s heartbeat. One connection owns one process. Disconnect during startup also kills the eventual child. There is no shell, user executable, arguments, environment, path, URL or command proxy. Fixed argv: `--force-utf --no-tty --update 2000`. Minimal environment includes HOME/TERM/COLORTERM/LANG and a fixed PATH; cwd is the user's home.

Btop uses its normal user configuration and may save its settings normally. Real btop process signals/nice controls operate with the user's ordinary permissions. HARNESS does not escalate privileges. Verification exercised only menu/quit and harness Stop; no process termination/nice operation against another app was performed.

## Verification

85/85 automated checks pass, including new websocket auth/refusal, fixed start/input/resize, output/exit, disconnect cleanup and pending-start cleanup coverage. Existing markup/CSP/auth/journal/chat/usage tests pass. Actual Mac PTY launched and exited by q. Real in-app UI verified live PID, color graphs, menu keyboard control, Stop/reopen, desktop1200×800 and narrow390×844 resize, no document horizontal overflow, and clean browser warning/error log. Evidence: evidence/btop-live.jpg. Existing Stage09 refresh work preserved. No commit/push or native application packaging.
