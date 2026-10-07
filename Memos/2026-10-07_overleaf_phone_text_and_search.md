# 2026-10-07: Overleaf slide text on phones, the Wix entry in Google, push

Covers prompt 2026-10-07 10:31 (session 9de29618): "1) Fix the font size overflow on the mobile version
of the overleaf slides 2) Fix public crawler which still points to wix photography page 3) push all
changes to git".

## 1. Overleaf slides on phones

**Cause.** The Madrid preview scales every slide to the screen, so on a phone the slide text is 5–8 CSS
px (Talks: 5.3 px held sideways). Phone browsers enlarge text they think is too small: iOS Safari when
the phone is turned sideways, Chrome on Android with its accessibility text scaling. The text then grows
after the frame was laid out and spills out of it. The tightest frames (Talks, the Rogan abstract) have
only 1–2 px to spare (measured in phone emulation at 390x844, 360x780 and 844x390: no frame overflows at
its nominal size).

**Fix.** `site/shared/xp/xp.css`: `html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }`
(the classic site already had it). It is in the shared XP shell, so it also covers PowerPoint's slides
and Paint. Pinch-zoom still works. No visible change on desktop.

**Not verified on a real phone** (no iPhone/Android here; desktop Edge cannot reproduce text
enlargement). Lehan to check on the phone where it happened, once `site/` is uploaded.

## 2. "Public crawler still points to the Wix photography page"

Checked 2026-10-07:
- `http://`, `https://lehanzhang.com/` and `http://www.` all 301 to `https://www.lehanzhang.com/`, which
  serves the new site (self-canonical, `robots.txt` allows all, sitemap lists every page). The Netlify
  address serves the same.
- The Wix photography site's canonical, `og:url` and sitemap name only `lehanzzhang.wixsite.com`;
  nothing on it mentions lehanzhang.com.

So nothing on either site points crawlers to Wix. What remains is Google's stored entry from before
go-live, when lehanzhang.com forwarded to the Wix site; it changes only when Google crawls the domain
again. Lehan's step (needs Lehan's Google login): Search Console, `GO_LIVE.md` §"Search Console" (add the
property, submit `sitemap.xml`, URL inspection › Request indexing for `https://www.lehanzhang.com/`).
The DNS TXT record at Wix is the usual way to verify; alternatively a URL-prefix property verified by an
HTML tag, which Claude can add to `index.html` once Lehan sends the `google-site-verification` code.
Link previews cached by other apps (LinkedIn, Facebook, WhatsApp) refresh through their own inspectors.

The JSON-LD `sameAs` lists the Wix photography site as one of Lehan's profiles. That is correct
(it is Lehan's) and was left in.

## 3. Push

Claude Code's permission check blocked the first attempt; Lehan then allowed git commands for this
project (rule in `.claude/settings.local.json`, git-ignored), and everything was committed and pushed to
`main`: the trailer scripts in `promo/`, the 2026-10-06/07 memos, CLAUDE.md,
`.gitignore` (`promo/out/` ignored; nothing over 1 MB), this fix. Netlify is still not linked to the repo
(CLAUDE.md §8.8), so the push does not change the live site anyway: the `xp.css` fix goes live when
Lehan uploads `site/` again (or links the repo).

## Open questions for Lehan

1. Did the text overflow happen on an iPhone held sideways, or elsewhere? If it still happens after the
   upload, a screenshot would show which frame.
2. Search Console: DNS TXT at Wix, or send the HTML-tag code for Claude to add?
