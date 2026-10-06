# GitHub push; Paint backend URL in place

**Date:** 2026-10-06
**Status:** Done by Claude; Netlify link is Lehan's step.
**Prompts covered:** `prompt_log.md`, the 2026-10-06 entry "this is the github repo
https://github.com/Lehandimsim/website.git can you push it? how do i ... Link repository".

## 1. What was done

- **`site/config.js` fixed.** Lehan had pasted the Apps Script URL into `endpoints.drawings` without
  quotes, a syntax error that stopped `config.js` loading (the start page's tiles and every fun version
  read it). Quotes added; the URL is unchanged. The URL answers `{"ok":true,"service":"lehanzhang.com
  inbox"}`, so the backend is deployed. Paint now sends drawings for real; no test drawing was sent
  (it would email Lehan), so that stays for the live check (`GO_LIVE.md` step 3.5).
- **The site went live the same day** (Lehan uploaded `site/` to Netlify) with the unquoted URL, so
  on lehanzhang.com every fun version failed and the start page showed no fun tiles. Checked the live
  `config.js` (still unquoted), then the fixed local copy over a local web server: start page, all
  four fun versions (also at a folder address, `/fun/kitchen/`) and the classic site load without
  errors. File-name letter case also checked (Netlify is case-sensitive, Windows is not): 234
  references, no mismatches. The fix reaches the live site with the next deploy. Also seen: the live
  site redirects `www` to `lehanzhang.com`, the opposite of the plan (`GO_LIVE.md` step 3.4: make
  `www` primary; the canonical tags say `www`).
- **Before pushing:** checked that the GitHub repo is private (GitHub's public API answers 404 for
  it). It has to be: the push includes `Memos/` (with the prompt log), `References/` (CV, photos) and
  `CLAUDE.md` (CLAUDE.md §5 Privacy). Netlify still publishes only `site/` (`netlify.toml`).
- `.gitignore`: Python caches (`__pycache__/`, `*.pyc`) left out.
- **Committed** everything since `1230cca` (the whole build, rounds 1–4) on `main`, as Lehan Zhang,
  and **pushed** to `origin` = https://github.com/Lehandimsim/website.git.
- `GO_LIVE.md` step 3b now has click-by-click instructions for **Link repository** in Netlify; step 1
  is marked done.

## 2. Open for Lehan

1. Link the repo in Netlify (`GO_LIVE.md` step 3b). The first deploy puts the new site on
   lehanzhang.com, replacing the redirect to the Wix photography site.
2. Before or right after: PostHog's **Discard client IP data**; Netlify primary domain `www`
   (step 3.4); then the step 3.5 checks, including one drawing.
3. Still open: delete the four unused minion files in `site/assets/img/` (they would be published).
