/* ==========================================================================
   fun/overleaf/tex-generate.js — slide objects -> a beamer LaTeX project.

     var project = TexGen.generate(Deck.fromContent(window.SITE, { abstracts: true }), { site: SITE });
     project.files   [{ name: "main.tex", text: "..." }, { name: "home.tex", ... }, ...]
     project.images  [{ name: "images/lehan-wide.jpg", src: "assets/img/lehan-wide.jpg", alt }]

   The project is real beamer that compiles on overleaf.com (pdfLaTeX):
     main.tex        the Madrid theme, the footer text, and one \input per page
     home.tex ...    one file per site page (SITE.pages), one frame per slide
     images/         the photos the slides use (they live in site/assets/img/)

   tex-parse.js reads the files back into slide objects ("Recompile"). The
   two files are a pair: whatever this one writes, that one must read back
   into the same slides, so an unedited project previews exactly the deck.
   If you change how something is written here, check tex-parse.js too.

   Slide layouts (shared/slides/deck.js) and how they are written:
     title        \frametitle, then columns: the picture left, paragraphs right
     bullets      \frametitle, \framesubtitle and an itemize (nested for "sub")
     two-column   a columns environment; each column has a \colheading and a list
     boxes        an itemize, then columns holding one block each; a block's
                  title is \href{address}{label} when the box is a link
     abstract     \frametitle, \framesubtitle, one block (the abstract), then
                  paragraphs (the paper's status and links)
     end          \centering, \bigtitle and paragraphs
   A subtitle with several lines is written line \\ line. "dense" slides start
   with a smaller size (\footnotesize; \scriptsize for two columns). The slide
   id is the frame's label. Links are always \href{address}{text}; see
   escapeUrl() for why only % and # are escaped in the address. Verified with
   pdfLaTeX and XeLaTeX: the PDF's links match content.js character for character.
   ========================================================================== */

