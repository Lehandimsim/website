"""Things added inside the page during a capture only (the site's files are never changed).

PAINT_NOTE: a red-marker note in Paint's own handwriting (window.Doodle), written on stroke by stroke,
with an optional arrow; "(" and ")" are added to the alphabet for this session.
WRITE_ON: reveal an element line by line, left to right, as if it were being written.
"""

PAINT_NOTE = r"""
([id, text, x, y, o]) => {
  o = o || {};
  const D = window.Doodle;
  if (!D.glyphs["("]) {
    D.glyphs["("] = { w: 26, s: [[[20, -96], [10, -74], [6, -44], [9, -12], [20, 16]]] };
    D.glyphs[")"] = { w: 26, s: [[[6, -96], [16, -74], [20, -44], [17, -12], [6, 16]]] };
  }
  const size = o.size || 0.4, colour = o.colour || "#e00000", sw = o.stroke || 3.6;
  const lines = text.split("\n"), lh = (o.lineHeight || 150) * size;
  const attrs = (dy) => `fill="none" stroke="${colour}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" transform="translate(${sw} ${92 * size + sw + dy})"`;
  let width = 0, paths = "";
  lines.forEach((line, i) => {
    width = Math.max(width, D.text(line, { size, seed: 3 + i * 5 }).width);
    paths += D.boilPath(k => D.text(line, { size, seed: k + i * 5, wobble: 1.6 }).d, 3 + i * 5, attrs(i * lh));
  });
  let arrow = "";
  if (o.arrow) arrow = D.boilPath(k => D.arrow(o.arrow, { seed: k + 40, head: 15, wobble: 2 }), 41,
      `fill="none" stroke="${colour}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`);
  const h = lines.length * lh + 40 * size + 2 * sw;
  const el = document.createElement("div");
  el.id = id;
  el.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:${width + 2 * sw}px;height:${h}px;z-index:99999;pointer-events:none;overflow:visible`;
  el.innerHTML = `<svg width="${width + 2 * sw}" height="${h}" style="overflow:visible;display:block"><g class="txt">${paths}</g>${arrow}</svg>`;
  document.body.appendChild(el);
  // written on: the text left to right, line by line, then the arrow
  const dur = o.duration || 900, n = lines.length;
  const t = el.querySelector(".txt");
  const frames = [], poly = (a, b, x) => `polygon(0 0, 100% 0, 100% ${a}%, ${x}% ${a}%, ${x}% ${b}%, 0% ${b}%)`;
  lines.forEach((_, i) => {
    const a = (i / n) * 100, b = ((i + 1) / n) * 100;
    frames.push({ offset: i / n, clipPath: poly(a, b, 0) });
    frames.push({ offset: (i + 1) / n, clipPath: poly(a, b, 100) });
  });
  t.animate(frames, { duration: dur, easing: "linear", fill: "both" });
  const arr = el.querySelectorAll("svg > path");
  arr.forEach(p => p.animate([{ opacity: 0 }, { opacity: 0, offset: 0.99 }, { opacity: 1 }], { duration: dur + 150, fill: "both" }));
  return { width, height: h };
}
"""

REMOVE = "id => { const e = document.getElementById(id); if (e) e.remove(); }"

# A stand-in for a textarea's caret. The browser blinks the real one on the real clock, which would
# flicker in a frame-by-frame capture; this one is measured with a mirror element (the usual
# textarea-caret technique) and blinks on the page's (virtual) clock.
FAKE_CARET = r"""
sel => {
  const ta = document.querySelector(sel);
  ta.style.caretColor = "transparent";
  const caret = document.createElement("div");
  caret.style.cssText = "position:fixed;width:2px;background:#111;z-index:99998;pointer-events:none;display:none";
  document.body.appendChild(caret);
  const mirror = document.createElement("div");
  document.body.appendChild(mirror);
  const props = ["boxSizing", "width", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "fontStyle", "fontVariant", "fontWeight", "fontStretch",
    "fontSize", "lineHeight", "fontFamily", "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing",
    "tabSize", "whiteSpace", "wordWrap", "wordBreak", "overflowWrap", "fontFeatureSettings", "fontKerning"];
  let typed = 0;
  ["input", "keydown", "mousedown", "select"].forEach(e => ta.addEventListener(e, () => { typed = performance.now(); }));
  function place() {
    if (document.activeElement !== ta || ta.selectionStart !== ta.selectionEnd) {
      caret.style.display = "none";
    } else {
      const cs = getComputedStyle(ta), s = mirror.style;
      props.forEach(p => { s[p] = cs[p]; });
      s.position = "absolute"; s.visibility = "hidden"; s.top = "0"; s.left = "-99999px"; s.height = "auto"; s.overflow = "hidden";
      mirror.textContent = ta.value.substring(0, ta.selectionStart);
      const span = document.createElement("span");
      span.textContent = ta.value.substring(ta.selectionStart) || ".";
      mirror.appendChild(span);
      const r = ta.getBoundingClientRect(), lh = parseFloat(cs.lineHeight);
      caret.style.left = (r.left + span.offsetLeft - ta.scrollLeft) + "px";
      caret.style.top = (r.top + span.offsetTop - ta.scrollTop + 3) + "px";
      caret.style.height = (lh - 6) + "px";
      caret.style.display = ((performance.now() - typed) % 1060) < 530 ? "block" : "none";
    }
    requestAnimationFrame(place);
  }
  requestAnimationFrame(place);
}
"""

