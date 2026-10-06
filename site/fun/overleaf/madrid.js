/* ==========================================================================
   fun/overleaf/madrid.js — draws a slide the way beamer's Madrid theme
   typesets it, for the Overleaf preview (and its "Download PDF").

     var el = Madrid.render(slide, {
       index: 0, total: 11,          // for the page counter "1 / 11"
       source: res.sources[0],       // tex-parse.js: size, valign, plain, colWidths, blockSize
       footer: res.footer            // tex-parse.js: author, institute, title, date, nav
     });

   Deck.render() (shared with PowerPoint) builds the slide's contents; this
   file rearranges them into Madrid's parts and adds the footer:
     .mad-frametitle  the blue title bar: the title, then the subtitle lines
     .mad-body        the space between the bar and the footer; .mad-inner sits
                      in it as beamer places a frame's contents: 2/5 of the free
                      space above, 3/5 below ([c], the default), at the top [t]
                      or at the bottom [b]
     .mad-nav         the little navigation symbols above the footer
     .mad-foot        author (institute) | short title | date and page n / N
   The look is in overleaf.css ("Madrid"), measured on a real pdfLaTeX compile.
   Mismatch report: Madrid.overflow(el) says how far the contents run past
   the bottom of the frame (in pt), as LaTeX's "Overfull \vbox" does.
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil;
  var PAGE_BP = 453.543;            // a 16:9 beamer page is 160 mm = 453.543 bp wide

  function div(cls) {
    var d = document.createElement("div");
    d.className = cls;
    return d;
  }

  // Beamer's navigation symbols (slide, frame, subsection, section, document, search),
  // drawn as an SVG in page units (bp); colour: structure 20% on white.
  var NAV = '<svg class="mad-nav" viewBox="325 238.6 125 5" aria-hidden="true" focusable="false">' +
    '<g fill="currentColor"><path d="M326.1 241 328.1 239.5V242.5Z"/><path d="M342.1 241 340.1 239.5V242.5Z"/>' +
    '<path d="M347.4 241 349.4 239.5V242.5Z"/><path d="M363.4 241 361.4 239.5V242.5Z"/>' +
    '<path d="M368.8 241 370.8 239.5V242.5Z"/><path d="M384.8 241 382.8 239.5V242.5Z"/>' +
    '<path d="M390.1 241 392.1 239.5V242.5Z"/><path d="M406.1 241 404.1 239.5V242.5Z"/></g>' +
    '<g fill="none" stroke="currentColor" stroke-width=".4">' +
    '<rect x="332.4" y="239.8" width="3.4" height="2.4"/>' +
    '<path d="M352.4 240.2h3v2.3h-3zM353.4 240.2v-1h3v2.3h-1M354.4 239.2v-.1h3v2.2h-1"/>' +
    '<path d="M374.8 239.3h4M374.8 240.6h4M374.8 241.9h4M374.8 243h4"/>' +
    '<path d="M396.1 239.3h4M396.1 240.6h4M396.1 241.9h4M396.1 243h4"/>' +
    '<path d="M417.4 239.3h4M417.4 240.6h4M417.4 241.9h4M417.4 243h4"/>' +
    '<path d="M434.4 242.6a1.7 1.7 0 1 1 1.5-2.4M435.9 240.2l-.9.1M435.9 240.2l.1-.9"/>' +
    '<circle cx="440.3" cy="240.5" r="1.1"/><path d="M441.1 241.3l1.6 1.6"/>' +
    '<path d="M446.2 242.6a1.7 1.7 0 1 0-1.5-2.4M444.7 240.2l.9.1M444.7 240.2l-.1-.9"/></g></svg>';

  function render(slide, info) {
    info = info || {};
    var src = info.source || {}, foot = info.footer || {};
    var el = Deck.render(slide);
    var layout = slide.layout || "bullets";
    el.classList.add("mad", "mad--" + layout, "mad-size-" + (src.size || "normalsize"), "mad-v" + (src.valign || "c"));
    if (src.plain) el.classList.add("mad-plain");

    var title = el.querySelector(".slide-title"), sub = el.querySelector(".slide-subtitle");
    var kids = Array.prototype.slice.call(el.childNodes);

    // 1. The blue title bar (not on the closing slide: its title is a \bigtitle)
    var bar = null;
    if (layout !== "end" && ((title && slide.title) || sub)) {
      bar = div("mad-frametitle");
      if (title && slide.title) bar.appendChild(title);
      if (sub) bar.appendChild(sub);
    } else if (layout !== "end" && title) {
      title.parentNode.removeChild(title);
    }
    if (!bar) el.classList.add("mad-untitled");

    // 2. The contents, placed in the body
    var body = div("mad-body"), inner = div("mad-inner");
    if (layout === "title") {
      // the picture and the text side by side, like the two columns in home.tex
      var cols = div("mad-cols mad-cols--title");
      var photo = el.querySelector(".slide-photo"), text = el.querySelector(".slide-text");
      if (photo) cols.appendChild(photo);
      if (text) cols.appendChild(text);
      inner.appendChild(cols);
    } else {
      kids.forEach(function (k) { if (k !== title && k !== sub && k.parentNode === el) inner.appendChild(k); });
      if (layout === "end" && title && title.parentNode === el) inner.insertBefore(title, inner.firstChild);
    }
    // Column widths from the .tex (\begin{column}{0.52\textwidth}); equal otherwise
    var grid = inner.querySelector(".slide-columns");
    if (grid && src.colWidths && src.colWidths.length === grid.children.length && src.colWidths.every(Boolean)) {
      Array.prototype.forEach.call(grid.children, function (c, i) { c.style.flexBasis = (src.colWidths[i] * 100) + "%"; });
    }
    // Blocks in columns (art.tex): each column is 0.96 / n of the text width; a block
    // reaches 4 bp past its column on both sides.
    var boxes = inner.querySelectorAll(".slide-box");
    Array.prototype.forEach.call(boxes, function (b) {
      b.style.flexBasis = "calc(" + Math.floor(96 / boxes.length) + "% + 8 * var(--bp))";
    });
    if (src.blockSize) el.classList.add("mad-block-" + src.blockSize);
    body.appendChild(inner);

    while (el.firstChild) el.removeChild(el.firstChild);
    if (bar) el.appendChild(bar);
    el.appendChild(body);

    // 3. The footer: author (institute) | short title | date, page n / N
    if (!src.plain) {
      if (foot.nav !== false) el.insertAdjacentHTML("beforeend", NAV);
      var f = div("mad-foot");
      f.setAttribute("aria-hidden", "true");          // the page counter is read out by the app itself
      f.innerHTML =
        '<span class="mad-foot-a">' + U.inline(foot.author || "") +
          (foot.institute ? "&nbsp;&nbsp;(" + U.inline(foot.institute) + ")" : "") + "</span>" +
        '<span class="mad-foot-t">' + U.inline(foot.title || "") + "</span>" +
        '<span class="mad-foot-d"><span class="mad-foot-date">' + U.inline(foot.date || "") + "</span>" +
          '<span class="mad-foot-n">' + ((info.index || 0) + 1) + " / " + (info.total || 1) + "</span></span>";
      el.appendChild(f);
    }
    return el;
  }

  // How far the contents run past the bottom of the frame, in TeX points (0 if they fit).
  function overflow(el) {
    var body = el.querySelector(".mad-body"), inner = el.querySelector(".mad-inner");
    if (!body || !inner || !el.clientWidth) return 0;
    var over = inner.offsetHeight - body.clientHeight;
    return over > 1 ? over / el.clientWidth * PAGE_BP * 72.27 / 72 : 0;
  }

  window.Madrid = { render: render, overflow: overflow };
})();
