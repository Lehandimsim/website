# Lehan's first review: changes across every version

**Date:** 2026-10-02
**Status:** All requested changes are built and checked by Claude. Waiting for Lehan's second look.
**Prompts covered:** `prompt_log.md` entry 2026-10-02 12:28 (Lehan's list of changes), plus Lehan's
answers to four clarifying questions asked in the same session (not in the prompt log, which only
records typed prompts; the answers are recorded in §1).
**Supersedes:** memo 2026-10-01_decisions_and_mockup_build §6, V1 items 2 and 3 (the builder's own wall
drawings; Previous/Next order), and `CLAUDE.md` §3 "V4: slides styled like V3".

---

## TL;DR

- Every item in Lehan's list is done, in all versions where it applies. The decisions are in
  `CLAUDE.md` §7 (2026-10-02 rows).
- Shared content changed once, in `content.js`. It now holds: the new bio, the lab links, the Methods
  line, the new page order, both abstracts (verbatim from the PDFs), coauthor homepages, the
  Genderbility link and the new blog wording.
- **Start page:** the two columns are now level, and the four fun versions show as tiles, Kitchen
  first. `mockups.html` is now a visitor-facing **All versions** page.
- **Process:** the main session did the shared files, the start page, the All versions page and the
  classic site. Four subagents did one fun version each, in parallel; the main session then reviewed
  every version.
- **Checks:**
  - 32 page and size combinations: no JavaScript errors;
  - start page, All versions and classic pages over a local server: render correctly;
  - each builder's own test suite: Paint 105/105; PowerPoint 86/86 animation, 58/58 desktop and 19/19
    phone; Overleaf 154/154 round trip and 93/93 UI, plus a real pdfLaTeX/XeTeX compile; Kitchen's
    scripted interaction test passed.
- **Analytics:** Lehan's PostHog question is answered in §6.

---

## 1. Lehan's answers to the clarifying questions

| Question | Answer |
|---|---|
| Overleaf: which "classic beamer" look? | **Madrid** (blue title bar, rounded blocks, three-part footer) |
| Kitchen clock and day/night: where does the local time come from? | **The visitor's device clock** (no IP lookup) |
| Paint: "teaching and service first in the research tab" | **On the Other Experience tab**, as on the classic site |
| `mockups.html`, retitled "Lehan Zhang: homepage": for visitors or still a review page? | **For visitors** |

Defaults stated before the questions, with no objection from Lehan:
- one page order everywhere;
- the Kitchen recipe card follows the new counter order;
- wall photos picture1, 2 and 3, drawn as cartoons;
- abstracts as a toggle on the classic site and as one frame per paper in Overleaf, but not in
  PowerPoint;
- lab links, coauthor links and the new wording in every version.

## 2. What was done

### 2.1 Shared (main session)

**`content.js`**
- **Bio:** second paragraph amended, with links to both labs.
- **Lab links:** the affiliation; the 2024 talk "2nd Resilient Democracy Lab Workshop"; the RDL
  research-fellow bullet; the RDL work entry (URL now `https://resilientdemocracylab.org/`).
- **`research`:** `interestsLabel`, `methodsLabel` and `methods`, `abstractLabel`, `coauthorPages`, and
  `papers[].abstract` for Adding Fuel (PDF of 22 Oct 2025) and the Rogan paper (PDF of 17 Jun 2026).
  The text is verbatim; only hyphens at line breaks were rejoined.
- **`pages`:** Home, Research, Talks, Other Experience, CV, Art.
- **Art:** Genderbility gets an "About the project" link (https://www.instagram.com/genderbility/); the
  Writing text is "My blog. You can find more recipes here. I also write essays about technology,
  creativity, and everyday life."

**`shared/site.js`**
- `inline()` now gives every link class `text-link`.
- New helpers: `withCoauthorsMd()`, `researchLines()`, `versionIcon()` and `versionColours()`. The icons
  moved here from the start page.

**`shared/slides/deck.js`**
- Slides now follow `SITE.pages`, with Teaching and Service first in Other Experience.
- The research subtitle is an array of two lines.
- Coauthors and organisations are links.
- New option `{ abstracts: true }`, with an "abstract" layout (used by Overleaf only).

**`shared/xp/`**
- `XP.init({ about })` adds an "i" button next to the tray's "?" and an "About ..." item in the start
  menu.
- The "i" stays visible on phones; the other tray buttons are still hidden there.

**`config.js`**
- New Kitchen blurb.
- `mockupMode` removed: the start page always offers all four versions.

### 2.2 Start page and All versions page (main session)

**Start page (`index.html`)**
- **Layout:** the columns are top-aligned and end level. The doors column runs from the photo to the
  email line, and the tiles stretch to fit. The grid no longer stretches to the window height.
- **Doors:** the Classic door stays, with its original wording (Lehan asked for the new Classic wording
  only on the All versions page). Below it, "Or play one of four fun versions" heads a 2 × 2 grid of
  coloured tiles, Kitchen first, with "All versions →" beside the label.
- **Text:** the switcher wording is gone. The affiliation and bio links are underlined in the text
  colour.

**All versions page (`mockups.html`)**
- Title and heading "Lehan Zhang: homepage". A visitor intro replaces the developer text, and there is
  a link back to the start page.
- Each version has an icon. Classic reads "Standard, academic website. No frills." "Open via the start
  page" is gone, and the reduce-motion note stays.
- **Jump links:** Kitchen at night, an abstract (Paint, Overleaf) and the "About" popups (Kitchen,
  Paint, PowerPoint).

### 2.3 Classic site (main session)

- **Footer:** "✦ Try a fun version ▴" opens a small menu of the four versions (icon, name, blurb). It
  works with the keyboard (arrow keys, Esc) and closes on an outside click.
- **Research:**
  - interests and Methods on two lines;
  - coauthor links;
  - an "▸ Abstract" toggle under each paper that has one;
  - `research.html#paper-2` opens that paper's abstract.
- **Other Experience:** Teaching, Service, Work experience, Awards, Skills. The page title is
  capitalised.
- **Link style:** talk names render links, and in-text links and organisation heading links are
  underlined in the colour of the text around them.

### 2.4 V1 Kitchen (subagent)

- **Logo:** 92px, hangs below the top bar, glows and bobs like the other clickables. On phones it has a
  "Home" tag.
- **Counter, left to right:** rice cooker, eggs, spring onions and garlic, tomatoes, recipe book, wok.
  The seasoning shelf hangs above. The recipe card, Previous/Next and the Tab order follow rice → eggs →
  onions → tomatoes → season → serve.
- **Clock and window:**
  - The clock moved right of the hood and shows the device time.
  - The window shows the Sydney Harbour Bridge with the Opera House: day 06:00–17:59, night otherwise
    (moon, stars, lit arch).
  - `?sky=day` or `?sky=night` forces a view.
- **Wall pictures:** hand-drawn cartoons of the flame concert, the editorial (with a leek as tall as
  the model) and the alpine lake, together one link to the photography site.
- **Finale:** "Back to the start page" and "Or try another version of this site: Paint, PowerPoint, and
  Overleaf"; × or Esc returns to the kitchen.
- **Art page:** Photography and Writing first.
- **Info button:** a blue-and-white porcelain rice bowl with chopsticks and an "i". It opens "About
  this kitchen"; `#about` opens it too.

### 2.5 V2 Paint (subagent)

- **Tabs:** Home, Research, Talks, Other Experience, CV, Art, Paint!, with Alt shortcuts H R T O C A P.
- **Research:**
  - a Methods row of pills;
  - an "Abstract" button beside each PDF button;
  - the popup shows the title, linked coauthors, the abstract and "Read the full paper (PDF)";
  - `#research/abstract-1` and `#research/abstract-2` open it.
- **Other Experience:** Teaching and Service first.
- **Tray "i":** opens "About this Paint"; `#about` / `#home/about`.

### 2.6 V3 PowerPoint (subagent)

- **Transitions and entrance animations**, a different pair per slide (table `PP_SLIDE_FX` in
  `ribbon.js`):

  | # | Slide | Transition | Entrance |
  |---|---|---|---|
  | 1 | Home | Shape Circle | photo: Pinwheel; then title: Fly In |
  | 2 | Research | Bounce | Swivel |
  | 3 | Talks | Random Bars | title on a random Custom Path |
  | 4 | Teaching | Wheel | Grow & Turn |
  | 5 | Other Experience | Push | Spiral In |
  | 6 | Awards | Checkerboard | Bounce |
  | 7 | CV | Split | Float |
  | 8 | Art | Newsflash | title: Faded Zoom; then Writing and Photography boxes: Fly In |
  | 9 | Thank you | Box Out | Boomerang |

  Animations run automatically. A click during a build finishes it; the next click moves on.
- **Slides pane:** an animation star under each slide number (also in the Slide Sorter). Clicking it
  previews the slide.
- **Animations tab:** the gallery shows each slide's transition; Apply To All and Preview work.
- **Tray "i":** opens "About this PowerPoint"; `#about`.

### 2.7 V4 Overleaf (subagent)

- **Editor:** 15px font (12–18px in the menu); panes 14% | 37% | 49%.
- **Madrid:**
  - `\usetheme{Madrid}`, 16:9.
  - The footer reads "Lehan Zhang (ETH Zurich) | lehanzhang.com | n / 11".
  - The preview is drawn by the new `madrid.js`, measured against the compiled PDF to within 0–2 bp.
  - The preview uses Latin Modern Sans subsets in `fun/overleaf/fonts/` (GUST Font License; the main
    session added a README with the licence notice).
- **File tree:** main, home, research, talks, experience, cv, art, images/.
- **Research:**
  - an overview frame;
  - one frame per paper: subtitle "with …", an Abstract block, then status and PDF link;
  - deep links `#paper-1` and `#paper-2`.
- **Escaping:** curly quotes become `` and ''; `&` becomes `\&`.
- **Blog tooltip:** now taken from `content.js`.

## 3. Decisions and why

Recorded in `CLAUDE.md` §7 (2026-10-02). Two of them are worth a sentence here:

- **In-text link style everywhere.** Lehan asked for the lab links to be underlined in the same font
  as the text around them. Other in-text links in the same paragraphs (the email address, QJE, SBS,
  coauthors) would then have looked different, so the rule now applies to every link inside running
  text. Buttons, chips and cards keep their own look. Easy to narrow back if Lehan prefers.
- **One page order.** Lehan's Paint order (…, Other Experience, CV, Art) also meets "Other Experience
  before Art" (Classic), "experience above art" (Overleaf) and the Kitchen counter order. So it became
  the single order in `content.js`, and every version follows it.

## 4. Judgement calls by the builders (defaults stand unless Lehan objects)

**Kitchen**
1. On phones the window and clock stay hidden, as before (no room).
2. The wall order is concert | editorial | lake, with the portrait in the centre.
3. The three pictures are one link with one "Photography ↗" tag.
4. Day/night is a hard switch at 06:00 and 18:00, with no dawn or dusk tint.
5. The welcome bubble still covers the window on a first visit on desktop.

**Paint**
1. The Abstract button is cyan, against the yellow PDF button.
2. The email address and the employer names are now underlined black, like other links.
3. Help > About Paint also shows the "about" text.
4. On phones the tab padding is slightly tighter, so the seven tabs fit on two rows.

**PowerPoint**
1. "Bounce" is used as a slide transition; in PowerPoint 2007 it exists only as an entrance effect.
2. Going back shows the previous slide at once, fully built, as PowerPoint does.
3. The show starts with slide 1's transition out of black.
4. On a reduced-motion computer, Preview and the stars show a note on how to turn animations on.

**Overleaf**
1. Madrid draws no top band in current beamer. The navigation symbols are kept, as Madrid shows them.
2. Content is centred vertically on each frame (beamer's default).
3. Text sizes: Talks is `\scriptsize` with columns 0.52 / 0.44 (equal columns ran 13.6pt off the
   slide); Teaching and Awards are `\footnotesize`.
4. The preview follows a visitor's edits to font sizes, alignment, column widths, the short
   title/author/institute and the navigation symbols. Another `\usetheme` is noted in the log, but
   only Madrid is drawn.

## 5. Wording Claude wrote (Lehan to check)

- **Kitchen blurb:** "Remember Cooking Mama? Try your hand at a tomato and egg stir-fry."
- **Start page:** "Choose your way in" (unchanged), "Or play one of four fun versions", "All versions →".
- **All versions intro:** "This website comes in five versions: a standard academic site and four
  playful ones. They all hold the same content (research, talks, CV, art and more), so pick whichever
  you like. The links under each one jump straight to a page or a moment inside it."
- **Classic footer:** "Try a fun version" (was "Try the fun version", now that there are four).
- **About this kitchen:** "This kitchen is a nostalgic nod to Cooking Mama, a game I loved playing as a
  kid. It's also here because I really love food." Small print: "Cooking Mama belongs to its owners;
  this site is not affiliated with them."
- **About this Paint:** "This version is inspired by the hours I spent in MS Paint as a child. Even now,
  as a photographer, I sometimes do a quick edit in Paint, because it opens so much faster than Adobe
  Photoshop."
- **About this PowerPoint:** "This version is inspired by my childhood: I wasn't allowed to play
  computer games as a kid, so I spent my allocated screen time making animations and slideshows in
  PowerPoint."

## 6. Analytics: Lehan's PostHog question (answer, nothing built)

Lehan asked whether PostHog would be useful, and whether the site can record who visits, where from,
and how long they spend in the Kitchen. Facts checked 2026-10-02.

**What can be measured**
- Country and city (from the IP address).
- Pages and versions visited, time on each, clicks (e.g. which ingredient), referrer and device.
- *Who* a visitor is cannot be known without them signing in, and should not be guessed.
  "Reverse-IP" company lookups exist but raise GDPR and Swiss FADP issues; not recommended.

**PostHog**
- **Free tier:** 1M events a month and 5K session recordings; no credit card.
- **Hosting:** an EU cloud in Frankfurt at no extra cost.
- **Cookieless mode:** no cookie banner needed, at the cost of not recognising returning visitors
  across sessions.
- **Fit:** good for the Kitchen question, with custom events such as "kitchen opened" or "served"
  and the time between them.

**Cloudflare Web Analytics**
- **Cost and privacy:** free, no cookies, no personal data.
- **Setup:** one click if the site is hosted on Cloudflare Pages.
- **Fit:** gives page views, countries and referrers per page, but no custom events.

**Proposal:** decide at hosting time. PostHog (EU cloud, cookieless) if time spent per version
matters; Cloudflare Web Analytics for plain counts. Either way, add a one-line privacy note to the
site. The local mockups (`file://`) can't report anything, so analytics only makes sense once
hosted. `CLAUDE.md` §5 says no analytics unless Lehan asks: Lehan asked, so this is now a hosting-phase
item (§8.12).

Sources: https://posthog.com/pricing, https://posthog.com/docs/privacy/cookieless-tracking,
https://posthog.com/blog/posthog-cloud-eu, https://www.cloudflare.com/web-analytics/

## 7. Problems and solutions

| Problem | Solution |
|---|---|
| The start page's right column stretched to the window height, past the left column | The grid no longer fills the viewport (the footer is pushed down with `margin-top: auto`). "All versions" moved up beside the label, and the tiles' arrows went onto their title rows. |
| PowerShell treats curly quotes as string delimiters, so a check of `content.js` failed to parse | Ran the check as a Python script |
| `Set-Content -Encoding UTF8` added a BOM to `classic/experience.html` | Rewrote it without a BOM, like the other pages |
| On phones the XP tray hides its buttons, so the new "i" could not be reached (Paint builder) | The "i" stays visible on phones; "About ..." is also in the XP start menu |
| The Kitchen welcome bubble covers the window in a first-visit screenshot | Reviewed with a scratch copy that marks the welcome as seen |
| Overleaf: Talks overflowed a 16:9 Madrid frame; ’ followed by '' fused in LaTeX; a stray space before the first home paragraph | Columns sized from text length; quote guard; `\medskip` (all by the Overleaf builder, confirmed by a real compile) |
| Claude's briefs to the Paint and PowerPoint builders assumed a pronoun for Lehan, who has not stated one | Corrected with both builders before any text was written. No pronouns for Lehan appear anywhere on the site (checked by search). |
| Paint's original test suites were gone from the scratchpad | New suite of 105 checks (navigation, shortcuts, popups, rendering, a drawing check) |

## 8. Open questions for Lehan

1. **Adding Fuel abstract:** it reads "Interventions by non-politicians focal influencers", exactly as
   in the PDF (perhaps meant "non-politician"). Fix it on the site, or keep it verbatim?
2. **In-text link style everywhere** (§3): OK, or only the lab links?
3. **Wording** in §5.
4. **All four versions live?** The start page now offers all four. If all four stay, both Paint and
   Overleaf need the sending backend.
5. **Analytics** (§6): decide at hosting.
6. **Still open from 2026-10-01:**
   - headshot and illustrated face;
   - the second recipe's dish;
   - the Rogan link (`raw=1`, and fixing the CV);
   - CV wording;
   - whether to commit;
   - a GitHub remote.

## 9. Next steps

1. Lehan looks again via `site/index.html` and `site/mockups.html` (turn on **Show animations anyway**
   first on this PC).
2. Then, as before: choose the versions, then the backend, the host, the domain and (if wanted)
   analytics.
