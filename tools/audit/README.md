# tools/audit/: functionality and accessibility checks

Written for the 2026-10-02 audit (memo 2026-10-02_go_live_and_round_2). They drive headless Edge over
the DevTools protocol (Python 3.11 with `websocket-client` and `requests`; Edge at the usual path).
Run from anywhere; results go to `%TEMP%\lehanzhang-audit\` (or `$env:AUDIT_OUT`), never into the
project. Each script's docstring has its options.

| Script | Checks |
|---|---|
| `axe_run.py [--only paint] [--sizes 1440x900]` | axe-core 4.12 (WCAG 2.0–2.2 A/AA + best practice) on every state in `states.py` |
| `sweep.py file\|http [--only ...] [--shots]` | JS errors, failed loads, horizontal overflow, small tap targets, at five sizes (for `http`, run `python -m http.server 8765` in `site/` first) |
| `flows.py classic\|paint\|powerpoint\|overleaf\|xp\|all` | Keyboard and mouse flows, PASS/FAIL |
| `tabwalk.py <pages>` | Tab order, and that focus is visible at each stop |
| `motion.py` | With reduced motion emulated, nothing animates |
| `overflow.py <pages> --sizes 320x640,...` | Reflow at narrow widths |
| `links.py [--no-external]` | Every local file and `#id` exists; every external link answers |
| `axtree.py`, `headings.py` | The accessibility tree and heading outline, as a screen reader gets them |

`states.py` lists the pages and deep-link states that are checked. Add new states there (the Kitchen
and Minesweeper were not in the first audit). `axe.min.js` is axe-core 4.12.0 (MPL-2.0), used only
by these tests and never published.
