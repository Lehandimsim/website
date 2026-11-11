/* ==========================================================================
   shared/site.js — small helpers used by every version of the site.

   Load after content.js and config.js:
     <html data-root="../../">   <- path from this page back to the site/ folder
     <script src="../../content.js"></script>
     <script src="../../config.js"></script>
     <script src="../../shared/site.js"></script>
   ========================================================================== */

(function () {
  "use strict";

  var ROOT = document.documentElement.getAttribute("data-root") || "";

  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function isExternal(href) {
    return /^(https?:|mailto:)/i.test(href);
  }

  // Resolve a site-relative path (e.g. "assets/img/x.jpg") from the current page. External URLs pass through.
  function url(path) {
    if (!path) return path;
    return isExternal(path) || path.charAt(0) === "#" ? path : ROOT + path;
  }

  // Attributes for a link: external links open in a new tab.
  function linkAttrs(href) {
    var a = 'href="' + esc(url(href)) + '"';
    return isExternal(href) && !/^mailto:/i.test(href) ? a + ' target="_blank" rel="noopener"' : a;
  }

  // True for a link marked isNew in content.js (a paper's links), by its content.js address or the
  // address url() makes of it. Every version gives such links a colour, a "new" tag and a jiggle on hover.
  function isNewLink(href) {
    var papers = (window.SITE && window.SITE.research && window.SITE.research.papers) || [];
    return papers.some(function (p) {
      return (p.links || []).some(function (l) { return l.isNew && (href === l.url || href === url(l.url)); });
    });
  }

  // Mini-markdown used in content.js: **bold**, *italic*, [text](url). Returns safe HTML.
  // Links get class "text-link": inside running text they are underlined but otherwise look like
  // the words around them (Lehan, 2026-10-02). Each version's CSS styles a.text-link.
  function inline(text) {
    var html = esc(text);
    html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      return '<a class="text-link" ' + linkAttrs(href.replace(/&amp;/g, "&")) + ">" + label + "</a>";
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return html;
  }

  // The same text with the markup removed (for titles, alt text, aria labels).
  function plain(text) {
    return String(text == null ? "" : text)
      .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1");
  }

  // ["A", "B", "C"] -> "A, B, and C" (the CV's style).
  function listJoin(items) {
    if (!items || !items.length) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return items[0] + " and " + items[1];
    return items.slice(0, -1).join(", ") + ", and " + items[items.length - 1];
  }

  // "with A, B, and C" as plain text.
  function withCoauthors(paper) {
    return paper.coauthors && paper.coauthors.length ? "with " + listJoin(paper.coauthors) : "";
  }

  // The same line as mini-markdown, each name linked to its homepage (SITE.research.coauthorPages).
  // Render it with inline(); names without a homepage stay plain.
  function withCoauthorsMd(paper) {
    if (!paper.coauthors || !paper.coauthors.length) return "";
    var pages = (window.SITE && SITE.research && SITE.research.coauthorPages) || {};
    return "with " + listJoin(paper.coauthors.map(function (name) {
      return pages[name] ? "[" + name + "](" + pages[name] + ")" : name;
    }));
  }

  // The papers in display order under their headings: [{label, items: [{p, i}]}], i = index in research.papers
  // (the number the page and popups use). A paper without "group" goes in the first group.
  function paperGroups() {
    var R = (window.SITE && SITE.research) || {}, names = R.groups || [""], out = names.map(function (n) { return { label: n, items: [] }; });
    (R.papers || []).forEach(function (p, i) {
      var g = out.filter(function (x) { return x.label === p.group; })[0] || out[0];
      g.items.push({ p: p, i: i });
    });
    return out.filter(function (g) { return g.items.length; });
  }

  // Press items of a paper as mini-markdown lines: "UNSW Newsroom: [Headline](url), Oct 2026".
  function pressLines(paper) {
    return (paper.media || []).map(function (m) { return m.outlet + ": [" + m.title + "](" + m.url + ")" + (m.date ? ", " + m.date : ""); });
  }

  // "Research interests: a, b, c" and "Methods: x, y, z", one string per line (mini-markdown free).
  function researchLines() {
    var R = (window.SITE && SITE.research) || {}, out = [];
    if (R.interests && R.interests.length) out.push((R.interestsLabel || "Research interests") + ": " + R.interests.join(", "));
    if (R.methods && R.methods.length) out.push((R.methodsLabel || "Methods") + ": " + R.methods.join(", "));
    return out;
  }

  // A talk is upcoming if its year/month is now or later. Undated months count as past.
  function isUpcoming(year, month, now) {
    now = now || new Date();
    var y = now.getFullYear(), m = now.getMonth() + 1;
    if (year > y) return true;
    return year === y && month != null && month >= m;
  }

  function page(id) {
    var pages = (window.SITE && SITE.pages) || [];
    for (var i = 0; i < pages.length; i++) if (pages[i].id === id) return pages[i];
    return null;
  }

  function funVersion(id) {
    var list = (window.SITE_CONFIG && SITE_CONFIG.funVersions) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  // Line-art icons for each version (start page, All versions page, classic footer menu).
  // 48x48, drawn with currentColor, so they take the colour of the text around them.
  var VERSION_ICONS = {
    classic:    '<path d="M13 5h16l8 8v30H13z"/><path d="M29 5v8h8"/><path d="M18 21h14M18 27h14M18 33h10"/>',
    kitchen:    '<path d="M6 25h36a18 13 0 0 1-36 0z"/><path d="M11 25c1.5-5 7-8 13-8s11.5 3 13 8"/><path d="M18 42h12"/><path d="M29 4l9 15M34 3l7 15"/><path d="M17 12c-1-2 1-3 0-5M23 11c-1-2 1-3 0-5"/>',
    paint:      '<path d="M24 6C13 6 5 13.5 5 23c0 8 6 13 12 13 3 0 4 2 4 4 0 2.5 2 4 4.5 4C36 44 43 35 43 25 43 14 34.5 6 24 6z"/><circle cx="15" cy="21" r="2.6"/><circle cx="22" cy="14" r="2.6"/><circle cx="31" cy="15" r="2.6"/><circle cx="35" cy="24" r="2.6"/>',
    powerpoint: '<rect x="6" y="7" width="36" height="25" rx="2"/><path d="M24 32v7M17 44l7-5 7 5"/><path d="M14 26v-5M21 26v-9M28 26v-12M35 26v-7"/>',
    overleaf:   '<path d="M41 7C23 7 9 16 9 30c0 5 2 9 5 10"/><path d="M41 7c0 20-8 32-24 32"/><path d="M14 40c2-10 9-18 19-24"/>',
    minesweeper: '<circle cx="24" cy="26" r="11"/><path d="M24 9v4M24 39v4M7 26h4M37 26h4M12 14l3 3M33 35l3 3M36 14l-3 3M15 35l-3 3"/><circle cx="20" cy="22" r="2.5"/>'
  };
  // Each version's colours (start page tiles, All versions page). White text sits on these, so both
  // ends of every gradient keep a contrast of at least 4.5:1 with white (WCAG AA).
  // Kitchen is lavender, to tell it apart from PowerPoint's orange (Lehan, 2026-10-02).
  var VERSION_COLOURS = {
    classic:    ["#1f4e8c", "#3d74b8"],
    kitchen:    ["#6a4c9c", "#8467bd"],
    paint:      ["#1f62d4", "#2d72e0"],
    powerpoint: ["#c43e1c", "#bd5410"],
    overleaf:   ["#13800a", "#28803a"],
    minesweeper: ["#4b5563", "#5b6472"]
  };

  function versionIcon(id) {
    var body = VERSION_ICONS[id];
    return body ? '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + "</svg>" : "";
  }

  function versionColours(id) { return VERSION_COLOURS[id] || VERSION_COLOURS.kitchen; }

  // Profile logos: Google Scholar, LinkedIn and X shown as logos, not words, wherever the Scholar link
  // was (Lehan, 2026-11-03). Each sits on a small white tile in its brand colour, so it reads the same
  // on every version's background. Paths: Simple Icons (CC0), 24 x 24. A profile shows only if its
  // address is in content.js person.links.
  var PROFILES = [
    { id: "scholar", label: "Google Scholar", fill: "#4285F4",   // cap, then head in a lighter blue, like Scholar's own logo
      d: "M5.242 13.769 0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269z",
      d2: "M12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z", fill2: "#8AB4F8" },
    { id: "linkedin", label: "LinkedIn", fill: "#0A66C2",
      d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.71 1.637-1.452 3.37-1.452 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
    { id: "x", label: "X", fill: "#000000",
      d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932zM17.61 20.644h2.039L6.486 3.24H4.298z" }
  ];
  var PROFILE_CSS =
    ".profile-links{display:inline-flex;align-items:center;gap:6px;vertical-align:middle}" +
    ".profile-link{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;" +
      "border:1px solid rgba(0,0,0,.16);border-radius:6px;background:#fff;text-decoration:none!important;transition:transform .15s,box-shadow .15s}" +
    ".profile-link svg{display:block;width:17px;height:17px}" +
    ".profile-link:hover{transform:translateY(-1px);box-shadow:0 2px 6px rgba(0,0,0,.18)}" +
    ".profile-link:focus-visible{outline:2px solid #1f62d4;outline-offset:2px}" +
    ".profile-links--sm .profile-link{width:24px;height:24px;border-radius:4px}.profile-links--sm svg{width:15px;height:15px}" +
    ".profile-links--lg{gap:10px}.profile-links--lg .profile-link{width:44px;height:44px;border-radius:10px}.profile-links--lg svg{width:24px;height:24px}" +
    "@media (prefers-reduced-motion: reduce){html:not(.motion-on) .profile-link{transition:none}html:not(.motion-on) .profile-link:hover{transform:none}}";

  function profileLogo(p) {
    return '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" focusable="false"><path fill="' + p.fill + '" d="' + p.d + '"/>' +
      (p.d2 ? '<path fill="' + p.fill2 + '" d="' + p.d2 + '"/>' : "") + "</svg>";
  }

  // HTML for the logos as links. size: "sm" (menu bars), "lg" (big buttons) or nothing (28px tiles).
  function profileLinks(links, size) {
    links = links || {};
    if (!document.getElementById("profile-links-css")) {
      var st = document.createElement("style");
      st.id = "profile-links-css";
      st.textContent = PROFILE_CSS;
      document.head.appendChild(st);
    }
    var items = PROFILES.filter(function (p) { return links[p.id]; }).map(function (p) {
      return '<a class="profile-link profile-link--' + p.id + '" ' + linkAttrs(links[p.id]) + ' title="' + esc(p.label) + '"' +
        ' aria-label="' + esc(p.label) + ' (opens in a new tab)">' + profileLogo(p) + "</a>";
    });
    return items.length ? '<span class="profile-links' + (size ? " profile-links--" + size : "") + '">' + items.join("") + "</span>" : "";
  }

  // The fun version chosen via ?fun=..., else the configured default.
  function currentFunId() {
    var m = /[?&]fun=([a-z]+)/.exec(location.search);
    if (m && funVersion(m[1])) return m[1];
    return (window.SITE_CONFIG && SITE_CONFIG.defaultFun) || "kitchen";
  }

  // Motion. By default every version follows the visitor's "reduce motion" setting. Class
  // "motion-on" on <html> overrides it (for reviewing on a computer with animations switched off):
  // reduced-motion CSS is written as
  //   @media (prefers-reduced-motion: reduce) { html:not(.motion-on) .thing { animation: none; } }
  // The override comes from "?motion=on" in the address, or from localStorage (the switch on
  // pages.html; the Kitchen's Motion switch), and "?motion=off" clears it.
  var MOTION_KEY = "site.motion";

  function motionSetting() {
    try { return localStorage.getItem(MOTION_KEY); } catch (e) { return null; }   // "on", "off" or null
  }

  function setMotion(value) {   // "on", "off" or null (follow the computer's setting)
    try { if (value) localStorage.setItem(MOTION_KEY, value); else localStorage.removeItem(MOTION_KEY); } catch (e) { /* storage blocked */ }
    applyMotion(value);
  }

  function applyMotion(value) {
    var c = document.documentElement.classList;
    c.toggle("motion-on", value === "on");
    if (value === "on") c.remove("motion-off");
  }

  function prefersReducedMotion() {
    var c = document.documentElement.classList;
    if (c.contains("motion-on")) return false;
    if (c.contains("motion-off")) return true;
    return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  (function () {
    var q = /[?&]motion=(on|off)\b/.exec(location.search);
    if (q) setMotion(q[1] === "on" ? "on" : null);
    else if (motionSetting() === "on") applyMotion("on");
  })();

  // Visitor statistics: SiteUtil.track("kitchen_served", { dish: "stir-fry" }) records one event.
  // It does nothing unless analytics is switched on (config.js) and the page is served over http(s).
  // Event names are lower_snake_case and start with the version: kitchen_, paint_, powerpoint_,
  // overleaf_, minesweeper_, classic_, start_.
  function track(event, props) {
    try {
      if (window.posthog && typeof window.posthog.capture === "function") window.posthog.capture(event, props || {});
    } catch (e) { /* statistics must never break the page */ }
  }

  // Which version of the site this page belongs to, from its address (sent with every event).
  function siteVersion() {
    var p = location.pathname;
    var m = /\/fun\/([a-z]+)\//.exec(p);
    if (m) return m[1];
    if (/\/classic\//.test(p)) return "classic";
    if (/\/pages\.html$/.test(p)) return "all-versions";
    return "start";
  }

  // PostHog (EU cloud). Runs only if config.js has a key and the page is on the real site (onlyOn),
  // so the local mockups and test servers never send anything. Neither mode (config.js) stores
  // anything on the visitor's device. The stub below queues calls until PostHog's own script
  // (loaded from PostHog's EU servers) arrives and replays them; it is PostHog's standard loader,
  // written out readably.
  function onRealSite(domain) {
    var h = location.hostname;
    return !!domain && (h === domain || h.slice(-(domain.length + 1)) === "." + domain);
  }

  function startAnalytics() {
    var A = window.SITE_CONFIG && SITE_CONFIG.analytics;
    if (!A || !A.posthogKey || !onRealSite(A.onlyOn) || window.posthog) return;
    var ph = window.posthog = [];
    ph._i = [];
    ph.people = [];
    ph.__SV = 1;
    ph.init = function (key, options, name) { ph._i.push([key, options, name]); };
    ["capture", "register", "register_once", "unregister", "identify", "reset", "set_config",
     "opt_in_capturing", "opt_out_capturing"].forEach(function (method) {
      ph[method] = function () { ph.push([method].concat(Array.prototype.slice.call(arguments))); };
    });
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = A.posthogHost.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
    document.head.appendChild(s);
    var options = {
      api_host: A.posthogHost,
      defaults: "2026-05-30",               // PostHog's recommended settings as of that date
      person_profiles: "never",             // visitors stay anonymous
      capture_pageleave: true,              // gives time on page
      respect_dnt: true,
      disable_session_recording: true,
      disable_surveys: true
    };
    if (A.mode === "cookieless") options.cookieless_mode = "always";
    else options.persistence = "memory";    // nothing kept between page loads
    ph.init(A.posthogKey, options);
    ph.register({ site_version: siteVersion() });
  }
  try { startAnalytics(); } catch (e) { /* never break the page */ }

  window.SiteUtil = {
    root: ROOT,
    esc: esc,
    url: url,
    isExternal: isExternal,
    linkAttrs: linkAttrs,
    isNewLink: isNewLink,
    inline: inline,
    plain: plain,
    listJoin: listJoin,
    withCoauthors: withCoauthors,
    withCoauthorsMd: withCoauthorsMd,
    researchLines: researchLines,
    paperGroups: paperGroups,
    pressLines: pressLines,
    isUpcoming: isUpcoming,
    page: page,
    funVersion: funVersion,
    versionIcon: versionIcon,
    versionColours: versionColours,
    profileLinks: profileLinks,
    currentFunId: currentFunId,
    prefersReducedMotion: prefersReducedMotion,
    motionSetting: motionSetting,
    setMotion: setMotion,
    track: track
  };
})();
