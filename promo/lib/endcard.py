"""Capture the end card (promo/endcard.html) for one video, in one format, at the video's own size."""
from urllib.parse import urlencode

from .capture import ROOT, Recorder
from .compose import FORMATS


def capture(video_name, lit, line, fmt, seconds=3.6, click=True):
    W, H = FORMATS[fmt]
    url = (ROOT / "promo" / "endcard.html").as_uri() + "?" + urlencode({"fmt": fmt, "lit": lit, "line": line})
    name = f"endcard_{video_name}_{fmt}"
    with Recorder(name, None, page_url=url, viewport=(W, H), dpr=1, start_mouse=(W + 80, H * 0.62)) as r:
        r.wait(0.5)
        if click and lit and lit != "ms":
            x, y = r.center(f"#tile-{lit}", dx=0.42, dy=0.55)
            r.move_to(x, y, seconds=0.9, arc=0.18)
            r.wait(0.45)
            r.click(after=0)
        r.wait(max(0.1, seconds - r.t))
    return name
