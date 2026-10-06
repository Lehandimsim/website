/* ==========================================================================
   shared/xp/xp.js — Windows XP desktop behaviour (homage) for the Paint,
   PowerPoint and Overleaf versions: windows, taskbar, start menu, clock,
   dialogs and balloon tips. Styles: xp.css.

   Load after content.js, config.js and shared/site.js, then call:

     XP.init({
       version: "paint",                     // this fun version (left out of "Other versions")
       onNavigate: function (pageId) {},     // start-menu page items; omit to hide them
       help: "<p>How to use this app</p>",   // Help and Support text (HTML)
       about: { title: "...", html: "<p>...</p>" },   // optional: an "i" button beside the tray's "?"
       balloon: { title: "...", text: "...", delay: 1500, timeout: 9000 }   // optional welcome tip
     });

   Windows are the .xp-window elements in the page. Attributes:
     data-title="untitled - Paint"    title bar and taskbar text
     data-icon="paint"                icon name (see ICONS below)
     data-no-minimize, data-no-maximize, data-no-close, data-no-task   leave that part out
   Put the app's content in a child <div class="xp-window-body">.
   Events fired on the window element: xp:close, xp:minimize, xp:restore, xp:maximize.

   Desktop icons: <a class="xp-icon" href="..."> or <button class="xp-icon" data-open="windowId">,
   containing XP.icon(name) markup (or an <svg class="xp-ico">) and a <span> label.
   Single click selects, double click / Enter / tap opens.
   XP.icon() marks each drawing with data-xp-ico="name", so the shell can find the Recycle Bin.

   Keys: XP.ownKeys(windowEl, fn) hands every key pressed inside that window to fn(e) before the
   page's own key handlers see it (PowerPoint listens on window in the capture phase, so a plain
   listener would come too late). If fn returns true, the page's handlers never see that key.

   The game (shared/minesweeper/, added 2026-10-02): a Minesweeper-style game with economics themes.
     - Its desktop icon goes directly above the Recycle Bin (else at the end), and the start menu
       gets a "Games" entry (phones hide the desktop icons behind full-screen windows).
     - themes.js is loaded at XP.init, to name the icon (MS_THEMES.gameName); the rest
       (minesweeper.css, art.js, minesweeper.js) only the first time the game is opened.
     - XP.openGame("scooped") opens it from code (theme id optional; ids in themes.js).
     - Balloon tips (XP.balloon) are not shown while the game window is open, and opening the game
       or the start menu closes one: the apps' tips would otherwise cover the game (PowerPoint's,
       when clicked, starts the slide show) or, on phones, the start menu's Games entry.
     - Deep link: ?minesweeper=1 or ?minesweeper=<theme id> in the address opens it on load. (Not
       the #hash: each app routes on its hash.) Optional extras: &ms-level=beginner|intermediate|expert,
       &ms-seed=<number> (the same boards every time, for tests), &ms-demo=won|lost (a finished
       game, for screenshots). Example: fun/paint/index.html?minesweeper=seminar&ms-demo=lost#home
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil;
  var SITE = window.SITE || {};
  var CONFIG = window.SITE_CONFIG || {};

  // ---------- Icons: original 32x32 drawings ----------
  var ICONS = {
    home: '<svg viewBox="0 0 32 32"><path d="M7 14v14h18V14L16 6z" fill="#f4e3b5" stroke="#8a6d3b"/><path d="M3.5 15.5 16 5l12.5 10.5" fill="none" stroke="#b33a2b" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><rect x="13" y="19" width="6" height="9" fill="#8a5a2b"/><rect x="8.5" y="16" width="4" height="4" fill="#9fd0ff" stroke="#4d6fa8"/><rect x="19.5" y="16" width="4" height="4" fill="#9fd0ff" stroke="#4d6fa8"/></svg>',
    research: '<svg viewBox="0 0 32 32"><path d="M6 3h14l6 6v20H6z" fill="#fff" stroke="#7a8ba6"/><path d="M20 3v6h6" fill="#dfe8f5" stroke="#7a8ba6"/><path d="M9 12h11M9 16h8M9 20h5" stroke="#9aa9c2"/><circle cx="20" cy="20" r="5" fill="#d7ecff" stroke="#2a5db0" stroke-width="2"/><path d="m23.6 23.6 5 5" stroke="#2a5db0" stroke-width="3" stroke-linecap="round"/></svg>',
    talks: '<svg viewBox="0 0 32 32"><rect x="12" y="3" width="8" height="15" rx="4" fill="#b8c0cc" stroke="#4b5563"/><path d="M12 8h8M12 11h8M12 14h8" stroke="#7b8494"/><path d="M8 14a8 8 0 0 0 16 0" fill="none" stroke="#4b5563" stroke-width="2"/><path d="M16 22v6M11 29h10" stroke="#4b5563" stroke-width="2" stroke-linecap="round"/></svg>',
    cv: '<svg viewBox="0 0 32 32"><path d="M6 2h14l7 7v21H6z" fill="#fff" stroke="#8b8b8b"/><path d="M20 2v7h7" fill="#eee" stroke="#8b8b8b"/><rect x="3.5" y="15" width="19" height="8" rx="1.2" fill="#d32f2f"/><text x="13" y="21.4" font-family="Arial,sans-serif" font-size="6.6" font-weight="bold" fill="#fff" text-anchor="middle">PDF</text></svg>',
    art: '<svg viewBox="0 0 32 32"><path d="M16 4C8.8 4 3.5 9 3.5 15.4c0 5.3 4 8.6 8 8.6 2 0 2.7 1.3 2.7 2.7 0 1.7 1.3 2.8 3 2.8C24.4 29.5 29 23.6 29 16.8 29 9.6 23.4 4 16 4z" fill="#ecc882" stroke="#9a6a2a"/><circle cx="10" cy="14" r="2.3" fill="#e53935"/><circle cx="14.5" cy="9.3" r="2.3" fill="#fbc02d"/><circle cx="20.5" cy="9.8" r="2.3" fill="#43a047"/><circle cx="23.6" cy="16" r="2.3" fill="#1e88e5"/></svg>',
    experience: '<svg viewBox="0 0 32 32"><rect x="3" y="10" width="26" height="17" rx="2" fill="#a8692f" stroke="#5e3912"/><path d="M12 10V6.5h8V10" fill="none" stroke="#5e3912" stroke-width="2"/><path d="M3 17h26" stroke="#5e3912"/><rect x="14" y="15" width="4" height="4" fill="#f2c94c" stroke="#5e3912"/></svg>',
    paint: '<svg viewBox="0 0 32 32"><path d="M14 5C7.5 5 3 9.5 3 15c0 4.6 3.4 7.4 6.8 7.4 1.8 0 2.3 1.1 2.3 2.3 0 1.4 1.1 2.4 2.6 2.4C21 27 25 22 25 16" fill="#f3d9a4" stroke="#9a6a2a"/><circle cx="8.5" cy="13.5" r="2" fill="#e53935"/><circle cx="12.5" cy="9.5" r="2" fill="#1e88e5"/><circle cx="18" cy="9.5" r="2" fill="#43a047"/><path d="M29 3 17.5 16.5" stroke="#7b4f2a" stroke-width="3" stroke-linecap="round"/><path d="M17.5 16.5c-2.2 0-4.2 1.6-4.2 4.2 2.6 0 4.2-1.6 4.2-4.2z" fill="#2b2b2b"/></svg>',
    powerpoint: '<svg viewBox="0 0 32 32"><rect x="3" y="4" width="26" height="20" rx="2" fill="#fff" stroke="#c4501f" stroke-width="1.5"/><rect x="3" y="4" width="26" height="5" rx="2" fill="#e8662c"/><circle cx="12" cy="17" r="5" fill="#f2a65a"/><path d="M12 17v-5a5 5 0 0 1 5 5z" fill="#c4501f"/><path d="M19.5 14h6.5M19.5 17h5.5M19.5 20h4.5" stroke="#9a9a9a"/><path d="M16 24v3.5M12 29h8" stroke="#666" stroke-width="1.6" stroke-linecap="round"/></svg>',
    overleaf: '<svg viewBox="0 0 32 32"><path d="M27.5 4C14 4 5 11 5 21c0 3 1 5.5 2.5 7C9 20 13.5 14 21 10c-6 4.5-9 10-9.5 17C22.5 27 27.5 18 27.5 4z" fill="#4cae4c" stroke="#2d7a2d"/></svg>',
    kitchen: '<svg viewBox="0 0 32 32"><path d="M3 15h22a11 8 0 0 1-22 0z" fill="#3a3a3a" stroke="#111"/><path d="M25 16h5" stroke="#7b4f2a" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="14" r="2.6" fill="#f4d03f"/><circle cx="15" cy="13.4" r="2.6" fill="#e74c3c"/><circle cx="19.5" cy="14.3" r="2" fill="#f4d03f"/><path d="M9 9c-1-2 1-3 0-5M15 8c-1-2 1-3 0-5" stroke="#9a9a9a" fill="none"/></svg>',
    globe: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="12.5" fill="#3f8ae0" stroke="#1d5bb5"/><path d="M7.5 10.5c3 1 4.5 3.5 3.2 5.8s.8 4.2 3 4.2 1.4 3.6 3 4.8M19 5.5c-1.2 2.8 1.6 4.2 3.8 4.2s3.2 3 2.2 5.2" fill="none" stroke="#7cc44f" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="16" r="12.5" fill="none" stroke="#fff" stroke-opacity=".35"/></svg>',
    camera: '<svg viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="18" rx="3" fill="#575757" stroke="#222"/><rect x="10" y="5.5" width="9" height="4.5" rx="1" fill="#575757" stroke="#222"/><circle cx="16" cy="18" r="6" fill="#222" stroke="#a5a5a5" stroke-width="2"/><circle cx="16" cy="18" r="3" fill="#4a6fa5"/><circle cx="24.5" cy="12.5" r="1.3" fill="#f5c542"/></svg>',
    notepad: '<svg viewBox="0 0 32 32"><rect x="6" y="4" width="20" height="25" rx="1" fill="#fff" stroke="#6b7a90"/><rect x="6" y="4" width="20" height="5" fill="#4a7fd4"/><path d="M9 13h14M9 17h14M9 21h14M9 25h9" stroke="#9db3d6"/></svg>',
    mail: '<svg viewBox="0 0 32 32"><rect x="3" y="7" width="26" height="18" rx="1.5" fill="#fff" stroke="#6b7a90"/><path d="m3.5 8 12.5 9.5L28.5 8" fill="none" stroke="#6b7a90" stroke-width="1.6"/></svg>',
    folder: '<svg viewBox="0 0 32 32"><path d="M3 8h10l3 3h13v16H3z" fill="#f6d36b" stroke="#c79a28"/><path d="M3 13h26v14H3z" fill="#fbe08f" stroke="#c79a28"/></svg>',
    recycle: '<svg viewBox="0 0 32 32"><path d="M9 9h14l-2 19H11z" fill="#e3edf8" stroke="#6b85a8"/><path d="M7 9h18" stroke="#6b85a8" stroke-width="2" stroke-linecap="round"/><path d="M13 12v13M16 12v13M19 12v13" stroke="#9fb4d1"/></svg>',
    // The game (shared/minesweeper/): a spiky black mine with a white glint, in the spirit of the
    // classic Minesweeper icon (Lehan, 2026-10-05); drawn here, not copied. A faint white edge keeps it
    // visible on the dark taskbar.
    minesweeper: '<svg viewBox="0 0 32 32"><g stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"><path d="M16 3v26M3 16h26M7 7l18 18M25 7 7 25"/></g><circle cx="16" cy="16" r="9.6" fill="#fff" fill-opacity=".55"/><g stroke="#111" stroke-linecap="round"><path d="M16 3v26M3 16h26" stroke-width="2.8"/><path d="M7 7l18 18M25 7 7 25" stroke-width="2.4"/></g><circle cx="16" cy="16" r="8.4" fill="#111"/><rect x="11.4" y="11.4" width="3.8" height="3.8" rx=".6" fill="#fff"/></svg>',
    // Google Scholar: a plain mortarboard (not Google's logo).
    scholar: '<svg viewBox="0 0 32 32"><path d="M8.5 15.5v6c0 2.2 3.4 4 7.5 4s7.5-1.8 7.5-4v-6L16 18.6z" fill="#3d4f70" stroke="#14203a"/><path d="M16 6 30 12.3 16 18.6 2 12.3z" fill="#2b3a55" stroke="#14203a" stroke-linejoin="round"/><path d="M16 12.3 26.6 14v8" fill="none" stroke="#e8b923" stroke-width="1.4"/><path d="M25.4 21.6h2.4l.7 4.2h-3.8z" fill="#e8b923"/><circle cx="16" cy="12.3" r="1.4" fill="#e8b923"/></svg>',
    help: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#2f6fd6" stroke="#174a9c"/><text x="16" y="22.5" font-family="Georgia,serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">?</text></svg>',
    info: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#2f6fd6" stroke="#174a9c"/><circle cx="16" cy="9.5" r="2.1" fill="#fff"/><rect x="14.2" y="13" width="3.6" height="11" rx="1" fill="#fff"/></svg>',
    warning: '<svg viewBox="0 0 32 32"><path d="M16 3 30 28H2z" fill="#f7c600" stroke="#9a7a00" stroke-linejoin="round"/><rect x="14.4" y="11" width="3.2" height="9" rx="1" fill="#000"/><circle cx="16" cy="24" r="1.8" fill="#000"/></svg>',
    error: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="#e2452b" stroke="#9e2a15"/><path d="m11 11 10 10M21 11 11 21" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>',
    logoff: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" rx="4" fill="#f5b400" stroke="#a87700"/><path d="M13 16h12m-4-4 4 4-4 4" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 9H9v14h6" fill="none" stroke="#fff" stroke-width="2.5"/></svg>',
    turnoff: '<svg viewBox="0 0 32 32"><rect x="4" y="4" width="24" height="24" rx="4" fill="#e1452b" stroke="#9e2a15"/><path d="M11.5 11a7 7 0 1 0 9 0" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M16 8v8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/></svg>',
    volume: '<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10L5 10H2z" fill="#fff"/><path d="M11 5c1.5 1.5 1.5 4.5 0 6" stroke="#fff" fill="none"/></svg>',
    // Start button mark: four colour blobs, in the spirit of XP without copying its logo.
    flag: '<svg viewBox="0 0 20 20"><rect x="1.5" y="2" width="7.6" height="7.4" rx="3" fill="#f35325" transform="rotate(-6 5 6)"/><rect x="10.6" y="1.6" width="7.6" height="7.4" rx="3" fill="#81bc06" transform="rotate(-6 14 5)"/><rect x="1.8" y="10.8" width="7.6" height="7.4" rx="3" fill="#05a6f0" transform="rotate(-6 5 14)"/><rect x="10.9" y="10.4" width="7.6" height="7.4" rx="3" fill="#ffba08" transform="rotate(-6 14 14)"/></svg>'
  };

  // Title bar button glyphs (white on the blue/red buttons).
  var GLYPH = {
    min: '<svg viewBox="0 0 11 11" aria-hidden="true"><rect x="1" y="8" width="6" height="2" fill="#fff"/></svg>',
    max: '<svg viewBox="0 0 11 11" aria-hidden="true"><rect x="1.5" y="1.5" width="8" height="8" fill="none" stroke="#fff"/><rect x="1" y="1" width="9" height="2.5" fill="#fff"/></svg>',
    restore: '<svg viewBox="0 0 11 11" aria-hidden="true"><rect x="3.5" y="0.5" width="7" height="7" fill="none" stroke="#fff"/><rect x="3" y="0" width="8" height="2" fill="#fff"/><rect x="0.5" y="3.5" width="7" height="7" fill="#2a6ae8" stroke="#fff"/><rect x="0" y="3" width="8" height="2" fill="#fff"/></svg>',
    close: '<svg viewBox="0 0 11 11" aria-hidden="true"><path d="M2 2l7 7M9 2 2 9" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>'
  };

  // XP.icon("paint") -> SVG markup with class "xp-ico" (or the class given), marked data-xp-ico="paint".
  function icon(name, cls) {
    var svg = ICONS[name] || ICONS.folder;
    return svg.replace("<svg ", '<svg class="' + (cls || "xp-ico") + '" data-xp-ico="' + String(name).replace(/[^\w-]/g, "") + '" aria-hidden="true" focusable="false" ');
  }

  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function fire(target, name, detail) {
    target.dispatchEvent(new CustomEvent(name, { bubbles: true, detail: detail || {} }));
  }

  function isSmall() {
    return window.matchMedia ? matchMedia("(max-width: 700px)").matches : false;
  }

  var opts = {};
  var desktop, tasks, startBtn, startMenu, clockEl, balloonEl, balloonTimer;
  var zTop = 20;

  // ---------- Keys for windows that handle their own (XP.ownKeys) ----------
  // Registered when xp.js loads, before any app script, so it runs before the apps' own handlers.
  function ownKeys(ref, fn) {
    var w = win(ref);
    if (w) w._xpKeys = fn;
  }
  window.addEventListener("keydown", function (e) {
    var w = e.target && e.target.closest ? e.target.closest(".xp-window") : null;
    if (!w || typeof w._xpKeys !== "function") return;
    var mine = false;
    try { mine = w._xpKeys(e) === true; } catch (err) { if (window.console) console.error(err); }
    if (mine) e.stopImmediatePropagation();
  }, true);

  // ---------- Windows ----------
  function allWindows() {
    return Array.prototype.slice.call(document.querySelectorAll(".xp-window:not(.xp-dialog)"));
  }

  function win(ref) {
    return typeof ref === "string" ? document.getElementById(ref) : ref;
  }

  function setupWindow(w) {
    if (w._xp) return;
    w._xp = true;
    var bar = w.querySelector(".xp-titlebar");
    if (!bar) {
      bar = h("div", { "class": "xp-titlebar" });
      var html = icon(w.getAttribute("data-icon") || "folder", "xp-title-icon") + '<span class="xp-title"></span>';
      if (!w.hasAttribute("data-no-minimize")) html += '<button type="button" class="xp-tbtn" data-act="min" aria-label="Minimize" title="Minimize">' + GLYPH.min + "</button>";
      if (!w.hasAttribute("data-no-maximize")) html += '<button type="button" class="xp-tbtn" data-act="max" aria-label="Maximize" title="Maximize">' + GLYPH.max + "</button>";
      if (!w.hasAttribute("data-no-close")) html += '<button type="button" class="xp-tbtn xp-tbtn--close" data-act="close" aria-label="Close" title="Close">' + GLYPH.close + "</button>";
      bar.innerHTML = html;
      w.insertBefore(bar, w.firstChild);
    }
    bar.querySelector(".xp-title").textContent = w.getAttribute("data-title") || "";

    bar.addEventListener("click", function (e) {
      var b = e.target.closest(".xp-tbtn");
      if (!b) return;
      var act = b.getAttribute("data-act");
      if (act === "min") minimize(w);
      else if (act === "max") toggleMaximize(w);
      else if (act === "close") close(w);
    });
    bar.addEventListener("dblclick", function (e) {
      if (!e.target.closest(".xp-tbtn") && !w.hasAttribute("data-no-maximize")) toggleMaximize(w);
    });
    w.addEventListener("pointerdown", function () { activate(w); });
    makeDraggable(w, bar);
    if (!w.hidden) ensureTask(w);
  }

  function makeDraggable(w, bar) {
    var startX, startY, origX, origY, dragging = false, pointer;
    bar.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.target.closest(".xp-tbtn") || w.classList.contains("is-maximized") || isSmall()) return;
      var r = w.getBoundingClientRect(), d = desktop.getBoundingClientRect();
      // Freeze the current geometry in pixels, so dragging does not reflow percentage sizes.
      w.style.left = (r.left - d.left) + "px";
      w.style.top = (r.top - d.top) + "px";
      w.style.width = r.width + "px";
      w.style.height = r.height + "px";
      w.style.right = "auto";
      w.style.bottom = "auto";
      w.style.transform = "none";
      startX = e.clientX; startY = e.clientY;
      origX = r.left - d.left; origY = r.top - d.top;
      dragging = true;
      pointer = e.pointerId;
      bar.setPointerCapture(pointer);
    });
    bar.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var d = desktop.getBoundingClientRect();
      var x = origX + e.clientX - startX, y = origY + e.clientY - startY;
      x = Math.max(-w.offsetWidth + 100, Math.min(d.width - 100, x));   // keep part of it reachable
      y = Math.max(0, Math.min(d.height - 30, y));
      w.style.left = x + "px";
      w.style.top = y + "px";
    });
    function end() {
      if (!dragging) return;
      dragging = false;
      try { bar.releasePointerCapture(pointer); } catch (err) { /* already released */ }
    }
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
  }

  function ensureTask(w) {
    if (w._task || w.hasAttribute("data-no-task") || !tasks) return;
    var b = h("button", { "class": "xp-taskbtn", type: "button", "aria-pressed": "false" },
      icon(w.getAttribute("data-icon") || "folder") + "<span></span>");
    b.querySelector("span").textContent = w.getAttribute("data-title") || "";
    b.addEventListener("click", function () {
      if (b.getAttribute("aria-pressed") === "true" && !w.classList.contains("is-minimized")) minimize(w);
      else restore(w);
    });
    tasks.appendChild(b);
    w._task = b;
  }

  // A window's taskbar button (null if it has none), for apps that add buttons of their own.
  function taskButton(ref) {
    var w = win(ref);
    return (w && w._task) || null;
  }

  // On phones the desktop icons are hidden behind full-screen windows. Once every window is closed,
  // show them again, so the visitor can reopen one (xp.css: body.xp-all-closed).
  function updateAllClosed() {
    var open = allWindows().some(function (o) { return !o.hidden; });
    document.body.classList.toggle("xp-all-closed", !open);
  }

  function activate(ref) {
    var w = win(ref);
    if (!w || w.hidden || w.classList.contains("is-minimized")) return;
    w.style.zIndex = ++zTop;
    allWindows().forEach(function (o) {
      o.classList.toggle("is-inactive", o !== w);
      if (o._task) o._task.setAttribute("aria-pressed", String(o === w));
    });
  }

  function activateTop() {
    var best = null;
    allWindows().forEach(function (o) {
      if (o.hidden || o.classList.contains("is-minimized")) return;
      if (!best || (+o.style.zIndex || 0) > (+best.style.zIndex || 0)) best = o;
    });
    if (best) activate(best);
    else allWindows().forEach(function (o) { if (o._task) o._task.setAttribute("aria-pressed", "false"); });
  }

  // If focus was inside a window that just went away, move it somewhere visible (else it falls to
  // <body> and keyboard users lose their place).
  // hadFocus: whether focus was inside the window before it was hidden (checked by the caller).
  function rescueFocus(w, hadFocus, to) {
    if (!hadFocus) return;
    var a = document.activeElement;
    if (a && a !== document.body && !w.contains(a)) return;   // something else already took focus
    if (to && to.getClientRects().length) to.focus();
    else if (startBtn) startBtn.focus();
  }

  function minimize(ref) {
    var w = win(ref);
    var hadFocus = w.contains(document.activeElement);
    w.classList.add("is-minimized");
    if (w._task) w._task.setAttribute("aria-pressed", "false");
    fire(w, "xp:minimize");
    activateTop();
    rescueFocus(w, hadFocus, w._task);   // its taskbar button brings it back
  }

  function restore(ref) {
    var w = win(ref);
    if (!w) return;
    w.hidden = false;
    w.classList.remove("is-minimized");
    ensureTask(w);
    activate(w);
    updateAllClosed();
    fire(w, "xp:restore");
  }

  function toggleMaximize(ref, force) {
    var w = win(ref);
    var on = force != null ? !!force : !w.classList.contains("is-maximized");
    w.classList.toggle("is-maximized", on);
    var b = w.querySelector('.xp-tbtn[data-act="max"]');
    if (b) {
      b.innerHTML = on ? GLYPH.restore : GLYPH.max;
      b.setAttribute("aria-label", on ? "Restore Down" : "Maximize");
      b.title = on ? "Restore Down" : "Maximize";
    }
    fire(w, "xp:maximize", { maximized: on });
  }

  function close(ref) {
    var w = win(ref);
    var hadFocus = w.contains(document.activeElement);
    w.hidden = true;
    w.classList.remove("is-minimized");
    if (w._task) { w._task.remove(); w._task = null; }
    updateAllClosed();
    fire(w, "xp:close");
    activateTop();
    rescueFocus(w, hadFocus, w.id ? document.querySelector('.xp-icon[data-open="' + w.id + '"]') : null);   // the icon that reopens it
  }

  function setTitle(ref, text) {
    var w = win(ref);
    w.setAttribute("data-title", text);
    var t = w.querySelector(".xp-title");
    if (t) t.textContent = text;
    if (w._task) w._task.querySelector("span").textContent = text;
  }

  // ---------- Desktop icons ----------
  function setupIcons() {
    Array.prototype.forEach.call(document.querySelectorAll(".xp-icon"), function (ic) {
      ic.addEventListener("click", function (e) {
        var touch = e.pointerType === "touch" || (window.matchMedia && matchMedia("(hover: none)").matches);
        selectIcon(ic);
        if (touch) { e.preventDefault(); openIcon(ic); }
        else if (ic.tagName === "A") e.preventDefault();    // links open on double click, like XP
      });
      ic.addEventListener("dblclick", function (e) { e.preventDefault(); openIcon(ic); });
      ic.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectIcon(ic); openIcon(ic); }
      });
    });
    desktop.addEventListener("pointerdown", function (e) {
      if (!e.target.closest(".xp-icon")) selectIcon(null);
    });
  }

  function selectIcon(ic) {
    Array.prototype.forEach.call(document.querySelectorAll(".xp-icon.is-selected"), function (o) {
      o.classList.remove("is-selected");
    });
    if (ic) ic.classList.add("is-selected");
  }

  function openIcon(ic) {
    var target = ic.getAttribute("data-open");
    if (target) { restore(target); return; }
    var href = ic.getAttribute("href");
    if (href) {
      if (ic.getAttribute("target") === "_blank") window.open(href, "_blank", "noopener");
      else location.href = href;
    }
    fire(ic, "xp:open");
  }

  // ---------- Taskbar ----------
  function buildTaskbar() {
    var bar = h("div", { "class": "xp-taskbar", role: "region", "aria-label": "Taskbar" });   // a landmark, so screen readers can jump to it
    startBtn = h("button", {
      "class": "xp-start", type: "button",
      "aria-haspopup": "true", "aria-expanded": "false", "aria-controls": "xp-startmenu"
    }, icon("flag", "xp-flag") + "start");
    tasks = h("div", { "class": "xp-tasks", role: "group", "aria-label": "Open windows" });
    var tray = h("div", { "class": "xp-tray" });
    var help = h("button", { "class": "xp-tray-btn", type: "button", title: "Help", "aria-label": "Help" }, icon("help"));
    tray.appendChild(help);
    if (opts.about) {
      var aboutTitle = opts.about.title || "About";
      var about = h("button", { "class": "xp-tray-btn xp-tray-btn--about", type: "button", title: aboutTitle, "aria-label": aboutTitle }, icon("info"));
      tray.appendChild(about);
      about.addEventListener("click", showAbout);
    }
    tray.insertAdjacentHTML("beforeend", icon("volume"));
    clockEl = h("span", { "class": "xp-clock" });
    tray.appendChild(clockEl);
    bar.appendChild(startBtn);
    bar.appendChild(tasks);
    bar.appendChild(tray);
    document.body.appendChild(bar);

    startBtn.addEventListener("click", function () { toggleStart(); });
    help.addEventListener("click", showHelp);
    tick();
    setInterval(tick, 15000);
  }

  function tick() {
    var d = new Date(), hr = d.getHours(), mn = d.getMinutes();
    clockEl.textContent = (hr % 12 || 12) + ":" + (mn < 10 ? "0" : "") + mn + " " + (hr >= 12 ? "PM" : "AM");
  }

  // ---------- Start menu ----------
  function buildStartMenu() {
    var P = SITE.person || {};
    var links = P.links || {};
    startMenu = h("div", { "class": "xp-startmenu", id: "xp-startmenu", role: "dialog", "aria-label": "Start menu" });

    var left = "";
    if (opts.onNavigate) {
      left += '<div class="xp-sm-label">Pages</div>';
      (SITE.pages || []).forEach(function (p) {
        left += '<button type="button" class="xp-sm-item" data-page="' + U.esc(p.id) + '">' +
          icon(p.id) + "<b>" + U.esc(p.label) + "</b></button>";
      });
    }
    var others = (CONFIG.funVersions || []).filter(function (v) { return v.id !== opts.version; });
    if (others.length) {
      if (left) left += '<div class="xp-sm-sep"></div>';
      left += '<div class="xp-sm-label">Other versions</div>';
      others.forEach(function (v) {
        left += '<a class="xp-sm-item" href="' + U.esc(U.url(v.path)) + '">' + icon(v.id) + U.esc(v.label) + "</a>";
      });
    }
    // The game (named by themes.js's gameName once it is in: nameGame()).
    if (left) left += '<div class="xp-sm-sep"></div>';
    left += '<div class="xp-sm-label">Games</div>' +
      '<button type="button" class="xp-sm-item" data-act="game">' + icon("minesweeper") + '<span class="xp-game-label">' + U.esc(gameLabel()) + "</span></button>";

    var right =
      '<a class="xp-sm-item" href="' + U.esc(U.url("classic/index.html")) + '">' + icon("globe") + "<b>Classic website</b></a>" +
      (links.scholar ? '<a class="xp-sm-item" ' + U.linkAttrs(links.scholar) + ">" + icon("scholar") + "Google Scholar</a>" : "") +
      '<a class="xp-sm-item" ' + U.linkAttrs(links.cv) + ' target="_blank">' + icon("cv") + "My CV (PDF)</a>" +
      '<a class="xp-sm-item" ' + U.linkAttrs(links.photography) + ">" + icon("camera") + "Photography</a>" +
      '<a class="xp-sm-item" ' + U.linkAttrs(links.blog) + ">" + icon("notepad") + "Blog</a>" +
      '<a class="xp-sm-item" href="mailto:' + U.esc(P.email) + '">' + icon("mail") + "Email Lehan</a>" +
      '<div class="xp-sm-sep"></div>' +
      (opts.about ? '<button type="button" class="xp-sm-item" data-act="about">' + icon("info") + U.esc(opts.about.title || "About") + "</button>" : "") +
      '<button type="button" class="xp-sm-item" data-act="help">' + icon("help") + "Help and Support</button>";

    startMenu.innerHTML =
      '<div class="xp-sm-head"><img src="' + U.esc(U.url(P.photo && P.photo.headshot)) + '" alt="">' + U.esc(P.name || "") + "</div>" +
      '<div class="xp-sm-body"><div class="xp-sm-col">' + left + '</div><div class="xp-sm-col xp-sm-col--right">' + right + "</div></div>" +
      '<div class="xp-sm-foot">' +
        '<button type="button" data-act="logoff">' + icon("logoff") + "Log Off</button>" +
        '<button type="button" data-act="turnoff">' + icon("turnoff") + "Turn Off Computer</button>" +
      "</div>";
    document.body.appendChild(startMenu);

    // Tabbing out of the open menu closes it (focus moving to the start button itself is fine). This
    // watches where focus arrives: the menu is last on the page, so Tab from its last item passes
    // through the browser's own controls before landing back at the top of the page.
    document.addEventListener("focusin", function (e) {
      var to = e.target;
      if (startMenu.classList.contains("is-open") && !startMenu.contains(to) && to !== startBtn) toggleStart(false);
    });

    startMenu.addEventListener("click", function (e) {
      var item = e.target.closest("[data-page],[data-act],a");
      if (!item) return;
      var page = item.getAttribute("data-page");
      var act = item.getAttribute("data-act");
      if (page || act) e.preventDefault();
      toggleStart(false);
      if (page && opts.onNavigate) opts.onNavigate(page);
      else if (act === "help") showHelp();
      else if (act === "about") showAbout();
      else if (act === "game") openGame();
      else if (act === "logoff") location.href = U.url("index.html");
      else if (act === "turnoff") turnOff();
    });
  }

  function toggleStart(force) {
    var open = force != null ? !!force : !startMenu.classList.contains("is-open");
    startMenu.classList.toggle("is-open", open);
    startBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      closeBalloon();     // on phones a balloon tip covers the foot of the start menu (the Games entry)
      var first = startMenu.querySelector(".xp-sm-item");
      if (first) first.focus();
    }
  }

  function turnOff() {
    alertBox({
      title: "Turn off computer",
      icon: "turnoff",
      html: "<p><b>Leaving already?</b></p><p>Turn Off goes back to the start page, where you can pick the classic website or another version. Restart reloads this one.</p>",
      buttons: ["Turn Off", "Restart", "Cancel"]
    }).then(function (choice) {
      if (choice === "Turn Off") location.href = U.url("index.html");
      else if (choice === "Restart") location.reload();
    });
  }

  function showHelp() {
    alertBox({
      title: "Help and Support Center",
      icon: "help",
      html: opts.help ||
        "<p><b>Getting around</b></p>" +
        "<p>Click <b>start</b> (bottom left) for every page of the site, the classic website and the CV.</p>" +
        "<p>Drag a window by its blue title bar; double-click the title bar to maximise it.</p>",
      buttons: ["OK"]
    });
  }

  // The tray's "i" button (opts.about): a few words on what inspired this version.
  function showAbout() {
    if (!opts.about) return;
    alertBox({ title: opts.about.title || "About", icon: "info", html: opts.about.html || "", buttons: ["OK"] });
  }

  // ---------- Dialogs ----------
  // XP.alert({ title, text | html, icon: "info"|"warning"|"error"|"help"|..., buttons: ["OK"] })
  // Returns a Promise of the clicked button's label (Esc / the X button = the last button).
  var dialogCount = 0;
  function alertBox(o) {
    o = o || {};
    var buttons = o.buttons && o.buttons.length ? o.buttons : ["OK"];
    return new Promise(function (resolve) {
      var id = "xp-dialog-title-" + (++dialogCount);
      var prevFocus = document.activeElement;
      var modal = h("div", { "class": "xp-modal" });
      var box = h("div", { "class": "xp-window xp-dialog", role: "alertdialog", "aria-modal": "true", "aria-labelledby": id });
      box.innerHTML =
        '<div class="xp-titlebar"><span class="xp-title" id="' + id + '"></span>' +
        '<button type="button" class="xp-tbtn xp-tbtn--close" aria-label="Close" title="Close">' + GLYPH.close + "</button></div>" +
        '<div class="xp-window-body"><div class="xp-dialog-msg">' + icon(o.icon || "info") +
        '<div class="xp-dialog-text"></div></div><div class="xp-dialog-buttons"></div></div>';
      box.querySelector(".xp-title").textContent = o.title || "";
      var text = box.querySelector(".xp-dialog-text");
      if (o.html) text.innerHTML = o.html;
      else text.innerHTML = "<p>" + U.esc(o.text || "") + "</p>";
      var row = box.querySelector(".xp-dialog-buttons");
      buttons.forEach(function (label) {
        var b = h("button", { "class": "xp-button", type: "button" });
        b.textContent = label;
        b.addEventListener("click", function () { done(label); });
        row.appendChild(b);
      });
      box.querySelector(".xp-tbtn--close").addEventListener("click", function () { done(buttons[buttons.length - 1]); });
      // Tab and Shift+Tab go round the dialog's own controls (it is modal).
      function focusables() {
        return Array.prototype.filter.call(
          box.querySelectorAll("a[href], button, input, textarea, select, [tabindex]"),
          function (el) { return el.tabIndex >= 0 && !el.disabled && el.getClientRects().length > 0; });
      }
      function onKey(e) {
        if (!isTopModal()) return;
        if (e.key === "Escape") { e.preventDefault(); done(buttons[buttons.length - 1]); return; }
        if (e.key !== "Tab") return;
        var items = focusables(), i = items.indexOf(document.activeElement);
        if (!items.length) return;
        if (i < 0) { e.preventDefault(); items[e.shiftKey ? items.length - 1 : 0].focus(); }
        else if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
      function isTopModal() {
        var all = document.querySelectorAll(".xp-modal");
        return all[all.length - 1] === modal;
      }
      // Everything behind the dialog is inert while it is open (no clicks, no focus, hidden from
      // screen readers); each element gets back the inert state it had before.
      var behind = Array.prototype.filter.call(document.body.children, function (el) { return el !== modal; })
        .map(function (el) { return { el: el, was: el.inert }; });
      function done(label) {
        document.removeEventListener("keydown", onKey, true);
        behind.forEach(function (b) { b.el.inert = b.was; });
        modal.remove();
        if (prevFocus && prevFocus.focus) prevFocus.focus();
        resolve(label);
      }
      // Listen for keys from the next tick: a dialog opened by an Esc key press would otherwise
      // catch that same press and close at once.
      setTimeout(function () { if (modal.isConnected) document.addEventListener("keydown", onKey, true); }, 0);
      modal.appendChild(box);
      document.body.appendChild(modal);
      behind.forEach(function (b) { b.el.inert = true; });
      row.querySelector("button").focus();
    });
  }

  // ---------- Balloon tips ----------
  // XP.balloon({ title, text | html, icon, timeout (ms, 0 = stay), onClick })
  function balloon(o) {
    closeBalloon();
    if (gameInFront()) return;     // an app's tip would sit on top of the game (and act on the app behind)
    var b = h("div", { "class": "xp-balloon", role: "status" });
    b.innerHTML = "<b>" + icon(o.icon || "info") + "<span></span></b><div class=\"xp-balloon-text\"></div>" +
      '<button type="button" class="xp-balloon-x" aria-label="Close">&times;</button>';
    b.querySelector("b span").textContent = o.title || "";
    var text = b.querySelector(".xp-balloon-text");
    if (o.html) text.innerHTML = o.html; else text.textContent = o.text || "";
    b.querySelector(".xp-balloon-x").addEventListener("click", function (e) { e.stopPropagation(); closeBalloon(); });
    if (o.onClick) {
      b.style.cursor = "pointer";
      b.addEventListener("click", function () { closeBalloon(); o.onClick(); });
    }
    document.body.appendChild(b);
    balloonEl = b;
    if (o.timeout !== 0) balloonTimer = setTimeout(closeBalloon, o.timeout || 10000);
  }

  function closeBalloon() {
    clearTimeout(balloonTimer);
    if (balloonEl) { balloonEl.remove(); balloonEl = null; }
  }

  // ---------- The game (shared/minesweeper/) ----------
  var GAME_DIR = "shared/minesweeper/";
  var GAME_FALLBACK_LABEL = "Minesweeper";   // until themes.js (gameName) has loaded
  var gameQueue = null;                      // callbacks waiting while the game's files load

  function gameLabel() {
    var T = window.MS_THEMES;
    return (T && T.gameName) || GAME_FALLBACK_LABEL;
  }

  // Load one of the game's files (script or stylesheet); calls done() either way.
  function loadGameFile(name, done) {
    var el;
    if (/\.css$/.test(name)) el = h("link", { rel: "stylesheet", href: U.url(GAME_DIR + name) });
    else { el = document.createElement("script"); el.src = U.url(GAME_DIR + name); }
    el.onload = el.onerror = function () { done(); };
    (/\.css$/.test(name) ? document.head : document.body).appendChild(el);
  }

  function loadGame(cb) {
    if (window.Minesweeper) { cb(true); return; }
    if (gameQueue) { gameQueue.push(cb); return; }
    gameQueue = [cb];
    var files = ["minesweeper.css", "themes.js", "art.js", "minesweeper.js"].filter(function (f) {
      return !(f === "themes.js" && window.MS_THEMES);
    });
    (function next() {
      if (files.length) { loadGameFile(files.shift(), next); return; }
      var q = gameQueue, ok = !!window.Minesweeper;
      gameQueue = null;
      q.forEach(function (f) { f(ok); });
    })();
  }

  // The game window is open and not minimised (the apps' balloon tips wait until it is not).
  function gameInFront() {
    var gw = document.getElementById("ms-window");
    return !!(gw && !gw.hidden && !gw.classList.contains("is-minimized"));
  }

  // XP.openGame(theme, { level, seed, demo }): load the game if need be, then open its window.
  function openGame(theme, extra) {
    toggleStart(false);
    closeBalloon();
    loadGame(function (ok) {
      if (!ok) {
        alertBox({ title: gameLabel(), icon: "error", text: "The game could not be loaded. Try reloading the page.", buttons: ["OK"] });
        return;
      }
      var o = extra || {};
      o.theme = theme;
      o.app = opts.version || "";
      window.Minesweeper.open(o);
    });
  }

  // The desktop icon, directly above the Recycle Bin (found by its drawing), else at the end.
  function addGameIcon() {
    var box = desktop.querySelector(".xp-icons");
    if (!box || document.getElementById("xp-game-icon")) return;
    var b = h("button", { type: "button", "class": "xp-icon", id: "xp-game-icon" }, icon("minesweeper") + '<span class="xp-game-label"></span>');
    var bin = box.querySelector('.xp-icon [data-xp-ico="recycle"]');
    bin = bin ? bin.closest(".xp-icon") : null;
    if (bin && bin.parentNode === box) box.insertBefore(b, bin); else box.appendChild(b);
    b.addEventListener("xp:open", function () { openGame(); });
    nameGame();
  }

  // Label the icon and the start menu entry with the game's name (themes.js gameName).
  function nameGame() {
    var label = gameLabel();
    var tip = (window.MS_THEMES && window.MS_THEMES.iconTip) || "A game";
    Array.prototype.forEach.call(document.querySelectorAll(".xp-game-label"), function (s) { s.textContent = label; });
    var ic = document.getElementById("xp-game-icon");
    if (ic) ic.title = tip;
  }

  // ?minesweeper=1 or ?minesweeper=<theme> (+ &ms-level, &ms-seed, &ms-demo) opens the game on load.
  function gameFromAddress() {
    function param(name) {
      var m = new RegExp("[?&]" + name + "(?:=([^&#]*))?(?=&|#|$)").exec(location.search);
      if (!m) return null;
      try { return decodeURIComponent(m[1] || ""); } catch (e) { return m[1] || ""; }
    }
    var theme = param("minesweeper");
    if (theme == null) return;
    var seed = param("ms-seed");
    openGame(theme, {
      level: param("ms-level") || undefined,
      seed: seed != null && seed !== "" && !isNaN(+seed) ? +seed : undefined,
      demo: param("ms-demo") || undefined
    });
  }

  // ---------- Init ----------
  function init(o) {
    opts = o || {};
    document.body.classList.add("xp");
    desktop = document.querySelector(".xp-desktop");
    if (!desktop) {
      desktop = h("div", { "class": "xp-desktop" });
      document.body.insertBefore(desktop, document.body.firstChild);
    }
    buildTaskbar();
    buildStartMenu();
    allWindows().forEach(setupWindow);
    addGameIcon();
    setupIcons();
    activateTop();
    updateAllClosed();
    // themes.js names the game's icon; then ?minesweeper=... may open the game.
    if (window.MS_THEMES) gameFromAddress();
    else loadGameFile("themes.js", function () { nameGame(); gameFromAddress(); });

    // Close the start menu when clicking elsewhere; Esc closes it; Ctrl+Esc opens it (as on XP).
    document.addEventListener("pointerdown", function (e) {
      if (startMenu.classList.contains("is-open") && !startMenu.contains(e.target) && !startBtn.contains(e.target)) toggleStart(false);
    }, true);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && startMenu.classList.contains("is-open")) { toggleStart(false); startBtn.focus(); }
      else if (e.key === "Escape" && e.ctrlKey) toggleStart(true);
      else if (e.key === "Escape" && balloonEl && !document.querySelector(".xp-modal")) closeBalloon();   // Esc dismisses a tip
    });

    if (opts.balloon) {
      setTimeout(function () { balloon(opts.balloon); }, opts.balloon.delay || 1200);
    }
  }

  window.XP = {
    init: init,
    icon: icon,
    setupWindow: setupWindow,      // for windows added after init
    open: restore,
    restore: restore,
    minimize: minimize,
    toggleMaximize: toggleMaximize,
    close: close,
    activate: activate,
    setTitle: setTitle,
    taskButton: taskButton,
    about: showAbout,
    alert: alertBox,
    balloon: balloon,
    closeBalloon: closeBalloon,
    toggleStart: toggleStart,
    ownKeys: ownKeys,
    openGame: openGame,
    desktopRect: function () { return desktop.getBoundingClientRect(); }
  };
})();
