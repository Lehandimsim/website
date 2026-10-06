# Round 3: Lehan's edit list (Art tab, Scholar, classic site, Minesweeper)

**Date:** 2026-10-05
**Status:** Everything in the list is built and checked by Claude. Lehan's input is needed on §5.
**Prompts covered:** `prompt_log.md` entry 2026-10-05 11:28 (Lehan's list; logged by the hook).
**Supersedes:** memo 2026-10-02_go_live_and_round_2 §10.1 (Minesweeper theme: decided), §10.5
(profiles: Google Scholar now in) and the CEPR item in its §11. `CLAUDE.md` §3, §7, §8 and §9 updated.

---

## 1. Lehan's requests and what was done

| Request | Done |
|---|---|
| Art › Writing: "My blog. I write essays about technology, food, creativity, and everyday life." | `content.js` `art.writing.description`. Reaches all five sites. The Kitchen's recipe book keeps "You can find more recipes here" (the brief's wording for the book, not the Art tab). |
| Art › Photography: "Portfolio: freelance photojournalist since 2017." | `content.js` `art.photography.description`; all five sites. |
| "Performances" above "Art Projects" (capital P), two items, same style as the projects | New `art.performances` in `content.js`, same fields as a project (§2). Classic, Kitchen, Paint: a Performances section above Art Projects. Kitchen's "Projects" and Paint's "Art projects" are now "Art Projects". PowerPoint and Overleaf: the Art slide has two points, **Performances** and **Art Projects**, each with its items under it. Paint draws a piano-and-notes doodle for the performances. |
| "CEPR Working Paper" → "CEPR Discussion Paper" | `content.js`; all five sites, the Overleaf `.tex` included. The CV PDF still says Working Paper (Lehan's file). |
| Google Scholar before "CV (PDF)" | `person.links.scholar` = the address Lehan gave. Added before the CV link in: the start page footer; the classic home's link row; the Kitchen's home buttons; Paint's menu bar ("Scholar" on phones, §3); the XP start menu (Paint, PowerPoint, Overleaf); Overleaf's Menu › Lehan elsewhere; the closing "Thank you" slide (PowerPoint, Overleaf). Also in the start page's JSON-LD `sameAs` (without `&hl=en`). |
| Classic home: larger text, to match the other tabs | Both were 17px in the CSS; the bio only looked smaller beside the photo and the big name. The bio is now 19px and its link row 17px (17.5px and 16px on phones). |
| Classic: the name at the top goes to the start page | `classic.js` header: `../index.html`. "Home" in the menu still opens the classic home. |
| Keep all four Minesweeper themes | Kept (resolves the open theme question). |
| "Specification Search" → "Minesweeper"; logo like the Windows spiky ball | The default theme's name is "Minesweeper", so the desktop icon, start menu entry and window title read "Minesweeper". Its id stays `spec`, so the deep links (`?minesweeper=spec`) still work. The icon (`xp.js`, `minesweeper`) is now a black spiked mine with a square white glint, drawn for the site (not Microsoft's artwork), with a faint white edge for the dark taskbar. `pages.html`'s card says "Minesweeper" for that theme. |
| Remove "Who gets it:" from About this theme (all themes) | Removed from all four. |
| "The joke:" → "About this theme:" | Done in all four. |

## 2. How the performances are stored

Lehan's text: "May, 2026 — Musikalischer Abend, Musikplattform ETH/UZH, Zürich Piano duet with Damian
Camenisch: Antonín Dvořák, Slavonic Dances, Op. 42, No. 1: Presto, No. 8: Presto". Split into a
project's fields so every version shows it the way it shows the art projects:

| Field | Value |
|---|---|
| title | Musikalischer Abend, Musikplattform ETH/UZH, Zürich |
| dates | May 2026 / Nov. 2025 |
| medium (the italic line) | Piano duet with Damian Camenisch |
| description | the programme, word for word |
| links | none |

- Dates follow the site's style ("May – Jul. 2023", "Apr. 2023"), not "May, 2026" / "November, 2025".
- The Brahms line's final full stop was dropped so both programmes end the same way (the projects'
  descriptions are sentences; these are programme listings).
- On slides a project shows title, dates and medium, so a performance shows "Musikalischer Abend,
  Musikplattform ETH/UZH, Zürich (May 2026): Piano duet with Damian Camenisch". The programme is on
  the other four pages only.
- The slide text stays at normal size: a first try with the smaller "dense" size made the sub-points
  in Overleaf's Madrid preview too small, and both versions fit without it.

## 3. Problems and solutions

| Problem | Solution |
|---|---|
| Paint on phones: a third link pushed the menu bar onto a third row | Below 700px the link reads "Scholar" (full name in its tooltip and the status bar); the bar is back to two rows at 390px. |
| Overleaf must read its own `.tex` back exactly | Round trip (generate, then parse): 11/11 slides, art and closing slides identical. The only difference is the home slide's speaker notes, which are PowerPoint-only and never written to LaTeX (as before). The new `art.tex` is ordinary nested `itemize`. |

## 4. Checks

- Screenshots (headless Edge, `file://`) of every changed screen at 1440×900, and phone sizes for
  the classic home, Paint and PowerPoint. No JavaScript errors.
- Minesweeper driven in the browser: Help › About this theme shows "About this theme: …" with no
  "Who gets it" (Paint/Minesweeper and Overleaf/Exclusion Restriction checked on screen, all four
  checked in `themes.js`). Desktop icon, start menu and window title say "Minesweeper".
- Every Scholar link found in the DOM opens `https://scholar.google.com/citations?user=JYuPwdgAAAAJ&hl=en`
  in a new tab; the classic name resolves to `site/index.html`.
- Audit tools: see §6.
- `sitemap.xml`: `lastmod` 2026-10-05 for the pages whose content changed.

## 5. Open questions for Lehan

1. **Dvořák's opus number.** The site says "Slavonic Dances, Op. 42", as Lehan wrote it. Dvořák's
   Slavonic Dances are Op. 46 and Op. 72. Nos. 1 and 8 of Op. 46 are both marked Presto, which matches
   the programme. His Op. 42 is the Two Furiants for piano. Change it to Op. 46? (Left as written:
   CLAUDE.md §6, report, don't silently fix.)
2. **Scholar in the classic footer?** The classic footer had no CV link, so Scholar went in the home
   page's link row, not on every classic page. It could also go in the footer, beside the email.
3. **The Minesweeper theme's mines** are still the cartoon bomb with a fuse marked "n.s.". They could
   become the spiky mine too, to match the new icon.
4. The performance wording and layout in §2: OK?

## 6. Final sweep

- `tools/audit/sweep.py file`: 385 runs (77 states × 5 sizes). No JavaScript errors and no horizontal
  overflow anywhere, except the known one: `404.html` opened from disk cannot find its root-relative
  favicon (by design; it works on the host). The new Scholar links are the same size as the links
  beside them (start page footer 17px tall like CV/Photography/Blog; Paint 20px on desktop, 32px on
  phones, like Classic website and CV).
- `tools/audit/flows.py all`: 70/70 pass.
- `tools/audit/links.py --no-external`: 126 internal links and resources OK (the 404 page's
  root-relative links aside, as above).

## 7. Next steps

As in memo 2026-10-02_go_live_and_round_2 §12: Lehan's look at rounds 2 and 3, the answers in
`CLAUDE.md` §8, a headshot, then `GO_LIVE.md`.
