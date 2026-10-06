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
    inline: inline,
    plain: plain,
    listJoin: listJoin,
    withCoauthors: withCoauthors,
    withCoauthorsMd: withCoauthorsMd,
    researchLines: researchLines,
    isUpcoming: isUpcoming,
    page: page,
    funVersion: funVersion,
    versionIcon: versionIcon,
    versionColours: versionColours,
    currentFunId: currentFunId,
    prefersReducedMotion: prefersReducedMotion,
    motionSetting: motionSetting,
    setMotion: setMotion,
    track: track
  };
})();
