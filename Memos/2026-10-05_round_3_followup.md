# Round 3 follow-up: Lehan's answers to memo 2026-10-05_round_3_edits §5

**Date:** 2026-10-05
**Status:** Done and checked by Claude.
**Prompts covered:** `prompt_log.md` entry 2026-10-05 12:02 (Lehan's reply to the round-3 summary;
the 11:44 and 11:56 entries are background-task notices, not prompts).
**Supersedes:** memo 2026-10-05_round_3_edits §1 (the "Specification Search" → "Minesweeper" row) and
§5 questions 1–3.

## 1. Answers and what was done

| Lehan's answer | Done |
|---|---|
| "Slavonic Dances, Op. 42" → Op. 46 | `content.js`, the May 2026 performance. |
| "The scholar link should only appear on the classic home page" (answer to "also in the classic footer?") | No change: on the classic site, Scholar stays in the home page's link row only. Read as being about the classic site; the start page footer and the fun versions keep their Scholar links (round 3, as Lehan first asked: "All sites … in the footer"). **To confirm with Lehan.** |
| The Specification Search theme's mines become spiky mines like the new icon | `art.js` `spec.mine`: the icon's mine (eight spikes, black ball, square white glint) at 20×20. The "n.s." label is gone: it would be unreadable on a ball that small. Other themes keep their own mines (scoop, raised hand, thunderstorm). |
| The theme is still "Specification Search"; only the game is "Minesweeper" | New `MS_THEMES.gameName: "Minesweeper"` in `themes.js`. The desktop icon, start menu entry and window title (and so the taskbar button) use it, whatever the theme; `xp.js` `gameLabel()` reads it. The theme's name is back to "Specification Search" in the Theme menu, Help › About this theme, the dialog titles and `pages.html`'s Minesweeper card. |

## 2. Checks

- In the browser (Paint with Specification Search, Overleaf with Exclusion Restriction): window title,
  desktop icon and start menu say "Minesweeper"; Help shows "About this theme: Specification Search" /
  "…: Exclusion Restriction"; no JavaScript errors.
- A lost game (`?minesweeper=spec&ms-demo=lost`): the spiky mines show on grey squares and on the red
  "exploded" square.

## 3. Open

- Confirm the Scholar reading in §1.
- Still open from round 3: the performances' layout (memo 2026-10-05_round_3_edits §2).
