# CLAUDE.md — LIFE/website (lehanzhang.com)

Guidance for Claude Code working in this folder.

---

## 1. What this project is

The personal academic website of **Lehan Zhang** (economist and data scientist; PhD candidate at ETH
Zurich), to be hosted at **lehanzhang.com**. The current phase is **mockups**.

Every mockup opens on a landing screen with two obvious doors:

1. **Classic**: a clean, text-based academic site in the style of elliottash.com, songlena.com and
   aakaashrao.github.io.
2. **Fun**: an interactive site, built four different ways so Lehan can compare them:

| Version | Concept | Visual references |
|---|---|---|
| **V1 Kitchen** | Cooking Mama homage. The visitor cooks tomato and egg stir-fry with rice; each ingredient is a page. | pudding.cool/2023/05/kimchi (navigation; clickables glow and wiggle) |
| **V2 Paint** | MS Paint on a Windows XP desktop. The menu bar holds the site's tabs; the last tab is a working canvas whose drawings are sent to Lehan. | `paint_landing.png`, `msPaintmock.png`, `lehanzhang_canvas.png` |
| **V3 PowerPoint** | PowerPoint on a Windows XP desktop. A pulsing "From Beginning" button launches a full-page slideshow; the XP taskbar stays. | `paint_landing.png`, `powerpointMock.png` |
| **V4 Overleaf** | Overleaf as an XP app: file tree (one file per page), a narrow `.tex` editor and a wide beamer preview. Visitors can edit and recompile; every recompile is logged to Lehan; refreshing restores the original. | Slides styled like V3 |

**Inspiration:** prashantgarg.org. Keep its interactivity, but fix its main flaw: on that site it is
not obvious how to get in. **Here the first screen must make the two choices obvious immediately.**

The full brief is `References/brief_2026-10-01.md` (verbatim). This file is the working summary.

---

## 2. Non-negotiable facts

| Fact | Value |
|---|---|
| Name | Lehan Zhang |
| Email shown on the site | lehan.zhang@gess.ethz.ch. The CV also lists lehan.zhang@hotmail.com, which is **not** shown unless Lehan says so. |
| Home page text | Verbatim from the brief (§2.1). Do not paraphrase. |
| All other content | From `References/CV_lehanzhang_oct26.pdf` only, **with the CV's typos fixed** (memo 2026-10-01 §4.2). **Never invent** papers, talks, dates, roles, links, quotes or photos. Missing content gets a clearly marked placeholder. |
| Pages (every version) | Home, Research, Talks, CV, Art, Other experience (past work experience, awards and extracurriculars) |
| Photography (external) | https://lehanzzhang.wixsite.com/photography (note the double "z" in `lehanzzhang`) |
| Blog (external) | https://congeecosmicbinchicken.wordpress.com/ |
| Photo placeholder | The minion photo (cropped from `References/lehanzhang_canvas.png`) stands in for every headshot and for the V1 face logo, until Lehan supplies a professional headshot and an illustrated face. |
| Domain | lehanzhang.com was bought through Wix and currently redirects to the Wix photography site. It will point at this academic site, which links back to the photography site. |
| Hosting target | Static files. Cloudflare Pages, Netlify or GitHub Pages, chosen later. |
| Mockup scope | **Mockups only need to run locally.** Saving and sending (V2 drawings, V4 edit logs) may be stubbed; the real backend is built only for the version Lehan chooses. |

### 2.1 Home page text (verbatim from the brief; "/tab" in the brief = paragraph break)

> **Lehan Zhang**
>
> I am an economist and data scientist. My research focuses on political economics, media, and culture.
>
> I am currently a PhD Candidate in the AI & Economics Lab at ETH Zurich, Switzerland. Previously, I
> completed a B. Data Science and Decisions (Quantitative), and B. Economics (Honours Class I)
> (Econometrics) from UNSW Sydney, Australia.
>
> Email: lehan.zhang@gess.ethz.ch

