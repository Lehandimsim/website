# Launch trailers: production

**Date:** 2026-10-06
**Prompts covered:** `prompt_log.md` 2026-10-06 after 19:49 ("yes go ahead with everything. paint the bin
chicken. you can install playwright. … deliver all the videos and the text to post").
**Supersedes:** the open questions in `2026-10-06_launch_trailers_texts.md` §4.
**Status:** All six trailers rendered in both formats (`promo/out/`, 12 MP4s); posting copy in
`promo/POSTS.md`. Awaiting Lehan's look.

## 1. Decisions (Lehan)

- All texts in the videos and the thread approved as drafted (memo `_texts` and the session reply).
- Paint draws the bin chicken; the send dialog's name is "bin chicken" ("Sent! Thank you, bin chicken.").
- Playwright may be installed (done: `pip install playwright` 1.63 for the global Python; it drives the
  installed Edge, no browser download).
- Pilot: Lehan said to go ahead with everything, so the whole batch was made without a separate pilot
  round. Paint was built first and used to settle the method.

## 2. What was built (`promo/`, never published; `site/` untouched)

| Path | What |
|---|---|
| `render.py` | Runs a video: capture, then render both formats (`--no-capture`, `--preview`, `--fmt`) |
| `lib/capture.py` | Frame-exact capture in headless Edge on a virtual clock; network blocked; seeded randomness |
| `lib/compose.py` | Edit, virtual camera per format, pointer + click rings, labels, transitions, FFmpeg encode |
| `lib/sfx.py` | Synthesised sound effects (no recordings) |
| `lib/inpage.py`, `lib/endcard.py`, `endcard.html` | In-page helpers for captures; the shared end card |
| `videos/*.py` | One file per video: choreography + edit; the approved texts are constants at the top |
| `fonts/` | Inter (OFL) |
| `POSTS.md`, `README.md` | Posting copy; how to re-make the videos |

Output, 30 fps H.264 + AAC, faststart: start 18.9 s, kitchen 29.9 s, paint 27.6 s, powerpoint 27.5 s,
overleaf 25.5 s, minesweeper ~25 s. 4–15 MB each. `promo/out/` is git-ignored (re-made by script).

## 3. Problems and solutions

| Problem | Solution |
|---|---|
| Screen recording gives uneven frames | Virtual clock: Playwright's fake clock for JS time; every CSS/Web Animation paused and stepped per frame |
| CDP screenshots ignore the device scale | `clip` with `scale` = 2 (3 for Minesweeper) |
| CDP clip is in document coordinates, so window-scrolled pages came out wrong (classic page) | Clip follows `scrollX/scrollY` |
| Paint's Save & send would really email Lehan | All web requests refused during capture; the drawings endpoint answered inside the browser |
| Minesweeper's mines and loss lines are random | `Math.random` forced: boards designed in `videos/minesweeper.py` so each loss shows the approved line |
| First win board opened in one click: "in 1 seconds" | Board with a wall of mines: two clicks, 9 s of unrecorded game time between |
| Kitchen: "Whoa, salty!" needs the cup ≥ 96 % full | 6 s pour; capture waits for the text |
| Overleaf's textarea caret blinks on the real clock | Stand-in caret drawn on the virtual clock (capture only) |
| Paint's tool positions differ per tab | Selectors, not coordinates |
| PowerShell blocks `Remove-Item` through an env var | The renderer clears its own old stills |

## 4. Notes for Lehan

- Instagram texts in `POSTS.md` (link-sticker labels, optional captions) are new, written in the
  thread's voice: **not yet approved**.
- The per-version links in the Stories (`/fun/paint/` etc.) work only once the site is live.
- The Minesweeper story links to `/fun/paint/?minesweeper=1` (opens the game on the Paint desktop).
- On X, a tweet with a video shows no link card; the link has the last tweet to itself.

## 5. Next steps

Lehan watches the twelve files; changes go into `videos/<name>.py` and are re-rendered with
`--no-capture` (edit only) or a full run (choreography).
