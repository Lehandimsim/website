# Changes waiting for the next Netlify upload

Each Netlify upload costs 15 credits, whatever its size (Free plan: 300 a month). So changes collect
here and go live together in one upload. Claude keeps this list; Lehan reviews each change on the
Claude preview first (interactive page: https://claude.ai/artifact/XrP5yE5GZkNeyH7ar4Yi1g).

**Last upload:** 16 Oct 2026. The live site matches GitHub commit `82232a0` (checked against
lehanzhang.com on 16 Oct; Netlify's shorter link addresses are the only difference).

## Waiting

| # | Asked | Change | Where | Status |
|---|---|---|---|---|
| 1 | 16 Oct | "About this page": the paragraph on results the page leaves out now reads "The paper also covers results this page leaves out: what happens as more politicians join the debate, what happens to topics in the debate, and more descriptive evidence about politicians who join debates." (Lehan's wording) | Interactive page (`research/adding-fuel/index.html`) | In the preview; waiting for Lehan's OK |

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
