# promo/: launch trailers

Six short trailers of the website, each in two formats (16:9 1920x1080 for X, 9:16 1080x1920 for
Instagram Stories), made by script from the site itself. Never published: Netlify publishes only `site/`,
and nothing here changes `site/`. Posting copy: `POSTS.md`. Plan and decisions: memos
`2026-10-06_launch_trailers_*`.

## Make them

```
python promo/render.py all                    # capture + render every video, both formats (~40 min)
python promo/render.py paint                  # one video
python promo/render.py paint --no-capture     # re-render from the last capture (after editing the edit)
python promo/render.py paint --preview 2 8.5  # stills at those times instead of a video
python promo/render.py paint --fmt story      # one format
```

Needs Python 3.11 with `playwright`, `pillow`, `numpy`; Microsoft Edge (Playwright drives the installed
Edge, no browser download); FFmpeg on PATH. Output: `promo/out/`. Captures and stills go to
`%TEMP%/lehanzhang-promo` (or `$PROMO_CACHE`). `start` reuses the other videos' captures for its
glimpses, so capture those first (`all` does `start` last).

## How it works

- `lib/capture.py`: opens a page from `site/` in headless Edge at the desktop layout (1440x810 CSS
  px, captured at 2x, Minesweeper at 3x) and records it frame by frame on a **virtual clock**: page time,
  timers and every CSS / Web Animation advance exactly 1/30 s per frame, so captures are smooth and the
  same every run. `Math.random` is seeded and can be forced (Minesweeper's boards and loss lines).
  **No network:** every web request is refused; Paint's "send" is answered inside the browser, so no
  drawing reaches Lehan. The mouse is real (hover and clicks work); the visible pointer is drawn later.
- `lib/compose.py`: the edit. Cuts, speed changes, a virtual camera (pan/zoom per format), the pointer
  and click rings, the "my website, but…" label, transitions, end cards, and
  H.264 + AAC encoding with FFmpeg.
- `lib/sfx.py`: every sound effect is synthesised (no recordings, nothing to license).
- `lib/inpage.py`: things added inside the page during a capture only: Paint's red-marker notes (in
  the site's own handwriting), the handwriting reveal, a stand-in text caret for Overleaf.
- `endcard.html`: the shared end card, drawn from `site/content.js` and `site/config.js`.
- `videos/<name>.py`: each video's choreography (`capture()`) and edit (`edit()`). The on-screen texts
  approved by Lehan (2026-10-06) are the constants at the top of each file.
- `fonts/`: Inter (SIL Open Font License, `OFL-Inter.txt`) for the labels and end card.

If the site changes (content, layout), re-run the affected video: selectors are looked up live, but some
camera positions are fixed coordinates in the desktop layout.
