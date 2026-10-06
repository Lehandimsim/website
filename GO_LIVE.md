# Going live: lehanzhang.com

A checklist for putting the site online and keeping it there. Written 2026-10-02; facts checked that
day (sources in `Memos/2026-10-02_go_live_and_round_2.md` §5). Tick items off as you go.

---

## Where things stand (checked 2026-10-02)

| | |
|---|---|
| **Domain** | lehanzhang.com, registered with **Wix** since 26 May 2019. **Expires 26 May 2027**; Wix auto-renews about 30 days earlier (around 26 April 2027) on the card it has on file. |
| **DNS** | Managed at Wix. `lehanzhang.com` → `A 75.2.60.5` and `www` → `CNAME regal-sunflower-00eb2f.netlify.app`: both already point at **your Netlify project `regal-sunflower-00eb2f`**. |
| **What that project serves today** | A one-line page that forwards visitors to the Wix photography site. HTTPS works (certificate renewed automatically by Netlify). |
| **Wix photography site** | Lives at its free address, https://lehanzzhang.wixsite.com/photography, which the new site links to. Nothing changes for it. |

So going live is mostly **uploading `site/` into that Netlify project**. No DNS change is needed.

---

## Before you go live

- [x] **Your photo.** Done 2026-10-06 with `References/LZ_headshots-1.jpg`. For a new photo, put it in `References/` and ask Claude to run
      `python tools/make_photos.py References/<photo>.jpg`. That one command makes:
      - the round avatar;
      - the portrait (classic site, Paint, Kitchen);
      - the slide photo (PowerPoint, Overleaf);
      - the Kitchen's chef logo;
      - the link-preview card;
      and then updates `content.js`. A head-and-shoulders photo with some space around it works best.
- [ ] **Which versions go live.** All four fun versions are on the start page now. Paint needs the
      backend (step 1); if you drop it, step 1 can be skipped.
- [x] **Minesweeper theme:** all four kept (2026-10-05).
- [ ] **Analytics mode** (step 2): `memory` (keeps country and city; set now) or `cookieless` (keeps
      daily unique visitors and paths, but no location).

---

## Step 1. The backend for Paint drawings (about 10 minutes)

**Done 2026-10-06:** deployed, its URL is in `site/config.js`, and the URL answers
`{"ok":true,...}`. Still to do: send one drawing from the live site (step 3.5).

Follow `backend/README.md`. In short: paste `backend/apps-script/Code.gs` into a new Google Apps Script
project, run `setup`, deploy it as a web app (Execute as **Me**, access **Anyone**), and put the `/exec`
URL into `site/config.js` under `endpoints.drawings`. Use a personal Gmail account (a university Google
Workspace may block public web apps). Overleaf edits are not sent anywhere (2026-10-06), so Overleaf
needs no backend.

## Step 2. PostHog analytics (about 10 minutes)

1. ~~Sign up at https://eu.posthog.com (choose the **EU** region).~~ Done: project 296254, on the EU
   servers (checked 2026-10-06: the key works on EU, not on US). Free up to 1 million events a month.
2. Project settings (gear, bottom left › **Project**):
   - Turn on **Discard client IP data**, so IP addresses are not stored. **Still to do**: the privacy
     page promises it.
   - Optional: set the project's **time zone** to Europe/Zurich, so "today" in the charts is your day.
   - If you choose the `cookieless` mode, also turn on **Web analytics › Cookieless server hash mode**
     (without it, cookieless events are ignored).
3. ~~Copy the **Project API key** into `site/config.js`.~~ Done 2026-10-06, with `analytics.mode`
   `"memory"` (the default; switch to `"cookieless"` there if you prefer).
4. Analytics runs only on lehanzhang.com itself, so local testing never counts.
   - After going live, open the site and watch **Activity › Live events** in PostHog.
   - With `memory` mode, check that events show a country. If they don't, the "Discard client IP
     data" setting removes location too; then choose between location and discarding IPs.
5. What you can see:
   - **Web analytics:** visitors, pages, where they came from, devices.
   - **Time per version:** Product analytics › New insight › Trends; event "Pageleave"; measure the
     average of property "Previous pageview duration"; break down by "Previous pageview pathname".
     Each version has its own address (`/fun/kitchen/`, `/fun/paint/`, ...).
   - **Custom events:**
     - `start_version_chosen`: which door people take on the start page.
     - `kitchen_*`: the Kitchen.
     - `paint_page_opened`, `paint_drawing_sent`: Paint.
     - `powerpoint_show_started`: PowerPoint.
     - `overleaf_recompiled`: Overleaf.
     - `minesweeper_*`: Minesweeper.
     - `classic_abstract_opened`: the classic site.

The privacy page (`site/privacy.html`) describes this set-up. If you change the analytics, change the
page too.

## Step 3. Put the site on Netlify (about 10 minutes)

1. Log in at https://app.netlify.com and open the project **regal-sunflower-00eb2f**.
2. Check the plan: **Usage & billing** (or Team settings › Billing).
   - **Legacy Free:** 100 GB a month. Plenty.
   - **Credit-based Free** (accounts made after 4 Sep 2025): 300 credits a month. A deploy costs 15;
     each GB of traffic costs 20. That is ample for an academic site, but if the credits run out,
     Netlify **pauses every project** until the month ends. Deploy in batches rather than after every
     small edit.
