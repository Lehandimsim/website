# Round 4: real headshot everywhere; one font on the start page and the classic site

**Date:** 2026-10-06
**Status:** Done and checked by Claude; awaiting Lehan's look.
**Prompts covered:** `prompt_log.md` entry 2026-10-06 17:57.
**Supersedes:** the 2026-10-01 decision that the minion photo is the placeholder headshot (CLAUDE.md §7).

## 1. What Lehan asked, and what was done

| Lehan asked | Done |
|---|---|
| Start page: the name and the titles ("Classic website", "Kitchen", …) in the same font as the rest of the page | `site/index.html`: `h1`, `.door-title` and `.fun-title` use `--sans` (system-ui: Segoe UI on Windows, San Francisco on Apple devices), as the body text already did. The `--serif` variable is gone. |
| The same for the titles on the classic site | `site/classic/classic.css`: the header name (`.site-title`), page titles (`h1`), section titles (`h2`, e.g. "Performances") and the Art cards' titles (`.card-title`) use `--sans`. `--serif` removed. Sizes and weights unchanged. |
| Use `LZ_headshots-1.jpg` as the headshot on all pages | The photo (4160 × 5101, from the project root) moved to `References/LZ_headshots-1.jpg`, where inputs live. `python tools/make_photos.py References/LZ_headshots-1.jpg --focus 0.49,0.45` made `lehan-headshot.jpg` (start page avatar, XP start menu), `lehan-portrait.jpg` (classic home, Paint home, Kitchen home), `lehan-wide.jpg` (first slide in PowerPoint and Overleaf; Overleaf's file tree now shows `images/lehan-wide.jpg`), `lehan-face.jpg` (Kitchen chef logo) and a new `social-card.png`. `content.js` points at them; alt text "Lehan Zhang". |

## 2. Decisions made along the way

- **The link-preview card** (`social-card.png`) is drawn to match the start page, so its name is now
  Segoe UI Semibold, not Georgia (`tools/make_photos.py`).
- **Start page on narrow phones (≤ 440px):** in the sans font "PowerPoint" ran into its tile's "→".
  The tile arrows are hidden at that width; the whole tile is the link, as with the classic door, whose
  "Enter →" is already hidden on phones.
- **Not changed (not asked):** `pages.html`, `privacy.html` and `404.html` still have serif headings in
  the start page's former style; the Kitchen keeps its serif headings (its own look).
- **The Kitchen chef logo** is now a crop of the real photo; the illustrated face is still to come.

## 3. Checks

Screenshots with `tools/screenshot.py` (no JavaScript errors): start page at 1440, 1024, 460 and 390px;
classic home (desktop, phone), Research and Art; Kitchen home; Paint start and home; PowerPoint slide
show; Overleaf. The face stays centred in every crop (square avatar, tall portrait, slide photo, tight
chef logo, round card photo).

## 4. Open questions for Lehan

1. The four minion files (`site/assets/img/minion-portrait.jpg`, `minion-wide.jpg`,
   `headshot-placeholder.jpg`, `face-placeholder.jpg`) are no longer used but would be published with
   `site/`. Delete them?
2. Same sans font for the headings of `pages.html`, `privacy.html` and `404.html`, to match?
3. Still open: the earlier round-3 questions (CLAUDE.md §8).

## 5. Next steps

Lehan's look at the new photo and fonts; then `GO_LIVE.md` (the headshot was the trigger Lehan named
for going live, 2026-10-02).
