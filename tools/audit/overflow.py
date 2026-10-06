"""Reflow check: horizontal overflow at narrow widths (incl. 320px = 1280px at 400% zoom) and which
elements stick out past the viewport.
    python overflow.py index.html classic/index.html ... [--sizes 320x640,768x1024]
"""
import argparse
import os
import tempfile
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import file_url, slug  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("AUDIT_OUT") or os.path.join(tempfile.gettempdir(), "lehanzhang-audit")  # outputs stay out of the project
os.makedirs(OUT, exist_ok=True)
PROBE = r"""
(() => {
  const iw = document.documentElement.clientWidth, out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width && r.right > iw + 1) {
      const cs = getComputedStyle(el);
      if (cs.position === 'fixed' && cs.visibility === 'hidden') continue;
      out.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '') + ' right=' + Math.round(r.right) + ' w=' + Math.round(r.width));
    }
  }
  return {sw: document.documentElement.scrollWidth, iw, n: out.length, sample: out.slice(0, 12)};
})()
"""

ap = argparse.ArgumentParser()
ap.add_argument("states", nargs="+")
ap.add_argument("--sizes", default="320x640,360x740,390x844,768x1024,1024x768")
ap.add_argument("--shots", action="store_true")
a = ap.parse_args()
with Browser() as b:
    p = b.page()
    for s in a.sizes.split(","):
        w, h = (int(n) for n in s.split("x"))
        p.viewport(w, h)
        for st in a.states:
            p.goto(file_url(st), settle=1.5)
            r = p.eval(PROBE)
            print(s, st, "scrollWidth=%d viewport=%d" % (r["sw"], r["iw"]), "OVERFLOW" if r["sw"] > r["iw"] + 1 else "ok", r["sample"][:6] if r["sw"] > r["iw"] + 1 else "")
            if a.shots:
                p.screenshot(os.path.join(OUT, "shots", "ov_%s_%s.png" % (slug(st), s)))