3. Deploy, one of two ways:
   - **a. Drag and drop (simplest).** On the project's **Deploys** page, drag the **`site` folder
     itself** (not the whole `website` folder: that holds your private notes) onto the drop area.
     Repeat after each change.
   - **b. From Git (automatic).** The private repository is
     https://github.com/Lehandimsim/website (branch `main`, pushed 2026-10-06). To link it:
     1. In the Netlify project: **Project configuration** (older screens: *Site configuration*) ›
        **Build & deploy** › **Continuous deployment** › **Link repository**.
     2. Choose **GitHub**. A GitHub window asks you to authorise Netlify; allow it.
     3. If `Lehandimsim/website` is not in the list (it is private), click **Configure the Netlify
        app on GitHub**, choose **Only select repositories** › `website` › **Save**, then go back.
     4. Pick `Lehandimsim/website`. Settings: branch **main**; base directory, build command and
        functions directory **empty**; publish directory **site** (`netlify.toml` fills this in and
        wins anyway).
     5. **Deploy** / **Link repository**. The **Deploys** tab shows the first deploy; when it says
        *Published*, lehanzhang.com shows the new site (it replaces today's redirect to the Wix
        photography site).
     After that, every push to `main` deploys. On a credit plan each deploy costs 15 credits, so push
     in batches. This also gives git history an off-machine backup (`.git` is not in Dropbox).
4. **Domain management** › set **www.lehanzhang.com** as the **primary domain**. Netlify recommends
   this when DNS is outside Netlify. `lehanzhang.com` then forwards to `www`, which matches the
   address in the site's search tags.
5. Open https://www.lehanzhang.com and https://lehanzhang.com. Check:
   - the start page;
   - one page of each version;
   - sending a drawing;
   - one Overleaf recompile;
   - PostHog's Live events.

## Step 4. Google (about 15 minutes, then days to weeks)

1. **Search Console** (https://search.google.com/search-console). Add a **Domain** property
   `lehanzhang.com`. Google gives you a `google-site-verification=...` TXT record: add it at Wix
   (Domains › ⋯ › **Manage DNS Records** › TXT). Keep it there for good: removing it un-verifies you.
2. **Sitemaps** › submit `https://www.lehanzhang.com/sitemap.xml`.
3. **URL inspection** › `https://www.lehanzhang.com/` › **Request indexing**.
4. Optional: **Bing Webmaster Tools** can import the site from Search Console in one click.
5. What appears in Google: the page title ("Lehan Zhang · Economist and data scientist, ETH Zurich")
   and usually the description in the page's head, which is taken from your bio. Google may pick
   other text from the page. A **knowledge panel** (the box on the right) cannot be requested. If one
   appears later, you can claim it ("Claim this knowledge panel").
6. **What helps most is links to the site from places Google already trusts.** Put
   https://www.lehanzhang.com on:
   - your Google Scholar profile (Homepage field);
   - your page on the AI & Economics Lab site and any ETH page;
   - your CEPR author page;
   - the CV PDF;
   - X/Bluesky/LinkedIn bios;
   - the Wix photography site and the blog.

   Send Claude your Scholar, ORCID or other profile links, and they go into the site's structured data
   (`sameAs`), so Google connects them to you.

## Keeping it running

| What | When | How |
|---|---|---|
| **Domain renewal (Wix)** | Charged around **26 April each year** (expiry 26 May) | Wix › **Premium Subscriptions**: check that auto-renew is on and the card is current. Wix › Domains: check that the registrant email is one you read (Wix sends renewal and transfer emails there). About USD 21–25 a year (a third-party price list; your account shows the real price in CHF). |
| Wix plans | Now, once | Under Premium Subscriptions, check you are not paying for a Wix Premium **site** plan you no longer need. The photography site works on the free plan at its wixsite.com address. |
| HTTPS certificate | Automatic | Netlify renews it every ~90 days. Nothing to do. |
| Netlify | Monthly glance | If on the credit plan: Usage › credits. |
| Backend | Rarely | The Sheet `lehanzhang.com inbox` holds everything. A free Gmail account can send ~100 emails a day; the script stays well under that. |
| PostHog | Rarely | Free tier: 1M events a month. Usage stops at the limit; nothing is billed. |
| Content | When the CV changes | Put the new PDF in `References/` and ask Claude to update `content.js`. Update `lastmod` in `sitemap.xml` (Claude does this). |

**Optional, to save about USD 10 a year:** move the domain from Wix to an at-cost registrar.
- Cloudflare charges about USD 10.46, rising to about USD 11.17 from November 2026.
- Wix cannot change a domain's nameservers, and Cloudflare only accepts domains already on its
  nameservers. So this is two steps: transfer to another registrar first, then move DNS.
- Do it well before the April renewal: a transfer within 45 days after a renewal loses the year you
  paid for.
- Not urgent. The current set-up works as it is.

## Costs per year

| | |
|---|---|
| Domain (Wix) | about USD 21–25 |
| Netlify, Google Apps Script, PostHog, Search Console | free |
| **Total** | **about USD 21–25** (about USD 11 after a registrar move) |
