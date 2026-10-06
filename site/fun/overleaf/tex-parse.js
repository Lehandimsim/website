/* ==========================================================================
   fun/overleaf/tex-parse.js — "Recompile": beamer .tex files -> slide objects.

     var r = TexParse.compile({ "main.tex": "...", "home.tex": "..." }, { images: {...} });
     r.ok        false when an error stopped the compile (keep showing the last good preview)
     r.slides    slide objects in exactly the shape of shared/slides/deck.js (when ok)
     r.sources   [{ file, line, endLine, page, size, valign, plain, colWidths }] where each
                 slide's frame is and how it is typeset, same order as r.slides:
                   size       the frame's font size command ("footnotesize"), or null
                   valign     "t" | "c" | "b" (beamer's default is c, centred)
                   plain      true for \begin{frame}[plain] (no footer)
                   colWidths  [0.55, 0.41]: column widths as fractions of \textwidth
                   blockSize  the size command inside an abstract's block, or null
     r.footer    { author, institute, title, date, nav }: what Madrid's footer shows, from
                 \author[short]{...} & co.; nav is false after
                 \setbeamertemplate{navigation symbols}{}
     r.errors    [{ level, file, line, message, hint, context }]   red in the logs
     r.warnings  same shape                                         yellow in the logs
     r.notes     same shape, typesetting notes                      blue in the logs
     r.log       a short "raw log"

   This is not TeX. It reads the beamer subset that tex-generate.js writes,
   plus the edits a visitor is likely to make, the way LaTeX would:
     - main.tex's \input{...} files, in order; \newcommand / \def macros
       (including ones defined in a page file, like \thankyouslide);
     - frames: \begin{frame}[label=..]{Title}{Subtitle}, \frametitle,
       \framesubtitle, the old \frame{...} form, \titlepage;
     - itemize / enumerate / description, nested, with \item[label];
     - columns / column (and \column{..}), block environments, \linkbox,
       \includegraphics, \bigtitle, \colheading, \centering, size commands;
     - \textbf \emph \textit \href \url \\ $math$ accents, escaped characters,
       -- and ---, quotes, % comments.
   It never throws. An unknown command is shown as plain text and adds a
   warning. Structural problems (unbalanced braces, a missing \end{...},
   a missing file) are errors, worded like LaTeX's own messages.

   Layouts are inferred from what a frame contains (see buildSlide):
     a picture (and no list)     -> "title"
     one block on its own (no list, no columns)  -> "abstract"
     blocks in columns, or a list and a block    -> "boxes"
     a columns environment       -> "two-column" a list              -> "bullets"
     only text / \bigtitle       -> "end"        only a title        -> "bullets"
   \framesubtitle{line \\ line} gives a subtitle with two lines (an array).
   ========================================================================== */

