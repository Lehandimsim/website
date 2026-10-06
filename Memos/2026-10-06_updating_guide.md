# A guide to updating the live site

**Date:** 2026-10-06
**Status:** Done by Claude; not committed (Lehan did not ask).
**Prompts covered:** `prompt_log.md`, the 2026-10-06 entry "so every time i want to make changes to
the page, how should i do that? save these instructures to an .md in the same folder as GO_LIVE.md".

## What was done

`UPDATING.md` (project root, next to `GO_LIVE.md`) covers:
- how publishing works: edit, check, commit, push, then Netlify deploys `main`; drag and drop until
  the repo is linked;
- asking Claude, and which changes to leave to Claude (new CV, photo, bio, analytics or backend);
- where each kind of content lives (the `content.js` sections, each version's wording file,
  `config.js`, `Code.gs`), with the quoting rules that broke the live site earlier that day;
- checking locally, publishing from VS Code or PowerShell, batching pushes (Netlify credits);
- rolling back in Netlify;
- keeping the repo private.

CLAUDE.md §4 lists the new file.

## Open

Nothing new. `UPDATING.md` assumes the Netlify link (`GO_LIVE.md` step 3b). Revisit it if Lehan
chooses drag and drop instead.
