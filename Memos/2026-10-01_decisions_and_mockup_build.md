# Decisions, mockup build and review

**Date:** 2026-10-01
**Status:** The classic site and all four fun mockups are built and checked by Claude. Waiting for Lehan's
review.
**Prompts covered:** `prompt_log.md` entries 2026-10-01 15:54 (Lehan's answers to the eight decisions)
and 16:30 (the Joe Rogan paper's Dropbox link).
**Supersedes:** the "Build not started" status and §6 (open decisions) of
`2026-10-01_project_setup_and_build_plan.md`.

---

## TL;DR

- Lehan's eight answers are recorded in `CLAUDE.md` §7 (summary in §1 below).
- Built: `site/content.js` from the CV (typos fixed), the start page, the classic site, a shared
  Windows XP desktop and a shared slide deck. The four fun versions were built in parallel by four
  subagents, one folder each, then reviewed and fixed in the main session.
- **To review:** double-click `site/mockups.html`. It links every version and its main states.
- **This PC asks websites to reduce motion** (Windows "Animation effects" is off), so every mockup
  holds still by default. Use **Show animations anyway** on `mockups.html`, or add `?motion=on` to a
  mockup's address (§4.3).
- The Rogan paper's link in the CV does not open the file. The site now uses the working link Lehan
  sent (§4.1).
- Nothing has been committed since the setup commit (`1230cca`).
- Judgement calls the builders made are listed in §6. The defaults stand unless Lehan objects.

---

## 1. Decisions recorded (prompt 15:54)

| # | Question | Lehan's answer |
|---|---|---|
| 1 | Backend for "send to Lehan" | Keep everything local. Mockups only need to run locally; saving and sending can be stubbed. Apps Script or a form service later, for the chosen version only. |
| 2 | Domain and hosting | lehanzhang.com was bought via Wix and redirects to the Wix photography site. It will become the academic site, which links back to the photography site. Host (Cloudflare Pages, Netlify or GitHub) decided later. |
| 3 | Headshot | The minion photo is the placeholder; a professional headshot comes later. |
| 4 | External sites | Photography: https://lehanzzhang.wixsite.com/photography. Blog: https://congeecosmicbinchicken.wordpress.com/ |
| 5 | V3 software | Windows XP with PowerPoint 2007 is fine. |
| 6 | V1 ingredients | As proposed, except: seasoning = oyster sauce, Shao Hsing cooking wine, salt, sugar, MSG; "spring onions" becomes "spring onions and garlic". |
| 7 | CV errors | Fix them on the site. |
| 8 | git | Yes, initialise it. |

## 2. Corrections to the previous memo

- **The prompt-log hook became active immediately**, not "in the next session" as the setup memo
  says. Prompts 15:54 and 16:30 were logged by it.
- **IDE context.** VS Code adds tags such as `<ide_opened_file>` to prompts. The hook now turns them
  into a one-line note (`_IDE: path was open_`) and a collapsible block for selected text. The 15:54
  entry still shows the raw tag, because the log is append-only.

---

## 3. What was built

### 3.1 Foundation (main session)

| Path | What it is |
|---|---|
| `site/content.js` | All site text, as `window.SITE`, derived from the CV. Also holds the slide wording (`SITE.slides`). |
| `site/config.js` | Default fun version, `mockupMode`, and the two endpoints (`drawings`, `editLog`), both `null`. |
| `site/index.html` | Start page: photo and home text on the left; the Classic and Fun doors on the right. A switcher picks which mockup the Fun door opens (`?fun=`). |
| `site/mockups.html` | Review page: one card per version, with jump links into its states. Delete at launch. |
| `site/classic/` | The classic site: six pages, rendered by `classic.js` from `content.js`; responsive; print styles. |
| `site/shared/site.js` | Helpers: paths, escaping, mini-markdown, upcoming talks, and the motion switch (§4.3). |
| `site/shared/xp/` | The Windows XP shell used by V2 to V4: windows, taskbar, start menu, dialogs, balloons. CSS and SVG only. |
| `site/shared/slides/` | The nine-slide deck shared by V3 and V4: `Deck.fromContent` and `Deck.render`. |
| `site/assets/` | Placeholder photo crops, the handwriting and Enter key from the Paint mock, and a copy of the CV. |
| `tools/screenshot.py` | Headless-Edge screenshots of any page and state, with JavaScript errors reported (§4.2). |

### 3.2 CV content: fixes beyond the list in the setup memo (§4.2)

- **Also fixed:** "4A Centre for Contemporary Asian Art", "Qualtrics" (capitalised), and "$20,000 AUD"
  (spacing).
- **Left as in the CV:** "Gradconnection", "PowerBI", "visible Australia's", and the present-tense
  bullets for past jobs. These may be intended; Lehan to say.

### 3.3 Fun versions V2 to V4 (one subagent each)

**V2 Paint** (`site/fun/paint/`: `app.js`, `pages.js`, `draw.js`, `doodle.js`, `paint.css`)
- **Opening screen:** XP desktop with an "untitled - Paint" window, about 63% of the screen wide. The
  canvas holds one big hand-drawn **start** button (wobbly strokes, a new fill colour on each hover)
  and a red "click me!".
- **Home:** start (or Enter) opens the canvas from `msPaintmock.png`: photo, handwriting and the Enter
  key, with the home text verbatim in a dashed text box below. The Enter key leads to Research.
- **Tabs:** the menu bar becomes Home · Research · Talks · CV · Art · Other experience · Paint!, with
  Alt+letter shortcuts. Every page is a Paint-styled canvas built from `content.js`, and upcoming
  talks are circled in red.
- **Paint!:** a working paint program with all 16 classic tools, flood fill and 25-step undo.
  - **Save & send** downloads the PNG and explains that the mockup is not connected.
  - With an endpoint set, it POSTs JSON as `text/plain`, so Apps Script needs no CORS preflight.
- **Agent's tests:** 34 drawing checks and 46 navigation checks, all passing.

**V3 PowerPoint** (`site/fun/powerpoint/`: `powerpoint.js`, `ribbon.js`, `icons.js`, `powerpoint.css`)
- **Opening screen:** PowerPoint 2007 on XP (Office 2007 pale-blue frame), open at the Slide Show tab.
  **From Beginning** is bigger, glows, pulses and hops on hover; a balloon points to it.
- **Thumbnails** are about 250 px wide, each with a readable title caption.
- **Other views:** the Outline tab, the Slide Sorter, the notes pane, and a working zoom.
- **Slideshow:**
  - fills the page above the XP taskbar, which gains a "PowerPoint Slide Show" button;
  - responds to clicks, keys, swipes, the right-click menu and B/W;
  - uses a "Fade Smoothly" transition by default (others on the Animations tab);
  - ends on "End of slide show, click to exit."
- **Routes out:** "Classic website" and "CV" sit at the right of the tab row.
- **Phones:** the ribbon shrinks to From Beginning, and the thumbnails become a strip.
- **Agent's tests:** 58 desktop and 18 phone input checks, all passing.

**V4 Overleaf** (`site/fun/overleaf/`: `app.js`, `tex-generate.js`, `tex-parse.js`, `tex-editor.js`,
`edit-log.js`, `overleaf.css`)
- **Layout:** XP window with three panes: the file tree (`main.tex` plus one file per page), a narrower
  editor and a wider preview. On phones these become Files / Source / Preview tabs.
- **The `.tex`:**
  - generated at load from the same deck as V3;
  - real beamer (16:9; Carlito, a free font with Calibri's metrics; V3's colours);
  - compiled cleanly by real pdfLaTeX and XeTeX in the agent's tests.
- **Recompile** parses the `.tex` back into slides (a beamer subset). Errors are LaTeX-worded, with a
  file, line and hint, and the last good preview stays up.
- **Edit log:** every recompile with changes is logged as a line diff in the History panel and printed
  to the console as the payload that would be sent. Refreshing restores the original.
- **URLs inside `\href`:** only `%` and `#` are escaped, because a frame body is read as a macro
  argument; `&`, `_` and `~` stay raw. The Rogan URL comes through byte-exact in the PDF.
- **Agent's tests:**
  - round-trip `parse(generate(slides))`: 107 of 107 pass, and still pass after §4's changes;
  - UI: 70 of 70;
  - 400 random corruptions caused no exceptions.

### 3.4 V1 Kitchen (one subagent)

(`site/fun/kitchen/`: `index.html` holds the hand-drawn SVG scene and close-ups; `scene.js`, `pages.js`,
`game.js`, `text.js`, `kitchen.css`, `game.css`)
- **Signposting,** as in the Pudding kimchi piece: every clickable thing has a pulsing yellow glow, a
  gentle bob, a hint dot and a permanent name tag. Hover or focus makes it glow harder and wiggle, with
  a label such as "Rice → Research / Click to cook".
- **The mapping as decided:**
  - rice cooker → Research; eggs → Talks; tomatoes → Art;
  - spring onions and garlic → Other experience;
  - the seasoning shelf (oyster sauce, Shao Hsing wine, salt, sugar, MSG) → CV;
  - the chef logo (the face placeholder) → Home;
  - the three wall pictures → photography (new tab);
  - the wok → the finale.
- **First visit:** a welcome bubble from the chef, which includes "I'd rather read the classic site",
  then a "Start here!" pointer.
- **Recipe flow:**
  - An ingredient plays a one- or two-click close-up (it cannot fail; there is a Skip link), then opens
    its page in a readable panel. Previous/Next follow the recipe.
  - The recipe card tracks progress. When all five are done, the wok serves the finale: the plated
    dish, plus links to the classic site and the CV. "Serve it anyway" works earlier.
- **Recipe book:** a playable fried rice game (chop, crack, stir, pour, toss; stars; every step
  skippable) and "You can find more recipes here", which links to the blog.
- **Always visible:** Classic site, CV (PDF), a Motion switch, and Start page.
- **Agent's tests:**
  - every hash at 1366x768 and 390x844;
  - full mouse, keyboard-only and touch playthroughs;
  - nine window sizes;
  - `file://` and `http.server`;
  - no console errors.
- **Rough edges (agent):**
  - progress lasts for the browser tab only;
  - the animated SVG may cost battery on older phones (Motion off stops it);
  - on phones the welcome bubble covers the top of the scene until it is closed.

---

## 4. Review and fixes after the builds (main session)

### 4.1 The Rogan paper's link (prompt 16:30)

- **Before:** the CV's link has no `?rlkey=...`. Dropbox answers it with an HTML page, even with `raw=1`.
- **Now:** the link Lehan sent (with `rlkey`) works. With `raw=1` it serves the PDF itself (5.3 MB).
  `content.js` uses Lehan's link, with a comment warning not to copy the CV's version back in.
- **Still open:** the CV PDF itself still holds the broken link (`CLAUDE.md` §8).
- **Choice for Lehan:** the link ends in `dl=0`, which opens Dropbox's preview page. `raw=1` would open
  the PDF directly. Recommendation: `raw=1`.

### 4.2 Screenshot tool: pages saw a smaller window at load

- **The problem:** for a 1440x900 window, headless Edge lays the page out at 1416x774 and only resizes
  it to 1440x900 just before capturing. Anything sized once at load, such as XP windows, came out wrong.
- **The fix:** `tools/screenshot.py` now always loads the page in an iframe of exactly `--size`, and
  crops narrow sizes. Checked with a probe page, which saw 1440x900 (and 390x844) from its first line
  of script.

### 4.3 Motion: this PC turns animations off

- **The problem:** this PC has Windows "Animation effects" off (`SPI_GETCLIENTAREAANIMATION` = false).
  Edge and Chrome therefore report `prefers-reduced-motion: reduce`, and every version disables its
  pulsing and wiggling, so Lehan would review static mockups. The builders had each solved this
  differently (Kitchen: a Motion switch; PowerPoint: `#motion`).
- **One shared rule now:**
  - Reduced-motion CSS is written as `@media (prefers-reduced-motion: reduce) { html:not(.motion-on) ... }`,
    so visitors who ask for less motion still get it by default.
  - `shared/site.js` adds class `motion-on` when the address has `?motion=on`, or when localStorage key
    `site.motion` is `"on"`. `?motion=off` clears it.
  - `SiteUtil.prefersReducedMotion()` honours the class.
- **The switch:** `mockups.html` shows a note and a **Show animations anyway** switch, but only on
  computers that ask for reduced motion. When on, it also adds `?motion=on` to its links.
- **Applied to:**
  - the start page, `xp.css`, Paint and PowerPoint (its `pp-motion` became `motion-on`), by the main
    session;
  - Overleaf, by its builder;
  - Kitchen, by its builder: its own Motion switch now writes the shared key, through
    `SiteUtil.setMotion`.
- **Declined:** the Kitchen builder suggested that "off" should also force motion off in the other
  versions. Not done. Only one fun version will survive to launch, and Kitchen's own "off" works within
  Kitchen.
- **Checked** by reading computed animations inside each page:
  - PowerPoint's button is `none` by default and `pp-pulse` with `?motion=on`.
  - Paint's start button is `none` by default and `pt-wobble` when on; `?motion=off` clears it.
  - Kitchen's bobbing objects run 1e-06 s once (still) by default, and 2.6 s on a loop when on.

### 4.4 XP shell fixes (reported by the V2 and V3 builders)

- A dialog opened by an Esc key press closed on that same press. Its Esc listener now starts one tick
  later.
- `.xp-balloon b` styled every bold word in a balloon as its title. It is now `.xp-balloon > b`.
- On phones the desktop icons are hidden, so closing the only window left nothing to reopen it. When
  every window is closed, `body.xp-all-closed` now shows the icons again.
- New `XP.taskButton(win)`. PowerPoint now uses it instead of the internal `win._task`.
- **Checked** in all three XP versions at phone width: icons return after closing everything, the
  window reopens, and a dialog opened with Esc survives that press.

### 4.5 Slide wording moved into `content.js`

`deck.js` had hard-coded "Research interests", "upcoming", "Teaching and service", "Awards and
extracurriculars", "Thank you", the closing slide's link labels, and V3's welcome note. These now live
in `SITE.slides`, and the home slide's email line reuses `home.emailLine`. The output is unchanged,
which the V4 round-trip test confirms. The welcome note no longer says "on the left", which was wrong
on phones.

### 4.6 Verification

- **Screenshots** of every jump-link state of V2 to V4 at 1440x900 and their main states at 390x844,
  plus 1366x768 for V3 and V4. No JavaScript errors.
- **V1 Kitchen:** every jump-link state, the cooking moments, the game and the finale at 1440x900,
  plus the main states at 390x844. No JavaScript errors.
- **Recheck** after the shared changes: the start page, `mockups.html`, the classic site and V2 to V4
  are still free of errors.
- **Over a local web server** (`python -m http.server`): the start page, `mockups.html`, the classic CV
  page and all four versions load with no errors.
- **Not done:** Lehan's own look in a real browser, which the working rules require before a version
  counts as done.

---

## 5. Problems and solutions

| Problem | Solution |
|---|---|
| Edge will not make a window narrower than about 500px | The iframe in `screenshot.py` (now used for every size) |
| Headless Edge lays pages out smaller than the screenshot | Same iframe; see §4.2 |
| Edge's own component extension writes console noise | `screenshot.py` ignores `chrome-extension://` lines |
| The handwriting crop picked up part of the Enter key and lost the "y" descender | Cropped by columns; the key area made transparent |
| The avatar showed the whole minion, tiny | `photo.headshot`, a square face crop |
| The combined teaching+awards slide overflowed | Split into two slides |
| Mockups' jump links overflowed their cards | Joined with spaces so they wrap |
| The CV's Dropbox link does not open the file | Lehan's `rlkey` link (§4.1) |
| The PowerShell safety check blocked a temp-folder cleanup command as a "system path" deletion (a false positive) | Edge profiles for probes now go in the scratchpad, and nothing is deleted |
| The V4 builder needed a real TeX engine to prove the `.tex` compiles | It installed TinyTeX and Tectonic **in the session scratchpad only**; nothing system-wide. The scratchpad is temporary (about 650 MB in total). |

---

## 6. Judgement calls made during the build (defaults kept unless Lehan objects)

**Content and editing (all versions)**
- Each version keeps its own interface wording (menu jokes, button labels, dialog texts) in one
  clearly marked file in its folder:
  - Paint: the `TEXT` block in `pages.js`;
  - PowerPoint: `ribbon.js`;
  - Kitchen: `text.js`.
- Everything from the CV, and the shared slide wording, is in `content.js`. This is a slight widening
  of "all text in one file"; the alternative is one big file holding every version's jokes.

**V1 Kitchen**
1. Fried rice is the playable second dish (a placeholder).
2. The three wall pictures are the builder's own drawings: an alpine lake, Sydney Harbour at sunset,
   and a concert. Real thumbnails from the Wix site would need image files.
3. Previous/Next follow the recipe order (Home, Research, Talks, Art, Other experience, CV), not the
   site's page order.
4. Its wording is in `text.js`: the cheers, the "Chef Lehan" caption and the "Recipes" tag.
5. It has a Motion switch in the top bar, beyond the brief.
6. Progress lasts for the browser tab only, so each visit cooks a fresh dish. The welcome bubble shows
   once per browser.
7. The face logo is swapped by replacing `assets/img/face-placeholder.jpg`. A square image of at least
   256 px is best.

**V2 Paint**
1. Picking a tool on a content page jumps to Paint!, rather than doodling over the page.
2. The Enter key leads to Research.
3. The home text sits below the photo and handwriting; the mock showed only those and the key.
4. The Paint window is classic grey, as in the reference, not XP beige.
5. Save offers three choices: Save and send, Just save, Cancel.
6. The welcome balloon appears on the first visit only.
7. Each page has its own doodle colour.
8. The art projects show generic doodles (a noticeboard, a video box, a zine). Real photos are better
   if Lehan has them.
9. Extras:
   - Flip/Rotate and Invert Colors;
   - a Recycle Bin that can restore a cleared drawing;
   - an About box saying "Not affiliated with Microsoft".

**V3 PowerPoint**
1. The window uses Office 2007's own pale-blue frame, as PowerPoint 2007 looked on XP. The standard XP
   blue title bar is one class away (`pp-office` in `index.html`).
2. Thumbnail captions are kept. Real PowerPoint has none, but the brief asks for legible titles.
3. The default transition is "Fade Smoothly".
4. Most ribbon buttons open playful dialogs; check the tone in `ribbon.js`.
5. The balloon appears until the visitor has started the slideshow once.

**V4 Overleaf**
1. The closing slide is a macro in `home.tex`, called last from `main.tex`, so the deck order matches
   V3.
2. V3's speaker notes are not written into the `.tex`, since they are PowerPoint-specific.
3. The editor opens on `home.tex`, so the first code a visitor sees matches the first slide.
4. Every recompile with new changes is logged, including failed ones. Identical recompiles are not
   logged again.
5. Review, Share and Chat open short explanation dialogs. "Open in Overleaf" was not built, because it
   would send visitors' edits to overleaf.com.

---

## 7. Open questions for Lehan

1. The Rogan link: keep `dl=0` (Dropbox's preview page) or switch to `raw=1` (the PDF opens
   directly)? Recommendation: `raw=1`.
2. Fix the Rogan link in the CV itself, then put the new PDF in `References/`.
3. Still pending from before: the professional headshot, the illustrated face for V1, and the second
   recipe's dish.
4. Photos of the three art projects, if Lehan wants them instead of doodles or plain text.
5. The CV wording left unchanged (§3.2): intended or not?
6. After the review: which fun version goes ahead; then the backend, the host and the domain.
7. Whether to commit the build, and whether to add a private GitHub remote.

## 8. Next steps

1. Lehan reviews everything via `site/mockups.html`. Turn on **Show animations anyway** first.
2. For the chosen version:
   - the real backend for drawings and edit logs, or both;
   - a "not affiliated with Microsoft / Overleaf" note;
   - remove `mockups.html` and the mockup switcher;
   - an accessibility and performance pass;
   - hosting and DNS.
