# Project setup, asset audit and build plan

**Date:** 2026-10-01
**Status:** Setup complete. Build not started; it is waiting on the decisions in §6.
**Prompts covered:** `prompt_log.md` entry 2026-10-01 15:22 (the brief, plus "set this project up like
all my other research projects").

---

## TL;DR

- The project is now set up like PROJ_photojournalism: `CLAUDE.md`, `Memos/` and `References/`.
- **Every prompt is now logged automatically** to `Memos/prompt_log.md` by a Claude Code hook. It was
  tested on accented text, emoji, malformed input, a missing folder and a locked file. It becomes active
  in the next session.
- Asset audit: `lehanzhang.com` was a PNG without an image extension (renamed); `pwoerpoint.png` is a
  duplicate; the mockups' photo is the minion photo, but V2 asks for a professional headshot, which we
  do not have yet.
- One inconsistency in the brief: V3 asks for a "Windows XP PowerPoint" with a "Slide Show tab" and a
  "From Beginning" button. Those exist only in PowerPoint 2007 and later, which did run on XP. The
  proposed reading is XP window chrome plus the 2007 ribbon.
- Two features need something a static website cannot do on its own: V2's "send my drawing to me" and
  V4's "log edits so I can see". Recommendation: one free Google Apps Script endpoint on Lehan's
  account.
- **Eight decisions are needed** (§6), each with a recommended default.

---

## 1. What was set up

| Path | Purpose |
|---|---|
| `CLAUDE.md` | Project guide for Claude: facts, requirements checklist, repository map, technical and working rules, decisions, current state |
| `Memos/prompt_log.md` | Every prompt, verbatim, oldest first. Appended automatically. |
| `Memos/2026-10-01_project_setup_and_build_plan.md` | This memo |
| `References/brief_2026-10-01.md` | The brief, verbatim: the design of record |
| `References/*` | The CV and mockups, moved here from the project root |
| `.claude/settings.json` | Registers the prompt-logging hook |
| `.claude/hooks/log_prompt.ps1` | The hook script |

The conventions are taken from PROJ_photojournalism (the most developed project, and the one with a
`CLAUDE.md`): dated memos named `YYYY-MM-DD_<topic>.md` that are never edited retroactively; an
"authoritative sources, in order of precedence" list; and "when the evidence reopens a design
question, say so and let Lehan decide". The session routine (read the markdowns; document problems and
solutions) follows the MixtapeTools workflow in `Codex/_tmp_MixtapeTools`.

None of the earlier projects had an actual prompt log, so its format is new: one heading per prompt,
`### <local date and time> | session <id>`, followed by the prompt as a blockquote.

---

## 2. How prompt tracking works

- **Mechanism.** A `UserPromptSubmit` hook. Claude Code runs it every time a prompt is sent, before
  Claude sees the prompt, so logging does not depend on Claude remembering to do it.
- **Why PowerShell, launched directly.** On this machine Git Bash receives the Windows-style
  `;`-separated PATH and cannot find any program; even `ls` fails. Claude Code runs hooks through bash
  by default, so a normal hook would have failed silently on every prompt. The hook therefore uses
  "exec form": Claude Code launches `powershell.exe` directly, with no shell in between.
- **Tests.** Each test spawned the hook exactly as configured in `settings.json`, against a scratch
  copy of the project:

| Test | Result |
|---|---|
| Normal prompt with accents, curly quotes, en dash, bullet and emoji | Logged byte-exact, about 0.6 s |
| `CLAUDE_PROJECT_DIR` not set | Falls back to the working directory and still logs |
| `Memos/` folder missing | Recreated, and the prompt logged |
| Malformed input | Prompt **not blocked**; a warning is shown |
| Log file locked or read-only | Retries for about 1.5 s (Dropbox can briefly lock files while syncing), then lets the prompt through with a warning |

- **Activation.** Claude Code reads hooks when a session starts. This session's later prompts may
  therefore not be logged automatically; Claude backfills them. From the next session on it is
  automatic. To check or disable the hook, use `/hooks`, or delete `.claude/settings.json`.