The home text and the CV word some things differently. Keep the home text exactly as written, and do
not silently change either one to match the other:

| Home text (brief) | CV |
|---|---|
| AI & Economics Lab | Chair of Law, Data Science, and Economics (Ash Group) |
| B. Data Science and Decisions (Quantitative) | B. Data Science and Decisions (Quantitative Data Science), with Distinction |
| B. Economics (Honours Class I) (Econometrics) | B. Economics (Honours) (Econometrics), First Class Honours |

**When the CV changes**, Lehan adds the new PDF to `References/` and the content file is re-derived from
it. The CV is the source; `site/content.js` is derived from it.

---

## 3. Requirements checklist (from the brief)

**Shared, every mockup**
- [ ] Opens straight onto a two-choice landing (Classic or Fun). No splash screen, no hunting.
- [ ] Works as a plain web page: double-clicking `site/index.html` works, and the same files work on
      any static host.
- [ ] Every element can be edited by hand: plain HTML/CSS/JS, all text in one content file.
- [ ] Fun, but still professional. Extra playful touches are welcome.

**V1 Kitchen**
- [ ] The logo is an illustrated version of Lehan's face, swappable by replacing one image file.
- [ ] Navigation modelled on the Pudding kimchi piece. Clickable items are obvious: illuminated and
      gently moving.
