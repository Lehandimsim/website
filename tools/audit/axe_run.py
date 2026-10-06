"""Run axe-core (WCAG 2.0/2.1/2.2 A+AA + best practices) on every state, at desktop and phone size.

    python axe_run.py                       # all states, 1440x900 and 390x844, file://
    python axe_run.py --only paint --sizes 1440x900
    python axe_run.py --motion reduce       # with prefers-reduced-motion: reduce emulated
Writes axe_results.json and prints a summary grouped by rule.
axe.min.js must sit next to this script (download from cdnjs; never into the project).
"""
import argparse
import collections
import json
import os
import tempfile
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import STATES, file_url  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("AUDIT_OUT") or os.path.join(tempfile.gettempdir(), "lehanzhang-audit")  # outputs stay out of the project
os.makedirs(OUT, exist_ok=True)
AXE = open(os.path.join(HERE, "axe.min.js"), encoding="utf-8").read()

RUN = r"""
axe.run(document, {
  runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']},
  resultTypes: ['violations','incomplete'],
  iframes: false
}).then(r => ({
  violations: r.violations.map(v => ({id: v.id, impact: v.impact, tags: v.tags, help: v.help,
     nodes: v.nodes.map(n => ({target: n.target.join(' '), html: n.html.slice(0, 220), summary: (n.failureSummary||'').slice(0, 400)}))})),
  incomplete: r.incomplete.filter(v => v.id === 'color-contrast' || v.id === 'aria-hidden-focus').map(v => ({id: v.id,
     nodes: v.nodes.map(n => ({target: n.target.join(' '), html: n.html.slice(0, 160),
       msg: ((n.any[0]||{}).message||'').slice(0, 200)}))}))
}))
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only")
    ap.add_argument("--sizes", default="1440x900,390x844")
    ap.add_argument("--motion", default="no-preference")
    ap.add_argument("--out", default="axe_results.json")
    a = ap.parse_args()
    sizes = [tuple(int(n) for n in s.split("x")) for s in a.sizes.split(",")]
    states = [s for s in STATES if not a.only or a.only in s]
    results = []
    with Browser() as b:
        p = b.page()
        for (w, h) in sizes:
            p.viewport(w, h, motion=a.motion)
            for st in states:
                rec = {"state": st, "size": "%dx%d" % (w, h)}
                try:
                    p.goto(file_url(st), settle=2.0)
                    p.eval(AXE)
                    rec.update(p.eval(RUN, await_promise=True, timeout=120))
                except Exception as e:
                    rec["harness_error"] = repr(e)
                results.append(rec)
                print(rec["size"], st, [v["id"] for v in rec.get("violations", [])], rec.get("harness_error", ""), flush=True)
    with open(os.path.join(OUT, a.out), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=1)

    # Summary: rule -> states and example nodes
    by_rule = collections.OrderedDict()
    for r in results:
        for v in r.get("violations", []):
            e = by_rule.setdefault(v["id"], {"impact": v["impact"], "help": v["help"], "where": [], "nodes": collections.OrderedDict()})
            e["where"].append("%s @%s (%d)" % (r["state"], r["size"], len(v["nodes"])))
            for n in v["nodes"]:
                e["nodes"].setdefault(n["target"], n)
    print("\n==== SUMMARY BY RULE ====")
    for rid, e in by_rule.items():
        print("\n## %s [%s] %s" % (rid, e["impact"], e["help"]))
        print("   in: " + "; ".join(e["where"][:40]))
        for t, n in list(e["nodes"].items())[:12]:
            print("   - %s\n       %s\n       %s" % (t, n["html"][:200], n["summary"].replace("\n", " | ")[:300]))


if __name__ == "__main__":
    main()
