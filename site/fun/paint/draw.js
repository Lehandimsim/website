/* ==========================================================================
   fun/paint/draw.js — the Paint! tab: a small, real paint program.

   Like the real MS Paint, everything is drawn pixel by pixel with no
   anti-aliasing. That keeps the colours exact, so the Fill tool (a real
   flood fill) fills shapes cleanly, without halos.

   Tools: all 16 of Paint's toolbox (free-form and rectangular select, eraser
   and colour eraser, fill, pick colour, magnifier, pencil, brush, airbrush,
   text, line, curve, rectangle, polygon, ellipse, rounded rectangle).
   Left button = drawing colour, right button = background colour.
   Mouse, touch and pen all work (pointer events). Undo/redo, clear, resize
   handles, and "Save": downloads a PNG and sends the drawing to Lehan.

   API (used by app.js):
     PaintDraw.TOOLS, PaintDraw.OPTIONS, PaintDraw.state
     PaintDraw.mount(sheetEl)        show the canvas inside the sheet (created on first use)
     PaintDraw.unmount()             finish anything half-drawn (when leaving the tab)
     PaintDraw.setTool(id) / setColor("fg"|"bg", hex) / setOption(key, value)
     PaintDraw.undo() / redo() / clear() / save()
     PaintDraw.on("change" | "status", fn)
   Sending: SITE_CONFIG.endpoints.drawings (config.js). null = not connected (the mockup).
   ========================================================================== */

