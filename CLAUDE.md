# CLAUDE.md — LIFE/website (lehanzhang.com)

Guidance for Claude Code working in this folder.

---

## 1. What this project is

The personal academic website of **Lehan Zhang** (economist and data scientist; PhD candidate at ETH
Zurich), to be hosted at **lehanzhang.com**. The current phase is **mockups, moving to go-live**
(since 2026-10-02: `GO_LIVE.md`).

Every mockup opens on a landing screen with two obvious doors:

1. **Classic**: a clean, text-based academic site in the style of elliottash.com, songlena.com and
   aakaashrao.github.io.
2. **Fun**: an interactive site, built four different ways so Lehan can compare them:

| Version | Concept | Visual references |
|---|---|---|
| **V1 Kitchen** | Cooking Mama homage. The visitor cooks tomato and egg stir-fry with rice; each ingredient is a page. | pudding.cool/2023/05/kimchi (navigation; clickables glow and wiggle) |
| **V2 Paint** | MS Paint on a Windows XP desktop. The menu bar holds the site's tabs; the last tab is a working canvas whose drawings are sent to Lehan. | `paint_landing.png`, `msPaintmock.png`, `lehanzhang_canvas.png` |
| **V3 PowerPoint** | PowerPoint on a Windows XP desktop. A pulsing "From Beginning" button launches a full-page slideshow; the XP taskbar stays. | `paint_landing.png`, `powerpointMock.png` |
| **V4 Overleaf** | Overleaf as an XP app: file tree (one file per page), a narrow `.tex` editor and a wide beamer preview. Visitors can edit and recompile; History shows them what they changed (not sent to Lehan since 2026-10-06); refreshing restores the original. | Slides styled like V3 |

**Inspiration:** prashantgarg.org. Keep its interactivity, but fix its main flaw: on that site it is
not obvious how to get in. **Here the first screen must make the two choices obvious immediately.**

The full brief is `References/brief_2026-10-01.md` (verbatim). This file is the working summary.

---

## 2. Non-negotiable facts

