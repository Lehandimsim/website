"""Make the launch trailers.

    python promo/render.py paint                  capture, then render both formats
    python promo/render.py paint --no-capture     render again from the last capture
    python promo/render.py paint --preview 1 4.5  stills at these output times (both formats)
    python promo/render.py paint --fmt story      one format only
    python promo/render.py all                    every video

Videos land in promo/out/. Captures and stills go to %TEMP%/lehanzhang-promo (or $PROMO_CACHE).
"""
import argparse
import importlib
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from lib import compose  # noqa: E402

# "start" reuses the other videos' captures for its glimpses, so it goes last
VIDEOS = ["kitchen", "paint", "powerpoint", "overleaf", "minesweeper", "start"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("videos", nargs="+", help="video names, or 'all'")
    ap.add_argument("--no-capture", action="store_true")
    ap.add_argument("--fmt", choices=["x", "story"], help="one format only")
    ap.add_argument("--preview", nargs="*", type=float, help="write stills at these times instead of videos")
    a = ap.parse_args()
    names = VIDEOS if a.videos == ["all"] else a.videos
    fmts = [a.fmt] if a.fmt else ["x", "story"]
    for name in names:
        mod = importlib.import_module(f"videos.{name}")
        t0 = time.time()
        if not a.no_capture:
            print(f"[{name}] capturing")
            mod.capture()
        compose._clips.clear()
        video = mod.edit()
        segs, total = compose.timeline(video)
        print(f"[{name}] {total:.1f}s")
        for fmt in fmts:
            if a.preview is not None:
                for p in compose.render(video, fmt, preview=a.preview):
                    print("  still", p)
            else:
                compose.render(video, fmt)
        print(f"[{name}] done in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
