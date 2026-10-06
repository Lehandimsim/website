"""Keyboard-only check: press Tab through a page; for each stop record what got focus, whether it is
on screen, whether it is hidden from assistive tech, and whether focus is visible (pixel diff of the
element focused vs blurred).

    python tabwalk.py index.html classic/research.html "fun/paint/index.html#research" --max 60 [--size 390x844]
"""
import argparse
import io
import json
import os
import tempfile
import sys

from PIL import Image, ImageChops

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import file_url  # noqa: E402
import base64  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("AUDIT_OUT") or os.path.join(tempfile.gettempdir(), "lehanzhang-audit")  # outputs stay out of the project
os.makedirs(OUT, exist_ok=True)
DESCRIBE = r"""
(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const r = el.getBoundingClientRect();
  let path = el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : '');
  const hiddenAT = !!el.closest('[aria-hidden="true"]') || !!el.closest('[inert]');
  const label = (el.getAttribute('aria-label') || el.innerText || el.value || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 50);
  let fv = false; try { fv = el.matches(':focus-visible'); } catch (e) {}
  // inside a visually hidden ancestor (opacity 0 or clipped)?
  let invisible = false;
  for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.opacity === '0' || cs.visibility === 'hidden') { invisible = true; break; }
  }
  return {path, label, role: el.getAttribute('role') || '', x: r.left, y: r.top, w: r.width, h: r.height,
          onscreen: r.width > 0 && r.height > 0 && r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight,
          hiddenAT, invisible, fv};
})()
"""


def clip_shot(p, d, pad=6):
    sx, sy = p.eval("[scrollX, scrollY]")       # clip coordinates are document-relative
    x = max(0, d["x"] + sx - pad)
    y = max(0, d["y"] + sy - pad)
    w = max(1, d["w"] + 2 * pad)
    h = max(1, d["h"] + 2 * pad)
    r = p.send("Page.captureScreenshot", {"format": "png", "clip": {"x": x, "y": y, "width": w, "height": h, "scale": 1}})
    return Image.open(io.BytesIO(base64.b64decode(r["data"]))).convert("RGB")


def walk(p, url, maxn, shift=False):
    p.goto(url, settle=2.0)
    p.eval("window.focus()")
    stops = []
    seen = []
    for i in range(maxn):
        p.key("Tab", modifiers=8 if shift else 0)
        p.pump(0.12)
        d = p.eval(DESCRIBE)
        if not d:
            stops.append({"i": i, "path": "(body / left the page)"})
            continue
        if d["onscreen"] and d["w"] * d["h"] < 600 * 600:
            try:
                a = clip_shot(p, d)
                p.eval("window.__f = document.activeElement; window.__f.blur();")
                p.pump(0.08)
                b = clip_shot(p, d)
                p.eval("window.__f && window.__f.focus({preventScroll:true})")
                p.pump(0.05)
                diff = ImageChops.difference(a, b).getbbox() if a.size == b.size else (0, 0, 1, 1)
                d["visible_focus"] = diff is not None
            except Exception as e:
                d["visible_focus"] = "err " + repr(e)[:60]
        else:
            d["visible_focus"] = None
        d["i"] = i
        key = d["path"] + "|" + d["label"]
        d["repeat"] = key in seen
        seen.append(key)
        stops.append(d)
    return stops


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("states", nargs="+")
    ap.add_argument("--max", type=int, default=60)
    ap.add_argument("--size", default="1440x900")
    ap.add_argument("--out", default="tabwalk.json")
    a = ap.parse_args()
    w, h = (int(n) for n in a.size.split("x"))
    res = {}
    with Browser() as b:
        p = b.page()
        p.viewport(w, h, motion="reduce")
        for st in a.states:
            stops = walk(p, file_url(st), a.max)
            res[st] = stops
            print("\n=== %s @%s" % (st, a.size))
            for d in stops:
                if "label" not in d:
                    print("%3d %s" % (d["i"], d["path"]))
                    continue
                flags = []
                if not d["onscreen"]:
                    flags.append("OFFSCREEN")
                if d["hiddenAT"]:
                    flags.append("ARIA-HIDDEN/INERT")
                if d["invisible"]:
                    flags.append("INVISIBLE")
                if d.get("visible_focus") is False:
                    flags.append("NO-VISIBLE-FOCUS")
                if d["repeat"]:
                    flags.append("repeat")
                print("%3d %-55s %-40s %s" % (d["i"], d["path"][:55], d["label"][:40], " ".join(flags)))
    with open(os.path.join(OUT, a.out), "w", encoding="utf-8") as f:
        json.dump(res, f, indent=1)


if __name__ == "__main__":
    main()
