/* ==========================================================================
   fun/powerpoint/powerpoint.js — V3: Lehan's website as a PowerPoint 2007
   presentation, open on the shared Windows XP desktop.

   Loads after content.js, config.js, shared/site.js, shared/xp/xp.js,
   shared/slides/deck.js, icons.js and ribbon.js (see index.html).

   - The slides come from the shared deck: Deck.fromContent(window.SITE).
     All text is in content.js; this file only draws the app around it.
   - The ribbon, Office menu and button messages are data in ribbon.js.
   - The slide show (From Beginning, F5) fills the page above the XP taskbar.
   - Every slide has its own transition and entrance animations (which ones: PP_SLIDE_FX in
     ribbon.js; the movements: "Transitions and animations" below). They run by themselves, one
     after another; a click while they run finishes them, the next click moves on (as in PowerPoint).

   Every state has a link (the URL hash), which is also how to test it:
     #slide-3     slide 3 selected in the editor
     #show        the slide show from the beginning     #show-5   from slide 5
     #end         the black "End of slide show" screen
     #tab-home    open a ribbon tab: home, insert, design, animations,
                  slideshow, review, view
     #sorter      Slide Sorter view           #outline   Outline tab (left pane)
     #menu        the Office button menu, open
     #about       the "About this PowerPoint" box (the "i" in the taskbar tray)
     #research    any page id from content.js: that page's first slide
     #motion      animations on even if the computer asks for reduced motion
                  (for reviewing: Windows "Animation effects" off turns the pulse off).
                  Same as ?motion=on or the switch on pages.html (see shared/site.js).
   Combine with "+", for example #slide-4+tab-view or #motion+show.
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil;
  var SITE = window.SITE;
  var P = SITE.person;
  var ICONS = window.PP_ICONS;

  // ---------- Settings ----------
  var APP_NAME = "Microsoft PowerPoint";
  var DOC = P.name + ".pptx";                                   // "Lehan Zhang.pptx"
  var SHOW_TASK_TITLE = "PowerPoint Slide Show - [" + DOC + "]";
  var TIP_KEY = "pp-show-started";   // localStorage flag: the welcome balloon stops once the visitor has started a show
  var SLIDE_PX = 960;                // 100% zoom = a 960px-wide slide (10 inches at 96 dpi), as in PowerPoint

  // Desktop icons, top to bottom. href is relative to the site/ folder (or a full URL).
  var DESKTOP_ICONS = [
    { label: DOC, icon: "powerpoint", open: "pp" },
    { label: "Classic website", icon: "globe", href: "classic/index.html" },
    { label: "My CV.pdf", icon: "cv", href: P.links.cv, newTab: true },
    { label: "Photography", icon: "camera", href: P.links.photography },
    { label: "Blog", icon: "notepad", href: P.links.blog },
    { label: "Recycle Bin", icon: "recycle", say: "recycle" }
  ];

  // Help text (the "?" button, F1, the XP start menu's Help and Support) and the keys table: ribbon.js.
  var KEYS_HTML = window.PP_KEYS_HTML;
  var HELP_HTML = String(window.PP_HELP_HTML)
    .replace("{keys}", KEYS_HTML)
    .replace("{classicUrl}", U.esc(U.url("classic/index.html")));

  // No abstract slides here (Lehan: abstracts only in the Overleaf version).
  var SLIDES = Deck.fromContent(SITE);
  var N = SLIDES.length;

  // Each slide's transition and build (ribbon.js, PP_SLIDE_FX), copied so the Animations tab can
  // change them for this visit: { transition: "circle", build: [{ target: "title", effect: "swivel" }] }.
  var FX = SLIDES.map(function (s) {
    var all = window.PP_SLIDE_FX || {};
    var d = all[s.id] || all["*"] || {};
    return { transition: d.transition || "none", build: (d.build || []).slice() };
  });

  // ---------- State ----------
  var state = {
    current: 0,                                         // selected slide, 0-based
    tab: window.PP_START_TAB || "slideshow",            // open ribbon tab
    view: "normal",                                     // "normal" | "sorter"
    pane: "slides",                                     // "slides" | "outline"
    zoom: 0,                                            // 0 = fit to window, else percent
    hashReady: false                                    // write #slide-N only after the visitor acts
  };

  // ---------- Elements ----------
  function $(id) { return document.getElementById(id); }
  var desktop = document.querySelector(".xp-desktop");
  var win = $("pp");
  var orb = $("pp-orb"), qat = $("pp-qat"), omenu = $("pp-omenu");
  var tabsEl = $("pp-tabs"), ribbonEl = $("pp-ribbon");
  var sideEl = $("pp-side"), splitEl = $("pp-split"), thumbsEl = $("pp-thumbs"), outlineEl = $("pp-outline");
  var thumbsPanel = $("pp-thumbs-panel");   // the Slides tab's panel, round the list of thumbnails
  var editEl = $("pp-edit"), stage = $("pp-stage"), frame = $("pp-frame"), notesEl = $("pp-notes");
  var sorterEl = $("pp-sorter");
  var statusSlide = $("pp-st-slide"), zoomPct = $("pp-zoom-pct"), zoomRange = $("pp-zoom");
  var showEl = $("pp-show"), showStage = $("pp-show-stage"), endEl = $("pp-show-end"), blankEl = $("pp-show-blank");
  var strip = $("pp-show-strip"), countEl = $("pp-show-count"), rehearseEl = $("pp-rehearse");
  var live = $("pp-live"), tipEl = $("pp-tip");

  // ---------- Small helpers ----------
  function h(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function extend(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b) o[k] = b[k]; return o; }
  function icon(name, cls) {
    var svg = ICONS[name] || ICONS["doc-small"];
    return svg.replace("<svg ", '<svg class="' + (cls || "pp-ico") + '" aria-hidden="true" focusable="false" ');
  }
  function clamp(i) { return Math.max(0, Math.min(N - 1, i)); }
  function titleOf(i) { return U.plain(SLIDES[i].title); }
  function isSmall() { return !!(window.matchMedia && matchMedia("(max-width: 700px)").matches); }
  // Respect the visitor's "reduce motion" setting, unless class motion-on overrides it (#motion here,
  // or ?motion=on / the pages.html switch via shared/site.js).
  function reducedMotion() { return U.prefersReducedMotion(); }
  function firstSlideOf(pageId) {
    for (var i = 0; i < N; i++) if (SLIDES[i].page === pageId) return i;
    return -1;
  }
  function announce(text) { live.textContent = text; }
  function setHash(hash) {
    try { history.replaceState(null, "", "#" + hash); } catch (e) { /* file:// in an old browser: skip */ }
  }
  function tipSeen() { try { return localStorage.getItem(TIP_KEY) === "1"; } catch (e) { return false; } }
  function markTipSeen() { try { localStorage.setItem(TIP_KEY, "1"); } catch (e) { /* private mode */ } }

  // Placeholders in ribbon.js texts: {doc}, {name}, {first}, {email}, {label}, {cvFile}, {photoText}, {blogText}.
  function context(label) {
    return {
      label: label || "", doc: DOC, name: P.name, first: String(P.name).split(" ")[0], email: P.email,
      cvFile: String(P.links.cv).split("/").pop(),
      // Plain text: these end up inside buttons, where a link cannot go.
      photoText: U.plain(SITE.art.photography.description),
      blogText: U.plain(SITE.art.writing.description)
    };
  }
  function fill(str, label, asHtml) {
    var ctx = context(label);
    return String(str || "").replace(/\{(\w+)\}/g, function (all, key) {
      if (!(key in ctx)) return all;
      return asHtml ? U.esc(ctx[key]) : ctx[key];
    });
  }
  // "Slide {n}: {title}" + { n: 3, title: "Talks" } -> "Slide 3: Talks" (values HTML-escaped).
  function tmpl(str, values) {
    return String(str || "").replace(/\{(\w+)\}/g, function (all, key) {
      return key in values ? U.esc(values[key]) : all;
    });
  }

  // Small glyphs used in the chrome.
  var LAUNCHER_SVG = '<svg viewBox="0 0 9 9" aria-hidden="true"><path d="M.5 4V.5H4" fill="none" stroke="#7d97bf"/><path d="M2.5 2.5l5 5M8 4.3V8H4.3" fill="none" stroke="#3e6aaa"/></svg>';
  var CHECK_SVG = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.5l2.6 2.6L10 3" fill="none" stroke="#1e395b" stroke-width="1.8"/></svg>';

  // ======================================================================
  // Messages and commands
  // ======================================================================

  // Show one of the PP_SAY messages (ribbon.js) as an XP dialog box.
  function say(key, label) {
    var m = window.PP_SAY[key] || window.PP_SAY.generic;
    var html = m.html ? fill(m.html, label, true) : "<p>" + U.esc(fill(m.text, label)) + "</p>";
    var original = {};   // button text as shown -> as written in ribbon.js (for `then`)
    var buttons = (m.buttons || ["OK"]).map(function (b) {
      var shown = fill(b, label);
      original[shown] = b;
      return shown;
    });
    return XP.alert({
      title: fill(m.title || "Microsoft Office PowerPoint", label),
      icon: m.icon || "info",
      html: html,
      buttons: buttons
    }).then(function (choice) {
      var cmd = m.then && m.then[original[choice]];
      if (cmd) run(cmd);
      return choice;
    });
  }

  // What a button does: its command (act), its message (say), or the generic message.
  function trigger(spec, el) {
    if (spec.act) run(spec.act, el, spec);
    else say(spec.say || "generic", String(spec.label || "").replace(/\n/g, " "));
  }

  // Every command a button can name with act: "...".
  function run(cmd, el, spec) {
    var arg = "", m = /^([a-z-]+):(.*)$/.exec(cmd);
    if (m) { cmd = m[1]; arg = m[2]; }
    switch (cmd) {
      case "show-begin":     startShow(0); break;
      case "show-current":   startShow(state.current); break;
      case "show-custom":    customShowMenu(el); break;
      case "show-setup":     setupDialog(); break;
      case "rehearse":       startShow(0, { rehearse: true }); break;
      case "view-normal":    setView("normal"); break;
      case "view-sorter":    setView("sorter"); break;
      case "preview":        previewSlide(state.current, { explicit: true }); break;
      case "trans":          setTransition(arg, true); break;
      case "apply-all":      applyAll(); break;
      case "custom-anim":    customAnimDialog(); break;
      case "go":             goPage(arg); break;
      case "open":           openLink(arg); break;
      case "mail":           location.href = "mailto:" + P.email; break;
      case "spelling":       say("spelling"); break;
      case "toggle-ruler":   editEl.classList.toggle("has-ruler", !!(el && el.checked)); break;
      case "toggle-grid":    frame.classList.toggle("has-grid", !!(el && el.checked)); break;
      case "zoom-menu":      zoomMenu(el); break;
      case "zoom-fit":       setZoom(0); break;
      case "color": case "grayscale": case "bw": setColorMode(cmd); break;
      case "switch-windows": switchWindowsMenu(el); break;
      case "help":           closeOfficeMenu(); showHelp(); break;
      case "recent":         showRecent(true); break;
      case "close-window":   closeOfficeMenu(); XP.close(win); break;
      case "close-menu":     closeOfficeMenu(true); break;
      case "landing":        location.href = U.url("index.html"); break;
      case "noop":           break;
      default:               say("generic", spec && String(spec.label || "").replace(/\n/g, " "));
    }
  }

  function openLink(which) {
    var L = P.links;
    if (which === "classic") location.href = U.url("classic/index.html");
    else if (which === "cv") window.open(U.url(L.cv), "_blank", "noopener");
    else if (which === "photography") window.open(L.photography, "_blank", "noopener");
    else if (which === "blog") window.open(L.blog, "_blank", "noopener");
  }

  // Start-menu pages, "Go to ..." buttons, and #research-style links.
  function goPage(pageId) {
    var i = firstSlideOf(pageId);
    if (i < 0) return;
    if (show.on) { leaveEndScreen(); showGo(i, i >= show.i ? 1 : -1); return; }
    openWindow();
    setView("normal");
    select(i, { user: true, focus: true });
  }

  function openWindow() {
    if (win.hidden || win.classList.contains("is-minimized")) XP.restore(win);
    else XP.activate(win);
  }

  function showHelp() {
    XP.alert({ title: "Microsoft Office PowerPoint Help", icon: "help", html: HELP_HTML, buttons: ["OK"] });
  }

  function setupDialog() {
    XP.alert({
      title: "Set Up Show", icon: "powerpoint",
      html: "<p><b>Show type:</b> Presented by a speaker (full screen)<br><b>Show slides:</b> All, 1 to " + N +
        "<br><b>Advance slides:</b> Manually</p>" + KEYS_HTML,
      buttons: ["Start Show", "OK"]
    }).then(function (choice) { if (choice === "Start Show") startShow(0); });
  }

  // Apply To All: the selected slide's transition for every slide (for this visit).
  function applyAll() {
    var id = FX[state.current].transition;
    FX.forEach(function (fx) { fx.transition = id; });
    updateIndicators();
    XP.alert({ title: "Microsoft Office PowerPoint", icon: "info",
      html: tmpl(window.PP_ANIM_TEXT.applyAll, { label: transitionById(id).label }), buttons: ["OK"] });
  }

  // Custom Animation: the selected slide's transition and animations, in order, with a Play button.
  function targetLabel(i, target) {
    var T = window.PP_ANIM_TEXT.targets, s = SLIDES[i];
    if (target === "title") return T.title + " (" + titleOf(i) + ")";
    if (target === "photo") return T.photo;
    var box = (s.boxes || [])[target === "box2" ? 1 : 0];
    return box ? tmpl(T.box, { label: U.plain(box.label) }) : target;
  }
  function customAnimDialog() {
    var i = state.current, A = window.PP_ANIM_TEXT, fx = FX[i], t = transitionById(fx.transition);
    var items = fx.build.map(function (b) {
      var e = window.PP_ENTRANCES[b.effect];
      return "<li>" + U.esc(targetLabel(i, b.target)) + ": <b>" + U.esc(e ? e.label : b.effect) + "</b></li>";
    }).join("");
    var html = "<p><b>" + tmpl(A.slide, { n: i + 1, title: titleOf(i) }) + "</b></p>" +
      "<p>" + (t.id === "none" ? U.esc(A.noTransition) : tmpl(A.transition, { label: t.label, seconds: (t.ms / 1000).toFixed(2).replace(/0$/, "") })) + "</p>" +
      (items ? "<p>" + U.esc(A.list) + '</p><ol class="pp-anim-list">' + items + "</ol>" : "<p>" + U.esc(A.empty) + "</p>");
    XP.alert({ title: A.dialogTitle, icon: "powerpoint", html: html, buttons: [A.play, "OK"] })
      .then(function (choice) { if (choice === A.play) previewSlide(i, { explicit: true }); });
  }

  // ======================================================================
  // Ribbon
  // ======================================================================
  var specs = [];   // the ribbon.js object behind every command element (data-spec = index)
  function remember(el, spec) {
    el.setAttribute("data-spec", specs.length);
    if (spec.act) el.setAttribute("data-act", spec.act);
    specs.push(spec);
    return el;
  }
  function specOf(el) {
    var i = el.getAttribute("data-spec");
    return i == null ? null : specs[+i];
  }
  function tipAttrs(el, it) {
    el.setAttribute("data-tip-title", String(it.label).replace(/\n/g, " ") + (it.key ? " (" + it.key + ")" : ""));
    if (it.tip) el.setAttribute("data-tip", fill(it.tip));
    if (it.key) el.setAttribute("aria-keyshortcuts", it.key.replace("Ctrl+", "Control+"));
  }
  function arrow() { return '<span class="pp-arrow" aria-hidden="true"></span>'; }

  function buildRibbon() {
    window.PP_RIBBON.forEach(function (tab) {
      var t = h("button", {
        type: "button", role: "tab", "class": "pp-tab", id: "pp-tab-" + tab.id,
        "aria-controls": "pp-panel-" + tab.id, "aria-selected": "false", tabindex: "-1", "data-tab": tab.id
      });
      t.textContent = tab.label;
      tabsEl.appendChild(t);

      var panel = h("div", { role: "tabpanel", "class": "pp-panel", id: "pp-panel-" + tab.id, "aria-labelledby": "pp-tab-" + tab.id });
      panel.hidden = true;
      tab.groups.forEach(function (g) { panel.appendChild(buildGroup(g)); });
      ribbonEl.appendChild(panel);
    });

    tabsEl.addEventListener("click", function (e) {
      var t = e.target.closest(".pp-tab");
      if (t) selectTab(t.getAttribute("data-tab"));
    });
    tabsEl.addEventListener("keydown", function (e) {
      var tabs = Array.prototype.slice.call(tabsEl.children);
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : null;
      if (j == null) return;
      e.preventDefault();
      selectTab(tabs[(j + tabs.length) % tabs.length].getAttribute("data-tab"), true);
    });
    ribbonEl.addEventListener("click", onCommandClick);
    ribbonEl.addEventListener("change", onCheckChange);
  }

  function buildGroup(g) {
    var el = h("div", { "class": "pp-group", role: "group", "aria-label": g.label });
    if (g.hideOrder) el.setAttribute("data-hide-order", g.hideOrder);
    var body = h("div", { "class": "pp-group-body" });
    g.items.forEach(function (it) { body.appendChild(buildItem(it)); });
    el.appendChild(body);
    el.appendChild(h("div", { "class": "pp-group-label", "aria-hidden": "true" }, U.esc(g.label)));
    if (g.launcher) {
      var spec = { label: g.label + " dialog box", tip: "See more " + g.label.toLowerCase() + " options." };
      var b = h("button", { type: "button", "class": "pp-launcher", "aria-label": g.label + " options" }, LAUNCHER_SVG);
      tipAttrs(b, spec);
      el.appendChild(remember(b, spec));
    }
    return el;
  }

  function buildItem(it) {
    var col;
    switch (it.type) {
      case "big":
        return bigButton(it);
      case "stack":
        col = h("div", { "class": "pp-stack" });
        it.items.forEach(function (s) { col.appendChild(smallItem(s)); });
        return col;
      case "checks":
        col = h("div", { "class": "pp-stack pp-checks" });
        it.items.forEach(function (s) { col.appendChild(checkItem(s)); });
        return col;
      case "rows":
        return rowsItem(it);
      case "gallery":
        return gallery(it);
    }
    return h("span");
  }

  function smallItem(s) {
    if (s.type === "check") return checkItem(s);
    if (s.type === "field") return fieldItem(s);
    return smallButton(s);
  }

  function bigButton(it) {
    var label = String(it.label);
    var b = h("button", {
      type: "button", "class": "pp-btn pp-btn--big" + (it.hero ? " pp-btn--hero" : ""),
      "aria-label": label.replace(/\n/g, " ")
    }, icon(it.icon) + '<span class="pp-btn-label">' + U.esc(label).replace(/\n/g, " <br>") + (it.menu ? arrow() : "") + "</span>");
    if (it.hero) b.id = "pp-hero";
    if (it.menu) b.setAttribute("aria-haspopup", "true");
    if (it.disabled) b.disabled = true;
    tipAttrs(b, it);
    return remember(b, it);
  }

  function smallButton(it) {
    var b = h("button", { type: "button", "class": "pp-btn pp-btn--small" },
      icon(it.icon) + "<span>" + U.esc(it.label) + "</span>" + (it.menu ? arrow() : ""));
    if (it.menu) b.setAttribute("aria-haspopup", "true");
    if (it.disabled) b.disabled = true;
    tipAttrs(b, it);
    return remember(b, it);
  }

  function iconButton(it) {
    var b = h("button", { type: "button", "class": "pp-btn pp-btn--icon" + (it.menu ? " has-menu" : ""), "aria-label": it.label },
      icon(it.icon) + (it.menu ? arrow() : ""));
    if (it.disabled) b.disabled = true;
    tipAttrs(b, it);
    return remember(b, it);
  }

  var uid = 0;
  function checkItem(it) {
    var lab = h("label", { "class": "pp-check" + (it.disabled ? " is-disabled" : "") });
    var input = h("input", { type: "checkbox", id: "pp-chk-" + (++uid) });
    input.checked = !!it.checked;
    input.disabled = !!it.disabled;
    lab.appendChild(input);
    lab.appendChild(document.createTextNode(it.label));
    if (it.extra) lab.insertAdjacentHTML("beforeend", '<span class="pp-spin" aria-hidden="true">' + U.esc(it.extra) + "</span>");
    remember(input, it);
    return lab;
  }

  function fieldItem(it) {
    var wrap = h("div", { "class": "pp-field" + (it.disabled ? " is-disabled" : "") },
      (it.icon ? icon(it.icon) : "") + (it.label ? '<span class="pp-field-label">' + U.esc(it.label) + "</span>" : ""));
    wrap.appendChild(combo(extend(it, { label: (it.label || it.value).replace(/:$/, "") })));
    return wrap;
  }

  function combo(it) {
    var b = h("button", {
      type: "button", "class": "pp-combo", style: "width:" + (it.width || 80) + "px",
      "aria-label": it.label + (it.value ? ": " + it.value : ""), "aria-haspopup": "true"
    }, '<span class="pp-combo-val">' + U.esc(it.value || "") + "</span>");
    if (it.disabled) b.disabled = true;
    b.setAttribute("data-tip-title", it.label);
    return remember(b, extend(it, { combo: true }));
  }

  function rowsItem(it) {
    var wrap = h("div", { "class": "pp-rows" });
    it.rows.forEach(function (row) {
      var r = h("div", { "class": "pp-row" });
      row.forEach(function (part) {
        if (Array.isArray(part)) {
          var seg = h("div", { "class": "pp-seg" });
          part.forEach(function (b) { seg.appendChild(iconButton(b)); });
          r.appendChild(seg);
        } else if (part.type === "combo") {
          r.appendChild(combo(part));
        }
      });
      wrap.appendChild(r);
    });
    return wrap;
  }

  function gallery(it) {
    var g = h("div", { "class": "pp-gallery pp-gallery--" + it.kind, role: "group", "aria-label": it.label });
    var items = h("div", { "class": "pp-gallery-items" });
    if (it.kind === "transitions") {
      window.PP_TRANSITIONS.forEach(function (t) {
        var b = h("button", { type: "button", "class": "pp-gal-item pp-trans", "aria-label": t.label, "aria-pressed": "false", "data-trans-id": t.id },
          window.PP_TRANSITION_TILES[t.id] || "");
        b.setAttribute("data-tip-title", t.label);
        b.setAttribute("data-tip", window.PP_ANIM_TEXT.tileTip);
        items.appendChild(remember(b, { act: "trans:" + t.id, label: t.label }));
      });
    } else if (it.kind === "themes") {
      window.PP_THEMES.forEach(function (th, i) {
        var bars = th.accents.map(function (c) { return '<i style="background:' + U.esc(c) + '"></i>'; }).join("");
        var b = h("button", {
          type: "button", "class": "pp-gal-item pp-theme", "aria-label": th.name, "aria-pressed": String(i === 0),
          style: "background:" + th.bg + ";color:" + th.ink
        }, '<span class="pp-theme-aa">Aa</span><span class="pp-theme-bars">' + bars + "</span>");
        b.setAttribute("data-tip-title", th.name);
        items.appendChild(remember(b, i === 0 ? { act: "noop", label: th.name } : { say: "themes", label: th.name }));
      });
    } else {
      var shapes = h("button", { type: "button", "class": "pp-gal-item pp-shapes", "aria-label": "Shapes" },
        window.PP_SHAPES.map(function (s) { return '<svg viewBox="0 0 12 12" aria-hidden="true">' + s + "</svg>"; }).join(""));
      shapes.setAttribute("data-tip-title", "Shapes");
      items.appendChild(remember(shapes, { label: "Shapes" }));
    }
    g.appendChild(items);
    // The little up / down / more buttons down the right edge of every in-ribbon gallery (decorative).
    g.appendChild(h("div", { "class": "pp-gallery-scroll", "aria-hidden": "true" }, "<span></span><span></span><span></span>"));
    return g;
  }

  function onCommandClick(e) {
    var el = e.target.closest("[data-spec]");
    if (!el || el.tagName === "INPUT" || el.disabled) return;
    var spec = specOf(el);
    hideTip();
    if (spec.combo) comboClick(el, spec);
    else trigger(spec, el);
  }

  function onCheckChange(e) {
    var input = e.target;
    var spec = input.getAttribute && specOf(input);
    if (!spec) return;
    if (spec.act) run(spec.act, input, spec);
    else if (spec.say) { input.checked = false; say(spec.say, spec.label); }
  }

  function comboClick(el, spec) {
    if (!spec.options) { trigger(spec, el); return; }
    var val = el.querySelector(".pp-combo-val");
    openMenu(el, spec.options.map(function (o) {
      return { label: o, checked: o === val.textContent, run: function () {
        val.textContent = o;
        el.setAttribute("aria-label", spec.label + ": " + o);
      } };
    }));
  }

  function selectTab(id, focus) {
    var tab = $("pp-tab-" + id);
    if (!tab) return;
    each(tabsEl.children, function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    each(ribbonEl.children, function (p) { p.hidden = p.id !== "pp-panel-" + id; });
    state.tab = id;
    if (focus) tab.focus();
    revealTab();
    hideTip();
    closeMenu();
    fitRibbon();
    placeBalloon();
  }

  // On a phone the tab row scrolls sideways: keep the open tab in view.
  function revealTab() {
    var tab = $("pp-tab-" + state.tab);
    if (!tab || tabsEl.scrollWidth <= tabsEl.clientWidth) return;
    var c = tabsEl.getBoundingClientRect(), r = tab.getBoundingClientRect();
    if (r.left < c.left) tabsEl.scrollLeft -= c.left - r.left + 8;
    else if (r.right > c.right) tabsEl.scrollLeft += r.right - c.right + 8;
  }

  // When the window is too narrow for every group, some groups are left out: groups without a
  // hideOrder always show, then the others are added lowest hideOrder first, each only if it fits
  // (so a small group can still fill a gap that a big one could not).
  function fitRibbon() {
    var panel = $("pp-panel-" + state.tab);
    if (!panel) return;
    var groups = Array.prototype.slice.call(panel.querySelectorAll(".pp-group[data-hide-order]"));
    if (isSmall() || !panel.clientWidth) {         // phones: the ribbon scrolls sideways instead
      groups.forEach(function (g) { g.hidden = false; });
      return;
    }
    groups.forEach(function (g) { g.hidden = true; });
    groups.sort(function (a, b) { return a.getAttribute("data-hide-order") - b.getAttribute("data-hide-order"); });
    groups.forEach(function (g) {
      g.hidden = false;
      if (panel.scrollWidth > panel.clientWidth + 1) g.hidden = true;
    });
  }

  // Mark the buttons that run a command as pressed or not (views, colour modes).
  function pressAct(act, on) {
    each(document.querySelectorAll('[data-act="' + act + '"]'), function (b) {
      if (b.tagName === "BUTTON") b.setAttribute("aria-pressed", String(!!on));
    });
  }

  // ======================================================================
  // Quick Access Toolbar, Office button menu, desktop icons
  // ======================================================================
  function buildQAT() {
    [
      { icon: "save", label: "Save", key: "Ctrl+S", say: "save" },
      { icon: "undo", label: "Undo", key: "Ctrl+Z", say: "undo", drop: true },
      { icon: "redo", label: "Repeat", key: "Ctrl+Y", disabled: true },
      { icon: "qat-show", label: "From Beginning", key: "F5", act: "show-begin", tip: "Start the slide show from the first slide." },
      { icon: "qat-more", label: "Customize Quick Access Toolbar" }
    ].forEach(function (it) {
      var b = h("button", { type: "button", "class": "pp-qat-btn" + (it.drop ? " has-drop" : ""), "aria-label": it.label },
        icon(it.icon) + (it.drop ? '<span class="pp-qat-drop" aria-hidden="true"></span>' : ""));
      if (it.disabled) b.disabled = true;
      tipAttrs(b, it);
      qat.appendChild(remember(b, it));
    });
    qat.addEventListener("click", onCommandClick);
  }

  var OM = window.PP_OFFICE_MENU;
  function buildOfficeMenu() {
    var left = OM.items.map(function (it, k) {
      return '<button type="button" class="pp-om-item' + (it.sub ? " has-sub" : "") + '" role="menuitem" data-om="' + k + '"' +
        (it.sub ? ' aria-haspopup="true"' : "") + ">" + icon(it.icon) + "<span>" + U.esc(it.label) + "</span></button>";
    }).join("");
    var foot = OM.footer.map(function (f, k) {
      return '<button type="button" class="pp-om-foot-btn" data-omf="' + k + '">' + icon(f.icon) + "<span>" + U.esc(f.label) + "</span></button>";
    }).join("");
    omenu.innerHTML =
      '<div class="pp-om-body"><div class="pp-om-left" role="menu" aria-label="Office menu">' + left + "</div>" +
      '<div class="pp-om-right" id="pp-om-right"></div></div><div class="pp-om-foot">' + foot + "</div>";

    var leftEl = omenu.querySelector(".pp-om-left");
    leftEl.addEventListener("mouseover", function (e) {
      var b = e.target.closest(".pp-om-item");
      if (b) hoverOfficeItem(+b.getAttribute("data-om"));
    });
    leftEl.addEventListener("focusin", function (e) {
      var b = e.target.closest(".pp-om-item");
      if (b) hoverOfficeItem(+b.getAttribute("data-om"));
    });
    omenu.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var it;
      if (b.hasAttribute("data-om")) {
        it = OM.items[+b.getAttribute("data-om")];
        if (it.sub) { showSub(+b.getAttribute("data-om"), true); return; }
      } else if (b.hasAttribute("data-omr")) it = OM.recent[+b.getAttribute("data-omr")];
      else if (b.hasAttribute("data-oms")) {
        var p = b.getAttribute("data-oms").split("-");
        it = OM.items[+p[0]].sub.items[+p[1]];
      } else if (b.hasAttribute("data-omf")) it = OM.footer[+b.getAttribute("data-omf")];
      if (!it) return;
      if (it.act !== "recent") closeOfficeMenu(true);
      trigger(it, b);
    });
  }

  var omOpenItem = -1;
  function hoverOfficeItem(k) {
    if (OM.items[k].sub) showSub(k);
    else if (omOpenItem !== -1) showRecent();
  }
  function markOfficeItem(k) {
    omOpenItem = k;
    each(omenu.querySelectorAll(".pp-om-item"), function (b) { b.classList.toggle("is-open", +b.getAttribute("data-om") === k); });
  }
  // The right column: a heading, then its items as a menu of their own (named by the heading).
  function fillOfficeRight(heading, itemsHtml, focus) {
    var right = $("pp-om-right");
    right.innerHTML = '<div class="pp-om-heading" id="pp-om-heading">' + U.esc(heading) + "</div>" +
      '<div class="pp-om-list" role="menu" aria-labelledby="pp-om-heading">' + itemsHtml + "</div>";
    if (focus) right.querySelector("button").focus();
  }
  function showRecent(focus) {
    markOfficeItem(-1);
    fillOfficeRight("Recent Documents", OM.recent.map(function (r, k) {
      return '<button type="button" class="pp-om-recent" role="menuitem" data-omr="' + k + '"><span class="pp-om-n">' + (k + 1) +
        '</span><span class="pp-om-name">' + U.esc(fill(r.label)) + "</span>" + icon("pin", "pp-om-pin") + "</button>";
    }).join(""), focus);
  }
  function showSub(k, focus) {
    var it = OM.items[k];
    markOfficeItem(k);
    fillOfficeRight(it.sub.heading, it.sub.items.map(function (s, j) {
      return '<button type="button" class="pp-om-sub" role="menuitem" data-oms="' + k + "-" + j + '">' + icon(s.icon) +
        '<span><b>' + U.esc(s.label) + "</b><span>" + U.esc(fill(s.text)) + "</span></span></button>";
    }).join(""), focus);
  }

  function openOfficeMenu(focusFirst) {
    if (!omenu.childElementCount) buildOfficeMenu();
    closeMenu();
    hideTip();
    showRecent();
    omenu.hidden = false;
    orb.setAttribute("aria-expanded", "true");
    placeBalloon();   // the welcome balloon would sit on top of the menu: close it
    if (focusFirst) omenu.querySelector(".pp-om-item").focus();
  }
  function closeOfficeMenu(focusOrb) {
    if (omenu.hidden) return;
    omenu.hidden = true;
    orb.setAttribute("aria-expanded", "false");
    if (focusOrb) orb.focus();
  }
  // Arrow keys in the Office menu: up/down (Home/End) in a column, right/left between the columns.
  // Right on a command with more choices opens them; on the others it goes to Recent Documents.
  function officeMenuKeys(e) {
    if (e.key === "Escape") { e.preventDefault(); closeOfficeMenu(true); return; }
    var inLeft = e.target.closest(".pp-om-left"), inRight = e.target.closest(".pp-om-right");
    var col = inLeft || inRight;
    if (!col) return;
    var items = Array.prototype.slice.call(col.querySelectorAll("button"));
    var i = items.indexOf(e.target);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      items[e.key === "Home" ? 0 : items.length - 1].focus();
    } else if (e.key === "ArrowRight" && inLeft) {
      var k = +e.target.getAttribute("data-om");
      e.preventDefault();
      if (OM.items[k] && OM.items[k].sub) showSub(k, true);
      else showRecent(true);
    } else if (e.key === "ArrowLeft" && inRight) {
      e.preventDefault();
      var back = omenu.querySelector(".pp-om-item.is-open") || omenu.querySelector(".pp-om-item");
      back.focus();
    }
  }

  function buildDesktopIcons() {
    var box = $("pp-icons");
    DESKTOP_ICONS.forEach(function (d) {
      var el;
      if (d.href) {
        el = h("a", { "class": "xp-icon", href: U.url(d.href) });
        if (d.newTab || U.isExternal(d.href)) { el.target = "_blank"; el.rel = "noopener"; }
      } else {
        el = h("button", { type: "button", "class": "xp-icon" });
        if (d.open) el.setAttribute("data-open", d.open);
      }
      el.innerHTML = XP.icon(d.icon) + "<span></span>";
      el.querySelector("span").textContent = d.label;
      if (d.say) el.addEventListener("xp:open", function () { say(d.say); });
      box.appendChild(el);
    });
  }

  // ======================================================================
  // Popup menus (drop-downs, the slide show menu) and ScreenTips
  // ======================================================================
  var menuEl = null, menuAnchor = null;
  // items: { label, run, checked, icon } | "-" | { head: "Title" }
  // opts: { at: {x, y} } to open at the mouse, { up: true } to prefer opening upwards.
  function openMenu(anchor, items, opts) {
    opts = opts || {};
    if (menuEl && anchor && menuAnchor === anchor) { closeMenu(true); return; }
    closeMenu();
    hideTip();
    var m = h("div", { "class": "pp-menu", role: "menu" });
    items.forEach(function (it) {
      if (it === "-") { m.appendChild(h("div", { "class": "pp-menu-sep", role: "separator" })); return; }
      if (it.head) { m.appendChild(h("div", { "class": "pp-menu-head", role: "presentation" }, U.esc(it.head))); return; }
      var b = h("button", { type: "button", "class": "pp-menu-item", role: it.checked != null ? "menuitemradio" : "menuitem" },
        '<span class="pp-menu-mark">' + (it.checked ? CHECK_SVG : it.icon ? icon(it.icon) : "") + "</span><span>" + U.esc(it.label) + "</span>");
      if (it.checked != null) b.setAttribute("aria-checked", String(!!it.checked));
      b.addEventListener("click", function () { closeMenu(!show.on); it.run(); });
      m.appendChild(b);
    });
    document.body.appendChild(m);

    var r = opts.at ? { left: opts.at.x, top: opts.at.y, bottom: opts.at.y } : anchor.getBoundingClientRect();
    var mw = m.offsetWidth, mh = m.offsetHeight;
    var maxY = window.innerHeight - 32;   // keep clear of the XP taskbar
    var x = Math.min(r.left, window.innerWidth - mw - 4);
    var y = r.bottom + 1;
    if ((opts.up || y + mh > maxY) && r.top - mh - 2 >= 0) y = r.top - mh - 2;
    m.style.left = Math.max(4, x) + "px";
    m.style.top = Math.max(4, Math.min(y, maxY - mh)) + "px";

    menuEl = m;
    menuAnchor = anchor || null;
    if (anchor) anchor.setAttribute("aria-expanded", "true");
    m.addEventListener("keydown", function (e) {
      var list = Array.prototype.slice.call(m.querySelectorAll(".pp-menu-item"));
      var i = list.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        list[(i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length].focus();
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        closeMenu(true);
      } else if (e.key === "Tab") {
        closeMenu(true);
      }
    });
    var first = m.querySelector('.pp-menu-item[aria-checked="true"]') || m.querySelector(".pp-menu-item");
    if (first) first.focus();
  }
  function closeMenu(restoreFocus) {
    if (!menuEl) return;
    menuEl.remove();
    menuEl = null;
    if (menuAnchor) {
      menuAnchor.setAttribute("aria-expanded", "false");
      if (restoreFocus && document.contains(menuAnchor)) menuAnchor.focus();
    } else if (show.on) showEl.focus({ preventScroll: true });
    menuAnchor = null;
  }

  function customShowMenu(el) {
    var items = [{ head: "Start the show at" }];
    SITE.pages.forEach(function (p) {
      var i = firstSlideOf(p.id);
      if (i >= 0) items.push({ label: p.label, run: function () { startShow(i); } });
    });
    items.push("-", { label: "Custom Shows...", run: function () { say("customShows"); } });
    openMenu(el, items);
  }

  function switchWindowsMenu(el) {
    openMenu(el, [
      { label: "1 " + DOC, checked: true, run: function () {} },
      "-",
      { label: "Classic website", icon: "st-web", run: function () { openLink("classic"); } },
      { label: "My CV (PDF)", icon: "st-pdf", run: function () { openLink("cv"); } }
    ]);
  }

  function zoomMenu(el) {
    var items = [{ label: "Fit", checked: !state.zoom, run: function () { setZoom(0); } }];
    [400, 200, 100, 66, 50, 33].forEach(function (p) {
      items.push({ label: p + "%", checked: state.zoom === p, run: function () { setZoom(p); } });
    });
    openMenu(el, items);
  }

  // ScreenTips: the 2007-style tooltip boxes (title, then a sentence) under the ribbon.
  var tipTimer = 0, tipFor = null;
  function bindTips() {
    win.addEventListener("mouseover", function (e) {
      var el = e.target.closest && e.target.closest("[data-tip-title]");
      if (el === tipFor) return;
      hideTip();
      if (!el || el.disabled) return;
      tipFor = el;
      tipTimer = setTimeout(function () { showTip(el); }, 550);
    });
    win.addEventListener("mouseleave", hideTip);
    document.addEventListener("pointerdown", hideTip, true);
    document.addEventListener("keydown", hideTip, true);
  }
  function showTip(el) {
    if (!document.contains(el) || !el.offsetWidth) return;
    var desc = el.getAttribute("data-tip");
    tipEl.innerHTML = "<b>" + U.esc(el.getAttribute("data-tip-title")) + "</b>" + (desc ? "<p>" + U.esc(desc) + "</p>" : "");
    tipEl.hidden = false;
    var r = el.getBoundingClientRect();
    var top = ribbonEl.contains(el) ? ribbonEl.getBoundingClientRect().bottom + 3 : r.bottom + 5;
    if (top + tipEl.offsetHeight > window.innerHeight - 34) top = r.top - tipEl.offsetHeight - 5;
    tipEl.style.left = Math.max(4, Math.min(r.left, window.innerWidth - tipEl.offsetWidth - 6)) + "px";
    tipEl.style.top = Math.max(4, top) + "px";
  }
  function hideTip() {
    clearTimeout(tipTimer);
    tipFor = null;
    if (tipEl) tipEl.hidden = true;
  }

  // ======================================================================
  // Slides pane, outline, slide sorter, editing area
  // ======================================================================

  // A copy of a slide for thumbnails: links become plain text, so the whole
  // thumbnail can be one button (and a click selects instead of following a link).
  function staticSlide(i) {
    var el = Deck.render(SLIDES[i]);
    each(el.querySelectorAll("a"), function (a) {
      var s = document.createElement("span");
      s.className = (a.className ? a.className + " " : "") + "pp-link";
      s.innerHTML = a.innerHTML;
      a.parentNode.replaceChild(s, a);
    });
    each(el.querySelectorAll("img"), function (img) { img.alt = ""; });
    el.setAttribute("aria-hidden", "true");
    return el;
  }

  // PowerPoint 2007's little star under the number of a slide that has a transition or animations.
  // Clicking it plays them (on the big slide in Normal view; on the thumbnail in the Slide Sorter).
  // It is a mouse shortcut, so it stays out of the Tab order: Preview on the Animations tab does the same.
  function indicator(i) {
    var A = window.PP_ANIM_TEXT;
    var b = h("button", { type: "button", "class": "pp-anim-ind", "data-anim": i, tabindex: "-1",
      "aria-label": A.indicator + " (slide " + (i + 1) + ")" }, icon("anim-star", "pp-anim-ico"));
    b.setAttribute("data-tip-title", A.indicator);
    b.setAttribute("data-tip", A.indicatorTip);
    return b;
  }
  function hasEffects(i) { return FX[i].transition !== "none" || FX[i].build.length > 0; }
  function updateIndicators() {
    each(document.querySelectorAll(".pp-anim-ind"), function (b) { b.hidden = !hasEffects(+b.getAttribute("data-anim")); });
  }

  function buildThumbs() {
    SLIDES.forEach(function (s, i) {
      var li = h("li", { "class": "pp-thumb-item" });
      var b = h("button", { type: "button", "class": "pp-thumb", "data-i": i, tabindex: "-1", "aria-label": "Slide " + (i + 1) + ": " + titleOf(i) },
        '<span class="pp-thumb-num" aria-hidden="true">' + (i + 1) + '</span><span class="pp-thumb-box"></span>' +
        '<span class="pp-thumb-cap" aria-hidden="true" data-n="' + (i + 1) + '. ">' + U.esc(titleOf(i)) + "</span>");
      b.querySelector(".pp-thumb-box").appendChild(staticSlide(i));
      li.appendChild(b);
      li.appendChild(indicator(i));
      thumbsEl.appendChild(li);
    });
    thumbsEl.addEventListener("click", function (e) {
      var star = e.target.closest(".pp-anim-ind");
      if (star) {
        var i = +star.getAttribute("data-anim");
        select(i, { user: true });
        previewSlide(i, { explicit: true });
        return;
      }
      var b = e.target.closest(".pp-thumb");
      if (b) select(+b.getAttribute("data-i"), { user: true });
    });
    thumbsEl.addEventListener("keydown", listKeys);
  }

  // Up/Down (and Left/Right, Home/End, Page Up/Down) move through a list of slides.
  function listKeys(e) {
    var b = e.target.closest("[data-i]");
    if (!b) return;
    var i = +b.getAttribute("data-i"), j = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === "PageDown") j = i + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft" || e.key === "PageUp") j = i - 1;
    else if (e.key === "Home") j = 0;
    else if (e.key === "End") j = N - 1;
    if (j == null) return;
    e.preventDefault();
    select(clamp(j), { user: true, focus: true });
  }

  // The Outline tab: each slide's title and text, as in PowerPoint's outline.
  function outlineLines(s) {
    var out = [];
    function add(t, lvl) { if (t) out.push({ t: t, lvl: lvl }); }
    [].concat(s.subtitle || []).forEach(function (line) { add(line, 1); });   // one line, or an array of lines
    (s.paragraphs || []).forEach(function (p) { add(p, 1); });
    (s.bullets || []).forEach(function (b) {
      if (typeof b === "string") add(b, 1);
      else { add(b.text, 1); (b.sub || []).forEach(function (x) { add(x, 2); }); }
    });
    (s.columns || []).forEach(function (c) {
      add(c.heading, 1);
      (c.bullets || []).forEach(function (x) { add(x, 2); });
    });
    (s.boxes || []).forEach(function (b) { add("**" + b.label + "**: " + b.text, 1); });
    return out;
  }
  // Mini-markdown with its links as plain text (keeping the "text-link" look of links in running text).
  function inlineStatic(text) {
    return U.inline(text)
      .replace(/<a ([^>]*)>/g, function (all, attrs) {
        return '<span class="' + (/class="[^"]*text-link/.test(attrs) ? "text-link " : "") + 'pp-link">';
      })
      .replace(/<\/a>/g, "</span>");
  }
  function buildOutline() {
    var ol = h("ol", { "class": "pp-ol" });
    SLIDES.forEach(function (s, i) {
      var lines = outlineLines(s).map(function (l) {
        return '<li class="pp-ol-l' + l.lvl + '">' + inlineStatic(l.t) + "</li>";
      }).join("");
      var li = h("li", { "class": "pp-ol-item", "data-oi": i },
        '<span class="pp-ol-num" aria-hidden="true">' + (i + 1) + '</span><div class="pp-ol-body">' +
        '<button type="button" class="pp-ol-title" data-i="' + i + '" tabindex="-1">' + icon("pane-slides", "pp-ol-ico") +
        "<span>" + U.esc(titleOf(i)) + "</span></button>" + (lines ? '<ul class="pp-ol-lines">' + lines + "</ul>" : "") + "</div>");
      ol.appendChild(li);
    });
    outlineEl.appendChild(ol);
    outlineEl.addEventListener("click", function (e) {
      var li = e.target.closest(".pp-ol-item");
      if (li) select(+li.getAttribute("data-oi"), { user: true });
    });
    outlineEl.addEventListener("keydown", listKeys);
  }

  // Slide Sorter: every slide at once. A click opens that slide in Normal view.
  function buildSorter() {
    SLIDES.forEach(function (s, i) {
      var item = h("div", { "class": "pp-sort-item" });
      var b = h("button", { type: "button", "class": "pp-sort", "data-i": i, tabindex: "-1", "aria-label": "Slide " + (i + 1) + ": " + titleOf(i) },
        '<span class="pp-sort-box"></span><span class="pp-sort-meta" aria-hidden="true"><span class="pp-sort-cap">' +
        U.esc(titleOf(i)) + '</span><span class="pp-sort-num">' + (i + 1) + "</span></span>");
      b.querySelector(".pp-sort-box").appendChild(staticSlide(i));
      item.appendChild(b);
      item.appendChild(indicator(i));
      sorterEl.appendChild(item);
    });
    updateIndicators();
    sorterEl.addEventListener("click", function (e) {
      var star = e.target.closest(".pp-anim-ind");
      if (star) {                             // play it on the thumbnail itself, as PowerPoint's sorter does
        var i = +star.getAttribute("data-anim");
        select(i, { user: true });
        previewSlide(i, { explicit: true });
        return;
      }
      var b = e.target.closest(".pp-sort");
      if (!b) return;
      setView("normal");
      select(+b.getAttribute("data-i"), { user: true, focus: true });
    });
    sorterEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") return;   // the button's own click
      listKeys(e);
    });
  }

  function markCurrent(container, i) {
    each(container.querySelectorAll("[data-i]"), function (b) {
      var on = +b.getAttribute("data-i") === i;
      if (on) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      b.tabIndex = on ? 0 : -1;
    });
    each(container.querySelectorAll(".pp-ol-item"), function (li) {
      li.classList.toggle("is-current", +li.getAttribute("data-oi") === i);
    });
  }

  function currentItem() {
    var box = state.view === "sorter" ? sorterEl : state.pane === "outline" ? outlineEl : thumbsEl;
    return box.querySelector('[data-i="' + state.current + '"]');
  }

  // Scroll a list just enough to show el (vertical list, or the phone's horizontal strip).
  function ensureVisible(box, el) {
    if (!el || box.hidden || !box.clientHeight) return;
    var c = box.getBoundingClientRect(), r = el.getBoundingClientRect();
    var target = el.closest(".pp-ol-item") || el;
    r = target.getBoundingClientRect();
    if (r.top < c.top) box.scrollTop -= c.top - r.top + 8;
    else if (r.bottom > c.bottom) box.scrollTop += Math.min(r.bottom - c.bottom + 8, r.top - c.top - 4);
    if (r.left < c.left) box.scrollLeft -= c.left - r.left + 8;
    else if (r.right > c.right) box.scrollLeft += r.right - c.right + 8;
  }

  // Select slide i: thumbnails, outline, sorter, the big slide, notes, status bar and hash.
  function select(i, opts) {
    opts = opts || {};
    i = clamp(i);
    state.current = i;
    markCurrent(thumbsEl, i);
    if (outlineEl.childElementCount) markCurrent(outlineEl, i);
    if (sorterEl.childElementCount) markCurrent(sorterEl, i);
    stopPreview();
    markTransition();

    frame.innerHTML = "";
    frame.appendChild(Deck.render(SLIDES[i]));
    frame.setAttribute("aria-label", "Slide " + (i + 1) + " of " + N + ": " + titleOf(i));

    var notes = SLIDES[i].notes;
    notesEl.textContent = notes || "Click to add notes";
    notesEl.classList.toggle("is-empty", !notes);
    statusSlide.textContent = "Slide " + (i + 1) + " of " + N;
    updateScrollbar();

    var item = currentItem();
    ensureVisible(thumbsEl, thumbsEl.querySelector('[data-i="' + i + '"]'));
    if (outlineEl.childElementCount) ensureVisible(outlineEl, outlineEl.querySelector('[data-i="' + i + '"]'));
    if (sorterEl.childElementCount) ensureVisible(sorterEl, sorterEl.querySelector('[data-i="' + i + '"]'));
    if (opts.focus && item) item.focus({ preventScroll: true });

    if (opts.user) state.hashReady = true;
    if (state.hashReady && !show.on) setHash("slide-" + (i + 1));
  }

  function setView(v) {
    state.view = v === "sorter" ? "sorter" : "normal";
    var sorter = state.view === "sorter";
    if (sorter && !sorterEl.childElementCount) buildSorter();
    sorterEl.hidden = !sorter;
    sideEl.hidden = sorter;
    splitEl.hidden = sorter;
    editEl.hidden = sorter;
    pressAct("view-normal", !sorter);
    pressAct("view-sorter", sorter);
    each(document.querySelectorAll(".pp-view-btn[data-view]"), function (b) {
      var vv = b.getAttribute("data-view");
      if (vv !== "show") b.setAttribute("aria-pressed", String(vv === state.view));
    });
    if (sorter) {
      markCurrent(sorterEl, state.current);
      ensureVisible(sorterEl, sorterEl.querySelector('[data-i="' + state.current + '"]'));
    } else {
      layoutEditor();
    }
    placeBalloon();
  }

  function setPane(p) {
    state.pane = p === "outline" ? "outline" : "slides";
    var outline = state.pane === "outline";
    if (outline && !outlineEl.childElementCount) buildOutline();
    thumbsPanel.hidden = outline;
    outlineEl.hidden = !outline;
    $("pp-side-tab-slides").setAttribute("aria-selected", String(!outline));
    $("pp-side-tab-outline").setAttribute("aria-selected", String(outline));
    $("pp-side-tab-slides").tabIndex = outline ? -1 : 0;
    $("pp-side-tab-outline").tabIndex = outline ? 0 : -1;
    var box = outline ? outlineEl : thumbsEl;
    markCurrent(box, state.current);
    ensureVisible(box, box.querySelector('[data-i="' + state.current + '"]'));
  }

  // Size the big slide: fit the editing area (like "Fit to window"), or a fixed zoom.
  function layoutEditor() {
    if (editEl.hidden) return;
    var w = stage.clientWidth, ht = stage.clientHeight;
    if (!w || !ht) return;
    var pad = isSmall() ? 10 : Math.max(14, Math.min(34, w * 0.035));
    var fit = Math.max(80, Math.min(w - 2 * pad, (ht - 2 * pad) * 16 / 9));
    var px = state.zoom ? SLIDE_PX * state.zoom / 100 : fit;
    stage.style.setProperty("--pp-slide-w", Math.floor(px) + "px");
    stage.classList.toggle("is-zoomed", !!state.zoom && (px > w - 4 || px * 9 / 16 > ht - 4));
    var pct = Math.round(px / SLIDE_PX * 100);
    zoomPct.textContent = pct + "%";
    zoomRange.value = Math.max(+zoomRange.min, Math.min(+zoomRange.max, pct));
    zoomRange.setAttribute("aria-valuetext", pct + "%");
    updateScrollbar();
  }

  function setZoom(p) {
    state.zoom = p ? Math.max(10, Math.min(400, Math.round(p))) : 0;
    layoutEditor();
  }

  function setColorMode(mode) {
    frame.classList.toggle("is-gray", mode === "grayscale");
    frame.classList.toggle("is-bw", mode === "bw");
    pressAct("color", mode === "color");
    pressAct("grayscale", mode === "grayscale");
    pressAct("bw", mode === "bw");
  }

  // The fake scroll bar beside the slide: its thumb shows where you are in the deck.
  function updateScrollbar() {
    var track = $("pp-sb-track"), th = $("pp-sb-thumb");
    var H = track.clientHeight;
    if (!H) return;
    var tH = Math.max(18, Math.round(H / N));
    th.style.height = tH + "px";
    th.style.top = Math.round((H - tH) * state.current / Math.max(1, N - 1)) + "px";
  }
  function initScrollbar() {
    var track = $("pp-sb-track"), dragging = false;
    function slideAt(y) {
      var r = track.getBoundingClientRect();
      return Math.round(Math.max(0, Math.min(1, (y - r.top) / r.height)) * (N - 1));
    }
    track.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      track.setPointerCapture(e.pointerId);
      select(slideAt(e.clientY), { user: true });
      e.preventDefault();
    });
    track.addEventListener("pointermove", function (e) {
      if (dragging) { var i = slideAt(e.clientY); if (i !== state.current) select(i, { user: true }); }
    });
    track.addEventListener("pointerup", function () { dragging = false; });
    track.addEventListener("pointercancel", function () { dragging = false; });
    each(document.querySelectorAll("[data-nav]"), function (b) {
      b.addEventListener("click", function () { select(state.current + (b.getAttribute("data-nav") === "next" ? 1 : -1), { user: true }); });
    });
  }

  // On touch screens, swiping the big slide sideways moves between slides.
  function initStageSwipe() {
    var t = null;
    stage.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") t = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    stage.addEventListener("pointerup", function (e) {
      if (!t || e.pointerId !== t.id) return;
      var dx = e.clientX - t.x, dy = e.clientY - t.y;
      t = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2 && !stage.classList.contains("is-zoomed")) {
        select(state.current + (dx < 0 ? 1 : -1), { user: true });
      }
    });
    stage.addEventListener("pointercancel", function () { t = null; });
  }

  // The mouse wheel over the slide moves between slides (as in PowerPoint's Normal view).
  function initWheel() {
    var acc = 0, lockUntil = 0;
    stage.addEventListener("wheel", function (e) {
      if (stage.classList.contains("is-zoomed")) return;   // zoomed in: scroll the slide instead
      e.preventDefault();
      var now = Date.now();
      if (now < lockUntil) return;
      acc += e.deltaY;
      if (Math.abs(acc) >= 50) {
        select(state.current + (acc > 0 ? 1 : -1), { user: true });
        acc = 0;
        lockUntil = now + 260;
      }
    }, { passive: false });
  }

  // Drag the bar between the slides pane and the slide to make the thumbnails bigger.
  function initSplitter() {
    var dragging = false, startX = 0, startW = 0;
    function setWidth(px) {
      var max = Math.min(480, win.clientWidth * 0.5);
      px = Math.round(Math.max(170, Math.min(max, px)));
      win.style.setProperty("--pp-side-w", px + "px");
      splitEl.setAttribute("aria-valuenow", px);
    }
    splitEl.addEventListener("pointerdown", function (e) {
      if (isSmall() || e.button !== 0) return;
      dragging = true;
      startX = e.clientX;
      startW = sideEl.offsetWidth;
      splitEl.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    splitEl.addEventListener("pointermove", function (e) { if (dragging) setWidth(startW + e.clientX - startX); });
    splitEl.addEventListener("pointerup", function () { dragging = false; });
    splitEl.addEventListener("pointercancel", function () { dragging = false; });
    splitEl.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setWidth(sideEl.offsetWidth + (e.key === "ArrowRight" ? 20 : -20));
      }
    });
  }

  // ======================================================================
  // Transitions and animations
  // ======================================================================
  // Built on the Web Animations API (element.animate): every movement is an Animation object, so a
  // click in the slide show can finish() them all at once, and moving on cancels them cleanly.
  // Animations use fill "backwards": before they start (while earlier ones play) things wait in their
  // first keyframe, and once they end the slide is simply itself again.
  // Keyframes name the same transform functions at both ends (never "none"), so browsers interpolate
  // them function by function.
  var CAN_ANIMATE = typeof Element !== "undefined" && typeof Element.prototype.animate === "function";
  var EASE_SMOOTH = "cubic-bezier(.25, .8, .3, 1)";
  var EASE_OUT = "cubic-bezier(.2, .7, .3, 1)";
  var FALL = "cubic-bezier(.55, 0, .9, .45)";     // speeding up, as things fall
  var RISE = "cubic-bezier(.1, .55, .45, 1)";     // slowing down, as things rise (or land)

  // Where each build target is on a rendered slide (shared/slides/deck.js markup).
  var TARGETS = {
    title: ".slide-title",
    photo: ".slide-photo",
    box1: ".slide-boxes > :nth-child(1)",
    box2: ".slide-boxes > :nth-child(2)"
  };

  function n1(v) { return Math.round(v * 10) / 10; }
  function px(v) { return n1(v) + "px"; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function ty(v) { return "translateY(" + px(v) + ")"; }
  // One transform for every keyframe of an entrance: move, turn, grow.
  function moveTurnGrow(x, y, deg, scale) {
    return "translate(" + px(x) + ", " + px(y) + ") rotate(" + n1(deg) + "deg) scale(" + Math.round(scale * 1000) / 1000 + ")";
  }
  // Drop from `from` (px, negative = above) and bounce twice, b1 then b2 high.
  function bounceFrames(from, b1, b2) {
    return [
      { offset: 0,   transform: ty(from), easing: FALL },
      { offset: .5,  transform: ty(0),    easing: RISE },
      { offset: .68, transform: ty(-b1),  easing: FALL },
      { offset: .84, transform: ty(0),    easing: RISE },
      { offset: .93, transform: ty(-b2),  easing: FALL },
      { offset: 1,   transform: ty(0) }
    ];
  }
  function rectPath(x, y, w, ht) {
    return "M" + n1(x) + " " + n1(y) + "H" + n1(x + w) + "V" + n1(y + ht) + "H" + n1(x) + "Z";
  }
  // Keyframes of a clip-path: path() drawn by draw(p) for p = 0 ... 1. Every step has the same
  // commands, so browsers that can blend paths do; the others step through them.
  function pathFrames(steps, draw) {
    var frames = [];
    for (var k = 0; k <= steps; k++) frames.push({ offset: k / steps, clipPath: 'path("' + draw(k / steps) + '")' });
    return frames;
  }

  // Where the words of an element are (not the whole block), as a client rect.
  function textRect(el) {
    try {
      var range = document.createRange();
      range.selectNodeContents(el);
      var r = range.getBoundingClientRect();
      if (r.width && r.height) return r;
    } catch (e) { /* use the element */ }
    return el.getBoundingClientRect();
  }

  // Animations made here (not the page's own CSS animations) inside el: cancel them.
  function cancelAnims(el) {
    if (!el || !el.getAnimations) return;
    el.getAnimations({ subtree: true }).forEach(function (a) {
      if (!a.animationName && !a.transitionProperty) a.cancel();
    });
  }

  function transitionById(id) {
    var list = window.PP_TRANSITIONS;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  // ---------- Transitions: how a slide (box) replaces the one before it (out: null at the start) ----------
  // Returns a list of { el, frames, easing, part (share of the time), delay (share), fill }.
  function transitionFrames(id, box, out, dir, bounds) {
    var W = box.offsetWidth, H = box.offsetHeight, list = [];
    function inc(frames, o) { o = o || {}; o.el = box; o.frames = frames; list.push(o); }
    function leave(frames, o) { if (!out) return; o = o || {}; o.el = out; o.frames = frames; o.fill = "both"; list.push(o); }
    switch (id) {
      case "fade":
        inc([{ opacity: 0 }, { opacity: 1 }], { easing: "ease" });
        break;
      case "split":          // Split Vertical Out: opens from a line down the middle
        inc([{ clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)" }], { easing: "ease-out" });
        break;
      case "box-out":        // a box grows from the centre
        inc([{ clipPath: "inset(50% 50% 50% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)" }], { easing: "ease-out" });
        break;
      case "circle":         // Shape Circle
        inc([{ clipPath: "circle(0% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)" }], { easing: "ease-in-out" });
        break;
      case "wheel":          // Wheel Clockwise, 4 Spokes
        inc(pathFrames(24, function (p) {
          var cx = W / 2, cy = H / 2, R = Math.sqrt(W * W + H * H) / 2 + 2, sweep = p * Math.PI / 2, d = "";
          for (var m = 0; m < 4; m++) {
            var a = -Math.PI / 2 + m * Math.PI / 2;
            d += "M" + n1(cx) + " " + n1(cy) + "L" + n1(cx + R * Math.cos(a)) + " " + n1(cy + R * Math.sin(a)) +
              "A" + n1(R) + " " + n1(R) + " 0 0 1 " + n1(cx + R * Math.cos(a + sweep)) + " " + n1(cy + R * Math.sin(a + sweep)) + "Z";
          }
          return d;
        }));
        break;
      case "random-bars":    // Random Bars Horizontal: thin bars appear in a new random order each time
        var bars = 32, bh = H / bars, order = [], rank = [], j, k, tmp;
        for (j = 0; j < bars; j++) order.push(j);
        for (j = bars - 1; j > 0; j--) { k = Math.floor(Math.random() * (j + 1)); tmp = order[j]; order[j] = order[k]; order[k] = tmp; }
        order.forEach(function (bar, pos) { rank[bar] = pos; });
        inc(pathFrames(14, function (p) {
          var shown = Math.round(p * bars), d = "";
          for (var b = 0; b < bars; b++) d += rectPath(0, b * bh, W, rank[b] < shown ? bh + .6 : 0);
          return d;
        }));
        break;
      case "checkerboard":   // Checkerboard Across: squares wipe left to right, every other row half a square on
        var cols = 10, rows = 6, cw = W / cols, rh = H / rows;
        inc(pathFrames(16, function (p) {
          var d = "";
          for (var r = 0; r < rows; r++) {
            for (var m = 0; m < 7; m++) d += rectPath(-2 * cw + (r % 2 ? cw : 0) + 2 * cw * m, r * rh, 2 * cw * p, rh + .6);
          }
          return d;
        }));
        break;
      case "push":           // Push Left: the new slide pushes the old one out (the other way when going back)
        var s = dir < 0 ? -1 : 1;
        inc([{ transform: "translateX(" + 100 * s + "%)" }, { transform: "translateX(0%)" }], { easing: EASE_SMOOTH });
        leave([{ transform: "translateX(0%)" }, { transform: "translateX(" + -100 * s + "%)" }], { easing: EASE_SMOOTH });
        break;
      case "bounce":         // drops in from above the screen and bounces twice
        var r0 = box.getBoundingClientRect();
        inc(bounceFrames(-(r0.bottom - (bounds ? bounds.top : r0.top)) - 4, H * .08, H * .025));
        break;
      case "newsflash":      // spins in from nothing
        inc([{ transform: "rotate(-720deg) scale(0)" }, { transform: "rotate(0deg) scale(1)" }], { easing: EASE_OUT });
        break;
    }
    return list;
  }

  // ---------- Entrance animations: how one thing on a slide arrives ----------
  // g: client rects measured before anything moves: sl (the slide), el (the element), tx (its words,
  // or the element itself). Returns { frames, easing } or null.
  function entranceFrames(id, g) {
    var sl = g.sl, el = g.el, tx = g.tx, W = sl.width, H = sl.height;
    var cx = tx.left + tx.width / 2, cy = tx.top + tx.height / 2;      // the middle of the words
    var origin = px(cx - el.left) + " " + px(cy - el.top);             // ... inside the element
    var T = moveTurnGrow, frames = [], k, t, e;
    function at(fx, fy) { return [sl.left + fx * W - cx, sl.top + fy * H - cy]; }   // a point on the slide, from the words
    switch (id) {
      case "fly-in-right":
        return { easing: EASE_SMOOTH, frames: [{ transform: T(sl.right - tx.left + 4, 0, 0, 1) }, { transform: T(0, 0, 0, 1) }] };
      case "fly-in-left":
        return { easing: EASE_SMOOTH, frames: [{ transform: T(-(tx.right - sl.left + 4), 0, 0, 1) }, { transform: T(0, 0, 0, 1) }] };
      case "swivel":         // spins round its upright middle line, two and a half turns
        return { easing: "ease-out", frames: [
          { opacity: 0, transformOrigin: origin, transform: "perspective(" + px(W) + ") rotateY(-900deg) scale(.7)" },
          { opacity: 1, transformOrigin: origin, transform: "perspective(" + px(W) + ") rotateY(0deg) scale(1)" }] };
      case "custom-path":    // a new random curve every time: from beyond an edge, through two random points
        var side = Math.floor(Math.random() * 4), p0;
        if (side === 0) p0 = [sl.right - tx.left + rand(.04, .15) * W, rand(-.4, .4) * H];
        else if (side === 1) p0 = [-(tx.right - sl.left) - rand(.04, .15) * W, rand(-.4, .4) * H];
        else if (side === 2) p0 = [rand(-.3, .3) * W, -(tx.bottom - sl.top) - rand(.05, .2) * H];
        else p0 = [rand(-.3, .3) * W, sl.bottom - tx.top + rand(.05, .2) * H];
        var c1 = at(rand(.1, .9), rand(.15, .9)), c2 = at(rand(.1, .9), rand(.15, .9)), spin = rand(-30, 30);
        for (k = 0; k <= 24; k++) {
          t = k / 24;
          e = 1 - Math.pow(1 - t, 2);       // slows down as it lands
          var u = 1 - e;                    // cubic Bezier from p0 via c1, c2 to (0, 0)
          frames.push({ offset: t, opacity: Math.min(1, t * 6), transformOrigin: origin, transform: T(
            u * u * u * p0[0] + 3 * u * u * e * c1[0] + 3 * u * e * e * c2[0],
            u * u * u * p0[1] + 3 * u * u * e * c1[1] + 3 * u * e * e * c2[1], spin * u, 1) });
        }
        return { easing: "linear", frames: frames };
      case "grow-turn":
        return { easing: EASE_OUT, frames: [
          { opacity: 0, transformOrigin: origin, transform: T(0, 0, 90, .1) },
          { opacity: 1, transformOrigin: origin, transform: T(0, 0, 0, 1) }] };
      case "spiral-in":      // from near the slide's top right corner, circling in as it grows
        // The circle is squashed to the room on each side of the words, so the whole spiral stays on the slide.
        var room = { r: sl.right - cx, l: cx - sl.left, u: cy - sl.top, d: sl.bottom - cy };
        for (k = 0; k <= 24; k++) {
          t = k / 24;
          e = 1 - Math.pow(1 - t, 2);
          var a = -Math.PI / 4 + 2 * Math.PI * e, ca = Math.cos(a), sa = Math.sin(a), f = 1.3 * (1 - e);
          frames.push({ offset: t, opacity: Math.min(1, t * 4), transformOrigin: origin,
            transform: T(f * ca * (ca > 0 ? room.r : room.l), f * sa * (sa > 0 ? room.d : room.u), 0, .15 + .85 * e) });
        }
        return { easing: "linear", frames: frames };
      case "bounce":         // drops in from above the slide and bounces
        var b1 = Math.max(6, tx.height * .5);
        return { easing: "linear", frames: bounceFrames(-(tx.bottom - sl.top) - 4, b1, b1 * .3) };
      case "float":          // drifts up into place
        return { easing: "cubic-bezier(.2, .6, .35, 1)", frames: [
          { opacity: 0, transform: T(0, Math.max(20, tx.height * 1.2), 0, 1) },
          { opacity: 1, transform: T(0, 0, 0, 1) }] };
      case "faded-zoom":
        return { easing: EASE_OUT, frames: [
          { opacity: 0, transformOrigin: origin, transform: T(0, 0, 0, .3) },
          { opacity: 1, transformOrigin: origin, transform: T(0, 0, 0, 1) }] };
      case "boomerang":      // swings in from the right, turning, goes a little too far, comes back
        return { easing: "ease-out", frames: [
          { offset: 0,   opacity: 0, transformOrigin: origin, transform: T(W * .45, -H * .12, -100, .3) },
          { offset: .35, opacity: 1, transformOrigin: origin, transform: T(W * .12, -H * .1, -40, .7) },
          { offset: .75, opacity: 1, transformOrigin: origin, transform: T(-W * .03, 0, 8, 1.06) },
          { offset: 1,   opacity: 1, transformOrigin: origin, transform: T(0, 0, 0, 1) }] };
      case "pinwheel":       // spins in from nothing, two turns
        return { easing: EASE_OUT, frames: [
          { transformOrigin: "50% 50%", transform: T(0, 0, -720, 0) },
          { transformOrigin: "50% 50%", transform: T(0, 0, 0, 1) }] };
    }
    return null;
  }

  // Play slide i's transition, then its build, on box (the element holding the slide); out is the
  // slide being replaced, if any. opts: { dir, bounds (the rect the movement is seen in),
  // transition (another transition: Live Preview), transitionOnly }.
  // Returns { anims: every Animation, transition: the transition's Animations }.
  function playSlide(box, out, i, opts) {
    opts = opts || {};
    var res = { anims: [], transition: [] };
    if (!CAN_ANIMATE || !box || !box.offsetWidth) return res;
    var slideEl = box.classList.contains("slide") ? box : box.querySelector(".slide");
    if (!slideEl) return res;

    // 1. Measure the build first, while nothing on the slide has moved yet.
    var steps = [];
    if (!opts.transitionOnly) {
      var sl = slideEl.getBoundingClientRect();
      FX[i].build.forEach(function (b) {
        var info = window.PP_ENTRANCES[b.effect];
        var el = TARGETS[b.target] ? slideEl.querySelector(TARGETS[b.target]) : null;
        if (!info || !el) return;
        var er = el.getBoundingClientRect();
        var spec = entranceFrames(b.effect, { sl: sl, el: er, tx: b.target === "title" ? textRect(el) : er });
        if (spec) steps.push({ el: el, ms: info.ms, spec: spec });
      });
    }

    // 2. The transition.
    var t = transitionById(opts.transition || FX[i].transition), at = 0;
    if (t.ms) {
      transitionFrames(t.id, box, out, opts.dir, opts.bounds).forEach(function (a) {
        var anim = a.el.animate(a.frames, {
          duration: t.ms * (a.part || 1), delay: t.ms * (a.delay || 0),
          easing: a.easing || "linear", fill: a.fill || "backwards"
        });
        res.anims.push(anim);
        res.transition.push(anim);
      });
      at = t.ms;
    }

    // 3. The build: each entrance starts when the one before it ends ("After Previous").
    steps.forEach(function (s) {
      res.anims.push(s.el.animate(s.spec.frames, { duration: s.ms, delay: at, easing: s.spec.easing || "linear", fill: "backwards" }));
      at += s.ms;
    });
    return res;
  }

  // ---------- In the editor: Preview, the stars, Live Preview, the gallery ----------
  var preview = { anims: [] };
  function stopPreview() {
    preview.anims.forEach(function (a) { a.cancel(); });
    preview.anims = [];
  }
  // Play slide i on the big slide (or on its thumbnail in the Slide Sorter).
  // opts.transition: only that transition (Live Preview). opts.explicit: the visitor clicked a button
  // for it, so under reduced motion say why nothing moves.
  function previewSlide(i, opts) {
    opts = opts || {};
    stopPreview();
    if (reducedMotion()) { if (opts.explicit) say("motionOff"); return; }
    var box = null, bounds = null;
    if (state.view === "sorter") {
      var sb = sorterEl.querySelector('.pp-sort[data-i="' + i + '"] .pp-sort-box');
      if (sb) { box = sb.querySelector(".slide"); bounds = sb.getBoundingClientRect(); }
    } else if (!editEl.hidden && i === state.current) {
      box = frame;
      bounds = stage.getBoundingClientRect();
    }
    if (!box) return;
    preview.anims = playSlide(box, null, i, { bounds: bounds, transition: opts.transition, transitionOnly: !!opts.transition }).anims;
  }

  // The gallery shows the selected slide's transition; a click gives the slide another one (for this
  // visit) and plays it.
  function markTransition() {
    var id = FX[state.current].transition;
    each(document.querySelectorAll(".pp-trans"), function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-trans-id") === id));
    });
  }
  function setTransition(id, play) {
    FX[state.current].transition = transitionById(id).id;
    markTransition();
    updateIndicators();
    if (play) previewSlide(state.current, { transition: FX[state.current].transition });
  }

  // Live Preview (new in Office 2007): resting the mouse on a transition plays it on the slide.
  function initLivePreview() {
    var timer = 0, last = null;
    ribbonEl.addEventListener("mouseover", function (e) {
      var tile = e.target.closest && e.target.closest(".pp-trans");
      if (tile === last) return;
      last = tile;
      clearTimeout(timer);
      if (tile) timer = setTimeout(function () { previewSlide(state.current, { transition: tile.getAttribute("data-trans-id") }); }, 350);
    });
    ribbonEl.addEventListener("mouseleave", function () { clearTimeout(timer); last = null; });
  }

  // ======================================================================
  // Slide show
  // ======================================================================
  var show = {
    on: false, i: 0, end: false, blank: false,
    cache: [],          // one rendered slide per index, reused
    prevFocus: null, task: null,
    idleTimer: 0, freshTimer: 0,
    digits: "", digitTimer: 0,
    suppressClick: false, touch: null,
    rehearse: null,
    anims: [],          // the current slide's transition and build (Animation objects)
    gen: 0              // counts slide changes, so a late "transition ended" is ignored
  };

  function showSlide(i) {
    if (!show.cache[i]) {
      var wrap = h("div", { "class": "pp-show-slide", role: "group", "aria-roledescription": "slide", "aria-label": (i + 1) + " of " + N + ": " + titleOf(i) });
      var f = h("div", { "class": "pp-show-frame" });
      f.appendChild(Deck.render(SLIDES[i]));
      wrap.appendChild(f);
      show.cache[i] = wrap;
    }
    return show.cache[i];
  }

  function startShow(i, opts) {
    opts = opts || {};
    i = clamp(i);
    closeOfficeMenu();
    closeMenu();
    hideTip();
    XP.closeBalloon();
    markTipSeen();
    settleHero();       // From Beginning has done its job: no more pulsing, during the show or after it
    if (!show.on) {
      U.track("powerpoint_show_started", { from_slide: i + 1 });
      show.on = true;
      show.prevFocus = document.activeElement;
      showEl.hidden = false;
      showEl.classList.add("is-fresh");       // the "turn your phone sideways" hint, upright phones only
      clearTimeout(show.freshTimer);
      show.freshTimer = setTimeout(function () { showEl.classList.remove("is-fresh"); }, 4200);
      document.body.classList.add("pp-showing");
      if ("inert" in desktop) desktop.inert = true;
      addShowTask();
      // Start from black, so the first slide's transition plays (as in PowerPoint).
      each(showStage.querySelectorAll(".pp-show-slide"), function (el) { cancelAnims(el); el.remove(); });
      layoutShow();
    }
    stopRehearse();
    if (opts.rehearse) startRehearse();
    leaveEndScreen();
    unblank();
    showGo(i, 1);
    showEl.focus({ preventScroll: true });
    wake();
  }

  // Show slide i in the slide show, with its transition and build.
  // dir: 1 forwards, -1 backwards (Push then runs the other way).
  // instant: no transition and no animations. Going back to the previous slide does this: as in
  // PowerPoint, the slide is shown as it was left.
  function showGo(i, dir, instant) {
    i = clamp(i);
    finishShowAnims();
    var incoming = showSlide(i);
    var outgoing = showStage.querySelector(".pp-show-slide.is-current");
    show.i = i;
    if (show.rehearse) show.rehearse.slideStart = Date.now();
    updateCount();
    setHash("show-" + (i + 1));
    announce("Slide " + (i + 1) + " of " + N + ": " + titleOf(i));
    if (outgoing === incoming) return;
    cancelAnims(incoming);
    incoming.classList.add("is-current");
    showStage.appendChild(incoming);
    if (outgoing) outgoing.classList.remove("is-current");
    if (!instant && !reducedMotion()) {
      var gen = show.gen;
      var r = playSlide(incoming.firstChild, outgoing && outgoing.firstChild, i, { dir: dir, bounds: showEl.getBoundingClientRect() });
      show.anims = r.anims;
      if (r.transition.length && window.Promise) {
        // The slide underneath goes once the transition is over (a click may end it sooner).
        Promise.all(r.transition.map(function (a) { return a.finished; }))
          .then(function () { if (gen === show.gen) removeOutgoing(); }, function () { /* cancelled */ });
      } else {
        removeOutgoing();
      }
    } else {
      removeOutgoing();
    }
    if (!showEl.contains(document.activeElement)) showEl.focus({ preventScroll: true });
  }

  // Is the current slide still animating?
  function showBusy() {
    for (var k = 0; k < show.anims.length; k++) if (show.anims[k].playState === "running") return true;
    return false;
  }
  // Jump every running animation to its end (what a click during them does), then tidy up.
  function finishShowAnims() {
    show.anims.forEach(function (a) {
      try { if (a.playState === "running" || a.playState === "paused") a.finish(); } catch (e) { a.cancel(); }
    });
    show.anims = [];
    show.gen++;
    removeOutgoing();
  }
  // Take away the slides that have been replaced (and reset their movements, for next time).
  function removeOutgoing() {
    each(showStage.querySelectorAll(".pp-show-slide:not(.is-current)"), function (el) {
      cancelAnims(el);
      el.remove();
    });
  }

  // Next: a click while the slide is still animating finishes its animations; the next one moves on.
  function showNext() {
    if (show.end) { endShow(); return; }
    if (showBusy()) { finishShowAnims(); return; }
    if (show.i < N - 1) showGo(show.i + 1, 1);
    else showEndScreen();
  }
  function showPrev() {
    if (show.end) { leaveEndScreen(); showGo(N - 1, -1, true); return; }
    if (show.i > 0) showGo(show.i - 1, -1, true);
  }

  // PowerPoint's ending: a black screen, "End of slide show, click to exit."
  function showEndScreen() {
    finishShowAnims();
    showEl.classList.remove("is-fresh");   // the "turn your phone sideways" hint would cover the words
    show.end = true;
    endEl.hidden = false;
    updateCount();
    setHash("end");
    announce(endEl.textContent);
  }
  function leaveEndScreen() {
    show.end = false;
    endEl.hidden = true;
  }

  function endShow() {
    if (!show.on) return;
    U.track("powerpoint_show_ended", { last_slide: show.i + 1 });
    var rehearsal = show.rehearse ? Date.now() - show.rehearse.start : 0;
    finishShowAnims();
    closeMenu();
    show.on = false;
    leaveEndScreen();
    unblank();
    stopRehearse();
    showEl.hidden = true;
    showEl.classList.remove("is-awake", "is-idle");
    document.body.classList.remove("pp-showing");
    if ("inert" in desktop) desktop.inert = false;
    removeShowTask();
    openWindow();
    state.hashReady = true;
    select(show.i);
    var f = show.prevFocus;
    if (f && document.contains(f) && f.offsetParent !== null && f !== document.body) f.focus({ preventScroll: true });
    else if ($("pp-hero")) $("pp-hero").focus({ preventScroll: true });
    if (rehearsal) {
      // A moment later: when Esc ended the show, the dialog would otherwise catch that same Esc and close.
      setTimeout(function () {
        XP.alert({
          title: "Microsoft Office PowerPoint", icon: "help",
          text: "The total time for the slide show was " + clock(rehearsal) + ". Do you want to keep the new slide timings to use when you view the slide show?",
          buttons: ["Yes", "No"]
        });
      }, 60);
    }
  }

  function updateCount() {
    countEl.textContent = show.end ? "End" : (show.i + 1) + " / " + N;
  }

  function blankScreen(colour) {
    show.blank = true;
    blankEl.hidden = false;
    blankEl.classList.toggle("is-white", colour === "white");
  }
  function unblank() {
    show.blank = false;
    blankEl.hidden = true;
  }

  // The slide show menu (control strip button, or right-click), as in PowerPoint.
  function showMenu(anchor, at) {
    var items = [
      { label: "Next", run: showNext },
      { label: "Previous", run: showPrev },
      "-",
      { head: "Go to Slide" }
    ];
    SLIDES.forEach(function (s, i) {
      items.push({ label: (i + 1) + "  " + titleOf(i), checked: !show.end && i === show.i, run: function () {
        leaveEndScreen();
        showGo(i, i >= show.i ? 1 : -1);
      } });
    });
    items.push("-",
      { label: "Black Screen", run: function () { blankScreen("black"); } },
      { label: "White Screen", run: function () { blankScreen("white"); } },
      "-",
      { label: "End Show", run: endShow });
    openMenu(anchor, items, { at: at, up: !!anchor });
  }

  // Control strip and mouse pointer: shown on mouse move, hidden after a moment.
  function wake() {
    showEl.classList.add("is-awake");
    showEl.classList.remove("is-idle");
    clearTimeout(show.idleTimer);
    show.idleTimer = setTimeout(function () {
      if (!show.on) return;
      if (menuEl || strip.contains(document.activeElement) || strip.matches(":hover")) { wake(); return; }
      showEl.classList.remove("is-awake");
      showEl.classList.add("is-idle");
    }, 2600);
  }

  function layoutShow() {
    var w = showEl.clientWidth, ht = showEl.clientHeight;
    if (!w || !ht) return;
    showStage.style.setProperty("--pp-show-w", Math.floor(Math.min(w, ht * 16 / 9)) + "px");
  }

  // While the show runs, the XP taskbar gets its own button, like the real thing.
  function addShowTask() {
    var tasks = document.querySelector(".xp-tasks");
    if (!tasks || show.task) return;
    var b = h("button", { type: "button", "class": "xp-taskbtn pp-show-task", "aria-pressed": "true" }, XP.icon("powerpoint") + "<span></span>");
    b.querySelector("span").textContent = SHOW_TASK_TITLE;
    b.title = SHOW_TASK_TITLE;
    b.addEventListener("click", function () { showEl.focus({ preventScroll: true }); wake(); });
    tasks.appendChild(b);
    show.task = b;
    var mainTask = XP.taskButton(win);
    if (mainTask) mainTask.setAttribute("aria-pressed", "false");
  }
  function removeShowTask() {
    if (show.task) { show.task.remove(); show.task = null; }
  }

  // Rehearse Timings: the show with a little timer box, then PowerPoint's question at the end.
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function clock(ms) {
    var s = Math.floor(ms / 1000);
    return Math.floor(s / 3600) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
  }
  function startRehearse() {
    show.rehearse = { start: Date.now(), slideStart: Date.now(), timer: setInterval(tickRehearse, 500) };
    rehearseEl.hidden = false;
    tickRehearse();
  }
  function tickRehearse() {
    var r = show.rehearse;
    if (!r) return;
    $("pp-reh-slide").textContent = clock(Date.now() - r.slideStart);
    $("pp-reh-total").textContent = clock(Date.now() - r.start);
  }
  function stopRehearse() {
    if (show.rehearse) clearInterval(show.rehearse.timer);
    show.rehearse = null;
    rehearseEl.hidden = true;
  }

  function showKeys(e) {
    var k = e.key;
    if (menuEl) return;                                         // the menu handles its own keys
    if (k === "Escape" && e.ctrlKey) return;                    // Ctrl+Esc: the XP start menu
    var onControl = e.target && e.target.closest && e.target.closest("a, button");
    if ((k === "Enter" || k === " ") && onControl && !show.digits) return;   // let links and buttons work
    if (k === "Tab" || k === "Shift" || k === "Control" || k === "Alt" || k === "Meta") { wake(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (show.blank) { e.preventDefault(); unblank(); return; }
    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      show.digits += k;
      clearTimeout(show.digitTimer);
      show.digitTimer = setTimeout(function () { show.digits = ""; }, 2500);
      return;
    }
    if (k === "Enter" && show.digits) {
      e.preventDefault();
      var n = parseInt(show.digits, 10);
      show.digits = "";
      if (n >= 1 && n <= N) { leaveEndScreen(); showGo(n - 1, n - 1 >= show.i ? 1 : -1); }
      return;
    }
    switch (k) {
      case "ArrowRight": case "ArrowDown": case "PageDown": case " ": case "Enter": case "n": case "N":
        e.preventDefault(); showNext(); break;
      case "ArrowLeft": case "ArrowUp": case "PageUp": case "Backspace": case "p": case "P":
        e.preventDefault(); showPrev(); break;
      case "Home":
        e.preventDefault(); leaveEndScreen(); showGo(0, -1); break;
      case "End":
        e.preventDefault(); leaveEndScreen(); showGo(N - 1, 1); break;
      case "Escape": case "-":
        e.preventDefault(); endShow(); break;
      case "b": case "B": case ".":
        e.preventDefault(); blankScreen("black"); break;
      case "w": case "W": case ",":
        e.preventDefault(); blankScreen("white"); break;
      case "F5":
        e.preventDefault(); break;
    }
  }

  function initShow() {
    showEl.addEventListener("click", function (e) {
      if (show.suppressClick) { show.suppressClick = false; return; }
      if (e.button !== 0 || e.target.closest("a, button, .pp-rehearse")) return;
      if (show.blank) { unblank(); return; }
      if (show.end) { endShow(); return; }
      showNext();
    });
    showEl.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      showMenu(null, { x: e.clientX, y: e.clientY });
    });
    showEl.addEventListener("mousemove", wake);

    // Swipes on touch screens: left = next, right = previous.
    showEl.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      show.touch = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    showEl.addEventListener("pointerup", function (e) {
      var t = show.touch;
      if (!t || e.pointerId !== t.id) return;
      show.touch = null;
      var dx = e.clientX - t.x, dy = e.clientY - t.y;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        show.suppressClick = true;
        setTimeout(function () { show.suppressClick = false; }, 450);
        if (dx < 0) showNext(); else showPrev();
      }
    });
    showEl.addEventListener("pointercancel", function () { show.touch = null; });

    // The mouse wheel moves through the slides.
    var lockUntil = 0;
    showEl.addEventListener("wheel", function (e) {
      e.preventDefault();
      var now = Date.now();
      if (now < lockUntil || Math.abs(e.deltaY) < 4) return;
      lockUntil = now + 320;
      if (e.deltaY > 0) showNext(); else showPrev();
    }, { passive: false });

    strip.addEventListener("click", function (e) {
      var b = e.target.closest("[data-show]");
      if (!b) return;
      var a = b.getAttribute("data-show");
      if (a === "prev") showPrev();
      else if (a === "next") showNext();
      else if (a === "end") endShow();
      else if (a === "menu") showMenu(b);
    });
    rehearseEl.addEventListener("click", function (e) {
      if (e.target.closest("[data-show='next']")) showNext();
    });
  }

  // ======================================================================
  // Keyboard, hash, balloon, start-up
  // ======================================================================
  function onKey(e) {
    var f5 = e.key === "F5" && !e.ctrlKey && !e.metaKey && !e.altKey;
    if (f5) e.preventDefault();                                     // F5 never reloads the page here
    if (document.querySelector(".xp-modal")) return;              // an XP dialog box has the keyboard
    var startOpen = document.querySelector(".xp-startmenu.is-open");
    if (show.on) { if (!startOpen) showKeys(e); return; }
    if (f5) {
      startShow(e.shiftKey ? state.current : 0);
      return;
    }
    if (e.key === "F1") { e.preventDefault(); showHelp(); return; }
    if (startOpen || menuEl) return;
    if (!omenu.hidden) { officeMenuKeys(e); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) { e.preventDefault(); say("save"); return; }
    var t = e.target;
    if (t.closest && (t.closest("input, select, textarea, [contenteditable]") || t.closest("#pp-thumbs, #pp-outline, #pp-sorter, #pp-tabs, .pp-menu"))) return;
    if (win.hidden || win.classList.contains("is-minimized") || state.view !== "normal") return;
    var inChrome = t.closest && t.closest(".pp-ribbon, .pp-qat, .pp-status, .pp-side-tabs, .xp-taskbar, .xp-icons");
    if (e.key === "PageDown" || (!inChrome && e.key === "ArrowDown")) { e.preventDefault(); select(state.current + 1, { user: true }); }
    else if (e.key === "PageUp" || (!inChrome && e.key === "ArrowUp")) { e.preventDefault(); select(state.current - 1, { user: true }); }
    else if (!inChrome && e.key === "Home") { e.preventDefault(); select(0, { user: true }); }
    else if (!inChrome && e.key === "End") { e.preventDefault(); select(N - 1, { user: true }); }
  }

  // Read the URL hash (#slide-3, #show-5, #end, #tab-home, ...). Returns true if a show started.
  function applyHash() {
    var raw = (location.hash || "").replace(/^#/, "");
    try { raw = decodeURIComponent(raw); } catch (e) { /* keep raw */ }
    raw = raw.toLowerCase();
    if (!raw) return false;
    var showing = false;
    raw.split(/[+&,]/).forEach(function (tok) {
      var m;
      if ((m = /^tab-([a-z-]+)$/.exec(tok))) selectTab(m[1].replace(/-/g, ""));
      else if ((m = /^slide-?(\d+)$/.exec(tok))) { if (show.on) endShow(); select(+m[1] - 1); }
      else if ((m = /^show(?:-(\d+))?$/.exec(tok))) { startShow(m[1] ? +m[1] - 1 : 0); showing = true; }
      else if (tok === "end") { startShow(N - 1); showEndScreen(); showing = true; }
      else if (tok === "sorter") setView("sorter");
      else if (tok === "normal") setView("normal");
      else if (tok === "outline") setPane("outline");
      else if (tok === "slides") setPane("slides");
      else if (tok === "menu") openOfficeMenu();
      else if (tok === "about") XP.about();
      else if (tok === "motion") document.documentElement.classList.add("motion-on");
      else if (U.page(tok)) {
        var i = firstSlideOf(tok);
        if (i >= 0) { if (show.on) showGo(i, 1); else select(i); }
      }
    });
    return showing;
  }

  // The welcome balloon, pointing at From Beginning. It stops appearing once the visitor has
  // started a slide show (localStorage), so it shows on a first visit and until it has done its job.
  function welcome() {
    if (tipSeen()) return;
    setTimeout(function () {
      var hero = $("pp-hero");
      if (show.on || tipSeen() || state.tab !== "slideshow" || state.view !== "normal" || !omenu.hidden ||
          document.querySelector(".xp-modal") || !hero || !hero.offsetWidth) return;
      XP.balloon({
        title: "Welcome to " + P.name + "'s presentation",
        // <strong>, not <b>: the shell styles a balloon's <b> as its title line.
        html: "Click <strong>From Beginning</strong> (or press <strong>F5</strong>) to start the slide show.<br>" +
          (isSmall() ? "Or tap a slide below to look around." : "Or click a slide on the left to look around."),
        timeout: 18000,
        onClick: function () { startShow(0); }
      });
      var b = document.querySelector(".xp-balloon");
      if (b) { b.classList.add("pp-balloon"); placeBalloon(); }
    }, 1300);
  }
  function placeBalloon() {
    var b = document.querySelector(".xp-balloon.pp-balloon");
    if (!b) return;
    var hero = $("pp-hero");
    var r = hero && hero.getBoundingClientRect();
    if (!r || !r.width || win.hidden || win.classList.contains("is-minimized") || state.tab !== "slideshow" || show.on ||
        state.view !== "normal" || !omenu.hidden) {
      XP.closeBalloon();
      return;
    }
    var bw = b.offsetWidth;
    var ax = r.left + r.width / 2;                       // point at the middle of the button
    var left = Math.max(8, Math.min(window.innerWidth - bw - 8, ax - 34));
    b.style.left = left + "px";
    b.style.top = Math.round(r.bottom + 12) + "px";
    b.style.setProperty("--pp-arrow-x", Math.round(ax - left - 11) + "px");
    if (balloonCovers(document.activeElement)) XP.closeBalloon();
  }

  // A balloon must never hide the control that has the keyboard focus (WCAG 2.4.11). Any place
  // where the welcome balloon can point at From Beginning covers something focusable (below it the
  // Slides | Outline tabs and the first slide; beside it the other ribbon buttons; on a phone the
  // slide), so instead it goes as soon as focus lands on something underneath it.
  function balloonCovers(el) {
    var b = document.querySelector(".xp-balloon");
    if (!b || !el || el === document.body || el === document.documentElement || b.contains(el)) return false;
    var r = el.getBoundingClientRect(), q = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.right > q.left && r.left < q.right && r.bottom > q.top && r.top < q.bottom;
  }
  function initBalloonFocus() {
    document.addEventListener("focusin", function (e) { if (balloonCovers(e.target)) XP.closeBalloon(); });
  }

  // From Beginning pulses when the page opens (powerpoint.css), twice, under five seconds (WCAG
  // 2.2.2). Then it rests, lit but still, and stays so: also once the visitor has pointed at it,
  // focused it or started a show (hover and focus still make it hop).
  function settleHero() {
    var hero = $("pp-hero");
    if (hero) hero.classList.add("is-settled");
  }
  function initHero() {
    var hero = $("pp-hero");
    if (!hero) return;
    hero.addEventListener("animationend", function (e) { if (e.animationName === "pp-pulse") settleHero(); });
    hero.addEventListener("pointerenter", settleHero);
    hero.addEventListener("focus", settleHero);
  }

  // Put the named icons into elements marked data-pp-icon="name" (status bar, panes).
  function fillIcons() {
    each(document.querySelectorAll("[data-pp-icon]"), function (el) {
      el.insertAdjacentHTML("afterbegin", icon(el.getAttribute("data-pp-icon")));
    });
  }

  function initChrome() {
    // Tab row extras: the one-click routes to the classic site and the CV, and Help.
    var classic = $("pp-link-classic"), cv = $("pp-link-cv");
    classic.href = U.url("classic/index.html");
    cv.href = U.url(P.links.cv);
    $("pp-help").innerHTML = XP.icon("help");
    $("pp-help").addEventListener("click", showHelp);

    // Office button.
    orb.addEventListener("click", function (e) {
      if (omenu.hidden) openOfficeMenu(e.detail === 0);   // detail 0 = keyboard: focus the first item
      else closeOfficeMenu();
    });
    orb.setAttribute("data-tip-title", "Office Button");
    orb.setAttribute("data-tip", "Open, save, print or share: the CV, email, photography, the blog and the classic website.");

    // Slides | Outline tabs.
    $("pp-side-tab-slides").addEventListener("click", function () { setPane("slides"); });
    $("pp-side-tab-outline").addEventListener("click", function () { setPane("outline"); });
    $("pp-side-tabs").addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        setPane(state.pane === "slides" ? "outline" : "slides");
        $(state.pane === "slides" ? "pp-side-tab-slides" : "pp-side-tab-outline").focus();
      }
    });

    // Status bar: views and zoom.
    each(document.querySelectorAll(".pp-view-btn"), function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-view");
        if (v === "show") startShow(state.current); else setView(v);
      });
    });
    zoomRange.addEventListener("input", function () { setZoom(+zoomRange.value); });
    each(document.querySelectorAll("[data-zoom]"), function (b) {
      b.addEventListener("click", function () {
        var z = b.getAttribute("data-zoom");
        var cur = state.zoom || Math.round(parseFloat(stage.style.getPropertyValue("--pp-slide-w")) / SLIDE_PX * 100) || 70;
        if (z === "fit") setZoom(0);
        else setZoom(Math.round(cur / 10) * 10 + (z === "+" ? 10 : -10));
      });
    });
    zoomPct.addEventListener("click", function () { zoomMenu(zoomPct); });

    // Closing every popup on a click elsewhere.
    document.addEventListener("pointerdown", function (e) {
      if (menuEl && !menuEl.contains(e.target) && !(menuAnchor && menuAnchor.contains(e.target))) {
        if (show.on && showEl.contains(e.target)) {
          show.suppressClick = true;      // this click only closes the menu
          setTimeout(function () { show.suppressClick = false; }, 450);
        }
        closeMenu();
      }
      if (!omenu.hidden && !omenu.contains(e.target) && !orb.contains(e.target)) closeOfficeMenu();
    }, true);

    // The window: closing, minimising and restoring.
    win.addEventListener("xp:restore", function () { if (show.on) endShow(); relayout(); });
    win.addEventListener("xp:maximize", relayout);
    win.addEventListener("xp:minimize", function () { closeOfficeMenu(); closeMenu(); hideTip(); placeBalloon(); });
    win.addEventListener("xp:close", function () {
      closeOfficeMenu(); closeMenu(); hideTip();
      XP.balloon({
        title: DOC + " was closed",
        text: isSmall() ? "Tap start, then any page, to open it again." : "Double-click " + DOC + " on the desktop (or click here) to open it again.",
        timeout: 10000,
        onClick: openWindow
      });
    });
  }

  function relayout() {
    layoutEditor();
    fitRibbon();
    revealTab();
    placeBalloon();
    updateScrollbar();
  }

  function init() {
    document.body.insertAdjacentHTML("afterbegin", window.PP_ICON_DEFS);
    var title = DOC + " - " + APP_NAME;
    document.title = title;
    win.setAttribute("data-title", title);
    if (window.PP_H1) $("pp-h1").textContent = fill(window.PP_H1);   // the page's heading (screen readers)

    fillIcons();
    buildDesktopIcons();
    buildQAT();
    buildRibbon();
    buildThumbs();

    // about: the "i" beside Help in the tray (ribbon.js, PP_ABOUT).
    XP.init({ version: "powerpoint", onNavigate: goPage, help: HELP_HTML, about: window.PP_ABOUT });

    initChrome();
    initScrollbar();
    initWheel();
    initStageSwipe();
    initSplitter();
    initShow();
    initLivePreview();
    initHero();
    initBalloonFocus();
    bindTips();

    selectTab(state.tab);
    updateIndicators();
    setColorMode("color");
    setView("normal");
    setZoom(0);
    select(0);

    // Keep everything sized as windows move, maximise and resize.
    if (window.ResizeObserver) {
      new ResizeObserver(function () { layoutEditor(); }).observe(stage);
      new ResizeObserver(function () { fitRibbon(); placeBalloon(); }).observe(ribbonEl);
      new ResizeObserver(layoutShow).observe(showEl);
      new ResizeObserver(updateScrollbar).observe($("pp-sb-track"));
    }
    window.addEventListener("resize", relayout);
    new MutationObserver(placeBalloon).observe(win, { attributes: true, attributeFilter: ["style", "class"] });

    window.addEventListener("keydown", onKey, true);
    window.addEventListener("hashchange", applyHash);

    if (!applyHash()) welcome();
  }

  init();
})();
