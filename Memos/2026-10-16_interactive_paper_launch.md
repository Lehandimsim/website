# 2026-10-16: the interactive Adding Fuel page goes live, with an "Interactive Version" button

Covers the prompt of 2026-10-16 15:10 (session 2322ae91, run on Euler; prompt log). Done from a clone of
GitHub `main`, which matched the Dropbox folder before the change (only `.gitignore` line endings differed).

## 1. The page

- `site/research/adding-fuel/` now holds the interactive page (`index.html`, `style.css`, `app.js`,
  `data.js`, three avatars) next to `AddingFuel.pdf`. It is built and checked in
  `AddingFuelGunfire/interactive/` (its README and `FACT_CHECK.md`); this copy includes Lehan's review
  edits of 16 Oct 2026. `data.js` is generated there; do not edit it here.
- Launch-day steps from that README: the `noindex` line is gone; the page is in `sitemap.xml`; its head
  gets the social card (`og:image`, `summary_large_image`) like the other pages in the sitemap.

## 2. The "Interactive Version" button

- **One content change:** the paper's `links` in `content.js` get
  `{ label: "Interactive Version", url: "research/adding-fuel/index.html", isNew: true }` after the PDF.
  `isNew` means: coloured, the word "new" next to it, and a little jiggle on hover or keyboard focus.
  `SiteUtil.isNewLink(href)` (`shared/site.js`) tells the versions which links those are.
- **Same form as the PDF link in each version** (Lehan: "same size and shape as the PDF one"):
  - Classic: the same pill as "PDF", filled with the site blue, white text; "new" in red italics.
  - Kitchen: the same text link as "PDF", on a green highlight; "new" in tomato red.
  - Paint: the same button as "PDF", in pink, with a small bar-chart icon; it comes after "Abstract" so a
    hand-drawn red "new" with a scribbled arrow (`newNote()` in `pages.js`, Doodle handwriting) has room.
  - PowerPoint and Overleaf: the same slide link as "PDF", in orange-red and bold, with "new"
    (`Deck.render` marks the links, `slides.css` styles them; thumbnails and the slide show too). The
    Overleaf `.tex` has a plain `\href`, so it stays valid beamer.
- The jiggle respects reduced motion like everything else on the site (off when the device asks for
  reduced motion, unless `motion-on`).
- `tools/prerender.py` re-run (only `classic/research.html` changed). On Euler it runs with Playwright's
  Chromium in place of Edge.

## 3. Checks

Screenshots of the Research page in all five versions (desktop; Paint and classic at 390 px); no
JavaScript errors; the hover animation runs in Classic, Kitchen, Paint and Overleaf and is off with
reduced motion.

## 4. Open / next steps

- Lehan uploads `site/` to Netlify (not linked to the repo), then checks the live page and the button.
- On a phone, Paint's pink button wraps to two lines ("Interactive / Version"); fine, or shorten?
- Optional: link the interactive page from the CV.

## 5. Follow-up (15:45): the line-up slides again

Lehan: the "52 debates, one moment" rows jumped straight to the aligned view. Cause: a reduced-motion rule
from the review round earlier on 16 Oct made scroll-driven charts snap between step cards, and Lehan's PC
has Windows "Animation effects" off. The line-up now follows the scroll for everyone again
(`scrollValue()` in `app.js`); the Uvalde clock followed in §6.

## 6. Follow-up (15:55): Uvalde smooth too; "2 minutes"

The Uvalde clock and dots also follow the scroll under reduced motion now, so the snap is gone from
`scrollValue()` altogether. The key-findings drop-down reads "Short on time? The key findings in 2 minutes"
(Lehan).
That copy (commit a8bd288) briefly brought back the pre-launch head (`noindex`, no social card) from
`AddingFuelGunfire/interactive/website_dev/`; fixed in the next commit, before any Netlify upload. The
working copy there now has the launch head too, so later copies keep it.
