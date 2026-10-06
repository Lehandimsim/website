"""Load every state at every size; record JS errors, failed loads, horizontal overflow and small tap targets.

    python sweep.py file            # from file://
    python sweep.py http            # from http://127.0.0.1:8765 (start python -m http.server 8765 in site/ first)
    python sweep.py file --sizes 390x844 --only paint --shots
Writes sweep_<origin>.json (and screenshots in shots/ with --shots).
"""
import argparse
import json
import os
import tempfile
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import STATES, SIZES, file_url, http_url, slug  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("AUDIT_OUT") or os.path.join(tempfile.gettempdir(), "lehanzhang-audit")  # outputs stay out of the project
os.makedirs(OUT, exist_ok=True)
PROBE = r"""
(() => {
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=link],[role=separator][tabindex],[tabindex]:not([tabindex="-1"])';
  const small = [];
  const seen = new Set();
  for (const el of document.querySelectorAll(sel)) {
    if (el.disabled || seen.has(el)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden') continue;
    const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    if (r.right < 0 || r.bottom < 0 || r.left > innerWidth || r.top > innerHeight) continue;
    const top = document.elementFromPoint(cx, cy);
    if (!top || !(el === top || el.contains(top))) continue;
    if (Math.min(r.width, r.height) < 44) {
      const inlineText = cs.display === 'inline' && el.closest('p,li,dd,td');
      small.push({tag: el.tagName.toLowerCase(), id: el.id || '', cls: typeof el.className === 'string' ? el.className.slice(0, 40) : '',
        label: (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim().replace(/\s+/g, ' ').slice(0, 40),
        w: Math.round(r.width), h: Math.round(r.height), inline: !!inlineText});
    }
  }
  const de = document.documentElement;
  const wins = [...document.querySelectorAll('.xp-window:not([hidden]):not(.is-minimized)')].map(w => {
    const r = w.getBoundingClientRect(); return {id: w.id, l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom)};
  });
  return {title: document.title, sw: de.scrollWidth, iw: innerWidth, sh: de.scrollHeight, ih: innerHeight, small, wins,
          hash: location.hash, active: document.activeElement && (document.activeElement.id || document.activeElement.tagName)};
})()
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("origin", choices=["file", "http"])
    ap.add_argument("--sizes")
    ap.add_argument("--only")
    ap.add_argument("--shots", action="store_true")
    ap.add_argument("--settle", type=float, default=1.6)
    a = ap.parse_args()
    sizes = [tuple(int(n) for n in s.split("x")) for s in a.sizes.split(",")] if a.sizes else SIZES
    states = [s for s in STATES if not a.only or a.only in s]
    out = []
    shots = os.path.join(OUT, "shots")
    os.makedirs(shots, exist_ok=True)
    with Browser() as b:
        p = b.page()
        for (w, h) in sizes:
            p.viewport(w, h)
            for st in states:
                url = file_url(st) if a.origin == "file" else http_url(st)
                rec = {"state": st, "size": "%dx%d" % (w, h), "origin": a.origin}
                try:
                    p.goto(url, settle=a.settle)
                    rec.update(p.eval(PROBE))
                    if a.shots:
                        p.screenshot(os.path.join(shots, "%s_%dx%d.png" % (slug(st), w, h)))
                except Exception as e:  # keep going
                    rec["harness_error"] = repr(e)
                rec["errors"] = list(p.errors)
                out.append(rec)
                flag = "ERR" if rec["errors"] or rec.get("harness_error") else "ok "
                print(flag, rec["size"], st, rec["errors"][:2] if rec["errors"] else "", rec.get("harness_error", ""), flush=True)
    with open(os.path.join(OUT, "sweep_%s%s.json" % (a.origin, "_" + a.only.replace("/", "-") if a.only else "")), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=1)


if __name__ == "__main__":
    main()