(function () {
  "use strict";

  // ---------- The tools, in Paint's toolbox order (two columns) ----------
  var TOOLS = [
    { id: "free-select", name: "Free-Form Select", help: "Selects a free-form part of the picture to move or delete." },
    { id: "select",      name: "Select",           help: "Selects a rectangular part of the picture to move or delete." },
    { id: "eraser",      name: "Eraser/Color Eraser", help: "Erases with the background colour. Right-drag erases only the drawing colour." },
    { id: "fill",        name: "Fill With Color",  help: "Fills an area with the current drawing colour." },
    { id: "picker",      name: "Pick Color",       help: "Picks up a colour from the picture (right-click: background colour)." },
    { id: "magnifier",   name: "Magnifier",        help: "Zooms in where you click; right-click zooms back out." },
    { id: "pencil",      name: "Pencil",           help: "Draws a free-form line one pixel wide." },
    { id: "brush",       name: "Brush",            help: "Draws using a brush with the selected shape and size." },
    { id: "airbrush",    name: "Airbrush",         help: "Draws using an airbrush of the selected size." },
    { id: "text",        name: "Text",             help: "Inserts text into the picture. Click outside the text box to finish." },
    { id: "line",        name: "Line",             help: "Draws a straight line with the selected line width (Shift: 45-degree steps)." },
    { id: "curve",       name: "Curve",            help: "Draws a curve: drag a straight line, then click or drag twice to bend it." },
    { id: "rect",        name: "Rectangle",        help: "Draws a rectangle with the selected fill style (Shift: square)." },
    { id: "polygon",     name: "Polygon",          help: "Draws a polygon: drag the first side, click each corner, double-click to finish." },
    { id: "ellipse",     name: "Ellipse",          help: "Draws an ellipse with the selected fill style (Shift: circle)." },
    { id: "roundrect",   name: "Rounded Rectangle", help: "Draws a rounded rectangle with the selected fill style (Shift: square)." }
  ];

  // What the options box under the toolbox offers for each tool. key = the state field it sets.
  var FILL_STYLES = { key: "fill", values: ["outline", "both", "fill"] };
  var OPTIONS = {
    "free-select": { key: "transparent", values: [false, true] },
    select:    { key: "transparent", values: [false, true] },
    eraser:    { key: "eraser", values: [6, 10, 16, 24] },
    magnifier: { key: "zoom", values: [1, 2, 4, 8] },
    brush:     { key: "brush", grid: 3, values: ["round:10", "round:6", "round:3", "square:10", "square:6", "square:3",
                                                 "slash:10", "slash:6", "slash:3", "backslash:10", "backslash:6", "backslash:3"] },
    airbrush:  { key: "spray", values: [6, 10, 15] },
    text:      { key: "textSize", values: [12, 18, 28, 40] },
    line:      { key: "line", values: [1, 2, 3, 4, 5] },
    curve:     { key: "line", values: [1, 2, 3, 4, 5] },
    rect: FILL_STYLES, polygon: FILL_STYLES, ellipse: FILL_STYLES, roundrect: FILL_STYLES
  };

  var state = {
    tool: "pencil",
    prevTool: "pencil",     // Pick Color and Magnifier hand back to this tool, as in Paint
    fg: "#000000",          // drawing colour (left button)
    bg: "#ffffff",          // background colour (right button)
    eraser: 10,
    brush: "round:6",
    spray: 10,
    textSize: 18,
    line: 2,
    fill: "outline",
    transparent: false,
    zoom: 1
  };

  var MAX_UNDO = 25;
  var TEXT = {
    canvasLabel: "Drawing canvas. Draw with the mouse, a finger or a pen.",
    hintTitle: "Draw something for Lehan!",
    hintBody: "Pick a tool on the left and a colour below, then draw here. Press Save when you're done.",
    fileName: "drawing-for-lehan"
  };

  // ---------- Elements ----------
  var wrap, canvas, ctx, preview, pctx, hint, handles = [], sheet = null, workspace = null;
  var undoStack = [], redoStack = [];
  var drag = null;          // the gesture in progress
  var sel = null;           // the current selection
  var curve = null;         // curve in progress (between clicks)
  var poly = null;          // polygon in progress
  var textBox = null;       // text being typed
  var sprayTimer = null;
  var antsTimer = null, antsOffset = 0;
  var binned = null;        // the last cleared picture (the Recycle Bin can restore it)
  var drewSomething = false;
  var listeners = { change: [], status: [] };

  function on(name, fn) { listeners[name].push(fn); }
  function emit(name, data) { listeners[name].forEach(function (fn) { fn(data); }); }
  function changed() { emit("change", state); }

  // ---------- Colours ----------
  function hexToRgb(hex) {
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) { return (v < 16 ? "0" : "") + v.toString(16); }).join("");
  }
  // A colour as one 32-bit number, in the same byte order as ImageData (works on any endianness).
  var px8 = new Uint8ClampedArray(4), px32 = new Uint32Array(px8.buffer);
  function pack(hex) {
    var c = hexToRgb(hex);
    px8[0] = c[0]; px8[1] = c[1]; px8[2] = c[2]; px8[3] = 255;
    return px32[0];
  }

  // ---------- Creating the canvas ----------
  function create(w, h) {
    wrap = document.createElement("div");
    wrap.className = "pt-canvaswrap";
    canvas = document.createElement("canvas");
    canvas.className = "pt-bitmap";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", TEXT.canvasLabel);
    preview = document.createElement("canvas");
    preview.className = "pt-preview";
    preview.setAttribute("aria-hidden", "true");
    hint = document.createElement("div");
    hint.className = "pt-hint";
    hint.innerHTML = "<span>" + TEXT.hintTitle + "</span><small>" + TEXT.hintBody + "</small>";
    wrap.appendChild(canvas);
    wrap.appendChild(preview);
    wrap.appendChild(hint);
    ctx = canvas.getContext("2d", { willReadFrequently: true });
    pctx = preview.getContext("2d");
    setSize(w, h);
    ctx.fillStyle = state.bg;
    ctx.fillRect(0, 0, w, h);

    ["e", "s", "se"].forEach(function (dir) {
      var b = document.createElement("span");
      b.className = "pt-handle pt-handle--" + dir;
      b.setAttribute("aria-hidden", "true");
      b.addEventListener("pointerdown", function (e) { startResize(e, dir); });
      handles.push(b);
    });

    wrap.addEventListener("pointerdown", onDown);
    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerup", onUp);
    wrap.addEventListener("pointercancel", onUp);
    wrap.addEventListener("lostpointercapture", onUp);
    wrap.addEventListener("pointerleave", function () { if (!drag) emit("status", { xy: "" }); });
    wrap.addEventListener("dblclick", function (e) { if (poly) { e.preventDefault(); finishPolygon(); } });
    wrap.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    document.addEventListener("keydown", onKey);
    wrap.setAttribute("data-tool", state.tool);
  }

  function setSize(w, h) {
    canvas.width = preview.width = w;
    canvas.height = preview.height = h;
    applyZoom();
    emit("status", { size: w + "x" + h });
  }

  function applyZoom() {
    var z = state.zoom;
    [canvas, preview].forEach(function (c) {
      c.style.width = c.width * z + "px";
      c.style.height = c.height * z + "px";
    });
  }

  // The canvas size that fills the visible workspace.
  function fitSize() {
    var w = Math.floor(workspace.clientWidth - 22), h = Math.floor(workspace.clientHeight - 22);
    return [Math.max(240, Math.min(1400, w)), Math.max(180, Math.min(1000, h))];
  }

  // Show the canvas in the sheet. The first time, size it to fit the visible workspace.
  var observer = null;
  function mount(sheetEl) {
    sheet = sheetEl;
    workspace = sheetEl.parentNode;
    if (!canvas) {
      var s = fitSize();
      create(s[0], s[1]);
      // Follow the workspace size (window maximised, browser resized) while the canvas is blank.
      if (window.ResizeObserver) {
        observer = new ResizeObserver(function () { fit(); });
        observer.observe(workspace);
      }
    }
    sheet.innerHTML = "";
    sheet.appendChild(wrap);
    handles.forEach(function (b) { sheet.appendChild(b); });
    sheet.classList.add("is-bitmap");
    fit();
    emit("status", { size: canvas.width + "x" + canvas.height, xy: "" });
    changed();
  }

  // While the canvas is still blank (and was not resized by hand), keep it the size of the
  // workspace, e.g. when the window is maximised or the browser is resized.
  var sizedByHand = false;
  function fit() {
    if (!canvas || !sheet || drewSomething || sizedByHand || drag || textBox || sel || curve || poly) return;
    var s = fitSize();
    if (s[0] === canvas.width && s[1] === canvas.height) return;
    setSize(s[0], s[1]);
    ctx.fillStyle = state.bg;
    ctx.fillRect(0, 0, s[0], s[1]);
  }

  function unmount() {
    finishPending();
    if (sheet) sheet.classList.remove("is-bitmap");
    sheet = null;
  }

  // ---------- Undo / redo ----------
  function snapshot() {
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
    drewSomething = true;
    changed();
  }
  function restore(img) {
    if (img.width !== canvas.width || img.height !== canvas.height) setSize(img.width, img.height);
    ctx.putImageData(img, 0, 0);
  }
  function undo() {
    finishPending();
    if (!undoStack.length) return;
    redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    restore(undoStack.pop());
    changed();
  }
  function redo() {
    finishPending();
    if (!redoStack.length) return;
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    restore(redoStack.pop());
    changed();
  }

  // Image > Clear Image: fill with the background colour. The old picture goes to the Recycle Bin.
  function clear() {
    if (!canvas) return;
    finishPending();
    binned = { img: ctx.getImageData(0, 0, canvas.width, canvas.height), time: new Date() };
    snapshot();
    ctx.fillStyle = state.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    changed();
  }
  function restoreFromBin() {
    if (!binned || !canvas) return false;
    finishPending();
    snapshot();
    restore(binned.img);
    binned = null;
    changed();
    return true;
  }

  // ---------- Pixel drawing primitives (no anti-aliasing) ----------
  function span(c, x0, x1, y) { if (x1 >= x0) c.fillRect(x0, y, x1 - x0 + 1, 1); }

  // Bresenham: call fn(x, y) for every pixel on the line.
  function walk(x0, y0, x1, y1, fn) {
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    var err = dx + dy, guard = 0;
    for (;;) {
      fn(x0, y0);
      if ((x0 === x1 && y0 === y1) || ++guard > 20000) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // A filled disc of diameter d, as horizontal spans (cached).
  var discs = {};
  function disc(d) {
    if (discs[d]) return discs[d];
    var spans = [], r = d / 2, c = (d - 1) / 2;
    for (var j = 0; j < d; j++) {
      var dy = j - c, half = Math.sqrt(Math.max(0, r * r - dy * dy));
      spans.push([Math.ceil(c - half), Math.floor(c + half)]);
    }
    return (discs[d] = spans);
  }
  function stampDisc(c, x, y, d) {
    if (d <= 1) { c.fillRect(x, y, 1, 1); return; }
    var s = disc(d), o = Math.floor(d / 2);
    for (var j = 0; j < s.length; j++) span(c, x - o + s[j][0], x - o + s[j][1], y - o + j);
  }

  // The brush shapes from Paint's options box.
  function stampBrush(c, x, y) {
    var parts = state.brush.split(":"), shape = parts[0], d = +parts[1], o = Math.floor(d / 2), k;
    if (shape === "round") stampDisc(c, x, y, d);
    else if (shape === "square") c.fillRect(x - o, y - o, d, d);
    else if (shape === "slash") for (k = 0; k < d; k++) c.fillRect(x - o + k, y + o - k, 1, 1);
    else for (k = 0; k < d; k++) c.fillRect(x - o + k, y - o + k, 1, 1);
  }

  function thickLine(c, x0, y0, x1, y1, w) {
    walk(x0, y0, x1, y1, function (x, y) { stampDisc(c, x, y, w); });
  }

  // Shapes are drawn row by row: the outline is the outer shape minus the inner (smaller) shape.
  // shape = { x0, y0, x1, y1 } in pixels (inclusive), kind = "rect" | "round" | "ellipse".
  function rowSpan(kind, X0, Y0, X1, Y1, r, y) {
    var yc = y + 0.5;
    if (X1 <= X0 || Y1 <= Y0 || yc < Y0 || yc > Y1) return null;
    var L, R;
    if (kind === "ellipse") {
      var cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2, a = (X1 - X0) / 2, b = (Y1 - Y0) / 2;
      var v = (yc - cy) / b;
      if (Math.abs(v) > 1) return null;
      var half = a * Math.sqrt(1 - v * v);
      L = cx - half; R = cx + half;
    } else {
      var off = 0;
      r = Math.min(r || 0, (X1 - X0) / 2, (Y1 - Y0) / 2);
      if (kind === "round" && r > 0) {
        var dy = yc < Y0 + r ? Y0 + r - yc : (yc > Y1 - r ? yc - (Y1 - r) : 0);
        if (dy > 0) off = r - Math.sqrt(Math.max(0, r * r - dy * dy));
      }
      L = X0 + off; R = X1 - off;
    }
    var l = Math.ceil(L - 0.5), rr = Math.floor(R - 0.5);
    return rr >= l ? [l, rr] : null;
  }

  // mode: "outline" (line colour), "both" (outline + fill colour), "fill" (line colour, no outline)
  function drawShape(c, kind, x0, y0, x1, y1, w, mode, lineColor, fillColor) {
    var X0 = Math.min(x0, x1), X1 = Math.max(x0, x1) + 1, Y0 = Math.min(y0, y1), Y1 = Math.max(y0, y1) + 1;
    var radius = kind === "round" ? Math.min(16, (X1 - X0) / 3, (Y1 - Y0) / 3) : 0;
    for (var y = Y0; y < Y1; y++) {
      var o = rowSpan(kind, X0, Y0, X1, Y1, radius, y);
      if (!o) continue;
      if (mode === "fill") { c.fillStyle = lineColor; span(c, o[0], o[1], y); continue; }
      var i = rowSpan(kind, X0 + w, Y0 + w, X1 - w, Y1 - w, Math.max(0, radius - w), y);
      c.fillStyle = lineColor;
      if (i) { span(c, o[0], i[0] - 1, y); span(c, i[1] + 1, o[1], y); }
      else span(c, o[0], o[1], y);
      if (i && mode === "both") { c.fillStyle = fillColor; span(c, i[0], i[1], y); }
    }
  }

  // Polygon: even-odd scanline fill, plus an outline drawn with the line width.
  function drawPolygon(c, pts, w, mode, lineColor, fillColor) {
    if (mode !== "outline" && pts.length > 2) {
      c.fillStyle = mode === "fill" ? lineColor : fillColor;
      var minY = Infinity, maxY = -Infinity;
      pts.forEach(function (p) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
      for (var y = minY; y <= maxY; y++) {
        var yc = y + 0.5, xs = [];
        for (var i = 0; i < pts.length; i++) {
          var a = pts[i], b = pts[(i + 1) % pts.length];
          var ay = a[1] + 0.5, by = b[1] + 0.5;
          if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) {
            xs.push(a[0] + 0.5 + (yc - ay) / (by - ay) * (b[0] - a[0]));
          }
        }
        xs.sort(function (m, n) { return m - n; });
        for (var k = 0; k + 1 < xs.length; k += 2) span(c, Math.ceil(xs[k] - 0.5), Math.floor(xs[k + 1] - 0.5), y);
      }
    }
    if (mode !== "fill") {
      c.fillStyle = lineColor;
      for (var j = 0; j < pts.length; j++) {
        var p = pts[j], q = pts[(j + 1) % pts.length];
        thickLine(c, p[0], p[1], q[0], q[1], w);
      }
    }
  }

  // A cubic Bezier from a to b, bent by c1 and c2.
  function drawBezier(c, a, c1, c2, b, w) {
    var len = Math.abs(a[0] - c1[0]) + Math.abs(a[1] - c1[1]) + Math.abs(c1[0] - c2[0]) + Math.abs(c1[1] - c2[1]) +
              Math.abs(c2[0] - b[0]) + Math.abs(c2[1] - b[1]);
    var n = Math.max(8, Math.ceil(len / 3)), prev = a;
    for (var k = 1; k <= n; k++) {
      var t = k / n, u = 1 - t;
      var p = [Math.round(u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0]),
               Math.round(u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1])];
      thickLine(c, prev[0], prev[1], p[0], p[1], w);
      prev = p;
    }
  }

  // ---------- Fill With Color: a scanline flood fill on exact colours ----------
  function floodFill(x, y, hex) {
    var w = canvas.width, h = canvas.height;
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    var img = ctx.getImageData(0, 0, w, h);
    var d = new Uint32Array(img.data.buffer);
    var target = d[y * w + x], repl = pack(hex);
    if (target === repl) return false;
    var stack = [x, y];
    while (stack.length) {
      var cy = stack.pop(), cx = stack.pop(), i = cy * w + cx;
      while (cx > 0 && d[i - 1] === target) { cx--; i--; }
      var up = false, down = false;
      while (cx < w && d[i] === target) {
        d[i] = repl;
        if (cy > 0) {
          if (d[i - w] === target) { if (!up) { stack.push(cx, cy - 1); up = true; } } else up = false;
        }
        if (cy < h - 1) {
          if (d[i + w] === target) { if (!down) { stack.push(cx, cy + 1); down = true; } } else down = false;
        }
        cx++; i++;
      }
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }

  // Eraser with the right button: only the drawing colour turns into the background colour.
  function colorErase(x, y, size) {
    var o = Math.floor(size / 2), x0 = Math.max(0, x - o), y0 = Math.max(0, y - o);
    var w = Math.min(canvas.width, x - o + size) - x0, h = Math.min(canvas.height, y - o + size) - y0;
    if (w <= 0 || h <= 0) return;
    var img = ctx.getImageData(x0, y0, w, h), d = new Uint32Array(img.data.buffer);
    var from = pack(state.fg), to = pack(state.bg), hit = false;
    for (var i = 0; i < d.length; i++) if (d[i] === from) { d[i] = to; hit = true; }
    if (hit) ctx.putImageData(img, x0, y0);
  }

  function spray(x, y, color) {
    var r = state.spray, n = Math.round(r * 1.4);
    ctx.fillStyle = color;
    for (var k = 0; k < n; k++) {
      var dx = Math.round((Math.random() * 2 - 1) * r), dy = Math.round((Math.random() * 2 - 1) * r);
      if (dx * dx + dy * dy <= r * r) ctx.fillRect(x + dx, y + dy, 1, 1);
    }
  }

  // ---------- Pointer input ----------
  function pos(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: Math.floor((e.clientX - r.left) * canvas.width / r.width),
      y: Math.floor((e.clientY - r.top) * canvas.height / r.height)
    };
  }
  function inCanvas(p) { return p.x >= 0 && p.y >= 0 && p.x < canvas.width && p.y < canvas.height; }
  function clampPt(p) {
    return { x: Math.max(0, Math.min(canvas.width - 1, p.x)), y: Math.max(0, Math.min(canvas.height - 1, p.y)) };
  }
  // Shift: keep shapes square and lines at 45-degree steps.
  function constrain(d, x, y, kind) {
    if (!d.shift) return [x, y];
    var dx = x - d.x0, dy = y - d.y0;
    if (kind === "line") {
      var ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4), len = Math.sqrt(dx * dx + dy * dy);
      return [Math.round(d.x0 + Math.cos(ang) * len), Math.round(d.y0 + Math.sin(ang) * len)];
    }
    var m = Math.max(Math.abs(dx), Math.abs(dy));
    return [d.x0 + (dx < 0 ? -m : m), d.y0 + (dy < 0 ? -m : m)];
  }

  function onDown(e) {
    if (!canvas) return;
    if (drag) {
      // A second finger while drawing is ignored; a stale gesture from the same pointer is finished first.
      if (e.pointerId !== drag.id) return;
      onUp({ pointerId: drag.id, type: "pointercancel" });
    }
    if (e.button !== 0 && e.button !== 2 && e.button !== 5) return;   // 5 = the eraser end of a pen
    e.preventDefault();
    try { wrap.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    hideHint();
    var p = pos(e);
    drag = {
      id: e.pointerId, tool: e.button === 5 ? "eraser" : state.tool,
      secondary: e.button === 2, shift: e.shiftKey,
      x0: p.x, y0: p.y, x: p.x, y: p.y, lx: p.x, ly: p.y
    };
    drag.color = drag.secondary ? state.bg : state.fg;
    drag.other = drag.secondary ? state.fg : state.bg;
    var t = HANDLERS[drag.tool];
    if (t && t.down) t.down(drag, e);
  }

  function onMove(e) {
    if (!canvas) return;
    var p = pos(e);
    emit("status", { xy: inCanvas(p) ? p.x + "," + p.y : "" });
    if (!drag || e.pointerId !== drag.id) {
      if (sel && (state.tool === "select" || state.tool === "free-select")) wrap.classList.toggle("is-over-selection", inSel(p));
      return;
    }
    var list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    if (!list || !list.length) list = [e];
    var t = HANDLERS[drag.tool];
    for (var i = 0; i < list.length; i++) {
      var q = pos(list[i]);
      drag.x = q.x; drag.y = q.y; drag.shift = list[i].shiftKey;
      if (t && t.move) t.move(drag);
      drag.lx = q.x; drag.ly = q.y;
    }
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (e.type === "pointerup") { var p = pos(e); d.x = p.x; d.y = p.y; }
    var t = HANDLERS[d.tool];
    if (t && t.up) t.up(d, e.type !== "pointerup");
    emit("status", { size: canvas.width + "x" + canvas.height });
    changed();
  }

  function sizeLabel(d) {
    emit("status", { size: (Math.abs(d.x - d.x0) + 1) + "x" + (Math.abs(d.y - d.y0) + 1) });
  }
  function clearPreview() { pctx.clearRect(0, 0, preview.width, preview.height); }

  // ---------- What each tool does on pointer down / move / up ----------
  function shapeTool(kind) {
    return {
      move: function (d) {
        var p = constrain(d, d.x, d.y, "box");
        clearPreview();
        drawShape(pctx, kind, d.x0, d.y0, p[0], p[1], state.line, state.fill, d.color, d.other);
        sizeLabel({ x0: d.x0, y0: d.y0, x: p[0], y: p[1] });
      },
      up: function (d, cancelled) {
        clearPreview();
        if (cancelled) return;
        var p = constrain(d, d.x, d.y, "box");
        snapshot();
        drawShape(ctx, kind, d.x0, d.y0, p[0], p[1], state.line, state.fill, d.color, d.other);
      }
    };
  }

  var HANDLERS = {
    pencil: {
      down: function (d) { snapshot(); ctx.fillStyle = d.color; ctx.fillRect(d.x0, d.y0, 1, 1); },
      move: function (d) { ctx.fillStyle = d.color; walk(d.lx, d.ly, d.x, d.y, function (x, y) { ctx.fillRect(x, y, 1, 1); }); }
    },
    brush: {
      down: function (d) { snapshot(); ctx.fillStyle = d.color; stampBrush(ctx, d.x0, d.y0); },
      move: function (d) { ctx.fillStyle = d.color; walk(d.lx, d.ly, d.x, d.y, function (x, y) { stampBrush(ctx, x, y); }); }
    },
    eraser: {
      down: function (d) { snapshot(); HANDLERS.eraser.paint(d, d.x0, d.y0); },
      move: function (d) { walk(d.lx, d.ly, d.x, d.y, function (x, y) { HANDLERS.eraser.paint(d, x, y); }); },
      paint: function (d, x, y) {
        var s = state.eraser, o = Math.floor(s / 2);
        if (d.secondary) colorErase(x, y, s);
        else { ctx.fillStyle = state.bg; ctx.fillRect(x - o, y - o, s, s); }
      }
    },
    fill: {
      down: function (d) {
        var before = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (floodFill(d.x0, d.y0, d.color)) {
          undoStack.push(before);
          if (undoStack.length > MAX_UNDO) undoStack.shift();
          redoStack = [];
          drewSomething = true;
        }
      }
    },
    picker: {
      down: function (d) {
        var p = clampPt({ x: d.x0, y: d.y0 }), c = ctx.getImageData(p.x, p.y, 1, 1).data;
        setColor(d.secondary ? "bg" : "fg", rgbToHex(c[0], c[1], c[2]));
        setTool(state.prevTool);
      }
    },
    magnifier: {
      down: function (d) {
        var z = d.secondary ? 1 : (state.zoom === 1 ? 4 : Math.min(8, state.zoom * 2));
        setZoom(z, d.x0, d.y0);
        setTool(state.prevTool);
      }
    },
    airbrush: {
      down: function (d) {
        snapshot();
        spray(d.x0, d.y0, d.color);
        clearInterval(sprayTimer);
        sprayTimer = setInterval(function () { if (drag && drag.tool === "airbrush") spray(drag.x, drag.y, drag.color); }, 30);
      },
      move: function (d) { if (Math.random() < 0.35) spray(d.x, d.y, d.color); },
      up: function () { clearInterval(sprayTimer); sprayTimer = null; }
    },
    line: {
      move: function (d) {
        var p = constrain(d, d.x, d.y, "line");
        clearPreview();
        pctx.fillStyle = d.color;
        thickLine(pctx, d.x0, d.y0, p[0], p[1], state.line);
        sizeLabel({ x0: d.x0, y0: d.y0, x: p[0], y: p[1] });
      },
      up: function (d, cancelled) {
        clearPreview();
        if (cancelled) return;
        var p = constrain(d, d.x, d.y, "line");
        snapshot();
        ctx.fillStyle = d.color;
        thickLine(ctx, d.x0, d.y0, p[0], p[1], state.line);
      }
    },
    curve: {
      down: function (d) {
        if (!curve) curve = { a: [d.x0, d.y0], b: [d.x0, d.y0], c1: null, c2: null, stage: 0, color: d.color };
        HANDLERS.curve.move(d);
      },
      move: function (d) {
        if (curve.stage === 0) curve.b = [d.x, d.y];
        else if (curve.stage === 1) curve.c1 = curve.c2 = [d.x, d.y];
        else curve.c2 = [d.x, d.y];
        drawCurvePreview();
      },
      up: function (d, cancelled) {
        if (cancelled) { curve = null; clearPreview(); return; }
        if (curve.stage === 0 && curve.a[0] === curve.b[0] && curve.a[1] === curve.b[1]) { curve = null; clearPreview(); return; }
        curve.stage++;
        if (curve.stage > 2) finishCurve();
      }
    },
    polygon: {
      down: function (d) {
        if (!poly) poly = { pts: [[d.x0, d.y0]], color: d.color, other: d.other, lastUp: 0 };
        HANDLERS.polygon.move(d);
      },
      move: function (d) {
        clearPreview();
        pctx.fillStyle = poly.color;
        var pts = poly.pts.concat([[d.x, d.y]]);
        for (var i = 0; i < pts.length - 1; i++) thickLine(pctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], state.line);
      },
      up: function (d, cancelled) {
        if (cancelled) return;
        var first = poly.pts[0], last = poly.pts[poly.pts.length - 1], now = Date.now();
        var nearStart = poly.pts.length > 2 && Math.abs(d.x - first[0]) <= 4 && Math.abs(d.y - first[1]) <= 4;
        var dbl = now - poly.lastUp < 350 && Math.abs(d.x - last[0]) <= 4 && Math.abs(d.y - last[1]) <= 4;
        poly.lastUp = now;
        if (nearStart || (dbl && poly.pts.length > 2)) { finishPolygon(); return; }
        if (!(d.x === last[0] && d.y === last[1])) poly.pts.push([d.x, d.y]);
      }
    },
    rect: shapeTool("rect"),
    ellipse: shapeTool("ellipse"),
    roundrect: shapeTool("round"),
    text: {
      down: function (d) {
        if (textBox) { commitText(); return; }
        if (inCanvas({ x: d.x0, y: d.y0 })) openText(d.x0, d.y0, d.color);
      }
    },
    select: selectTool(false),
    "free-select": selectTool(true)
  };

  function drawCurvePreview() {
    clearPreview();
    pctx.fillStyle = curve.color;
    if (curve.stage === 0) thickLine(pctx, curve.a[0], curve.a[1], curve.b[0], curve.b[1], state.line);
    else drawBezier(pctx, curve.a, curve.c1 || curve.a, curve.c2 || curve.b, curve.b, state.line);
  }
  function finishCurve() {
    if (!curve) return;
    var c = curve;
    curve = null;
    clearPreview();
    snapshot();
    ctx.fillStyle = c.color;
    if (c.stage === 0 || !c.c1) thickLine(ctx, c.a[0], c.a[1], c.b[0], c.b[1], state.line);
    else drawBezier(ctx, c.a, c.c1, c.c2 || c.c1, c.b, state.line);
    changed();
  }
  function finishPolygon() {
    if (!poly) return;
    var p = poly;
    poly = null;
    clearPreview();
    if (p.pts.length < 2) return;
    snapshot();
    drawPolygon(ctx, p.pts, state.line, p.pts.length > 2 ? state.fill : "outline", p.color, p.other);
    changed();
  }

  // ---------- Selections (rectangle and free-form) ----------
  // sel = { x, y, w, h, mask (Uint8Array or null), lifted, float (canvas), path (free-form outline) }
  function selectTool(free) {
    return {
      down: function (d) {
        var p = { x: d.x0, y: d.y0 };
        if (sel && inSel(p)) {
          if (!sel.lifted) { snapshot(); lift(); }
          d.mode = "move";
          d.ox = p.x - sel.x; d.oy = p.y - sel.y;
          return;
        }
        commitSelection();
        d.mode = "new";
        d.path = [[d.x0, d.y0]];
      },
      move: function (d) {
        if (d.mode === "move") {
          sel.x = d.x - d.ox; sel.y = d.y - d.oy;
          drawSelection();
          return;
        }
        var p = clampPt({ x: d.x, y: d.y });
        clearPreview();
        if (free) {
          d.path.push([p.x, p.y]);
          pctx.fillStyle = "#000";
          for (var i = 1; i < d.path.length; i++) walk(d.path[i - 1][0], d.path[i - 1][1], d.path[i][0], d.path[i][1], function (x, y) { pctx.fillRect(x, y, 1, 1); });
        } else {
          ants(pctx, Math.min(d.x0, p.x), Math.min(d.y0, p.y), Math.abs(p.x - d.x0) + 1, Math.abs(p.y - d.y0) + 1);
        }
        sizeLabel({ x0: d.x0, y0: d.y0, x: p.x, y: p.y });
      },
      up: function (d, cancelled) {
        if (d.mode === "move" || cancelled) { if (sel) drawSelection(); return; }
        clearPreview();
        var p = clampPt({ x: d.x, y: d.y });
        if (free) {
          d.path.push([p.x, p.y]);
          var xs = d.path.map(function (q) { return q[0]; }), ys = d.path.map(function (q) { return q[1]; });
          var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
          var w = Math.max.apply(null, xs) - x0 + 1, h = Math.max.apply(null, ys) - y0 + 1;
          if (w < 3 || h < 3) return;
          sel = { x: x0, y: y0, w: w, h: h, mask: polygonMask(d.path, x0, y0, w, h), lifted: false };
        } else {
          var sx = Math.min(d.x0, p.x), sy = Math.min(d.y0, p.y);
          var sw = Math.abs(p.x - d.x0) + 1, sh = Math.abs(p.y - d.y0) + 1;
          if (sw < 2 || sh < 2) return;
          sel = { x: sx, y: sy, w: sw, h: sh, mask: null, lifted: false };
        }
        drawSelection();
        startAnts();
      }
    };
  }

  function inSel(p) { return sel && p.x >= sel.x && p.y >= sel.y && p.x < sel.x + sel.w && p.y < sel.y + sel.h; }

  // Which pixels of the bounding box are inside the free-form outline.
  function polygonMask(path, x0, y0, w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var m = c.getContext("2d");
    var pts = path.map(function (q) { return [q[0] - x0, q[1] - y0]; });
    drawPolygon(m, pts, 1, "both", "#000", "#000");
    var data = m.getImageData(0, 0, w, h).data, mask = new Uint8Array(w * h);
    for (var i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] > 0 ? 1 : 0;
    return mask;
  }

  // Pick the selected pixels up, so they can be moved; the hole is filled with the background colour.
  function lift() {
    var f = document.createElement("canvas");
    f.width = sel.w; f.height = sel.h;
    var fc = f.getContext("2d");
    var img = ctx.getImageData(sel.x, sel.y, sel.w, sel.h), d = new Uint32Array(img.data.buffer);
    var bg = pack(state.bg);
    for (var i = 0; i < d.length; i++) {
      if ((sel.mask && !sel.mask[i]) || (state.transparent && d[i] === bg)) d[i] = 0;
    }
    fc.putImageData(img, 0, 0);
    ctx.fillStyle = state.bg;
    if (sel.mask) {
      for (var y = 0; y < sel.h; y++) for (var x = 0; x < sel.w; x++) if (sel.mask[y * sel.w + x]) ctx.fillRect(sel.x + x, sel.y + y, 1, 1);
    } else ctx.fillRect(sel.x, sel.y, sel.w, sel.h);
    sel.float = f;
    sel.lifted = true;
  }

  function commitSelection() {
    if (!sel) return;
    if (sel.lifted) ctx.drawImage(sel.float, sel.x, sel.y);
    sel = null;
    stopAnts();
    clearPreview();
    if (wrap) wrap.classList.remove("is-over-selection");
  }

  function deleteSelection() {
    if (!sel) return;
    if (!sel.lifted) { snapshot(); lift(); }
    sel = null;
    stopAnts();
    clearPreview();
    changed();
  }

  function drawSelection() {
    clearPreview();
    if (!sel) return;
    if (sel.lifted) pctx.drawImage(sel.float, sel.x, sel.y);
    ants(pctx, sel.x, sel.y, sel.w, sel.h);
  }

  // Paint's dashed selection rectangle ("marching ants").
  function ants(c, x, y, w, h) {
    c.save();
    c.lineWidth = 1;
    c.setLineDash([4, 4]);
    c.strokeStyle = "#fff";
    c.lineDashOffset = antsOffset;
    c.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    c.strokeStyle = "#000";
    c.lineDashOffset = antsOffset + 4;
    c.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
    c.restore();
  }
  function startAnts() {
    stopAnts();
    if (SiteUtil.prefersReducedMotion()) return;
    antsTimer = setInterval(function () { antsOffset = (antsOffset + 1) % 8; if (sel && !drag) drawSelection(); }, 120);
  }
  function stopAnts() { clearInterval(antsTimer); antsTimer = null; }

  // ---------- Text tool ----------
  function openText(x, y, color) {
    var el = document.createElement("textarea");
    el.className = "pt-textedit";
    el.setAttribute("aria-label", "Type your text, then click outside the box to place it");
    el.setAttribute("spellcheck", "false");
    el.rows = 1;
    textBox = { el: el, x: x, y: y, color: color, size: state.textSize };
    styleText();
    el.addEventListener("input", sizeText);
    el.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); commitText(); }
    });
    el.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    wrap.appendChild(el);
    sizeText();
    setTimeout(function () { el.focus(); }, 0);
  }
  function styleText() {
    var t = textBox, z = state.zoom, el = t.el;
    el.style.left = t.x * z + "px";
    el.style.top = t.y * z + "px";
    el.style.fontSize = t.size * z + "px";
    el.style.color = t.color;
    el.style.background = state.transparent ? "transparent" : state.bg;
  }
  function sizeText() {
    var el = textBox.el;
    el.style.width = "4px";
    el.style.height = "4px";
    el.style.width = Math.max(30, el.scrollWidth + 6) + "px";
    el.style.height = Math.max(textBox.size * state.zoom * 1.3, el.scrollHeight + 2) + "px";
  }
  function commitText() {
    if (!textBox) return;
    var t = textBox;
    textBox = null;
    var text = t.el.value.replace(/\s+$/, "");
    t.el.remove();
    if (!text) { changed(); return; }
    var lines = text.split("\n"), lh = Math.round(t.size * 1.15);
    var m = document.createElement("canvas").getContext("2d");
    m.font = t.size + "px Arial, Helvetica, sans-serif";
    var w = Math.ceil(Math.max.apply(null, lines.map(function (l) { return m.measureText(l).width; }))) + 4;
    var h = lines.length * lh + 4;
    // Draw the text on its own layer, then snap it to solid pixels (no blur), like Paint's text tool.
    var layer = document.createElement("canvas");
    layer.width = w; layer.height = h;
    var lc = layer.getContext("2d");
    lc.font = m.font;
    lc.textBaseline = "top";
    lc.fillStyle = t.color;
    lines.forEach(function (l, i) { lc.fillText(l, 1, i * lh + 2); });
    var img = lc.getImageData(0, 0, w, h), d = img.data, rgb = hexToRgb(t.color);
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] >= 110) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; } else d[i + 3] = 0;
    }
    lc.putImageData(img, 0, 0);
    snapshot();
    if (!state.transparent) { ctx.fillStyle = state.bg; ctx.fillRect(t.x, t.y, w, h); }
    ctx.drawImage(layer, t.x, t.y);
    changed();
  }

  // ---------- Magnifier ----------
  function setZoom(z, fx, fy) {
    if (!canvas) { state.zoom = z; changed(); return; }
    commitText();
    state.zoom = z;
    applyZoom();
    if (sel) drawSelection();
    if (workspace && fx != null) {
      workspace.scrollLeft = Math.max(0, fx * z - workspace.clientWidth / 2);
      workspace.scrollTop = Math.max(0, fy * z - workspace.clientHeight / 2);
    }
    changed();
  }

  // ---------- Resize handles (drag the canvas edges, as in Paint) ----------
  function startResize(e, dir) {
    if (e.button !== 0 || !canvas) return;
    e.preventDefault();
    e.stopPropagation();
    finishPending();
    var target = e.currentTarget, sx = e.clientX, sy = e.clientY;
    var w0 = canvas.width, h0 = canvas.height, z = state.zoom, nw = w0, nh = h0;
    var ghost = document.createElement("div");
    ghost.className = "pt-resize-ghost";
    sheet.appendChild(ghost);
    try { target.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    function move(ev) {
      if (dir !== "s") nw = Math.max(16, Math.min(3000, Math.round(w0 + (ev.clientX - sx) / z)));
      if (dir !== "e") nh = Math.max(16, Math.min(3000, Math.round(h0 + (ev.clientY - sy) / z)));
      ghost.style.width = nw * z + "px";
      ghost.style.height = nh * z + "px";
      emit("status", { size: nw + "x" + nh });
    }
    function up() {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
      ghost.remove();
      if (nw !== w0 || nh !== h0) resize(nw, nh);
    }
    move(e);
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
  }
  function resize(w, h) {
    sizedByHand = true;
    snapshot();
    var keep = ctx.getImageData(0, 0, Math.min(w, canvas.width), Math.min(h, canvas.height));
    setSize(w, h);
    ctx.fillStyle = state.bg;
    ctx.fillRect(0, 0, w, h);
    ctx.putImageData(keep, 0, 0);
    changed();
  }

  // ---------- Keyboard ----------
  function onKey(e) {
    if (!sheet || !canvas) return;                  // only while the Paint! tab is showing
    var t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
    if (document.querySelector(".xp-modal")) return;
    var k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !typing) {
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); redo(); }
      else if (k === "s") { e.preventDefault(); save(); }
      return;
    }
    if (typing) return;
    if ((e.key === "Delete" || e.key === "Backspace") && sel) { e.preventDefault(); deleteSelection(); }
    else if (e.key === "Escape") {
      if (curve) finishCurve();
      else if (poly) finishPolygon();
      else if (sel) { commitSelection(); changed(); }
    }
  }

  // Anything half-done (text being typed, a floating selection, a curve or polygon) is drawn for real.
  function finishPending() {
    if (!canvas) return;
    commitText();
    finishCurve();
    finishPolygon();
    commitSelection();
  }

  function hideHint() {
    if (hint && !hint.classList.contains("is-gone")) hint.classList.add("is-gone");
  }

  // ---------- Tools, colours and options from the UI ----------
  function setTool(id) {
    if (!HANDLERS[id]) return;
    if (id !== state.tool) {
      finishPending();
      if (id !== "picker" && id !== "magnifier") state.prevTool = id;
      else if (state.tool !== "picker" && state.tool !== "magnifier") state.prevTool = state.tool;
      state.tool = id;
    }
    if (wrap) wrap.setAttribute("data-tool", id);
    changed();
  }
  function setColor(which, hex) {
    state[which === "bg" ? "bg" : "fg"] = hex.toLowerCase();
    changed();
  }
  function setOption(key, value) {
    if (key === "zoom") { setZoom(value, canvas ? canvas.width / 2 : 0, canvas ? canvas.height / 2 : 0); return; }
    state[key] = value;
    if (key === "transparent" && sel && sel.lifted) {
      // re-apply transparency to the floating selection
      var fc = sel.float.getContext("2d"), img = fc.getImageData(0, 0, sel.w, sel.h), d = new Uint32Array(img.data.buffer), bg = pack(state.bg);
      if (value) { for (var i = 0; i < d.length; i++) if (d[i] === bg) d[i] = 0; fc.putImageData(img, 0, 0); drawSelection(); }
    }
    if (key === "textSize" && textBox) { textBox.size = value; styleText(); sizeText(); }
    changed();
  }

  // ---------- Save: download a PNG and send the drawing to Lehan ----------
  function stamp() {
    var d = new Date(), p = function (n) { return (n < 10 ? "0" : "") + n; };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + "-" + p(d.getHours()) + p(d.getMinutes());
  }

  function download(name) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) {
        if (!blob) { resolve(false); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        resolve(true);
      }, "image/png");
    });
  }

  // POST the drawing as JSON: { kind: "drawing", name, message, image (PNG data URL), timestamp }.
  // Content-Type text/plain keeps it a "simple" request, so no CORS preflight is needed (Google Apps
  // Script, for example, cannot answer one). The body is still JSON. Resolves "sent", "failed" or "offline".
  function send(payload) {
    var cfg = window.SITE_CONFIG || {}, endpoint = cfg.endpoints && cfg.endpoints.drawings;
    if (!endpoint) return Promise.resolve("offline");
    if (!window.fetch) return Promise.resolve("failed");
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.ok ? "sent" : "failed"; }, function () { return "failed"; });
  }

  function save() {
    if (!canvas) return;
    var XP = window.XP, U = window.SiteUtil;
    finishPending();
    var file = TEXT.fileName + "-" + stamp() + ".png";
    var image = canvas.toDataURL("image/png");
    var dialog = XP.alert({
      title: "Save and send to Lehan",
      icon: "paint",
      html:
        "<p><b>Save your drawing, and send it to Lehan as a message?</b></p>" +
        '<img class="pt-preview-thumb" src="' + image + '" alt="Your drawing">' +
        '<div class="pt-form">' +
          '<label>Your name (optional)<input id="pt-send-name" type="text" maxlength="80" autocomplete="name"></label>' +
          '<label>A message for Lehan (optional)<textarea id="pt-send-msg" maxlength="600" rows="3"></textarea></label>' +
          // Spam trap: people never see or fill this field; simple bots do.
          '<label class="pt-honey" aria-hidden="true">Leave this empty<input id="pt-send-web" type="text" tabindex="-1" autocomplete="off"></label>' +
        "</div>" +
        "<p>A copy is also saved on your computer, as <code>" + U.esc(file) + "</code>. " +
          '<a href="' + U.esc(U.url("privacy.html")) + '" target="_blank" rel="noopener">Privacy</a></p>',
      buttons: ["Save and send", "Just save", "Cancel"]
    });
    // The dialog is in the page now: focus the name box and let Enter in it mean "Save and send".
    var nameEl = document.getElementById("pt-send-name");
    var msgEl = document.getElementById("pt-send-msg");
    var webEl = document.getElementById("pt-send-web");
    if (nameEl) {
      nameEl.focus();
      nameEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); var b = document.querySelector(".xp-modal .xp-dialog-buttons button"); if (b) b.click(); }
      });
    }
    dialog.then(function (choice) {
      if (choice === "Cancel") return;
      download(file);
      if (choice !== "Save and send") {
        XP.balloon({ title: "Saved", text: "Your drawing was saved as " + file + ".", timeout: 6000, icon: "info" });
        return;
      }
      var payload = {
        kind: "drawing",
        name: (nameEl && nameEl.value || "").trim(),
        message: (msgEl && msgEl.value || "").trim(),
        image: image,
        timestamp: new Date().toISOString()
      };
      if (webEl && webEl.value) return;              // a bot filled the trap: quietly do nothing
      send(payload).then(function (result) {
        if (U.track) U.track("paint_drawing_sent", { result: result, with_message: !!payload.message });
        var cfgEndpoint = window.SITE_CONFIG && SITE_CONFIG.endpoints && SITE_CONFIG.endpoints.drawings;
        if (result === "sent") {
          XP.alert({ title: "Message sent", icon: "info", buttons: ["OK"],
            html: "<p><b>Sent! Thank you" + (payload.name ? ", " + U.esc(payload.name) : "") + ".</b></p><p>Lehan will see your drawing soon. A copy was saved on your computer as <code>" + U.esc(file) + "</code>.</p>" });
        } else if (result === "offline" || !cfgEndpoint) {
          XP.alert({ title: "Saved (not sent: mockup)", icon: "info", buttons: ["OK"],
            html: "<p><b>Your drawing was saved</b> as <code>" + U.esc(file) + "</code>.</p>" +
                  "<p>On the live website, Save would also send it to Lehan, together with your name and message.</p>" +
                  "<p>This mockup is not connected to a server yet, so nothing was sent.</p>" });
        } else {
          XP.alert({ title: "Could not send", icon: "warning", buttons: ["OK"],
            html: "<p><b>The drawing could not be sent right now.</b></p><p>Nothing is lost: it was saved on your computer as <code>" + U.esc(file) + "</code>. You could email it to Lehan instead.</p>" });
        }
      });
    });
  }

  window.PaintDraw = {
    TOOLS: TOOLS,
    OPTIONS: OPTIONS,
    TEXT: TEXT,
    state: state,
    mount: mount,
    unmount: unmount,
    fit: fit,
    setTool: setTool,
    setColor: setColor,
    setOption: setOption,
    undo: undo,
    redo: redo,
    clear: clear,
    save: save,
    restoreFromBin: restoreFromBin,
    binInfo: function () { return binned ? { time: binned.time } : null; },
    canUndo: function () { return undoStack.length > 0; },
    canRedo: function () { return redoStack.length > 0; },
    hasDrawing: function () { return drewSomething; },
    isMounted: function () { return !!sheet; },
    on: on,
    // For tests and tinkering: the raw canvas and the pixel routines.
    _canvas: function () { return canvas; },
    _floodFill: function (x, y, hex) { return floodFill(x, y, hex); }
  };
})();
