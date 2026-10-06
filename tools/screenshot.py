"""Render a page of the site with headless Microsoft Edge: save a screenshot, report console errors.

Usage (from the project root):
    python tools/screenshot.py site/index.html out.png
    python tools/screenshot.py "site/fun/paint/index.html#research" out.png --size 1366x768 --wait 3000
    python tools/screenshot.py site/index.html phone.png --size 390x844

The page is loaded from file:// exactly as a visitor double-clicking it would. --wait gives scripts and
animations time to settle (virtual time, in ms). Exit code 1 if the page logged a JavaScript error.

The page always runs inside an iframe of exactly --size. Headless Edge lays out a bare page at the
window size minus its hidden browser chrome (1416x774 for a 1440x900 window) and only resizes it just
before the capture, so anything a page sizes once at load would come out wrong. Edge also refuses
windows narrower than about 500px; the iframe sidesteps that too. (--frame is the old name of --size.)
"""
import argparse
import html
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image

EDGE_CANDIDATES = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
MIN_WINDOW_WIDTH = 520


def to_url(target: str) -> str:
    if re.match(r"^[a-z]+://", target):
        return target
    path, _, frag = target.partition("#")
    path, _, query = path.partition("?")
    url = Path(path).resolve().as_uri()
    return url + ("?" + query if query else "") + ("#" + frag if frag else "")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("target", help="file path (optionally with ?query/#hash) or URL")
    ap.add_argument("out", help="PNG to write")
    ap.add_argument("--size", default="1440x900", help="viewport size WxH (default 1440x900)")
    ap.add_argument("--wait", type=int, default=1500, help="virtual time budget in ms (default 1500)")
    ap.add_argument("--frame", help="same as --size (kept for older commands)")
    args = ap.parse_args()

    edge = next((p for p in EDGE_CANDIDATES if os.path.exists(p)), None)
    if not edge:
        sys.exit("Microsoft Edge not found")
    w, h = (int(n) for n in (args.frame or args.size).lower().split("x"))
    out = str(Path(args.out).resolve())
    if os.path.exists(out):
        os.remove(out)
    profile = tempfile.mkdtemp(prefix="edge-shot-")  # throwaway profile: no cache, no extensions

    wrapper = Path(profile) / "frame.html"
    wrapper.write_text('<!doctype html><body style="margin:0;background:#888">'
                       f'<iframe src="{html.escape(to_url(args.target))}" width="{w}" height="{h}" '
                       'style="border:0;display:block;background:#fff"></iframe></body>', encoding="utf-8")

    cmd = [edge, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
           "--disable-extensions", f"--user-data-dir={profile}", "--allow-file-access-from-files",
           "--enable-logging=stderr", "--v=0", f"--window-size={max(w, MIN_WINDOW_WIDTH)},{h}",
           f"--virtual-time-budget={args.wait}", f"--screenshot={out}", wrapper.as_uri()]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    except subprocess.TimeoutExpired:
        print("Edge did not finish within 120 s (a page that starts a download hangs headless Edge)")
        return 1

    console = [ln for ln in r.stderr.splitlines()
               if ("CONSOLE" in ln or "Uncaught" in ln) and "chrome-extension://" not in ln]
    errors = [ln for ln in console if re.search(r"error|Uncaught|Failed", ln, re.I)]
    for ln in console:
        print("console:", re.sub(r"^\[[^\]]*\]\s*", "", ln))
    if not os.path.exists(out):
        print("NO SCREENSHOT WRITTEN")
        return 1
    with Image.open(out) as img:
        cropped = img.crop((0, 0, w, h)) if img.size != (w, h) else None  # narrow sizes: drop the grey
    if cropped:
        cropped.save(out)
    print("saved " + out)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
