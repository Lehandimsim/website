/* ==========================================================================
   fun/overleaf/tex-editor.js — the .tex editor in the middle pane.

   A plain <textarea> does the typing, so copy, paste, undo, phone keyboards
   and screen readers all work as usual. It is transparent and lies exactly
   over a <pre> that shows the same text with LaTeX colours and line numbers.
   Both sit in one scrolling box and wrap long lines identically.

     var ed = TexEditor.create(element, {
       onChange: function (text) {},     // after every edit
       onCompile: function () {},        // Ctrl+Enter or Ctrl+S
       onCursor: function (line) {}      // the caret moved to another line
     });
     ed.setText(text, name, view)   ed.getText()   ed.getView()
     ed.focus()   ed.goToLine(n)   ed.flashLines([n, ...])
     ed.setMarkers([{ line, level: "error" | "warning", message }])
     ed.command("bold" | "italic" | "link" | "item" | "comment")

   Keys: Tab / Shift+Tab indent and outdent by two spaces (Esc, then Tab,
   moves on to the next control; a small hint says so to keyboard users
   while the editor has focus). Enter keeps the indentation. Ctrl+B bold,
   Ctrl+I italic, Ctrl+/ comment out, Ctrl+Enter or Ctrl+S recompile.
   Colours: overleaf.css (.tx-cmd, .tx-env, .tx-comment, .tx-math ...).
   ========================================================================== */