- **Caveat.** Everything typed is logged verbatim. Do not paste passwords or API keys; if one slips
  in, redact it from the log.

---

## 3. Asset audit (`References/`)

| File | What it is | Notes |
|---|---|---|
| `CV_lehanzhang_oct26.pdf` | 4-page CV (page 4 is a single line) | The only content source. 18 hyperlinks extracted (§4.1). |
| `paint_landing.png` | 3056x1926 screenshot: XP-era Paint window on the XP "Bliss" wallpaper, inside a browser at `localhost:5173` | Framing reference for V2-V4. It shows no taskbar; the brief adds one. The Bliss photograph is copyrighted, so the look is recreated (§5). |
| `msPaintmock.png` | 1560x1201 screenshot of **Windows 11** Paint (ribbon UI) showing the canvas | Reference for **what V2's first canvas contains**, not for the UI. The brief asks for XP-era Paint (`paint_landing.png`). |
| `lehanzhang_canvas.png` (was `lehanzhang.com`) | 1152x720 PNG of the canvas itself: minion-costume photo with guitar, handwritten "hi! i'm Lehan. welcome to my website", an Enter-key image | It was saved with `.com` as its only extension; Windows treats `.com` as an executable. The handwriting is Lehan's own and could be reused directly in V2. The photo is to be swapped for a professional headshot (brief, V2). |
| `powerpointMock.png` | 1379x1166 screenshot of **modern** PowerPoint (ribbon): slide 1 title (minion photo + home text), 2 Research, 3 Talks, 4 CV ("\*embed dropbox CV here\*"), 5 Art (two boxes: Writing, Photography) | Sets V3's slide order and the Art page's structure (Writing + Photography). It has no "Other experience" slide, which the brief requires. |
| `pwoerpoint.png` | Byte-identical to `powerpointMock.png` (same SHA-256) | Kept, not deleted; delete it if it is not needed. |

The brief's names `psPaintmock.png` and `powerpoint.png` refer to `msPaintmock.png` and
`powerpointMock.png`. A key is at the top of `References/brief_2026-10-01.md`.

---

## 4. Content inventory: CV to pages

| Page | Source | Content |
|---|---|---|
| Home | The brief (verbatim) | Name, two paragraphs, email |
| Research | CV "Research" | Interests (culture and identity, media, political economics) and 3 papers, below |
| Talks | CV "Conferences and Seminar Presentations" | 18 talks: 2026 (10, of which the two October 2026 talks are still upcoming as of today), 2025 (5), 2024 (2), 2023 (1) |
| CV | The PDF | Embedded viewer plus download button |
| Art | CV "Art Projects" and "Lehan Zhang Photography" | Visible Artist's Noticeboard (2023 installation, with a video feature), In the box (2023 video), Genderbility (2023 zine), and the photography practice. **Writing/blog: nothing in the CV.** |
| Other experience | CV "Work Experience", "Teaching", "Awards and Extracurriculars", "Skills", "Certifications" | 8 roles (2017 to present); teaching at ETH (1 course) and UNSW (6 courses); organiser of the AI+Mindfulness symposium (2025); 8 awards and extracurriculars; Python, Stata, R, SQL, C; Mental Health First Aid (2019) |

**Papers**
1. *Adding Fuel to the (Gun)Fire: How Politicians Polarize the Public Debate*, with Gabriele Gratton,
   Pauline Grosjean and Hasin Yousaf. CEPR Working Paper 2026. PDF: gratton.org/papers/AddingFuel.pdf
2. *The Joe Rogan Effect: Politicized Podcasts and the Youth Gender Voting Gap*, with Elliott Ash,
   Sergio Galletta and Federico Masera. Working Paper 2026. PDF on Dropbox (but see §4.2).
3. *Socioeconomic Paths into Misogynistic Online Cultures: Evidence from Reddit*, with Elliott Ash and
   Alexander Hoyle. No link.

