# Launch trailers: Phase 1 (observations, directions, storyboards)

**Date:** 2026-10-06
**Prompts covered:** `prompt_log.md` 2026-10-06 19:29 (launch trailers for X and Instagram Stories, plus an X thread).
**Status:** Phase 1 only, as Lehan asked. Nothing is built or rendered. Waiting for Lehan to pick a direction,
formats and a pilot video.

---

## 1. What was done

- Explored every version from the code and from 1440x900 screenshots with `?motion=on` (in the session
  scratchpad, not the project): the start page, classic pages, Kitchen (scene, close-ups, recipe book,
  finale, night), Paint (start, home, Research, Talks, Art, Paint!), PowerPoint (editor, slideshow, Art,
  end), Overleaf (main, edit + History, error), and all four Minesweeper themes.
- Read the wording files for jokes and Easter eggs: `kitchen/text.js`, Paint's `TEXT`, PowerPoint's
  `ribbon.js` (dialogs, `PP_SLIDE_FX`), `minesweeper/themes.js`, the XP shell.
- Checked tools: FFmpeg 8 is installed (WinGet); Pillow and NumPy are present; Playwright is not
  (it would be `pip install playwright`, driving the installed Edge, with no browser download).

## 2. Observations that shape the trailers

- **The joke is deadpan and in the details:** the same CV, taken seriously, in software that is not
  meant for it. The best lines are small text in dialogs, menus and labels, so the funny lines need
  close-ups and time to read (at least about 2.5 s for a full sentence).
- **Most quotable moments per version:**
  - *Start + classic:* calm cream page, the five doors; the classic footer's "✦ Try a fun version ▲"
    menu is a hidden door back to the fun versions.
  - *Kitchen:* everything glows and bobs; cooking moments (COOK button, crack the egg twice, chop the
    onion then smash the garlic, slice the tomato, season) with cheers ("Fluffy rice!", "Perfect crack!",
    "Smells amazing!", "So juicy!"); the recipe card fills 0→5; wok → "Dinner is served!" sunburst
    and confetti; the fried-rice game ("Whoa, salty!", "Rice everywhere! Still tasty."); wall pictures
    are cartoons of Lehan's photos (the giant leek); night window with the Harbour Bridge; clock.
  - *Paint:* a giant hand-drawn "start" button that changes fill on every hover; "hi! i'm Lehan"
    handwriting and the Enter key; doodled pages; upcoming talks circled in red; a palette click
    repaints every doodle on the page; the Paint! tab is a real canvas with "Save & send to Lehan" →
    "Sent! Thank you".
  - *PowerPoint:* the pulsing "From Beginning"; **every slide has a different 2007 transition and
    entrance** (Shape Circle + Pinwheel photo, Bounce + Swivel, Random Bars + Custom Path, Wheel, Push +
    Spiral In, Checkerboard + Bounce, Split + Float, Newsflash, Box Out + Boomerang); "End of slide
    show, click to exit."; ribbon gags ("These slides are load-bearing.").
  - *Overleaf:* real beamer source; type an edit, Ctrl+Enter, the Madrid preview updates
    ("Research (edited by a visitor)"); break it and get a real-looking LaTeX error with a hint; History
    shows a diff; "Restore original files".
  - *Minesweeper:* four themes, each with its own face and palette; hovering a square names it
    ("Specification 12: + demographics; county × year FE; wild bootstrap"); levels "Pre-analysis plan /
    Working paper / Top 5 submission"; loss texts ("Your paper exploded", "A 1974 paper did it first,
    with better data", "Not a question, more of a comment…", "Your instrument is now a control
    variable"); win "Robust to everything***".
- **The XP desktop is shared by three versions**, and the Minesweeper icon sits above the Recycle Bin
  on each: plant it in the Paint/PowerPoint/Overleaf trailers, pay it off in its own.
- **Capture gotchas:** this PC asks for reduced motion (use `?motion=on`); first-visit balloons and the
  Kitchen welcome bubble (dismiss or keep per shot); clocks show the real time (fix it); Minesweeper
  layouts and loss reasons are random (seed them); Paint's Save & send would really reach Lehan's
  backend (intercept the request during capture); analytics only run on lehanzhang.com, so captures
  from `file://` or localhost send nothing.

## 3. Directions proposed

A. **Clean cinematic**: no words, just the site and a slow virtual camera. Example: PowerPoint.
B. **In-world captions**: every caption is drawn in the version's own idiom (XP balloons, red Paint
   marker, LaTeX comments, chef bubbles, PowerPoint labels). Example: Overleaf.
C. **Fast teaser**: beat-cut fragments, the cursor kept still across cuts while the world changes.
   Example: a 12 s series sizzle.
D. **"My website, but…"**: one repeatable label opens every video ("My website, but you cook it.")
   and each video revisits the Research page. Example: Kitchen.

**Recommended:** D as the series spine, B for captions, A's camera; C's trick used only inside the
landing video's peeks. Full storyboards for the six videos in the session reply (same content as below
in summary).

## 4. Recommended lineup (durations approximate)

| # | Video | Opening label | End-card line |
|---|---|---|---|
| 1 | Start page + classic, ~16 s | "This is my website." then "So is this." / "And this." ×3 | (the start page itself, with lehanzhang.com) |
| 2 | Kitchen, ~20 s | "My website, but you cook it." | "Kitchen is behind the purple door." |
| 3 | Paint, ~20 s | "My website, but in MS Paint." | "Paint is behind the blue door." |
| 4 | PowerPoint, ~18 s | "My website, but it's a 2007 slideshow." | "PowerPoint is behind the orange door." |
| 5 | Overleaf, ~17 s | "My website, but you can recompile it." | "Overleaf is behind the green door." |
| 6 | Minesweeper, ~20 s | "Also: Minesweeper, for economists." | "It's on the desktop, above the Recycle Bin." |

## 5. Formats (recommendation)

One deterministic capture per video (desktop viewport 1440x900 CSS at 2x pixels), one edit timeline,
rendered twice: **16:9 1920x1080 for X** and **9:16 1080x1920 for Stories** (doubles as a Reel). The
website is never put into a phone viewport; the vertical version frames or crops the desktop render.
Stories end cards leave room for Instagram's link sticker. Silent-first; optional SFX layer; no baked-in
music (Lehan can add an Instagram music sticker).

## 6. Production plan (Phase 2, not started)

New top-level `promo/` folder (never published; Netlify publishes only `site/`). Python + Playwright
driving the installed Edge; fixed clock, seeded randomness, intercepted drawings endpoint, `?motion=on`;
cursor drawn in compositing; FFmpeg for H.264 encoding. No change to `site/`. Pilot first (recommended:
Paint), then the batch.

## 7. Open questions for Lehan

1. Which direction, or which mix (recommended: D + B + A)?
2. Two renders per video (16:9 for X, 9:16 for Stories)?
3. Sound: silent, SFX only (recommended), or music?
4. The label and end-card wording (§4), which is Lehan's to approve.
5. The pilot video (recommended: Paint).
6. Thread tone: one of the three in the session reply, or a mix. The final thread is written after this.

## 8. Next steps

After Lehan's answers: install Playwright (asking first), build `promo/`, render the pilot in both
formats, get approval, then the batch and the final thread.
