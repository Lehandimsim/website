# 2026-10-15: October CV, latest Adding Fuel PDF, new abstract

Covers the three prompts of 2026-10-15 (session d0158148, run on Euler; prompt log). Done from a clone
of GitHub `main`, which matched the Dropbox folder exactly before the change (only `.gitignore` line
endings differed).

## 1. New CV: `CV_lehanzhang_oct2026.pdf`

- **Source:** Overleaf CV project (655bf53f…), new file `2026_LZ_oct.tex`, a copy of `2026_LZ_july.tex`
  with the changes Lehan approved: the website's typo fixes (memo 2026-10-01 §4.2 and decisions §3.2),
  working links (lehanzhang.com, Rogan Dropbox `?rlkey`, photography portfolio → Wix), the Methods line,
  "CEPR Discussion Paper" linking to the website's PDF, the HEC Lausanne talk, "Aug. 2024 - present",
  the Genderbility link, a Google Scholar link in the header, the Art section renamed "Art Projects and
  Performances" with the two piano duets, and "AI & Economics Lab" in place of "Center for Law &
  Economics" (Lehan).
- **Built** with Tectonic (4 pages, like the July CV). The local build drops the unused biblatex lines
  (no biber on Euler, and the CV cites nothing); the Overleaf file keeps them.
- **On the site:** `site/assets/cv/CV_lehanzhang_oct2026.pdf` replaces `CV_lehanzhang_oct26.pdf`
  (removed). Lehan's naming rule: `CV_lehanzhang_<mon><yyyy>`, the month the CV was last updated, so
  the downloaded file carries the date. Links changed in `content.js` (person.links.cv, cv.pdf),
  `404.html`, `fun/overleaf/index.html`, `fun/paint/index.html`, `sitemap.xml`, and the prerendered
  copies. Copy in `References/`; CLAUDE.md now names it as the content source.
- `content.js` education line: "…(Ash Group) at the [AI & Economics Lab](https://ai-econ-lab.org/), D-GESS".

## 2. Adding Fuel: the website hosts the latest paper

- `site/research/adding-fuel/AddingFuel.pdf`: v4 compiled from the paper's Overleaf (15 Oct 2026) by
  `AddingFuelGunfire/interactive/paper/update_paper.sh` on Euler. The Research page's PDF link and the
  CV point to it, instead of gratton.org. This is the address the interactive page will use, so it
  stays the same at launch.
- **Only the PDF is published.** The interactive page (`research/adding-fuel/index.html`) is not in
  `site/` yet; it launches separately (`AddingFuelGunfire/interactive/README.md`, "Merging into the site").
- **Updating it later:** Lehan asks; Claude runs `update_paper.sh --publish` (copies into Dropbox
  `site/research/adding-fuel/`), commits, pushes, and Lehan uploads `site/` to Netlify. No schedule.
- CEPR: https://cepr.org/publications/dp19896 is the same page as before; CEPR replaced the PDF with
  "DP19896 (v. 2)", revised 14 Oct 2026.

## 3. Abstract

The Adding Fuel abstract in `content.js` is now verbatim from the 15 Oct 2026 PDF (it was the
22 Oct 2025 version), so every version of the site shows the new one.

## Checks

`tools/prerender.py --check`: up to date (run with Chromium on Euler instead of Edge). No file in
`site/` still names `CV_lehanzhang_oct26.pdf`, `gratton.org/papers` or the old abstract. The word-level
diff of the prerendered pages shows only the abstract, the lab link and the two PDF links.

## For Lehan

- Upload `site/` to Netlify (Deploys → drag the folder), since Netlify is not linked to the repo.
- On your PC: `git fetch` then `git reset origin/main` (keeps your files, which Dropbox already updated).
