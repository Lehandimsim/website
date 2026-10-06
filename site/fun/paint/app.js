/* ==========================================================================
   fun/paint/app.js — V2: the website as an MS Paint window on a Windows XP
   desktop. This file wires everything together:

     - desktop icons and the shared XP shell (shared/xp/xp.js)
     - the menu bar: File, Edit, View, Image, Colors, Help before Start;
       the website's pages (SITE.pages) plus "Paint!" after Start
     - the toolbox, the options box, the colour box and the status bar
     - routing by URL hash, in menu-bar order: #start (default), #home,
       #research, #talks, #experience, #cv, #art, #paint
     - dialogs by URL hash (for deep links and screenshots; the address then
       drops back to the page's own hash):
         #research/abstract-1, #research/abstract-2   a paper's Abstract popup
         #about (or #<page>/about)                      the tray's "i" dialog

   Page layouts and decorations: pages.js. The drawing canvas: draw.js.
   Hand-drawn SVG helpers: doodle.js. All CV text comes from content.js.
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil;
  var SITE = window.SITE || {};
  var P = SITE.person || {};
  var LINKS = P.links || {};
  var Pages = window.PaintPages;
  var Draw = window.PaintDraw;
  var Doodle = window.Doodle;
  var XP = window.XP;

  // ---------- Interface words (not CV content) ----------
  var TEXT = {
    titleStart: "untitled - Paint",
    titleSite: "lehanzhang.com - Paint",
    docTitle: "Lehan Zhang · Paint",
    statusHelp: "For Help, click Help Topics on the Help Menu.",
    status: {
      home: "Click the Enter key (or press Enter) to look around. The menu bar holds the website's pages.",
      research: "Tip: click a colour in the palette below to repaint the doodles.",
      talks: "Talks circled in red are still to come.",
      cv: "The full CV is a PDF: view it in a new tab, or download it.",
      art: "Photography and the blog open on their own websites.",
      experience: "Use the buttons under the title to jump to a section.",
      paint: "Left click draws with the drawing colour, right click with the background colour."
    },
    classic: "Classic website",
    classicTip: "The plain-text version of this website",
    scholarFirst: "Google",   // shown before "Scholar" except on phones, to keep the menu bar on two rows
    scholar: "Scholar",
    scholarTip: "Lehan's Google Scholar page, in a new tab",
    cvPdf: "CV (PDF)",
    cvPdfTip: "Lehan's CV as a PDF, in a new tab",
    paletteHint: "Click a colour to repaint the doodles on this page.",
    paletteHintPaint: "Double-click a colour to mix your own.",
    mouseHint: "Left click: drawing colour. Right click: background colour.",
    tabsTipTitle: "These menus are now my website's pages",
    tabsTipText: "Click one, or press Alt + its underlined letter. The last one, Paint!, is a real canvas: draw me something!",
    closedTitle: "Paint was closed",
    closedText: "Double-click Paint on the desktop, or click here, to open the website again.",
    save: "Save & send to Lehan",
    undo: "Undo",
    redo: "Redo",
    clear: "Clear"
  };

  // The website's pages as menu-bar tabs, plus the drawing canvas at the end.
  var TABS = (SITE.pages || []).map(function (p) { return { id: p.id, label: p.label }; })
    .concat([{ id: "paint", label: Pages.TEXT.paintTab }]);
  var ROUTES = ["start"].concat(TABS.map(function (t) { return t.id; }));

  // Access letters (underlined; Alt+letter): the first letter of each label not already taken.
  // The whole label sits in one <span>: the menu items are flex boxes, and without the span the <u>
  // would become a separate flex item, so screen readers would hear "F ile" instead of "File".
  function accessKeys(items) {
    var used = {}, map = {};
    items.forEach(function (it) {
      var label = it.label, idx = -1;
      for (var i = 0; i < label.length; i++) {
        var ch = label.charAt(i).toLowerCase();
        if (/[a-z]/.test(ch) && !used[ch]) { idx = i; used[ch] = true; map[ch] = it.id; break; }
      }
      it.key = idx >= 0 ? label.charAt(idx).toLowerCase() : "";
      it.html = '<span class="pt-menu-label">' +
        (idx >= 0 ? U.esc(label.slice(0, idx)) + "<u>" + U.esc(label.charAt(idx)) + "</u>" + U.esc(label.slice(idx + 1)) : U.esc(label)) +
        "</span>";
    });
    return map;
  }
  var TAB_KEYS = accessKeys(TABS);

  // ---------- Elements ----------
  var win = document.getElementById("paint");
  var menubar = document.getElementById("pt-menubar");
  var actionbar = document.getElementById("pt-actionbar");
  var toolbox = document.getElementById("pt-toolbox");
  var workspace = document.getElementById("pt-workspace");
  var sheet = document.getElementById("pt-sheet");
  var colorbox = document.getElementById("pt-colorbox");
  var statusbar = document.getElementById("pt-status");
  var statusText, statusXY, statusSize, optionsBox, swatchFg, swatchBg, paletteHint, colorInput;

  var current = null;          // the route on screen
  var menuMode = null;         // "classic" or "tabs"
  var userAccent = null;       // a colour picked in the palette (repaints the page doodles)
  var shownTabsTip = false;
  var reduceMotion = Doodle.reducedMotion();

  // ---------- Icons (original 16 x 16 drawings) ----------
  var TOOL_ICONS = {
    "free-select": '<svg viewBox="0 0 16 16"><path d="M8 1.5 10 6l4.5.5-3.3 3.1 1.1 4.6L8 11.8l-4.3 2.4 1.1-4.6L1.5 6.5 6 6z" fill="none" stroke="#000" stroke-dasharray="1.6 1.4"/></svg>',
    select: '<svg viewBox="0 0 16 16"><rect x="2.5" y="3.5" width="11" height="9" fill="none" stroke="#000" stroke-dasharray="1.6 1.4"/></svg>',
    eraser: '<svg viewBox="0 0 16 16"><g transform="rotate(-35 8 8)"><rect x="1.5" y="5" width="13" height="6.5" fill="#fff" stroke="#000"/><rect x="1.5" y="5" width="5.5" height="6.5" fill="#ff8a8a" stroke="#000"/></g></svg>',
    fill: '<svg viewBox="0 0 16 16"><g transform="rotate(-40 7 9)"><path d="M2.5 6.5h8.5v7.5H2.5z" fill="#e6e6e6" stroke="#000"/><ellipse cx="6.75" cy="6.5" rx="4.25" ry="1.4" fill="#0000ff" stroke="#000"/></g><path d="M12 4.6c1.6.8 2.7 2.7 2.4 5.6" fill="none" stroke="#0000ff" stroke-width="2" stroke-linecap="round"/></svg>',
    picker: '<svg viewBox="0 0 16 16"><path d="M2 14.5 2.4 12l6.9-6.9 1.6 1.6L4 13.6z" fill="#fff" stroke="#000"/><path d="m9 4.1 3-3a1.7 1.7 0 0 1 2.4 2.4l-3 3z" fill="#000"/><path d="m8.4 4.2 3.4 3.4" stroke="#000" stroke-width="1.6"/></svg>',
    magnifier: '<svg viewBox="0 0 16 16"><circle cx="6.5" cy="6.5" r="4.3" fill="#d6efff" stroke="#000" stroke-width="1.3"/><path d="m9.7 9.7 4.6 4.6" stroke="#000" stroke-width="2.4" stroke-linecap="round"/></svg>',
    pencil: '<svg viewBox="0 0 16 16"><path d="m2.5 13.5 1-3.6 7.7-7.7 2.6 2.6-7.7 7.7z" fill="#ffd200" stroke="#000"/><path d="m2.5 13.5 1-3.6 2.6 2.6z" fill="#f2c48d" stroke="#000" stroke-linejoin="round"/><path d="m2.5 13.5.5-1.9 1.4 1.4z" fill="#000"/><path d="m9.9 3.5 2.6 2.6" stroke="#000"/></svg>',
    brush: '<svg viewBox="0 0 16 16"><path d="m13.6 1.4 1 1-5.3 5.6-1.3-1.3z" fill="#c8823c" stroke="#000" stroke-width=".9"/><path d="m8 6.7 1.3 1.3-1 1.1-1.4-1.4z" fill="#bdbdbd" stroke="#000" stroke-width=".9"/><path d="m6.9 7.7 1.4 1.4c-.4 2.6-2.8 4.6-6.3 5.3.4-3.3 2.2-5.6 4.9-6.7z" fill="#000"/></svg>',
    airbrush: '<svg viewBox="0 0 16 16"><rect x="7.5" y="6" width="6" height="9" rx="1" fill="#bdbdbd" stroke="#000"/><rect x="9" y="3.3" width="3" height="2.7" fill="#000"/><path d="M9 4.3H7.4" stroke="#000"/><g fill="#0000ff"><rect x="1.5" y="1.5" width="1.3" height="1.3"/><rect x="4.2" y="3" width="1.3" height="1.3"/><rect x="1.8" y="4.8" width="1.3" height="1.3"/><rect x="4.8" y="6" width="1.3" height="1.3"/><rect x="2.4" y="7.6" width="1.3" height="1.3"/><rect x="5.5" y="1.2" width="1.3" height="1.3"/></g></svg>',
    text: '<svg viewBox="0 0 16 16"><path d="M7 1.5h2.2l3.9 11.2h1.4V14h-4.6v-1.3h1.3l-.9-2.6H5.6l-.9 2.6H6V14H1.5v-1.3h1.4zm-1 7.2h3.9L8 3.6z" fill="#000"/></svg>',
    line: '<svg viewBox="0 0 16 16"><path d="m3 3 10 10" stroke="#000" stroke-width="1.5"/></svg>',
    curve: '<svg viewBox="0 0 16 16"><path d="M9.5 2.2C4.5 3.6 12.5 7.6 7.4 9.4s-.8 4 2.6 4.4" fill="none" stroke="#000" stroke-width="1.4"/></svg>',
    rect: '<svg viewBox="0 0 16 16"><rect x="2.5" y="4.5" width="11" height="7" fill="none" stroke="#000"/></svg>',
    polygon: '<svg viewBox="0 0 16 16"><path d="M5.5 3.5h7l-2.2 4.2 3.2 4.8h-11z" fill="none" stroke="#000" stroke-linejoin="round"/></svg>',
    ellipse: '<svg viewBox="0 0 16 16"><ellipse cx="8" cy="8" rx="5.6" ry="3.6" fill="none" stroke="#000"/></svg>',
    roundrect: '<svg viewBox="0 0 16 16"><rect x="2.5" y="4.5" width="11" height="7" rx="2.6" fill="none" stroke="#000"/></svg>'
  };
  var ACT_ICONS = {
    save: '<svg viewBox="0 0 16 16"><path d="M1.5 1.5h11l2 2v11h-13z" fill="#3b5cc4" stroke="#000"/><rect x="4" y="1.5" width="7" height="5" fill="#fff" stroke="#000"/><rect x="8.5" y="2.5" width="1.5" height="3" fill="#000"/><rect x="3.5" y="9" width="9" height="5.5" fill="#e6e6e6" stroke="#000"/></svg>',
    undo: '<svg viewBox="0 0 16 16"><path d="M5 3 1.5 6.5 5 10" fill="none" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/><path d="M2 6.5h7a4.5 4.5 0 0 1 0 9H6" fill="none" stroke="#000" stroke-width="1.8"/></svg>',
    redo: '<svg viewBox="0 0 16 16"><path d="M11 3l3.5 3.5L11 10" fill="none" stroke="#000" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 6.5H7a4.5 4.5 0 0 0 0 9h3" fill="none" stroke="#000" stroke-width="1.8"/></svg>',
    clear: '<svg viewBox="0 0 16 16"><path d="M2.5 1.5h7l4 4v9h-11z" fill="#fff" stroke="#000"/><path d="M9.5 1.5v4h4" fill="none" stroke="#000"/><path d="m11.5 9 1 2 2 .5-2 .5-1 2-1-2-2-.5 2-.5z" fill="#ffd200" stroke="#000" stroke-width=".6"/></svg>'
  };
  var PAINT_TAB_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m2.5 13.5 1-3.6 7.7-7.7 2.6 2.6-7.7 7.7z" fill="#ffd200" stroke="#000"/><path d="m2.5 13.5 1-3.6 2.6 2.6z" fill="#f2c48d" stroke="#000" stroke-linejoin="round"/><path d="m2.5 13.5.5-1.9 1.4 1.4z" fill="#000"/></svg>';

  // The 28 colours of Paint's colour box (row 1, then row 2).
  var PALETTE = [
    ["#000000", "Black"], ["#808080", "Grey"], ["#800000", "Maroon"], ["#808000", "Olive"], ["#008000", "Green"],
    ["#008080", "Teal"], ["#000080", "Navy"], ["#800080", "Purple"], ["#808040", "Khaki"], ["#004040", "Dark teal"],
    ["#0080ff", "Azure"], ["#004080", "Dark blue"], ["#8000ff", "Violet"], ["#804000", "Brown"],
    ["#ffffff", "White"], ["#c0c0c0", "Silver"], ["#ff0000", "Red"], ["#ffff00", "Yellow"], ["#00ff00", "Lime"],
    ["#00ffff", "Cyan"], ["#0000ff", "Blue"], ["#ff00ff", "Magenta"], ["#ffff80", "Light yellow"], ["#00ff80", "Spring green"],
    ["#80ffff", "Light cyan"], ["#8080ff", "Periwinkle"], ["#ff0080", "Rose"], ["#ff8040", "Orange"]
  ];

  // ---------- Desktop icons ----------
  function buildDesktop() {
    var items = [
      { icon: "globe", label: "Classic website", href: U.url("classic/index.html") },
      { icon: "cv", label: "My CV.pdf", href: U.url(LINKS.cv), blank: true },
      { icon: "camera", label: "Photography", href: LINKS.photography, blank: true },
      { icon: "notepad", label: "Blog", href: LINKS.blog, blank: true },
      { icon: "paint", label: "Paint", open: "paint" },
      { icon: "home", label: "Start page", href: U.url("index.html") },
      { icon: "recycle", label: "Recycle Bin", id: "pt-recycle" }
    ];
    document.getElementById("pt-desktop-icons").innerHTML = items.map(function (it) {
      var inner = XP.icon(it.icon) + "<span>" + U.esc(it.label) + "</span>";
      if (it.href) {
        return '<a class="xp-icon" href="' + U.esc(it.href) + '"' + (it.blank ? ' target="_blank" rel="noopener"' : "") + ">" + inner + "</a>";
      }
      return '<button type="button" class="xp-icon"' + (it.open ? ' data-open="' + it.open + '"' : "") + (it.id ? ' id="' + it.id + '"' : "") + ">" + inner + "</button>";
    }).join("");
  }

  // ---------- Status bar ----------
  function buildStatus() {
    statusbar.innerHTML = '<span class="pt-status-text"></span><span class="pt-status-xy" aria-hidden="true"></span><span class="pt-status-size" aria-hidden="true"></span>';
    statusText = statusbar.children[0];
    statusXY = statusbar.children[1];
    statusSize = statusbar.children[2];
  }
  function setStatus(text) { statusText.textContent = text == null ? restingStatus() : text; }
  function restingStatus() { return (current && TEXT.status[current]) || TEXT.statusHelp; }
  function showSheetSize() {
    if (current === "paint") return;
    statusSize.textContent = sheet.offsetWidth + "x" + sheet.offsetHeight;
  }

  // ---------- Menu bar ----------
  // Before Start: Paint's own menus. Each item: { label, key (shortcut text), act, disabled, check }.
  var view = { toolbox: true, colorbox: true, status: true };
  var MENUS = [
    { id: "file", label: "File", items: [
      { label: "New", key: "Ctrl+N", act: function () { go("start"); } },
      { label: "Open lehanzhang.com...", key: "Ctrl+O", act: function () { go("home"); } },
      "-",
      { label: "Print my CV (PDF)...", act: function () { window.open(U.url(LINKS.cv), "_blank", "noopener"); } },
      { label: "Classic website", act: function () { location.href = U.url("classic/index.html"); } },
      "-",
      { label: "Exit", act: function () { location.href = U.url("index.html"); } }
    ] },
    { id: "edit", label: "Edit", items: [
      { label: "Undo", key: "Ctrl+Z", disabled: true },
      { label: "Repeat", key: "Ctrl+Y", disabled: true },
      "-",
      { label: "Cut", key: "Ctrl+X", disabled: true },
      { label: "Copy", key: "Ctrl+C", disabled: true },
      { label: "Paste", key: "Ctrl+V", disabled: true },
      "-",
      { label: "Select All", key: "Ctrl+A", disabled: true }
    ] },
    { id: "view", label: "View", items: [
      { label: "Tool Box", key: "Ctrl+T", check: "toolbox", act: function () { toggleView("toolbox"); } },
      { label: "Color Box", key: "Ctrl+L", check: "colorbox", act: function () { toggleView("colorbox"); } },
      { label: "Status Bar", check: "status", act: function () { toggleView("status"); } },
      "-",
      { label: "Classic website (text only)", act: function () { location.href = U.url("classic/index.html"); } }
    ] },
    { id: "image", label: "Image", items: [
      { label: "Flip/Rotate...", key: "Ctrl+R", act: function () { sheet.classList.toggle("is-flipped"); } },
      { label: "Invert Colors", key: "Ctrl+I", act: function () { sheet.classList.toggle("is-inverted"); } },
      "-",
      { label: "Clear Image", key: "Ctrl+Shft+N", disabled: true }
    ] },
    { id: "colors", label: "Colors", items: [
      { label: "Edit Colors...", act: function () { editColor(null); } }
    ] },
    { id: "help", label: "Help", items: [
      { label: "Help Topics", act: showHelp },
      "-",
      { label: "About Paint", act: showAbout }
    ] }
  ];
  var MENU_KEYS = accessKeys(MENUS);
  var openMenuId = null, dropdown = null;

  // The menu bar holds (a) before Start, Paint's menus in a role="menubar" group (one Tab stop; the
  // arrow keys move between the menus), or after Start, the website's pages in a <nav>; and (b) at its
  // right end, one-click links to the classic website and the CV PDF. Before Start those two links sit
  // outside the menubar group (a menubar may only contain menu items); after Start they are part of the
  // page navigation. The bar wraps onto a second row when it is too narrow, like a real Windows menu bar.
  function endLinks() {
    return '<div class="pt-menubar-end">' +
      '<a class="pt-menu pt-end-link pt-classic-link" href="' + U.esc(U.url("classic/index.html")) + '" title="' + U.esc(TEXT.classicTip) + '">' +
        XP.icon("globe") + "<span>" + U.esc(TEXT.classic) + "</span></a>" +
      (LINKS.scholar ? '<a class="pt-menu pt-end-link pt-scholar-link" ' + U.linkAttrs(LINKS.scholar) + ' title="' + U.esc(TEXT.scholarTip) + '">' +
        XP.icon("scholar") + '<span><span class="pt-end-long">' + U.esc(TEXT.scholarFirst) + " </span>" + U.esc(TEXT.scholar) + "</span></a>" : "") +
      (LINKS.cv ? '<a class="pt-menu pt-end-link pt-cv-link" href="' + U.esc(U.url(LINKS.cv)) + '" target="_blank" rel="noopener" title="' + U.esc(TEXT.cvPdfTip) + '">' +
        XP.icon("cv") + "<span>" + U.esc(TEXT.cvPdf) + "</span></a>" : "") +
      "</div>";
  }

  function buildMenubar(mode, animate) {
    menuMode = mode;
    closeMenu();
    var html = "";
    menubar.removeAttribute("role");
    menubar.removeAttribute("aria-label");
    if (mode === "classic") {
      html = '<div class="pt-menus" role="menubar" aria-label="Paint menus">' +
        MENUS.map(function (m, i) {
          return '<button type="button" class="pt-menu" data-menu="' + m.id + '" aria-haspopup="menu" aria-expanded="false" role="menuitem"' +
            ' tabindex="' + (i ? -1 : 0) + '"' +
            (m.key ? ' aria-keyshortcuts="Alt+' + m.key.toUpperCase() + '"' : "") + ">" + m.html + "</button>";
        }).join("") + "</div>" + endLinks();
    } else {
      html = '<nav class="pt-tabs' + (animate && !reduceMotion ? " pt-tabs-anim" : "") + '" aria-label="Website pages">' +
        TABS.map(function (t, i) {
          return '<a class="pt-menu pt-tab' + (t.id === "paint" ? " pt-tab--paint" : "") + '" href="#' + t.id + '" data-tab="' + t.id + '"' +
            (t.key ? ' aria-keyshortcuts="Alt+' + t.key.toUpperCase() + '"' : "") + ' style="animation-delay:' + (i * 55) + 'ms">' +
            (t.id === "paint" ? PAINT_TAB_ICON : "") + t.html + "</a>";
        }).join("") + endLinks() + "</nav>";
    }
    menubar.innerHTML = html;
  }

  // Roving tabindex in the menubar group: the menu last focused is its one Tab stop.
  function rove(btn) {
    var items = menubar.querySelectorAll('[role="menubar"] .pt-menu');
    for (var i = 0; i < items.length; i++) items[i].tabIndex = items[i] === btn ? 0 : -1;
  }

  function markTab(id) {
    var tabs = menubar.querySelectorAll(".pt-tab");
    for (var i = 0; i < tabs.length; i++) {
      var on = tabs[i].getAttribute("data-tab") === id;
      if (on) tabs[i].setAttribute("aria-current", "page"); else tabs[i].removeAttribute("aria-current");
      if (on && menubar.scrollWidth > menubar.clientWidth) {
        menubar.scrollLeft = Math.max(0, tabs[i].offsetLeft - 40);
      }
    }
  }

  // Drop-down menus (classic mode).
  function openMenu(id, focusFirst) {
    closeMenu();
    var m = MENUS.filter(function (x) { return x.id === id; })[0];
    var btn = menubar.querySelector('[data-menu="' + id + '"]');
    if (!m || !btn) return;
    openMenuId = id;
    btn.setAttribute("aria-expanded", "true");
    dropdown = document.createElement("div");
    dropdown.className = "pt-dropdown";
    dropdown.setAttribute("role", "menu");
    dropdown.setAttribute("aria-label", m.label);
    dropdown.innerHTML = m.items.map(function (it, i) {
      if (it === "-") return '<hr role="separator">';
      var role = it.check ? "menuitemcheckbox" : "menuitem";
      return '<button type="button" role="' + role + '" data-i="' + i + '" tabindex="-1"' +
        (it.disabled ? ' aria-disabled="true"' : "") +
        (it.check ? ' aria-checked="' + !!view[it.check] + '"' : "") + ">" +
        "<span>" + U.esc(it.label) + '</span><span class="pt-kbd">' + U.esc(it.key || "") + "</span></button>";
    }).join("");
    var body = win.querySelector(".pt-body");
    body.appendChild(dropdown);
    var br = btn.getBoundingClientRect(), pr = body.getBoundingClientRect();
    dropdown.style.left = Math.max(0, Math.min(br.left - pr.left, pr.width - dropdown.offsetWidth)) + "px";
    dropdown.style.top = (br.bottom - pr.top) + "px";
    dropdown.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-i]");
      if (!b || b.getAttribute("aria-disabled") === "true") return;
      var item = m.items[+b.getAttribute("data-i")];
      closeMenu();
      btn.focus();
      if (item.act) item.act();
    });
    dropdown.addEventListener("keydown", menuKeys);
    dropdown.addEventListener("mouseover", function (e) {
      var b = e.target.closest("button[data-i]");
      if (b) { b.focus(); setStatus(statusForMenuItem(m.items[+b.getAttribute("data-i")])); }
    });
    if (focusFirst) {
      var first = dropdown.querySelector("button");
      if (first) first.focus();
    }
  }
  function statusForMenuItem(item) {
    if (!item || item === "-") return null;
    return item.disabled ? "Nothing to " + item.label.toLowerCase() + " yet: the canvas is empty." : item.label.replace(/\.\.\.$/, "");
  }
  function closeMenu() {
    if (dropdown) { dropdown.remove(); dropdown = null; }
    if (openMenuId) {
      var b = menubar.querySelector('[data-menu="' + openMenuId + '"]');
      if (b) b.setAttribute("aria-expanded", "false");
    }
    openMenuId = null;
  }
  function menuKeys(e) {
    var items = Array.prototype.slice.call(dropdown.querySelectorAll("button[data-i]"));
    var i = items.indexOf(document.activeElement);
    var ids = MENUS.map(function (m) { return m.id; }), mi = ids.indexOf(openMenuId);
    if (e.key === "ArrowDown") { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); openMenu(ids[(mi + 1) % ids.length], true); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); openMenu(ids[(mi - 1 + ids.length) % ids.length], true); }
    else if (e.key === "Escape") {
      e.preventDefault(); e.stopPropagation();
      var id = openMenuId;
      closeMenu();
      var b = menubar.querySelector('[data-menu="' + id + '"]');
      if (b) b.focus();
    } else if (e.key === "Tab") closeMenu();
    else if (e.key === "Home") { e.preventDefault(); items[0].focus(); }
    else if (e.key === "End") { e.preventDefault(); items[items.length - 1].focus(); }
  }

  function toggleView(part) {
    view[part] = !view[part];
    applyView();
  }
  function applyView() {
    toolbox.hidden = !view.toolbox;
    colorbox.hidden = !view.colorbox;
    statusbar.hidden = !view.status;
  }

  // ---------- Toolbox and options box ----------
  function buildToolbox() {
    toolbox.innerHTML =
      '<div class="pt-tools" role="toolbar" aria-label="Tools" aria-orientation="vertical">' +
      Draw.TOOLS.map(function (t) {
        return '<button type="button" class="pt-tool" data-tool="' + t.id + '" aria-pressed="false" aria-label="' + U.esc(t.name) + '" title="' + U.esc(t.name) + '">' +
          TOOL_ICONS[t.id] + "</button>";
      }).join("") + "</div>" +
      '<div class="pt-options" role="group" aria-label="Tool options"></div>';
    optionsBox = toolbox.querySelector(".pt-options");
    rovingGrid(toolbox.querySelector(".pt-tools"), ".pt-tool", 2);

    toolbox.addEventListener("click", function (e) {
      var t = e.target.closest(".pt-tool");
      if (t) { pickTool(t.getAttribute("data-tool")); return; }
      var o = e.target.closest(".pt-opt");
      if (o) {
        var spec = Draw.OPTIONS[Draw.state.tool], v = spec.values[+o.getAttribute("data-v")];
        Draw.setOption(spec.key, v);
        if (current !== "paint") go("paint");
      }
    });
    toolbox.addEventListener("mouseover", function (e) {
      var t = e.target.closest(".pt-tool");
      if (t) {
        var tool = Draw.TOOLS.filter(function (x) { return x.id === t.getAttribute("data-tool"); })[0];
        setStatus(tool.help + (current === "paint" ? "" : " (Opens the Paint! tab.)"));
      }
    });
    toolbox.addEventListener("mouseleave", function () { setStatus(); });
  }

  // Keyboard: a grid of buttons is one Tab stop; the arrow keys move between its buttons.
  // cols: the number of columns, or a function returning it (the palette has fewer on narrow phones).
  function rovingGrid(container, selector, colsOrFn) {
    container.addEventListener("keydown", function (e) {
      var items = Array.prototype.slice.call(container.querySelectorAll(selector));
      var i = items.indexOf(document.activeElement), j = null;
      var cols = typeof colsOrFn === "function" ? colsOrFn() : colsOrFn;
      if (i < 0) return;
      if (e.key === "ArrowRight") j = i + 1;
      else if (e.key === "ArrowLeft") j = i - 1;
      else if (e.key === "ArrowDown") j = i + cols;
      else if (e.key === "ArrowUp") j = i - cols;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = items.length - 1;
      if (j == null) return;
      e.preventDefault();
      j = Math.max(0, Math.min(items.length - 1, j));
      items.forEach(function (it, k) { it.tabIndex = k === j ? 0 : -1; });
      items[j].focus();
    });
  }

  // Choosing a tool on any page opens the Paint! tab with that tool ready.
  function pickTool(id) {
    Draw.setTool(id);
    if (current !== "paint") go("paint");
  }

  function syncToolbox() {
    var s = Draw.state;
    var btns = toolbox.querySelectorAll(".pt-tool");
    var focusInside = toolbox.contains(document.activeElement);
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute("data-tool") === s.tool;
      btns[i].setAttribute("aria-pressed", String(on));
      if (!focusInside) btns[i].tabIndex = on ? 0 : -1;      // the selected tool is the Tab stop
    }
    var spec = Draw.OPTIONS[s.tool];
    var key = spec ? s.tool + ":" + JSON.stringify(s[spec.key]) + ":" + s.fg + s.bg : "none";
    if (optionsBox._key === key) return;
    optionsBox._key = key;
    if (!spec) { optionsBox.innerHTML = ""; return; }
    optionsBox.innerHTML = spec.values.map(function (v, i) {
      var on = s[spec.key] === v;
      return '<button type="button" class="pt-opt ' + optionClass(s.tool) + '" data-v="' + i + '" aria-pressed="' + on + '" aria-label="' + U.esc(optionLabel(s.tool, v)) + '" title="' + U.esc(optionLabel(s.tool, v)) + '">' + optionPreview(s.tool, v) + "</button>";
    }).join("");
  }

  function optionClass(tool) {
    if (tool === "brush") return "pt-opt--cell";
    if (tool === "magnifier") return "pt-opt--zoom";
    if (/^(rect|ellipse|polygon|roundrect|select|free-select|airbrush|text)$/.test(tool)) return "pt-opt--fill";
    return "pt-opt--row";
  }
  function optionLabel(tool, v) {
    var spec = Draw.OPTIONS[tool];
    if (spec.key === "fill") return { outline: "Outline only", both: "Outline, filled with the background colour", fill: "Filled, no outline" }[v];
    if (spec.key === "transparent") return v ? "Transparent: the background colour shows through" : "Opaque";
    if (spec.key === "zoom") return v + "x zoom";
    if (spec.key === "brush") return v.replace(":", " brush, size ");
    if (spec.key === "textSize") return "Text size " + v;
    return "Size " + v;
  }
  // Tiny pictures for the options box (currentColor turns white when the option is selected).
  function optionPreview(tool, v) {
    var spec = Draw.OPTIONS[tool], s = Draw.state;
    if (spec.key === "line") return '<svg width="34" height="10" viewBox="0 0 34 10"><rect x="0" y="' + (5 - v / 2) + '" width="34" height="' + v + '" fill="currentColor"/></svg>';
    if (spec.key === "eraser") { var e = Math.round(v / 2.7); return '<svg width="12" height="12" viewBox="0 0 12 12"><rect x="' + (6 - e / 2) + '" y="' + (6 - e / 2) + '" width="' + e + '" height="' + e + '" fill="currentColor"/></svg>'; }
    if (spec.key === "brush") {
      var p = v.split(":"), z = Math.max(1, Math.round(+p[1] / 1.25)), o = (11 - z) / 2;
      if (p[0] === "round") return '<svg width="11" height="11" viewBox="0 0 11 11"><circle cx="5.5" cy="5.5" r="' + z / 2 + '" fill="currentColor"/></svg>';
      if (p[0] === "square") return '<svg width="11" height="11" viewBox="0 0 11 11"><rect x="' + o + '" y="' + o + '" width="' + z + '" height="' + z + '" fill="currentColor"/></svg>';
      var d = p[0] === "slash" ? "M" + o + " " + (11 - o) + "L" + (11 - o) + " " + o : "M" + o + " " + o + "L" + (11 - o) + " " + (11 - o);
      return '<svg width="11" height="11" viewBox="0 0 11 11"><path d="' + d + '" stroke="currentColor" stroke-width="1.3"/></svg>';
    }
    if (spec.key === "spray") {
      var dots = "", r = v * 0.62, rnd = Doodle.rng(v);
      for (var k = 0; k < v * 1.6; k++) {
        var a = rnd() * Math.PI * 2, dd = Math.sqrt(rnd()) * r;
        dots += '<rect x="' + (21 + Math.cos(a) * dd).toFixed(1) + '" y="' + (9 + Math.sin(a) * dd).toFixed(1) + '" width="1" height="1"/>';
      }
      return '<svg width="42" height="18" viewBox="0 0 42 18" fill="currentColor">' + dots + "</svg>";
    }
    if (spec.key === "textSize") return '<span style="font:bold ' + (7 + Math.sqrt(v) * 1.4).toFixed(1) + 'px Arial,sans-serif">Aa ' + v + "</span>";
    if (spec.key === "zoom") return v + "x";
    if (spec.key === "fill") {
      var inner = v === "outline" ? '<rect x="5.5" y="4.5" width="31" height="11" fill="none" stroke="currentColor"/>'
        : v === "both" ? '<rect x="5.5" y="4.5" width="31" height="11" fill="' + s.bg + '" stroke="' + s.fg + '" stroke-width="1.6"/>'
        : '<rect x="5" y="4" width="32" height="12" fill="' + s.fg + '"/>';
      return '<svg width="42" height="20" viewBox="0 0 42 20">' + inner + "</svg>";
    }
    if (spec.key === "transparent") {
      return '<svg width="42" height="20" viewBox="0 0 42 20">' + (v ? '<rect x="9.5" y="3.5" width="23" height="13" fill="none" stroke="currentColor" stroke-dasharray="2 2"/>' : '<rect x="9.5" y="3.5" width="23" height="13" fill="#fff" stroke="currentColor"/>') +
        '<circle cx="17" cy="10" r="4" fill="#ff0000"/><path d="M22 14l4-8 4 8z" fill="#0000ff"/></svg>';
    }
    return "";
  }

  // ---------- Colour box ----------
  function buildColorbox() {
    colorbox.innerHTML =
      '<div class="pt-swatch" title="Drawing colour (front) and background colour (back)"><span class="pt-bg"></span><span class="pt-fg"></span></div>' +
      '<div class="pt-wells" role="group" aria-label="Colours">' +
      PALETTE.map(function (c, i) {
        return '<button type="button" class="pt-well" data-i="' + i + '" tabindex="' + (i ? -1 : 0) + '" style="--c:' + c[0] + '" aria-label="' + c[1] + '" title="' + c[1] + ": left click = drawing colour, right click (or Shift+Enter) = background colour, double-click = edit\"></button>";
      }).join("") + "</div>" +
      '<p class="pt-colorbox-hint"></p>' +
      '<input type="color" class="pt-colorpicker" tabindex="-1" aria-hidden="true">';
    swatchFg = colorbox.querySelector(".pt-fg");
    swatchBg = colorbox.querySelector(".pt-bg");
    paletteHint = colorbox.querySelector(".pt-colorbox-hint");
    colorInput = colorbox.querySelector(".pt-colorpicker");

    var wells = colorbox.querySelector(".pt-wells");
    rovingGrid(wells, ".pt-well", function () {
      return getComputedStyle(wells).gridTemplateColumns.split(" ").length || 14;
    });
    wells.addEventListener("click", function (e) {
      var w = e.target.closest(".pt-well");
      if (w) pickColor(+w.getAttribute("data-i"), e.shiftKey ? "bg" : "fg");
    });
    wells.addEventListener("contextmenu", function (e) {
      var w = e.target.closest(".pt-well");
      if (!w) return;
      e.preventDefault();
      pickColor(+w.getAttribute("data-i"), "bg");
    });
    wells.addEventListener("dblclick", function (e) {
      var w = e.target.closest(".pt-well");
      if (w) editColor(+w.getAttribute("data-i"));
    });
    wells.addEventListener("mouseover", function (e) {
      var w = e.target.closest(".pt-well");
      if (w) setStatus(current === "paint" || current === "start" ? TEXT.mouseHint + " " + TEXT.paletteHintPaint : TEXT.paletteHint);
    });
    wells.addEventListener("mouseleave", function () { setStatus(); });
  }

  function pickColor(i, which) {
    var hex = PALETTE[i][0];
    Draw.setColor(which, hex);
    if (which === "fg" && current !== "paint") setAccent(hex);
  }

  // Colors > Edit Colors (or double-click a colour): the browser's colour picker changes that colour.
  function editColor(i) {
    colorInput.value = i == null ? Draw.state.fg : PALETTE[i][0];
    colorInput.oninput = colorInput.onchange = function () {
      var hex = colorInput.value;
      if (i != null) {
        PALETTE[i][0] = hex;
        var w = colorbox.querySelector('.pt-well[data-i="' + i + '"]');
        w.style.setProperty("--c", hex);
      }
      Draw.setColor("fg", hex);
      if (current !== "paint") setAccent(hex);
    };
    try { colorInput.showPicker ? colorInput.showPicker() : colorInput.click(); } catch (err) { colorInput.click(); }
  }

  function syncSwatches() {
    swatchFg.style.background = Draw.state.fg;
    swatchBg.style.background = Draw.state.bg;
  }

  // The palette repaints the page doodles (card shadows, highlighter, labels). Too-light colours are
  // skipped, so the doodles never disappear on the white canvas.
  function setAccent(hex) {
    var c = parseInt(hex.slice(1), 16), r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
    if (0.2126 * r + 0.7152 * g + 0.0722 * b > 235) return;
    userAccent = hex;
    sheet.style.setProperty("--pt-accent", hex);
  }

  // ---------- Action bar (Paint! tab) ----------
  function buildActionbar() {
    actionbar.innerHTML =
      '<button type="button" class="pt-act pt-act--save" data-do="save" title="Save the drawing as a PNG and send it to Lehan (Ctrl+S)">' + ACT_ICONS.save + "<span>" + U.esc(TEXT.save) + "</span></button>" +
      '<span class="pt-act-sep" aria-hidden="true"></span>' +
      '<button type="button" class="pt-act" data-do="undo" title="Undo (Ctrl+Z)">' + ACT_ICONS.undo + "<span>" + U.esc(TEXT.undo) + "</span></button>" +
      '<button type="button" class="pt-act" data-do="redo" title="Redo (Ctrl+Y)">' + ACT_ICONS.redo + "<span>" + U.esc(TEXT.redo) + "</span></button>" +
      '<button type="button" class="pt-act" data-do="clear" title="Clear the canvas (it goes to the Recycle Bin)">' + ACT_ICONS.clear + "<span>" + U.esc(TEXT.clear) + "</span></button>" +
      '<span class="pt-act-hint">' + U.esc(TEXT.mouseHint) + "</span>";
    actionbar.addEventListener("click", function (e) {
      var b = e.target.closest("[data-do]");
      if (!b || b.disabled) return;
      var act = b.getAttribute("data-do");
      if (act === "save") Draw.save();
      else if (act === "undo") Draw.undo();
      else if (act === "redo") Draw.redo();
      else if (act === "clear") Draw.clear();
    });
  }
  function syncActions() {
    var u = actionbar.querySelector('[data-do="undo"]'), r = actionbar.querySelector('[data-do="redo"]');
    if (u) u.disabled = !Draw.canUndo();
    if (r) r.disabled = !Draw.canRedo();
  }

  // ---------- Routing ----------
  // The hash is "#page" or "#page/dialog" (dialog: "abstract-N" on Research, or "about").
  // "#about" alone opens the about dialog over the screen already showing (the start screen on load).
  function parseHash() {
    var h = (location.hash || "").replace(/^#/, "").toLowerCase();
    var parts = h.split("/"), route = parts[0], sub = parts.slice(1).join("/");
    if (route === "about" && !sub) { route = current || "start"; sub = "about"; }
    if (ROUTES.indexOf(route) < 0) { route = "start"; sub = ""; }
    return { route: route, sub: sub };
  }
  function routeFromHash() { return parseHash().route; }

  // Open the dialog named in the hash, then put the page's own hash back in the address (without
  // a hashchange), so a refresh or a later tab click does not open it again.
  function openFromHash(route, sub) {
    if (!sub) return;
    var m = /^abstract-(\d+)$/.exec(sub);
    if (sub === "about") XP.about();
    else if (m && route === "research") openAbstract(+m[1]);
    try { history.replaceState(null, "", "#" + route); } catch (e) { /* some browsers refuse on file:// */ }
  }

  // A paper's Abstract popup (Research page). Focus starts on OK; Esc or OK closes it and focus
  // returns to whatever opened it (XP.alert); Tab stays inside it (trapFocus below).
  function openAbstract(n, opener) {
    var a = Pages.abstract(n);
    if (!a) return false;
    U.track("paint_abstract_opened", { paper: n });
    if (opener) opener.focus();            // so focus returns to the button when the popup closes
    XP.alert({ title: a.title, icon: "research", html: a.html, buttons: [Pages.TEXT.abstractOk] });
    var modals = document.querySelectorAll(".xp-modal");
    var box = modals.length ? modals[modals.length - 1].querySelector(".xp-dialog") : null;
    if (box) box.classList.add("pt-abs-dialog");   // wider, with a scrolling text box (paint.css §14)
    return true;
  }
  function go(id) {
    if (ROUTES.indexOf(id) < 0) id = "start";
    if (routeFromHash() === id && current === id) { show(id); return; }
    location.hash = id;                              // -> hashchange -> show()
  }

  function show(id) {
    var prev = current;
    if (prev === "paint" && id !== "paint") Draw.unmount();
    if (prev !== id) U.track("paint_page_opened", { page: id });
    current = id;
    win.setAttribute("data-route", id);
    closeMenu();
    var oldTip = win.querySelector(".pt-tip");          // the menu-bar tip belongs to the page it opened on
    if (oldTip) oldTip.remove();
    if (win.hidden || win.classList.contains("is-minimized")) XP.open(win);

    var site = id !== "start";
    XP.setTitle(win, site ? TEXT.titleSite : TEXT.titleStart);
    document.title = site ? labelOf(id) + " · " + TEXT.docTitle : TEXT.docTitle;
    if (menuMode !== (site ? "tabs" : "classic")) buildMenubar(site ? "tabs" : "classic", prev !== null);
    if (site) { markTab(id); view = { toolbox: true, colorbox: true, status: true }; applyView(); }
    sheet.classList.remove("is-flipped", "is-inverted");

    if (id === "paint") {
      actionbar.hidden = false;
      Draw.mount(sheet);
      // A heading for screen readers (the canvas has no visible title), named like the "Next page" link.
      sheet.insertAdjacentHTML("afterbegin", '<h1 class="pt-sr" tabindex="-1">' + U.esc(Pages.TEXT.nextPaint) + "</h1>");
      sheet.style.removeProperty("--pt-accent");
    } else {
      actionbar.hidden = true;
      sheet.classList.remove("is-bitmap");
      sheet.innerHTML = Pages.html(id) +
        '<span class="pt-handle pt-handle--e" aria-hidden="true"></span><span class="pt-handle pt-handle--s" aria-hidden="true"></span><span class="pt-handle pt-handle--se" aria-hidden="true"></span>';
      sheet.style.setProperty("--pt-accent", userAccent || Pages.accent(id));
    }
    workspace.scrollTop = 0;
    workspace.scrollLeft = 0;
    if (prev !== null && !reduceMotion) {
      sheet.classList.remove("is-entering");
      void sheet.offsetWidth;                        // restart the animation
      sheet.classList.add("is-entering");
    }
    if (id === "start") Doodle.startBoiling(); else Doodle.stopBoiling();
    attract();

    paletteHint.textContent = id === "paint" ? TEXT.paletteHintPaint : (id === "start" ? "" : TEXT.paletteHint);
    statusXY.textContent = "";
    setStatus();
    syncAll();
    showSheetSize();

    // Move keyboard focus to the new page's title (not on the first load).
    if (prev !== null && id !== "paint") {
      var h = sheet.querySelector("h1[tabindex]");
      if (h) { try { h.focus({ preventScroll: true }); } catch (e) { h.focus(); } }
    }
    if (prev === "start" && site && !shownTabsTip) showTabsTip();
  }

  function labelOf(id) {
    var t = TABS.filter(function (x) { return x.id === id; })[0];
    return t ? t.label : id;
  }

  function syncAll() {
    syncToolbox();
    syncSwatches();
    syncActions();
  }

  // ---------- Attention animations ----------
  // The start button's wobble and "boiling" lines, and the Enter key's bob, draw the eye when a screen
  // opens. They stop after 5 seconds, or at the visitor's first click or key press, whichever comes
  // first (WCAG 2.2.2): class "pt-still" on the window stops the CSS animations (paint.css §9-10).
  // With reduced motion they never start (paint.css §16, Doodle.startBoiling).
  var ATTRACT_MS = 5000, stillTimer = null;
  function attract() {
    clearTimeout(stillTimer);
    win.classList.remove("pt-still");
    stillTimer = setTimeout(settle, ATTRACT_MS);
  }
  function settle() {
    clearTimeout(stillTimer);
    win.classList.add("pt-still");
    Doodle.stopBoiling();
  }
  function settleOnInput() { if (!win.classList.contains("pt-still")) settle(); }
  document.addEventListener("pointerdown", settleOnInput, true);
  document.addEventListener("keydown", settleOnInput, true);

  // ---------- Start, Enter, and other clicks on the canvas ----------
  function pressStart(btn, e) {
    if (!btn || btn.classList.contains("is-pressed")) return;
    btn.classList.add("is-pressed");
    XP.closeBalloon();                               // the welcome tip has done its job
    if (reduceMotion) { go("home"); return; }
    // A Paint-bucket flash spreads from the click, then the website opens.
    var r = sheet.getBoundingClientRect();
    var x = e && e.clientX ? e.clientX - r.left : r.width / 2, y = e && e.clientY ? e.clientY - r.top : r.height / 2;
    var flash = document.createElement("div");
    flash.className = "pt-fillflash";
    flash.style.setProperty("--fx", x + "px");
    flash.style.setProperty("--fy", y + "px");
    flash.style.setProperty("--pt-flash", getComputedStyle(btn).getPropertyValue("--pt-sb-fill") || "#ffff00");
    sheet.appendChild(flash);
    setTimeout(function () { go("home"); }, 330);
  }

  function pressEnter(btn) {
    var next = TABS[1] ? TABS[1].id : "paint";      // the page after Home
    if (!btn || reduceMotion) { go(next); return; }
    btn.classList.add("is-pressed");
    setTimeout(function () { go(next); }, 170);
  }

  // Each hover on the start button "bucket-fills" it with the next colour.
  var startFills = ["#ffff00", "#80ffff", "#00ff80", "#ff8040", "#ffff80"], fillIndex = 0;

  function bindSheet() {
    sheet.addEventListener("click", function (e) {
      var a = e.target.closest("[data-act]");
      if (a) {
        var act = a.getAttribute("data-act");
        if (act === "start") pressStart(a, e);
        else if (act === "enter") pressEnter(a);
        else if (act === "abstract") openAbstract(+a.getAttribute("data-paper"), a);
        return;
      }
      var j = e.target.closest("[data-jump]");
      if (j) {
        var target = document.getElementById(j.getAttribute("data-jump"));
        if (target) {
          workspace.scrollTop = target.offsetTop - 10;
          try { target.focus({ preventScroll: true }); } catch (err) { target.focus(); }
        }
      }
    });
    sheet.addEventListener("pointerover", function (e) {
      var sb = e.target.closest(".pt-startbtn");
      if (sb && !sb.contains(e.relatedTarget)) {
        fillIndex = (fillIndex + 1) % startFills.length;
        sb.style.setProperty("--pt-sb-fill", startFills[fillIndex]);
      }
      var a = e.target.closest("a[href]");
      if (a) setStatus(linkStatus(a));
      else if (e.target.closest(".pt-startbtn")) setStatus("Click start to open Lehan's website.");
      else if (e.target.closest(".pt-enter")) setStatus("Enter: continue to " + labelOf(TABS[1] ? TABS[1].id : "paint") + ".");
    });
    sheet.addEventListener("pointerout", function (e) {
      if (e.target.closest("a[href], .pt-startbtn, .pt-enter")) setStatus();
    });
    // Live cursor coordinates over the canvas, as in Paint (draw.js reports them on the Paint! tab).
    workspace.addEventListener("pointermove", function (e) {
      if (current === "paint") return;
      var r = sheet.getBoundingClientRect();
      var x = Math.floor(e.clientX - r.left), y = Math.floor(e.clientY - r.top);
      statusXY.textContent = x >= 0 && y >= 0 && x < r.width && y < r.height ? x + "," + y : "";
    });
    workspace.addEventListener("pointerleave", function () { if (current !== "paint") statusXY.textContent = ""; });
  }

  function linkStatus(a) {
    var href = a.getAttribute("href") || "";
    if (href.charAt(0) === "#") return "Opens the " + labelOf(href.slice(1)) + " page.";
    if (/^mailto:/i.test(href)) return "Email " + href.slice(7);
    return a.href;
  }

  // ---------- Tips, help, about ----------
  function showTabsTip() {
    shownTabsTip = true;
    var tip = document.createElement("div");
    tip.className = "pt-tip";
    tip.setAttribute("role", "status");
    tip.innerHTML = "<b>" + U.esc(TEXT.tabsTipTitle) + "</b>" + U.esc(TEXT.tabsTipText) +
      '<button type="button" class="pt-tip-x" aria-label="Close tip">&times;</button>';
    tip.style.top = (menubar.offsetHeight + 9) + "px";     // just under the menu bar (it wraps on phones)
    win.querySelector(".pt-body").appendChild(tip);
    function close() { if (tip.parentNode) tip.remove(); }
    tip.querySelector(".pt-tip-x").addEventListener("click", close);
    menubar.addEventListener("click", close, { once: true });
    setTimeout(close, 9000);
  }

  function helpHtml() {
    var labels = TABS.map(function (t) { return "<b>" + U.esc(t.label) + "</b>"; });
    return "<p><b>Getting around this website</b></p>" +
      "<p>Click the big hand-drawn <b>start</b> button. Paint's menu bar then holds the website's pages: " +
      labels.slice(0, -1).join(", ") + ", and " + labels[labels.length - 1] + ", a real canvas: draw something and press Save to send it to Lehan.</p>" +
      "<p>Keyboard: Alt + the underlined letter opens a page. On the canvas, Ctrl+Z undoes and Ctrl+S saves.</p>" +
      '<p>Prefer plain text? Open the <a href="' + U.esc(U.url("classic/index.html")) + '">classic website</a>, or the <a href="' +
      U.esc(U.url(LINKS.cv)) + '" target="_blank" rel="noopener">CV as a PDF</a>.</p>';
  }
  function showHelp() { XP.alert({ title: "Help and Support Center", icon: "help", html: helpHtml(), buttons: ["OK"] }); }
  // Lehan's few words on why this version is Paint (Pages.TEXT.aboutText).
  function aboutHtml() { return "<p>" + U.esc(Pages.TEXT.aboutText) + "</p>"; }
  // Help > About Paint (the menus before Start): the same words, plus the credits.
  function showAbout() {
    XP.alert({
      title: "About Paint", icon: "paint", buttons: ["OK"],
      html: "<p><b>Paint</b>, lehanzhang.com edition</p>" + aboutHtml() +
        "<p>A homage to Paint on Windows XP, redrawn from scratch in HTML, CSS and JavaScript for " + U.esc(P.name || "") +
        "'s website. Not affiliated with Microsoft.</p>"
    });
  }

  // The XP welcome balloon: once per browser (first visit), worded for the screen it opens on.
  function firstBalloon() {
    var seen = false;
    try { seen = localStorage.getItem("lz-paint-tip") === "1"; localStorage.setItem("lz-paint-tip", "1"); } catch (e) { /* private mode */ }
    if (seen) return null;
    var r = routeFromHash();
    if (r === "start") {
      return { route: r, title: "Welcome to lehanzhang.com!", delay: 1300, timeout: 12000,
        text: "Click the big hand-drawn start button in Paint to open my website. Prefer plain text? Open the Classic website from the desktop or the start menu.",
        onClick: function () { if (current === "start") go("home"); } };
    }
    if (r === "paint") {
      return { route: r, title: "Draw me something!", delay: 1300, timeout: 12000,
        text: "Pick a tool on the left and a colour at the bottom, draw on the canvas, then press Save to send it to me." };
    }
    return { route: r, title: "You are in MS Paint", delay: 1300, timeout: 12000,
      text: "The menu bar holds my website's pages. The last one, Paint!, is a real canvas: draw me something." };
  }

  // ---------- Keyboard ----------
  // An open dialog (XP.alert) keeps keyboard focus: Tab and Shift+Tab cycle through its controls
  // instead of wandering onto the page behind it.
  function trapFocus(e) {
    if (e.key !== "Tab") return;
    var modals = document.querySelectorAll(".xp-modal");
    if (!modals.length) return;
    var box = modals[modals.length - 1];
    var items = Array.prototype.filter.call(
      box.querySelectorAll("a[href], button, input, textarea, select, [tabindex]"),
      function (el) { return el.tabIndex >= 0 && !el.disabled && el.getClientRects().length > 0; });
    if (!items.length) return;
    var i = items.indexOf(document.activeElement);
    if (i < 0) { e.preventDefault(); items[e.shiftKey ? items.length - 1 : 0].focus(); }
    else if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
  }

  function bindKeys() {
    document.addEventListener("keydown", trapFocus, true);
    document.addEventListener("keydown", function (e) {
      if (document.querySelector(".xp-modal")) return;
      var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      // Alt + underlined letter: a page (after Start) or a menu (before Start).
      if (e.altKey && !e.ctrlKey && !e.metaKey && !typing) {
        var k = e.code && /^Key[A-Z]$/.test(e.code) ? e.code.slice(3).toLowerCase() : (e.key || "").toLowerCase();
        if (menuMode === "tabs" && TAB_KEYS[k]) { e.preventDefault(); go(TAB_KEYS[k]); return; }
        if (menuMode === "classic" && MENU_KEYS[k]) { e.preventDefault(); openMenu(MENU_KEYS[k], true); return; }
      }
      if (typing || e.altKey || e.ctrlKey || e.metaKey) return;
      // Enter on an empty spot: Start on the start screen, the Enter key on Home.
      var onControl = t && t.closest && t.closest("a, button, input, textarea, select, [contenteditable]");
      if (e.key === "Enter" && !onControl) {
        if (current === "start") { e.preventDefault(); pressStart(sheet.querySelector(".pt-startbtn")); }
        else if (current === "home") { e.preventDefault(); pressEnter(sheet.querySelector(".pt-enter")); }
      }
      if (e.key === "Escape" && dropdown) closeMenu();
    });
  }

  // ---------- Boot ----------
  buildDesktop();
  buildStatus();
  buildToolbox();
  buildColorbox();
  buildActionbar();
  bindSheet();
  bindKeys();

  // The welcome balloon is shown with XP.balloon() on our own timer rather than through
  // XP.init({ balloon }), so it can be skipped if it no longer fits: Start already pressed, or Paint closed.
  var welcome = firstBalloon();
  XP.init({
    version: "paint",
    onNavigate: function (pageId) { go(pageId); },
    help: helpHtml(),
    about: { title: Pages.TEXT.aboutTitle, html: aboutHtml() }    // the "i" in the tray, next to "?"
  });
  if (welcome) {
    setTimeout(function () {
      if (win.hidden || (welcome.route === "start" && current !== "start")) return;
      XP.balloon(welcome);
    }, welcome.delay);
  }

  // The start menu lists SITE.pages; add the Paint! tab after them (the shell handles data-page clicks).
  (function addPaintToStartMenu() {
    var items = document.querySelectorAll(".xp-startmenu .xp-sm-item[data-page]");
    if (!items.length) return;
    var last = items[items.length - 1];
    var b = document.createElement("button");
    b.type = "button";
    b.className = "xp-sm-item";
    b.setAttribute("data-page", "paint");
    b.innerHTML = XP.icon("paint") + "<b>" + U.esc(Pages.TEXT.paintTab) + "</b>";
    last.parentNode.insertBefore(b, last.nextSibling);
  })();

  // Menu bar: open menus on click, switch on hover while one is open (as in Windows).
  menubar.addEventListener("click", function (e) {
    var m = e.target.closest("[data-menu]");
    if (!m) return;
    var id = m.getAttribute("data-menu");
    if (openMenuId === id) closeMenu(); else openMenu(id, e.detail === 0);
  });
  menubar.addEventListener("mouseover", function (e) {
    var m = e.target.closest("[data-menu]");
    if (m && openMenuId && openMenuId !== m.getAttribute("data-menu")) openMenu(m.getAttribute("data-menu"), false);
    var tab = e.target.closest(".pt-tab");
    if (tab) setStatus("Opens the " + labelOf(tab.getAttribute("data-tab")) + " page.");
    else if (e.target.closest(".pt-classic-link")) setStatus(TEXT.classicTip + ".");
    else if (e.target.closest(".pt-scholar-link")) setStatus(TEXT.scholarTip + ".");
    else if (e.target.closest(".pt-cv-link")) setStatus(TEXT.cvPdfTip + ".");
  });
  menubar.addEventListener("mouseleave", function () { if (!openMenuId) setStatus(); });
  menubar.addEventListener("keydown", function (e) {
    var m = e.target.closest("[data-menu]");
    if (m && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) { e.preventDefault(); openMenu(m.getAttribute("data-menu"), true); return; }
    // Arrow keys move between the menus before Start (the menubar group), and along the whole bar after Start.
    var group = e.target.closest('[role="menubar"]') || menubar;
    var all = Array.prototype.slice.call(group.querySelectorAll(".pt-menu"));
    var i = all.indexOf(document.activeElement), j = null;
    if (i < 0) return;
    if (e.key === "ArrowRight") j = (i + 1) % all.length;
    else if (e.key === "ArrowLeft") j = (i - 1 + all.length) % all.length;
    else if (group !== menubar && e.key === "Home") j = 0;
    else if (group !== menubar && e.key === "End") j = all.length - 1;
    if (j === null) return;
    e.preventDefault();
    all[j].focus();
  });
  menubar.addEventListener("focusin", function (e) {
    if (e.target.closest('[role="menubar"]') && e.target.classList.contains("pt-menu")) rove(e.target);
  });
  document.addEventListener("pointerdown", function (e) {
    if (dropdown && !dropdown.contains(e.target) && !e.target.closest("[data-menu]")) closeMenu();
  }, true);

  // Drawing engine -> interface.
  Draw.on("change", syncAll);
  Draw.on("status", function (s) {
    if (s.xy != null) statusXY.textContent = s.xy;
    if (s.size != null && current === "paint") statusSize.textContent = s.size;
  });

  // Desktop: the Recycle Bin can bring back the last cleared drawing.
  var bin = document.getElementById("pt-recycle");
  if (bin) {
    bin.addEventListener("xp:open", function () {
      var info = Draw.binInfo();
      if (!info) { XP.alert({ title: "Recycle Bin", icon: "recycle", text: "The Recycle Bin is empty.", buttons: ["OK"] }); return; }
      var hm = info.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      XP.alert({ title: "Recycle Bin", icon: "recycle", buttons: ["Restore", "Cancel"],
        html: "<p><b>1 item:</b> the drawing you cleared at " + U.esc(hm) + ".</p><p>Restore it to the Paint! canvas?</p>" })
        .then(function (c) { if (c === "Restore") { go("paint"); setTimeout(Draw.restoreFromBin, 0); } });
    });
  }

  // Closing Paint leaves the desktop; offer the way back (phones have no desktop icons).
  win.addEventListener("xp:close", function () {
    XP.balloon({ title: TEXT.closedTitle, text: TEXT.closedText, timeout: 0, icon: "paint", onClick: function () { XP.open(win); } });
  });
  win.addEventListener("xp:restore", function () { XP.closeBalloon(); });
  // A blank drawing canvas follows the window size (maximise, browser resize); see Draw.fit().
  var refitTimer = null;
  function refit() {
    clearTimeout(refitTimer);
    refitTimer = setTimeout(function () { if (current === "paint") Draw.fit(); showSheetSize(); }, 60);
  }
  win.addEventListener("xp:maximize", refit);
  window.addEventListener("resize", refit);
  window.addEventListener("hashchange", function () {
    var h = parseHash();
    if (!(h.sub && h.route === current)) show(h.route);   // a dialog over the page already showing: no re-render
    openFromHash(h.route, h.sub);
  });

  var first = parseHash();
  show(first.route);
  openFromHash(first.route, first.sub);
})();
