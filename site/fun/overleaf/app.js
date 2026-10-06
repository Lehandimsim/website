/* ==========================================================================
   fun/overleaf/app.js — V4, the Overleaf version: the website's LaTeX in an
   Overleaf-style editor on the XP desktop. Visitors edit the .tex files and
   press Recompile; History lists what each recompile changed; refreshing the
   page brings back the original (nothing is stored in the browser, and
   nothing is sent anywhere: Lehan, 2026-10-06).

   Uses: Deck (shared/slides/deck.js)   TexGen (tex-generate.js)
         TexParse (tex-parse.js)        TexEditor (tex-editor.js)
         EditLog (edit-log.js)          XP (shared/xp/xp.js)

   Sections: icons · state · desktop · file tree · editor · compile and
   preview · logs · history · menus and dialogs ·
   splitters · phone panes · deep links · start-up.

   Deep links (location.hash):
     #main #home #research #talks #experience #cv #art   open that file
     #paper-1 #paper-2 #teaching #awards #end ...        open the file that holds
                   that frame (its label) and show it in the preview
     #demo-edit    make a sample edit, recompile, show History (the log)
     #demo-error   break research.tex, recompile, show the Logs (errors)
     #history      open History

   The preview draws the slides like beamer's Madrid theme: madrid.js and
   the "Madrid" section of overleaf.css.
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil, SITE = window.SITE, P = SITE.person;
  var WRITING = (SITE.art && SITE.art.writing) || {};
  function $(id) { return document.getElementById(id); }
  function esc(s) { return U.esc(s); }
  var reduced = U.prefersReducedMotion();
  var phoneMQ = window.matchMedia ? matchMedia("(max-width: 700px)") : { matches: false };
  function isPhone() { return phoneMQ.matches; }

  // ======================================================================
  // Icons (16 x 16 line drawings, currentColor)
  // ======================================================================
  var S = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">';
  var ICO = {
    menu: S + '<path d="M2.5 4h11M2.5 8h11M2.5 12h11"/></svg>',
    home: S + '<path d="M2.5 7.5 8 3l5.5 4.5M4 6.6V13h3V9.6h2V13h3V6.6"/></svg>',
    globe: S + '<circle cx="8" cy="8" r="5.8"/><path d="M2.2 8h11.6M8 2.2c1.8 1.6 2.6 3.6 2.6 5.8S9.8 12.2 8 13.8M8 2.2C6.2 3.8 5.4 5.8 5.4 8s.8 4.2 2.6 5.8"/></svg>',
    pdf: S + '<path d="M4 1.8h5.5L12.5 5v9.2H4z"/><path d="M9.5 1.8V5h3M6 8.5h4.5M6 11h3"/></svg>',
    scholar: S + '<path d="M8 3 1.5 6 8 9l6.5-3z"/><path d="M4 7.4V11c0 1.1 1.8 2 4 2s4-.9 4-2V7.4M14.5 6v4"/></svg>',
    review: S + '<path d="M2.5 13.5h3l7.6-7.6-3-3-7.6 7.6z"/><path d="m9 4 3 3"/></svg>',
    share: S + '<circle cx="6" cy="5.5" r="2.5"/><path d="M1.8 13.5c.5-2.4 2.2-3.8 4.2-3.8s3.7 1.4 4.2 3.8M12.5 6v4M10.5 8h4"/></svg>',
    history: S + '<path d="M2.6 8a5.4 5.4 0 1 0 1.6-3.8"/><path d="M2.4 2.6v2.6H5M8 5v3.2l2.2 1.4"/></svg>',
    layout: S + '<rect x="2" y="3" width="12" height="10" rx="1.2"/><path d="M6 3v10M10 3v10"/></svg>',
    chat: S + '<path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2z"/></svg>',
    recompile: S + '<path d="M13 8a5 5 0 1 1-1.5-3.6"/><path d="M13 2.6v3.2H9.8"/></svg>',
    caret: S + '<path d="m4.5 6.5 3.5 3.5 3.5-3.5"/></svg>',
    logs: S + '<path d="M4 1.8h8v12.4H4z"/><path d="M6 5h4M6 7.5h4M6 10h2.5"/></svg>',
    download: S + '<path d="M8 2.5v7.5M5 7.5 8 10.5l3-3M3 13.5h10"/></svg>',
    minus: S + '<path d="M3.5 8h9"/></svg>',
    plus: S + '<path d="M8 3.5v9M3.5 8h9"/></svg>',
    tex: S + '<path d="M4 1.8h5.5L12.5 5v9.2H4z"/><path d="M9.5 1.8V5h3"/></svg>',
    folder: S + '<path d="M1.8 4.2h4.4l1.4 1.5h6.6v7.6H1.8z"/></svg>',
    image: S + '<rect x="2" y="3" width="12" height="10" rx="1"/><circle cx="5.8" cy="6.5" r="1.2"/><path d="m2.5 12 3.8-3.6 2.7 2.4 1.9-1.6 2.6 2.5"/></svg>',
    right: S + '<path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg>',
    left: S + '<path d="M13 8H4M7.5 4.5 4 8l3.5 3.5"/></svg>',
    close: S + '<path d="m4 4 8 8M12 4l-8 8"/></svg>',
    restore: S + '<path d="M3 8a5 5 0 1 0 1.5-3.6"/><path d="M3 2.6v3.2h3.2"/></svg>',
    link: S + '<path d="M6.8 9.2a3 3 0 0 0 4.2 0l2-2a3 3 0 0 0-4.2-4.2l-.8.8"/><path d="M9.2 6.8a3 3 0 0 0-4.2 0l-2 2a3 3 0 0 0 4.2 4.2l.8-.8"/></svg>',
    list: S + '<path d="M6 4h7.5M6 8h7.5M6 12h7.5"/><path d="M2.6 4h.8M2.6 8h.8M2.6 12h.8" stroke-width="2.2"/></svg>',
    check: S + '<path d="m3.5 8.5 3 3 6-7"/></svg>',
    warn: S + '<path d="M8 2.2 14.2 13H1.8z"/><path d="M8 6.5v3M8 11.3v.2"/></svg>',
    help: S + '<circle cx="8" cy="8" r="5.8"/><path d="M6.3 6.3a1.8 1.8 0 1 1 2.5 1.7c-.5.2-.8.6-.8 1.1v.4M8 11.4v.2"/></svg>',
    keyboard: S + '<rect x="1.8" y="4" width="12.4" height="8" rx="1"/><path d="M4 6.5h.5M6.5 6.5H7M9 6.5h.5M11.5 6.5h.5M4.5 9.5h7"/></svg>',
    count: S + '<path d="M3 4h10M3 8h10M3 12h6"/></svg>',
    camera: S + '<path d="M2 5h3l1.2-1.8h3.6L11 5h3v8H2z"/><circle cx="8" cy="9" r="2.4"/></svg>',
    pen: S + '<path d="M3 13l1-3.5 7-7 2.5 2.5-7 7z"/></svg>'
  };
  function ico(name, cls) {
    if (name === "leaf") return XP.icon("overleaf", "ol-ico");
    var svg = ICO[name] || "";
    return svg.replace("<svg ", '<svg class="ol-ico' + (cls ? " " + cls : "") + '" aria-hidden="true" focusable="false" ');
  }
  function fillIcons(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-ico]"), function (el) {
      el.innerHTML = ico(el.getAttribute("data-ico"));
      el.removeAttribute("data-ico");
    });
  }

  // ======================================================================
  // State. Everything lives in memory only: no localStorage, no cookies.
  // ======================================================================
  var state = {
    files: {},           // file name -> current text
    original: {},        // file name -> text when the page loaded
    order: [],           // .tex files, in tree order
    images: [],          // [{ name: "images/x.jpg", src: "assets/img/x.jpg", alt }]
    imageMap: {},        // images/x.jpg -> assets/img/x.jpg (for the parser)
    current: null,       // the file open in the editor
    views: {},           // per file: caret and scroll position
    good: null,          // the last compile that worked (what the preview shows)
    last: null,          // the last compile, good or not
    notes: [],           // typesetting notes measured in the preview (overfull slides)
    history: [],         // recompiles that changed something, newest first
    lastLogged: null,    // the files as they were at the last logged recompile
    compiling: false,
    dirty: false,        // edited since the last recompile
    hinted: false,       // the "now press Recompile" tip has been shown
    zoom: "fit",
    routedPage: null,    // a deep link to one frame (#paper-1): its page
    logsAuto: false      // the logs were opened by an error, not by the visitor
  };
  var editor;            // TexEditor
  var booting = true;    // during start-up, scroll without animation

  var el = {};
  ["ol-app", "ol-main", "ol-tree", "ol-outline", "ol-crumb", "ol-fmt", "ol-code", "ol-imageview", "ol-imageview-img",
    "ol-imageview-cap", "ol-pdf", "ol-pages", "ol-errorbar", "ol-logs", "ol-history", "ol-logs-btn", "ol-badge-errors",
    "ol-badge-warnings", "ol-pagecount", "ol-zoom", "ol-toast", "ol-menu", "ol-menu-btn", "ol-compile-menu",
    "ol-recompile-more", "ol-layout-menu", "ol-layout-btn", "ol-history-btn", "ol-window"].forEach(function (id) {
    el[id.replace(/^ol-/, "").replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); })] = $(id);
  });

  function isImage(name) { return /^images\//.test(name); }
  function base(name) { return name.replace(/\.tex$/, ""); }

  // ======================================================================
  // Desktop icons (before XP.init, which wires them up)
  // ======================================================================
  function buildDesktop() {
    var L = P.links;
    function item(tag, attrs, icon, label) {
      return "<" + tag + ' class="xp-icon" ' + attrs + (tag === "button" ? ' type="button"' : "") + ">" +
        XP.icon(icon) + "<span>" + esc(label) + "</span></" + tag + ">";
    }
    $("ol-desktop-icons").innerHTML = [
      item("button", 'data-open="ol-window" title="Open the LaTeX editor"', "overleaf", "lehanzhang.tex"),
      item("a", 'href="' + esc(U.url("classic/index.html")) + '" title="The classic, text-only website"', "globe", "Classic website"),
      item("a", 'href="' + esc(U.url(L.cv)) + '" target="_blank" rel="noopener"', "cv", "My CV.pdf"),
      item("a", U.linkAttrs(L.photography), "camera", "Photography"),
      item("a", U.linkAttrs(L.blog) + ' title="' + esc(WRITING.linkLabel || "Blog") + '"', "notepad", "Blog"),
      item("a", 'href="' + esc(U.url("index.html")) + '" title="Choose the classic or the fun website"', "home", "Start page"),
      item("button", 'id="ol-recycle"', "recycle", "Recycle Bin")
    ].join("");
    $("ol-home-link").href = U.url("index.html");
    $("ol-classic-link").href = U.url("classic/index.html");
    $("ol-cv-link").href = U.url(L.cv);
  }

  // ======================================================================
  // File tree and outline
  // ======================================================================
  function buildTree() {
    var html = "";
    state.order.forEach(function (name) {
      html += '<li><button type="button" class="ol-file" data-file="' + esc(name) + '">' + ico("tex") +
        '<span class="ol-file-name">' + esc(name) + "</span>" +
        (name === "main.tex" ? '<span class="ol-file-main" title="The main document: it \\input\'s the others">main</span>' : "") +
        '<span class="ol-file-dot" hidden title="Edited (differs from the original)"></span><span class="ol-sr ol-file-edited" hidden>(edited)</span></button></li>';
    });
    if (state.images.length) {
      html += '<li><button type="button" class="ol-file" data-folder="images" aria-expanded="true">' +
        '<span class="ol-folder-caret">' + ico("caret") + "</span>" + ico("folder") + '<span class="ol-file-name">images</span></button><ul id="ol-images-folder">';
      state.images.forEach(function (im) {
        html += '<li><button type="button" class="ol-file ol-file--child" data-file="' + esc(im.name) + '">' + ico("image") +
          '<span class="ol-file-name">' + esc(im.name.split("/").pop()) + "</span></button></li>";
      });
      html += "</ul></li>";
    }
    el.tree.innerHTML = html;
  }

  function markTree() {
    Array.prototype.forEach.call(el.tree.querySelectorAll("[data-file]"), function (b) {
      var name = b.getAttribute("data-file");
      if (name === state.current) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      var edited = !isImage(name) && state.files[name] !== state.original[name];
      var dot = b.querySelector(".ol-file-dot"), sr = b.querySelector(".ol-file-edited");
      if (dot) dot.hidden = !edited;
      if (sr) sr.hidden = !edited;
    });
  }

  // Frames of the current file (or main.tex's \input list), from the text itself.
  function outline() {
    var list = [];
    if (!state.current || isImage(state.current)) return list;
    var lines = state.files[state.current].split("\n");
    if (state.current === "main.tex") {
      lines.forEach(function (l, i) {
        var m = /^\s*\\input\{([^}]+)\}/.exec(l);
        if (m) list.push({ label: m[1] + ".tex", file: m[1].replace(/\.tex$/, "") + ".tex", line: i + 1 });
      });
      return list;
    }
    for (var i = 0; i < lines.length; i++) {
      if (!/^\s*\\begin\{frame\}/.test(lines[i])) continue;
      var title = "", m2 = /\\begin\{frame\}(?:\[[^\]]*\])?\{([^}]*)\}/.exec(lines[i]);
      if (m2) title = m2[1];
      for (var j = i + 1; !title && j < lines.length && !/\\end\{frame\}/.test(lines[j]); j++) {
        var t = /\\(?:frametitle|bigtitle)\{(.*)\}/.exec(lines[j]);
        if (t) title = t[1];
      }
      list.push({ label: plainTex(title) || "(untitled frame)", line: i + 1 });
    }
    return list;
  }
  function plainTex(s) {
    return String(s).replace(/\\(textbf|emph|textit)\{([^}]*)\}/g, "$2").replace(/\\[a-zA-Z]+\{\}/g, "")
      .replace(/\\([&%$#_])/g, "$1").replace(/\\[a-zA-Z]+/g, "").replace(/[{}]/g, "").replace(/--/g, "\u2013").trim();
  }
  var outlineTimer;
  function renderOutline() {
    var items = outline();
    el.outline.innerHTML = items.length ? items.map(function (o) {
      return '<li><button type="button" data-line="' + o.line + '"' + (o.file ? ' data-file="' + esc(o.file) + '"' : "") + ">" + esc(o.label) + "</button></li>";
    }).join("") : '<li class="ol-outline-empty">' + (state.current && isImage(state.current) ? "A picture." : "No frames in this file.") + "</li>";
  }

  // ======================================================================
  // Opening files
  // ======================================================================
  function openFile(name, opts) {
    opts = opts || {};
    if (state.files[name] == null && !state.imageMap[name]) return;
    if (state.current && !isImage(state.current) && editor) state.views[state.current] = editor.getView();
    state.current = name;
    if (isImage(name)) showImage(name);
    else {
      el.imageview.hidden = true;
      el.code.hidden = false;
      el.fmt.removeAttribute("aria-disabled");
      editor.setText(state.files[name], name, state.views[name]);
      applyMarkers();
    }
    el.crumb.innerHTML = '<span>lehanzhang.com</span> / <b>' + esc(name) + "</b>";
    markTree();
    renderOutline();
    if (opts.preview !== false) scrollToFile(name);
    if (opts.hash !== false) setHash(isImage(name) ? "" : base(name));
    if (opts.pane) setPane(opts.pane);
    if (opts.focus && !isImage(name)) editor.focus();
  }

  function showImage(name) {
    var src = state.imageMap[name];
    var im = state.images.filter(function (x) { return x.name === name; })[0] || {};
    el.code.hidden = true;
    el.imageview.hidden = false;
    el.fmt.setAttribute("aria-disabled", "true");
    var img = el.imageviewImg;
    img.alt = im.alt || "";
    img.onload = function () {
      var users = [];
      if (state.good) state.good.slides.forEach(function (s, i) {
        if (s.image && s.image.src === src) users.push(state.good.sources[i].file + " (page " + (i + 1) + ")");
      });
      el.imageviewCap.innerHTML = "<code>" + esc(name) + "</code> &middot; " + img.naturalWidth + " &times; " + img.naturalHeight + " px" +
        (users.length ? "<br>Used in " + esc(users.join(", ")) : "") +
        (im.alt ? "<br>Alt text: " + esc(im.alt) : "") +
        "<br>In LaTeX: <code>\\includegraphics{" + esc(name) + "}</code>";
    };
    img.src = U.url(src);
  }

  function setHash(h) {
    try { history.replaceState(null, "", h ? "#" + h : location.pathname + location.search); } catch (e) { /* file:// in some browsers */ }
  }

  // ======================================================================
  // Editing
  // ======================================================================
  function onChange(text) {
    if (!state.current || isImage(state.current)) return;
    state.files[state.current] = text;
    if (!state.dirty) { state.dirty = true; updateDirty(); }
    if (!state.hinted) {                       // the very first edit: say what to do next
      state.hinted = true;
      toast("Now press Recompile (or Ctrl+Enter) to see your change.", "recompile");
    }
    markTree();
    clearTimeout(outlineTimer);
    outlineTimer = setTimeout(renderOutline, 400);
  }

  function updateDirty() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-recompile]"), function (b) {
      b.classList.toggle("is-dirty", state.dirty);
      b.title = state.dirty ? "You have changes: Recompile to see them (Ctrl+Enter)" : "Recompile (Ctrl+Enter)";
    });
  }

  function applyMarkers() {
    if (!editor || !state.last || !state.current || isImage(state.current)) return;
    var list = state.last.errors.concat(state.last.warnings).filter(function (e) { return e.file === state.current; });
    editor.setMarkers(list.map(function (e) { return { line: e.line, level: e.level, message: e.message }; }));
  }

  // ======================================================================
  // Compile and preview
  // ======================================================================
  function setBusy(on) {
    // Not "disabled": that would drop the keyboard focus. Clicks are ignored while compiling.
    Array.prototype.forEach.call(document.querySelectorAll("[data-recompile]"), function (b) {
      b.classList.toggle("is-busy", on);
      b.setAttribute("aria-busy", String(on));
      var label = b.querySelector(".ol-recompile-label") || b.querySelector("span:last-child");
      if (label) label.textContent = on ? "Compiling\u2026" : "Recompile";
    });
  }

  // The real work: parse every file, show the result. Returns the result.
  function compileNow(first) {
    var res = TexParse.compile(state.files, { images: state.imageMap });
    state.last = res;
    if (res.ok) {
      state.good = res;
      renderPreview(res, !first);
      el.errorbar.hidden = true;
      if (state.logsAuto) toggleLogs(false);
      placeLogs();
    } else {
      showErrorBar(res);
      toggleLogs(true, true);
    }
    renderLogs();
    applyMarkers();
    state.dirty = false;
    updateDirty();
    return res;
  }

  function recompile(opts) {
    opts = opts || {};
    if (state.compiling) return;
    state.compiling = true;
    setBusy(true);
    setTimeout(function () {
      var res = compileNow(false);
      state.compiling = false;
      setBusy(false);
      if (opts.log !== false) U.track("overleaf_recompiled", { ok: !!res.ok });
      if (opts.log !== false) logEdits(res);
      if (isPhone() && !opts.stay) setPane("preview");
      if (res.ok && !opts.done) revealEdited();
      if (opts.done) opts.done(res);
    }, reduced || opts.instant ? 0 : 450);
  }

  // After a recompile, bring the frame being edited into view (if it is not).
  function revealEdited() {
    if (!state.good || !state.current || isImage(state.current) || !editor) return;
    var line = editor.currentLine(), best = -1;
    state.good.sources.forEach(function (s, i) {
      if (s.file === state.current && s.line <= line && (best < 0 || s.line >= state.good.sources[best].line)) best = i;
    });
    if (best < 0) return;
    var page = el.pages.children[best];
    if (!page) return;
    var r = page.getBoundingClientRect(), v = el.pdf.getBoundingClientRect();
    if (r.bottom < v.top + 40 || r.top > v.bottom - 40) scrollToPage(best, true);
  }

  function renderPreview(res, animate) {
    var keep = el.pdf.scrollTop;
    el.pages.innerHTML = "";
    state.notes = [];
    var n = res.slides.length;
    res.slides.forEach(function (s, i) {
      var page = document.createElement("div");
      page.className = "ol-page" + (animate ? " is-new" : "");
      page.setAttribute("role", "group");
      page.setAttribute("aria-label", "Page " + (i + 1) + " of " + n + ": " + U.plain(s.title || s.id));
      page.setAttribute("data-index", i);
      page.title = "Double-click to see the LaTeX for this page";
      page.appendChild(Madrid.render(s, { index: i, total: n, source: res.sources[i], footer: res.footer }));
      el.pages.appendChild(page);
    });
    Array.prototype.forEach.call(el.pages.querySelectorAll("img"), function (img) {
      img.addEventListener("error", function () { missingImage(img); });
    });
    applyZoom();
    el.pdf.scrollTop = keep;
    updatePageCount();
    requestAnimationFrame(measureOverflow);
  }

  // A picture that does not load: grey box + a warning in the logs.
  function missingImage(img) {
    var holder = img.parentNode;
    if (!holder || holder.querySelector(".ol-img-missing")) return;
    var src = img.getAttribute("src") || "";
    var name = src.replace(/^.*assets\/img\//, "images/");
    img.remove();
    var box = document.createElement("div");
    box.className = "ol-img-missing";
    box.textContent = name + " not found";
    holder.appendChild(box);
    var pageEl = holder.closest(".ol-page");
    if (!pageEl) return;
    var page = +pageEl.getAttribute("data-index");
    var srcInfo = state.good && state.good.sources[page];
    state.notes.push({ level: "warning", file: srcInfo ? srcInfo.file : "main.tex", line: srcInfo ? srcInfo.line : 1,
      message: "LaTeX Error: File `" + name + "' not found.", hint: "There is no such picture in the images folder.", context: "" });
    renderLogs();
  }

  // Slides whose contents run past the bottom of the frame: LaTeX reports
  // "Overfull \vbox". Measured again once the slide fonts have loaded.
  function measureOverflow() {
    if (!state.good || !el.pdf.offsetWidth) return;
    var before = state.notes.length;
    state.notes = state.notes.filter(function (x) { return x.kind !== "overfull"; });
    var changed = state.notes.length !== before;
    Array.prototype.forEach.call(el.pages.querySelectorAll(".slide"), function (slide, i) {
      var over = Madrid.overflow(slide);
      if (over > 0) {
        var src = state.good.sources[i];
        state.notes.push({ level: "note", kind: "overfull", file: src.file, line: src.line,
          message: "Overfull \\vbox (" + over.toFixed(2) + "pt too high) detected on page " + (i + 1) + ".",
          hint: "The text does not fit on the slide. Shorten it, or make it smaller: put \\footnotesize or \\scriptsize after \\frametitle.",
          context: "l." + src.line + " \\begin{frame}" });
        changed = true;
      }
    });
    if (changed) renderLogs();
  }

  function applyZoom() {
    var w, z = state.zoom, avail = el.pdf.clientWidth - 32;
    if (!avail || avail < 40) return;
    if (z === "fit") w = avail;
    else if (z === "height") w = Math.min(avail, (el.pdf.clientHeight - 30) * 16 / 9);
    else w = 605 * parseFloat(z);                       // 100% = 160 mm at 96 dpi, like a PDF viewer
    el.pages.style.setProperty("--ol-page-w", Math.max(140, Math.round(w)) + "px");
  }

  function pageInView() {
    var pages = el.pages.children, top = el.pdf.getBoundingClientRect().top, best = 0, bestDist = Infinity;
    for (var i = 0; i < pages.length; i++) {
      var r = pages[i].getBoundingClientRect();
      var d = Math.abs(r.top - top - 12);
      if (r.bottom > top + 40 && d < bestDist) { best = i; bestDist = d; }
    }
    return best;
  }
  function updatePageCount() {
    var n = el.pages.children.length;
    el.pagecount.textContent = n ? (pageInView() + 1) + " / " + n : "";
  }

  function scrollToPage(i, flash) {
    var page = el.pages.children[i];
    if (!page) return;
    var top = el.pdf.scrollTop + page.getBoundingClientRect().top - el.pdf.getBoundingClientRect().top - 12;
    if (el.pdf.scrollTo) el.pdf.scrollTo({ top: top, behavior: reduced || booting ? "auto" : "smooth" }); else el.pdf.scrollTop = top;
    if (flash) {
      page.classList.add("is-target");
      setTimeout(function () { page.classList.remove("is-target"); }, 1500);
    }
  }

  // The first page that comes from this file.
  function pageOfFile(name) {
    if (!state.good) return -1;
    if (name === "main.tex") return 0;
    if (isImage(name)) {
      var src = state.imageMap[name];
      for (var k = 0; k < state.good.slides.length; k++) if (state.good.slides[k].image && state.good.slides[k].image.src === src) return k;
      return -1;
    }
    for (var i = 0; i < state.good.sources.length; i++) if (state.good.sources[i].file === name) return i;
    return -1;
  }
  function scrollToFile(name) {
    var i = pageOfFile(name);
    if (i >= 0) scrollToPage(i, true);
  }

  // "SyncTeX": editor caret -> page, and page -> code.
  function syncToPdf() {
    if (!state.good || !state.current) return;
    var line = editor.currentLine(), best = -1;
    state.good.sources.forEach(function (s, i) {
      if (s.file === state.current && s.line <= line) {
        if (best < 0 || s.line >= state.good.sources[best].line) best = i;
      }
    });
    if (best < 0) best = pageOfFile(state.current);
    if (best >= 0) { if (isPhone()) setPane("preview"); scrollToPage(best, true); }
  }
  function syncToCode(i) {
    if (!state.good) return;
    var src = state.good.sources[i == null ? pageInView() : i];
    if (!src) return;
    openFile(src.file, { preview: false, pane: "source" });
    editor.goToLine(src.line);
  }

  // ======================================================================
  // Logs: the badge on the Logs button, the panel, the error bar
  // ======================================================================
  function renderLogs() {
    var res = state.last;
    if (!res) return;
    var errors = res.errors, warnings = res.warnings.concat(state.notes.filter(function (x) { return x.level === "warning"; }));
    var notes = res.notes.concat(state.notes.filter(function (x) { return x.level === "note"; }));
    $("ol-badge-errors").hidden = !errors.length;
    $("ol-badge-errors").textContent = errors.length;
    $("ol-badge-warnings").hidden = !warnings.length;
    $("ol-badge-warnings").textContent = warnings.length;
    el.logsBtn.setAttribute("aria-label", "Logs: " + errors.length + " error" + (errors.length === 1 ? "" : "s") + ", " +
      warnings.length + " warning" + (warnings.length === 1 ? "" : "s"));

    var head = '<div class="ol-logs-head">' + ico("logs") + "<span>Logs</span>" +
      (errors.length ? '<span class="ol-badge ol-badge--error">' + errors.length + " error" + (errors.length === 1 ? "" : "s") + "</span>" : "") +
      (warnings.length ? '<span class="ol-badge ol-badge--warning">' + warnings.length + " warning" + (warnings.length === 1 ? "" : "s") + "</span>" : "") +
      '<button type="button" class="ol-x" data-act="close-logs" aria-label="Close the logs">' + ico("close") + "</button></div>";
    var all = errors.concat(warnings, notes);
    var body = all.length ? '<div class="ol-log-list">' + all.map(logEntry).join("") + "</div>"
      : '<p class="ol-logs-empty"><b>No errors or warnings.</b> ' + res.slides.length + " pages compiled from " + res.filesRead.length + " files.</p>";
    var raw = '<details class="ol-rawlog"><summary>Raw logs</summary><pre>' + esc(res.log) + "</pre></details>";
    el.logs.innerHTML = head + body + raw;
  }
  function logEntry(e) {
    return '<article class="ol-log ol-log--' + esc(e.level) + '"><div class="ol-log-top"><span class="ol-log-msg">' + esc(e.message) +
      '</span><button type="button" class="ol-log-loc" data-file="' + esc(e.file) + '" data-line="' + e.line + '" title="Show this line">' +
      esc(e.file) + ", " + e.line + "</button></div>" + (e.context ? "<pre>" + esc(e.context) + "</pre>" : "") +
      (e.hint ? '<p class="ol-log-hint">' + esc(e.hint) + "</p>" : "") + "</article>";
  }

  function showErrorBar(res) {
    var n = res.errors.length;
    el.errorbar.innerHTML = ico("warn") + "<span><b>Compile failed: " + n + " error" + (n === 1 ? "" : "s") + ".</b> " +
      (state.good ? "The preview shows the last version that compiled." : "There is nothing to show yet.") +
      '</span><button type="button" data-act="open-logs">View logs</button>';
    el.errorbar.hidden = false;
  }

  function toggleLogs(on, auto) {
    if (on == null) on = el.logs.hidden;
    el.logs.hidden = !on;
    el.logsBtn.setAttribute("aria-pressed", String(on));
    state.logsAuto = on && !!auto;
    if (on) { toggleHistory(false); placeLogs(); }
  }
  // The logs panel starts just below the error bar (which wraps on narrow screens).
  function placeLogs() {
    el.logs.style.top = el.errorbar.hidden ? "0px" : el.errorbar.offsetHeight + "px";
  }

  // ======================================================================
  // History: what each recompile changed. Shown to the visitor only; nothing
  // is sent (Lehan, 2026-10-06).
  // ======================================================================
  function logEdits(res) {
    var files = EditLog.changes(state.files, state.original, state.order);
    var snapshot = JSON.stringify(state.files);
    if (!files.length) {
      toast(state.lastLogged ? "Recompiled: back to the original website." : "Recompiled. Nothing differs from the original yet.", "check");
      state.lastLogged = state.lastLogged ? snapshot : null;
      return;
    }
    if (snapshot === state.lastLogged) { toast("Recompiled. No new changes since the last recompile.", "check"); return; }
    state.lastLogged = snapshot;
    state.history.unshift({ n: state.history.length + 1, time: new Date(), files: files, ok: res.ok, errors: res.errors.length });
    renderHistory();
    toast("Recompiled. Your changes are in History.", "check");
  }

  function renderHistory() {
    var html = '<div class="ol-history-head">' + ico("history") + "<h2>History</h2>" +
      '<button type="button" class="ol-x" data-act="close-history" aria-label="Close History">' + ico("close") + "</button></div>" +
      '<p class="ol-history-intro">Every recompile is listed here with exactly what changed, line by line. ' +
      "Your edits stay in this browser tab and are not sent anywhere; refreshing the page restores the original website.</p>";
    html += '<div class="ol-history-list">';
    if (!state.history.length) {
      html += '<p class="ol-history-empty">No changes yet. Change something in a file and press <b>Recompile</b>: the change shows up here.</p>';
    }
    state.history.forEach(function (h, idx) {
      var added = 0, removed = 0;
      h.files.forEach(function (f) { added += f.added; removed += f.removed; });
      html += '<details class="ol-hist"' + (idx === 0 ? " open" : "") + "><summary>" +
        '<span class="ol-hist-time">' + pad(h.time.getHours()) + ":" + pad(h.time.getMinutes()) + ":" + pad(h.time.getSeconds()) + "</span>" +
        "<span>Recompile " + h.n + " &middot; " + h.files.length + " file" + (h.files.length === 1 ? "" : "s") +
        ' <span class="ol-add">+' + added + '</span> <span class="ol-del">&minus;' + removed + "</span></span>" +
        '<span class="ol-hist-tag' + (h.ok ? "" : " ol-hist-tag--fail") + '">' + (h.ok ? "compiled" : h.errors + " error" + (h.errors === 1 ? "" : "s")) + "</span></summary>";
      h.files.forEach(function (f) {
        html += '<div class="ol-hist-file"><h3>' + esc(f.name) + ' <span class="ol-add">+' + f.added + '</span><span class="ol-del">&minus;' + f.removed +
          '</span></h3><div class="ol-diff" role="group" aria-label="Changes in ' + esc(f.name) + '">' + diffHtml(f.diff) + "</div></div>";
      });
      html += "</details>";
    });
    html += "</div>" + '<div class="ol-history-foot"><button type="button" class="ol-btn" data-act="restore">' + "Restore original files</button></div>";
    el.history.innerHTML = html;
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function diffHtml(diff) {
    return diff.split("\n").slice(2).map(function (l) {
      var c = l.charAt(0) === "+" ? "d-add" : l.charAt(0) === "-" ? "d-del" : l.charAt(0) === "@" ? "d-hunk" : "d-ctx";
      var label = c === "d-add" ? "added: " : c === "d-del" ? "removed: " : "";
      return '<div class="' + c + '">' + (label ? '<span class="ol-sr">' + label + "</span>" : "") + esc(l || " ") + "</div>";
    }).join("");
  }

  function toggleHistory(on) {
    if (on == null) on = el.history.hidden;
    if (on) renderHistory();
    el.history.hidden = !on;
    el.historyBtn.setAttribute("aria-pressed", String(on));
    if (on) {
      if (!el.logs.hidden) toggleLogs(false);
      if (isPhone()) setPane("preview");
    }
  }

  // ======================================================================
  // Toast
  // ======================================================================
  var toastTimer;
  function toast(text, icon) {
    el.toast.innerHTML = ico(icon || "check") + "<span>" + esc(text) + "</span>";
    el.toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove("is-on"); }, 4200);
  }

  // ======================================================================
  // Menus and dialogs
  // ======================================================================
  function buildMenu() {
    var L = P.links;
    el.menu.innerHTML =
      "<h2>Download</h2>" +
      '<button type="button" class="ol-menu-item" data-act="print">' + ico("download") + "Print / Save as PDF</button>" +
      '<button type="button" class="ol-menu-item" data-act="download-file">' + ico("tex") + "This file (.tex)</button>" +
      "<h2>Actions</h2>" +
      '<button type="button" class="ol-menu-item" data-act="restore">' + ico("restore") + "Restore original files</button>" +
      '<button type="button" class="ol-menu-item" data-act="wordcount">' + ico("count") + "Word count</button>" +
      "<h2>Settings</h2>" +
      '<div class="ol-menu-row"><label for="ol-fontsize">Editor font size</label><select id="ol-fontsize">' +
        '<option value="12">12px</option><option value="13">13px</option><option value="14">14px</option><option value="15" selected>15px</option>' +
        '<option value="16">16px</option><option value="18">18px</option></select></div>' +
      '<p class="ol-menu-note">Compiler: this preview reads the LaTeX in your browser. The files are real beamer: they also compile with pdfLaTeX on overleaf.com.</p>' +
      "<h2>Help</h2>" +
      '<button type="button" class="ol-menu-item" data-act="help">' + ico("help") + "How this works</button>" +
      '<button type="button" class="ol-menu-item" data-act="keys">' + ico("keyboard") + "Keyboard shortcuts</button>" +
      "<h2>Lehan elsewhere</h2>" +
      '<a class="ol-menu-item" href="' + esc(U.url("classic/index.html")) + '">' + ico("globe") + "Classic website</a>" +
      (L.scholar ? '<a class="ol-menu-item" ' + U.linkAttrs(L.scholar) + ">" + ico("scholar") + "Google Scholar</a>" : "") +
      '<a class="ol-menu-item" href="' + esc(U.url(L.cv)) + '" target="_blank" rel="noopener">' + ico("pdf") + "CV (PDF)</a>" +
      '<a class="ol-menu-item" ' + U.linkAttrs(L.photography) + ">" + ico("camera") + "Photography</a>" +
      '<a class="ol-menu-item" ' + U.linkAttrs(L.blog) + ' title="' + esc(WRITING.linkLabel || "Blog") + '">' + ico("pen") + "Blog</a>" +
      '<a class="ol-menu-item" href="' + esc(U.url("index.html")) + '">' + ico("home") + "Start page</a>";
    $("ol-fontsize").addEventListener("change", function () {
      var px = +this.value;
      el.code.style.setProperty("--ol-code-font", px + "px");
      el.code.style.setProperty("--ol-code-lh", Math.round(px * 1.54) + "px");
    });
  }

  var openPop = null;     // the open menu or pop-up: { box, button }
  function closePop() {
    if (!openPop) return;
    openPop.box.hidden = true;
    if (openPop.button) openPop.button.setAttribute("aria-expanded", "false");
    var b = openPop.button;
    openPop = null;
    if (b && document.activeElement && document.activeElement.closest && document.activeElement.closest(".ol-menu, .ol-pop")) b.focus();
  }
  function showPop(box, button, html, place) {
    if (openPop && openPop.box === box) { closePop(); return; }
    closePop();
    if (html != null) box.innerHTML = html;
    box.hidden = false;
    button.setAttribute("aria-expanded", "true");
    if (place) {
      var a = el.app.getBoundingClientRect(), r = button.getBoundingClientRect();
      box.style.top = (r.bottom - a.top + 4) + "px";
      var left = r.left - a.left;
      box.style.left = Math.max(6, Math.min(left, a.width - box.offsetWidth - 6)) + "px";
    }
    openPop = { box: box, button: button };
    var first = box.querySelector("button, a, select");
    if (first) first.focus();
  }

  function compileMenu() {
    return '<button type="button" role="menuitem" data-act="recompile">' + ico("recompile") + "Recompile from scratch</button>" +
      '<button type="button" role="menuitem" data-act="restore">' + ico("restore") + "Restore original files</button><hr>" +
      "<p>Ctrl+Enter or Ctrl+S recompiles from the editor. History lists what each recompile changed.</p>";
  }
  function layoutMenu() {
    var m = el.main;
    function mark(on) { return '<span class="ol-check">' + (on ? "&#10003;" : "") + "</span>"; }
    var both = !m.classList.contains("is-editor-only") && !m.classList.contains("is-pdf-only");
    return '<button type="button" role="menuitem" data-layout="both">' + mark(both) + "Editor &amp; PDF</button>" +
      '<button type="button" role="menuitem" data-layout="editor">' + mark(m.classList.contains("is-editor-only")) + "Editor only</button>" +
      '<button type="button" role="menuitem" data-layout="pdf">' + mark(m.classList.contains("is-pdf-only")) + "PDF only</button><hr>" +
      '<button type="button" role="menuitem" data-layout="files">' + mark(!m.classList.contains("is-no-files")) + "File list</button>" +
      '<button type="button" role="menuitem" data-layout="reset">' + mark(false) + "Reset pane sizes</button>";
  }
  function setLayout(what) {
    var m = el.main;
    if (what === "both") { m.classList.remove("is-editor-only", "is-pdf-only"); }
    else if (what === "editor") { m.classList.remove("is-pdf-only"); m.classList.add("is-editor-only"); }
    else if (what === "pdf") { m.classList.remove("is-editor-only"); m.classList.add("is-pdf-only"); }
    else if (what === "files") m.classList.toggle("is-no-files");
    else if (what === "reset") { el.app.style.removeProperty("--ol-tree-w"); el.app.style.removeProperty("--ol-edit-w"); m.classList.remove("is-editor-only", "is-pdf-only", "is-no-files"); }
    closePop();
    splitAria();
    requestAnimationFrame(applyZoom);
  }

  var HELP =
    "<p><b>lehanzhang.com, written in LaTeX</b></p>" +
    "<p>This is Lehan Zhang's website as a LaTeX <i>beamer</i> slide deck, open in an Overleaf-style editor.</p>" +
    "<p><b>Left:</b> the files, one per page of the website. <b>Middle:</b> the LaTeX of the open file. <b>Right:</b> the slides it makes.</p>" +
    "<p>Change anything, then press the green <b>Recompile</b> button (or Ctrl+Enter); <b>History</b> shows what you changed. " +
    "Your edits stay in your browser: refresh the page to get the original website back.</p>" +
    "<p>Prefer a normal website? Use <b>Classic site</b> (top right) or the start menu.</p>";
  var KEYS =
    "<p><b>Keyboard shortcuts</b></p>" +
    "<p>Ctrl+Enter or Ctrl+S: recompile<br>Ctrl+B: bold &nbsp; Ctrl+I: italic<br>Ctrl+/: comment out the line<br>" +
    "Tab / Shift+Tab: indent / outdent<br>Escape, then Tab: leave the editor</p>" +
    "<p>Double-click a slide to jump to its LaTeX.</p>";

  function wordCount() {
    var res = state.good, words = 0;
    function count(t) { words += (U.plain(t || "").match(/[A-Za-z\u00c0-\u024f0-9]+(?:['\u2019][A-Za-z]+)?/g) || []).length; }
    function bullets(list) { (list || []).forEach(function (b) { if (typeof b === "string") count(b); else { count(b.text); bullets(b.sub); } }); }
    (res ? res.slides : []).forEach(function (s) {
      count(s.title); [].concat(s.subtitle || []).forEach(count);
      if (s.block) { count(s.block.title); count(s.block.text); }
      (s.paragraphs || []).forEach(count);
      bullets(s.bullets);
      (s.columns || []).forEach(function (c) { count(c.heading); bullets(c.bullets); });
      (s.boxes || []).forEach(function (b) { count(b.label); count(b.text); });
    });
    XP.alert({ title: "Word count", icon: "info",
      html: "<p><b>Total words: " + words + "</b></p><p>Frames: " + (res ? res.slides.length : 0) + "<br>Files: " + state.order.length +
        " .tex and " + state.images.length + " picture" + (state.images.length === 1 ? "" : "s") + "</p>", buttons: ["OK"] });
  }

  function downloadFile() {
    if (!state.current || isImage(state.current)) { toast("Open a .tex file first.", "warn"); return; }
    try {
      var url = URL.createObjectURL(new Blob([state.files[state.current]], { type: "text/x-tex;charset=utf-8" }));
      var a = document.createElement("a");
      a.href = url; a.download = state.current;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    } catch (e) { toast("This browser cannot save the file.", "warn"); }
  }

  function printSlides() {
    if (!state.good) return;
    var box = document.createElement("div");
    box.className = "ol-print ol-madrid";
    var res = state.good, n = res.slides.length;
    res.slides.forEach(function (s, i) { box.appendChild(Madrid.render(s, { index: i, total: n, source: res.sources[i], footer: res.footer })); });
    document.body.appendChild(box);
    var done = function () { box.remove(); window.removeEventListener("afterprint", done); };
    window.addEventListener("afterprint", done);
    setTimeout(function () { window.print(); setTimeout(done, 1500); }, 60);
  }

  function restoreOriginal() {
    var edited = state.order.filter(function (n) { return state.files[n] !== state.original[n]; });
    if (!edited.length) { toast("All files are already the original.", "check"); return; }
    XP.alert({ title: "Restore the original files", icon: "warning",
      html: "<p>Put back the original version of " + edited.map(esc).join(", ") + ", and recompile?</p><p>History keeps the list of your recompiles.</p>",
      buttons: ["Restore", "Cancel"] }).then(function (b) {
      if (b !== "Restore") return;
      state.order.forEach(function (n) { state.files[n] = state.original[n]; });
      state.views = {};
      var cur = state.current;
      state.current = null;
      openFile(cur || "home.tex", { preview: false, hash: false });
      recompile();
    });
  }

  function dialogs(act) {
    if (act === "review") {
      XP.alert({ title: "Review", icon: "info",
        html: "<p><b>Every change is tracked</b>, in this browser tab only: each time you recompile, History records line by line what you changed.</p><p>Open History to see your changes so far.</p>",
        buttons: ["Open History", "Close"] }).then(function (b) { if (b === "Open History") toggleHistory(true); });
    } else if (act === "share") {
      XP.alert({ title: "Share project", icon: "info",
        html: "<p>Your edits live only in this browser tab, and refreshing the page brings back the original.</p><p>To share the website itself, send people to <b>lehanzhang.com</b>.</p>",
        buttons: ["OK"] });
    } else if (act === "chat") {
      XP.alert({ title: "Chat", icon: "info",
        html: "<p>Lehan is not in the chat right now.</p><p>Email: <b>" + esc(P.email) + "</b></p>",
        buttons: ["Email Lehan", "Close"] }).then(function (b) { if (b === "Email Lehan") location.href = "mailto:" + P.email; });
    } else if (act === "recycle") {
      var edited = state.order.filter(function (n) { return state.files[n] !== state.original[n]; });
      if (!edited.length) {
        XP.alert({ title: "Recycle Bin", icon: "recycle", html: "<p>The Recycle Bin is empty.</p><p>Every overfull \\hbox has been recycled.</p>", buttons: ["OK"] });
      } else {
        XP.alert({ title: "Recycle Bin", icon: "recycle",
          html: "<p>The Recycle Bin holds the original version of the files you edited: <b>" + edited.map(esc).join(", ") + "</b>.</p>",
          buttons: ["Restore originals", "Close"] }).then(function (b) { if (b === "Restore originals") restoreOriginal(); });
      }
    }
  }

  // ======================================================================
  // Splitters between the panes (drag, or arrow keys and Home / End;
  // double-click resets). Each is a focusable role="separator" whose value
  // is the width of the pane it resizes, in % of the window: the file list
  // (9 to 32) and the editor (18 to whatever leaves the preview 22).
  // ======================================================================
  function paneWidth(name, def) {
    var v = getComputedStyle(el.app).getPropertyValue(name).trim();
    return parseFloat(v) || def;
  }
  function splitRange(which) {
    var tree = paneWidth("--ol-tree-w", 14);
    if (which === "files") return { min: 9, max: 32, now: tree };
    var start = el.main.classList.contains("is-no-files") ? 0 : tree;
    return { min: 18, max: 100 - start - 22, now: paneWidth("--ol-edit-w", 37), start: start };
  }
  function splitAria() {
    [["ol-split-files", "files", "File list"], ["ol-split-pdf", "pdf", "Editor"]].forEach(function (s) {
      var h = $(s[0]), r = splitRange(s[1]), now = Math.round(Math.max(r.min, Math.min(r.max, r.now)));
      h.setAttribute("aria-valuemin", r.min);
      h.setAttribute("aria-valuemax", Math.round(r.max));
      h.setAttribute("aria-valuenow", now);
      h.setAttribute("aria-valuetext", s[2] + ": " + now + "% of the width");
    });
  }
  function splitter(handle, which) {
    function set(tree, edit) {
      el.app.style.setProperty("--ol-tree-w", tree.toFixed(2) + "%");
      el.app.style.setProperty("--ol-edit-w", edit.toFixed(2) + "%");
      splitAria();
      applyZoom();
    }
    function moveTo(pct) {
      var tree = paneWidth("--ol-tree-w", 14), edit = paneWidth("--ol-edit-w", 37);
      if (which === "files") {
        var t = Math.max(9, Math.min(32, pct));
        set(t, Math.max(18, Math.min(edit, 100 - t - 22)));     // keep the preview at least 22% wide
      } else {
        var start = el.main.classList.contains("is-no-files") ? 0 : tree;
        set(tree, Math.max(18, Math.min(100 - start - 22, pct - start)));
      }
    }
    handle.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.target.closest("button") || isPhone()) return;
      e.preventDefault();
      handle.setPointerCapture(e.pointerId);
      handle.classList.add("is-dragging");
      el.main.classList.add("is-dragging");
      var rect = el.main.getBoundingClientRect();
      function move(ev) { moveTo((ev.clientX - rect.left) / rect.width * 100); }
      function up() {
        handle.classList.remove("is-dragging");
        el.main.classList.remove("is-dragging");
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        handle.removeEventListener("pointercancel", up);
      }
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
      handle.addEventListener("pointercancel", up);
    });
    handle.addEventListener("keydown", function (e) {
      if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(e.key) < 0) return;
      e.preventDefault();
      var r = splitRange(which), off = which === "files" ? 0 : r.start;    // moveTo takes the splitter's position
      if (e.key === "Home") moveTo(off + r.min);
      else if (e.key === "End") moveTo(off + r.max);
      else moveTo(off + r.now + (e.key === "ArrowLeft" ? -2 : 2));
    });
    handle.addEventListener("dblclick", function (e) {
      if (e.target.closest("button")) return;
      el.app.style.removeProperty("--ol-tree-w");
      el.app.style.removeProperty("--ol-edit-w");
      splitAria();
      applyZoom();
    });
  }

  // ======================================================================
  // Phones: Files / Source / Preview tabs
  // ======================================================================
  function setPane(p) {
    el.app.setAttribute("data-pane", p);
    Array.prototype.forEach.call(document.querySelectorAll(".ol-tabs [role=tab]"), function (t) {
      t.setAttribute("aria-selected", String(t.getAttribute("data-pane") === p));
    });
    if (p === "preview") requestAnimationFrame(function () { applyZoom(); updatePageCount(); });
  }

  // ======================================================================
  // Deep links and the two demos
  // ======================================================================
  function route() {
    var h = decodeURIComponent(location.hash.replace(/^#/, ""));
    if (!h) return false;
    if (h === "demo-edit") { demoEdit(); return true; }
    if (h === "demo-error") { demoError(); return true; }
    if (h === "history") {
      if (!state.current) openFile("home.tex", { hash: false, preview: false });   // so the editor is not empty behind History
      toggleHistory(true);
      return true;
    }
    var name = h === "main" ? "main.tex" : h + ".tex";
    if (state.files[name] != null) {
      openFile(name, { hash: false, pane: h === "main" ? "source" : "preview" });
      return true;
    }
    // A frame's label (#paper-1, #awards ...): open its file at that frame and show the page
    var i = state.good ? state.good.slides.map(function (s) { return s.id; }).indexOf(h) : -1;
    if (i < 0) return false;
    var src = state.good.sources[i];
    openFile(src.file, { hash: false, preview: false, pane: "preview" });
    editor.goToLine(src.line);
    if (isPhone()) editor.textarea.blur();
    state.routedPage = i;
    scrollToPage(i, true);
    return true;
  }

  function editFile(name, fn) {
    var lines = state.files[name].split("\n");
    var changed = fn(lines) || [];
    state.files[name] = lines.join("\n");
    openFile(name, { preview: false, hash: false, pane: "source" });
    if (changed.length) { editor.flashLines(changed); editor.reveal(changed[changed.length - 1]); }
    markTree();
  }
  function findLine(lines, re, from) {
    for (var i = from || 0; i < lines.length; i++) if (re.test(lines[i])) return i;
    return -1;
  }

  // A sample edit: retitle the Research slide and add a bullet point.
  function demoEdit() {
    editFile("research.tex", function (lines) {
      var t = findLine(lines, /\\frametitle\{/);
      if (t >= 0) lines[t] = lines[t].replace(/\\frametitle\{([^}]*)\}/, "\\frametitle{$1 \\emph{(edited by a visitor)}}");
      var end = findLine(lines, /^ {2}\\end\{itemize\}/);
      if (end < 0) return t >= 0 ? [t + 1] : [];
      lines.splice(end, 0, "    \\item \\textbf{A new bullet point}, added in the editor and recompiled");
      return [t + 1, end + 1];
    });
    recompile({ stay: true, done: function () {
      toggleHistory(true);
      if (isPhone()) setPane("preview");
      scrollToFile("research.tex");
    } });
  }

  // A broken edit: drop an \end{itemize} and misspell \emph.
  function demoError() {
    editFile("research.tex", function (lines) {
      var e = findLine(lines, /^ {6}\\end\{itemize\}/);
      if (e >= 0) lines.splice(e, 1);
      var w = findLine(lines, /^\s*\\item .*\\emph\{/);
      if (w >= 0) lines[w] = lines[w].replace("\\emph{", "\\emhp{");
      return [e >= 0 ? e : 1, w >= 0 ? w + 1 : 1];
    });
    recompile({ done: function (res) {
      if (res.errors[0] && res.errors[0].file === state.current) editor.reveal(res.errors[0].line);
      scrollToFile("research.tex");
    } });
  }

  // ======================================================================
  // Wiring
  // ======================================================================
  function wire() {
    el.tree.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-folder")) {
        var open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", String(open));
        $("ol-images-folder").hidden = !open;
        return;
      }
      openFile(b.getAttribute("data-file"), { pane: "source" });
    });
    el.outline.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var file = b.getAttribute("data-file");
      if (file) { openFile(file, { pane: "source" }); return; }
      editor.goToLine(+b.getAttribute("data-line"));
      syncToPdf();
    });
    el.fmt.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cmd]");
      if (b && editor && !isImage(state.current)) editor.command(b.getAttribute("data-cmd"));
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-recompile]"), function (b) {
      b.addEventListener("click", function () { recompile(); });
    });
    el.recompileMore.addEventListener("click", function () { showPop(el.compileMenu, el.recompileMore, compileMenu(), true); });
    el.layoutBtn.addEventListener("click", function () { showPop(el.layoutMenu, el.layoutBtn, layoutMenu(), true); });
    el.menuBtn.addEventListener("click", function () { showPop(el.menu, el.menuBtn, null, false); });
    el.historyBtn.addEventListener("click", function () { toggleHistory(); });
    el.logsBtn.addEventListener("click", function () { toggleLogs(); });
    $("ol-review-btn").addEventListener("click", function () { dialogs("review"); });
    $("ol-share-btn").addEventListener("click", function () { dialogs("share"); });
    $("ol-chat-btn").addEventListener("click", function () { dialogs("chat"); });
    $("ol-restore-btn").addEventListener("click", restoreOriginal);
    $("ol-print-btn").addEventListener("click", printSlides);
    $("ol-sync-pdf").addEventListener("click", syncToPdf);
    $("ol-sync-code").addEventListener("click", function () { syncToCode(); });
    $("ol-recycle").addEventListener("xp:open", function () { dialogs("recycle"); });

    // Buttons inside generated panels and menus
    el.app.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act], [data-layout], .ol-log-loc");
      if (!b) return;
      if (b.classList.contains("ol-log-loc")) {
        openFile(b.getAttribute("data-file"), { preview: false, pane: "source" });
        editor.goToLine(+b.getAttribute("data-line"), true);
        return;
      }
      var lay = b.getAttribute("data-layout");
      if (lay) { setLayout(lay); return; }
      var act = b.getAttribute("data-act");
      if (act !== "keys" && act !== "help") closePop();
      if (act === "close-logs") toggleLogs(false);
      else if (act === "open-logs") toggleLogs(true);
      else if (act === "close-history") toggleHistory(false);
      else if (act === "restore") restoreOriginal();
      else if (act === "recompile") recompile();
      else if (act === "print") printSlides();
      else if (act === "download-file") downloadFile();
      else if (act === "wordcount") wordCount();
      else if (act === "help") { closePop(); XP.alert({ title: "Help", icon: "help", html: HELP, buttons: ["OK"] }); }
      else if (act === "keys") { closePop(); XP.alert({ title: "Keyboard shortcuts", icon: "info", html: KEYS, buttons: ["OK"] }); }
    });

    // Close menus on outside clicks and Escape
    document.addEventListener("pointerdown", function (e) {
      if (openPop && !openPop.box.contains(e.target) && !openPop.button.contains(e.target)) closePop();
    }, true);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && openPop) { closePop(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.key === "s" || e.key === "S") && !e.defaultPrevented) {
        if (!document.querySelector(".xp-modal")) { e.preventDefault(); recompile(); }
      }
    });

    // Preview: page counter, zoom, double-click = show the code
    var raf = 0;
    el.pdf.addEventListener("scroll", function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; updatePageCount(); });
    });
    el.pages.addEventListener("dblclick", function (e) {
      if (e.target.closest("a")) return;
      var page = e.target.closest(".ol-page");
      if (page) syncToCode(+page.getAttribute("data-index"));
    });
    el.zoom.addEventListener("change", function () { state.zoom = el.zoom.value; applyZoom(); });
    var steps = ["0.5", "0.75", "1", "1.25", "1.5", "2"];
    function step(dir) {
      var cur = state.zoom;
      if (cur === "fit" || cur === "height") {
        var w = parseFloat(getComputedStyle(el.pages).getPropertyValue("--ol-page-w")) || 605;
        cur = String(w / 605);
      }
      var c = parseFloat(cur), next = dir > 0 ? steps.filter(function (s) { return +s > c + 0.01; })[0] : steps.filter(function (s) { return +s < c - 0.01; }).pop();
      if (!next) return;
      state.zoom = next; el.zoom.value = next; applyZoom();
    }
    $("ol-zoom-in").addEventListener("click", function () { step(1); });
    $("ol-zoom-out").addEventListener("click", function () { step(-1); });
    if (window.ResizeObserver) new ResizeObserver(function () { applyZoom(); updatePageCount(); placeLogs(); }).observe(el.pdf);
    else window.addEventListener("resize", applyZoom);

    splitter($("ol-split-files"), "files");
    splitter($("ol-split-pdf"), "pdf");
    splitAria();

    Array.prototype.forEach.call(document.querySelectorAll(".ol-tabs [role=tab]"), function (t) {
      t.addEventListener("click", function () { setPane(t.getAttribute("data-pane")); });
    });

    window.addEventListener("hashchange", route);
    el.window.addEventListener("xp:maximize", function () { requestAnimationFrame(applyZoom); });
    el.window.addEventListener("xp:restore", function () { requestAnimationFrame(applyZoom); });
  }

  // ======================================================================
  // Start-up
  // ======================================================================
  function start() {
    buildDesktop();
    fillIcons(document);

    // The project, generated from content.js through the shared slide deck.
    var project = TexGen.generate(Deck.fromContent(SITE, { abstracts: true }), { site: SITE });
    project.files.forEach(function (f) {
      state.files[f.name] = f.text;
      state.original[f.name] = f.text;
      state.order.push(f.name);
    });
    state.images = project.images;
    project.images.forEach(function (im) { state.imageMap[im.name] = im.src; });

    editor = TexEditor.create(el.code, {
      onChange: onChange,
      onCompile: function () { recompile(); }
    });
    buildTree();
    buildMenu();
    wire();

    var hash = location.hash.replace(/^#/, "");
    var demo = /^demo-/.test(hash);
    XP.init({
      version: "overleaf",
      onNavigate: function (pageId) {
        XP.restore("ol-window");
        openFile(pageId + ".tex", { pane: "preview" });
      },
      help: HELP,
      balloon: demo ? null : {
        title: "This website is written in LaTeX",
        text: "Edit any file and press Recompile. Refresh the page to restore the original website.",
        delay: 1500, timeout: 15000,
        onClick: function () { if (editor) editor.focus(); }
      }
    });

    compileNow(true);                 // the first compile is not logged
    renderHistory();
    if (!route()) openFile("home.tex", { hash: false, preview: false });
    requestAnimationFrame(function () {
      applyZoom();
      var i = state.routedPage != null ? state.routedPage : (state.current ? pageOfFile(state.current) : -1);
      if (i > 0) scrollToPage(i);
      booting = false;
    });
    // The slide fonts change line breaks: measure the slides again once they are in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(measureOverflow); });
  }

  start();
})();
