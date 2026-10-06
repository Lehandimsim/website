"""prefers-reduced-motion check: load each state with 'no-preference' and with 'reduce' (CDP emulation),
then list running CSS/WAAPI animations and JS 'boiling' doodles. Also hovers/focuses the elements that
are meant to pulse or wiggle.

    python motion.py
"""
import json
import os
import tempfile
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import file_url  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("AUDIT_OUT") or os.path.join(tempfile.gettempdir(), "lehanzhang-audit")  # outputs stay out of the project
os.makedirs(OUT, exist_ok=True)
STATES = ["index.html", "pages.html", "classic/research.html", "fun/paint/index.html#start", "fun/paint/index.html#home",
          "fun/paint/index.html#research", "fun/powerpoint/index.html", "fun/powerpoint/index.html#show",
          "fun/overleaf/index.html", "fun/overleaf/index.html#demo-edit"]

PROBE = r"""
(async () => {
  // JS boiling: does a data-boil path change its d over 600 ms?
  const boil = document.querySelector('path[data-boil]');
  const d0 = boil && boil.getAttribute('d');
  await new Promise(r => setTimeout(r, 700));
  const boiling = !!(boil && boil.getAttribute('d') !== d0);
  const anims = document.getAnimations().filter(a => a.playState === 'running').map(a => {
    const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : {};
    const el = a.effect && a.effect.target;
    return {name: a.animationName || a.transitionProperty || a.constructor.name, iterations: t.iterations === Infinity ? 'inf' : t.iterations,
            duration: t.duration, target: el ? (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : '')) : ''};
  });
  return {boiling, anims, motionOn: document.documentElement.classList.contains('motion-on'),
          prm: matchMedia('(prefers-reduced-motion: reduce)').matches};
})()
"""


def main():
    res = []
    with Browser() as b:
        p = b.page()
        for motion in ("no-preference", "reduce"):
            p.viewport(1440, 900, motion=motion)
            for st in STATES:
                p.goto(file_url(st), settle=2.5)
                r = p.eval(PROBE, await_promise=True)
                r.update({"state": st, "motion": motion})
                res.append(r)
                inf = [a for a in r["anims"] if a["iterations"] == "inf"]
                print("%-14s %-40s boiling=%s running=%d infinite=%s" % (motion, st, r["boiling"], len(r["anims"]),
                      sorted({a["name"] + "@" + a["target"] for a in inf})))
    with open(os.path.join(OUT, "motion.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, indent=1)


if __name__ == "__main__":
    main()
