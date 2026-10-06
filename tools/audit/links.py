"""Collect every link/resource from every rendered state (plus URLs typed in the in-scope sources),
check local files and #fragments exist, and check external URLs respond (sequential, gentle).

    python links.py            # writes links_report.json and prints problems
    python links.py --no-external
"""
import argparse
import collections
import json
import os
import tempfile
import re
import sys
import time
from pathlib import Path
from urllib.parse import urlparse, unquote

import requests

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import STATES, SITE, file_url  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("AUDIT_OUT") or os.path.join(tempfile.gettempdir(), "lehanzhang-audit")  # outputs stay out of the project
os.makedirs(OUT, exist_ok=True)
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0")

COLLECT = r"""
(() => {
  const out = [];
  document.querySelectorAll('a[href], area[href]').forEach(a => out.push({kind: 'a', raw: a.getAttribute('href'), abs: (typeof a.href === 'string' ? a.href : new URL(a.getAttribute('href'), location.href).href),
     text: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g,' ').slice(0, 60), target: a.target || ''}));
  document.querySelectorAll('[src]').forEach(e => out.push({kind: e.tagName.toLowerCase(), raw: e.getAttribute('src'), abs: (typeof e.src === 'string' ? e.src : new URL(e.getAttribute('src'), location.href).href), text: e.alt || ''}));
  document.querySelectorAll('link[href]').forEach(e => out.push({kind: 'link', raw: e.getAttribute('href'), abs: e.href, text: e.rel}));
  return {url: location.href.split('#')[0], ids: [...document.querySelectorAll('[id]')].map(e => e.id), links: out};
})()
"""

# Hash routes handled by each app's router (validated separately by the sweep: each loads without errors).
ROUTED = {
    "fun/paint/index.html": re.compile(r"^(start|home|research|talks|experience|cv|art|paint|about)(/.*)?$"),
    "fun/powerpoint/index.html": re.compile(r"^((slide|show)-\d+|show|end|tab-\w+|sorter|outline|menu|about|motion|home|research|talks|experience|cv|art)(\+.*)?$"),
    "fun/kitchen/index.html": re.compile(r"^(kitchen|welcome|about|home|research|talks|experience|cv|art|recipe-book|fried-rice|finale|cook)(/.*)?$"),
    "fun/overleaf/index.html": re.compile(r"^(main|home|research|talks|experience|cv|art|paper-\d+|teaching|awards|end|demo-edit|demo-error|history|[a-z0-9-]+)$"),
}

SRC_GLOBS = ["content.js", "config.js", "index.html", "pages.html", "classic/*.html", "classic/*.js", "shared/**/*.js",
             "fun/paint/*.js", "fun/powerpoint/*.js", "fun/overleaf/*.js", "fun/*/index.html"]


def site_rel(path):
    try:
        return Path(path).resolve().relative_to(SITE.resolve()).as_posix()
    except ValueError:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-external", action="store_true")
    a = ap.parse_args()

    pages = {}
    used = collections.defaultdict(set)     # url -> states
    texts = collections.defaultdict(set)
    with Browser() as b:
        p = b.page()
        p.viewport(1440, 900)
        for st in STATES:
            p.goto(file_url(st), settle=1.5)
            r = p.eval(COLLECT)
            rel = site_rel(unquote(urlparse(r["url"]).path).lstrip("/"))
            pages.setdefault(rel, set()).update(r["ids"])
            for l in r["links"]:
                used[l["abs"]].add(st)
                if l.get("text"):
                    texts[l["abs"]].add(l["text"])
        # ids of every local page that a fragment may point at
        local_pages = {u.split("#")[0] for u in used if u.startswith("file:")}
        for u in local_pages:
            rel = site_rel(unquote(urlparse(u).path).lstrip("/"))
            if rel and rel.endswith(".html") and rel not in pages and (SITE / rel).exists():
                p.goto(u, settle=1.2)
                pages[rel] = set(p.eval(COLLECT)["ids"])

    # URLs typed in the sources (some only appear after an interaction).
    src_urls = collections.defaultdict(set)
    for g in SRC_GLOBS:
        for f in SITE.glob(g):
            if "kitchen" in f.parts or "minesweeper" in f.parts:
                continue
            for m in re.finditer(r"https?://[^\s\"'<>)\\]+", f.read_text(encoding="utf-8", errors="replace")):
                u = m.group(0).rstrip(".,;")
                if "w3.org/2000/svg" in u or "127.0.0.1" in u or "example.com" in u:
                    continue
                src_urls[u].add(f.relative_to(SITE).as_posix())

    problems = []
    internal_ok = 0
    for u, sts in sorted(used.items()):
        pr = urlparse(u)
        if pr.scheme != "file":
            continue
        path = Path(unquote(pr.path).lstrip("/"))
        rel = site_rel(path)
        if not path.exists():
            problems.append({"type": "missing-file", "url": u, "from": sorted(sts)[:5]})
            continue
        frag = unquote(pr.fragment)
        if frag and rel:
            if rel in ROUTED and ROUTED[rel].match(frag):
                pass
            elif rel in pages and frag not in pages[rel]:
                problems.append({"type": "missing-anchor", "url": u, "from": sorted(sts)[:5]})
                continue
        internal_ok += 1

    ext = sorted({u for u in used if urlparse(u).scheme in ("http", "https")} |
                 {u for u in src_urls})
    ext_results = []
    if not a.no_external:
        s = requests.Session()
        s.headers.update({"User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/pdf,*/*;q=0.8",
                          "Accept-Language": "en-GB,en;q=0.9"})
        for u in ext:
            if u.startswith("https://fonts.") or "cdnjs" in u:
                continue
            rec = {"url": u, "where": sorted(used.get(u, set()))[:3] + sorted(src_urls.get(u, set()))[:3], "text": sorted(texts.get(u, set()))[:2]}
            try:
                r = s.head(u, allow_redirects=True, timeout=20)
                rec["head"] = r.status_code
                if r.status_code >= 400 or r.status_code in (403, 405):
                    r = s.get(u, allow_redirects=True, timeout=25, stream=True)
                    rec["get"] = r.status_code
                    r.close()
                rec["status"] = r.status_code
                rec["final"] = r.url
                rec["redirects"] = [h.status_code for h in r.history]
            except Exception as e:
                rec["status"] = None
                rec["error"] = repr(e)[:200]
            ext_results.append(rec)
            print(rec.get("status"), u, "->", rec.get("final", "") if rec.get("final") != u else "", rec.get("error", ""), flush=True)
            time.sleep(0.6)

    report = {"internal_ok": internal_ok, "problems": problems, "external": ext_results}
    with open(os.path.join(OUT, "links_report.json"), "w", encoding="utf-8") as f:
        json.dump(report, f, indent=1)
    print("\ninternal links/resources OK:", internal_ok)
    print("internal problems:")
    for pr in problems:
        print("  ", pr)


if __name__ == "__main__":
    main()