- [ ] Easy gameplay that feels like following a recipe: tomato and egg stir-fry served with rice, the
      rice cooked in a rice cooker. Each ingredient is one page. **Mapping (decided 2026-10-01):**

      | Ingredient | Page |
      |---|---|
      | Rice, in the rice cooker | Research |
      | Eggs | Talks |
      | Tomatoes | Art |
      | Spring onions and garlic | Other experience |
      | Seasoning: oyster sauce, Shao Hsing cooking wine, salt, sugar, MSG | CV |
      | Chef logo (Lehan's face) | Home |

      The playable second recipe is fried rice (a placeholder; Lehan may name another dish).
- [ ] A recipe book on the counter leads to (a) a second recipe, playable like real Cooking Mama, and
      (b) Lehan's blog ("you can find more recipes here").
- [ ] Pictures hanging on the back wall lead to the photography page.

**V2 Paint**
- [ ] Landing like `paint_landing.png`: XP Paint window, XP wallpaper visible behind it, XP taskbar
      at the bottom.
- [ ] An empty canvas holding one big hand-drawn "start" button.
- [ ] Start opens a canvas like `msPaintmock.png` / `lehanzhang_canvas.png`, with a **professional
      headshot** (not the minion photo used in the mock).
- [ ] The menu bar items are the website's tabs. Page text is neat and printed, but Paint-themed.
- [ ] The last tab is a working paint canvas. "Save" keeps the drawing and also sends it to Lehan as a
      message.

**V3 PowerPoint**
- [ ] XP desktop and taskbar with PowerPoint open, framed like `paint_landing.png`. The app is
      **PowerPoint 2007 (ribbon) running on Windows XP** (decided 2026-10-01). Slides follow
      `powerpointMock.png`, plus an "Other experience" slide.
- [ ] Opens on the Slide Show tab. "From Beginning" is slightly bigger, pulses, and moves on hover.
- [ ] Slide thumbnails with legible titles, as in `powerpointMock.png`.
- [ ] From Beginning starts a slideshow that fills the page; the XP taskbar stays visible.

**V4 Overleaf**
- [ ] XP desktop and taskbar with an Overleaf "app" window.
- [ ] Three panes: file tree (one file per page) | `.tex` editor (narrower) | beamer preview (wider).
- [ ] Slides styled like V3.
- [ ] Real beamer `.tex` in the editor; visitors can edit it and recompile.
- [ ] Every recompile's changes are logged so Lehan can see them.
- [ ] Refreshing restores the original site (no persistence in the visitor's browser).

---

## 4. Repository map

```
LIFE/website/                      <- project root, in Dropbox. Local git repo (.git excluded from Dropbox).
├── CLAUDE.md                      <- this file
├── Memos/                         <- dated memos + the prompt log; READ BEFORE CHANGING THE DESIGN
│   ├── prompt_log.md              <- every prompt, verbatim, appended automatically by a hook
│   └── YYYY-MM-DD_<topic>.md      <- progress and decision memos
├── References/                    <- inputs; read-only
│   ├── brief_2026-10-01.md        <- the original brief, verbatim (design of record)
│   ├── CV_lehanzhang_oct26.pdf    <- the content source
│   ├── paint_landing.png          <- framing reference for V2-V4 (XP Paint on the XP wallpaper)
│   ├── msPaintmock.png            <- V2 first-canvas reference (screenshot of Windows 11 Paint)
│   ├── lehanzhang_canvas.png      <- that canvas itself, 1152x720: photo + handwritten "hi! i'm Lehan..."
│   ├── powerpointMock.png         <- V3 layout reference
│   └── pwoerpoint.png             <- byte-identical duplicate of powerpointMock.png
├── .claude/
│   ├── settings.json              <- UserPromptSubmit hook -> Memos/prompt_log.md
│   └── hooks/log_prompt.ps1
└── site/                          <- (not built yet) the website. ONLY this folder is ever published.
```

Proposed layout of `site/`. This is a proposal (memo 2026-10-01 §5); confirm it before building.

```
site/
├── index.html            <- landing: Classic | Fun   (?fun=kitchen|paint|powerpoint|overleaf)
├── mockups.html          <- review page linking the four mockups side by side (removed at launch)
├── content.js            <- ALL text content, as one global object; derived from the CV
├── config.js             <- live fun version, endpoints for drawings/edit logs, feature flags
├── classic/              <- the text-based academic site
├── fun/kitchen/  fun/paint/  fun/powerpoint/  fun/overleaf/
├── shared/xp/            <- Windows XP desktop, taskbar and window chrome, shared by V2-V4
├── assets/               <- images, fonts, a copy of the CV PDF
└── vendor/               <- third-party libraries, if any, stored locally
```

**Authoritative sources, in order of precedence**

1. Lehan's later instructions (the prompt log) and the decisions recorded in memos and §7. They
   supersede the brief where they conflict.
2. `References/brief_2026-10-01.md`, the design of record. It is not final. **When building reveals a
   conflict or a better option, say so and let Lehan decide.** Do not quietly re-plan around it.
3. `References/CV_lehanzhang_oct26.pdf`, for content.
4. The mockup images, for visual intent. They are not pixel specifications.

---

## 5. Technical rules

The first three follow directly from the brief ("load easily as a typical html/web browser page";
"edit every single element"). The rest are proposed defaults, from memo 2026-10-01, that Lehan can
overrule.

- **No build step, no framework, no package manager.** Vanilla HTML, CSS and JS that anyone can open
  and edit. No minified first-party code.
- **Must work from `file://` (double-click) as well as on a static host.** That means:
  - no ES modules (`<script type="module">` is blocked on `file://` in Chrome);
  - no `fetch()`/XHR of local files (also blocked on `file://`). Content loads through a classic
    `<script src="content.js">` that sets a global object;
  - relative paths only, never a leading `/`.
- **One content source.** All text lives in `site/content.js` and every version renders from it.
  V4's `.tex` files are generated from the same content (so a CV update reaches all five sites), and
  must be valid beamer that would compile on real Overleaf.
- **Anything that "sends to Lehan"** (V2 drawings, V4 edit logs) needs an external endpoint, because a
  static host cannot receive data. Endpoint URLs live in `site/config.js`. **In the mockups the
  endpoints are `null` and sending is stubbed:** the UI shows what would happen. Without an endpoint,
  or when it fails, the site must degrade gracefully (the visitor can still download their drawing).
  Google Apps Script or a form service is set up only for the version Lehan picks.
- **Third-party code:** only small, well-known libraries, stored in `site/vendor/` so they work
  offline and on `file://`. No trackers or analytics unless Lehan asks.
- **Do not ship copyrighted third-party assets:** not Microsoft's "Bliss" wallpaper photograph,
  Windows/Office icons or logos, Cooking Mama artwork, or the Overleaf logo. Recreate the look with
  CSS/SVG, or use openly licensed material.
- **Professional floor:** every fun version has a visible one-click route to the classic site and to
  the CV PDF. Images have alt text, and focus states are visible. `prefers-reduced-motion` turns off
  pulsing and wiggling.
- **Mobile:** the classic site is fully responsive. Fun versions must at least be usable on a phone,
  and may point phone visitors to the classic site.
- **Assets:** photos are compressed (roughly 300 KB or less each). Filenames are lowercase with
  hyphens, and always carry an extension.
- **Privacy:** only `site/` is ever published. `Memos/` (including the prompt log), `References/` and
  `CLAUDE.md` stay private. If the repo is public (for example, for free GitHub Pages), publish `site/`
  from a separate repo or branch.

---

## 6. Working rules

**Session startup (Claude)**
- Read this file, the latest memo(s), and the end of `Memos/prompt_log.md`.
- Check that the prompt that started this session is in the log. If it is not, the hook did not fire:
  backfill the entry by hand (marked as backfilled) and tell Lehan.

**Tracking progress: memos and the prompt log**
- The prompt log is automatic. Do not hand-edit it, except to redact a pasted secret or to backfill a
  missed prompt.
- At the end of every working session, and whenever a design decision is made, write a dated memo
  `Memos/YYYY-MM-DD_<topic>.md` covering:
  - which prompts it covers (by their timestamp in the prompt log);
  - what was done;
  - the decisions made, and why;
  - the problems hit, and how they were solved;
  - open questions for Lehan;
  - next steps.
- Memos are history. A later memo supersedes an earlier one; **never edit an earlier memo
  retroactively**. Write a new one that says what changed.
- Then update §7 (Key decisions), §8 (Open questions) and §9 (Current state) of this file.

**Design decisions**
- Interpretation calls that change what visitors see are Lehan's to make: which ingredient is which
  page, slide order, palettes and fonts beyond the references, wording. Propose an option with a
  recommended default, ask, and record the answer in §7.
- Reproduce CV content faithfully. Report apparent errors to Lehan instead of silently fixing them
  (the known list is in memo 2026-10-01 §4.2).

**Parallel builds (subagents)**
- Each subagent owns exactly one folder (`site/fun/<version>/`) and must not edit the shared files
  (`content.js`, `config.js`, `shared/`, `assets/`). Changes to shared files go through the main
  session.
- Give every subagent §3 to §5 of this file plus its version's paragraph of the brief.

**Verification**
- Open every page in a real browser, both via `file://` and via a local static server
  (`python -m http.server` in `site/`). Check the console for errors, and check desktop and phone
  widths.
- A version is "done" only when every item for it in §3 is ticked and Lehan has seen it.

**Environment (this machine)**
- Use PowerShell 5.1 for shell work. **Git Bash is broken here:** it receives the Windows-style
  `;`-separated PATH, so bash cannot find any program (`ls`, `git` and `python` all fail). For the same
  reason, the prompt-log hook launches PowerShell directly instead of going through bash.
- `python` is the global Python 3.11 (`%LOCALAPPDATA%\Programs\Python\Python311`). Node.js and the
  GitHub CLI are not installed.
- Git: a local repository on `main`, committing as `Lehan Zhang <led-group@gess.ethz.ch>` (the same
  identity as PROJ_photojournalism; set in this repo only, since there is no global git identity).
  `.git` is excluded from Dropbox sync, because Dropbox's conflicted copies inside `.git` corrupt
  repositories. If `*conflicted copy*` files ever appear in `.git`, stop and tell Lehan. Commit only
  when Lehan asks.
- Visual checks: Edge headless renders pages to PNG, for example
  `msedge --headless=new --disable-gpu --hide-scrollbars --window-size=1440,900 --screenshot=out.png file:///.../site/index.html`
  (Edge lives in `C:\Program Files (x86)\Microsoft\Edge\Application\`).

---

## 7. Key decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-10-01 | Project set up like PROJ_photojournalism: `CLAUDE.md` + `Memos/` + `References/`. Every prompt is logged automatically by a hook. | Lehan's standing convention. A hook logs every prompt without anyone having to remember to. |
| 2026-10-01 | Inputs moved from the root into `References/`. `lehanzhang.com` renamed `lehanzhang_canvas.png`. | It was a PNG with no image extension, and Windows treats `.com` files as executables. |
| 2026-10-01 | The hook runs Windows PowerShell directly (exec form), not through bash. | Git Bash's PATH is broken on this machine, so a bash-run hook would fail on every prompt. |
| 2026-10-01 | Mockups run locally only; saving and sending are stubbed. The backend (Apps Script or a form service) is built only for the chosen version. | Lehan: "the mockup just needs to run locally". |
| 2026-10-01 | Hosting decided later (Cloudflare Pages, Netlify or GitHub Pages). lehanzhang.com (bought via Wix) will point at the academic site, which links back to the Wix photography site. | Lehan. |
| 2026-10-01 | The minion photo is the placeholder for every headshot and for the V1 face logo. | Lehan will supply a professional headshot later. |
| 2026-10-01 | Photography links to https://lehanzzhang.wixsite.com/photography; the blog is https://congeecosmicbinchicken.wordpress.com/. | Lehan's existing sites. |
| 2026-10-01 | V3 is PowerPoint 2007 (ribbon) on Windows XP. | Only the 2007 ribbon has the "Slide Show tab" and "From Beginning" button that the brief asks for. |
| 2026-10-01 | V1 mapping: rice → Research; eggs → Talks; tomatoes → Art; spring onions and garlic → Other experience; seasoning (oyster sauce, Shao Hsing cooking wine, salt, sugar, MSG) → CV. | Lehan amended Claude's proposal. |
| 2026-10-01 | The CV's typos are fixed on the site (list: memo 2026-10-01 §4.2). | Lehan. The PDF itself is Lehan's to update. |
| 2026-10-01 | git initialised locally, with `.git` excluded from Dropbox sync. No remote yet. | Lehan said yes to git. A GitHub remote is an external step and awaits a separate go-ahead. |

---

## 8. Open questions for Lehan

None blocking. Pending inputs and later choices:

1. A professional headshot, and an illustrated version of Lehan's face for the V1 logo.
2. The dish for V1's playable second recipe (placeholder: fried rice).
3. Which fun version(s) go ahead; then the backend, the host, and pointing lehanzhang.com at it.
4. Whether to add a private GitHub remote (also the off-machine backup for git history, since `.git`
   is excluded from Dropbox).

---

## 9. Current state

**Phase: setup complete (2026-10-01). Build not started; waiting on §8.**

| Deliverable | Status |
|---|---|
| Project scaffolding (`CLAUDE.md`, `Memos/`, `References/`, prompt-log hook) | Done 2026-10-01 |
| `site/content.js`, derived from the CV | Not started |
| Landing page (Classic or Fun) | Not started |
| Classic site | Not started |
| Shared XP desktop shell (V2-V4) | Not started |
| V1 Kitchen | Not started |
| V2 Paint | Not started |
| V3 PowerPoint | Not started |
| V4 Overleaf | Not started |
| Backend for drawings and edit logs | Blocked on §8.1 |
| Hosting and domain | Blocked on §8.2 |

Proposed build order (memo 2026-10-01 §7): `content.js` → landing and classic site → shared XP shell
→ V1-V4 in parallel (subagents) → backend → browser review → hosting.
