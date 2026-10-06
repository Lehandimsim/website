# SEO review of the live site; second push

**Date:** 2026-10-06
**Status:** Review done by Claude; nothing changed in the site yet (proposals await Lehan).
**Prompts covered:** `prompt_log.md`, the 2026-10-06 entry "1) commit and push. 2) check the seo of
the website, is there anything i should obtimize and change?"

## 1. Commit and push

`45a446a` (HEC Lausanne talk, `UPDATING.md`) pushed to `origin/main`. Its first message carried a
byte-order mark (PowerShell 5.1 `Set-Content -Encoding utf8`), so it was amended before pushing.
Write commit-message files with the Write tool, not `Set-Content`.

## 2. What is already right (checked on the live site)

- `https://www.lehanzhang.com/` is the main address. `http://`, the bare domain and every path
  redirect to it with a 301. Lehan set `www` as primary in Netlify.
- The fixed `config.js` is live, so the fun versions work.
- `robots.txt` allows everything and names the sitemap. The sitemap lists all 13 public addresses.
- A missing page returns a real 404. The link-preview card (`social-card.png`) loads.
- The start page has a static title, description, canonical, `og:`/`twitter:` tags and JSON-LD
  (`ProfilePage` + `Person`). Every page has `lang="en"`. The site is fast (small images, system
  fonts, PostHog loaded asynchronously).
- A web search (not Google) for "Lehan Zhang" finds no exact match: only Lei / Le / Lin Zhang. Nobody
  else holds the name online, so the site should rank first for it once indexed and linked.

## 3. Findings and proposals (none applied yet)

| # | Finding | Proposal |
|---|---|---|
| A | **Without JavaScript the classic pages are empty** (crawlers see "Skip to content") and the start page has no bio. Google runs JavaScript; Bing (and so DuckDuckGo and ChatGPT search) does so unreliably; AI assistants' crawlers do not. | `tools/prerender.py`: headless Edge renders each classic page and the start page's bio and writes the result into the HTML files; `content.js` stays the one source and the scripts still render at run time. Must be re-run after content changes (Claude would, and `UPDATING.md` would say so). **Departs from "no build step": Lehan's call.** Recommended. |
| B | All five classic pages share one meta description. | One description per page, from its content. |
| C | Only the start page has `og:` tags, so a shared link to a classic page has no picture. | `og:title`/`description`/`image` on the classic pages. |
| D | JSON-LD lacks a photo and the institutions' web addresses. | Add `image`, `givenName`/`familyName`, ETH and UNSW URLs, `dateModified`; more `sameAs` profiles once Lehan names them (CLAUDE.md §8.7). |
| E | `regal-sunflower-00eb2f.netlify.app` serves a full copy of the site (200), and the four fun versions have no canonical tag. | 301 from the Netlify address to `www` in `netlify.toml`; self-canonicals on the fun versions. |
| F | Sitemap `lastmod` predates the 2026-10-06 changes (headshot, fonts, talk). | Update it; keep it current with each content change. |

For Lehan, outside the code (most effect on name searches):
1. Google Search Console + sitemap + request indexing (`GO_LIVE.md` step 4); then Bing Webmaster Tools
   (import from Search Console). Bing's index also serves DuckDuckGo and ChatGPT search.
2. Links to lehanzhang.com from Lehan's own profiles: the Google Scholar "Homepage" field, the AI &
   Economics Lab people page, LinkedIn, the CEPR author page, coauthors' pages, the Wix photography
   site and the blog.

## 4. Open

- Do A–F (one batch, one push)? A needs Lehan's yes because it changes the working rules.
- Which profiles exist (ORCID, LinkedIn, X/Bluesky, CEPR)?