| Fact | Value |
|---|---|
| Name | Lehan Zhang |
| Email shown on the site | lehan.zhang@gess.ethz.ch. The CV also lists lehan.zhang@hotmail.com, which is **not** shown unless Lehan says so. |
| Home page text | Verbatim as in §2.1 (the brief's text as amended by Lehan on 2026-10-02). Do not paraphrase. |
| All other content | From `References/CV_lehanzhang_oct26.pdf` only, **with the CV's typos fixed** (memo 2026-10-01 §4.2), plus what Lehan has added since (the prompt log and memos: e.g. the Methods line, the abstracts from the papers' PDFs, coauthors' homepages, the Genderbility link). **Never invent** papers, talks, dates, roles, links, quotes or photos. Missing content gets a clearly marked placeholder. |
| Pages (every version), in this order | Home, Research, Talks, Other Experience (teaching and service first, then work experience, awards and extracurriculars), CV, Art (Lehan, 2026-10-02) |
| Lab links | "AI & Economics Lab" links to https://ai-econ-lab.org/ and "Resilient Democracy Lab" to https://resilientdemocracylab.org/ **wherever they appear**. Links inside running text are underlined but otherwise look like the text around them. |
| Photography (external) | https://lehanzzhang.wixsite.com/photography (note the double "z" in `lehanzzhang`) |
| Blog (external) | https://congeecosmicbinchicken.wordpress.com/ |
| Google Scholar (external) | https://scholar.google.com/citations?user=JYuPwdgAAAAJ&hl=en (Lehan, 2026-10-05). Shown before every "CV (PDF)" link. |
| Headshot | `References/LZ_headshots-1.jpg` (since 2026-10-06), cropped by `tools/make_photos.py` for every page, the V1 face logo (until Lehan supplies an illustrated face) and the link-preview card. The minion photo was the placeholder before. |
| Domain | lehanzhang.com, registered with **Wix** since 2019-05-26, **expires 2027-05-26** (Wix auto-renews ~30 days before). Wix DNS already points both `@` (A 75.2.60.5) and `www` (CNAME) at Lehan's **Netlify project `regal-sunflower-00eb2f`**, which today serves a redirect to the Wix photography site (checked 2026-10-02). Wix cannot change nameservers. |
| Hosting target | Static files. **Recommended (2026-10-02): the existing Netlify project**, with `www.lehanzhang.com` as primary domain (`GO_LIVE.md`). Lehan to confirm. |
| Canonical address | `https://www.lehanzhang.com/`, written into the static SEO tags, `sitemap.xml` and `robots.txt`. |
| Go-live | Lehan wants to go live once a real headshot is in (2026-10-02; it is in since 2026-10-06). Steps: `GO_LIVE.md`. The sending backend (`backend/`, Paint drawings) is deployed in Lehan's Google account and its URL is in `config.js` (2026-10-06). Analytics: PostHog key set (2026-10-06); it runs once the site is on lehanzhang.com. |

### 2.1 Home page text (the brief's text, second paragraph amended by Lehan on 2026-10-02; "/tab" = paragraph break)

> **Lehan Zhang**
>
> I am an economist and data scientist. My research focuses on political economics, media, and culture.
>
> I am currently a third year PhD Candidate in the AI & Economics Lab at ETH Zurich, Switzerland.
> Previously, I completed a B. Data Science and Decisions (Quantitative), and B. Economics (Honours Class
> I) (Econometrics) from UNSW Sydney, Australia and worked as a research fellow at the Resilient
> Democracy Lab.
>
> Email: lehan.zhang@gess.ethz.ch

The two lab names are links (§2, "Lab links").

**Research interests line** (Lehan, 2026-10-02), wherever the interests appear:
"Research interests: culture and identity, media, political economics", then on its own line
"Methods: Causal inference, unstructured data, NLP/AI".

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

Ticked = built and checked by Claude (2026-10-01). A version is done only when Lehan has also seen it.

**Shared, every mockup**
- [x] Opens straight onto a two-choice landing (Classic or Fun). No splash screen, no hunting.
      (Since 2026-10-02 the Fun side shows all four versions as tiles, Kitchen first.)
- [x] Works as a plain web page: double-clicking `site/index.html` works, and the same files work on
      any static host.
- [x] Every element can be edited by hand: plain HTML/CSS/JS. All site content and the slide wording
      are in `content.js`; each fun version's own interface wording is in one marked file in its folder
      (memo 2026-10-01 decisions §6; Lehan may want it otherwise).
- [ ] Fun, but still professional. Extra playful touches are welcome. (Lehan's call.)

**V1 Kitchen**
- [ ] The logo is an illustrated version of Lehan's face, swappable by replacing one image file.
      (Built: replace `site/assets/img/face-placeholder.jpg`; the illustration itself is still to come.)
- [x] Navigation modelled on the Pudding kimchi piece. Clickable items are obvious: illuminated and
      gently moving.
- [x] Easy gameplay that feels like following a recipe: tomato and egg stir-fry served with rice, the
      rice cooked in a rice cooker. Each ingredient is one page. **Mapping (decided 2026-10-01):**

      | Ingredient | Page |
      |---|---|
      | Rice, in the rice cooker | Research |
      | Eggs | Talks |
      | Tomatoes | Art |
      | Spring onions and garlic | Other Experience |
      | Seasoning: oyster sauce, Shao Hsing cooking wine, salt, sugar, MSG | CV |
      | Chef logo (Lehan's face) | Home |

      The playable second recipe is fried rice (a placeholder; Lehan may name another dish).
- [x] A recipe book on the counter leads to (a) a second recipe, playable like real Cooking Mama, and
      (b) Lehan's blog ("you can find more recipes here").
- [x] Pictures hanging on the back wall lead to the photography page.
- [x] Works on phones (Lehan, 2026-10-02): held upright, the kitchen keeps its shape and the visitor
      swipes across it (edge arrows, one-time hint, optional Full screen on Android); held sideways,
      the whole kitchen fits. The window shows only part of the Harbour Bridge.

**V2 Paint**
- [x] Landing like `paint_landing.png`: XP Paint window, XP wallpaper visible behind it, XP taskbar
      at the bottom.
- [x] An empty canvas holding one big hand-drawn "start" button.
- [x] Start opens a canvas like `msPaintmock.png` / `lehanzhang_canvas.png`, with a **professional
      headshot** (not the minion photo used in the mock). (Headshot in since 2026-10-06.)
- [x] The menu bar items are the website's tabs. Page text is neat and printed, but Paint-themed.
- [x] The last tab is a working paint canvas. "Save" keeps the drawing and also sends it to Lehan as a
      message. (Sending is stubbed in the mockup.)

**V3 PowerPoint**
- [x] XP desktop and taskbar with PowerPoint open, framed like `paint_landing.png`. The app is
      **PowerPoint 2007 (ribbon) running on Windows XP** (decided 2026-10-01). Slides follow
      `powerpointMock.png`, plus an "Other experience" slide.
- [x] Opens on the Slide Show tab. "From Beginning" is slightly bigger, pulses, and moves on hover.
      (Since 2026-10-02 the pulse runs twice, about 5 s, then rests lit; hover/focus still moves it.
      WCAG 2.2.2: no endless animation.)
- [x] Slide thumbnails with legible titles, as in `powerpointMock.png`.
- [x] From Beginning starts a slideshow that fills the page; the XP taskbar stays visible.

**Minesweeper on the XP desktop (V2–V4)** (Lehan, 2026-10-02)
- [x] A Minesweeper game on the Paint, PowerPoint and Overleaf desktops, opened from an icon directly
      above the Recycle Bin (and Start › Games), economics-academia themed.
- [x] All four themes kept (Lehan, 2026-10-05). The game is called "Minesweeper" (icon, start menu,
      window title: `themes.js` `gameName`); the themes keep their names, Specification Search the
      default. Icon and Specification Search mines: a spiky mine like the classic Windows one (drawn for
      the site).

**V4 Overleaf**
- [x] XP desktop and taskbar with an Overleaf "app" window.
- [x] Three panes: file tree (one file per page) | `.tex` editor (narrower) | beamer preview (wider).
- [x] Slides styled like V3. **Superseded 2026-10-02:** the slides use beamer's Madrid theme (Lehan).
- [x] Real beamer `.tex` in the editor; visitors can edit it and recompile.
- [x] ~~Every recompile's changes are logged so Lehan can see them.~~ **Superseded 2026-10-06:** edits
      are not sent (Lehan); History shows visitors their own changes.
- [x] Refreshing restores the original site (no persistence in the visitor's browser).

---

## 4. Repository map

```
LIFE/website/                      <- project root, in Dropbox. Git repo (.git excluded from Dropbox); remote: private GitHub Lehandimsim/website.
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
├── GO_LIVE.md                     <- Lehan's go-live checklist: backend, PostHog, Netlify, Google, renewals
├── UPDATING.md                    <- Lehan's guide to changing the live site: where things live, check, commit, push, roll back
├── netlify.toml                   <- for Git deploys: publish only site/, no build command
├── promo/                         <- NOT published. Launch trailers made by script (README.md); POSTS.md = posting copy; out/ (git-ignored) = the MP4s
├── backend/                       <- NOT published. apps-script/Code.gs (receives Paint drawings) + README.md (set-up)
├── tools/
│   ├── screenshot.py              <- headless-Edge screenshots + JS error check (§6 Verification)
│   ├── make_photos.py             <- one photo of Lehan -> every crop the site uses + the link-preview card; updates content.js
│   ├── prerender.py               <- static copy of the JS-drawn text in index.html + classic/*.html, for crawlers (--check: is it stale?)
│   └── audit/                     <- axe-core, keyboard flows, tap targets, links, reduced motion (README.md); outputs go to %TEMP%
└── site/                          <- the website. ONLY this folder is ever published.
```

`site/` (built 2026-10-01; what each version does: memo 2026-10-01_decisions_and_mockup_build §3):

```
site/
├── index.html            <- start page (the site's landing page): Classic door + the four fun versions as tiles + "All versions" link; static SEO head + JSON-LD
├── pages.html            <- "All versions" page for visitors ("Lehan Zhang: homepage"; was mockups.html): every version + Minesweeper, jump links, "Show animations anyway"
├── privacy.html          <- what is collected (analytics, drawings; not Overleaf edits). Keep it true when analytics/backend change
├── 404.html              <- the host's "not found" page (the only page with root-relative "/" links)
├── sitemap.xml, robots.txt, favicon.ico/.svg, apple-touch-icon.png, icon-192.png
├── content.js            <- ALL site content (window.SITE), derived from the CV; also SITE.slides (slide wording)
├── config.js             <- default (first) fun version, the four fun versions, endpoints (drawings), analytics (PostHog key, mode, onlyOn)
├── classic/              <- the classic site: six small HTML pages + classic.js (renders them) + classic.css
├── fun/kitchen/          <- V1: index.html (scene), scene.js, pages.js, game.js, text.js (its wording), kitchen.css, game.css
├── fun/paint/            <- V2: app.js, pages.js (TEXT = its wording), draw.js (the paint program), doodle.js, paint.css
├── fun/powerpoint/       <- V3: powerpoint.js, ribbon.js (ribbon + its wording), icons.js, powerpoint.css
├── fun/overleaf/         <- V4: app.js, tex-generate.js, tex-parse.js, tex-editor.js, edit-log.js, madrid.js (Madrid preview), overleaf.css, fonts/ (Latin Modern Sans subsets, GUST licence)
├── shared/site.js        <- helpers (paths, escaping, mini-markdown, coauthor links, version icons, upcoming talks, motion switch) + SiteUtil.track() and the PostHog loader
├── shared/xp/            <- Windows XP desktop shell for V2-V4 (xp.js API: XP.init (incl. about: the tray "i"), XP.alert (modal), XP.balloon, XP.ownKeys, ...); adds the Minesweeper icon itself
├── shared/minesweeper/   <- the game on the XP desktops: themes.js (ALL its wording, one block per theme), art.js, minesweeper.js, minesweeper.css. Deep link ?minesweeper=1|spec|scooped|seminar|rain
├── shared/slides/        <- the deck shared by V3 and V4, in SITE.pages order (deck.js: Deck.fromContent(S, {abstracts}), Deck.render)
└── assets/               <- img/ (placeholder crops, social-card.png, handwriting, Enter key), cv/ (copy of the CV PDF)
```

Each fun version exposes its states as URL hashes (listed in `pages.html`), for deep links and
screenshots.

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
  and edit. No minified first-party code. **One generated piece (Lehan, 2026-10-06):**
  `tools/prerender.py` writes a static copy of the text that the scripts draw into `index.html` and
  `classic/*.html`, between `<!-- prerendered -->` marks, for crawlers that don't run JavaScript. The
  pages still draw everything from `content.js` at run time. **After any change to `content.js`,
  `classic.js` or `config.js` `funVersions`, run it** (`--check` reports stale files). Never edit
  between the marks by hand.
- **Must work from `file://` (double-click) as well as on a static host.** That means:
  - no ES modules (`<script type="module">` is blocked on `file://` in Chrome);
  - no `fetch()`/XHR of local files (also blocked on `file://`). Content loads through a classic
    `<script src="content.js">` that sets a global object;
  - relative paths only, never a leading `/`.
- **Content strings are mini-markdown** (`**bold**`, `*italic*`, `[text](url)`). Render them with
  `SiteUtil.inline()`, never with plain escaping, or raw brackets show. `inline()` gives every link class
  `text-link`; each version styles `a.text-link` as underlined but otherwise like the surrounding text
  (Lehan, 2026-10-02). Buttons, chips and cards keep their own look.
- **One content source.** All text lives in `site/content.js` and every version renders from it.
  V4's `.tex` files are generated from the same content (so a CV update reaches all five sites), and
  must be valid beamer that would compile on real Overleaf.
- **Anything that "sends to Lehan"** (V2 drawings; V4 edits are not sent since 2026-10-06) needs an
  external endpoint, because a static host cannot receive data. The URL lives in `site/config.js`
  (`endpoints.drawings`); the receiver is the Google Apps Script in `backend/apps-script/Code.gs`
  (set-up in `backend/README.md`). While the endpoint is `null`, sending is stubbed and the UI says so.
  Without an endpoint, or when it fails, the site must degrade gracefully (the visitor can still
  download their drawing). Payloads carry `kind: "drawing"`. Keep `Code.gs` and the client in step.
- **Third-party code:** only small, well-known libraries, stored in `site/vendor/` so they work
  offline and on `file://`. **One exception, analytics** (Lehan asked for PostHog, 2026-10-02):
  `shared/site.js` loads PostHog's script from its EU servers at run time, only when
  `config.js` has a key **and** the page is on lehanzhang.com (`analytics.onlyOn`); never on
  `file://` or a local server. Record events with `SiteUtil.track("<version>_<what>", {...})`,
  never by calling `posthog` directly. No other trackers.
- **Privacy page:** `site/privacy.html` describes exactly what analytics and the backend collect. Any
  change to either (config.js `analytics`, `backend/`) must update it in the same session.
- **Static SEO heads:** link previews and some crawlers never run JavaScript, so `index.html` carries
  a static title, description, canonical, `og:`/`twitter:` tags and JSON-LD (`ProfilePage` + `Person`,
  only facts already on the site). When the bio or affiliation in `content.js` changes, update them,
  and `lastmod` in `sitemap.xml`. The start page, `pages.html`, `privacy.html` and the classic pages
  have a `<link rel="canonical">` under `https://www.lehanzhang.com/` and favicon files (not `data:`
  URIs, which Google Search ignores). Since 2026-10-06 every page in the sitemap has its own
  description and `og:`/`twitter:` preview tags (card: `assets/img/social-card.png`); keep a page's
  description true when its content changes, and its `lastmod` current.
- **Photos:** `tools/make_photos.py <photo>` makes every crop (avatar, portrait, slide photo, Kitchen
  face, social card) from one photo and updates `content.js`. Don't crop by hand.
- **Do not ship copyrighted third-party assets:** not Microsoft's "Bliss" wallpaper photograph,
  Windows/Office icons or logos, Cooking Mama artwork, or the Overleaf logo. Recreate the look with
  CSS/SVG, or use openly licensed material.
- **Professional floor:** every fun version has a visible one-click route to the classic site and to
  the CV PDF. Images have alt text, and focus states are visible. `prefers-reduced-motion` turns off
  pulsing and wiggling.
- **How reduced motion is written** (so the reviewers' override works): in CSS,
  `@media (prefers-reduced-motion: reduce) { html:not(.motion-on) .thing { animation: none; } }`; in
  JS, `SiteUtil.prefersReducedMotion()`, never `matchMedia` directly. `shared/site.js` sets class
  `motion-on` from `?motion=on` or the switch on `pages.html` (localStorage `site.motion`).
- **Accessibility floor (audit 2026-10-02):** WCAG 2.2 AA. White text on coloured tiles ≥ 4.5:1;
  targets ≥ 24px (44px on phones where it fits); every dialog modal (XP.alert makes the rest of the
  page inert and keeps Tab inside); no endless animation without a stop; visible focus everywhere.
  Re-run `tools/audit/` after big changes.
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
- `python tools/screenshot.py <page>[#state] out.png [--size 1440x900]` renders a page with headless
  Edge from `file://`, saves a PNG and exits 1 on JavaScript errors. Phone sizes work too
  (`--size 390x844`). The page runs inside an iframe of exactly that size, because a bare page in
  headless Edge is laid out at a smaller size (1416x774 for 1440x900) until just before the capture.
  Every fun version exposes its states as URL hashes (see `site/pages.html`), so each state can be
  screenshotted. Keep screenshots out of the project. `tools/audit/` runs axe-core, keyboard flows,
  tap-target, link and reduced-motion checks (its README).
- Before calling something done, also open it in a real browser, both via `file://` and via a local
  static server (`python -m http.server` in `site/`). Check the console for errors, and check desktop
  and phone widths.
- A version is "done" only when every item for it in §3 is ticked and Lehan has seen it.

**Environment (this machine)**
- Use PowerShell 5.1 for shell work. **Git Bash is broken here:** it receives the Windows-style
  `;`-separated PATH, so bash cannot find any program (`ls`, `git` and `python` all fail). For the same
  reason, the prompt-log hook launches PowerShell directly instead of going through bash.
- `python` is the global Python 3.11 (`%LOCALAPPDATA%\Programs\Python\Python311`). Node.js and the
  GitHub CLI are not installed.
- Git: a repository on `main`, with remote `origin` = https://github.com/Lehandimsim/website.git
  (**private**; it holds the memos, prompt log and References, so it must stay private). Netlify
  deploys `main` once linked (`GO_LIVE.md` step 3b), so every push to `main` goes live. Committing as `Lehan Zhang <led-group@gess.ethz.ch>` (the same
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
| 2026-10-01 | The Rogan paper links to the Dropbox link Lehan sent (with `?rlkey=`). | The CV's version (no `rlkey`) does not open the file; checked. |
| 2026-10-01 | Reduced motion is honoured by default; class `motion-on` (via `?motion=on` or the `pages.html` switch) overrides it. | This PC has Windows "Animation effects" off, so Lehan would otherwise review static mockups. |
| 2026-10-01 | *Provisional:* each fun version keeps its own interface wording in one file in its folder; site content and slide wording stay in `content.js`. | The builders' choice. Keeps `content.js` about Lehan, not about menu jokes. Lehan may overrule. |
| 2026-10-02 | Bio amended: "third year PhD Candidate", "...and worked as a research fellow at the Resilient Democracy Lab." (§2.1). | Lehan. |
| 2026-10-02 | The AI & Economics Lab and the Resilient Democracy Lab are links wherever they appear (bio, affiliation, a talk, a work bullet, the RDL work entry). Links inside running text are underlined but otherwise look like the text around them, in every version. | Lehan asked this for the lab links; applied to all in-text links so links in the same paragraph look alike. |
| 2026-10-02 | A "Methods: Causal inference, unstructured data, NLP/AI" line under the research interests everywhere. | Lehan. |
| 2026-10-02 | One page order everywhere: Home, Research, Talks, Other Experience, CV, Art; "Other Experience" capitalised; Teaching and Service first on that page. The V3/V4 deck follows `SITE.pages`. | Lehan gave this order for Paint; it also satisfies the Classic, Kitchen and Overleaf requests. Lehan confirmed "teaching first" means Other Experience, not Research. |
| 2026-10-02 | Abstracts, verbatim from the papers' PDFs, for the two papers with PDFs: a toggle on the classic site, an Abstract popup in Paint, one Madrid frame per paper in Overleaf. Not in Kitchen or PowerPoint (not asked). | Lehan. |
| 2026-10-02 | Coauthors link to their homepages (checked 2026-10-02; list in `content.js`) in every version. | Lehan asked for the classic site; applied everywhere from the one content file. |
| 2026-10-02 | The start page shows all four fun versions as tiles (Kitchen first); the mockup switcher is gone. `mockups.html` is now the visitor-facing "All versions" page, titled "Lehan Zhang: homepage". | Lehan (Q&A 2026-10-02: "For visitors"). |
| 2026-10-02 | Kitchen clock and day/night window use the visitor's device clock, not an IP lookup. | Lehan chose the recommended option: same result, no third-party call, works offline. |
| 2026-10-02 | Kitchen wall pictures are cartoons of `References/photography_frames/` picture1 (editorial, giant leek), picture2 (flame concert), picture3 (alpine lake). | Lehan asked for a concert, an editorial and one more; these three share an orange / blue-grey palette. |
| 2026-10-02 | V4 Overleaf uses beamer's Madrid theme (supersedes "slides styled like V3"). | Lehan (Q&A 2026-10-02). |
| 2026-10-02 | Each fun version except Overleaf has an "about" note on what inspired it: the Kitchen's porcelain rice bowl; the XP tray "i" in Paint and PowerPoint (also in the XP start menu). | Lehan. |
| 2026-10-02 (round 2) | Start page: "Choose your way in" level with the affiliation line; Kitchen tile lavender; "Or view one of four fun versions"; Classic door "Standard, academic website. No frills." `index.html` is the landing page. | Lehan. |
| 2026-10-02 (round 2) | All tile gradients darkened so white text is ≥ 4.5:1 at both ends (they were 2.1–2.5:1). Below 920px the start page stacks (tiles overflowed on tablets). | WCAG AA; found by the audit. |
| 2026-10-02 (round 2) | `mockups.html` → `pages.html`; its intro says "whimsical". XP start menu (and PowerPoint's recent files): "Blog". | Lehan. |
| 2026-10-02 (round 2) | Art slide: project titles link to each project's first link (YouTube, UNSW page, Instagram), in the shared deck, so PowerPoint gets it too. | Lehan asked for Overleaf; the deck is shared. |
| 2026-10-02 (round 2) | Minesweeper on the XP desktops (icon above the Recycle Bin, Start › Games), four draft themes; default Specification Search until Lehan picks. No quotes attributed to real people (Khoa Vu: nothing verifiable to quote). | Lehan; theme choice pending (§8). |
| 2026-10-02 (round 2) | Sending backend: one Google Apps Script web app (drawings → Drive + Sheet + email; edit logs → Sheet + one daily digest). | Free, Lehan's own account, works with any host; brief/§5 already proposed it. |
| 2026-10-02 (round 2) | Analytics: PostHog EU, loaded from PostHog's servers (exception to the vendor rule), only on lehanzhang.com, nothing stored on the device. Mode `memory` (keeps location) by default; `cookieless` is the alternative (unique visitors, no location). Privacy page added. | Lehan asked for PostHog; PostHog's cookieless mode drops GeoIP (checked in its docs), and Lehan earlier asked where visitors come from. |
| 2026-10-02 (round 2) | Hosting recommendation: the existing Netlify project that lehanzhang.com already points at; `www` primary; canonical `https://www.lehanzhang.com/`. Domain stays at Wix for now. | No DNS change needed; Netlify's advice for external DNS; Lehan wrote "www.lehanzhang.com". |
| 2026-10-02 (round 2) | Accessibility audit (WCAG 2.2 AA) and fixes across the start page, classic site, XP shell, Paint, PowerPoint and Overleaf. | Lehan asked for a thorough check before going live. |
| 2026-10-02 (round 2) | Gerzensee course link updated to its new address (the old one redirected there). | Same page, new URL. |
| 2026-10-05 (round 3) | Art tab: new Writing and Photography blurbs; a "Performances" section (two piano duets) above "Art Projects", stored as `art.performances` with a project's fields (memo 2026-10-05 §2). On slides, the Art slide has two points, Performances and Art Projects. | Lehan. |
| 2026-10-05 (round 3) | "CEPR Discussion Paper", not "CEPR Working Paper". | Lehan (CEPR's series name). The CV PDF still says Working Paper. |
| 2026-10-05 (round 3) | Google Scholar link before every "CV (PDF)" link (start page footer, classic home, Kitchen home, Paint menu bar, XP start menu, Overleaf menu, closing slide) and in the JSON-LD `sameAs`. | Lehan asked for the footer; applied wherever the CV link sits beside the other links. |
| 2026-10-05 (round 3) | Classic: the bio is 19px (was 17px, like the other pages); the name in the header leads to the start page. | Lehan. |
| 2026-10-05 (round 3) | Minesweeper: all four themes stay; spiky-mine icon; About this theme drops "Who gets it:" and labels its text "About this theme:". | Lehan. |
| 2026-10-05 (round 3 follow-up) | The game is "Minesweeper" (`themes.js` `gameName`: icon, start menu, window title); the theme keeps the name "Specification Search", and its mines are now the spiky mine. Supersedes renaming the theme. | Lehan. |
| 2026-10-06 (round 4) | The real headshot (`References/LZ_headshots-1.jpg`) replaces the minion photo everywhere, including the Kitchen chef logo and the link-preview card (memo 2026-10-06_headshot_and_heading_font). | Lehan. |
| 2026-10-06 (round 4) | The start page and the classic site use one sans font (system-ui) throughout; the name and titles were a serif. The link-preview card follows. On phones ≤ 440px the start page tiles drop their "→" (otherwise "PowerPoint" touches it). | Lehan; the card and the arrows follow from it. |
| 2026-10-06 (round 4 follow-up) | `pages.html`, `privacy.html` and `404.html` also use the sans font for headings, so no page of the start-page family has a serif. | Lehan. |
| 2026-10-06 (round 4 follow-up) | Overleaf edits are not sent to Lehan: `Code.gs` takes drawings only (no edit-log tab, no daily digest); the client's sending code and `endpoints.editLog` are gone; History stays as the visitor's own record; the wording and privacy page say edits stay in the browser (memo 2026-10-06_backend_analytics_fonts §2). | Lehan ("No need to send overleaf edits to me"); the client and privacy page follow so nothing claims otherwise. |
| 2026-10-06 (round 4 follow-up) | PostHog: project 296254 on the EU cloud; its key is in `config.js`; mode `memory` until Lehan chooses. Privacy page adds "how quickly the pages load" (the project has web vitals on). | Lehan made the project; region checked against PostHog's servers. |
| 2026-10-06 | SEO: `tools/prerender.py` saves a static copy of the JS-drawn text in the start page and classic pages (the one generated piece; §5); each classic page has its own description; every page in the sitemap has link-preview tags with the social card; sitemap `lastmod` updated; the "needs JavaScript" notices on those pages removed (they work without it now). | Lehan (SEO review A, B, C, F). Without the copy, crawlers that don't run JavaScript saw empty classic pages. |
| 2026-10-06 | Git remote: the private GitHub repo https://github.com/Lehandimsim/website; the whole project (not only `site/`) is pushed to `main`; Netlify publishes only `site/` (`netlify.toml`). | Lehan made the repo and asked to push. It is private (checked: GitHub's public API cannot see it), so the private notes may live there (§5 Privacy). |
| 2026-10-06 | Paint sends drawings for real: Lehan's Apps Script URL in `config.js` `endpoints.drawings`. | Lehan deployed the backend. |
| 2026-10-06 | Launch trailers: direction D + B + A ("my website, but…" labels, in-world captions, slow virtual camera); X 16:9 1920x1080 and Stories 9:16 1080x1920, website always in its desktop layout; works muted, sound effects only, no music; texts in Lehan's blog voice, each approved by Lehan before any video is made; thread in the quest-list tone (memos 2026-10-06_launch_trailers_phase1 and _texts). | Lehan. |
| 2026-10-07 | PowerPoint trailers: no captions naming the effects; the show plays Home, Research, Talks, then the end screen. | Lehan. |
| 2026-10-07 | `text-size-adjust: 100%` in the XP shell (`xp.css`), so phones do not enlarge the scaled slide text in Overleaf and PowerPoint. | Lehan reported slide text overflowing on a phone; enlarged text was the cause found (memo 2026-10-07_overleaf_phone_text_and_search). |
| 2026-10-05 (round 3 follow-up) | Dvořák performance: "Slavonic Dances, Op. 46" (Lehan wrote Op. 42). On the classic site Scholar stays on the home page only; read as not affecting the start page and fun versions (to confirm). | Lehan. |

---

## 8. Open questions for Lehan

Needed before going live (details: memo 2026-10-02_go_live_and_round_2 §10, `GO_LIVE.md`):

1. **Round 4 follow-ups** (memos 2026-10-06_headshot_and_heading_font §4, 2026-10-06_backend_analytics_fonts
   §4): delete the four unused minion files in `site/assets/img/`? Is the new Overleaf wording (edits
   stay in the browser) OK? Later: an illustrated face for the V1 logo.
2. **Round 3 follow-ups** (memo 2026-10-05_round_3_followup §3): does "Scholar only on the classic
   home page" also mean removing it from the start page footer and the fun versions? And is the
   performances' layout OK (memo 2026-10-05_round_3_edits §2)?
2a. **Google still shows the Wix photography entry** for lehanzhang.com (stale, from the old redirect; both sites are clean, checked 2026-10-07). Search Console › Request indexing (`GO_LIVE.md`); DNS TXT at Wix, or send the HTML-tag code for Claude to add. Also: check the Overleaf slides on the phone after the next upload.
3. **Analytics:** key set (2026-10-06). Lehan to switch on **Discard client IP data** in PostHog's
   project settings (the privacy page promises it). Mode: `memory` (keeps country/city; set) or
   `cookieless` (daily unique visitors, no location)?
4. **Dead link:** "Digital Safety in the Metaverse" (Project Rockit) returns 404. Archived copy, new
   link, or no link?
5. **Go live with all four fun versions?** Paint's backend is deployed (2026-10-06); test one drawing
   from the live site.
6. **Hosting:** confirm the existing Netlify project (`regal-sunflower-00eb2f`), `www` primary; check
   whether the Netlify account is on a Legacy or credit plan.
7. **Profiles** for the structured data and backlinks: Google Scholar is in (2026-10-05); ORCID,
   LinkedIn, X/Bluesky, CEPR author page still to come (only ones Lehan confirms).
8. **Link the GitHub repo in Netlify** (`GO_LIVE.md` step 3b): the private repo exists and `main` is
   pushed (2026-10-06). Not linked yet: the push of `4e4f257` (19:17) had not reached the live site
   after 5 minutes; Lehan has been uploading `site/` by hand.
8a. **SEO proposals D and E** (memo 2026-10-06_seo_review §3; A, B, C, F done 2026-10-06): photo and
   institutions in the JSON-LD; redirect the Netlify address and self-canonicals on the fun
   versions. Do them?
8b. **Launch trailers** (memo 2026-10-06_launch_trailers_production): watch the 12 files in
   `promo/out/`; approve the Instagram Stories texts in `promo/POSTS.md` (new; the X thread is approved).
   PowerPoint pair remade 2026-10-07 (no effect captions, show ends after Talks): keep its end-card line
   and the POSTS.md "every transition" wording? (memo 2026-10-07_powerpoint_trailer_edit)
9. **Wording** written by Claude and the builders (memo 2026-10-02_go_live_and_round_2 §8; earlier:
   memo 2026-10-02_review_round_1 §5).

Later / still open from earlier rounds:

10. The dish for V1's playable second recipe (placeholder: fried rice).
11. The Rogan link: fix it in the CV itself (the CV's copy lacks `?rlkey=`); switch the site's link to
    `raw=1` (opens the PDF directly)? Recommended.
12. CV wording left unchanged on the site ("Gradconnection", "PowerBI", "visible Australia's",
    present-tense bullets for past jobs). (The site now says "CEPR Discussion Paper"; the CV PDF still
    says Working Paper.)
13. The Adding Fuel abstract's "Interventions by non-politicians focal influencers" (verbatim from the
    PDF): fix or keep?
14. Photos of the three art projects, if Lehan has them (V2 shows doodles).
15. Builders' judgement calls (memos 2026-10-01 §6, 2026-10-02 §4, 2026-10-02_go_live_and_round_2 §7).
    Defaults stand unless Lehan objects.
16. Domain: optionally move it from Wix to an at-cost registrar (saves about USD 10 a year) before the
    April 2027 auto-renewal. Not urgent.

---

## 9. Current state

**Phase: Lehan's third round of edits (2026-10-05: Art tab, Google Scholar, classic home, Minesweeper)
built and checked by Claude, on top of round 2 (2026-10-02: Minesweeper, go-live groundwork,
accessibility audit). Round 4 (2026-10-06): the real headshot everywhere, and one sans font on the
start page and classic site. Next: Lehan's look, answers to §8, then `GO_LIVE.md`.**

| Deliverable | Status |
|---|---|
| Project scaffolding (`CLAUDE.md`, `Memos/`, `References/`, prompt-log hook) | Done 2026-10-01 |
| `site/content.js`, derived from the CV | Done 2026-10-01; revised 2026-10-02 (twice) |
| Start page and All versions page (`pages.html`) | Revised 2026-10-02 round 2; awaiting Lehan's review |
| Classic site | Revised 2026-10-02 round 2 (accessibility, privacy link); awaiting Lehan's review |
| Shared XP shell (V2-V4) and slide deck (V3-V4) | Revised 2026-10-02 round 2 (modal dialogs, focus, phones; art-slide links) |
| V1 Kitchen | Revised 2026-10-02 round 2 (bridge crop, phones); awaiting Lehan's review |
| V2 Paint | Accessibility fixes 2026-10-02 round 2; awaiting Lehan's review |
| V3 PowerPoint | Accessibility fixes 2026-10-02 round 2; awaiting Lehan's review |
| V4 Overleaf | Art links + accessibility fixes 2026-10-02 round 2; awaiting Lehan's review |
| Round 3 edits (all versions) | Done 2026-10-05 (memos 2026-10-05_round_3_edits and _round_3_followup); awaiting Lehan's review |
| Round 4: headshot everywhere, sans headings (start page, classic, All versions, privacy, 404), no Overleaf edit logs | Done 2026-10-06 (memos 2026-10-06_headshot_and_heading_font, _backend_analytics_fonts); awaiting Lehan's review |
| Minesweeper (V2-V4 desktops) | All four themes kept; the game is "Minesweeper", default theme Specification Search with spiky mines (2026-10-05) |
| Backend for Paint drawings | Deployed by Lehan 2026-10-06; URL in `config.js`; answers its health check. A real drawing still to test (§8.5) |
| Git | Pushed to the private GitHub repo Lehandimsim/website (`main`) 2026-10-06; the 2026-10-07 changes (trailers, memos, phone-text fix) pushed 2026-10-07. Netlify is not linked; the live site is a hand upload (§8.8) |
| Analytics (PostHog) | Key set 2026-10-06 (EU project 296254); runs once live; IP setting and mode to Lehan (§8.3) |
| SEO, privacy page, 404, favicons, social card | Done 2026-10-02 |
| Hosting and domain | Recommendation: existing Netlify project, no DNS change (`GO_LIVE.md`); Lehan confirms (§8.6) |
| Launch trailers (X + Instagram Stories) and X thread | Rendered 2026-10-06: six videos × two formats in `promo/out/`, posting copy `promo/POSTS.md` (memo 2026-10-06_launch_trailers_production); awaiting Lehan's look (§8.8b). Phase 2 will live in a new `promo/` folder, never in `site/` |
