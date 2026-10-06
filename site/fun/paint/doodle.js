/* ==========================================================================
   fun/paint/doodle.js — hand-drawn SVG doodles for the Paint version.

   Everything that should look "drawn with the mouse in Paint" (the big start
   button, the "click me!" scribble, arrows, underlines, circles, the little
   page icons) is generated here as SVG paths with a little jitter. Each
   doodle has a fixed seed, so it looks the same on every visit. No fonts or
   images are downloaded: the handwriting is a small single-stroke alphabet
   defined below.

   Helpers (all return SVG path data "d" strings unless noted):
     Doodle.text("start", { size, seed })      handwriting; returns { d, width, ascent, descent }
     Doodle.line([[x,y], ...], { seed })        a wobbly line through the points
     Doodle.arrow([[x,y], ...], { seed, head }) the same, with an arrowhead at the end
     Doodle.loop(x, y, w, h, { seed, radius })  a sketchy (rounded) rectangle that overshoots its start
     Doodle.blob(x, y, w, h, { seed, radius })  the closed shape for a "bucket fill" inside a loop
     Doodle.ellipse(cx, cy, rx, ry, { seed })   a loop that does not quite close
     Doodle.highlight(seed)                     a marker-highlighter bar in a 100 x 20 box
     Doodle.boilPath(fn, seed, attrs)           <path> markup with 3 frames for the "boiling line" effect
     Doodle.startBoiling() / stopBoiling()      run the effect on every [data-boil] path in the page
   ========================================================================== */

