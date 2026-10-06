# Round 4 follow-up: sans headings on the remaining pages, no Overleaf edit logs, PostHog key

**Date:** 2026-10-06
**Status:** Done and checked by Claude; awaiting Lehan's look.
**Prompts covered:** `prompt_log.md` entry 2026-10-06 18:09 (Lehan's answers to memo
2026-10-06_headshot_and_heading_font §4, plus the backend and analytics requests).
**Supersedes:** the brief's "every recompile's changes are logged so Lehan can see them" (CLAUDE.md §3,
V4) and the 2026-10-02 backend decision as far as edit logs go.

## 1. What Lehan asked, and what was done

| Lehan asked | Done |
|---|---|
| The sans font for `pages.html`, the privacy page and the 404 page too | Their headings (`h1`, the version cards' `h2`, the privacy page's `h2`) use the body font; `--serif` removed. |
| "No need to send overleaf edits to me. Edit code.gs to reflect this and backend/README.md" | `Code.gs` accepts drawings only: no `saveEditLog_`, no "Edit logs" tab, no daily digest or trigger; anything but a drawing gets `unknown kind`. `backend/README.md` rewritten to match (one endpoint, fewer permissions, no trigger). See §2 for the site side. |
| Set up PostHog with project token `phc_qUt…yy36`, project 296254 | The key is in `site/config.js` `analytics.posthogKey`. Checked first that it belongs to the EU cloud (PostHog's EU servers accept it, the US servers reject it), matching the site's EU set-up. Mode stays `memory` (the default; Lehan has not chosen). |

## 2. Decisions made along the way

- **The Overleaf version stops claiming to send.** Removing the receiver alone would have left the site
  saying "Every recompile is logged for Lehan" and "mockup: not sent", and the privacy page saying edits
  are sent. So, with the same intent:
  - `config.js`: `endpoints.editLog` removed.
  - `edit-log.js`: keeps the diff code; the sending code (`payload`, `send`, `endpoint`) is removed.
  - `app.js`: History stays, because it shows visitors their own changes. Its intro, the toast
    ("Recompiled. Your changes are in History."), the Recompile menu note, Help, the Review dialog and
    the sample edit's bullet now say that edits stay in the browser tab. The per-entry "sent" status
    (and its CSS) is gone.
  - `tex-generate.js` (`main.tex` header comment), `index.html` comments, `pages.html` jump label
    ("Edit + History"), `tools/audit/flows.py` (the check no longer accepts the removed console
    message).
  - Privacy page: "It collects two things"; the Overleaf section now says edits are not collected.
  This wording is new and is Lehan's to change.
- **Privacy page, web vitals:** the PostHog project's settings (from the key check) have page-speed
  measurement on, so "how quickly the pages load" is added to what is counted. Session replay,
  surveys and heatmaps are off in the project, and the site also switches replay and surveys off.
- **PostHog settings Claude cannot change** (that needs Lehan's login, or a personal API key, which
  is not worth handing over): **Discard client IP data** must be switched on, because the privacy page
  promises the IP address is not kept. Optional: project time zone Europe/Zurich. In `GO_LIVE.md`
  step 2.
- `GO_LIVE.md`: step 1 is now "the backend for Paint drawings"; step 2 marks the sign-up and key as
  done.

## 3. Checks

- `Code.gs` in headless Edge against mock Google services: `setup` creates only the folder and the
  "Drawings" tab, and no trigger; `doGet`; a drawing is saved, emailed and logged; a name typed as a
  formula (`=Ann <b>`) is stored as text and escaped in the email; a non-PNG, an edit log, garbage
  and `{}` are refused.
- Screenshots (no JavaScript errors): `pages.html` (desktop, phone), `privacy.html`, `404.html`,
  Overleaf `#demo-edit` (History shows the edit; the new toast).
- PostHog: the token checked against PostHog's EU and US servers; the script the loader uses
  (`eu-assets.i.posthog.com/static/array.js`) downloads and knows the `defaults: "2026-05-30"` setting.
  Analytics runs only on lehanzhang.com, so nothing is counted from local copies. The real test is
  PostHog's **Activity › Live events** after going live.

## 4. Open questions for Lehan

1. Switch on **Discard client IP data** in PostHog (Project settings). Then, after going live, check
   that events still show a country (`GO_LIVE.md` step 2.4).
2. Analytics mode: `memory` (set) or `cookieless`.
3. Still open: delete the four unused minion files in `site/assets/img/`? (memo
   2026-10-06_headshot_and_heading_font §4.1)
4. The new Overleaf wording (§2): OK?

## 5. Next steps

`GO_LIVE.md`: the backend for Paint (step 1), Netlify (step 3), Google (step 4).