(function () {
  "use strict";

  // ======================================================================
  // 0. Diagnostics
  // ======================================================================
  function Diag(files) {
    this.files = files || {};
    this.lines = {};
    this.errors = [];
    this.warnings = [];
    this.notes = [];
    this.seen = {};
  }
  Diag.prototype.source = function (file, line) {
    if (!this.lines[file]) this.lines[file] = String(this.files[file] == null ? "" : this.files[file]).split("\n");
    return (this.lines[file][line - 1] || "").replace(/\s+$/, "");
  };
  // at: any token or node with .file and .line
  Diag.prototype.add = function (level, at, message, hint) {
    var file = (at && at.file) || "main.tex";
    var line = (at && at.line) || 1;
    var key = level + "|" + file + "|" + line + "|" + message;
    if (this.seen[key]) return;
    this.seen[key] = true;
    var list = level === "error" ? this.errors : level === "warning" ? this.warnings : this.notes;
    if (list.length >= 40) return;
    list.push({
      level: level, file: file, line: line, message: message, hint: hint || "",
      context: "l." + line + " " + this.source(file, line).trim()
    });
  };
  Diag.prototype.error = function (at, m, h) { this.add("error", at, m, h); };
  Diag.prototype.warn = function (at, m, h) { this.add("warning", at, m, h); };
  Diag.prototype.note = function (at, m, h) { this.add("note", at, m, h); };

  // ======================================================================
  // 1. Tokenizer: TeX's reading rules, simplified.
  //    Token types: "cmd" (\name or \X; value = name), "text" (a run of
  //    ordinary characters), "space", "par" (a blank line), "verbatim",
  //    and the single characters { } [ ] $ $$ & # ^ _ ~
  //    Every token has file, line and raw (its source text).
  // ======================================================================
  var LETTER = /[A-Za-z@]/;
  var VERBATIM_ENV = /^[ \t]*\{(verbatim\*?|Verbatim|lstlisting)\}/;

  function tokenize(src, file) {
    src = String(src == null ? "" : src);
    var toks = [], n = src.length, i = 0, line = 1, state = "N";   // N new line, M mid-line, S skipping spaces
    var text = "", textLine = 1;

    function flush() {
      if (text) { toks.push({ type: "text", value: text, raw: text, file: file, line: textLine }); text = ""; }
    }
    function push(type, value, raw, ln) {
      flush();
      toks.push({ type: type, value: value, raw: raw, file: file, line: ln || line });
    }

    while (i < n) {
      var c = src.charAt(i);
      if (c === "\r") { i++; continue; }
      if (c === "\n") {
        if (state === "N") push("par", "", "\n");          // a blank line ends the paragraph
        else if (state === "M") push("space", " ", "\n");  // a line end counts as a space
        line++; i++; state = "N";
        continue;
      }
      if (c === " " || c === "\t" || c === "\f" || c === "\v") {
        if (state === "M") { push("space", " ", " "); state = "S"; }
        i++;
        continue;
      }
      if (c === "%") {                                     // comment: skip to the end of the line
        while (i < n && src.charAt(i) !== "\n") i++;
        if (i < n) { i++; line++; }
        state = "N";
        continue;
      }
      if (c === "\\") {
        var j = i + 1;
        if (j >= n) { push("cmd", " ", "\\"); i = j; continue; }
        var d = src.charAt(j);
        if (LETTER.test(d)) {
          while (j < n && LETTER.test(src.charAt(j))) j++;
          var name = src.slice(i + 1, j);
          var vm = name === "begin" ? VERBATIM_ENV.exec(src.slice(j, j + 40)) : null;
          if (vm) {                                         // \begin{verbatim} ... \end{verbatim}: raw text
            var endTag = "\\end{" + vm[1] + "}";
            var start = j + vm[0].length;
            var stop = src.indexOf(endTag, start);
            var to = stop < 0 ? n : stop + endTag.length;
            var tok = { type: "verbatim", value: src.slice(start, stop < 0 ? n : stop).replace(/^\r?\n/, "").replace(/\s+$/, ""),
              raw: src.slice(i, to), file: file, line: line, env: vm[1], unclosed: stop < 0 };
            flush();
            toks.push(tok);
            line += (src.slice(i, to).match(/\n/g) || []).length;
            i = to; state = "M";
            continue;
          }
          if (name === "verb" && j < n && !/[A-Za-z\s]/.test(src.charAt(j))) {   // \verb|text|
            var star = src.charAt(j) === "*" ? 1 : 0;
            var delim = src.charAt(j + star);
            var close = src.indexOf(delim, j + star + 1);
            var nl = src.indexOf("\n", j + star + 1);
            if (close < 0 || (nl >= 0 && nl < close)) close = nl < 0 ? n : nl;
            flush();
            toks.push({ type: "verbatim", value: src.slice(j + star + 1, close), raw: src.slice(i, close + 1), file: file, line: line, inline: true });
            i = Math.min(n, close + 1); state = "M";
            continue;
          }
          push("cmd", name, src.slice(i, j));
          i = j; state = "S";                              // spaces after a control word are skipped
          continue;
        }
        if (d === "\n" || d === "\r") {                    // backslash at the end of a line
          push("cmd", " ", "\\");
          i = j; state = "S";
          continue;
        }
        push("cmd", d, "\\" + d);                          // control symbol: \& \% \\ \, ...
        i = j + 1;
        state = d === " " ? "S" : "M";
        continue;
      }
      if (c === "$") {
        if (src.charAt(i + 1) === "$") { push("$$", "$$", "$$"); i += 2; }
        else { push("$", "$", "$"); i++; }
        state = "M";
        continue;
      }
      if ("{}[]&#^_~".indexOf(c) >= 0) { push(c, c, c); i++; state = "M"; continue; }
      if (!text) textLine = line;
      text += c; i++; state = "M";
    }
    flush();
    return toks;
  }

  // ======================================================================
  // 2. \input{file}: splice the file's tokens in (like TeX does).
  // ======================================================================
  function resolveFile(name, files) {
    var n = String(name || "").trim().replace(/^\.\//, "");
    if (files[n] != null && /\.tex$/i.test(n)) return n;
    if (files[n + ".tex"] != null) return n + ".tex";
    if (files[n] != null) return n;
    return null;
  }

  function expandInputs(toks, files, stack, diag, read) {
    var out = [];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i];
      if (t.type === "cmd" && (t.value === "input" || t.value === "include" || t.value === "subfile")) {
        var j = i + 1;
        while (j < toks.length && toks[j].type === "space") j++;
        if (j < toks.length && toks[j].type === "{") {
          var k = j + 1, name = "";
          while (k < toks.length && toks[k].type !== "}" && toks[k].type !== "par") { name += toks[k].raw; k++; }
          if (k < toks.length && toks[k].type === "}") {
            i = k;
            var file = resolveFile(name, files);
            var shown = name.trim() + (/\.[a-z]+$/i.test(name.trim()) ? "" : ".tex");
            if (!file) {
              diag.error(t, "LaTeX Error: File `" + shown + "' not found.",
                "There is no file called " + shown + " in this project. Check the spelling in \\" + t.value + "{...}.");
              continue;
            }
            if (stack.indexOf(file) >= 0 || stack.length > 12) {
              diag.error(t, "TeX capacity exceeded, sorry [text input levels=15].",
                file + " ends up \\input-ing itself, so it would never finish.");
              continue;
            }
            read.push(file);
            out = out.concat(expandInputs(tokenize(files[file], file), files, stack.concat([file]), diag, read));
            continue;
          }
        }
      }
      out.push(t);
    }
    return out;
  }

  // ======================================================================
  // 3. Braces: tokens -> a tree of { } groups.
  // ======================================================================
  function buildTree(toks, diag) {
    var root = { type: "group", children: [], file: "main.tex", line: 1 };
    var stack = [root];
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], top = stack[stack.length - 1];
      if (t.type === "{") {
        var g = { type: "group", children: [], file: t.file, line: t.line };
        top.children.push(g);
        stack.push(g);
      } else if (t.type === "}") {
        if (stack.length === 1) {
          diag.error(t, "Too many }'s.", "This } has no matching {. Delete it, or add the { that should go with it.");
        } else {
          stack.pop().endLine = t.line;
        }
      } else {
        top.children.push(t);
      }
    }
    while (stack.length > 1) {
      var open = stack.pop();
      var src = diag.source(open.file, open.line);
      diag.error(open, "Missing } inserted.", /(^|[^\\])%/.test(src)
        ? "The % on this line starts a comment, which hides the rest of the line (and its }). To print % or put it in a link address, write \\%."
        : "The { on this line is never closed. Add a } where the argument or group should end.");
    }
    return root;
  }

  // ======================================================================
  // Small helpers on node lists (tokens and groups, later environments)
  // ======================================================================
  function isSpace(nd) { return !!nd && nd.type === "space"; }
  function isBlank(nd) { return !!nd && (nd.type === "space" || nd.type === "par"); }
  function skipSpaces(nodes, i) { while (i < nodes.length && isSpace(nodes[i])) i++; return i; }
  function skipBlank(nodes, i) { while (i < nodes.length && isBlank(nodes[i])) i++; return i; }

  // The source text of some nodes (for names, labels, addresses, options).
  function rawText(nodes) {
    var s = "";
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "group") s += "{" + rawText(nd.children) + "}";
      else if (nd.type === "env") s += "\\begin{" + nd.name + "}" + rawText(nd.children) + "\\end{" + nd.name + "}";
      else if (nd.type === "param") s += "#" + nd.n;
      else s += nd.raw != null ? nd.raw : (nd.value || "");
    }
    return s;
  }

  // [ ... ] at nodes[i] (spaces allowed before it): { nodes, next } or null.
  function readBracket(nodes, i, noSpace) {
    var j = noSpace ? i : skipSpaces(nodes, i);
    if (!nodes[j] || nodes[j].type !== "[") return null;
    var depth = 0;
    for (var k = j + 1; k < nodes.length; k++) {
      if (nodes[k].type === "[") depth++;
      else if (nodes[k].type === "]") {
        if (!depth) return { nodes: nodes.slice(j + 1, k), next: k + 1 };
        depth--;
      } else if (nodes[k].type === "par") return null;
    }
    return null;
  }

  // The next argument: a {group} (its contents) or one token. TeX takes a
  // single character, not a whole word, so a text run is split. nodes must
  // be a copy the caller may modify.
  function readArg(nodes, i) {
    var j = skipSpaces(nodes, i);
    var nd = nodes[j];
    if (!nd || nd.type === "par" || nd.type === "]") return null;
    if (nd.type === "group") return { nodes: nd.children, next: j + 1, group: nd };
    if (nd.type === "text" && nd.value.length > 1) {
      var first = shallow(nd, { value: nd.value.charAt(0), raw: nd.value.charAt(0) });
      nodes[j] = shallow(nd, { value: nd.value.slice(1), raw: nd.value.slice(1) });
      return { nodes: [first], next: j };
    }
    return { nodes: [nd], next: j + 1 };
  }

  // Beamer overlay specification right after a command: <2->, <1-3|alert@2>.
  function skipOverlay(nodes, i) {
    var j = skipSpaces(nodes, i);
    var nd = nodes[j];
    if (!nd || nd.type !== "text" || nd.value.charAt(0) !== "<") return i;
    for (var k = j; k < nodes.length && k < j + 12; k++) {
      if (nodes[k].type !== "text") continue;
      var at = nodes[k].value.indexOf(">");
      if (at >= 0) {
        var rest = nodes[k].value.slice(at + 1);
        if (rest) { nodes[k] = shallow(nodes[k], { value: rest, raw: rest }); return k; }
        return k + 1;
      }
    }
    return i;
  }

  function shallow(o, extra) {
    var c = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) c[k] = o[k];
    for (var e in extra || {}) c[e] = extra[e];
    return c;
  }

  function cloneNodes(nodes) {
    return nodes.map(function (nd) {
      if (nd.type === "group" || nd.type === "env") return shallow(nd, { children: cloneNodes(nd.children) });
      return shallow(nd);
    });
  }

  // ======================================================================
  // 4. Macros: \newcommand, \renewcommand, \def, \let, \newenvironment.
  //    Commands the preview knows itself (\bigtitle, \linkbox, \textbf, ...)
  //    keep their built-in meaning, so main.tex's definitions of them are
  //    simply noted. Everything else is expanded, the way TeX would.
  // ======================================================================
  var DEFINERS = { newcommand: 1, renewcommand: 1, providecommand: 1, DeclareRobustCommand: 1,
    def: 1, gdef: 1, edef: 1, xdef: 1, let: 1, newenvironment: 1, renewenvironment: 1 };

  // Mark #1..#9 in a macro body as parameters.
  function markParams(nodes, depth) {
    var out = [];
    depth = depth || 0;
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "group") { out.push(depth > 200 ? nd : shallow(nd, { children: markParams(nd.children, depth + 1) })); continue; }
      if (nd.type === "#") {
        var nx = nodes[i + 1];
        if (nx && nx.type === "text" && /^[1-9]/.test(nx.value)) {
          out.push({ type: "param", n: +nx.value.charAt(0), file: nd.file, line: nd.line, raw: "#" + nx.value.charAt(0) });
          if (nx.value.length > 1) out.push(shallow(nx, { value: nx.value.slice(1), raw: nx.value.slice(1) }));
          i++;
          continue;
        }
        if (nx && nx.type === "#") { out.push(nd); i++; continue; }   // ## is a literal #
      }
      out.push(nd);
    }
    return out;
  }

  function substitute(body, args) {
    var out = [];
    body.forEach(function (nd) {
      if (nd.type === "param") { out = out.concat(cloneNodes(args[nd.n - 1] || [])); return; }
      if (nd.type === "group") { out.push(shallow(nd, { children: substitute(nd.children, args) })); return; }
      out.push(shallow(nd));
    });
    return out;
  }

  // Read a definition starting at nodes[i] (the \newcommand token).
  // Returns { next, def } (def may be null when it could not be read).
  function readDefinition(nodes, i, diag) {
    var t = nodes[i], kind = t.value, j = i + 1;
    var def = { kind: kind, nargs: 0, opt: null, body: [], file: t.file, line: t.line };

    if (kind === "newenvironment" || kind === "renewenvironment") {
      var envName = readArg(nodes, j);
      if (!envName) return { next: j, def: null };
      def.env = rawText(envName.nodes).trim();
      j = envName.next;
      var nb = readBracket(nodes, j);
      if (nb) { def.nargs = parseInt(rawText(nb.nodes), 10) || 0; j = nb.next; var ob = readBracket(nodes, j); if (ob) { def.opt = ob.nodes; j = ob.next; } }
      var bb = readArg(nodes, j); if (!bb) return { next: j, def: null };
      var eb = readArg(nodes, bb.next); if (!eb) return { next: bb.next, def: null };
      def.begin = markParams(bb.nodes);
      def.end = markParams(eb.nodes);
      return { next: eb.next, def: def };
    }

    // The name: \foo or {\foo}; a star before it is allowed.
    j = skipSpaces(nodes, j);
    if (nodes[j] && nodes[j].type === "text" && nodes[j].value.charAt(0) === "*") {
      if (nodes[j].value.length > 1) nodes[j] = shallow(nodes[j], { value: nodes[j].value.slice(1), raw: nodes[j].value.slice(1) });
      else j++;
      j = skipSpaces(nodes, j);
    }
    var nameNode = nodes[j];
    if (nameNode && nameNode.type === "group") {
      var inner = nameNode.children.filter(function (x) { return !isBlank(x); });
      nameNode = inner.length === 1 ? inner[0] : null;
    }
    if (!nameNode || nameNode.type !== "cmd") {
      diag.warn(t, "Missing control sequence inserted.", "\\" + kind + " needs a command name, as in \\" + kind + "{\\mycommand}{...}.");
      return { next: j + 1, def: null };
    }
    def.name = nameNode.value;
    j++;

    if (kind === "let") {
      j = skipSpaces(nodes, j);
      if (nodes[j] && nodes[j].type === "text" && nodes[j].value.charAt(0) === "=") {
        if (nodes[j].value.length > 1) nodes[j] = shallow(nodes[j], { value: nodes[j].value.slice(1), raw: nodes[j].value.slice(1) }); else j++;
        j = skipSpaces(nodes, j);
      }
      if (nodes[j] && nodes[j].type === "cmd") { def.alias = nodes[j].value; return { next: j + 1, def: def }; }
      return { next: j, def: null };
    }

    if (kind === "def" || kind === "gdef" || kind === "edef" || kind === "xdef") {
      while (j < nodes.length && nodes[j].type !== "group") {   // parameter text: #1#2...
        if (nodes[j].type === "#") def.nargs++;
        if (nodes[j].type === "par") return { next: j, def: null };
        j++;
      }
      if (j >= nodes.length) return { next: j, def: null };
      def.body = markParams(nodes[j].children);
      return { next: j + 1, def: def };
    }

    var b = readBracket(nodes, j);
    if (b) {
      def.nargs = Math.min(9, parseInt(rawText(b.nodes), 10) || 0);
      j = b.next;
      var o = readBracket(nodes, j);
      if (o) { def.opt = o.nodes; j = o.next; }
    }
    var body = readArg(nodes, j);
    if (!body) {
      diag.warn(t, "Missing argument for \\" + kind + ".", "Write \\" + kind + "{\\" + def.name + "}{what it stands for}.");
      return { next: j, def: null };
    }
    def.body = markParams(body.nodes);
    return { next: body.next, def: def };
  }

  // Expand user macros in a node list. ctx.macros / ctx.envs hold the
  // definitions; ctx.count limits runaway recursion.
  function expand(nodes, ctx, depth) {
    nodes = nodes.slice();
    var out = [];
    if (depth > 60) {
      if (!ctx.overflow) {
        ctx.overflow = true;
        ctx.diag.error(nodes[0], "TeX capacity exceeded, sorry [input stack size=10000].",
          "A command is defined in terms of itself, so it never stops expanding.");
      }
      return out;
    }
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (ctx.overflow) break;
      if (nd.type === "group") { out.push(shallow(nd, { children: expand(nd.children, ctx, depth + 1) })); continue; }
      if (nd.type !== "cmd") { out.push(nd); continue; }

      if (DEFINERS[nd.value]) {
        var r = readDefinition(nodes, i, ctx.diag);
        if (r.def) define(r.def, ctx);
        i = r.next - 1;
        continue;
      }

      // \begin{myenv} / \end{myenv} for environments defined with \newenvironment
      if ((nd.value === "begin" || nd.value === "end") && ctx.envs) {
        var a0 = readArg(nodes, i + 1);
        var ename = a0 ? rawText(a0.nodes).trim() : "";
        var edef = ename && ctx.envs[ename];
        if (edef) {
          if (++ctx.count > 4000) { tooMuch(nd, ctx); break; }
          var replacement;
          var nextIdx = a0.next;
          if (nd.value === "begin") {
            var eargs = [];
            if (edef.opt) {
              var eb = readBracket(nodes, nextIdx);
              if (eb) { eargs.push(eb.nodes); nextIdx = eb.next; } else eargs.push(edef.opt);
            }
            while (eargs.length < edef.nargs) {
              var ea = readArg(nodes, nextIdx);
              if (!ea) break;
              eargs.push(ea.nodes); nextIdx = ea.next;
            }
            replacement = substitute(edef.begin, eargs);
          } else {
            replacement = substitute(edef.end, []);
          }
          out = out.concat(expand(replacement, ctx, depth + 1));
          i = nextIdx - 1;
          continue;
        }
      }

      var m = ctx.macros[nd.value];
      if (m && m.alias) m = ctx.macros[m.alias] || null;
      if (!m) { out.push(nd); continue; }

      if (++ctx.count > 4000) { tooMuch(nd, ctx); break; }
      var args = [], j = i + 1;
      if (m.opt) {
        var ob = readBracket(nodes, j);
        if (ob) { args.push(ob.nodes); j = ob.next; } else args.push(m.opt);
      }
      var missing = false;
      while (args.length < m.nargs) {
        var a = readArg(nodes, j);
        if (!a) { missing = true; break; }
        args.push(a.nodes);
        j = a.next;
      }
      if (missing) {
        ctx.diag.error(nd, "Runaway argument? File ended while scanning use of \\" + nd.value + ".",
          "\\" + nd.value + " needs " + m.nargs + " argument" + (m.nargs > 1 ? "s" : "") + " in braces {...}.");
      }
      out = out.concat(expand(substitute(m.body, args), ctx, depth + 1));
      i = j - 1;
    }
    return out;
  }

  function tooMuch(nd, ctx) {
    if (ctx.overflow) return;
    ctx.overflow = true;
    ctx.diag.error(nd, "TeX capacity exceeded, sorry [main memory size=5000000].",
      "\\" + nd.value + " keeps expanding into itself.");
  }

  function define(def, ctx) {
    if (def.env) {
      if (!KNOWN_ENVS[def.env]) ctx.envs[def.env] = def;
      return;
    }
    if (isBuiltin(def.name)) {
      ctx.defined[def.name] = true;              // e.g. main.tex defines \bigtitle: noted, built-in meaning kept
      return;
    }
    if (def.alias) {
      if (isBuiltin(def.alias)) { ctx.aliases[def.name] = def.alias; return; }
    }
    if (def.kind === "providecommand" && ctx.macros[def.name]) return;
    ctx.macros[def.name] = def;
  }

  // ======================================================================
  // 5. Environments: \begin{x} ... \end{x} -> env nodes, with LaTeX's errors.
  // ======================================================================
  function matchEnvs(nodes, diag, where) {
    var out = [], stack = [], cur = out;
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "group") {
        cur.push(shallow(nd, { children: matchEnvs(nd.children, diag, "group") }));
        continue;
      }
      if (nd.type === "cmd" && (nd.value === "begin" || nd.value === "end")) {
        var j = skipSpaces(nodes, i + 1);
        var g = nodes[j];
        if (!g || g.type !== "group") {
          diag.error(nd, "Missing { inserted.", "\\" + nd.value + " must be followed by an environment name in braces, as in \\" + nd.value + "{itemize}.");
          continue;
        }
        var name = rawText(g.children).trim();
        i = j;
        if (nd.value === "begin") {
          var env = { type: "env", name: name, children: [], file: nd.file, line: nd.line };
          cur.push(env);
          stack.push({ env: env, parent: cur });
          cur = env.children;
          continue;
        }
        // \end{name}
        if (stack.length && stack[stack.length - 1].env.name === name) {
          var done = stack.pop();
          done.env.endLine = nd.line;
          done.env.endFile = nd.file;
          cur = done.parent;
          continue;
        }
        if (stack.length) {
          var top = stack[stack.length - 1].env;
          diag.error(nd, "LaTeX Error: \\begin{" + top.name + "} on input line " + top.line + " ended by \\end{" + name + "}.",
            "The \\begin{" + top.name + "} on line " + top.line + (top.file !== nd.file ? " of " + top.file : "") +
            " needs its own \\end{" + top.name + "} before this \\end{" + name + "}.");
          // Recover: close everything up to the matching \begin, if there is one.
          var k = stack.length - 1;
          while (k >= 0 && stack[k].env.name !== name) k--;
          if (k >= 0) {
            while (stack.length > k) {
              var closed = stack.pop();
              closed.env.endLine = nd.line;
              cur = closed.parent;
            }
          }
          continue;
        }
        diag.error(nd, where === "body"
          ? "LaTeX Error: \\begin{document} ended by \\end{" + name + "}."
          : "LaTeX Error: \\end{" + name + "} without a matching \\begin{" + name + "}.",
          "This \\end{" + name + "} has no \\begin{" + name + "} before it. Delete it, or add the missing \\begin.");
        continue;
      }
      cur.push(nd);
    }
    while (stack.length) {
      var open = stack.pop().env;
      diag.error(open, where === "body"
        ? "LaTeX Error: \\begin{" + open.name + "} on input line " + open.line + " ended by \\end{document}."
        : "Extra }, or forgotten \\end{" + open.name + "}.",
        "\\begin{" + open.name + "} on line " + open.line + (open.file ? " of " + open.file : "") + " is never closed. Add \\end{" + open.name + "}.");
    }
    return out;
  }

  // ======================================================================
  // 6. What the preview knows
  // ======================================================================
  function set(list) { var o = {}; list.split(" ").forEach(function (k) { if (k) o[k] = true; }); return o; }

  var LIST_ENVS = set("itemize enumerate description");
  var BOX_ENVS = set("block exampleblock alertblock");
  var PASS_ENVS = set("minipage figure figure* onlyenv overprint uncoverenv visibleenv actionenv quote quotation verse flushleft flushright abstract small footnotesize scriptsize tiny large Large center adjustbox");
  var MATH_ENVS = set("equation equation* align align* gather gather* multline multline* displaymath math eqnarray eqnarray*");
  var TABLE_ENVS = set("tabular tabular* tabularx table table*");
  var KNOWN_ENVS = shallow(shallow(shallow(shallow(LIST_ENVS, BOX_ENVS), PASS_ENVS), MATH_ENVS), TABLE_ENVS);
  KNOWN_ENVS.frame = KNOWN_ENVS.columns = KNOWN_ENVS.column = KNOWN_ENVS.document = true;

  var SWITCH_BOLD = set("bfseries bf");
  var SWITCH_ITALIC = set("itshape it em slshape sl");
  var SWITCH_PLAIN = set("normalfont mdseries upshape rmfamily sffamily ttfamily scshape rm sf tt sc");
  var SIZES = { tiny: -4, scriptsize: -3, footnotesize: -2, small: -1, normalsize: 0, large: 1, Large: 2, LARGE: 3, huge: 4, Huge: 5 };

  var CMD_BOLD = set("textbf alert");
  var CMD_ITALIC = set("emph textit textsl");
  var CMD_SHOW = set("textrm textsf texttt textmd textup textnormal textsc underline uline mbox fbox text hbox " +
    "structure textsuperscript textsubscript hl emphasize only uncover visible onslide framebox makebox " +
    "textls textnormal ensuremath");
  var CMD_SKIP_SHOW = { textcolor: 1, colorbox: 1, raisebox: 1, scalebox: 1, rotatebox: 1, hyperlink: 1,
    parbox: 1, fcolorbox: 2, resizebox: 2, hyperref: 0 };
  // Read and dropped: name -> number of {arguments}
  var CMD_DROP = { label: 1, vspace: 1, hspace: 1, phantom: 1, hphantom: 1, vphantom: 1, index: 1, nocite: 1,
    setlength: 2, addtolength: 2, setcounter: 2, addtocounter: 2, stepcounter: 1, color: 1, fontsize: 2,
    usebeamercolor: 1, usebeamerfont: 1, usebeamertemplate: 1, setbeamercolor: 2, setbeamerfont: 2,
    setbeamersize: 1, invisible: 1, hypertarget: 1, transduration: 1, transdissolve: 0, transfade: 0,
    rule: 2, vskip: 0, hskip: 0, kern: 0, includeonlyframes: 1, pgfdeclareimage: 2, footnotemark: 0,
    titlegraphic: 1, logo: 1, section: 1, subsection: 1, subsubsection: 1, part: 1, tableofcontents: 0,
    AtBeginSection: 1, AtBeginSubsection: 1, hypersetup: 1, graphicspath: 1, definecolor: 3, colorlet: 2,
    usetheme: 1, usecolortheme: 1, usefonttheme: 1, useinnertheme: 1, useoutertheme: 1, usepackage: 1,
    setbeamertemplate: 1, frenchspacing: 0, nonfrenchspacing: 0, selectlanguage: 1, linespread: 1 };
  var CMD_NOOP = set("pause medskip bigskip smallskip vfill hfill noindent indent raggedright raggedleft " +
    "centering newpage clearpage pagebreak nobreak relax protect null leavevmode strut selectfont " +
    "framebreak noframebreak justifying itemsep makeatletter makeatother displaystyle textstyle " +
    "unskip ignorespaces maketitle titlepage par footnotesep");
  var SYMBOLS = {
    ldots: "\u2026", dots: "\u2026", textellipsis: "\u2026", LaTeX: "LaTeX", TeX: "TeX", LaTeXe: "LaTeX2\u03b5",
    BibTeX: "BibTeX", XeLaTeX: "XeLaTeX", textendash: "\u2013", textemdash: "\u2014",
    textperiodcentered: "\u00b7", textbullet: "\u2022", textbackslash: "\\", textasciitilde: "~",
    textasciicircum: "^", textasciigrave: "`", textbar: "|", textless: "<", textgreater: ">",
    textunderscore: "_", textdollar: "$", textquotedbl: "\"", textquoteleft: "\u2018", textquoteright: "\u2019",
    textquotedblleft: "\u201c", textquotedblright: "\u201d", textregistered: "\u00ae", texttrademark: "\u2122",
    copyright: "\u00a9", textcopyright: "\u00a9", S: "\u00a7", P: "\u00b6", dag: "\u2020", ddag: "\u2021",
    pounds: "\u00a3", textsterling: "\u00a3", euro: "\u20ac", texteuro: "\u20ac", textdegree: "\u00b0",
    textyen: "\u00a5", ss: "\u00df", ae: "\u00e6", AE: "\u00c6", oe: "\u0153", OE: "\u0152", o: "\u00f8",
    O: "\u00d8", aa: "\u00e5", AA: "\u00c5", l: "\u0142", L: "\u0141", i: "\u0131", j: "\u0237",
    quad: " ", qquad: " ", enspace: " ", thinspace: " ", nobreakspace: "\u00a0", space: " ",
    textvisiblespace: "\u2423", checkmark: "\u2713", textrightarrow: "\u2192", textleftarrow: "\u2190",
    textsection: "\u00a7", textparagraph: "\u00b6", guillemotleft: "\u00ab", guillemotright: "\u00bb",
    textexclamdown: "\u00a1", textquestiondown: "\u00bf", textcent: "\u00a2", textmu: "\u00b5"
  };
  // Control symbols: \& \% ... print the character; \, \; \: \! \/ \- are spacing.
  var CONTROL_SYMBOLS = { "&": "&", "%": "%", "$": "$", "#": "#", "_": "_", "{": "{", "}": "}",
    " ": " ", ",": " ", ";": " ", ":": " ", "!": "", "/": "", "-": "", "@": "", ">": " ", "|": "\u2016" };
  var ACCENTS = { "'": "\u0301", "`": "\u0300", "^": "\u0302", "\"": "\u0308", "~": "\u0303", "=": "\u0304",
    ".": "\u0307", u: "\u0306", v: "\u030C", H: "\u030B", c: "\u0327", k: "\u0328", r: "\u030A", d: "\u0323",
    b: "\u0331", t: "\u0361" };
  var MATH = {
    alpha: "\u03b1", beta: "\u03b2", gamma: "\u03b3", delta: "\u03b4", epsilon: "\u03f5", varepsilon: "\u03b5",
    zeta: "\u03b6", eta: "\u03b7", theta: "\u03b8", vartheta: "\u03d1", iota: "\u03b9", kappa: "\u03ba",
    lambda: "\u03bb", mu: "\u03bc", nu: "\u03bd", xi: "\u03be", pi: "\u03c0", varpi: "\u03d6", rho: "\u03c1",
    sigma: "\u03c3", tau: "\u03c4", upsilon: "\u03c5", phi: "\u03d5", varphi: "\u03c6", chi: "\u03c7",
    psi: "\u03c8", omega: "\u03c9", Gamma: "\u0393", Delta: "\u0394", Theta: "\u0398", Lambda: "\u039b",
    Xi: "\u039e", Pi: "\u03a0", Sigma: "\u03a3", Upsilon: "\u03a5", Phi: "\u03a6", Psi: "\u03a8", Omega: "\u03a9",
    cdot: "\u00b7", times: "\u00d7", div: "\u00f7", pm: "\u00b1", mp: "\u2213", leq: "\u2264", le: "\u2264",
    geq: "\u2265", ge: "\u2265", neq: "\u2260", ne: "\u2260", approx: "\u2248", equiv: "\u2261", sim: "\u223c",
    simeq: "\u2243", propto: "\u221d", infty: "\u221e", to: "\u2192", rightarrow: "\u2192", leftarrow: "\u2190",
    gets: "\u2190", Rightarrow: "\u21d2", Leftarrow: "\u21d0", leftrightarrow: "\u2194", Leftrightarrow: "\u21d4",
    mapsto: "\u21a6", implies: "\u21d2", iff: "\u21d4", in: "\u2208", notin: "\u2209", ni: "\u220b",
    subset: "\u2282", subseteq: "\u2286", supset: "\u2283", supseteq: "\u2287", cup: "\u222a", cap: "\u2229",
    setminus: "\u2216", emptyset: "\u2205", varnothing: "\u2205", forall: "\u2200", exists: "\u2203",
    neg: "\u00ac", lnot: "\u00ac", wedge: "\u2227", land: "\u2227", vee: "\u2228", lor: "\u2228",
    partial: "\u2202", nabla: "\u2207", sum: "\u2211", prod: "\u220f", int: "\u222b", oint: "\u222e",
    ldots: "\u2026", cdots: "\u22ef", vdots: "\u22ee", ddots: "\u22f1", circ: "\u2218", bullet: "\u2022",
    star: "\u22c6", ast: "\u2217", prime: "\u2032", degree: "\u00b0", ell: "\u2113", hbar: "\u210f",
    langle: "\u27e8", rangle: "\u27e9", lfloor: "\u230a", rfloor: "\u230b", lceil: "\u2308", rceil: "\u2309",
    mid: "|", vert: "|", Vert: "\u2016", "{": "{", "}": "}", "%": "%", "$": "$", "&": "&", "_": "_", "#": "#",
    ",": " ", ";": " ", ":": " ", "!": "", " ": " ", quad: " ", qquad: " ", "|": "\u2016",
    log: "log", ln: "ln", exp: "exp", sin: "sin", cos: "cos", tan: "tan", max: "max", min: "min",
    lim: "lim", sup: "sup", inf: "inf", det: "det", arg: "arg", Pr: "Pr", E: "E",
    left: "", right: "", big: "", Big: "", bigg: "", Bigg: "", bigl: "", bigr: "", Bigl: "", Bigr: "",
    limits: "", nolimits: "", displaystyle: "", textstyle: "", scriptstyle: ""
  };
  var BLACKBOARD = { R: "\u211d", N: "\u2115", Z: "\u2124", Q: "\u211a", C: "\u2102", P: "\u2119", E: "\ud835\udd3c" };
  var SUPER = { "0": "\u2070", "1": "\u00b9", "2": "\u00b2", "3": "\u00b3", "4": "\u2074", "5": "\u2075", "6": "\u2076",
    "7": "\u2077", "8": "\u2078", "9": "\u2079", "+": "\u207a", "-": "\u207b", "=": "\u207c", "(": "\u207d", ")": "\u207e",
    n: "\u207f", i: "\u2071", T: "\u1d40", "*": "*" };
  var SUB = { "0": "\u2080", "1": "\u2081", "2": "\u2082", "3": "\u2083", "4": "\u2084", "5": "\u2085", "6": "\u2086",
    "7": "\u2087", "8": "\u2088", "9": "\u2089", "+": "\u208a", "-": "\u208b", "=": "\u208c", "(": "\u208d", ")": "\u208e",
    i: "\u1d62", j: "\u2c7c", t: "\u209c", n: "\u2099", k: "\u2096" };

  // Block-level commands handled by blocks() (listed so they are "known").
  var BLOCK_CMDS = set("frametitle framesubtitle bigtitle colheading linkbox includegraphics titlepage maketitle " +
    "centering item note column newline linebreak footnote cite ref eqref pageref today frame againframe " +
    "begin end url href nolinkurl textbf alert emph textit textsl MakeUppercase MakeLowercase uppercase lowercase " +
    "verb input include subfile documentclass title subtitle author institute date");

  // Preamble commands that are fine to see (their arguments are skipped).
  var PREAMBLE_OK = set("documentclass usepackage RequirePackage PassOptionsToPackage usetheme usecolortheme " +
    "usefonttheme useinnertheme useoutertheme setbeamertemplate setbeamercolor setbeamerfont setbeamersize " +
    "setbeamercovered definecolor colorlet hypersetup graphicspath setlength addtolength setcounter " +
    "frenchspacing nonfrenchspacing makeatletter makeatother title subtitle author institute date titlegraphic " +
    "logo AtBeginSection AtBeginSubsection AtBeginDocument AtEndDocument newtheorem newif newcounter " +
    "usetikzlibrary tikzset pgfplotsset newcolumntype DeclareMathOperator selectlanguage linespread mode " +
    "geometry includeonlyframes setbeameroption input include parskip parindent baselineskip textwidth " +
    "linewidth paperwidth paperheight fboxsep fboxrule tabcolsep arraystretch renewcommand newcommand " +
    "def let providecommand DeclareRobustCommand newenvironment renewenvironment raggedright centering " +
    "bibliographystyle addbibresource usefont fontfamily selectfont");

  function isBuiltin(name) {
    return !!(SYMBOLS[name] != null || CMD_BOLD[name] || CMD_ITALIC[name] || CMD_SHOW[name] ||
      CMD_SKIP_SHOW[name] != null || CMD_DROP[name] != null || CMD_NOOP[name] || SWITCH_BOLD[name] ||
      SWITCH_ITALIC[name] || SWITCH_PLAIN[name] || SIZES[name] != null || BLOCK_CMDS[name] || ACCENTS[name] ||
      PREAMBLE_OK[name]);
  }

  // ======================================================================
  // 7. Inline text -> content.js mini-markdown (**bold**, *italic*, [text](url))
  // ======================================================================

  // TeX's ligatures in ordinary text.
  function ligatures(s) {
    return s.replace(/---/g, "\u2014").replace(/--/g, "\u2013")
      .replace(/``/g, "\u201c").replace(/''/g, "\u201d").replace(/`/g, "\u2018");
  }

  // A link address, exactly as written, with hyperref's escapes undone.
  function urlFrom(nodes, ctx, at) {
    var raw = rawText(nodes).replace(/[\r\n\t ]+/g, "");
    if (/(^|[^\\])#/.test(raw)) {
      ctx.diag.warn(at, "Illegal parameter number in definition of \\Hy@tempa.",
        "Inside a frame, write \\# for a # in a link address.");
    }
    var url = raw
      .replace(/\\string~/g, "~").replace(/\\textasciitilde(\{\})?/g, "~").replace(/\\~(\{\})?/g, "~")
      .replace(/\\([%#&_$])/g, "$1");
    if (/^\s*(javascript|vbscript|data):/i.test(url)) {
      ctx.diag.warn(at, "Link removed: " + url.split(":")[0] + ": addresses are not allowed here.", "Links must start with https://, http:// or mailto:, or point to a page of this site.");
      return "";
    }
    // Characters the content.js link syntax cannot hold are percent-encoded.
    return url.replace(/[()\s]/g, function (c) { return "%" + c.charCodeAt(0).toString(16).toUpperCase(); });
  }

  // **text** or *text* (nothing for empty text: "****" would show as stars).
  function wrap(md, mark) {
    return md === "" ? "" : mark + md + mark;
  }

  // nodes -> mini-markdown. st: { bold, italic, link, plain, item }
  //   plain: no markup at all (alt text, the raw log); item: \\ is a space
  function inlineMd(nodes, ctx, st) {
    nodes = nodes.slice();
    st = st || {};
    var out = "";
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      switch (nd.type) {
        case "text": out += ligatures(nd.value); break;
        case "space": case "par": out += " "; break;
        case "~": out += "\u00a0"; break;
        case "[": case "]": out += nd.type; break;
        case "verbatim": out += nd.value; if (!nd.inline) out += " "; break;
        case "group": out += inlineMd(nd.children, ctx, shallow(st)); break;
        case "env": out += " " + envAsText(nd, ctx, st) + " "; break;
        case "param": out += "#" + nd.n; break;
        case "&":
          ctx.diag.warn(nd, "Misplaced alignment tab character &.", "To print an ampersand, write \\&.");
          out += "&"; break;
        case "#":
          ctx.diag.warn(nd, "You can't use `macro parameter character #' in horizontal mode.", "To print #, write \\#.");
          out += "#"; break;
        case "^": case "_":
          ctx.diag.warn(nd, "Missing $ inserted.", "To print " + nd.type + ", write \\" + (nd.type === "_" ? "_" : "textasciicircum{}") + ". In maths, put it between $ signs.");
          out += nd.type; break;
        case "$": case "$$":
          var close = -1;
          for (var k = i + 1; k < nodes.length; k++) {
            if (nodes[k].type === nd.type) { close = k; break; }
            if (nodes[k].type === "par") break;
          }
          if (close < 0) {
            ctx.diag.error(nd, "Missing $ inserted.", "This $ starts a formula that never ends. Add the closing $, or write \\$ to print a dollar sign.");
            out += nd.type === "$" ? "$" : "$$";
            break;
          }
          out += mathText(nodes.slice(i + 1, close), ctx);
          i = close;
          break;
        case "cmd":
          var r = inlineCmd(nodes, i, ctx, st);
          if (r.rest != null) { out += r.md + r.rest; i = nodes.length; }
          else { out += r.md; i = r.next - 1; }
          break;
        default:
          out += nd.raw || "";
      }
    }
    return out;
  }

  // One command at nodes[i]. Returns { md, next } or { md, rest } when a
  // font switch took over the rest of the group.
  function inlineCmd(nodes, i, ctx, st) {
    var nd = nodes[i], name = nd.value, j = i + 1, a, b;
    if (ctx.aliases && ctx.aliases[name]) name = ctx.aliases[name];

    if (name.length === 1 && !LETTER.test(name)) {
      if (name === "\\") {                                  // \\ line break (optional * and [space])
        var jj = j;
        if (nodes[jj] && nodes[jj].type === "text" && nodes[jj].value.charAt(0) === "*") {
          if (nodes[jj].value.length > 1) nodes[jj] = shallow(nodes[jj], { value: nodes[jj].value.slice(1), raw: nodes[jj].value.slice(1) }); else jj++;
        }
        var lb = readBracket(nodes, jj, true);
        return { md: " ", next: lb ? lb.next : jj };
      }
      if (ACCENTS[name]) return accent(nodes, i, name, ctx);
      if (CONTROL_SYMBOLS[name] != null) return { md: CONTROL_SYMBOLS[name], next: j };
      return { md: name, next: j };
    }

    if (name.length === 1 && ACCENTS[name]) return accent(nodes, i, name, ctx);   // \c{c} \v{s} \u{a} ...

    if (CMD_BOLD[name] || CMD_ITALIC[name]) {
      j = skipOverlay(nodes, j);
      a = readArg(nodes, j);
      if (!a) return { md: "", next: j };
      var bold = !!CMD_BOLD[name];
      var inner = inlineMd(a.nodes, ctx, shallow(st, bold ? { bold: true } : { italic: true }));
      if (st.plain || (bold ? st.bold : st.italic)) return { md: inner, next: a.next };
      return { md: wrap(inner, bold ? "**" : "*"), next: a.next };
    }
    if (SWITCH_PLAIN[name]) return { md: "", next: j };    // font families: no markdown for them
    if (SWITCH_BOLD[name] || SWITCH_ITALIC[name]) {
      var rest = nodes.slice(j);
      var isB = !!SWITCH_BOLD[name];
      var restMd = inlineMd(rest, ctx, shallow(st, isB ? { bold: true } : { italic: true }));
      if (st.plain || (isB ? st.bold : st.italic)) return { md: "", rest: restMd };
      var lead = /^\s*/.exec(restMd)[0], trail = /\s*$/.exec(restMd)[0];
      var core = restMd.trim();
      return { md: "", rest: core ? lead + wrap(core, isB ? "**" : "*") + trail : restMd };
    }
    if (SIZES[name] != null) return { md: "", next: j };

    if (name === "href") {
      a = readArg(nodes, j);
      b = a ? readArg(nodes, a.next) : null;
      if (!a || !b) {
        ctx.diag.error(nd, "Runaway argument? Missing argument for \\href.", "Write \\href{https://address}{link text}.");
        return { md: "", next: b ? b.next : (a ? a.next : j) };
      }
      var href = urlFrom(a.nodes, ctx, nd);
      var label = inlineMd(b.nodes, ctx, shallow(st, { link: true }));
      if (st.plain || st.link || !href) return { md: label, next: b.next };
      return { md: linkMd(label || href, href), next: b.next };
    }
    if (name === "url" || name === "nolinkurl") {
      a = readArg(nodes, j);
      if (!a) return { md: "", next: j };
      var u = urlFrom(a.nodes, ctx, nd);
      var shown = rawText(a.nodes).replace(/\\([%#&_$~])/g, "$1");
      if (name === "nolinkurl" || st.plain || st.link || !u) return { md: shown, next: a.next };
      return { md: linkMd(shown, u), next: a.next };
    }
    if (name === "MakeUppercase" || name === "MakeLowercase" || name === "uppercase" || name === "lowercase") {
      a = readArg(nodes, j);
      if (!a) return { md: "", next: j };
      var t = inlineMd(a.nodes, ctx, st);
      return { md: /Upper|upper/.test(name) ? t.toUpperCase() : t.toLowerCase(), next: a.next };
    }
    if (CMD_SHOW[name]) {
      j = skipOverlay(nodes, j);
      // \onslide<2-> and friends also come without an argument (as a switch).
      if (/^(only|uncover|visible|onslide)$/.test(name)) {
        var sw = nodes[skipSpaces(nodes, j)];
        if (!sw || sw.type !== "group") return { md: "", next: j };
      }
      a = readArg(nodes, j);
      if (!a) return { md: "", next: j };
      return { md: inlineMd(a.nodes, ctx, st), next: a.next };
    }
    if (CMD_SKIP_SHOW[name] != null) {
      j = skipOverlay(nodes, j);
      var ob = readBracket(nodes, j);
      if (ob) j = ob.next;
      for (var s = 0; s < CMD_SKIP_SHOW[name]; s++) { var sk = readArg(nodes, j); if (sk) j = sk.next; }
      if (name === "hyperref") { var hb = readBracket(nodes, j); if (hb) j = hb.next; }
      a = readArg(nodes, j);
      if (!a) return { md: "", next: j };
      return { md: inlineMd(a.nodes, ctx, st), next: a.next };
    }
    if (name === "alt") {                                   // \alt<2>{shown}{otherwise}
      j = skipOverlay(nodes, j);
      a = readArg(nodes, j);
      b = a ? readArg(nodes, a.next) : null;
      return { md: a ? inlineMd(a.nodes, ctx, st) : "", next: b ? b.next : (a ? a.next : j) };
    }
    if (CMD_DROP[name] != null) {
      if (nodes[j] && nodes[j].type === "text" && nodes[j].value.charAt(0) === "*") {
        if (nodes[j].value.length > 1) nodes[j] = shallow(nodes[j], { value: nodes[j].value.slice(1), raw: nodes[j].value.slice(1) }); else j++;
      }
      j = skipOverlay(nodes, j);
      var dropB = readBracket(nodes, j);
      if (dropB) j = dropB.next;
      for (var d = 0; d < CMD_DROP[name]; d++) { var da = readArg(nodes, j); if (!da) break; j = da.next; }
      if (name === "setbeamertemplate") { var tb = readBracket(nodes, j); if (tb) j = tb.next; }
      return { md: "", next: j };
    }
    if (CMD_NOOP[name]) return { md: "", next: skipOverlay(nodes, j) };
    if (SYMBOLS[name] != null) {
      // A control word eats the spaces after it; "{}" after it is just an empty group.
      return { md: SYMBOLS[name], next: j };
    }
    if (name === "today") return { md: today(), next: j };
    if (name === "newline" || name === "linebreak") { var nb = readBracket(nodes, j); return { md: " ", next: nb ? nb.next : j }; }
    if (name === "footnote") {
      var fb = readBracket(nodes, j); if (fb) j = fb.next;
      a = readArg(nodes, j);
      ctx.diag.note(nd, "Footnote not shown in the preview.", "Footnotes are typeset by real LaTeX; this preview leaves them out.");
      return { md: "", next: a ? a.next : j };
    }
    if (name === "cite" || name === "ref" || name === "eqref" || name === "pageref") {
      var cb = readBracket(nodes, j); if (cb) j = cb.next;
      a = readArg(nodes, j);
      var key = a ? rawText(a.nodes) : "";
      ctx.diag.warn(nd, name === "cite" ? "LaTeX Warning: Citation `" + key + "' undefined." : "LaTeX Warning: Reference `" + key + "' undefined.",
        name === "cite" ? "This project has no bibliography." : "There is no \\label{" + key + "} to refer to.");
      return { md: name === "cite" ? "[?]" : "??", next: a ? a.next : j };
    }
    if (name === "verb") return { md: "", next: j };
    if (name === "item") {
      ctx.diag.error(nd, "LaTeX Error: Lonely \\item--perhaps a missing list environment.", "\\item only works inside \\begin{itemize} ... \\end{itemize}.");
      return { md: " ", next: skipOverlay(nodes, j) };
    }
    if (name === "includegraphics" || name === "linkbox" || name === "bigtitle" || name === "colheading" ||
        name === "frametitle" || name === "framesubtitle" || name === "titlepage" || name === "maketitle" ||
        name === "note" || name === "column") {
      // Block-level commands inside running text: read their arguments, keep any text.
      var cnt = { includegraphics: 1, linkbox: 3, bigtitle: 1, colheading: 1, frametitle: 1, framesubtitle: 1, note: 1, column: 1 }[name] || 0;
      var ib = readBracket(nodes, skipOverlay(nodes, j)); if (ib) j = ib.next;
      var texts = [];
      for (var c = 0; c < cnt; c++) { var ca = readArg(nodes, j); if (!ca) break; j = ca.next; if (name !== "includegraphics" && name !== "note" && name !== "column" && !(name === "linkbox" && c === 1)) texts.push(inlineMd(ca.nodes, ctx, st)); }
      if (name === "includegraphics") ctx.diag.warn(nd, "Picture not shown: \\includegraphics inside text.", "Pictures show on title slides: put \\includegraphics in a column of its own, as in home.tex.");
      return { md: texts.join(" "), next: j };
    }
    // Unknown: show it as text, and warn.
    if (!ctx.macros[name]) {
      ctx.diag.warn(nd, "Undefined control sequence.", "\\" + name + " is not a command this preview knows, so it is shown as plain text. Check the spelling.");
    }
    var nx = skipSpaces(nodes, j);
    if (nodes[nx] && nodes[nx].type === "group") return { md: "", next: j };   // its {argument} shows as text
    return { md: "\\" + name, next: j };
  }

  function linkMd(label, href) {
    // content.js links cannot hold ] in the text; keep the text readable.
    return "[" + label.replace(/\]/g, ")").replace(/\[/g, "(") + "](" + href + ")";
  }

  function accent(nodes, i, name, ctx) {
    var a = readArg(nodes, i + 1);
    if (!a) return { md: { "~": "~", "^": "^", "'": "'", "`": "`", "\"": "\"" }[name] || "", next: i + 1 };
    var base = inlineMd(a.nodes, ctx, { plain: true });
    if (base === "\u0131") base = "i";                     // \'{\i}
    if (base === "\u0237") base = "j";
    if (base === "") return { md: { "~": "~", "^": "^", "'": "\u00b4", "`": "`", "\"": "\u00a8", "=": "\u00af", ".": "\u02d9" }[name] || "", next: a.next };
    var out = base.charAt(0) + ACCENTS[name] + base.slice(1);
    return { md: out.normalize ? out.normalize("NFC") : out, next: a.next };
  }

  function today() {
    var d = new Date();
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
  }

  // $...$ -> readable text: \cdot -> ·, ^2 -> ², \alpha -> α ...
  function mathText(nodes, ctx) {
    nodes = nodes.slice();
    var out = "";
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "text") out += nd.value.replace(/\s+/g, "");
      else if (nd.type === "group") out += mathText(nd.children, ctx);
      else if (nd.type === "^" || nd.type === "_") {
        var a = readArg(nodes, i + 1);
        if (!a) continue;
        var s = mathText(a.nodes, ctx), map = nd.type === "^" ? SUPER : SUB, conv = "";
        for (var k = 0; k < s.length; k++) { if (map[s.charAt(k)] == null) { conv = null; break; } conv += map[s.charAt(k)]; }
        out += conv != null ? conv : (nd.type + (s.length > 1 ? "(" + s + ")" : s));
        i = a.next - 1;
      } else if (nd.type === "cmd") {
        var name = nd.value;
        if (MATH[name] != null) { out += MATH[name]; continue; }
        if (name === "frac" || name === "dfrac" || name === "tfrac") {
          var x = readArg(nodes, i + 1), y = x ? readArg(nodes, x.next) : null;
          if (x && y) { out += mathText(x.nodes, ctx) + "/" + mathText(y.nodes, ctx); i = y.next - 1; }
          continue;
        }
        if (name === "sqrt") {
          var sb = readBracket(nodes, i + 1), sa = readArg(nodes, sb ? sb.next : i + 1);
          if (sa) { out += "\u221a" + mathText(sa.nodes, ctx); i = sa.next - 1; }
          continue;
        }
        if (name === "mathbb") {
          var bb = readArg(nodes, i + 1);
          if (bb) { var letters = mathText(bb.nodes, ctx); out += letters.split("").map(function (ch) { return BLACKBOARD[ch] || ch; }).join(""); i = bb.next - 1; }
          continue;
        }
        if (/^(mathrm|mathbf|mathit|mathsf|mathtt|mathcal|text|textrm|textbf|textit|operatorname|mbox|boldsymbol|bm|hat|bar|tilde|vec|dot|overline|underline|widehat|widetilde)$/.test(name)) {
          var ta = readArg(nodes, i + 1);
          if (ta) { out += /^(text|textrm|textbf|textit|mbox)$/.test(name) ? inlineMd(ta.nodes, ctx, { plain: true }) : mathText(ta.nodes, ctx); i = ta.next - 1; }
          continue;
        }
        ctx.diag.warn(nd, "Undefined control sequence.", "\\" + name + " is not a maths command this preview knows; it is shown as plain text.");
        out += name;
      } else if (nd.type === "~") out += " ";
      else if (nd.type === "&") out += " ";
      else if (nd.type === "space" || nd.type === "par") { /* spaces do not count in maths */ }
      else out += nd.raw || nd.value || "";
    }
    return out;
  }

  // An environment met inside running text: its words, roughly.
  function envAsText(env, ctx, st) {
    if (LIST_ENVS[env.name]) {
      return readList(env, ctx).map(function (it) { return typeof it === "string" ? it : it.text; }).join("; ");
    }
    if (MATH_ENVS[env.name]) return mathText(env.children, ctx);
    return inlineMd(env.children, ctx, st);
  }

  // Tidy the markdown of one paragraph or item: single spaces, no edges.
  function clean(md) {
    return md.replace(/[ \t\r\n]+/g, " ").replace(/^ +| +$/g, "");
  }

  // A subtitle: its lines are separated by \\ (or \newline). One line gives
  // a string, several give an array (deck.js shows one line per item).
  function subtitleMd(nodes, ctx) {
    nodes = nodes.slice();
    var parts = [[]];
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "cmd" && (nd.value === "\\" || nd.value === "newline")) {
        var j = i + 1;
        if (nd.value === "\\" && nodes[j] && nodes[j].type === "text" && nodes[j].value.charAt(0) === "*") {
          if (nodes[j].value.length > 1) nodes[j] = shallow(nodes[j], { value: nodes[j].value.slice(1), raw: nodes[j].value.slice(1) }); else j++;
        }
        var sb = readBracket(nodes, j, true);
        i = (sb ? sb.next : j) - 1;
        parts.push([]);
        continue;
      }
      parts[parts.length - 1].push(nd);
    }
    var lines = parts.map(function (p) { return clean(inlineMd(p, ctx, {})); }).filter(Boolean);
    return lines.length > 1 ? lines : (lines[0] || "");
  }

  // "0.55\textwidth" -> 0.55 (also \linewidth, \columnwidth, a bare \textwidth); null otherwise.
  function widthFraction(nodes) {
    var m = /^\s*([0-9]*\.?[0-9]*)\s*\\(textwidth|linewidth|columnwidth|hsize)\s*$/.exec(rawText(nodes || []));
    if (!m) return null;
    var f = m[1] === "" ? 1 : parseFloat(m[1]);
    return isFinite(f) && f > 0 ? Math.min(f, 1) : null;
  }

  // ======================================================================
  // 8. Block structure: frames -> blocks -> slide objects
  // ======================================================================

  // Does this group hold block-level material (lists, columns, ...)?
  function hasBlocks(nodes) {
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "env" && (LIST_ENVS[nd.name] || nd.name === "columns" || nd.name === "column" || BOX_ENVS[nd.name] || PASS_ENVS[nd.name])) return true;
      if (nd.type === "cmd" && /^(frametitle|framesubtitle|bigtitle|colheading|linkbox|includegraphics|titlepage|maketitle)$/.test(nd.value)) return true;
      if (nd.type === "par") return true;
    }
    return false;
  }

  // nodes -> a list of blocks:
  //   { type: "title" | "subtitle" | "bigtitle" | "heading", md }   { type: "size", dense }
  //   { type: "list", items }   { type: "columns", cols }   { type: "box", label, text, href }
  //   { type: "image", src, alt }   { type: "para", md }   { type: "center" | "titlepage" }
  //   { type: "note", text }
  function blocks(nodes, ctx, out) {
    nodes = nodes.slice();
    var para = [];
    function flush() {
      if (!para.length) return;
      var md = clean(inlineMd(para, ctx, {}));
      if (md) out.push({ type: "para", md: md, at: firstReal(para) });
      para = [];
    }
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "par") { flush(); continue; }
      if (nd.type === "verbatim") {
        if (!nd.inline) {
          flush();
          if (nd.unclosed) ctx.diag.error(nd, "LaTeX Error: \\begin{" + nd.env + "} on input line " + nd.line + " ended by \\end{document}.", "Add \\end{" + nd.env + "}.");
          if (!ctx.fragile) ctx.diag.warn(nd, "Verbatim text needs \\begin{frame}[fragile].", "Real LaTeX stops here unless the frame is marked [fragile].");
          nd.value.split(/\n/).forEach(function (l) { if (l.trim()) out.push({ type: "para", md: l, at: nd }); });
          continue;
        }
        if (!ctx.fragile) ctx.diag.warn(nd, "\\verb needs \\begin{frame}[fragile].", "Real LaTeX stops here unless the frame is marked [fragile].");
        para.push(nd);
        continue;
      }
      if (nd.type === "group") {
        if (hasBlocks(nd.children)) { flush(); blocks(nd.children, ctx, out); }
        else para.push(nd);
        continue;
      }
      if (nd.type === "env") {
        var name = nd.name;
        if (LIST_ENVS[name]) { flush(); out.push({ type: "list", items: readList(nd, ctx), at: nd }); continue; }
        if (name === "columns") { flush(); out.push({ type: "columns", cols: readColumns(nd, ctx), at: nd }); continue; }
        if (name === "column") { flush(); out.push({ type: "columns", cols: [readColumn(nd.children, ctx, true)], at: nd }); continue; }
        if (BOX_ENVS[name]) { flush(); out.push(readBlockEnv(nd, ctx)); continue; }
        if (name === "center") { flush(); out.push({ type: "center" }); blocks(nd.children, ctx, out); continue; }
        if (SIZES[name] != null) { flush(); out.push({ type: "size", dense: SIZES[name] < 0, name: name }); blocks(nd.children, ctx, out); continue; }
        if (PASS_ENVS[name]) {
          flush();
          var kids = nd.children.slice(), k0 = skipSpaces(kids, 0);
          if (name === "minipage") { var mb = readBracket(kids, k0); if (mb) k0 = mb.next; var mw = readArg(kids, k0); if (mw) k0 = mw.next; }
          if (/^(figure|table)/.test(name)) { var fb = readBracket(kids, k0); if (fb) k0 = fb.next; }
          if (name === "onlyenv" || name === "uncoverenv" || name === "visibleenv" || name === "actionenv") k0 = skipOverlay(kids, k0);
          blocks(kids.slice(k0), ctx, out);
          continue;
        }
        if (MATH_ENVS[name]) { flush(); var mt = mathText(nd.children, ctx); if (mt) out.push({ type: "para", md: mt, at: nd }); continue; }
        if (TABLE_ENVS[name]) {
          flush();
          ctx.diag.warn(nd, "Table shown as plain text.", "Tables are not part of the slide design; each row is shown as a line of text.");
          var rows = rawRows(nd, ctx);
          rows.forEach(function (r) { if (r) out.push({ type: "para", md: r, at: nd }); });
          continue;
        }
        if (name === "frame") { flush(); ctx.diag.error(nd, "LaTeX Error: Frames cannot be nested.", "Close the outer frame with \\end{frame} before starting a new one."); continue; }
        flush();
        if (!ctx.envs[name]) ctx.diag.warn(nd, "LaTeX Error: Environment " + name + " undefined.", "The preview shows what is inside it as plain text.");
        blocks(nd.children, ctx, out);
        continue;
      }
      if (nd.type === "cmd") {
        var cmd = (ctx.aliases && ctx.aliases[nd.value]) || nd.value, j = i + 1, a;
        if (cmd === "frametitle" || cmd === "framesubtitle") {
          flush();
          j = skipOverlay(nodes, j);
          var tb = readBracket(nodes, j); if (tb) j = tb.next;    // [short title]
          a = readArg(nodes, j);
          if (a) out.push(cmd === "frametitle" ? { type: "title", md: clean(inlineMd(a.nodes, ctx, {})), at: nd }
            : { type: "subtitle", md: subtitleMd(a.nodes, ctx), at: nd });
          i = (a ? a.next : j) - 1;
          continue;
        }
        if (cmd === "bigtitle" || cmd === "colheading") {
          flush();
          a = readArg(nodes, j);
          if (a) out.push({ type: cmd === "bigtitle" ? "bigtitle" : "heading", md: clean(inlineMd(a.nodes, ctx, {})), at: nd });
          i = (a ? a.next : j) - 1;
          continue;
        }
        if (cmd === "linkbox") {
          flush();
          var l1 = readArg(nodes, j), l2 = l1 ? readArg(nodes, l1.next) : null, l3 = l2 ? readArg(nodes, l2.next) : null;
          if (!l3) {
            ctx.diag.error(nd, "Runaway argument? Missing argument for \\linkbox.", "\\linkbox needs three arguments: \\linkbox{label}{link address}{text}.");
            i = (l3 ? l3.next : l2 ? l2.next : l1 ? l1.next : j) - 1;
            continue;
          }
          var boxHref = urlFrom(l2.nodes, ctx, nd);
          out.push({ type: "box", label: clean(inlineMd(l1.nodes, ctx, {})), text: clean(inlineMd(l3.nodes, ctx, {})), href: boxHref, at: nd });
          i = l3.next - 1;
          continue;
        }
        if (cmd === "includegraphics") {
          flush();
          if (nodes[j] && nodes[j].type === "text" && nodes[j].value.charAt(0) === "*") {
            if (nodes[j].value.length > 1) nodes[j] = shallow(nodes[j], { value: nodes[j].value.slice(1), raw: nodes[j].value.slice(1) }); else j++;
          }
          j = skipOverlay(nodes, j);
          var gopt = readBracket(nodes, j); if (gopt) j = gopt.next;
          a = readArg(nodes, j);
          if (!a) { ctx.diag.error(nd, "Runaway argument? Missing file name for \\includegraphics.", "Write \\includegraphics{images/photo.jpg}."); continue; }
          var path = rawText(a.nodes).trim();
          var opts = gopt ? keyvals(gopt.nodes) : {};
          out.push({ type: "image", path: path, src: ctx.image(path, nd), alt: optText(opts.alt, ctx), at: nd });
          i = a.next - 1;
          continue;
        }
        if (cmd === "titlepage" || cmd === "maketitle") { flush(); out.push({ type: "titlepage", at: nd }); continue; }
        if (cmd === "centering") { out.push({ type: "center" }); continue; }
        if (SIZES[cmd] != null) { out.push({ type: "size", dense: SIZES[cmd] < 0, name: cmd, at: nd }); continue; }
        if (cmd === "\\" || cmd === "newline" || cmd === "par") {
          flush();
          if (cmd === "\\") {
            var jj = j;
            if (nodes[jj] && nodes[jj].type === "text" && nodes[jj].value.charAt(0) === "*") {
              if (nodes[jj].value.length > 1) nodes[jj] = shallow(nodes[jj], { value: nodes[jj].value.slice(1), raw: nodes[jj].value.slice(1) }); else jj++;
            }
            var sb = readBracket(nodes, jj, true);
            i = (sb ? sb.next : jj) - 1;
          }
          continue;
        }
        if (cmd === "note") {
          flush();
          j = skipOverlay(nodes, j);
          var nbk = readBracket(nodes, j); if (nbk) j = nbk.next;
          a = readArg(nodes, j);
          if (a) out.push({ type: "note", text: clean(inlineMd(a.nodes, ctx, { plain: true })) });
          i = (a ? a.next : j) - 1;
          continue;
        }
        if (cmd === "only" || cmd === "uncover" || cmd === "visible" || cmd === "onslide") {
          // Overlay wrappers may hold whole lists: look inside.
          var oj = skipOverlay(nodes, j);
          var on = nodes[skipSpaces(nodes, oj)];
          if (on && on.type === "group" && hasBlocks(on.children)) {
            flush();
            blocks(on.children, ctx, out);
            i = skipSpaces(nodes, oj);
            continue;
          }
        }
      }
      para.push(nd);
    }
    flush();
    return out;
  }

  function firstReal(nodes) {
    for (var i = 0; i < nodes.length; i++) if (!isBlank(nodes[i])) return nodes[i];
    return nodes[0];
  }

  // key=value options -> { key: value nodes, or true for a bare key }.
  // Values stay LaTeX (use optText() for the ones that are text).
  function keyvals(nodes) {
    var parts = [], cur = [];
    nodes.forEach(function (nd) {
      if (nd.type === "text" && nd.value.indexOf(",") >= 0) {
        var bits = nd.value.split(",");
        bits.forEach(function (b, k) {
          if (b) cur.push(shallow(nd, { value: b, raw: b }));
          if (k < bits.length - 1) { parts.push(cur); cur = []; }
        });
      } else cur.push(nd);
    });
    parts.push(cur);
    var o = {};
    parts.forEach(function (p) {
      var key = "", val = null, seenEq = false, valNodes = [];
      p.forEach(function (nd) {
        if (!seenEq && nd.type === "text" && nd.value.indexOf("=") >= 0) {
          var at = nd.value.indexOf("=");
          key += nd.value.slice(0, at);
          seenEq = true;
          var rest = nd.value.slice(at + 1);
          if (rest) valNodes.push(shallow(nd, { value: rest, raw: rest }));
        } else if (!seenEq) key += rawText([nd]);
        else valNodes.push(nd);
      });
      key = key.trim();
      if (!key) return;
      if (seenEq) {
        // A value in braces is one group: unwrap it.
        var vn = valNodes.filter(function (x) { return !isBlank(x); });
        if (vn.length === 1 && vn[0].type === "group") valNodes = vn[0].children;
        val = valNodes;
      }
      o[key] = seenEq ? val : true;
    });
    return o;
  }

  // An option value that is text (alt=..., label=...) as plain text.
  function optText(v, ctx) {
    return v && v !== true ? clean(inlineMd(v, ctx, { plain: true })) : "";
  }

  function rawRows(env, ctx) {
    var kids = env.children.slice(), k = skipSpaces(kids, 0);
    if (/^tabular/.test(env.name)) {
      var pb = readBracket(kids, k); if (pb) k = pb.next;
      if (env.name !== "tabular") { var w = readArg(kids, k); if (w) k = w.next; }
      var spec = readArg(kids, k); if (spec) k = spec.next;
    }
    var rows = [], cur = [];
    kids.slice(k).forEach(function (nd) {
      if (nd.type === "cmd" && (nd.value === "\\" || nd.value === "hline" || nd.value === "toprule" || nd.value === "midrule" || nd.value === "bottomrule")) {
        if (nd.value === "\\") { rows.push(cur); cur = []; }
        return;
      }
      if (nd.type === "&") { cur.push({ type: "text", value: " | ", raw: " | ", file: nd.file, line: nd.line }); return; }
      if (nd.type === "env" && /^tabular/.test(nd.name)) { rawRows(nd, ctx).forEach(function (r) { cur.push({ type: "text", value: r + " ", raw: r, file: nd.file, line: nd.line }); }); return; }
      cur.push(nd);
    });
    rows.push(cur);
    return rows.map(function (r) { return clean(inlineMd(r, ctx, {})); });
  }

  // itemize / enumerate / description -> deck.js bullets
  function readList(env, ctx) {
    var kind = env.name;
    var nodes = env.children.slice();
    var i = skipBlank(nodes, 0);
    var lb = readBracket(nodes, i);                         // \begin{itemize}[<+->] or enumitem options
    if (lb) i = lb.next;
    var items = [], cur = null, stray = [];
    for (; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "cmd" && ((ctx.aliases && ctx.aliases[nd.value]) || nd.value) === "item") {
        cur = { label: null, nodes: [], at: nd };
        items.push(cur);
        var j = skipOverlay(nodes, i + 1);
        var ib = readBracket(nodes, j);
        if (ib) { cur.label = ib.nodes; i = ib.next - 1; }
        else i = j - 1;
        continue;
      }
      if (!cur) { if (!isBlank(nd)) stray.push(nd); continue; }
      cur.nodes.push(nd);
    }
    if (stray.length) {
      ctx.diag.warn(stray[0], "LaTeX Error: Something's wrong--perhaps a missing \\item.", "Every point in a list starts with \\item.");
      items.unshift({ label: null, nodes: stray, at: stray[0] });
    }
    return items.map(function (it, idx) { return readItem(it, kind, idx, ctx); });
  }

  function readItem(it, kind, idx, ctx) {
    var textNodes = [], sub = [];
    it.nodes.forEach(function (nd) {
      if (nd.type === "env" && LIST_ENVS[nd.name]) sub = sub.concat(readList(nd, ctx));
      else textNodes.push(nd);
    });
    var text = clean(inlineMd(textNodes, ctx, { item: true }));
    if (it.label) {
      var lab = clean(inlineMd(it.label, ctx, {}));
      if (lab) text = (kind === "description" ? "**" + lab + "**" : lab) + (text ? " " + text : "");
    } else if (kind === "enumerate") {
      text = (idx + 1) + ". " + text;
    }
    return sub.length ? { text: text, sub: sub } : text;
  }

  function readColumns(env, ctx) {
    var nodes = env.children.slice();
    var i = skipBlank(nodes, 0);
    var ob = readBracket(nodes, i);
    if (ob) i = ob.next;
    var cols = [], loose = null;
    for (; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "env" && nd.name === "column") { cols.push(readColumn(nd.children, ctx, true)); loose = null; continue; }
      if (nd.type === "cmd" && nd.value === "column") {           // \column{.5\textwidth}
        var j = skipOverlay(nodes, i + 1);
        var cb = readBracket(nodes, j); if (cb) j = cb.next;
        var w = readArg(nodes, j); if (w) j = w.next;
        loose = { nodes: [], width: w ? widthFraction(w.nodes) : null };
        cols.push(loose);
        i = j - 1;
        continue;
      }
      if (loose) { loose.nodes.push(nd); continue; }
      if (!isBlank(nd)) {
        ctx.diag.warn(nd, "Text between columns is not shown.", "Put it inside a \\begin{column}{...} ... \\end{column}.");
      }
    }
    return cols.map(function (c) {
      if (!c.nodes) return c;
      var col = readColumn(c.nodes, ctx, false);
      col.width = c.width;
      return col;
    });
  }

  // One column -> { heading, items, paras, images, boxes, blocks, width }
  function readColumn(nodes, ctx, hasWidth) {
    nodes = nodes.slice();
    var i = 0, width = null;
    if (hasWidth) {
      i = skipBlank(nodes, 0);
      var pb = readBracket(nodes, i); if (pb) i = pb.next;
      var w = readArg(nodes, i); if (w) { i = w.next; width = widthFraction(w.nodes); }
    }
    var bl = blocks(nodes.slice(i), ctx, []);
    var col = { heading: null, items: [], paras: [], images: [], boxes: [], blocks: bl, lists: 0, titles: [], width: width };
    var seenList = false;
    bl.forEach(function (b) {
      if (b.type === "heading") { if (col.heading == null) col.heading = b.md; else col.paras.push(b); }
      else if (b.type === "list") { col.items = col.items.concat(b.items); col.lists++; seenList = true; }
      else if (b.type === "image") col.images.push(b);
      else if (b.type === "box") col.boxes.push(b);
      else if (b.type === "para") {
        if (!seenList && col.heading == null && !col.images.length && !col.headingFromPara) col.headingFromPara = b;
        col.paras.push(b);
      }
      else if (b.type === "bigtitle" || b.type === "title") col.titles.push(b);
    });
    return col;
  }

  function readBlockEnv(env, ctx) {
    var nodes = env.children.slice();
    var i = skipOverlay(nodes, 0);
    var title = readArg(nodes, i);                          // \begin{block}{Title}
    var label = title ? clean(inlineMd(title.nodes, ctx, {})) : "";
    var bodyNodes = title ? nodes.slice(title.next) : nodes;
    var whole = label;
    // A title that is one link makes the whole box a link.
    var href = "", m = /^\[([^\]]*)\]\(([^)\s]+)\)$/.exec(label);
    if (m) { label = m[1]; href = m[2]; }
    var inner = blocks(bodyNodes, ctx, []);
    var text = inner.map(function (b) {
      if (b.type === "para") return b.md;
      if (b.type === "list") return b.items.map(function (it) { return typeof it === "string" ? it : it.text; }).join("; ");
      return "";
    }).filter(Boolean).join(" ");
    var size = null;                                         // \footnotesize inside the block
    inner.forEach(function (b) { if (b.type === "size") size = b.name || null; });
    return { type: "box", label: label, text: text, href: href, title: whole, env: true, size: size, at: env };
  }

  // A frame's blocks -> one slide object (deck.js schema).
  function buildSlide(frame, ctx) {
    var bl = frame.blocks;
    var title = frame.title, subtitle = frame.subtitle, dense = false, center = false, size = null;
    var titlepage = false, notes = null, bigtitle = null;
    var lists = [], paras = [], images = [], boxes = [], loose = [], colBlocks = [], order = [];
    frame.extra = { size: null, colWidths: null, blockSize: null };

    bl.forEach(function (b) {
      switch (b.type) {
        case "title": title = b.md; break;
        case "subtitle": subtitle = b.md; break;
        case "bigtitle": if (bigtitle == null) bigtitle = b.md; else paras.push(b); break;
        case "heading": paras.push({ type: "para", md: "**" + b.md + "**", at: b.at }); break;
        case "size": dense = b.dense; size = b.name || null; break;
        case "center": center = true; break;
        case "titlepage": titlepage = true; break;
        case "note": notes = b.text; break;
        case "list": lists.push(b); order.push(b); break;
        case "para": paras.push(b); order.push(b); break;
        case "image": images.push(b); break;
        case "box": boxes.push(b); if (b.env) loose.push(b); break;
        case "columns":
          colBlocks.push(b);
          b.cols.forEach(function (c) {
            images = images.concat(c.images);
            boxes = boxes.concat(c.boxes);
            c.titles.forEach(function (t) { if (t.type === "bigtitle" && bigtitle == null) bigtitle = t.md; else if (t.type === "title") title = t.md; });
          });
          break;
      }
    });

    var slide = { id: null, page: frame.page, layout: "bullets", title: "" };
    var allItems = [];
    lists.forEach(function (l) { allItems = allItems.concat(l.items); });

    if (titlepage) {
      var meta = ctx.meta;
      slide.layout = "end";
      slide.title = meta.title || title || "";
      slide.paragraphs = [meta.subtitle, meta.author, meta.institute, meta.date].filter(function (x) { return x; });
    } else if (images.length && !allItems.length && !boxes.length) {
      // "title": picture + big title + paragraphs (from the columns, in order)
      slide.layout = "title";
      slide.title = bigtitle != null ? bigtitle : (title || "");
      var img = images[0];
      slide.image = { src: img.src, alt: img.alt };
      var ps = [];
      bl.forEach(function (b) {
        if (b.type === "para") ps.push(b.md);
        if (b.type === "columns") b.cols.forEach(function (c) {
          c.blocks.forEach(function (cb) {
            if (cb.type === "para") ps.push(cb.md);
            if (cb.type === "heading") ps.push("**" + cb.md + "**");
            if (cb.type === "list") cb.items.forEach(function (it) { ps.push("\u2022 " + (typeof it === "string" ? it : it.text)); });
          });
        });
      });
      slide.paragraphs = ps;
      if (images.length > 1) ctx.diag.warn(images[1].at, "Only one picture fits a title slide.", "The first \\includegraphics is shown; the others are left out.");
    } else if (!allItems.length && !colBlocks.length && boxes.length === 1 && loose.length === 1) {
      // "abstract": one block on its own (a paper's abstract), then the paragraphs after it
      slide.layout = "abstract";
      slide.title = title != null ? title : (bigtitle || "");
      if (subtitle) slide.subtitle = subtitle;
      slide.block = { title: loose[0].title, text: loose[0].text };
      frame.extra.blockSize = loose[0].size;
      slide.paragraphs = paras.map(function (p) { return p.md; });
      warnImages(images, ctx);
    } else if (boxes.length) {
      slide.layout = "boxes";
      slide.title = title != null ? title : (bigtitle || "");
      if (subtitle) slide.subtitle = subtitle;
      var bItems = allItems.slice();
      colBlocks.forEach(function (cbk) { cbk.cols.forEach(function (c) { bItems = bItems.concat(c.items); }); });
      slide.bullets = withLooseText(bItems, paras, slide, ctx, order);
      slide.boxes = boxes.map(function (b) { var o = { label: b.label, text: b.text }; if (b.href) o.href = b.href; return o; });
      warnImages(images, ctx);
    } else if (colBlocks.length) {
      slide.layout = "two-column";
      slide.title = title != null ? title : (bigtitle || "");
      if (subtitle) slide.subtitle = subtitle;
      var cols = [];
      colBlocks.forEach(function (cbk) { cols = cols.concat(cbk.cols); });
      if (colBlocks.length > 1) ctx.diag.warn(colBlocks[1].at, "Only one columns environment is shown per slide.", "The columns are placed side by side, two per row.");
      frame.extra.colWidths = cols.map(function (c) { return c.width || null; });
      slide.columns = cols.map(function (c) {
        var heading = c.heading;
        var extra = c.paras.slice();
        if (heading == null && c.headingFromPara) { heading = c.headingFromPara.md; extra.splice(extra.indexOf(c.headingFromPara), 1); }
        var items = c.items.slice();
        extra.forEach(function (p) {
          ctx.diag.warn(p.at, "Text outside a list is shown as a bullet point.", "In a column, start each point with \\item inside \\begin{itemize}.");
          items.push(p.md);
        });
        return { heading: heading || "", bullets: items };
      });
      if (allItems.length) {
        ctx.diag.warn(lists[0].at, "A list outside the columns is added to the last column.", "Put it inside a \\begin{column} ... \\end{column}.");
        var last = slide.columns[slide.columns.length - 1];
        last.bullets = last.bullets.concat(allItems);
      }
      warnImages(images, ctx);
    } else if (allItems.length) {
      slide.layout = "bullets";
      slide.title = title != null ? title : (bigtitle || "");
      if (subtitle) slide.subtitle = subtitle;
      slide.bullets = withLooseText(allItems, paras, slide, ctx, order);
      warnImages(images, ctx);
    } else if (paras.length || bigtitle != null || center) {
      slide.layout = "end";
      slide.title = bigtitle != null ? bigtitle : (title || "");
      slide.paragraphs = paras.map(function (p) { return p.md; });
    } else {
      slide.layout = "bullets";
      slide.title = title != null ? title : "";
      if (subtitle) slide.subtitle = subtitle;
      slide.bullets = [];
    }
    if (dense) slide.dense = true;
    if (notes) slide.notes = notes;
    frame.extra.size = size;
    return slide;
  }

  // Paragraphs in a list slide: before the first list (and no \framesubtitle)
  // they become the subtitle; otherwise each becomes a bullet point.
  function withLooseText(items, paras, slide, ctx, order) {
    if (!paras.length) return items;
    var out = items.slice();
    var firstList = -1;
    for (var i = 0; i < order.length; i++) if (order[i].type === "list") { firstList = i; break; }
    var lead = [];
    paras.forEach(function (p) {
      var pos = order.indexOf(p);
      if (pos >= 0 && (firstList < 0 || pos < firstList) && !slide.subtitle) lead.push(p.md);
      else {
        ctx.diag.warn(p.at, "Text outside a list is shown as a bullet point.", "On this slide, start each point with \\item inside \\begin{itemize}.");
        out.push(p.md);
      }
    });
    if (lead.length) slide.subtitle = lead.join(" ");
    return out;
  }

  function warnImages(images, ctx) {
    images.forEach(function (im) {
      ctx.diag.warn(im.at, "Picture not shown on this slide.", "Pictures show on title slides (a picture and text, no list). See home.tex.");
    });
  }

  // ======================================================================
  // 9. Frames in the document body
  // ======================================================================
  function collectFrames(nodes, ctx, out) {
    nodes = nodes.slice();
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "env" && nd.name === "frame") { out.push(readFrame(nd.children, nd, ctx)); continue; }
      if (nd.type === "cmd" && nd.value === "frame") {                 // \frame[opts]{body}
        var j = skipOverlay(nodes, i + 1);
        var ob = readBracket(nodes, j); if (ob) j = ob.next;
        var a = readArg(nodes, j);
        if (a && a.group) {
          var kids = (ob ? [{ type: "[", raw: "[", file: nd.file, line: nd.line }].concat(ob.nodes, [{ type: "]", raw: "]", file: nd.file, line: nd.line }]) : []).concat(a.nodes);
          out.push(readFrame(kids, shallow(nd, { endLine: a.group.endLine }), ctx));
          i = a.next - 1;
        }
        continue;
      }
      if (nd.type === "cmd" && (nd.value === "titlepage" || nd.value === "maketitle")) {
        out.push(readFrame([nd], nd, ctx));
        continue;
      }
      if (nd.type === "group") { collectFrames(nd.children, ctx, out); continue; }
      if (nd.type === "env") {
        if (LIST_ENVS[nd.name] || nd.name === "columns") ctx.diag.warn(nd, "\\begin{" + nd.name + "} outside a frame is not shown.", "Move it inside \\begin{frame} ... \\end{frame}.");
        collectFrames(nd.children, ctx, out);
        continue;
      }
      if (nd.type === "text" && nd.value.trim()) {
        ctx.diag.warn(nd, "Text outside a frame is not shown.", "In beamer, everything visible goes inside \\begin{frame} ... \\end{frame}.");
        continue;
      }
      if (nd.type === "cmd") {
        var name = nd.value;
        if (name === "againframe") { ctx.diag.warn(nd, "\\againframe is not supported in this preview.", ""); continue; }
        if (!isBuiltin(name) && !ctx.macros[name] && !(name.length === 1 && !LETTER.test(name))) {
          ctx.diag.warn(nd, "Undefined control sequence.", "\\" + name + " is not a command this preview knows.");
        }
        // Skip the arguments of commands such as \section{...} outside frames.
        var k = i + 1;
        if (CMD_DROP[name] != null || /^(title|subtitle|author|institute|date)$/.test(name)) {
          var bk = readBracket(nodes, k); if (bk) k = bk.next;
          var ar = readArg(nodes, k); if (ar && ar.group) k = ar.next;
          i = k - 1;
        }
      }
    }
    return out;
  }

  function readFrame(children, at, ctx) {
    var nodes = children.slice();
    var i = skipOverlay(nodes, 0);
    var opts = {};
    var ob = readBracket(nodes, i);
    if (ob) { opts = keyvals(ob.nodes); i = ob.next; }
    // {title}{subtitle} straight after \begin{frame}: spaces and one line end allowed, not a blank line
    var title = null, subtitle = null;
    var j = skipSpaces(nodes, i);
    if (nodes[j] && nodes[j].type === "group") {
      title = clean(inlineMd(nodes[j].children, ctx, {}));
      i = j + 1;
      var k = skipSpaces(nodes, i);
      if (nodes[k] && nodes[k].type === "group") { subtitle = subtitleMd(nodes[k].children, ctx); i = k + 1; }
    }
    ctx.fragile = !!opts.fragile;
    var frame = {
      label: optText(opts.label, ctx) || null,
      title: title, subtitle: subtitle,
      file: at.file, line: at.line, endLine: at.endLine || at.line,
      page: String(at.file || "main.tex").replace(/\.tex$/i, ""),
      // [t] / [c] / [b]: where the contents sit (the class option t makes [t] the default)
      valign: opts.t ? "t" : opts.b ? "b" : opts.c ? "c" : (ctx.meta.valign || "c"),
      plain: !!opts.plain
    };
    frame.blocks = blocks(nodes.slice(i), ctx, []);
    ctx.fragile = false;
    frame.slide = buildSlide(frame, ctx);
    return frame;
  }

  // ======================================================================
  // 10. compile(): the whole run
  // ======================================================================
  function compile(files, options) {
    options = options || {};
    files = files || {};
    var main = options.main || "main.tex";
    var diag = new Diag(files);
    var res = { ok: false, slides: [], sources: [], errors: diag.errors, warnings: diag.warnings, notes: diag.notes, filesRead: [], log: "", meta: {} };
    try {
      run(files, main, options, diag, res);
    } catch (e) {
      diag.error({ file: main, line: 1 }, "Internal error in the preview compiler.", String((e && e.message) || e));
    }
    res.ok = diag.errors.length === 0 && res.slides.length > 0;
    if (diag.errors.length === 0 && !res.slides.length && !res.fatal) {
      diag.error({ file: main, line: 1 }, "No pages of output.", "The document has no frames: add \\begin{frame} ... \\end{frame}.");
    }
    if (!res.ok) { res.slides = []; res.sources = []; }
    res.log = rawLog(res, main);
    return res;
  }

  function run(files, main, options, diag, res) {
    if (files[main] == null) {
      diag.error({ file: main, line: 1 }, "LaTeX Error: File `" + main + "' not found.", "The project needs a main.tex.");
      res.fatal = true;
      return;
    }
    res.filesRead.push(main);
    var toks = expandInputs(tokenize(files[main], main), files, [main], diag, res.filesRead);
    var tree = buildTree(toks, diag);
    var top = tree.children;

    // \begin{document} ... \end{document}
    var bIdx = -1, eIdx = -1;
    for (var i = 0; i < top.length; i++) {
      var t = top[i];
      if (t.type !== "cmd" || (t.value !== "begin" && t.value !== "end")) continue;
      var g = top[skipSpaces(top, i + 1)];
      if (!g || g.type !== "group" || rawText(g.children).trim() !== "document") continue;
      if (t.value === "begin" && bIdx < 0) bIdx = i;
      else if (t.value === "end" && bIdx >= 0 && eIdx < 0) eIdx = i;
    }
    if (bIdx < 0) {
      diag.error({ file: main, line: 1 }, "LaTeX Error: Missing \\begin{document}.", "main.tex needs a \\begin{document} after the preamble (and \\end{document} at the end).");
      res.fatal = true;
      return;
    }
    var bodyStart = skipSpaces(top, bIdx + 1) + 1;
    if (eIdx < 0) {
      diag.error(top[top.length - 1] || { file: main, line: 1 }, "Emergency stop.", "*** (job aborted, no legal \\end found). Add \\end{document} at the end of main.tex.");
      eIdx = top.length;
    }

    var ctx = {
      diag: diag, macros: {}, envs: {}, aliases: {}, defined: {}, count: 0, overflow: false, meta: {},
      image: function (path, at) { return resolveImage(path, options.images || {}, diag, at); }
    };

    // Preamble: the document class, definitions and \title & co.
    var pre = top.slice(0, bIdx);
    readPreamble(pre, ctx);

    var body = expand(top.slice(bodyStart, eIdx), ctx, 0);
    if (ctx.overflow) { res.fatal = true; return; }
    body = matchEnvs(body, diag, "body");
    var frames = collectFrames(body, ctx, []);

    var ids = {};
    frames.forEach(function (f, n) {
      var s = f.slide;
      var id = f.label || slug(s.title) || "frame-" + (n + 1);
      if (ids[id]) {
        if (f.label) diag.warn({ file: f.file, line: f.line }, "LaTeX Warning: Label `" + f.label + "' multiply defined.", "Two frames have label=" + f.label + "; give each its own.");
        var k = 2;
        while (ids[id + "-" + k]) k++;
        id = id + "-" + k;
      }
      ids[id] = true;
      s.id = id;
      res.slides.push(order(s));
      res.sources.push({ file: f.file, line: f.line, endLine: f.endLine, page: f.page,
        size: f.extra.size, valign: f.valign, plain: f.plain, colWidths: f.extra.colWidths, blockSize: f.extra.blockSize });
    });
    res.meta = ctx.meta;
    res.footer = footerOf(ctx.meta);
  }

  // What the Madrid footer shows: beamer uses the [short] form when there is
  // one, the long form otherwise; with no \date at all, the date is \today.
  function footerOf(m) {
    function pick(name, dflt) {
      if (m["short" + name] != null) return m["short" + name];
      return m[name] != null ? m[name] : dflt;
    }
    return {
      author: pick("author", ""),
      institute: pick("institute", ""),
      title: pick("title", ""),
      date: pick("date", today()),
      nav: m.navSymbols !== false
    };
  }

  // Key order like deck.js, for readable dumps.
  function order(s) {
    var o = {};
    ["id", "page", "layout", "dense", "title", "subtitle", "image", "block", "paragraphs", "bullets", "columns", "boxes", "notes"].forEach(function (k) {
      if (s[k] !== undefined && s[k] !== null) o[k] = s[k];
    });
    return o;
  }

  function slug(text) {
    return String(text || "").toLowerCase().replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  }

  function readPreamble(nodes, ctx) {
    nodes = nodes.slice();
    var diag = ctx.diag, sawClass = false;
    for (var i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      if (nd.type === "cmd") {
        var name = nd.value;
        if (DEFINERS[name]) {
          var r = readDefinition(nodes, i, diag);
          if (r.def) define(r.def, ctx);
          i = r.next - 1;
          continue;
        }
        if (name === "documentclass") {
          sawClass = true;
          var j = i + 1, ob = readBracket(nodes, j); if (ob) j = ob.next;
          if (ob && keyvals(ob.nodes).t) ctx.meta.valign = "t";   // contents at the top of every frame
          var cls = readArg(nodes, j);
          var clsName = cls ? rawText(cls.nodes).trim() : "";
          if (clsName && clsName !== "beamer") {
            diag.warn(nd, "Document class `" + clsName + "' is not beamer.", "This preview always shows the document as beamer slides.");
          }
          i = (cls ? cls.next : j) - 1;
          continue;
        }
        if (/^(title|subtitle|author|institute|date)$/.test(name)) {
          var k = i + 1, sb = readBracket(nodes, k);
          if (sb) { ctx.meta["short" + name] = clean(inlineMd(sb.nodes, ctx, {})); k = sb.next; }
          var a = readArg(nodes, k);
          if (a) { ctx.meta[name] = clean(inlineMd(a.nodes, ctx, {})).replace(/\s*\\and\s*/g, ", "); k = a.next; }
          i = k - 1;
          continue;
        }
        if (name === "usetheme") {
          var tk = i + 1, tb = readBracket(nodes, tk); if (tb) tk = tb.next;
          var th = readArg(nodes, tk);
          if (th) {
            ctx.meta.theme = rawText(th.nodes).trim();
            if (ctx.meta.theme !== "Madrid") {
              diag.note(nd, "Theme `" + ctx.meta.theme + "' is not drawn by this preview.",
                "Real LaTeX uses the " + ctx.meta.theme + " theme; this preview always draws Madrid.");
            }
            tk = th.next;
          }
          i = tk - 1;
          continue;
        }
        if (name === "setbeamertemplate") {
          // \setbeamertemplate{navigation symbols}{} hides the little icons above the footer
          var nk = i + 1, na = readArg(nodes, nk);
          if (na && rawText(na.nodes).trim() === "navigation symbols") {
            var nb = readArg(nodes, na.next);
            ctx.meta.navSymbols = !!(nb && rawText(nb.nodes).trim());
          }
        }
        if (!PREAMBLE_OK[name] && !ctx.macros[name] && !isBuiltin(name) && name.length > 1) {
          diag.warn(nd, "Undefined control sequence.", "\\" + name + " is not a command this preview knows. Check the spelling.");
        }
        // Skip this command's arguments: * [..] {..} in any number.
        var m = i + 1;
        for (;;) {
          var s = skipSpaces(nodes, m);
          var x = nodes[s];
          if (!x) break;
          if (x.type === "group") { m = s + 1; continue; }
          if (x.type === "[") { var bb = readBracket(nodes, s); if (bb) { m = bb.next; continue; } }
          if (x.type === "text" && x.value === "*") { m = s + 1; continue; }
          break;
        }
        i = m - 1;
        continue;
      }
      if (nd.type === "text" && /[A-Za-z]{2}/.test(nd.value)) {
        // Text straight after a command can be its argument (\setlength\parskip 1em); anything else is stray.
        var p = i - 1;
        while (p >= 0 && isSpace(nodes[p])) p--;
        if (p < 0 || nodes[p].type !== "cmd") diag.warn(nd, "Text before \\begin{document} is not shown.", "Move it below \\begin{document}, inside a frame.");
      }
    }
    if (!sawClass) {
      diag.error({ file: "main.tex", line: 1 }, "LaTeX Error: Missing \\documentclass.", "main.tex must start with \\documentclass{beamer}.");
    }
  }

  // images/x.jpg (the LaTeX project) -> assets/img/x.jpg (the website).
  // map: { "images/x.jpg": "assets/img/x.jpg" } from tex-generate.js.
  function resolveImage(path, map, diag, at) {
    var p = String(path || "").trim().replace(/^\.\//, "");
    if (map[p]) return map[p];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k) && k.replace(/\.[a-z0-9]+$/i, "") === p) return map[k];   // extension left out
    }
    if (/^https?:/i.test(p)) {
      diag.warn(at, "LaTeX Error: File `" + p + "' not found.", "LaTeX cannot load pictures from the web; upload them to the images folder.");
      return p;
    }
    if (/^images\//.test(p)) return "assets/img/" + p.slice(7);
    if (/^assets\//.test(p)) return p;
    return "assets/img/" + p.split("/").pop();
  }

  function rawLog(res, main) {
    var lines = [];
    lines.push("This preview is compiled in your browser by lehanzhang.com (it reads the LaTeX, it is not TeX).");
    lines.push("entering extended mode");
    lines.push("(./" + main + " " + res.filesRead.slice(1).map(function (f) { return "(./" + f + ")"; }).join(" ") + ")");
    res.errors.concat(res.warnings, res.notes).forEach(function (e) {
      var pre = e.level === "error" ? "! " : e.level === "warning" ? "LaTeX Warning: " : "";
      lines.push("");
      lines.push(e.file + ":" + e.line + ": " + pre + e.message.replace(/^LaTeX (Error|Warning): /, ""));
      lines.push(e.context);
    });
    lines.push("");
    if (res.ok) lines.push("Output written on output.pdf (" + res.slides.length + " page" + (res.slides.length === 1 ? "" : "s") + ").");
    else lines.push("No output PDF: fix the errors above and recompile. The preview still shows the last version that worked.");
    return lines.join("\n");
  }

  window.TexParse = { compile: compile, tokenize: tokenize };
})();
