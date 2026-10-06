# Round 2: Lehan's second list, Minesweeper, going live, and an accessibility audit

**Date:** 2026-10-02
**Status:** Everything in the list is built and checked by Claude. Lehan's input is needed on:
- the Minesweeper theme;
- the analytics mode;
- the wording listed in §8;
- the open questions in §10.

Then the go-live steps in `GO_LIVE.md`.
**Prompts covered:** `prompt_log.md` entry 2026-10-02 16:22 (Lehan's list; the prompt was logged by the hook).
**Supersedes:**
- `CLAUDE.md` §2 "Hosting: chosen later". The recommendation is now the existing Netlify project.
- Memo 2026-10-02_review_round_1 §6, analytics proposal. Cookieless mode turns out to drop location; see §3.4.
- The Kitchen's stacked phone layout (memo 2026-10-01 §3 / round 1 §4 Kitchen item 1). One drawing is now used everywhere.

---

## TL;DR

- **Lehan's list, all done:**
  - Start page: alignment, lavender Kitchen, new wording.
  - `pages.html` (renamed from `mockups.html`): "whimsical".
  - Overleaf art-slide links; start menu "Blog".
  - Kitchen: partial bridge, phones.
  - Minesweeper: four playable themed drafts.
- **Going live:**
  - lehanzhang.com is registered at Wix until 2027-05-26, and its DNS **already points at a Netlify project of Lehan's**. Going live is a deploy into that project, with no DNS change.
  - Built: the sending backend (Google Apps Script), PostHog analytics, SEO (head tags, sitemap, robots, favicons, preview card), a privacy page, a 404 page, and a one-command photo tool.
  - `GO_LIVE.md` is the step-by-step.
- **Audit:**
  - WCAG 2.2 AA audit of everything (axe-core, keyboard flows, tap targets, contrast, links).
  - About 40 findings; all fixed except the few in §4.3.
  - One dead link (Project Rockit) needs Lehan's decision.
- **Process:**
  - Seven subagents: Kitchen, Minesweeper, audit, research, then Paint, PowerPoint and Overleaf fixes.
  - The main session did the shared files, the start and All versions pages, the classic site, the XP shell, the backend, analytics, SEO, the photo tool, `GO_LIVE.md`, this memo and `CLAUDE.md`.

---

## 1. Lehan's requests and what was done

| Request | Done |
|---|---|
| Launch page should be the index page, not the mockups page | `index.html` is the landing page (Netlify serves it at `/`). Nothing defaults to the All versions page. Log Off / Turn Off and the 404 page lead to it. |
| "Choose your way in" lines up with "PhD Candidate, AI & Economics Lab, ETH Zurich" | The right column now starts on the tagline's row; the label shares its baseline. |
| Kitchen button a different colour from PowerPoint (lavender or similar) | Lavender `#6a4c9c → #8467bd`. |
| "Or view one of four fun versions" | Done. |
| Classic door: "Standard, academic website. No frills." | Done. |
| URL "pages" not "mockups"; "four whimsical ones" | `mockups.html` → `pages.html`; intro and meta description say "whimsical". All references updated. |
| Overleaf art slide: project titles link to their pages | `**[Title](first link)**` in the shared deck. Overleaf writes `\textbf{\href{…}{…}}` (round trip 154/154). PowerPoint gets the links too, since the deck is shared. |
| Windows start menu "Blog (more recipes)" → "Blog" | Done; also PowerPoint's recent-files entry "Blog.url". The Kitchen recipe book keeps "You can find more recipes here" (its context). |
| Kitchen: show only part of the Harbour Bridge | Close crop: one granite pylon with its lookout window, the deck running out of both sides, the arch's truss climbing out of the top. A small Opera House in front, the city under the deck. Day and night kept. |
| Minesweeper on the XP desktop (Paint, PowerPoint, Overleaf), above the Recycle Bin, economics themed; brainstorm and mockups | §2. |
| Kitchen works on phones (sideways, or horizontal scroll, full screen) | **Upright:** the kitchen keeps its shape at full height and you swipe across it. There are edge arrows, a one-time hint ("Swipe to see the whole kitchen / Or turn your phone sideways…") and an optional Full screen button (Android Chrome). **Sideways:** the whole kitchen fits. Popups are full-screen sheets; the game is playable by touch; targets ≥ 44px. |
| PostHog; the domain; renewal; SEO; drawings and Overleaf edits sent to Lehan | §3 and `GO_LIVE.md`. |
| Thorough functionality and accessibility check | §4. |
| An academic economist's view of the site | Given to Lehan in the session's reply. Summary in §11. |

## 2. Minesweeper

### 2.1 Brainstorm (by the Minesweeper builder)

| # | Concept | Mines / flag / face | Built? |
|---|---|---|---|
| 1 | **Specification Search** (Lehan's p-hacking idea) | Squares are regression specifications. Mines are fragile ones ("n.s."); numbers count fragile specs nearby. A flag footnotes a spec (†). Win: "Robust to everything***". Loss: "Your paper exploded. Specification 13: …the first-stage F-statistic fell to 2.1." | Yes (default) |
| 2 | **Scooped!** (Lehan's idea) | Squares are corners of the literature; mines are rival papers; a flag cites one. Face: an ice-cream cone that loses its scoop. | Yes |
| 3 | **Quick Question** (the econ seminar) | Squares are seats; mines are people about to ask "a quick clarifying question"; a flag is "I'll come back to that". Win: you reach the conclusion slide. | Yes |
| 4 | **Exclusion Restriction** (rainfall IV) | Mines are exclusion-restriction violations; a flag "assumes it away". Its About note cites Mellon (2024, *AJPS*) on 194 potential violations (checked). | Yes |
| 5 | Referee 2 | Mines are Referee 2's comments. | No |
| 6 | Forbidden Comparisons (staggered DiD) | Mines are already-treated controls. | No |
| 7 | `merge m:m` | Mines are duplicate IDs. | No |
| 8 | Job Market | Left out: too close to home on a candidate's site. | No |

**Khoa Vu:** NPR describes him as the PhD student who supplies econ Twitter with memes. No specific post could be verified, so nothing is quoted from or attributed to him or any real person (CLAUDE.md §2: never invent quotes). If Lehan has a particular post in mind, a link (and ideally his OK) would let us credit it.

### 2.2 What was built

- **Code:** `site/shared/minesweeper/` with:
  - `themes.js`: all wording, one block per theme. Lehan edits jokes here.
  - `art.js`, `minesweeper.js`, `minesweeper.css`.
- **How it is loaded:** `shared/xp/xp.js` finds the Recycle Bin itself, puts the game's icon directly above it, adds Start › Games, and loads the game on first open. No app files changed.
- **Rules:** classic. First click is safe; flag by right-click, long-press or Flag mode; chording.
- **Levels:** Beginner 9×9/10, Intermediate 16×16/40, Expert 30×16/99 (not on phones). The level names are themed.
- **Use:** keyboard playable; announces results; best times only in this browser. Switching theme mid-game keeps the board, for comparing themes.
- **Deep links:** `?minesweeper=1|spec|scooped|seminar|rain` (`&ms-level=`, `&ms-demo=won|lost`, `&ms-seed=`).
- **On `pages.html`:** a "Minesweeper" card with one link per theme.
- **Also changed in `xp.js`:** `XP.ownKeys()`, so the game's keys don't reach PowerPoint. App balloon tips are skipped while the game is open.
- **Tests:** 240/240 scripted checks, plus a whole game won by touch at 390×844.
- **Builder's recommendation:** keep **Specification Search** (Lehan's idea; fits the "Methods: causal inference" line). Runner-up: Quick Question.

## 3. Going live

### 3.1 Domain and hosting (checked 2026-10-02)

**Domain (RDAP)**
- Registrar Wix.com Ltd.; registered 2019-05-26; **expires 2027-05-26**; Wix nameservers.
- Status: transfer and update locks (Wix's defaults).

**DNS today**
- `@` A 75.2.60.5 (Netlify) and `www` CNAME `regal-sunflower-00eb2f.netlify.app`.
- Served by Netlify: a 313-byte meta-refresh to the Wix photography site.
- Let's Encrypt certificate for both names, renewed automatically.

**What follows from this**
- **Recommendation:** deploy `site/` into that Netlify project (drag the `site` folder, or link a private GitHub repo; `netlify.toml` publishes only `site/`). Set `www` as the primary domain. No DNS change.
- **Wix:**
  - It cannot change nameservers, so Cloudflare could only serve `www`.
  - Domains auto-renew about 30 days before expiry (around 26 April) on the card on file.
  - Renewal is about USD 21–25 a year (third-party price list; Lehan's account shows CHF).
  - Moving to an at-cost registrar saves about USD 10 a year. Cloudflare is not possible directly; it would take two steps, done before April. Optional.
- **Netlify plans:**
  - A credit-based Free plan (accounts made after 4 Sep 2025) pauses every project when its 300 monthly credits run out. Deploy in batches.
  - A Legacy Free plan has 100 GB a month.
  - Lehan to check which plan the account is on.

### 3.2 Backend: drawings and edit logs

- **Code:** `backend/apps-script/Code.gs` is one Google Apps Script web app (Execute as Me, access Anyone), with set-up steps in `backend/README.md`.
- **Drawings:**
  - Must be a PNG, up to 4 MB.
  - Saved to Drive, added as a Sheet row, and emailed to Lehan with the picture inline.
  - Above 30 an hour: saved but not emailed.
- **Edit logs:** a Sheet row per recompile (time, a random visit id, files, diff, browser); one digest email a day.
- **Safety:**
  - Visitor text is stored as plain text, so Sheets never reads it as a formula (diffs start with `+`/`-`; names could start with `=`).
  - It is escaped in emails.
  - Edit logs are capped at 600 an hour.
  - The Paint form keeps its hidden spam trap.
- **Clients:** payloads now carry `kind`; edit logs carry a per-visit `session`.
- **Tested:** in headless Edge against mock Google services, 16/16 checks. Not yet run against real Google.
- **Confirmed by research (a live probe of a public `/exec` app):**
  - A `text/plain` POST works from any origin, including `file://`'s `null`.
  - The redirect carries `Access-Control-Allow-Origin: *`, and the response is readable.

### 3.3 Analytics: PostHog

- **Loader:** in `shared/site.js` (`startAnalytics`), configured in `config.js` `analytics`.
- **When it runs:** only with a key **and** on lehanzhang.com (`onlyOn`). Tested offline with blocked network: both modes initialise, and the domain guard holds.
- **Options:** `defaults: "2026-05-30"`, `person_profiles: "never"`, `capture_pageleave`, `respect_dnt`; session replay and surveys off.
- **Events:** `SiteUtil.track()` calls in every version:
  - `start_version_chosen`
  - `classic_abstract_opened`, `classic_fun_version_chosen`
  - `kitchen_*` (8 events)
  - `paint_page_opened`, `paint_abstract_opened`, `paint_drawing_sent`
  - `powerpoint_show_started` / `_ended`
  - `overleaf_recompiled`
  - `minesweeper_*`
- **Hash changes** (`#research` etc.) are not pageviews under PostHog's `history_change` default, which is why the custom events exist.
- **Time per version:** a Trends insight on Pageleave, average "Previous pageview duration", broken down by pathname (`GO_LIVE.md` step 2).

### 3.4 The analytics mode (a choice for Lehan)

PostHog's docs, checked 2026-10-02: *"When cookieless server hash mode is enabled, IP-based transformations like GeoIP enrichment and bot detection don't enrich your events… location data isn't added to events."*

| Mode | Keeps | Loses |
|---|---|---|
| `memory` (default) | Country and city, time on page, referrers | Each page load counts as a new visitor; no path through the site across pages |
| `cookieless` (needs a project setting) | Daily unique visitors, paths across pages | Location, bot filtering |

Neither mode stores anything on the visitor's device, so neither needs a cookie banner. The default is `memory`, because Lehan's round-1 question was where visitors come from. It is a one-word change in `config.js`.

### 3.5 SEO and sharing

- **`index.html` head:**
  - title "Lehan Zhang · Economist and data scientist, ETH Zurich";
  - a description drawn from the bio;
  - canonical `https://www.lehanzhang.com/`;
  - Open Graph and Twitter tags with `assets/img/social-card.png` (1200×630, text only until the headshot);
  - JSON-LD `ProfilePage` + `Person`, only facts on the site; `sameAs` = photography and blog. Scholar, ORCID etc. go there once Lehan sends them.
- **Classic pages, `pages.html`, `privacy.html`:** canonical links and real favicon files (`favicon.ico` 48/32/16, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`). Google Search ignores `data:` favicons.
- **Files:** `sitemap.xml` (13 URLs), `robots.txt`, `404.html` (the only root-relative links).
- **Research notes:**
  - Google renders JS and reads JS-added JSON-LD, but link previews (Slack, LinkedIn) read static head tags only.
  - A knowledge panel cannot be requested, only claimed once it appears.
  - Backlinks matter most: Scholar, the lab page, CEPR, the CV, social bios.

### 3.6 Photos

`tools/make_photos.py <photo> [--focus x,y] [--zoom z]` writes:
- `lehan-headshot.jpg` (384²);
- `lehan-portrait.jpg` (670×986);
- `lehan-wide.jpg` (840×875);
- `lehan-face.jpg` (320², the Kitchen logo until an illustration exists);
- `social-card.png` (with the photo).

It then points `content.js` at them, with alt text "Lehan Zhang". Tested on the minion photo into scratch.

## 4. The audit (WCAG 2.2 AA)

### 4.1 How

- **Coverage:** 58 pages and states (Kitchen and Minesweeper were checked by their builders), at 5 sizes, over `file://` and http.
- **Methods:**
  - axe-core 4.12;
  - Tab walks with a pixel diff to confirm visible focus;
  - 67 scripted flows;
  - reduced-motion emulation;
  - reflow at 320–1024px;
  - accessibility-tree dumps;
  - every internal and external link.
- **Toolkit:** saved in `tools/audit/` (README); outputs go to `%TEMP%\lehanzhang-audit`.

### 4.2 Main findings and fixes

| Area | Finding | Fix |
|---|---|---|
| Start page | Tiles announced as list items, not links | `<div role="listitem"><a class="fun-tile">` |
| Start page | Tiles overflowed at 768–900px | `minmax(0,1fr)`; stack below 920px |
| Start page | White tile text 2.1–3.7:1 | All gradients ≥ 4.5:1 |
| All versions | No `main`; 4px overflow at 320px | `<main>`; `minmax(min(300px,100%),1fr)` |
| Classic | "Try a fun version" menu stayed open on Tab-out; faint focus | Closes on focusout; 2px outline; decorative ✦ ▸ hidden from screen readers |
| XP shell | Dialogs did not keep focus | `XP.alert` makes the rest of the page inert and wraps Tab |
| XP shell | Start menu stayed open on Tab-out | Closes when focus lands outside it |
| XP shell | Space didn't open icons; Esc didn't close balloon tips | Both added |
| XP shell | Focus fell to `<body>` after minimise or close | Goes to the taskbar button or the icon that reopens the window |
| XP shell | Small title-bar buttons and balloon × on phones | 26px Close only (Min/Max hidden, as windows fill the screen); 24px ×; 44px dialog buttons |
| XP shell | Taskbar outside any landmark | A "Taskbar" region |
| Paint | Names read split ("H ome") | Fixed |
| Paint | No one-click CV | "CV (PDF)" beside "Classic website" |
| Paint | `menubar` containing a link | Fixed |
| Paint | Pages without a heading | Hidden headings |
| Paint | Small phone targets | Fixed |
| Paint | Endless wobble / boil / bob | Stop after 5 s or at the first input |
| PowerPoint | See §4.4 | |
| Overleaf | Icon buttons nameless when narrow | Fixed |
| Overleaf | Splitters lacked values and contained buttons | Fixed |
| Overleaf | Recompile inside the tablist | Fixed |
| Overleaf | Editor unlabelled | Fixed |
| Overleaf | How to leave the editor told only to screen readers | Visible hint for keyboard users |
| Overleaf | Weak focus rings | Fixed |
| Overleaf | "main" tag contrast | Fixed |
| Overleaf | Chatty page counter | No longer announced |
| Overleaf | "Download PDF" opened the print dialog | Now "Print / Save as PDF" |
| Overleaf | Layout menu could leave a pane 0px wide (bug found in passing) | Fixed |
| Slides | Art box labels 3.34:1 | #12807f (4.75:1) |
| Links | Gerzensee course page moved | URL updated |

Overleaf axe violations went from 895 to 135 nodes; what remains is the best-practice `region` rule and slide email links, which are inside text and so exempt. For Paint, the critical `aria-required-children` went from 6 runs to 0.

### 4.3 Not fixed (decisions or limits)

- **Dead link (major, Lehan's call):** "Digital Safety in the Metaverse" (headspace bullets) → `https://www.projectrockit.com.au/blog/our-metaverse/` returns 404; the site was reorganised. Options:
  - an archived copy (web.archive.org, 2025-04-27; it could not be re-checked today because the archive was rate-limiting);
  - a new link from Lehan;
  - no link (keep the text).
- **Unverified links:** headspace.org.au timed out from this network. OUP (QJE), Facebook, Dropbox and Instagram block scripts but load in a browser.
- **The `region` best-practice rule** (some app chrome outside landmarks): moderate, not WCAG. Left.
- **Paint on landscape phones and tablets wider than 700px** still uses desktop-sized menu targets.

### 4.5 Final whole-site run (after all fixes; `tools/audit/`, 77 states incl. Kitchen, Minesweeper, privacy, 404)

| Check | Result |
|---|---|
| **Sweep** (JS errors, failed loads, overflow; 5 sizes, `file://`) | No errors anywhere. The one exception is `404.html` opened from disk: its `/favicon` links are root-relative by design and work on the host. |
| **Flows** (keyboard and mouse) | 70/70 pass |
| **axe** (154 runs) | Only three rules remain: `region` (best practice; app chrome outside landmarks, accepted); `target-size` ×4 nodes (an inline email link on a scaled slide, which is exempt as inline text, and PowerPoint's Help button half-covered by the open Office menu); and `aria-allowed-role` ×12 in the Kitchen (`<article role="dialog">`, fixed to a `<div>` after the run) |
| **Links** | 107 internal OK (Kitchen hash routes added to the checker). External: all fine except Project Rockit (404, §4.3). Not yet live: the canonical `www` URLs. Bot-blocked but fine in a browser: OUP, Facebook. Timed out from here: headspace. |

### 4.4 PowerPoint fixes

All eight findings are fixed; axe violation nodes went from 788 to 77 (what remained was the taskbar `region`, since labelled by the shell).

- **Thumbnails:** stay a list inside their own tabpanel.
- **Office menu:** the right column is its own labelled menu, with arrow keys, Home/End and Esc.
- **Contrast:**
  - Notes placeholder #6b6b6b.
  - Civic theme "Aa" 4.8:1.
  - Ribbon group labels #2e5590 (about 5:1; the main session made this change, since they were 3.6–4.1:1).
- **Welcome balloon:** it closes as soon as keyboard focus lands under it. Every position that still points at From Beginning covers something focusable.
- **Targets ≥ 24px:**
  - The ribbon is 8px taller.
  - Scroll-bar buttons, zoom, stars, Quick Access buttons and menus all reach 24px.
  - Dialog launchers keep 15px with spacing.
- **Landmark:** `role="main"` plus a hidden h1.
- **"From Beginning":** pulses twice (about 5 s), then rests lit. It stops for good on hover, focus or the show. Hover and focus still animate. This trims the brief's "pulses" to the first seconds (`CLAUDE.md` §3 V3 notes it).
- **Builder's suites:** desktop 58/58, phone 19/19, http OK, animation 86/86 (on a rerun; the first run had 4 timing flakes in show-click checks).

## 5. Sources for the go-live facts (research, 2026-10-02)

- **Wix:**
  - external DNS / no nameserver change: https://support.wix.com/en/article/connecting-a-wix-domain-to-an-external-site
  - renewal: https://support.wix.com/en/article/checking-your-domain-subscription-renewal-date
  - transfer away: https://support.wix.com/en/article/transferring-your-wix-domain-away-from-wix-2477749
  - subdomains need Premium: https://support.wix.com/en/article/connecting-a-subdomain-to-a-site-in-your-wix-account
- **Netlify:**
  - external DNS: https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/
  - credits: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
  - legacy plans: https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-legacy-plans/legacy-pricing-plans/
- **Cloudflare:**
  - Pages custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
  - Registrar transfer: https://developers.cloudflare.com/registrar/get-started/transfer-domain-to-cloudflare/
- **PostHog:**
  - cookieless: https://posthog.com/docs/privacy/cookieless-tracking (and posthog-js typings: `cookieless_mode: 'always' | 'on_reject'`)
  - config: https://posthog.com/docs/libraries/js/config
  - pricing: https://posthog.com/pricing
  - time on page: https://posthog.com/tutorials/time-on-page
- **Apps Script:**
  - web apps: https://developers.google.com/apps-script/guides/web
  - quotas: https://developers.google.com/apps-script/guides/services/quotas
  - deployments: https://developers.google.com/apps-script/concepts/deployments
- **Google:**
  - Search Console verification: https://support.google.com/webmasters/answer/9008080
  - favicon: https://developers.google.com/search/docs/appearance/favicon-in-search
  - ProfilePage: https://developers.google.com/search/docs/appearance/structured-data/profile-page
  - JS SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
  - knowledge panels: https://support.google.com/knowledgepanel/answer/7534902

## 6. Decisions and why

Recorded in `CLAUDE.md` §7 (rows "2026-10-02 (round 2)"). Three are worth a sentence here.

- **Analytics loads from PostHog's servers**, an exception to "third-party code in `site/vendor/`". Vendoring would freeze an SDK that changes weekly and lazy-loads its own parts anyway. Analytics need not work offline, and the domain guard keeps it off locally.
- **Tile colours were darkened**, not just Kitchen's. All four failed AA for white text, and Lehan asked for an accessibility check.
- **Minesweeper wording avoids "p-hacking"** (framed as robustness checking) and every real-person attribution, to keep it safe for a job-market site.

## 7. Judgement calls by the builders (defaults stand unless Lehan objects)

**Kitchen**
1. Upright phones get about three screens of swiping (scaled so each object fits on screen), not full height (which would be about four screens).
2. The old stacked phone layout is gone. Tablets now see the whole kitchen, window and clock included.
3. Edge arrows were added.
4. The rice bowl hides while the swipe hint shows.
5. The window and clock stay decoration (an idea: tapping the window could flip day and night).
6. On a 360×740 Android phone the one-time hint covers the top of two tags until the first swipe.

**Minesweeper**
1. Default theme: Specification Search.
2. "p-hacking" never appears.
3. Balloon tips due while the game is open are skipped.
4. Only best times are saved.

**Paint**
1. Other Experience jump buttons are 32px (not 44) on phones, to stay on two rows.
2. The menu bar wraps to two rows when narrow.
3. Animations run 5 s per visit to the start or home screen.

**Overleaf**
1. The editor hint shows only to keyboard users (always-on, it covered code).
2. The `#history` deep link now opens home.tex behind History.

**PowerPoint**
1. The From Beginning pulse is limited to about 5 s (see §4.4).
2. The welcome balloon closes when focus reaches what it covers.
3. The ribbon is 8px taller, for 24px targets.

## 8. Wording Claude or the builders wrote (Lehan to check)

- **Start page and All versions:**
  - Title "Lehan Zhang · Economist and data scientist, ETH Zurich".
  - The meta description.
  - The Minesweeper card ("Minesweeper for economists, on the desktop of the Paint, PowerPoint and Overleaf versions.").
- **Privacy page:** all of it.
- **Kitchen:** "Swipe to see the whole kitchen / Or turn your phone sideways to see it all", "Full screen", "Got it".
- **Minesweeper:** all jokes, theme names and level names (`shared/minesweeper/themes.js`).
- **Paint:** "Welcome to Lehan Zhang's website" (hidden heading), "CV (PDF)".
- **Overleaf:**
  - "Esc, then Tab to leave the editor";
  - "Print / Save as PDF";
  - button tooltips;
  - the hidden h1 "Lehan Zhang's website, written in LaTeX".
- **PowerPoint:** the hidden h1 "Lehan Zhang: website as a PowerPoint presentation".

## 9. Problems and solutions

| Problem | Solution |
|---|---|
| The Minesweeper work-in-progress broke `XP.init` for a few minutes (the audit saw `gameLabel is not defined`) | Transient; the finished shell has no errors (all apps rechecked) |
| Start-menu "close on Tab-out" failed at first: Tab from the menu's last item goes to the browser's own controls, so the menu never learned where focus went | Watch where focus *arrives* (`focusin` on the document) |
| A stray `site/index.html.tmp…` and `backend/…/Code.gs.tmp…` (partial saves, probably a Dropbox lock) | Inspected (older partial copies of files that are complete), deleted. Worth a glance after each session: `site/` is what gets published |
| The Wayback Machine rate-limited the check of the archived Project Rockit page | Left for Lehan (§4.3) |
| The axe runner's `--only index.html` matched every state | Ran the full audit instead; the README shows narrower filters |
| Overleaf's old UI suite counts 7 desktop icons; now 8 (Minesweeper) | Its rebuilt copy excludes the game icon |

## 10. Open questions for Lehan

1. **Minesweeper theme:** Specification Search (recommended), Scooped!, Quick Question, Exclusion Restriction, or keep all four under Game › Theme.
2. **Analytics mode:** `memory` (location) or `cookieless` (unique visitors).
3. **Project Rockit link:** archived copy, new link, or no link.
4. **Go live with all four fun versions?** Paint and Overleaf need the backend (step 1 of `GO_LIVE.md`).
5. **Profiles for the structured data and backlinks:** Google Scholar, ORCID, LinkedIn, X/Bluesky, CEPR author page. Only ones Lehan confirms.
6. **Wording in §8.**
7. **Commit?** Nothing has been committed since `1230cca`. A private GitHub repo would also give Netlify automatic deploys and an off-machine backup of the history.
8. **Still open from earlier:**
   - the headshot and illustrated face;
   - the second recipe's dish;
   - the Rogan link (`raw=1`, and fixing the CV);
   - CV wording;
   - the Adding Fuel abstract's "non-politicians focal influencers".

## 11. The economist's-eye assessment (summary of what Lehan was told)

**Strengths**
- The bio is on the landing page, with Classic first, so a busy reader gets the essentials in one screen.
- The classic site is clean and fast.
- The abstracts and coauthor links are what economists look for.
- Overleaf and Minesweeper are in-jokes economists will enjoy.
- The fun versions are memorable and suit a media, culture and NLP researcher.

**Risks**
- The minion photo (to be replaced).
- No job-market paper or advisor on the landing page.
- No Google Scholar or ORCID links.
- Non-academic material is heavier than economists expect: talks such as the Shaolin Temple conference, and many industry roles.
- "CEPR Working Paper" should be checked against CEPR's own series name (CEPR calls them Discussion Papers).
- The third paper has no status.

**Suggestions**
- Name the advisor and add Scholar/ORCID on the classic home.
- Split Research into "Working papers" and "Work in progress".
- When the time comes, a "Job market paper" line on the start page.
- Keep the fun versions one click away, as now.

## 12. Next steps

1. Lehan looks at round 2: start page, `pages.html` (the Minesweeper card), the Kitchen on a phone, Minesweeper's four themes.
2. Lehan answers §10, and sends a headshot. Claude runs `tools/make_photos.py`, checks every version, and updates `sitemap.xml` `lastmod`.
3. `GO_LIVE.md` steps 1–4: backend, PostHog, Netlify deploy, Search Console. Claude can do the code-side parts (config URLs and key, the deploy folder) as soon as Lehan sends the URL and key.