(function () {
  "use strict";

  var INDENT = "  ";

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function span(cls, s) { return '<span class="tx-' + cls + '">' + esc(s) + "</span>"; }

  // ---------- Syntax colours, one line at a time ----------
  var PLAIN_STOP = "%\\${}[]&~#^_";

  function highlight(line) {
    var out = "", i = 0, n = line.length;
    while (i < n) {
      var c = line.charAt(i);
      if (c === "%") { out += span("comment", line.slice(i)); break; }
      if (c === "\\") {
        var m = /^\\(?:[A-Za-z@]+\*?|[^A-Za-z@])?/.exec(line.slice(i));
        var cmd = m[0];
        if (cmd === "\\begin" || cmd === "\\end") {
          var m2 = /^(\s*)\{([^{}]*)\}/.exec(line.slice(i + cmd.length));
          if (m2) {
            out += span("keyword", cmd) + esc(m2[1]) + span("brace", "{") + span("env", m2[2]) + span("brace", "}");
            i += cmd.length + m2[0].length;
            continue;
          }
        }
        out += span(/^\\[A-Za-z@]/.test(cmd) ? "cmd" : "escape", cmd);
        i += cmd.length;
        continue;
      }
      if (c === "$") {                                  // $maths$ up to the next unescaped $
        var display = line.charAt(i + 1) === "$";
        var k = i + (display ? 2 : 1);
        while (k < n && !(line.charAt(k) === "$" && line.charAt(k - 1) !== "\\")) k++;
        var end = k >= n ? n : k + (display && line.charAt(k + 1) === "$" ? 2 : 1);
        out += span("math", line.slice(i, end));
        i = end;
        continue;
      }
      if (c === "{" || c === "}" || c === "[" || c === "]") { out += span("brace", c); i++; continue; }
      if (c === "&" || c === "~" || c === "#" || c === "^" || c === "_") { out += span("special", c); i++; continue; }
      var j = i;
      while (j < n && PLAIN_STOP.indexOf(line.charAt(j)) < 0) j++;
      out += esc(line.slice(i, j));
      i = j;
    }
    return out;
  }

  function create(root, opts) {
    opts = opts || {};
    root.classList.add("ol-code");
    root.innerHTML =
      '<div class="ol-code-scroll">' +
        '<div class="ol-code-inner">' +
          '<pre class="ol-code-hl" aria-hidden="true"></pre>' +
          '<textarea class="ol-code-input" spellcheck="false" autocapitalize="off" autocomplete="off" ' +
            'autocorrect="off" wrap="soft" aria-label="LaTeX source (editable)" aria-describedby="ol-code-help"></textarea>' +
        "</div>" +
      "</div>" +
      // For keyboard users (see keyHint below); screen readers get #ol-code-help instead.
      '<p class="ol-code-hint" aria-hidden="true"><kbd>Esc</kbd>, then <kbd>Tab</kbd> to leave the editor</p>' +
      '<p class="ol-sr" id="ol-code-help">LaTeX source. Tab inserts two spaces; press Escape, then Tab, to move on. ' +
        "Ctrl+Enter recompiles.</p>";

    var scroller = root.querySelector(".ol-code-scroll");
    var pre = root.querySelector(".ol-code-hl");
    var ta = root.querySelector(".ol-code-input");
    var markers = {}, flash = {}, activeLine = 1, tabEscapes = false, name = "";

    function lineOf(pos) {
      var n = 1, s = ta.value;
      for (var i = 0; i < pos && i < s.length; i++) if (s.charCodeAt(i) === 10) n++;
      return n;
    }

    function render() {
      var lines = ta.value.split("\n"), html = "";
      for (var i = 0; i < lines.length; i++) {
        var n = i + 1, mk = markers[n], cls = "ol-ln";
        if (mk) cls += " has-" + mk.level;
        if (n === activeLine) cls += " is-active";
        if (flash[n]) cls += " is-flash";
        html += '<div class="' + cls + '"><span class="ol-ln-n"' +
          (mk ? ' title="' + esc(mk.message) + '"' : "") + ">" + n + "</span>" +
          (lines[i] ? highlight(lines[i]) : "​") + "</div>";
      }
      pre.innerHTML = html;
    }

    function setActive(n) {
      if (n === activeLine) return;
      var rows = pre.children;
      if (rows[activeLine - 1]) rows[activeLine - 1].classList.remove("is-active");
      activeLine = n;
      if (rows[n - 1]) rows[n - 1].classList.add("is-active");
      if (opts.onCursor) opts.onCursor(n);
    }

    // Keep the caret's line in view while typing.
    function revealLine(n, where) {
      var row = pre.children[n - 1];
      if (!row) return;
      var top = row.offsetTop, bottom = top + row.offsetHeight;
      var view = scroller.clientHeight, st = scroller.scrollTop;
      if (where === "center") scroller.scrollTop = Math.max(0, top - view / 3);
      else if (bottom > st + view - 8) scroller.scrollTop = bottom - view + 24;
      else if (top < st + 4) scroller.scrollTop = Math.max(0, top - 12);
    }

    function changed() {
      render();
      setActive(lineOf(ta.selectionStart));
      requestAnimationFrame(function () { revealLine(activeLine); });
      if (opts.onChange) opts.onChange(ta.value);
    }

    // Insert text where the selection is (keeps the browser's undo history).
    function insert(text, from, to) {
      if (from != null) ta.setSelectionRange(from, to);
      var ok = false;
      try { ok = document.execCommand("insertText", false, text); } catch (e) { ok = false; }
      if (!ok) {
        ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
        changed();
      }
    }

    // The whole lines the selection touches: { from, to, text }
    function selectedLines() {
      var s = ta.value, a = ta.selectionStart, b = ta.selectionEnd;
      if (b > a && s.charAt(b - 1) === "\n") b--;
      var from = s.lastIndexOf("\n", a - 1) + 1;
      var to = s.indexOf("\n", b);
      if (to < 0) to = s.length;
      return { from: from, to: to, text: s.slice(from, to) };
    }

    function indent(back) {
      var a = ta.selectionStart, b = ta.selectionEnd;
      if (!back && a === b) { insert(INDENT); return; }
      var L = selectedLines(), count = 0;
      var lines = L.text.split("\n").map(function (l) {
        if (!back) { count++; return INDENT + l; }
        var m = /^ {1,2}|^\t/.exec(l);
        if (m) count++;
        return m ? l.slice(m[0].length) : l;
      });
      var text = lines.join("\n");
      if (text === L.text) return;
      insert(text, L.from, L.to);
      ta.setSelectionRange(L.from, L.from + text.length);
    }

    function toggleComment() {
      var L = selectedLines();
      var lines = L.text.split("\n");
      var all = lines.every(function (l) { return !l.trim() || /^\s*%/.test(l); });
      var text = lines.map(function (l) {
        if (!l.trim()) return l;
        return all ? l.replace(/^(\s*)% ?/, "$1") : l.replace(/^(\s*)/, "$1% ");
      }).join("\n");
      insert(text, L.from, L.to);
      ta.setSelectionRange(L.from, L.from + text.length);
    }

    function wrapSelection(before, after, placeholder) {
      var a = ta.selectionStart, b = ta.selectionEnd;
      var inner = ta.value.slice(a, b) || placeholder || "";
      insert(before + inner + after, a, b);
      ta.setSelectionRange(a + before.length, a + before.length + inner.length);
    }

    function newline() {
      var s = ta.value, a = ta.selectionStart;
      var start = s.lastIndexOf("\n", a - 1) + 1;
      var lead = /^[ \t]*/.exec(s.slice(start, a))[0];
      insert("\n" + lead);
    }

    function command(what) {
      ta.focus();
      if (what === "bold") wrapSelection("\\textbf{", "}", "bold text");
      else if (what === "italic") wrapSelection("\\emph{", "}", "italic text");
      else if (what === "link") {
        var a = ta.selectionStart, b = ta.selectionEnd;
        var label = ta.value.slice(a, b) || "link text";
        var url = "https://";
        insert("\\href{" + url + "}{" + label + "}", a, b);
        ta.setSelectionRange(a + 6, a + 6 + url.length);   // select the address, ready to type over
      } else if (what === "item") {
        var s = ta.value, pos = ta.selectionStart;
        var start = s.lastIndexOf("\n", pos - 1) + 1;
        var lead = /^[ \t]*/.exec(s.slice(start))[0];
        var end = s.indexOf("\n", pos); if (end < 0) end = s.length;
        insert("\n" + lead + "\\item ", end, end);
      } else if (what === "comment") toggleComment();
    }

    ta.addEventListener("input", changed);
    ta.addEventListener("scroll", function () { ta.scrollTop = 0; ta.scrollLeft = 0; });   // the outer box scrolls, never the textarea
    ["keyup", "click", "focus", "select"].forEach(function (ev) {
      ta.addEventListener(ev, function () { setActive(lineOf(ta.selectionStart)); });
    });

    // The visible "Esc, then Tab to leave the editor" hint (.ol-code-hint):
    // shown while the editor has focus to people using the keyboard (focus
    // came with a key press, or they press Tab or Esc in here). Not shown
    // after a click or a tap, or when a deep link puts the caret here.
    var byKey = false;
    document.addEventListener("keydown", function () { byKey = true; }, true);
    document.addEventListener("pointerdown", function () { byKey = false; }, true);
    function keyHint(on) { root.classList.toggle("is-keyboard", on); }
    ta.addEventListener("focus", function () { keyHint(byKey); });
    ta.addEventListener("blur", function () { keyHint(false); });

    ta.addEventListener("keydown", function (e) {
      var mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === "Enter" || e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (opts.onCompile) opts.onCompile();
        return;
      }
      if (e.key === "Escape" || e.key === "Tab") keyHint(true);
      if (e.key === "Escape") { tabEscapes = true; return; }
      if (e.key === "Tab" && !mod && !e.altKey) {
        if (tabEscapes) { tabEscapes = false; return; }       // let Tab move focus on
        e.preventDefault();
        indent(e.shiftKey);
        return;
      }
      tabEscapes = false;
      if (e.key === "Enter" && !mod && !e.shiftKey && !e.altKey && !e.isComposing) { e.preventDefault(); newline(); return; }
      if (mod && !e.shiftKey && (e.key === "b" || e.key === "B")) { e.preventDefault(); command("bold"); return; }
      if (mod && !e.shiftKey && (e.key === "i" || e.key === "I")) { e.preventDefault(); command("italic"); return; }
      if (mod && e.key === "/") { e.preventDefault(); toggleComment(); }
    });

    // Clicking a line number selects that line.
    pre.addEventListener("mousedown", function (e) {
      var num = e.target.closest(".ol-ln-n");
      if (!num) return;
      e.preventDefault();
      var n = +num.textContent, s = ta.value, pos = 0;
      for (var i = 1; i < n; i++) pos = s.indexOf("\n", pos) + 1;
      var end = s.indexOf("\n", pos);
      ta.focus();
      ta.setSelectionRange(pos, end < 0 ? s.length : end + 1);
      setActive(n);
    });

    return {
      element: root,
      textarea: ta,
      setText: function (text, fileName, view) {
        name = fileName || "";
        ta.value = text;
        ta.setAttribute("aria-label", "LaTeX source of " + name + " (editable)");
        markers = {}; flash = {};
        activeLine = 0;
        render();
        var sel = view ? Math.min(view.selStart || 0, text.length) : 0;
        ta.setSelectionRange(sel, view ? Math.min(view.selEnd || sel, text.length) : 0);
        setActive(lineOf(sel));
        scroller.scrollTop = view ? view.scrollTop || 0 : 0;
      },
      getText: function () { return ta.value; },
      getView: function () { return { selStart: ta.selectionStart, selEnd: ta.selectionEnd, scrollTop: scroller.scrollTop }; },
      focus: function () { ta.focus({ preventScroll: true }); },
      currentLine: function () { return lineOf(ta.selectionStart); },
      goToLine: function (n, select) {
        var s = ta.value, pos = 0;
        for (var i = 1; i < n && pos >= 0; i++) pos = s.indexOf("\n", pos) + 1;
        if (pos < 0) pos = s.length;
        ta.focus({ preventScroll: true });
        ta.setSelectionRange(pos, select ? (s.indexOf("\n", pos) < 0 ? s.length : s.indexOf("\n", pos)) : pos);
        setActive(n);
        revealLine(n, "center");
      },
      reveal: function (n) { revealLine(n, "center"); },
      setMarkers: function (list) {
        markers = {};
        (list || []).forEach(function (m) {
          var old = markers[m.line];
          if (!old || (old.level !== "error" && m.level === "error")) markers[m.line] = m;
          else if (old.level === m.level) old.message += "\n" + m.message;
        });
        render();
      },
      flashLines: function (lines) {
        flash = {};
        lines.forEach(function (n) { flash[n] = true; });
        render();
        setTimeout(function () { flash = {}; render(); }, 2600);
      },
      command: command
    };
  }

  window.TexEditor = { create: create, highlight: highlight };
})();
