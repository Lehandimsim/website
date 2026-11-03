# Changes waiting for the next Netlify upload

Each Netlify upload costs 15 credits, whatever its size (Free plan: 300 a month). So changes collect
here and go live together in one upload. Claude keeps this list; Lehan reviews each change on the
Claude preview first (interactive page: https://claude.ai/artifact/XrP5yE5GZkNeyH7ar4Yi1g).

**Last upload:** 16 Oct 2026. The live site matches GitHub commit `82232a0` (checked against
lehanzhang.com on 16 Oct; Netlify's shorter link addresses are the only difference).

## Waiting

| # | Asked | Change | Where | Status |
|---|---|---|---|---|
| – | – | (nothing waiting: everything below is on GitHub and waits for Lehan's one Netlify drag) | – | – |

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