**Needed by the brief but not in the CV:** a professional headshot, a face image for the V1 logo,
photography images, blog content, and the dish for V1's playable second recipe. See §6.

### 4.1 Links found in the CV

Extracted from the PDF's link annotations. Which text each link sits on is inferred from document order.

| Link | Attached to |
|---|---|
| mailto:lehan.zhang@hotmail.com, mailto:lehan.zhang@gess.ethz.ch | Header emails |
| www.lehanzhang.com, https://www.lehanzhang.com | Header; photography "View portfolio here" |
| https://szgerzensee.ch/courses/bdp | Swiss Program for Beginning Doctoral Students |
| https://gratton.org/papers/AddingFuel.pdf | Adding Fuel to the (Gun)Fire |
| https://www.dropbox.com/scl/fi/jwpe8kepwumiompwu0q5f/Rogan-ONLINE-VERSION.pdf | The Joe Rogan Effect |
| https://lawecon.ethz.ch/conferences-workshops/ai-mindfulness-symposium.html | Symposium in AI+Mindfulness 2025 |
| https://www.resilientdemocracylab.org/ | UNSW Resilient Democracy Lab |
| https://academic.oup.com/qje/article/138/1/413/6710386 | Grosjean, Masera and Yousaf (2023), QJE |
| https://www.seuil.com/ouvrage/patriarcapitalisme-pauline-grosjean/9782021479867 | Patriarcapitalisme (2021) |
| https://www.facebook.com/MusicBeyondHeadlines/ | Music Beyond Headlines |
| https://headspace.org.au/our-impact/campaigns/cultural-identity/ | "Australia-wide campaign" |
| https://www.sbs.com.au/ondemand/news-series/insight/insight-2023/insight-s2023-ep16/2206880323958 | SBS Insight |
| https://www.sbs.com.au/news/article/lehans-mental-health-suffered-during-covid-19-lockdown-its-a-struggle-many-young-people-shared/uqcj8puiv | SBS news article ("web") |
| https://www.projectrockit.com.au/blog/our-metaverse/ | Digital Safety in the Metaverse |
| https://www.youtube.com/watch?v=Hg2WQwo7xjc | Visible Artist's Noticeboard, "Video Feature" |
| https://www.disabilityinnovation.unsw.edu.au/diversified-storybox-sydney | In the box |

### 4.2 Apparent errors in the CV

The site reproduces CV text, so these would appear on the website too. Decision 7 asks whether to fix
them on the site.

| CV text | Probably meant | Where |
|---|---|---|
| "Zurich Political Economy **Economy** Seminar Series" (twice) | "Zurich Political Economy Seminar Series" | Talks 2026, 2025 |
| "**Partriarcapitalisme** (2021)" | "Patriarcapitalisme": the book's title, per the linked Seuil page | UNSW School of Economics |
| "for **the the** National Youth Mental Health Foundation" | "for the National ..." | headspace |
| "in **anAustralia-wide** campaign" | "in an Australia-wide campaign" | headspace |
| "Australian **Goverment** Senate inquiry" | "Government" | headspace |
| "**non-for-profit**" (twice) | "not-for-profit" | Awards and Extracurriculars |
| "**Develop**, designed, and delivered" | "Developed, designed, and delivered" | UNSW Founders |
| "Jul. 2019 - **March.** 2022" | "Mar. 2022" | UNSW Founders |
| "Bankstown Arts **Center**", "Brain and Mind **Center**", "UNSW **Center** for Ideas" | The official names use "Centre" | Art Projects; Awards |
| Joe Rogan Effect link `dropbox.com/scl/fi/...` with no `rlkey` parameter | Dropbox `scl` share links normally need `?rlkey=...`. Check that the link opens. | Research |

