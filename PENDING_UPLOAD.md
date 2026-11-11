# Changes waiting for the next Netlify upload

Each Netlify upload costs 15 credits, whatever its size (Free plan: 300 a month). So changes collect
here and go live together in one upload. Claude keeps this list; Lehan reviews each change on the
Claude preview first (interactive page: https://claude.ai/artifact/XrP5yE5GZkNeyH7ar4Yi1g).

**Last upload:** 16 Oct 2026. The live site matches GitHub commit `82232a0` (checked against
lehanzhang.com on 16 Oct; Netlify's shorter link addresses are the only difference).

## Waiting

| # | Asked | Change | Where | Status |
|---|---|---|---|---|
| 1 | 11 Nov 2026 | Research tab: headings "Working Papers & In Progress" and "Other Projects"; new entry "The Philosophy Engine: Automating Philosophical Discovery" (named, process-only edition of the competition methodology report: interactive page, PDF, video pop-up), with essay titles and texts withheld until results (end Jan 2027) | `content.js`, `shared/site.js`, `classic/`, `fun/kitchen`, `fun/paint`, `site/research/ai-philosophy/` | on GitHub, waits for the Netlify drag |
| 2 | 11 Nov 2026 | Talks: Barcelona Political Science Colloquium, University of Barcelona, May 2027 (upcoming) | `content.js`, `shared/slides/deck.js` | on GitHub, waits for the Netlify drag |
| 3 | 11 Nov 2026 | Start page: "News" box under the bio (Philosophy Engine; HEC Lausanne talk, 26 Nov 2026) | `content.js` `news`, `index.html` | on GitHub, waits for the Netlify drag |
| 4 | 11 Nov 2026 | "Adding Fuel": "Press (2)" fold next to the abstract (UNSW Newsroom, Eureka Street, both Oct 2026) | `content.js` `media`, `classic/`, `fun/kitchen`, `fun/paint`, `shared/slides/deck.js` | on GitHub, waits for the Netlify drag |

## When Lehan says "push to Netlify"

1. Claude copies every approved change into `site/`, commits, pushes to GitHub, copies the files to
   Dropbox, and moves the rows below to "Done".
2. Lehan, on the PC: `git fetch`, `git reset origin/main`, then drags `site/` onto Netlify once.

Until then the website's GitHub `main` and Dropbox `site/` stay as they are live, so an upload for any
other reason never publishes something not yet reviewed.

## Done

| Upload | Changes |
|---|---|
| 16 Oct 2026 | The interactive page goes live with the "Interactive Version" button in all versions; line-up and Uvalde follow the scroll; "2 minutes"; serial commas (commits `509a767` to `82232a0`) |
| 20 Oct 2026 (pushed to GitHub, not yet dragged to Netlify) | "Online Appendix" button between PDF and Interactive Version in every version (`content.js`, prerendered `classic/research.html`), linking `research/adding-fuel/AddingFuel_onlineAppendixB.pdf` (= `af_supplementary`, Appendix B); `AddingFuel.pdf` rebuilt so its 15 links to the appendix are web links to that file (they pointed to a missing `af_supplementary.pdf`); "About this page" paragraph in Lehan's wording |
| 3 Nov 2026 (pushed to GitHub, not yet dragged to Netlify) | Lean November CV on the site (`CV_lehanzhang_nov2026.pdf`; Jane Zhang's name out; trimmed Other Experience; "Service and Awards"; AI Center line on the CV page); bio adds the ETH AI Center (linked); site icon = Lehan's photo; Google Scholar, LinkedIn and X as logos; SEO: `_redirects` for the netlify.app address, canonicals on the fun versions, fuller JSON-LD, Scholar citation tags on the Adding Fuel page; minion files deleted; sitemap dates (memo 2026-11-03_lean_cv_icon_profiles_seo) |
