"""Dump the accessibility tree (what a screen reader gets) for a page: role, name, key states.
    python axtree.py index.html classic/research.html [--size 1440x900]
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import file_url  # noqa: E402

SKIP = {"none", "generic", "InlineTextBox", "StaticText", "LineBreak", "presentation", "ignored"}

ap = argparse.ArgumentParser()
ap.add_argument("states", nargs="+")
ap.add_argument("--size", default="1440x900")
ap.add_argument("--all", action="store_true", help="include StaticText")
a = ap.parse_args()
w, h = (int(n) for n in a.size.split("x"))
with Browser() as b:
    p = b.page()
    p.viewport(w, h)
    for st in a.states:
        p.goto(file_url(st), settle=1.8)
        p.send("Accessibility.enable")
        nodes = p.send("Accessibility.getFullAXTree")["nodes"]
        by = {n["nodeId"]: n for n in nodes}
        print("\n===== %s" % st)

        def walk(nid, depth):
            n = by.get(nid)
            if not n:
                return
            role = n.get("role", {}).get("value", "")
            name = (n.get("name", {}) or {}).get("value", "")
            ignored = n.get("ignored")
            show = not ignored and role not in SKIP and not (role == "StaticText" and not a.all)
            if a.all and role == "StaticText" and not ignored:
                show = True
            props = {pp["name"]: pp["value"].get("value") for pp in n.get("properties", []) if pp["name"] in ("level", "expanded", "pressed", "selected", "checked", "modal", "live", "url", "focusable", "hasPopup")}
            props.pop("focusable", None)
            if show:
                extra = " ".join("%s=%s" % (k, (str(v)[:50])) for k, v in props.items() if k != "url")
                print("%s%s %r %s" % ("  " * depth, role, (name or "")[:90], extra))
            for c in n.get("childIds", []):
                walk(c, depth + (1 if show else 0))

        walk(nodes[0]["nodeId"], 0)