Minor and optional: some past roles use present tense ("Prepare replication reports", "Facilitate and
teach").

---

## 5. Proposed architecture

**Static site, no build step.** Layout as in `CLAUDE.md` §4. It must open by double-click
(`file://`), which rules out ES modules and `fetch()` of local files. Content therefore loads as a
classic script that sets a global.

- **`site/content.js`** is the single content source: `person`, `home`, `research`, `talks`, `cv`,
  `art`, `experience`. Each entry carries its text plus an optional link. The classic site and V1-V4
  all render from it, so a CV update is made in one file.
- **Landing (`site/index.html`)** offers two large, unmissable doors. `?fun=kitchen|paint|powerpoint|overleaf`
  picks the fun version, with the default set in `config.js`. During the mockup phase,
  `site/mockups.html` links the four for side-by-side review.
- **Shared XP shell (`site/shared/xp/`)** provides the desktop, the taskbar (Start button, clock) and
  the Luna window chrome, used by V2-V4. Building it once keeps the three versions consistent and lets
  them be built in parallel. The wallpaper is a CSS/SVG "green hill and blue sky", not Microsoft's
  photograph.
- **V1 Kitchen:** an illustrated SVG kitchen. Hotspots glow and wiggle gently while idle. The recipe is
  a forgiving step sequence (start the rice cooker → crack the eggs → cut the tomatoes → stir-fry →
  plate up), with no fail states, and each step opens its page. The recipe book opens the playable
  second recipe (3-4 Cooking Mama-style micro-games) and the blog link. Wall photos lead to the
  photography page. Before building, study how the Pudding kimchi piece actually navigates (not yet
  looked at first-hand).
- **V2 Paint:** XP Paint chrome (toolbox, palette, status bar, menu bar = site tabs). The start canvas
  leads to page canvases whose text is "printed" in Paint's text-tool style. The last tab is a real
  `<canvas>` with pencil, brush, eraser, fill and the colour palette. Save downloads a PNG and POSTs it
  (with an optional name and message) to the endpoint.
- **V3 PowerPoint:** XP Luna window around a PowerPoint 2007-style ribbon, opening on the Slide Show
  tab with an enlarged, pulsing "From Beginning". The slides pane has thumbnails with readable titles.
  The slideshow fills the page above the XP taskbar; click or the arrow keys advance and Esc exits. It
  can additionally put the whole page into browser full-screen, which keeps the taskbar because the
  taskbar is part of the page.
- **V4 Overleaf:** file tree (`main.tex` plus one `.tex` per page) | editor | preview. **Recompile** runs
  an in-browser renderer for the beamer subset the site uses (title page, frames, frame titles,
  itemize/enumerate, `\textbf`/`\emph`/`\href`, `\includegraphics`, columns), and shows errors
  Overleaf-style. Each recompile sends a diff (time, file, before and after) to the endpoint. Nothing
  is stored in the browser, so refreshing resets. A real TeX engine in the browser (SwiftLaTeX, TeX
  Live in WebAssembly) is ruled out: several MB, and it downloads packages at runtime, which fails on
  `file://`. The `.tex` shown is still real beamer that compiles on Overleaf.
- **Backend (recommended):** a Google Apps Script web app on Lehan's Google account. Drawings are
  saved as PNGs to a Drive folder and logged as rows in a Sheet (time, name, message, link). V4 diffs
  go to a second Sheet tab, with an optional email notification. It is free, Lehan owns the data, and
  a size limit plus a honeypot field keep spam down.

---

## 6. Decisions needed from Lehan

Each has a recommended default; "go with the defaults" is a valid answer.

1. **Backend for V2 drawings and V4 edit logs.**
   (a) Google Apps Script, as above. **Recommended.** About 10 minutes of setup by Lehan; Claude writes
   the script and the steps.
   (b) A form service (Formspree, Getform, EmailJS). Quickest to wire up, but free tiers cap
   submissions and attachments, and the data sits with a third party.
   (c) Netlify Forms or Functions. Only natural if the site is hosted on Netlify.
   Until (a) exists, the mockups save drawings locally and say so.
2. **Hosting.** Where is lehanzhang.com registered and hosted today, and what is on it? (The CV links
   it as the photography portfolio.)
   (a) Cloudflare Pages or Netlify, deploying only `site/` from a private repo. **Recommended:** free,
   HTTPS, custom domain, and the memos stay private.
   (b) GitHub Pages. Free only from a public repo, so the memos and prompt log would become public
   unless `site/` is split into its own repo.
   The mockups do not depend on this; it can be decided at the end.
3. **Images.** Needed: a professional headshot (V2 and the classic site), a face photo to turn into the
   V1 chef logo, and 6-12 photography images (V1's wall and the Art page). Default: clearly labelled
   placeholders, each swappable by replacing one file. Is the minion photo fine on V3's title slide,
   as in the PowerPoint mock?
4. **Blog and photography.** Is there an existing blog or portfolio to link to? Default: both are pages
   on the new site (a placeholder gallery; a blog page with "you can find more recipes here"), easy to
   repoint to external URLs later.
5. **V3's PowerPoint.** Default: XP window chrome plus the PowerPoint 2007 ribbon, laid out like
   `powerpointMock.png`, with "Other experience" added as slide 6. The alternative, genuine
   PowerPoint 2003 menus, has no Slide Show tab and no "From Beginning" button.
6. **V1 ingredients.** Proposed:

   | Item | Page |
   |---|---|
   | Rice in the rice cooker | Research (the slow-cooked staple) |
   | Eggs | Talks |
   | Tomatoes | Art |
   | Spring onions | Other experience |
   | Seasoning (soy sauce, salt, sugar) | CV |
   | Chef-face logo | Home |
   | Recipe book | Playable second recipe + blog |
   | Wall photos | Photography |

   Which dish should the playable second recipe be? Placeholder: fried rice, which reuses the rice
   cooker.
7. **CV errors (§4.2).** Fix them on the site, or reproduce them verbatim? Default: fix them on the
   site; Lehan updates the PDF separately.
8. **Git.** Initialise git now (with `.git` excluded from Dropbox sync) and create a private GitHub repo
   under the account used for photojournalism? Default: yes, once confirmed.

**Minor defaults (override any):**
- Teaching and the AI+Mindfulness symposium go on the Other experience page.
- Education and advisors appear on the CV page above the embedded PDF; the home text stays verbatim.
- The CV page embeds a copy of the PDF from `site/assets/`, not a Dropbox link, which would break if
  the link changes.
- Only the ETH email is shown.
- Talks after today's date are marked "upcoming".

---

## 7. Build plan (once §6 is settled)

1. `site/content.js` from the CV: one file for Lehan to review.
2. The landing page and the classic site: the professional door, which always works.
3. The shared XP shell.
4. V1-V4 in parallel, one subagent each. Each owns its `site/fun/<version>/` folder only and gets
   `CLAUDE.md` §3-§5 plus its paragraph of the brief.
5. The backend (Apps Script), wired through `config.js` and tested end to end with real submissions.
6. Review: every page in a browser via `file://` and a local server, at desktop and phone widths, with
   a clean console. Then Lehan's review.
7. Hosting and domain.

---

## 8. Problems hit today, and how they were solved

| Problem | Resolution |
|---|---|
| Bash cannot find any program (Windows-style PATH) | Used PowerShell throughout. The hook launches PowerShell directly. Recorded in `CLAUDE.md` §6. Lehan may want to fix Git Bash, since it also affects other projects. |
| `lehanzhang.com` looked like a web address but was a PNG saved with `.com` as its extension | Renamed `References/lehanzhang_canvas.png` |
| The brief's file names did not match the files | Key at the top of `References/brief_2026-10-01.md` |
| No existing project had a prompt log to copy | New format, documented at the top of `prompt_log.md` |

---

## 9. Next steps

- Lehan answers §6, either in full or as "defaults".
- Claude records the answers in `CLAUDE.md` §7 and starts the build plan at step 1.
- First thing next session: confirm that the hook logged the opening prompt (`CLAUDE.md` §6, session
  startup).