# Mark the nearest scrolling ancestor of an element, so Recorder.scroll() can scroll it.
MARK_SCROLLER = r"""
sel => {
  let e = document.querySelector(sel);
  while (e && e !== document.body) {
    const o = getComputedStyle(e).overflowY;
    if ((o === "auto" || o === "scroll") && e.scrollHeight > e.clientHeight) { e.setAttribute("data-promo-scroll", ""); return true; }
    e = e.parentElement;
  }
  return false;
}
"""

# Where a place in a textarea's text is on screen: ([sel, find, offset, nth]) -> [x, y] (middle of the line)
TEXT_XY = r"""
([sel, find, offset, nth]) => {
  const ta = document.querySelector(sel);
  let i = -1;
  for (let k = 0; k <= (nth || 0); k++) i = ta.value.indexOf(find, i + 1);
  if (i < 0) throw new Error("not found: " + find);
  const cs = getComputedStyle(ta), m = document.createElement("div");
  ["boxSizing", "width", "borderTopWidth", "borderLeftWidth", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
   "fontSize", "lineHeight", "fontFamily", "fontWeight", "letterSpacing", "tabSize", "whiteSpace", "wordWrap", "wordBreak", "overflowWrap"]
    .forEach(p => { m.style[p] = cs[p]; });
  m.style.position = "absolute"; m.style.visibility = "hidden"; m.style.left = "-99999px"; m.style.top = "0";
  m.textContent = ta.value.substring(0, i + offset);
  const span = document.createElement("span");
  span.textContent = ".";
  m.appendChild(span);
  document.body.appendChild(m);
  const r = ta.getBoundingClientRect();
  const out = [r.left + span.offsetLeft, r.top + span.offsetTop + parseFloat(cs.lineHeight) / 2];
  m.remove();
  return out;
}
"""

# Put the caret at a place in a textarea's text: (selector, text to find, offset within it, select length)
SET_CARET = r"""
([sel, find, offset, len, nth]) => {
  const ta = document.querySelector(sel);
  let i = -1;
  for (let k = 0; k <= (nth || 0); k++) i = ta.value.indexOf(find, i + 1);
  if (i < 0) throw new Error("not found: " + find);
  ta.focus();
  ta.setSelectionRange(i + offset, i + offset + (len || 0));
  ta.dispatchEvent(new Event("select"));
  return i;
}
"""

FADE_OUT = """([id, ms]) => { const e = document.getElementById(id); if (e) e.animate([{opacity: 1}, {opacity: 0}], {duration: ms, fill: 'forwards'}); }"""

# lines: [[top%, bottom%, ms], ...] -> each line wiped left to right in turn
WRITE_ON = r"""
([sel, lines]) => {
  const el = document.querySelector(sel);
  const total = lines.reduce((s, l) => s + l[2], 0);
  const poly = (a, b, x) => `polygon(0 0, 100% 0, 100% ${a}%, ${x}% ${a}%, ${x}% ${b}%, 0% ${b}%)`;
  const frames = [];
  let t = 0;
  lines.forEach(([a, b, ms]) => {
    frames.push({ offset: t / total, clipPath: poly(a, b, 0) });
    t += ms;
    frames.push({ offset: t / total, clipPath: poly(a, b, 100) });
  });
  el.animate(frames, { duration: total, easing: "linear", fill: "both" });
}
"""