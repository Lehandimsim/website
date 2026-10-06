/* ==========================================================================
   config.js — switches for the site. (Text content lives in content.js.)
   ========================================================================== */

window.SITE_CONFIG = {

  // The fun version offered first (the start page lists all four, this one first).
  // One of: "kitchen" | "paint" | "powerpoint" | "overleaf"
  defaultFun: "kitchen",

  // Where Paint drawings are sent: the web app URL of the Google Apps Script in
  // backend/apps-script/Code.gs (it ends in /exec). See backend/README.md.
  // null = not wired up: the site says what would happen instead of sending.
  // (Overleaf edits are not sent anywhere: Lehan, 2026-10-06.)
  endpoints: {
    drawings: "https://script.google.com/macros/s/AKfycbz3_1aJyUaQC90lTQlb6MQKWYVQFN3sVH_XV8lbFp-cGs9KFQITTbnCOfynih3HL4I1/exec"   // Lehan, 2026-10-06
  },

  // Visitor statistics with PostHog (EU cloud). Off while posthogKey is null, and it only ever runs on
  // the real site (onlyOn), never on a copy opened from disk or a local test server. The key is the
  // "Project API key" (phc_...) from PostHog > Project settings; it is public by design.
  // mode: neither mode stores anything on the visitor's device, so neither needs a cookie banner.
  //   "memory"     keeps country/city; but every page load counts as a new visitor.
  //   "cookieless" counts daily unique visitors and their path through the site; but no location
  //                (PostHog drops the IP before working out where it is). Needs "Cookieless server
  //                hash mode" switched on in PostHog > Project settings > Web analytics.
  analytics: {
    posthogKey: "phc_qUt358iXXdBpuNHZeXGgirrj8CgB5WcGvtDzvCPYyy36",   // project 296254, EU (Lehan, 2026-10-06)
    posthogHost: "https://eu.i.posthog.com",
    mode: "memory",
    onlyOn: "lehanzhang.com"
  },

  // The four fun versions, in the order they are offered. path is relative to the site/ folder.
  funVersions: [
    { id: "kitchen",    label: "Kitchen",    blurb: "Remember Cooking Mama? Try your hand at a tomato and egg stir-fry", path: "fun/kitchen/index.html" },
    { id: "paint",      label: "Paint",      blurb: "Open my website in MS Paint and doodle me a drawing",      path: "fun/paint/index.html" },
    { id: "powerpoint", label: "PowerPoint", blurb: "Sit back for the slideshow, PowerPoint 2007 style",        path: "fun/powerpoint/index.html" },
    { id: "overleaf",   label: "Overleaf",   blurb: "Edit the LaTeX source of this site and recompile it",      path: "fun/overleaf/index.html" }
  ]
};
