# Updating the website

How to change lehanzhang.com after it is live. (Going live the first time: `GO_LIVE.md`.)

## How publishing works

```
edit files in site/  →  check them on this computer  →  commit  →  push to GitHub  →  Netlify publishes
```

- **GitHub** (https://github.com/Lehandimsim/website, **private**) holds the whole project.
- **Netlify** watches the `main` branch. Every push to `main` puts the `site/` folder on
  lehanzhang.com within a minute or two. Nothing outside `site/` is ever published.
- **Until the repository is linked in Netlify** (`GO_LIVE.md` step 3b), publishing means dragging
  the `site` folder onto the project's **Deploys** page instead of pushing.
- A commit stays on this computer until you push. You can commit several times and push once.
- Git history lives on this computer and on GitHub, not in Dropbox (`.git` is excluded from Dropbox
  sync). Edits made on another computer reach this folder through Dropbox; commit and push them from
  here.

## The easy way: ask Claude

Open this folder in VS Code and tell Claude what to change, for example "add this talk", "here is
my new CV", "change the Kitchen's welcome text". Claude edits the files, checks every version, and
writes a memo. Claude commits and pushes only when you say so. For example: "commit and push it".

Ask Claude for these in particular. Each touches several files, or needs a tool:

| Change | Why ask |
|---|---|
| **A new CV** | Put the PDF in `References/` and say so. The content is re-derived from it, and the PDF's file name appears in 11 files. |
| **A new photo** | Put it in `References/`. `tools/make_photos.py` makes every crop and the link-preview card. |
| **The bio or affiliation** | Besides `content.js`, the search-engine text in `site/index.html` and `sitemap.xml` must match. |
| **Analytics or the drawing backend** | The privacy page (`site/privacy.html`) must stay true. |

## Doing it yourself: where things live

Almost all text is in **`site/content.js`**. Change it there and it changes in all five versions.

| To change | Edit |
|---|---|
| Name, email, links (Scholar, CV, photography, blog) | `site/content.js` → `person` |
| Page names and their order | `site/content.js` → `pages` |
| Home page text | `site/content.js` → `home` (then ask Claude to update the search tags) |
| Papers | `site/content.js` → `research` |
| Talks (newest first; `month` marks upcoming talks) | `site/content.js` → `talks` |
| Education | `site/content.js` → `education` |
| Teaching, service, work, awards, extracurriculars | `site/content.js` → `experience` |
| Art: writing, photography, performances, projects | `site/content.js` → `art` |
| Wording on the PowerPoint and Overleaf slides | `site/content.js` → `slides` |
| Kitchen's own wording (bubbles, buttons, game) | `site/fun/kitchen/text.js` |
| Paint's own wording | `site/fun/paint/pages.js` (the `TEXT` block); the drawing tab's in `site/fun/paint/draw.js` |
| PowerPoint's own wording (ribbon, dialogs) | `site/fun/powerpoint/ribbon.js` |
| Overleaf's own wording (help, dialogs) | `site/fun/overleaf/app.js` |
| Minesweeper's themes and wording | `site/shared/minesweeper/themes.js` |
| Which fun version comes first; where drawings go; analytics | `site/config.js` |
| What happens to a drawing (email, Drive, Sheet) | `backend/apps-script/Code.gs`, then redeploy it at script.google.com (`backend/README.md`, "Changing the script later") |

**Writing in `content.js` and `config.js`:**

- Text goes inside "double quotes", and items in a list are separated by commas. One missing quote
  or comma stops the whole site from loading. That is what broke the fun versions on 2026-10-06: a
  web address in `config.js` without quotes.
- Inside text: `**bold**`, `*italic*`, `[link text](https://example.com)`.
- To put a double quote inside a text, write `\"`.
- Copy an existing entry and change it, rather than typing a new one from scratch.

## Check before publishing

1. Double-click `site/index.html`. The start page should show the Classic door **and the four fun
   tiles**.
2. Open the classic site and each fun version, and look at the page you changed.
3. If something is blank or missing, press **F12** › **Console**. A red error names the file and
   line.
4. For phone layouts: **F12** › the phone-and-tablet icon › pick a phone.

Or ask Claude to "check every version". It renders each one and reports any errors.

## Publish

**In VS Code:**

1. Open **Source Control** (Ctrl+Shift+G).
2. Write a short message saying what changed, e.g. "Add the Zurich talk".
3. Click **Commit**. If VS Code asks whether to stage all changes, choose **Yes**.
4. Click **Sync Changes** (or **Push**).

**Or in PowerShell**, in this folder (Git Bash does not work on this computer):

```powershell
git add -A
git commit -m "Add the Zurich talk"
git push
```

Then open Netlify's **Deploys** tab. When the newest deploy says **Published**, reload
lehanzhang.com. If the old version still shows, press Ctrl+F5.

**Batch your changes.** If the Netlify account is on the credit-based plan, each deploy costs 15 of
the 300 monthly credits. If the credits run out, Netlify pauses the site until the month ends. Commit
as often as you like, and push once you're done for the day.

## If something goes wrong after publishing

- **Quickest:** Netlify › **Deploys** › click the last good deploy › **Publish deploy**. The old
  version is back at once. Then fix the files, and push again when the fix is ready.
- Or ask Claude to find and fix the problem, or to undo a commit (`git revert`).

## Keep in mind

- **The GitHub repository must stay private.** It holds the memos, the prompt log, `References/`
  and `CLAUDE.md`, none of which belong on the public site.
- Only `site/` is published. Notes and files elsewhere in this folder stay private.
- Photos for the site: roughly 300 KB or less each. Use lowercase file names with hyphens.
- Once a year: Wix renews the domain in late April (it expires 2027-05-26). Check the card on file.
