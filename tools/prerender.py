"""Save a static copy of the text that JavaScript draws into the start page and the classic pages.

Why: the start page and the classic site are drawn by JavaScript from site/content.js. Google runs
JavaScript, but Bing (and so DuckDuckGo and ChatGPT search) does so unreliably, and the crawlers of AI
assistants not at all: without this copy they see empty pages. With it, the HTML files already
contain the text. In a browser the scripts still redraw everything from content.js, so content.js stays
the one place to edit.

Run it after every change to content.js (or to classic.js, or to config.js's list of fun versions):
    python tools/prerender.py            # update the files
    python tools/prerender.py --check    # change nothing; exit 1 if a file is out of date

How: headless Edge opens each page from disk, lets the scripts run, and copies what they drew into
the page's source, between <!-- prerendered --> and <!-- /prerendered --> inside each container
(and the start page photo's src/alt). Uses the browser driver in tools/audit/cdp.py.
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
sys.path.insert(0, str(ROOT / "tools" / "audit"))
from cdp import Browser  # noqa: E402

CLASSIC = ["site-header", "main", "site-footer"]
PAGES = {  # file: (containers whose inner HTML is copied, elements whose src/alt are copied)
    "index.html": (["tagline", "bio", "classic-icon", "fun-grid", "footer"], ["avatar"]),
    "classic/index.html": (CLASSIC, []),
    "classic/research.html": (CLASSIC, []),
    "classic/talks.html": (CLASSIC, []),
    "classic/experience.html": (CLASSIC, []),
    "classic/cv.html": (CLASSIC, []),
    "classic/art.html": (CLASSIC, []),
}
START, END = "<!-- prerendered -->", "<!-- /prerendered -->"


def render(page, rel):
    page.goto((SITE / rel).as_uri(), settle=1.0)
    if page.errors:
        sys.exit(f"{rel}: errors while rendering, nothing written:\n  " + "\n  ".join(page.errors))
    inner, attrs = PAGES[rel]
    got = {}
    for el_id in inner:
        html = page.eval(f"(document.getElementById({el_id!r}) || {{}}).innerHTML")
        if not html:
            sys.exit(f"{rel}: #{el_id} is empty or missing after rendering; nothing written.")
        got[el_id] = html.strip()
    for el_id in attrs:
        got[el_id] = page.eval(f"(e => e && {{src: e.getAttribute('src'), alt: e.getAttribute('alt')}})"
                               f"(document.getElementById({el_id!r}))")
        if not got[el_id] or not got[el_id]["src"]:
            sys.exit(f"{rel}: #{el_id} has no src after rendering; nothing written.")
    for el_id, value in got.items():
        text = value if isinstance(value, str) else repr(value)
        if "file:" in text or START in text:
            sys.exit(f"{rel}: #{el_id} contains a local file address or an old copy; nothing written.")
    return got


def apply(source, rel, got):
    inner, attrs = PAGES[rel]
    for el_id in inner:
        # <tag ... id="x" ...>  [old copy]  </tag>
        pat = re.compile(r'(<(\w+)\b[^>]*\bid="' + re.escape(el_id) + r'"[^>]*>)\s*(?:' + re.escape(START) +
                         r'.*?' + re.escape(END) + r')?\s*(</\2>)', re.S)
        new, n = pat.subn(lambda m: m.group(1) + START + got[el_id] + END + m.group(3), source, count=1)
        if n != 1:
            sys.exit(f"{rel}: could not find an empty or prerendered #{el_id}; nothing written.")
        source = new
    for el_id in attrs:
        pat = re.compile(r'<img\b[^>]*\bid="' + re.escape(el_id) + r'"[^>]*>')
        m = pat.search(source)
        if not m:
            sys.exit(f"{rel}: could not find <img id=\"{el_id}\">; nothing written.")
        tag = m.group(0)
        for name in ("src", "alt"):
            value = got[el_id][name].replace("&", "&amp;").replace('"', "&quot;")
            tag = re.sub(r'\b' + name + r'="[^"]*"', lambda _: f'{name}="{value}"', tag, count=1)
        source = source[:m.start()] + tag + source[m.end():]
    return source


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="change nothing; exit 1 if a file is out of date")
    a = ap.parse_args()
    stale = []
    with Browser() as b:
        page = b.page()
        page.viewport(1440, 900)
        for rel in PAGES:
            path = SITE / rel
            source = path.read_text(encoding="utf-8")
            updated = apply(source, rel, render(page, rel))
            if updated != source:
                stale.append(rel)
                if not a.check:
                    path.write_text(updated, encoding="utf-8", newline="\n")
        page.close()
    if a.check:
        print("out of date: " + ", ".join(stale) if stale else "all prerendered copies are up to date")
        sys.exit(1 if stale else 0)
    print("updated: " + ", ".join(stale) if stale else "nothing to update")


if __name__ == "__main__":
    main()