(function () {
  "use strict";

  // ---------- Seeded randomness (same seed -> same doodle, every visit) ----------
  function rng(seed) {
    var a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- Path helpers ----------
  function num(n) { return Math.round(n * 10) / 10; }
  function pt(p) { return num(p[0]) + " " + num(p[1]); }

  // A smooth curve through the points (Catmull-Rom spline written as cubic Beziers).
  function smooth(pts, closed) {
    var n = pts.length;
    if (n === 1) return "M" + pt(pts[0]) + "l.1 .1";
    if (n === 2) return "M" + pt(pts[0]) + "L" + pt(pts[1]);
    var d = "M" + pt(pts[0]);
    var last = closed ? n : n - 1;
    for (var i = 0; i < last; i++) {
      var p0 = closed ? pts[(i - 1 + n) % n] : (pts[i - 1] || pts[i]);
      var p1 = pts[i];
      var p2 = closed ? pts[(i + 1) % n] : pts[i + 1];
      var p3 = closed ? pts[(i + 2) % n] : (pts[i + 2] || p2);
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += "C" + pt(c1) + " " + pt(c2) + " " + pt(p2);
    }
    return closed ? d + "Z" : d;
  }

  // Add points along long segments, so straight strokes can wobble a little.
  function densify(pts, step) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i];
      out.push(a);
      if (i === pts.length - 1) break;
      var b = pts[i + 1];
      var len = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
      var n = Math.floor(len / step);
      for (var k = 1; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
    }
    return out;
  }

  function jitter(pts, rand, amp) {
    return pts.map(function (p) { return [p[0] + (rand() - 0.5) * 2 * amp, p[1] + (rand() - 0.5) * 2 * amp]; });
  }

  // ---------- Lines and arrows ----------
  // o: seed, wobble (px of jitter, default 1.5), step (px between wobble points, default 24)
  function line(points, o) {
    o = o || {};
    var rand = rng(o.seed || 1);
    var pts = jitter(densify(points, o.step || 24), rand, o.wobble == null ? 1.5 : o.wobble);
    return smooth(pts);
  }

  // Like line(), plus two short strokes for the arrowhead at the last point.
  function arrow(points, o) {
    o = o || {};
    var d = line(points, o);
    var b = points[points.length - 1], a = points[points.length - 2];
    var ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    var L = o.head || 14, spread = o.spread || 0.5;
    var h1 = [b[0] - L * Math.cos(ang - spread), b[1] - L * Math.sin(ang - spread)];
    var h2 = [b[0] - L * Math.cos(ang + spread), b[1] - L * Math.sin(ang + spread)];
    return d + line([h1, b], { seed: (o.seed || 1) + 7, wobble: 0.6, step: 99 }) +
               line([h2, b], { seed: (o.seed || 1) + 9, wobble: 0.6, step: 99 });
  }

  // ---------- Rectangles, loops, ellipses ----------
  // Points around a rounded rectangle, clockwise from the top-left.
  function roundRectPoints(x, y, w, h, r) {
    r = Math.max(0, Math.min(r || 0, w / 2, h / 2));
    var pts = [[x + r, y]];
    var corners = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0],
                   [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
    corners.forEach(function (c) {
      var steps = r > 4 ? 4 : 1;
      for (var k = 0; k <= steps; k++) {
        var a = c[2] + (Math.PI / 2) * (k / steps);
        pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]);
      }
    });
    return pts;
  }

  // A marker outline that runs once round and a bit past its start, as a quick hand-drawn box does.
  // o: seed, radius, wobble (default 2), overshoot (points to repeat, default 3)
  function loop(x, y, w, h, o) {
    o = o || {};
    var rand = rng(o.seed || 3);
    var base = densify(roundRectPoints(x, y, w, h, o.radius || 0), o.step || 22);
    base.pop();                                  // the last point repeats the first
    var over = o.overshoot == null ? 3 : o.overshoot;
    var pts = base.concat(base.slice(0, over + 1).map(function (p, i) {
      return [p[0] + i * 0.6, p[1] + 2.5 + i * 0.4];   // drift off the start, like a real pen
    }));
    return smooth(jitter(pts, rand, o.wobble == null ? 2 : o.wobble));
  }

  // The closed shape inside loop(): use it with a fill colour, behind the outline.
  function blob(x, y, w, h, o) {
    o = o || {};
    var rand = rng((o.seed || 3) + 50);
    var base = densify(roundRectPoints(x, y, w, h, o.radius || 0), o.step || 22);
    base.pop();
    return smooth(jitter(base, rand, o.wobble == null ? 2 : o.wobble), true);
  }

  // An ellipse drawn in one go: it overshoots and does not meet its start exactly.
  function ellipse(cx, cy, rx, ry, o) {
    o = o || {};
    var rand = rng(o.seed || 5);
    var start = rand() * Math.PI * 2;
    var turn = Math.PI * 2 * (1 + (o.overshoot == null ? 0.12 : o.overshoot));
    var n = o.points || 22, pts = [];
    for (var k = 0; k <= n; k++) {
      var t = start + turn * k / n;
      var grow = 1 + 0.07 * k / n;               // a slight spiral, so the ends do not coincide
      pts.push([cx + rx * grow * Math.cos(t), cy + ry * grow * Math.sin(t)]);
    }
    return smooth(jitter(pts, rand, o.wobble == null ? 1.6 : o.wobble));
  }

  // A highlighter stroke in a 100 x 20 box (draw it with preserveAspectRatio="none").
  function highlight(seed) {
    var rand = rng(seed || 11), top = [], bottom = [], k;
    for (k = 0; k <= 8; k++) top.push([1 + k * 12.25, 2.5 + rand() * 3.5]);
    for (k = 8; k >= 0; k--) bottom.push([1 + k * 12.25 + (rand() - 0.5) * 2, 15 + rand() * 3.5]);
    return smooth(top.concat(bottom), true);
  }

  // ---------- Handwriting: a tiny single-stroke alphabet ----------
  // Coordinates: baseline y = 0, x-height y = -50, ascenders y = -92, descenders down to y = 30.
  // Each glyph: w = advance width, s = strokes (each a list of points; curves are smoothed).
  // Corners are separate strokes so they stay sharp. Add letters here to write new words.
  var GLYPHS = {
    a: { w: 46, s: [[[38, -40], [30, -49], [18, -50], [8, -44], [3, -30], [4, -14], [12, -3], [24, -1], [34, -8], [39, -22]],
                    [[40, -50], [39, -30], [40, -8], [45, 0]]] },
    b: { w: 44, s: [[[6, -92], [6, 0]], [[6, -26], [12, -42], [24, -50], [36, -44], [41, -28], [37, -10], [25, -1], [13, -2], [6, -8]]] },
    c: { w: 40, s: [[[37, -41], [29, -49], [17, -50], [7, -43], [3, -27], [6, -11], [16, -1], [28, 0], [38, -8]]] },
    d: { w: 46, s: [[[37, -36], [29, -48], [17, -50], [7, -42], [3, -26], [6, -10], [16, -1], [28, -1], [36, -10]],
                    [[40, -92], [39, -10], [44, 0]]] },
    e: { w: 42, s: [[[5, -25], [22, -26], [38, -28], [36, -41], [25, -50], [12, -47], [4, -34], [4, -16], [13, -3], [26, 0], [38, -6]]] },
    f: { w: 32, s: [[[30, -84], [24, -91], [16, -89], [12, -78], [12, 0]], [[2, -50], [28, -52]]] },
    g: { w: 44, s: [[[37, -38], [29, -48], [17, -50], [7, -42], [4, -28], [9, -15], [20, -11], [31, -15], [38, -26]],
                    [[39, -50], [39, -20], [38, 8], [32, 24], [19, 30], [7, 24]]] },
    h: { w: 44, s: [[[6, -92], [6, 0]], [[6, -30], [12, -44], [24, -50], [35, -45], [39, -32], [39, -14], [40, 0]]] },
    i: { w: 14, s: [[[7, -48], [7, 0]], [[7, -74], [7.5, -72]]] },
    j: { w: 24, s: [[[17, -48], [17, -10], [16, 14], [10, 28], [1, 28]], [[17, -74], [17.5, -72]]] },
    k: { w: 40, s: [[[6, -92], [6, 0]], [[34, -50], [7, -22]], [[16, -30], [38, 0]]] },
    l: { w: 16, s: [[[7, -92], [7, -50], [7, -12], [13, 0]]] },
    m: { w: 66, s: [[[6, -50], [6, 0]], [[6, -34], [13, -47], [23, -50], [31, -42], [32, -26], [32, 0]],
                    [[32, -34], [39, -47], [49, -50], [57, -42], [59, -26], [59, 0]]] },
    n: { w: 44, s: [[[6, -50], [6, 0]], [[6, -32], [13, -46], [25, -50], [35, -44], [38, -30], [38, -12], [39, 0]]] },
    o: { w: 44, s: [[[22, -50], [10, -45], [3, -31], [4, -14], [13, -2], [26, 0], [36, -8], [40, -24], [37, -40], [27, -49], [18, -50]]] },
    p: { w: 44, s: [[[6, -50], [6, 30]], [[6, -34], [13, -46], [25, -50], [36, -44], [40, -28], [35, -11], [23, -3], [12, -5], [6, -12]]] },
    q: { w: 44, s: [[[37, -36], [29, -48], [17, -50], [7, -42], [3, -26], [7, -10], [18, -3], [30, -6], [37, -16]],
                    [[39, -50], [39, 30], [45, 24]]] },
    r: { w: 34, s: [[[6, -50], [6, 0]], [[6, -30], [12, -43], [22, -50], [32, -48]]] },
    s: { w: 38, s: [[[34, -44], [27, -50], [15, -50], [6, -44], [6, -34], [14, -28], [26, -23], [34, -15], [33, -5], [23, 0], [11, 0], [2, -6]]] },
    t: { w: 34, s: [[[15, -82], [15, -12], [19, -2], [28, 0], [33, -4]], [[2, -50], [32, -52]]] },
    u: { w: 44, s: [[[6, -50], [6, -30], [7, -12], [15, -2], [26, 0], [35, -8], [38, -22]], [[39, -50], [39, -24], [40, 0]]] },
    v: { w: 38, s: [[[2, -50], [19, 0]], [[19, 0], [36, -50]]] },
    w: { w: 58, s: [[[2, -50], [15, 0]], [[15, 0], [29, -40]], [[29, -40], [43, 0]], [[43, 0], [56, -50]]] },
    x: { w: 40, s: [[[4, -50], [37, 0]], [[36, -50], [4, 0]]] },
    y: { w: 40, s: [[[4, -50], [21, -8]], [[37, -50], [27, -20], [19, 4], [11, 24], [2, 28]]] },
    z: { w: 40, s: [[[4, -50], [37, -50]], [[37, -50], [4, 0]], [[4, 0], [38, 0]]] },
    "!": { w: 16, s: [[[8, -92], [8, -28]], [[8, -5], [8.5, -3]]] },
    ".": { w: 14, s: [[[6, -4], [6.5, -2]]] },
    ",": { w: 14, s: [[[7, -4], [4, 10]]] },
    "?": { w: 38, s: [[[4, -74], [10, -88], [22, -92], [33, -85], [35, -71], [26, -58], [19, -46], [19, -30]], [[19, -5], [19.5, -3]]] },
    "'": { w: 12, s: [[[7, -92], [5, -74]]] },
    "-": { w: 30, s: [[[4, -26], [26, -27]]] }
  };
  var SPACE = 26;

  // o: size (scale, default 1), seed, gap (between letters), wobble, tilt (radians), bounce (baseline shift)
  function text(str, o) {
    o = o || {};
    var rand = rng(o.seed || 7), size = o.size || 1, gap = o.gap == null ? 7 : o.gap;
    var x = 0, d = "";
    var wobble = o.wobble == null ? 1.6 : o.wobble;
    var tilt = o.tilt == null ? 0.12 : o.tilt;
    var bounce = o.bounce == null ? 6 : o.bounce;
    String(str).toLowerCase().split("").forEach(function (ch) {
      if (ch === " ") { x += SPACE; return; }
      var g = GLYPHS[ch] || GLYPHS["?"];
      var rot = (rand() - 0.5) * tilt, dy = (rand() - 0.5) * bounce, sc = 1 + (rand() - 0.5) * 0.08;
      var cx = g.w / 2, cy = -25, cos = Math.cos(rot), sin = Math.sin(rot);
      g.s.forEach(function (stroke) {
        var pts = stroke.map(function (p) {
          var px = (p[0] - cx) * sc, py = (p[1] - cy) * sc;
          return [x + cx + px * cos - py * sin, cy + dy + px * sin + py * cos];
        });
        pts = jitter(densify(pts, 14), rand, wobble).map(function (p) { return [p[0] * size, p[1] * size]; });
        d += smooth(pts);
      });
      x += g.w * sc + gap;
    });
    return { d: d, width: Math.max(0, x - gap) * size, ascent: 92 * size, descent: 30 * size };
  }

  // ---------- "Boiling line" animation ----------
  // A hand-drawn animation trick: redraw each line slightly differently a few times per second.
  // boilPath(function (seed) { return pathData; }, seed, 'class="x" stroke="#000"') -> <path> markup
  function boilPath(make, seed, attrs) {
    var frames = [make(seed), make(seed + 101), make(seed + 202)];
    return '<path d="' + frames[0] + '" data-boil="' + frames.join("|") + '" ' + (attrs || "") + "/>";
  }

  var timer = null, frame = 0;
  function reducedMotion() { return SiteUtil.prefersReducedMotion(); }
  function tickBoil() {
    if (document.hidden) return;
    frame = (frame + 1) % 3;
    var nodes = document.querySelectorAll("path[data-boil]");
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (!n._frames) n._frames = n.getAttribute("data-boil").split("|");
      n.setAttribute("d", n._frames[frame % n._frames.length]);
    }
  }
  function startBoiling(ms) {
    if (timer || reducedMotion()) return;
    timer = setInterval(tickBoil, ms || 170);
  }
  function stopBoiling() {
    clearInterval(timer);
    timer = null;
  }

  window.Doodle = {
    rng: rng,
    smooth: smooth,
    line: line,
    arrow: arrow,
    loop: loop,
    blob: blob,
    ellipse: ellipse,
    highlight: highlight,
    text: text,
    glyphs: GLYPHS,
    boilPath: boilPath,
    startBoiling: startBoiling,
    stopBoiling: stopBoiling,
    reducedMotion: reducedMotion
  };
})();
