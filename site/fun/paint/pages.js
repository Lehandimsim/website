/* ==========================================================================
   fun/paint/pages.js — what is drawn on the canvas for each screen.

   Every page is built from window.SITE (content.js); nothing from the CV is
   typed here. This file only holds the layout, the Paint-style decorations
   and a few interface words (TEXT below), which you can edit freely.

     PaintPages.html(id)   -> HTML for "start", "home", "research", "talks", "experience", "cv", "art"
     PaintPages.accent(id) -> the page's default doodle colour
     PaintPages.abstract(n) -> { title, html } for paper n's Abstract popup (n from 1), or null
     PaintPages.TEXT       -> the interface words
   The Paint! tab (the drawing canvas) is built by draw.js.
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil;
  var D = window.Doodle;
  var SITE = window.SITE || {};
  var esc = U.esc, inline = U.inline;

  // ---------- Interface words (not CV content) ----------
  var TEXT = {
    startWord: "start",                 // hand-drawn on the button: letters a-z and ! ? . , ' - only
    startAria: "Start: open Lehan's website",
    startHeading: "Welcome to Lehan Zhang's website",   // not shown: read out by screen readers only
    clickMe: "click me!",
    helloAlt: "Handwritten: hi! i'm Lehan. welcome to my website",
    enterAria: "Enter: continue to the next page of the website",
    enterNote: "press Enter to look around",
    interests: "Research interests",    // used only if content.js has no research.interestsLabel
    methods: "Methods",                 // used only if content.js has no research.methodsLabel
    papers: "Papers",
    abstract: "Abstract",               // used only if content.js has no research.abstractLabel
    abstractPdf: "Read the full paper (PDF)",   // the link at the end of the Abstract popup
    abstractOk: "OK",
    upcoming: "upcoming!",
    legend: "Circled in red: talks still to come",
    viewCv: "View CV (PDF)",
    cvNote: "opens in a new tab",
    education: "Education",
    performances: "Performances",
    projects: "Art Projects",
    elsewhere: "Photography and writing",
    work: "Work experience",
    teaching: "Teaching",
    service: "Service",
    awards: "Awards and extracurriculars",
    skills: "Skills",
    jumpTo: "Jump to:",
    next: "Next page:",
    nextPaint: "Paint! (draw me something)",
    paintTab: "Paint!",
    // The "i" button in the taskbar tray (next to Help), and Help > About Paint before Start.
    aboutTitle: "About this Paint",
    aboutText: "This version is inspired by the hours I spent in MS Paint as a child. Even now, as a photographer, I sometimes do a quick edit in Paint, because it opens so much faster than Adobe Photoshop."
  };

  // Each page's default doodle colour (card shadows, highlighter). Picking a colour in the palette
  // overrides it, on every page.
  var ACCENT = {
    home: "#ff0000", research: "#0080ff", talks: "#ff0000", cv: "#008000",
    art: "#ff00ff", experience: "#ff8040"
  };

  // ---------- Small drawing helpers ----------
  function stroke(width, color) {
    return 'fill="none" stroke="' + (color || "#000") + '" stroke-width="' + width + '" stroke-linecap="round" stroke-linejoin="round"';
  }
  // A path made of straight wobbly segments (sharp corners), e.g. a page outline.
  function segs(points, seed, wobble) {
    var d = "";
    for (var i = 0; i < points.length - 1; i++) {
      d += D.line([points[i], points[i + 1]], { seed: seed + i, wobble: wobble == null ? 0.7 : wobble, step: 16 });
    }
    return d;
  }
  function svg(viewBox, inner, cls) {
    return '<svg class="' + (cls || "") + '" viewBox="' + viewBox + '" aria-hidden="true" focusable="false">' + inner + "</svg>";
  }
  function ellipseShape(cx, cy, rx, ry, seed, fill, sw) {
    return '<path d="' + D.ellipse(cx, cy, rx, ry, { seed: seed, overshoot: 0.06, wobble: 0.7 }) + '" fill="' + fill + '" ' +
      'stroke="#000" stroke-width="' + (sw || 2.5) + '" stroke-linecap="round"/>';
  }
  function boxShape(x, y, w, h, r, seed, fill, sw) {
    return '<path d="' + D.blob(x, y, w, h, { seed: seed, radius: r, wobble: 0.8 }) + '" fill="' + fill + '"/>' +
      '<path d="' + D.loop(x, y, w, h, { seed: seed, radius: r, wobble: 0.8, overshoot: 1 }) + '" ' + stroke(sw || 2.5) + "/>";
  }

  // ---------- Doodle icons (64 x 64), as if drawn with the Brush and filled with the bucket ----------
  var ICON = {
    research: function () {
      return boxShape(8, 5, 32, 46, 2, 201, "#fff") +
        '<path d="' + D.line([[14, 15], [33, 15]], { seed: 202, wobble: 0.6 }) +
          D.line([[14, 22], [33, 22]], { seed: 203, wobble: 0.6 }) +
          D.line([[14, 29], [26, 29]], { seed: 204, wobble: 0.6 }) + '" ' + stroke(2, "#808080") + "/>" +
        '<path d="' + D.line([[49, 47], [58, 57]], { seed: 205, wobble: 0.4 }) + '" ' + stroke(6.5) + "/>" +
        ellipseShape(40, 37, 12, 12, 206, "#80ffff", 3);
    },
    talks: function () {
      return '<path d="' + D.line([[15, 24], [17, 35], [32, 44], [47, 35], [49, 24]], { seed: 211, wobble: 0.6, step: 99 }) + '" ' + stroke(3) + "/>" +
        '<path d="' + segs([[32, 44], [32, 55]], 212) + segs([[21, 57], [43, 57]], 213) + '" ' + stroke(3) + "/>" +
        boxShape(22, 5, 20, 31, 10, 214, "#c0c0c0") +
        '<path d="' + segs([[25, 14], [39, 14]], 215, 0.4) + segs([[24, 20], [40, 20]], 216, 0.4) + segs([[24, 26], [40, 26]], 217, 0.4) + '" ' + stroke(1.6, "#404040") + "/>" +
        '<path d="' + D.line([[11, 9], [7, 17], [11, 25]], { seed: 218, wobble: 0.3, step: 99 }) + D.line([[53, 9], [57, 17], [53, 25]], { seed: 219, wobble: 0.3, step: 99 }) + '" ' + stroke(2.4, "#ff0000") + "/>";
    },
    cv: function () {
      return '<path d="' + D.smooth([[12, 4], [38, 4], [48, 14], [48, 58], [12, 58]], false) + 'Z" fill="#fff"/>' +
        '<path d="' + segs([[12, 4], [38, 4], [48, 14], [48, 58], [12, 58], [12, 4]], 221) + '" ' + stroke(2.5) + "/>" +
        '<path d="' + segs([[38, 4], [38, 14], [48, 14]], 222) + '" ' + stroke(2) + "/>" +
        '<path d="' + segs([[18, 22], [42, 22]], 223, 0.4) + segs([[18, 29], [42, 29]], 224, 0.4) + segs([[18, 36], [34, 36]], 225, 0.4) + '" ' + stroke(2, "#808080") + "/>" +
        '<path d="' + D.blob(5, 41, 30, 15, { seed: 226, radius: 2, wobble: 0.5 }) + '" fill="#ff0000" stroke="#000" stroke-width="2"/>' +
        '<text x="20" y="52.5" text-anchor="middle" font-family="Arial, sans-serif" font-weight="bold" font-size="10.5" fill="#fff">PDF</text>';
    },
    art: function () {
      var blob = D.smooth([[32, 7], [50, 11], [59, 27], [55, 44], [41, 54], [31, 50], [29, 42], [21, 45], [10, 41], [5, 26], [14, 12]], true);
      return '<path d="' + blob + '" fill="#f3d9a4" stroke="#000" stroke-width="2.5" stroke-linejoin="round"/>' +
        ellipseShape(25, 39, 4, 3.6, 231, "#fff", 2) +
        ellipseShape(19, 22, 4.8, 4.5, 232, "#ff0000", 1.8) +
        ellipseShape(31, 16, 4.8, 4.5, 233, "#ffff00", 1.8) +
        ellipseShape(44, 20, 4.8, 4.5, 234, "#0000ff", 1.8) +
        ellipseShape(48, 33, 4.8, 4.5, 235, "#00ff00", 1.8) +
        '<path d="' + D.line([[38, 60], [61, 37]], { seed: 236, wobble: 0.4 }) + '" ' + stroke(4.5, "#804000") + "/>" +
        '<path d="' + D.line([[35, 63], [39, 59]], { seed: 237, wobble: 0.2 }) + '" ' + stroke(5.5) + "/>";
    },
    experience: function () {
      return '<path d="' + segs([[24, 19], [24, 11], [40, 11], [40, 19]], 241) + '" ' + stroke(3.2) + "/>" +
        boxShape(6, 19, 52, 36, 4, 242, "#ff8040") +
        '<path d="' + segs([[7, 34], [57, 34]], 243, 0.5) + '" ' + stroke(2.2) + "/>" +
        '<path d="' + D.blob(28, 30, 8, 9, { seed: 244, radius: 1, wobble: 0.3 }) + '" fill="#ffff00" stroke="#000" stroke-width="2"/>';
    },
    camera: function () {
      return boxShape(18, 10, 16, 10, 2, 251, "#808080") +
        boxShape(5, 17, 54, 36, 6, 252, "#c0c0c0") +
        ellipseShape(32, 35, 12, 12, 253, "#000080", 2.5) +
        ellipseShape(28, 31, 3.5, 3.5, 254, "#80ffff", 1) +
        '<path d="' + D.blob(46, 22, 8, 5, { seed: 255, radius: 1, wobble: 0.3 }) + '" fill="#ffff00" stroke="#000" stroke-width="1.5"/>';
    },
    bowl: function () {
      var bowl = D.smooth([[5, 30], [9, 44], [21, 54], [43, 54], [55, 44], [59, 30]], false);
      return '<path d="' + D.line([[22, 24], [19, 18], [23, 12], [20, 5]], { seed: 261, wobble: 0.5, step: 99 }) +
          D.line([[32, 23], [29, 17], [33, 11], [30, 4]], { seed: 262, wobble: 0.5, step: 99 }) + '" ' + stroke(2, "#808080") + "/>" +
        '<path d="' + segs([[38, 27], [58, 5]], 263, 0.3) + segs([[43, 29], [61, 9]], 264, 0.3) + '" ' + stroke(2.8, "#804000") + "/>" +
        '<path d="' + bowl + 'Z" fill="#80ffff"/>' +
        '<path d="' + bowl + '" ' + stroke(2.5) + "/>" +
        '<path d="' + D.line([[4, 30], [60, 30]], { seed: 265, wobble: 0.6 }) + '" ' + stroke(2.5) + "/>" +
        '<path d="' + D.line([[14, 40], [22, 44], [30, 40], [38, 44], [46, 40]], { seed: 266, wobble: 0.4, step: 99 }) + '" ' + stroke(2, "#ff0000") + "/>";
    }
  };
  function icon(name, cls) { return svg("0 0 64 64", ICON[name](), cls || "pt-head-doodle"); }

  // Little "pictures" for the performances and art projects (96 x 80), chosen by a keyword in the
  // title or medium.
  var THUMB = [
    // A piano keyboard with two notes above it (the piano duets).
    { match: /piano|duet|concert|recital/i, draw: function () {
      var keys = "", blacks = "";
      for (var k = 0; k < 7; k++) keys += segs([[14 + k * 10, 44], [14 + k * 10, 70]], 345 + k, 0.4);
      [0, 1, 3, 4, 5].forEach(function (k, j) {
        blacks += '<path d="' + D.blob(20.5 + k * 10, 44, 7, 15, { seed: 352 + j, radius: 1, wobble: 0.3 }) + '" fill="#000"/>';
      });
      return '<rect width="96" height="80" fill="#fff"/>' +
        boxShape(8, 44, 80, 26, 1, 341, "#fff", 2.5) +
        '<path d="' + keys + '" ' + stroke(1.8) + "/>" + blacks +
        // Two beamed quavers: heads, stems, then the beam.
        ellipseShape(37, 33, 5, 3.8, 361, "#ff0000", 1.8) + ellipseShape(59, 28, 5, 3.8, 362, "#ff0000", 1.8) +
        '<path d="' + segs([[41.5, 32], [41.5, 10]], 363, 0.3) + segs([[63.5, 27], [63.5, 5]], 364, 0.3) + '" ' + stroke(2.2) + "/>" +
        '<path d="' + segs([[41.5, 10], [63.5, 5]], 365, 0.3) + '" ' + stroke(4.5) + "/>";
    } },
    { match: /notice|board/i, draw: function () {
      return '<rect width="96" height="80" fill="#fff"/>' + boxShape(6, 6, 84, 66, 2, 301, "#d9a066", 3) +
        '<path d="' + D.blob(14, 14, 24, 22, { seed: 302, wobble: 0.5 }) + '" fill="#ffff80" stroke="#000" stroke-width="1.5" transform="rotate(-6 26 25)"/>' +
        '<path d="' + D.blob(44, 12, 26, 20, { seed: 303, wobble: 0.5 }) + '" fill="#80ffff" stroke="#000" stroke-width="1.5" transform="rotate(4 57 22)"/>' +
        '<path d="' + D.blob(30, 40, 30, 24, { seed: 304, wobble: 0.5 }) + '" fill="#ff80c0" stroke="#000" stroke-width="1.5" transform="rotate(-3 45 52)"/>' +
        '<circle cx="26" cy="16" r="2.6" fill="#ff0000" stroke="#000"/><circle cx="57" cy="14" r="2.6" fill="#0000ff" stroke="#000"/><circle cx="45" cy="42" r="2.6" fill="#00ff00" stroke="#000"/>';
    } },
    { match: /video|box/i, draw: function () {
      return '<rect width="96" height="80" fill="#fff"/>' +
        '<path d="' + D.smooth([[20, 26], [40, 12], [80, 12], [60, 26]], false) + 'Z" fill="#ffff00"/>' +
        '<path d="' + segs([[20, 26], [40, 12], [80, 12], [60, 26], [20, 26]], 311) + '" ' + stroke(2.5) + "/>" +
        '<path d="M60 26 80 12 80 52 60 68Z" fill="#c0c000"/>' +
        '<path d="' + segs([[60, 26], [80, 12], [80, 52], [60, 68]], 312) + '" ' + stroke(2.5) + "/>" +
        boxShape(20, 26, 40, 42, 0, 313, "#ffff80") +
        '<path d="' + D.smooth([[33, 36], [33, 58], [50, 47]], false) + 'Z" fill="#ff0000" stroke="#000" stroke-width="2" stroke-linejoin="round"/>';
    } },
    { match: /zine/i, draw: function () {
      return '<rect width="96" height="80" fill="#fff"/>' +
        '<path d="M48 14 14 8 14 66 48 72Z" fill="#80ffff"/><path d="M48 14 82 8 82 66 48 72Z" fill="#fff"/>' +
        '<path d="' + segs([[48, 14], [14, 8], [14, 66], [48, 72], [82, 66], [82, 8], [48, 14], [48, 72]], 321) + '" ' + stroke(2.5) + "/>" +
        '<path d="' + D.line([[22, 24], [40, 26]], { seed: 322 }) + D.line([[22, 34], [40, 36]], { seed: 323 }) + D.line([[22, 44], [34, 46]], { seed: 324 }) + '" ' + stroke(2, "#000080") + "/>" +
        '<path d="' + D.ellipse(64, 38, 9, 9, { seed: 325, wobble: 0.6 }) + '" fill="#ff00ff" stroke="#000" stroke-width="2"/>' +
        '<path d="' + D.line([[56, 56], [74, 54]], { seed: 326 }) + '" ' + stroke(2, "#000080") + "/>";
    } }
  ];
  // Fallback: the classic Paint picture (hills, a sun and a cloud).
  function landscape() {
    return '<rect width="96" height="80" fill="#80ffff"/>' +
      '<path d="M0 56C20 40 40 44 56 52S86 50 96 44V80H0Z" fill="#00ff00" stroke="#000" stroke-width="2"/>' +
      ellipseShape(74, 20, 9, 9, 331, "#ffff00", 2) +
      '<path d="' + D.blob(14, 14, 30, 12, { seed: 332, radius: 6, wobble: 0.6 }) + '" fill="#fff" stroke="#000" stroke-width="1.5"/>';
  }
  function thumb(project) {
    var key = (project.title || "") + " " + (project.medium || "");
    for (var i = 0; i < THUMB.length; i++) if (THUMB[i].match.test(key)) return svg("0 0 96 80", THUMB[i].draw());
    return svg("0 0 96 80", landscape());
  }

  // Small crisp icons used inside buttons.
  var MINI = {
    pdf: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 1h7l3 3v11H3z" fill="#fff" stroke="#000"/><path d="M10 1v3h3" fill="none" stroke="#000"/><rect x="1.5" y="8" width="10" height="5" fill="#ff0000"/><path d="M3 9.5h2M3 11.5h1.5M7 9.5v3M9 9.5h1.5" stroke="#fff"/></svg>',
    out: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M7 3H2v11h11V9" fill="none" stroke="#000" stroke-width="1.6"/><path d="M9 2h5v5M14 2 7 9" fill="none" stroke="#000" stroke-width="1.6"/></svg>',
    down: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1v9M4 6l4 4 4-4" fill="none" stroke="#000" stroke-width="1.8"/><path d="M2 11v3h12v-3" fill="none" stroke="#000" stroke-width="1.6"/></svg>',
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="3" width="14" height="10" rx="2" fill="#ff0000" stroke="#000"/><path d="M6.5 5.5v5l4-2.5z" fill="#fff"/></svg>',
    // A page of text under a magnifying glass (the Abstract button).
    text: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 1h9v14H2z" fill="#fff" stroke="#000"/><path d="M4 4h5M4 6.5h5M4 9h3" stroke="#000"/><circle cx="10.5" cy="10" r="3" fill="#ffff80" stroke="#000" stroke-width="1.3"/><path d="m12.6 12.1 2.6 2.6" stroke="#000" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  function linkIcon(link) {
    if (/\.pdf($|[?#])/i.test(link.url) || /pdf/i.test(link.label)) return MINI.pdf;
    if (/youtube|video/i.test(link.url + link.label)) return MINI.play;
    return MINI.out;
  }

  // ---------- Shared page parts ----------
  function label(id) {
    var p = U.page(id);
    return p ? p.label : id;
  }

  // Page title: big "Arial Black" text with a highlighter stroke behind it, and a doodle icon.
  function head(id, seed) {
    return '<header class="pt-head">' + (ICON[id] ? icon(id) : "") +
      '<h1 class="pt-h1" tabindex="-1">' +
        svg("0 0 100 20", '<path d="' + D.highlight(seed || 11) + '"/>', "pt-hl").replace("<svg ", '<svg preserveAspectRatio="none" ') +
        esc(label(id)) +
      "</h1></header>";
  }

  function h2(text, id) {
    return '<h2 class="pt-h2"' + (id ? ' id="' + id + '" tabindex="-1"' : "") + ">" + esc(text) + "</h2>";
  }

  // The next page in the menu bar, as a link at the end of each page.
  function next(id) {
    var ids = (SITE.pages || []).map(function (p) { return p.id; }).concat(["paint"]);
    var i = ids.indexOf(id);
    if (i < 0 || i >= ids.length - 1) return "";
    var to = ids[i + 1];
    var text = to === "paint" ? TEXT.nextPaint : label(to);
    var arrow = svg("0 0 46 22", '<path d="' + D.arrow([[3, 13], [20, 9], [40, 11]], { seed: 401 + i, head: 9, wobble: 1 }) + '" ' + stroke(2.6, "#e00000") + "/>");
    return '<nav class="pt-next" aria-label="Next page"><span class="pt-note">' + esc(TEXT.next) + "</span>" +
      '<a href="#' + to + '">' + esc(text) + arrow + "</a></nav>";
  }

  function linkButtons(links, extra) {
    if ((!links || !links.length) && !extra) return "";
    return '<p class="pt-btns">' + (links || []).map(function (l) {
      return '<a class="pt-btn" ' + U.linkAttrs(l.url) + ">" + linkIcon(l) + esc(l.label) + "</a>";
    }).join("") + (extra || "") + "</p>";
  }

  // The paper's PDF link (for the Abstract popup): the first link that is a PDF.
  function pdfLink(paper) {
    return (paper.links || []).filter(function (l) {
      return /\.pdf($|[?#])/i.test(l.url) || /pdf/i.test(l.label);
    })[0] || null;
  }

  // ---------- Start screen: one big hand-drawn start button ----------
  function startButton() {
    var x = 14, y = 22, w = 372, h = 152, r = 38;
    var word = TEXT.startWord;
    var size = Math.min(1.18, 290 / D.text(word, { size: 1 }).width);   // longer words get smaller
    var t = D.text(word, { size: size, seed: 7 });
    var tx = x + w / 2 - t.width / 2, ty = y + h / 2 + 34;
    var sparkle = function (s) {
      return D.line([[392, 30], [409, 14]], { seed: s, wobble: 1 }) +
             D.line([[399, 52], [418, 50]], { seed: s + 1, wobble: 1 }) +
             D.line([[371, 12], [376, -6]], { seed: s + 2, wobble: 1 });
    };
    return '<svg viewBox="0 0 424 214" aria-hidden="true" focusable="false">' +
      // Paint's dashed selection rectangle: shows when the button has keyboard focus.
      '<rect class="pt-sb-select" x="2" y="4" width="418" height="206" fill="none" stroke="#000" stroke-width="2" stroke-dasharray="6 5"/>' +
      '<path d="' + D.blob(x + 11, y + 11, w, h, { seed: 31, radius: r, wobble: 1.5 }) + '" fill="#000"/>' +
      '<g class="pt-sb-face">' +
        '<path class="pt-sb-fill" d="' + D.blob(x, y, w, h, { seed: 32, radius: r, wobble: 1.5 }) + '"/>' +
        D.boilPath(function (s) { return D.loop(x, y, w, h, { seed: s, radius: r, wobble: 2.2, overshoot: 2 }); }, 33, stroke(6)) +
        '<g transform="translate(' + tx.toFixed(1) + " " + ty + ')">' +
          D.boilPath(function (s) { return D.text(word, { size: size, seed: s, wobble: 2.1 }).d; }, 7, stroke(12)) +
        "</g>" +
      "</g>" +
      D.boilPath(sparkle, 41, stroke(5)) +
      "</svg>";
  }

  // "click me!" with a scribbled arrow pointing at the button.
  function clickMe() {
    var t = D.text(TEXT.clickMe, { size: 0.5, seed: 3 });
    var s = Math.min(1, 190 / t.width);
    return '<svg class="pt-start-note" viewBox="0 0 250 160" aria-hidden="true" focusable="false">' +
      '<g transform="translate(6 54) scale(' + s.toFixed(3) + ')">' +
        D.boilPath(function (k) { return D.text(TEXT.clickMe, { size: 0.5, seed: k, wobble: 1.6 }).d; }, 3, stroke(4.4 / s, "#e00000")) +
      "</g>" +
      D.boilPath(function (k) { return D.arrow([[116, 72], [158, 80], [194, 102], [218, 136]], { seed: k, head: 17, wobble: 2 }); }, 61, stroke(4.4, "#e00000")) +
      "</svg>";
  }

  function start() {
    return '<div class="pt-start">' +
      // A heading for screen readers: the start screen shows only the hand-drawn button.
      '<h1 class="pt-sr" tabindex="-1">' + esc(TEXT.startHeading) + "</h1>" +
      '<div class="pt-start-stage">' +
        clickMe() +
        '<button type="button" class="pt-startbtn" data-act="start" aria-label="' + esc(TEXT.startAria) + '">' + startButton() + "</button>" +
      "</div>" +
    "</div>";
  }

  // ---------- Home: the first real canvas (like msPaintmock.png) ----------
  function home() {
    var H = SITE.home || {}, P = SITE.person || {}, photo = P.photo || {};
    var email = P.email || "";
    // Keep the email line verbatim, but make the address a link (styled like the lab links around it).
    var emailLine = esc(H.emailLine || "");
    if (email && emailLine.indexOf(esc(email)) >= 0) {
      emailLine = emailLine.replace(esc(email), '<a class="text-link" href="mailto:' + esc(email) + '">' + esc(email) + "</a>");
    }
    var arrow = svg("0 0 44 26", '<path d="' + D.arrow([[42, 15], [26, 10], [5, 13]], { seed: 71, head: 10, wobble: 1 }) + '" ' + stroke(2.6, "#e00000") + "/>");
    return '<div class="pt-page pt-home">' +
      '<div class="pt-home-art">' +
        '<img class="pt-home-photo" src="' + esc(U.url(photo.portrait)) + '" alt="' + esc(photo.alt || P.name || "") + '" width="335" height="493">' +
        '<div class="pt-home-hello">' +
          '<img class="pt-home-hand" src="' + esc(U.url("assets/img/hello-handwriting.png")) + '" alt="' + esc(TEXT.helloAlt) + '" width="612" height="439">' +
          '<div class="pt-home-enterrow">' +
            '<button type="button" class="pt-enter" data-act="enter" aria-label="' + esc(TEXT.enterAria) + '" aria-keyshortcuts="Enter">' +
              '<img src="' + esc(U.url("assets/img/enter-key.png")) + '" alt="" width="157" height="96">' +
            "</button>" +
            '<span class="pt-enter-note" aria-hidden="true">' + arrow + esc(TEXT.enterNote) + "</span>" +
          "</div>" +
        "</div>" +
      "</div>" +
      // The home text, as if just typed with the Text tool (hence the dashed text box).
      '<section class="pt-textbox" aria-labelledby="pt-home-name">' +
        '<h1 id="pt-home-name" tabindex="-1">' + esc(H.heading || P.name || "") + "</h1>" +
        (H.paragraphs || []).map(function (p) { return "<p>" + inline(p) + "</p>"; }).join("") +
        (emailLine ? "<p>" + emailLine + "</p>" : "") +
      "</section>" +
    "</div>";
  }

  // ---------- Research ----------
  function research() {
    var R = SITE.research || {};
    var html = '<div class="pt-page pt-research">' + head("research", 12);
    // Research interests, then Methods on its own line: two rows of pills.
    var rows = [[R.interestsLabel || TEXT.interests, R.interests, ""], [R.methodsLabel || TEXT.methods, R.methods, " pt-tagrow--methods"]]
      .filter(function (r) { return r[1] && r[1].length; });
    if (rows.length) {
      html += '<dl class="pt-tags">' + rows.map(function (r) {
        return '<div class="pt-tagrow' + r[2] + '"><dt>' + esc(r[0]) + ":</dt><dd>" +
          r[1].map(function (t) { return '<span class="pt-pill">' + inline(t) + "</span>"; }).join("") + "</dd></div>";
      }).join("") + "</dl>";
    }
    if (R.papers && R.papers.length) {
      html += h2(TEXT.papers) + '<ol class="pt-papers">';
      R.papers.forEach(function (p, i) {
        var meta = [p.status, p.year].filter(function (v) { return v != null && v !== ""; }).join(", ");
        var with_ = U.withCoauthorsMd(p);
        // Papers with an abstract get an "Abstract" button next to their PDF button (opens a popup; app.js).
        var absBtn = p.abstract ?
          '<button type="button" class="pt-btn pt-btn--blue" data-act="abstract" data-paper="' + (i + 1) + '" aria-haspopup="dialog" aria-describedby="pt-paper-' + (i + 1) + '">' +
            MINI.text + esc(R.abstractLabel || TEXT.abstract) + "</button>" : "";
        html += '<li class="pt-card pt-paper">' +
          '<span class="pt-num" aria-hidden="true">' + (i + 1) + "</span>" +
          "<div>" +
            '<h3 id="pt-paper-' + (i + 1) + '">' + inline(p.title) + "</h3>" +
            (with_ ? '<p class="pt-with">' + inline(with_) + "</p>" : "") +
            (meta ? '<p class="pt-meta">' + inline(meta) + "</p>" : "") +
            linkButtons(p.links, absBtn) +
          "</div>" +
        "</li>";
      });
      html += "</ol>";
    }
    return html + next("research") + "</div>";
  }

  // The Abstract popup for paper n (counting from 1, as numbered on the page): the title, the
  // coauthors, the abstract exactly as in content.js, and a link to the PDF. Shown by app.js in an
  // XP dialog. Returns null if that paper has no abstract.
  function abstractPopup(n) {
    var R = SITE.research || {}, p = (R.papers || [])[n - 1];
    if (!p || !p.abstract) return null;
    var pdf = pdfLink(p), with_ = U.withCoauthorsMd(p);
    return {
      title: (R.abstractLabel || TEXT.abstract) + " - " + U.plain(p.title),
      html: '<div class="pt-abs">' +
        '<h2 class="pt-abs-title">' + inline(p.title) + "</h2>" +
        (with_ ? '<p class="pt-abs-with">' + inline(with_) + "</p>" : "") +
        '<div class="pt-abs-text" tabindex="0" role="region" aria-label="' + esc(R.abstractLabel || TEXT.abstract) + '">' +
          "<p>" + inline(p.abstract) + "</p></div>" +
        (pdf ? '<p class="pt-abs-pdf"><a ' + U.linkAttrs(pdf.url) + ">" + MINI.pdf + esc(TEXT.abstractPdf) + "</a></p>" : "") +
      "</div>"
    };
  }

  // ---------- Talks ----------
  function talks() {
    var years = SITE.talks || [];
    var anyUpcoming = years.some(function (y) {
      return (y.items || []).some(function (t) { return U.isUpcoming(y.year, t.month); });
    });
    var html = '<div class="pt-page pt-talks-page">' + head("talks", 13);
    if (anyUpcoming) {
      html += '<p class="pt-legend">' +
        svg("0 0 46 26", '<path d="' + D.loop(4, 5, 38, 16, { seed: 81, radius: 8, wobble: 0.8, overshoot: 2 }) + '" ' + stroke(2.4, "#e00000") + "/>") +
        esc(TEXT.legend) + "</p>";
    }
    years.forEach(function (y, yi) {
      html += '<section class="pt-year" aria-label="' + esc(y.year) + '">' +
        '<h2 class="pt-year-label">' + esc(y.year) + "</h2>" +
        '<ul class="pt-talks">';
      (y.items || []).forEach(function (t, ti) {
        var up = U.isUpcoming(y.year, t.month);
        var body = "<b>" + inline(t.event) + "</b>" +
          (t.detail ? ' <span class="pt-detail">&ndash; ' + inline(t.detail) + "</span>" : "") +
          (t.note ? " <i>(" + inline(t.note) + ")</i>" : "");
        if (up) {
          // A red marker loop around the talk. Its drawing is sized from the text length, so the
          // round ends stay round when the SVG stretches to fit the text.
          var chars = U.plain(t.event).length + U.plain(t.detail || "").length + 3;
          var W = Math.max(160, Math.min(760, Math.round(chars * 7.4) + 20));
          var ring = '<svg class="pt-circle" viewBox="0 0 ' + W + ' 44" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
            '<path d="' + D.loop(4, 4, W - 8, 36, { seed: 90 + yi * 10 + ti, radius: 18, wobble: 1.3, overshoot: 2 }) + '" fill="none" stroke="#e00000" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linecap="round"/></svg>';
          html += '<li class="pt-talk is-upcoming"><span class="pt-ring">' + body + ring + "</span>" +
            '<span class="pt-sticker">' + esc(TEXT.upcoming) + "</span></li>";
        } else {
          html += '<li class="pt-talk">' + body + "</li>";
        }
      });
      html += "</ul></section>";
    });
    return html + next("talks") + "</div>";
  }

  // ---------- CV ----------
  function cv() {
    var C = SITE.cv || {}, pdf = C.pdf || (SITE.person && SITE.person.links && SITE.person.links.cv);
    var html = '<div class="pt-page pt-cv">' + head("cv", 14);
    if (pdf) {
      html += '<div class="pt-cv-actions">' +
        '<a class="pt-btn pt-btn--big" href="' + esc(U.url(pdf)) + '" target="_blank" rel="noopener">' + MINI.pdf + esc(TEXT.viewCv) + "</a>" +
        '<a class="pt-btn pt-btn--big pt-btn--blue" href="' + esc(U.url(pdf)) + '" download>' + MINI.down + esc(C.downloadLabel || "Download") + "</a>" +
        '<span class="pt-note">' + esc(TEXT.cvNote) + "</span>" +
      "</div>";
    }
    var edu = SITE.education || [];
    if (edu.length) {
      html += h2(TEXT.education);
      edu.forEach(function (e) {
        html += '<article class="pt-card pt-edu">' +
          "<h3>" + inline(e.degree) + "</h3>" +
          '<span class="pt-dates">' + esc(e.dates) + "</span>" +
          '<p class="pt-inst">' + inline(e.institution) + "</p>" +
          (e.details && e.details.length ? "<ul>" + e.details.map(function (d) { return "<li>" + inline(d) + "</li>"; }).join("") + "</ul>" : "") +
        "</article>";
      });
    }
    return html + next("cv") + "</div>";
  }

  // ---------- Art ----------
  // Performances above the art projects (Lehan, 2026-10-05), both as picture cards.
  function art() {
    var A = SITE.art || {};
    var html = '<div class="pt-page pt-art">' + head("art", 15);
    [[A.performances, TEXT.performances], [A.projects, TEXT.projects]].forEach(function (sec) {
      if (!sec[0] || !sec[0].length) return;
      html += h2(sec[1]);
      sec[0].forEach(function (p) {
        html += '<article class="pt-card pt-project">' +
          '<div class="pt-thumb">' + thumb(p) + "</div>" +
          "<div>" +
            "<h3>" + inline(p.title) + (p.dates ? ' <span class="pt-meta">(' + esc(p.dates) + ")</span>" : "") + "</h3>" +
            (p.medium ? '<p class="pt-medium">' + inline(p.medium) + "</p>" : "") +
            (p.description ? "<p>" + inline(p.description) + "</p>" : "") +
            linkButtons(p.links) +
          "</div>" +
        "</article>";
      });
    });
    var extra = [[A.photography, "camera"], [A.writing, "bowl"]].filter(function (x) { return x[0]; });
    if (extra.length) {
      html += h2(TEXT.elsewhere) + '<div class="pt-duo">';
      extra.forEach(function (x) {
        var e = x[0];
        html += '<article class="pt-card">' + svg("0 0 64 64", ICON[x[1]]()) +
          "<div><h3>" + inline(e.title) + "</h3>" +
          (e.description ? "<p>" + inline(e.description) + "</p>" : "") +
          (e.url ? '<p class="pt-btns"><a class="pt-btn" ' + U.linkAttrs(e.url) + ">" + MINI.out + esc(e.linkLabel || e.url) + "</a></p>" : "") +
          "</div></article>";
      });
      html += "</div>";
    }
    return html + next("art") + "</div>";
  }

  // ---------- Other Experience ----------
  // Order (Lehan, 2026-10-02): teaching and service first, then work experience, awards, skills.
  function experience() {
    var X = SITE.experience || {};
    var sections = [];
    if (X.teaching && X.teaching.length) sections.push(["teaching", TEXT.teaching, teachingHtml(X.teaching)]);
    if (X.service && X.service.length) {
      sections.push(["service", TEXT.service, '<div class="pt-card"><ul class="pt-rows">' +
        X.service.map(function (s) { return "<li><span>" + inline(s) + "</span></li>"; }).join("") + "</ul></div>"]);
    }
    if (X.work && X.work.length) sections.push(["work", TEXT.work, workHtml(X.work)]);
    if (X.awards && X.awards.length) {
      sections.push(["awards", TEXT.awards, '<div class="pt-card"><ul class="pt-rows">' +
        X.awards.map(function (a) {
          return "<li><span>" + inline(a.text) + '</span><span class="pt-dates">' + esc(a.years || "") + "</span></li>";
        }).join("") + "</ul></div>"]);
    }
    if (X.skills && X.skills.length) {
      sections.push(["skills", TEXT.skills, '<div class="pt-card pt-skills">' +
        X.skills.map(function (s) {
          return '<p class="pt-skill"><b>' + inline(s.label) + ":</b>" +
            (s.items || []).map(function (it) { return '<span class="pt-chip">' + inline(it) + "</span>"; }).join("") + "</p>";
        }).join("") + "</div>"]);
    }
    var html = '<div class="pt-page pt-experience">' + head("experience", 16);
    if (sections.length > 2) {
      html += '<p class="pt-jump"><span class="pt-note">' + esc(TEXT.jumpTo) + "</span>" +
        sections.map(function (s) { return '<button type="button" data-jump="pt-sec-' + s[0] + '">' + esc(s[1]) + "</button>"; }).join("") + "</p>";
    }
    sections.forEach(function (s) { html += h2(s[1], "pt-sec-" + s[0]) + s[2]; });
    return html + next("experience") + "</div>";
  }

  function workHtml(work) {
    return '<div class="pt-card">' + work.map(function (j) {
      var org = j.url ? '<a class="text-link" ' + U.linkAttrs(j.url) + ">" + inline(j.org) + "</a>" : inline(j.org);
      return '<div class="pt-job">' +
        '<span class="pt-dates">' + esc(j.dates) + "</span>" +
        "<h3>" + inline(j.role) + (j.type ? ' <span class="pt-type">(' + esc(j.type) + ")</span>" : "") + "</h3>" +
        '<p class="pt-org">' + org + "</p>" +
        (j.bullets && j.bullets.length ? "<ul>" + j.bullets.map(function (b) { return "<li>" + inline(b) + "</li>"; }).join("") + "</ul>" : "") +
      "</div>";
    }).join("") + "</div>";
  }

  function teachingHtml(list) {
    return '<div class="pt-card pt-teach">' + list.map(function (t, i) {
      return (i ? '<hr class="pt-rule">' : "") +
        "<h3>" + inline(t.institution) + ' <span class="pt-type">&middot; ' + inline(t.role) + "</span></h3>" +
        '<ul class="pt-rows">' + (t.courses || []).map(function (c) {
          return "<li><span>" + inline(c.name) + '</span><span class="pt-dates">' + esc(c.years || "") + "</span></li>";
        }).join("") + "</ul>";
    }).join("") + "</div>";
  }

  // ---------- Public ----------
  var RENDER = { start: start, home: home, research: research, talks: talks, experience: experience, cv: cv, art: art };

  window.PaintPages = {
    TEXT: TEXT,
    html: function (id) { return RENDER[id] ? RENDER[id]() : ""; },
    has: function (id) { return !!RENDER[id]; },
    accent: function (id) { return ACCENT[id] || "#0080ff"; },
    abstract: abstractPopup,
    icon: icon
  };
})();