(function () {
  "use strict";

  var IND = "  ";   // one level of indentation in the .tex files

  // ---------- Escaping ordinary text ----------
  // Characters that mean something to LaTeX, and how to print them instead.
  // Other characters (é, ü, ’ ...) are written as they are: the files are
  // UTF-8, which pdfLaTeX reads by default.
  var SPECIAL = {
    "\\": "\\textbackslash{}",
    "{": "\\{",
    "}": "\\}",
    "$": "\\$",
    "&": "\\&",
    "%": "\\%",
    "#": "\\#",
    "_": "\\_",
    "~": "\\textasciitilde{}",
    "^": "\\textasciicircum{}",
    "`": "\\textasciigrave{}",
    "\u2013": "--",          // – en dash, as in "2023–2025"
    "\u2014": "---",         // — em dash
    "\u201c": "``",          // “ opening double quote, the LaTeX way
    "\u201d": "''",          // ” closing double quote
    "\u2018": "`",           // ‘ opening single quote
    "\u00b7": "$\\cdot$",    // · the middle dot used as a separator
    "\u2026": "\\ldots{}",   // … ellipsis
    "\u00a0": "~",           // non-breaking space
    "\n": " ",
    "\r": "",
    "\t": " "
  };

  // In LaTeX's fonts some pairs of characters join into one glyph: -- is a
  // dash, '' a closing quote, `` an opening one, << and >> are guillemets,
  // ,, a low quote, !` and ?` are ¡ and ¿. When the text really has such
  // characters side by side, "{}" keeps them apart. (’ is the same glyph as
  // ' in LaTeX's fonts, so ’' would also become ”.)
  var LIGATURE_CHARS = "-',<>`";

  function escapeText(text) {
    var s = String(text == null ? "" : text);
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      var rep = SPECIAL[c];
      var first = rep != null ? rep.charAt(0) : c;
      var last = out.charAt(out.length - 1);
      if (first === "’") first = "'";
      if (last === "’") last = "'";
      if (LIGATURE_CHARS.indexOf(first) >= 0 && (last === first || (first === "`" && (last === "!" || last === "?")))) out += "{}";
      out += rep != null ? rep : c;
    }
    return out;
  }

  // ---------- Escaping link addresses ----------
  // Every link is written \href{address}{text}, never \url{address}: \url
  // typesets the address, \href does not. hyperref copies the address
  // straight into the PDF, so &, _, ~ and the like stay as they are (writing
  // \& would even put a backslash into the link). Only three things need care,
  // because a beamer frame reads its whole body as one macro argument:
  //   %  would start a comment          -> written \%  (hyperref turns it back into %)
  //   #  would be a macro parameter     -> written \#  (hyperref turns it back into #)
  //   \ { } ^ and spaces cannot be written safely -> percent-encoded (%5C, %7B, ...),
  //   which browsers read as the same address. Real links never contain them raw.
  function escapeUrl(url) {
    return String(url == null ? "" : url).replace(/[%#\\{}^\s]/g, function (c) {
      if (c === "%") return "\\%";
      if (c === "#") return "\\#";
      var hex = c.charCodeAt(0).toString(16).toUpperCase();
      return "\\%" + (hex.length < 2 ? "0" + hex : hex);
    });
  }

  // ---------- content.js mini-markdown -> LaTeX ----------
  // **bold** -> \textbf{}, *italic* -> \emph{}, [text](url) -> \href{url}{text}.
  // Mirrors SiteUtil.inline() exactly (links first, then bold, then italic),
  // so that the parser's markdown re-renders to the same HTML.
  function inlineTex(md) {
    var links = [];
    var s = String(md == null ? "" : md);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, label, href) {
      links.push(href);
      return "\u0001" + label + "\u0002";
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, "\u0003$1\u0004");
    s = s.replace(/\*([^*]+)\*/g, "\u0005$1\u0006");

    var out = "", chunk = "", li = 0;
    function flush() { out += escapeText(chunk); chunk = ""; }
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "\u0001") { flush(); out += "\\href{" + escapeUrl(links[li++]) + "}{"; }
      else if (c === "\u0003") { flush(); out += "\\textbf{"; }
      else if (c === "\u0005") { flush(); out += "\\emph{"; }
      else if (c === "\u0002" || c === "\u0004" || c === "\u0006") { flush(); out += "}"; }
      else chunk += c;
    }
    flush();
    return out;
  }

  // Text right after \item must not start with [ or < (LaTeX would read it as
  // an optional label or an overlay); "{}" in front prevents that.
  function guardStart(tex) {
    return /^[[<]/.test(tex) ? "{}" + tex : tex;
  }

  function repeat(s, n) { var r = ""; while (n-- > 0) r += s; return r; }

  // A label for \begin{frame}[label=...]: braces if it has , = ] or spaces.
  function labelTex(id) {
    var s = String(id == null ? "" : id);
    return /[,=\]\[{}\s%#\\]/.test(s) ? "{" + escapeText(s) + "}" : s;
  }

  // A subtitle: one line, or several (an array) joined with \\ at a line end.
  function subtitleLines(sub) {
    return (Array.isArray(sub) ? sub : [sub]).filter(function (x) { return x != null && x !== ""; });
  }

  // ---------- Images ----------
  // The slides use site paths (assets/img/x.jpg); in the LaTeX project they
  // sit in an images/ folder, like on Overleaf.
  function texImagePath(src) {
    var s = String(src || "");
    if (/^assets\/img\//.test(s)) return "images/" + s.slice("assets/img/".length);
    if (/^[a-z]+:/i.test(s)) return s;            // external address: leave it
    return "images/" + s.split("/").pop();
  }

  // ---------- One slide -> one frame ----------
  function listTex(items, depth, lines) {
    if (!items || !items.length) return;           // an empty itemize is a LaTeX error
    var pad = repeat(IND, depth);
    lines.push(pad + "\\begin{itemize}");
    items.forEach(function (b) {
      var isObj = b && typeof b === "object";
      var text = isObj ? b.text : b;
      var tex = guardStart(inlineTex(text));
      lines.push(pad + IND + "\\item" + (tex ? " " + tex : ""));
      if (isObj && b.sub && b.sub.length) listTex(b.sub, depth + 2, lines);
    });
    lines.push(pad + "\\end{itemize}");
  }

  // Paragraphs, a blank line between them; skip: "\\medskip" also puts some
  // space between them (beamer leaves none).
  function paragraphsTex(paras, pad, lines, skip) {
    (paras || []).forEach(function (p, i) {
      if (i) {
        lines.push("");
        if (skip) lines.push(pad + skip);
      }
      lines.push(pad + guardStart(inlineTex(p)));
    });
  }

  var LAYOUT_NOTE = {
    "title": "The photo (images folder) on the left,\n% the text on the right.",
    "two-column": "Two columns, each with a \\colheading\n% and a list.",
    "boxes": "A list, then blocks side by side. A\n% block's title can be a link (\\href).",
    "abstract": "A paper: its abstract in a block, then\n% its status and links."
  };

  // The size of a "dense" slide: one step down from \footnotesize for two
  // columns of talks, which hold the most text.
  function denseSize(slide) {
    return slide.layout === "two-column" ? "scriptsize" : "footnotesize";
  }

  // Column widths (fractions of \textwidth, 0.96 in all): two columns share
  // the width so that the longer list gets more room and neither runs off the
  // slide. A rough estimate of each column's height in lines, at each split
  // from 38/58 to 58/38; the split with the lowest taller column wins (ties:
  // the more even one). Sizes in pt for Latin Modern Sans on a 16:9 frame.
  function columnWidths(slide) {
    var cols = slide.columns || [];
    if (cols.length !== 2) return cols.map(function () { return Math.floor(96 / Math.max(cols.length, 1)) / 100; });
    var fs = slide.dense ? (denseSize(slide) === "scriptsize" ? 7.97 : 8.97) : 10.91;
    var charW = 0.475 * fs, textW = 431.7, indent = 21.8;
    function plain(md) {
      return String(md || "").replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1").replace(/\*\*?([^*]+)\*\*?/g, "$1");
    }
    function height(col, frac) {
      var perLine = Math.max(8, (frac * textW - indent) / charW), lines = col.heading ? 1.5 : 0;
      (function count(items, depth) {
        (items || []).forEach(function (b) {
          var obj = b && typeof b === "object";          // ("text".sub is a String method)
          lines += Math.ceil(Math.max(1, plain(obj ? b.text : b).length) / (perLine - depth * 4)) + 0.35;
          if (obj && b.sub) count(b.sub, depth + 1);
        });
      })(col.bullets, 0);
      return lines;
    }
    var best = null;
    for (var a = 38; a <= 58; a++) {
      var h = Math.max(height(cols[0], a / 100), height(cols[1], (96 - a) / 100));
      if (!best || h < best.h - 1e-9 || (Math.abs(h - best.h) < 1e-9 && Math.abs(a - 48) < Math.abs(best.a - 48))) best = { a: a, h: h };
    }
    return [best.a / 100, (96 - best.a) / 100];
  }

  function frameTex(slide, pad) {
    var lines = [];
    var layout = slide.layout || "bullets";
    var p1 = pad + IND, p2 = p1 + IND, p3 = p2 + IND;
    var depth = pad.length / IND.length;

    lines.push(pad + "% ---- " + (String(slide.title || slide.id || "Slide").replace(/[\r\n]+/g, " ")) + " ----");
    if (LAYOUT_NOTE[layout]) lines.push(pad + "% " + LAYOUT_NOTE[layout].replace(/\n/g, "\n" + pad));
    lines.push(pad + "\\begin{frame}[label=" + labelTex(slide.id) + "]");

    if (layout !== "end" && slide.title) lines.push(p1 + "\\frametitle{" + inlineTex(slide.title) + "}");
    if (layout !== "title" && layout !== "end") {
      var subs = subtitleLines(slide.subtitle);
      if (subs.length) {
        lines.push(p1 + "\\framesubtitle{" + subs.map(function (s, i) {
          return (i ? p2 : "") + inlineTex(s);
        }).join("\\\\\n") + "}");
      }
    }
    if (slide.dense) lines.push(p1 + "\\" + denseSize(slide) + " % smaller text, so it all fits");

    if (layout === "title") {
      var img = slide.image || {};
      lines.push(p1 + "\\begin{columns}[c]");
      lines.push(p2 + "\\begin{column}{0.38\\textwidth}");
      if (slide.image && img.alt) {                // over three lines: it is long for the narrow editor
        lines.push(p3 + "\\includegraphics[width=\\linewidth,");
        lines.push(p3 + IND + "alt={" + escapeText(img.alt) + "}]");
        lines.push(p3 + IND + "{" + texImagePath(img.src) + "}");
      } else if (slide.image) {
        lines.push(p3 + "\\includegraphics[width=\\linewidth]{" + texImagePath(img.src) + "}");
      }
      lines.push(p2 + "\\end{column}");
      lines.push(p2 + "\\begin{column}{0.58\\textwidth}");
      paragraphsTex(slide.paragraphs, p3, lines, "\\medskip");
      lines.push(p2 + "\\end{column}");
      lines.push(p1 + "\\end{columns}");
    } else if (layout === "end") {
      lines.push(p1 + "\\centering");
      lines.push(p1 + "\\bigtitle{" + inlineTex(slide.title || "") + "}");
      if (slide.paragraphs && slide.paragraphs.length) {
        lines.push("");
        paragraphsTex(slide.paragraphs, p1, lines);
      }
    } else if (layout === "two-column") {
      var widths = columnWidths(slide);
      lines.push(p1 + "\\begin{columns}[T]");
      (slide.columns || []).forEach(function (c, ci) {
        lines.push(p2 + "\\begin{column}{" + widths[ci].toFixed(2) + "\\textwidth}");
        if (c.heading) lines.push(p3 + "\\colheading{" + inlineTex(c.heading) + "}");
        listTex(c.bullets, depth + 3, lines);
        lines.push(p2 + "\\end{column}");
      });
      lines.push(p1 + "\\end{columns}");
    } else if (layout === "boxes") {
      listTex(slide.bullets, depth + 1, lines);
      var boxes = slide.boxes || [];
      if (boxes.length) {
        if (slide.bullets && slide.bullets.length) lines.push(p1 + "\\bigskip");
        var w = (Math.floor(96 / boxes.length) / 100).toFixed(2);
        lines.push(p1 + "\\begin{columns}[T]");
        boxes.forEach(function (b) {
          var label = inlineTex(b.label || "");
          lines.push(p2 + "\\begin{column}{" + w + "\\textwidth}");
          lines.push(p3 + "\\begin{block}{" + (b.href ? "\\href{" + escapeUrl(b.href) + "}{" + label + "}" : label) + "}");
          if (b.text) lines.push(p3 + IND + guardStart(inlineTex(b.text)));
          lines.push(p3 + "\\end{block}");
          lines.push(p2 + "\\end{column}");
        });
        lines.push(p1 + "\\end{columns}");
      }
    } else if (layout === "abstract") {
      var block = slide.block || {};
      lines.push(p1 + "\\begin{block}{" + inlineTex(block.title || "") + "}");
      lines.push(p2 + "\\footnotesize");
      if (block.text) lines.push(p2 + inlineTex(block.text));
      lines.push(p1 + "\\end{block}");
      if (slide.paragraphs && slide.paragraphs.length) {
        lines.push(p1 + "\\medskip");
        lines.push("");
        paragraphsTex(slide.paragraphs, p1, lines);
      }
    } else {
      listTex(slide.bullets, depth + 1, lines);
    }

    lines.push(pad + "\\end{frame}");
    return lines;
  }

  // ---------- The whole project ----------
  // Comment lines are kept to about 42 characters: the editor pane is narrow
  // (and narrower still on a phone).
  var RULE = "% " + repeat("=", 38);
  function fileHeader(lines) {
    return [RULE].concat(lines.map(function (l) { return l ? "%  " + l : "%"; })).concat([RULE]);
  }

  function pageLabel(site, id) {
    var pages = (site && site.pages) || [];
    for (var i = 0; i < pages.length; i++) if (pages[i].id === id) return pages[i].label;
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  // A macro name for a slide that has to be shown out of file order, such as
  // the closing slide: \thankyouslide.
  function macroName(slide, used) {
    var base = String(slide.title || slide.id || "slide").toLowerCase().replace(/[^a-z]/g, "") || "extra";
    var name = base + "slide", n = 2;
    while (used[name]) name = base + "slide" + String.fromCharCode(96 + n++);
    used[name] = true;
    return name;
  }

  function generate(slides, opts) {
    opts = opts || {};
    var site = opts.site || window.SITE || {};
    slides = slides || [];

    // 1. Group the slides by page, pages in order of first appearance. A
    //    slide whose page file was already "closed" (another page came in
    //    between, like the closing slide) is defined as a macro in its page
    //    file and called from main.tex at the right place, so the frame order
    //    stays exactly the deck order.
    var pages = [], byPage = {}, sequence = [], started = {}, current = null, used = {};
    slides.forEach(function (s) {
      var page = s.page || "slides";
      if (!byPage[page]) { byPage[page] = { inline: [], deferred: [] }; pages.push(page); }
      if (page === current) {
        var last = sequence[sequence.length - 1];
        if (last.type === "call") last.slides.push(s);          // continue a deferred run
        else byPage[page].inline.push(s);
      } else if (!started[page]) {
        started[page] = true;
        current = page;
        byPage[page].inline.push(s);
        sequence.push({ type: "input", page: page });
      } else {
        current = page;
        var call = { type: "call", page: page, slides: [s], macro: macroName(s, used) };
        byPage[page].deferred.push(call);
        sequence.push(call);
      }
    });

    // 2. Page files.
    var files = [{ name: "main.tex", text: "" }];
    pages.forEach(function (page) {
      var group = byPage[page];
      var count = group.inline.length + group.deferred.reduce(function (n, c) { return n + c.slides.length; }, 0);
      var lines = fileHeader([
        page + ".tex",
        "The " + pageLabel(site, page) + " page (" + count + (count === 1 ? " slide)." : " slides)."),
        "Edit, then Recompile (Ctrl+Enter).",
        "",
        "\\textbf{bold}   \\emph{italic}",
        "\\href{https://...}{link text}"
      ]);
      group.inline.forEach(function (s) {
        lines.push("");
        lines = lines.concat(frameTex(s, ""));
      });
      group.deferred.forEach(function (call) {
        lines.push("");
        lines.push("% ---- Shown later ----");
        lines.push("% This slide comes later in the deck:");
        lines.push("% main.tex calls \\" + call.macro + " there.");
        lines.push("\\newcommand{\\" + call.macro + "}{%");
        call.slides.forEach(function (s, i) {
          if (i) lines.push("");
          lines = lines.concat(frameTex(s, IND));
        });
        lines.push("}");
      });
      lines.push("");
      files.push({ name: page + ".tex", page: page, text: lines.join("\n") });
    });

    // 3. main.tex: the design, then the pages in order.
    var body = [];
    var width = 0;
    sequence.forEach(function (e) {
      var code = e.type === "input" ? "\\input{" + e.page + "}" : "\\" + e.macro;
      width = Math.max(width, code.length);
    });
    sequence.forEach(function (e) {
      var code = e.type === "input" ? "\\input{" + e.page + "}" : "\\" + e.macro;
      var note = e.type === "input" ? pageLabel(site, e.page) : "in " + e.page + ".tex";
      body.push(IND + code + repeat(" ", width - code.length + 2) + "% " + note);
    });

    files[0].text = mainTex(site, body);

    // 4. Images used by the slides.
    var images = [], seen = {};
    slides.forEach(function (s) {
      if (s.image && s.image.src) {
        var name = texImagePath(s.image.src);
        if (!seen[name]) { seen[name] = true; images.push({ name: name, src: s.image.src, alt: s.image.alt || "" }); }
      }
    });

    return { main: "main.tex", files: files, images: images };
  }

  // ---------- main.tex ----------
  // Beamer's classic Madrid theme, as it comes: a blue title bar, rounded
  // blocks, ball bullets and the three-part footer. Its footer shows the
  // short author (and institute), the short title and the page number, all
  // taken from content.js. The preview (overleaf.css) draws the same theme.
  function footer(site) {
    var person = site.person || {};
    var name = person.name || "Lehan Zhang";
    // "PhD Candidate, [AI & Economics Lab](...), ETH Zurich": the place is the last part.
    var aff = String(person.affiliation || "");
    var place = aff.split(/,\s*/).pop();
    return { name: name, aff: aff, place: place };
  }

  function mainTex(site, inputs) {
    var f = footer(site);
    var lines = [
      RULE,
      "%  main.tex: lehanzhang.com as a LaTeX",
      "%  beamer slide deck, in the Madrid theme.",
      "%",
      "%  Each page of the website is its own",
      "%  file: click one in the list on the left",
      "%  to edit it, then press Recompile (or",
      "%  Ctrl+Enter). Your edits stay in this",
      "%  browser, and refreshing the page",
      "%  brings back the original website.",
      RULE,
      "",
      "% 16:9 slides",
      "\\documentclass[aspectratio=169]{beamer}",
      "",
      "% ---- Theme ----",
      "% Madrid: a blue title bar on each frame,",
      "% rounded blocks, ball bullets, and a footer",
      "% with the author, the title and the page.",
      "\\usetheme{Madrid}",
      "",
      "% ---- Packages ----",
      "% UTF-8 text (\u00e9, \u00fc, \u2019) in Latin Modern",
      "\\usepackage[utf8]{inputenc}",
      "\\usepackage[T1]{fontenc}",
      "\\usepackage{lmodern}",
      "\\usepackage{relsize}  % \\smaller",
      "",
      "% Sub-points: one size smaller than",
      "% their point (also in \\footnotesize)",
      "\\setbeamerfont{itemize/enumerate subbody}",
      "  {size=\\smaller}",
      "",
      "% ---- Shortcuts used in the page files ----",
      "% \\bigtitle{text}: the large blue title of",
      "% the closing slide (it also spaces out the",
      "% paragraphs after it)",
      "\\newcommand{\\bigtitle}[1]{%",
      "  {\\usebeamercolor[fg]{structure}%",
      "   \\Huge\\bfseries #1\\par}%",
      "  \\bigskip\\setlength{\\parskip}{0.8em}}",
      "",
      "% \\colheading{text}: a blue heading above a",
      "% column of bullet points",
      "\\newcommand{\\colheading}[1]{%",
      "  {\\usebeamercolor[fg]{structure}%",
      "   \\bfseries #1\\par}\\smallskip}",
      "",
      "% ---- About this document ----",
      "% The [short] versions are shown in the",
      "% footer of every slide.",
      "\\title[lehanzhang.com]{" + escapeText(f.name) + "}",
      "\\author[" + escapeText(f.name) + "]{" + escapeText(f.name) + "}"
    ];
    if (f.aff) lines.push("\\institute[" + escapeText(f.place) + "]{" + inlineTex(f.aff) + "}");
    lines.push("\\date{}");
    return lines.concat([
      "",
      "\\begin{document}",
      "",
      "  % One file per page of the website, in",
      "  % menu order. Edit any of them, then",
      "  % Recompile.",
      inputs.join("\n"),
      "",
      "\\end{document}",
      ""
    ]).join("\n");
  }

  window.TexGen = {
    generate: generate,
    inlineTex: inlineTex,
    escapeText: escapeText,
    escapeUrl: escapeUrl,
    texImagePath: texImagePath
  };
})();
