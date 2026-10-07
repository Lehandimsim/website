"""Turn captured clips into finished trailers: edit, camera, cursor, captions, transitions, sound.

A video is described by a dict (see videos/*.py):

    {
      "name": "paint", "colour": "#1f62d4",
      "segments": [            # played one after another
        {"clip": "paint_main", "in": 0.0, "out": 6.5, "speed": 1,
         "cam": {"x": [(t, cx, cy, zoom), ...], "story": [...]},   # t = clip time; cx/cy CSS px or "m" (follow mouse)
         "trans": ("dissolve", 0.3)},                               # how this segment comes in
        {"clip": "endcard_paint_{fmt}", "native": True, "in": 0, "out": 3.5, "trans": ("circle", 0.6, (0.5, 0.5))},
      ],
      "overlays": [{"type": "label", "text": "...", "t0": 0.2, "t1": 2.2}, ...],   # output time
      "sfx": [(t, "name", gain, {kwargs}), ...],                                  # output time, besides clicks/keys
    }

Zoom 1 shows the whole 1440-wide desktop across the frame's width. In 16:9 that is the full screen;
in 9:16 the desktop sits in the middle with blurred bands above and below, and a zoom of about 3.2
fills the whole frame. The website is always the desktop layout: 9:16 only frames it differently.
"""
import json
import math
import subprocess
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from . import sfx as SFX
from .capture import CACHE, ROOT

PROMO = ROOT / "promo"
OUT = PROMO / "out"
FONTS = PROMO / "fonts"
FFMPEG = "ffmpeg"
FORMATS = {"x": (1920, 1080), "story": (1080, 1920)}
FPS = 30
PAPER = (247, 244, 238)
INK = (29, 29, 31)
MUTED = (95, 91, 85)


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def smooth(u):
    u = max(0.0, min(1.0, u))
    return 4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2


def ease_out(u):
    u = max(0.0, min(1.0, u))
    return 1 - (1 - u) ** 3


@lru_cache(maxsize=None)
def font(weight, size):
    return ImageFont.truetype(str(FONTS / f"Inter-{weight}.ttf"), size)


# ---------------------------------------------------------------- clips
class Clip:
    def __init__(self, name):
        self.name = name
        self.dir = CACHE / "clips" / name
        meta = json.loads((self.dir / "meta.json").read_text())
        self.fps = meta["fps"]
        self.vw, self.vh = meta["viewport"]
        self.dpr = meta["dpr"]
        self.frames = meta["frames"]
        self.events = meta["events"]
        self.markers = meta["markers"]
        self.n = len(self.frames)
        self._cache = {}

    def index(self, t):
        return max(0, min(self.n - 1, int(round(t * self.fps)) - 1))

    def image(self, i):
        if i not in self._cache:
            if len(self._cache) > 6:
                self._cache.pop(next(iter(self._cache)))
            self._cache[i] = Image.open(self.dir / "frames" / f"{i + 1:05d}.jpg").convert("RGB")
        return self._cache[i]

    def mouse(self, t, smooth_frames=0):
        i = self.index(t)
        if not smooth_frames:
            return self.frames[i]
        lo, hi = max(0, i - smooth_frames), min(self.n, i + smooth_frames + 1)
        xs = [f[0] for f in self.frames[lo:hi]]
        ys = [f[1] for f in self.frames[lo:hi]]
        return [sum(xs) / len(xs), sum(ys) / len(ys)] + self.frames[i][2:]

    def m(self, name):
        return self.markers[name]


_clips = {}


def clip(name):
    if name not in _clips:
        _clips[name] = Clip(name)
    return _clips[name]


# ---------------------------------------------------------------- camera
def camera_at(keys, t, c):
    """keys: [(t, cx, cy, zoom)]. Eased between keys; zoom interpolated geometrically."""
    if not keys:
        return c.vw / 2, c.vh / 2, 1.0

    def resolve(k, tt):
        cx, cy = k[1], k[2]
        if cx == "m" or cy == "m":
            mx, my = c.mouse(tt, smooth_frames=10)[:2]
            cx = mx if cx == "m" else cx
            cy = my if cy == "m" else cy
        return cx, cy, k[3]

    if t <= keys[0][0]:
        return resolve(keys[0], t)
    if t >= keys[-1][0]:
        return resolve(keys[-1], t)
    for a, b in zip(keys, keys[1:]):
        if a[0] <= t <= b[0]:
            u = smooth((t - a[0]) / (b[0] - a[0]) if b[0] > a[0] else 1)
            ax, ay, az = resolve(a, t)
            bx, by, bz = resolve(b, t)
            return ax + (bx - ax) * u, ay + (by - ay) * u, math.exp(math.log(az) + (math.log(bz) - math.log(az)) * u)


def view(c, cx, cy, z, W, H):
    """The visible CSS rectangle (left, top, width, height) and the scale (output px per CSS px)."""
    s = W / c.vw * z
    w, h = W / s, H / s
    if w <= c.vw:
        cx = min(max(cx, w / 2), c.vw - w / 2)
    else:
        cx = c.vw / 2
    if h <= c.vh:
        cy = min(max(cy, h / 2), c.vh - h / 2)
    else:
        cy = c.vh / 2
    return cx - w / 2, cy - h / 2, w, h, s


# ---------------------------------------------------------------- cursor
U = 4  # supersampling for the cursor drawings


def _poly(points, k):
    return [(x * k + 6, y * k + 6) for x, y in points]


@lru_cache(maxsize=64)
def cursor_image(kind, px_per_unit):
    """A pointer drawn for this video (not an operating-system asset). Returns (RGBA, hotspot)."""
    k = px_per_unit * U
    size = (int(30 * k) + 12, int(30 * k) + 12)
    im = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    lw = max(2, int(1.35 * k))
    if kind == "pointer":
        hand = [(7, 0), (8.6, -0.2), (10, 1), (10, 9.2), (11.8, 8.6), (13.6, 9.6), (15, 9.4), (16.6, 10.6), (18, 10.6),
                (19.6, 12), (19.6, 19), (17.6, 25), (8.6, 25), (5.2, 19.5), (1.0, 14.2), (1.0, 12.6), (2.6, 12.0), (6, 15), (6, 1)]
        pts = _poly([(x, y + 0.5) for x, y in hand], k)
        d.polygon(pts, fill=(255, 255, 255, 255))
        d.line(pts + [pts[0]], fill=(0, 0, 0, 255), width=lw, joint="curve")
        for x0, y0, y1 in ((10, 9.6, 14), (13.6, 10.2, 14.5), (16.6, 11, 15)):
            d.line(_poly([(x0, y0), (x0, y1)], k), fill=(0, 0, 0, 255), width=max(1, lw - 1))
        hot = (8 * k + 6, 0.5 * k + 6)
    elif kind == "text":
        for col, w in (((255, 255, 255, 255), lw * 3), ((0, 0, 0, 255), lw)):
            d.line(_poly([(3, 1), (5, 2), (7, 1)], k), fill=col, width=w)
            d.line(_poly([(5, 2), (5, 20)], k), fill=col, width=w)
            d.line(_poly([(3, 21), (5, 20), (7, 21)], k), fill=col, width=w)
        hot = (5 * k + 6, 11 * k + 6)
    elif kind == "crosshair":
        for col, w in (((255, 255, 255, 255), lw * 3), ((0, 0, 0, 255), lw)):
            d.line(_poly([(10, 0), (10, 20)], k), fill=col, width=w)
            d.line(_poly([(0, 10), (20, 10)], k), fill=col, width=w)
        hot = (10 * k + 6, 10 * k + 6)
    else:
        arrow = [(0, 0), (0, 21), (5, 16.2), (8.6, 24.6), (12, 23.2), (8.5, 15), (15, 15)]
        pts = _poly(arrow, k)
        d.polygon(pts, fill=(255, 255, 255, 255))
        d.line(pts + [pts[0]], fill=(0, 0, 0, 255), width=lw, joint="curve")
        hot = (6, 6)
    # soft shadow, then scale down
    sh = Image.new("RGBA", size, (0, 0, 0, 0))
    sh.putalpha(im.getchannel("A").point(lambda a: int(a * 0.35)))
    sh = sh.filter(ImageFilter.GaussianBlur(2.2 * k / U * U / 2))
    base = Image.new("RGBA", size, (0, 0, 0, 0))
    base.alpha_composite(sh, (int(1.2 * k), int(1.8 * k)))
    base.alpha_composite(im)
    small = base.resize((size[0] // U, size[1] // U), Image.LANCZOS)
    return small, (hot[0] / U, hot[1] / U)


CURSOR_KINDS = {"pointer": "pointer", "text": "text", "crosshair": "crosshair", "cell": "crosshair"}


# ---------------------------------------------------------------- overlays
@lru_cache(maxsize=64)
def label_image(text, colour, fmt):
    """The series label: a white card with the version's colour dot ("my website, but...")."""
    size = 46 if fmt == "x" else 50
    f = font("SemiBold", size)
    pad_x, pad_y, dot = 30, 20, 16
    tw = f.getlength(text)
    asc, desc = f.getmetrics()
    w = int(pad_x * 2 + dot + 18 + tw)
    h = int(pad_y * 2 + asc + desc - 6)
    m = 40
    im = Image.new("RGBA", (w + 2 * m, h + 2 * m), (0, 0, 0, 0))
    sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((m, m + 8, m + w, m + h + 8), radius=h // 2, fill=(0, 0, 0, 70))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((m, m, m + w, m + h), radius=h // 2, fill=(255, 255, 255, 250))
    cy = m + h / 2
    d.ellipse((m + pad_x, cy - dot / 2, m + pad_x + dot, cy + dot / 2), fill=hexrgb(colour) + (255,))
    d.text((m + pad_x + dot + 18, cy), text, font=f, fill=INK + (255,), anchor="lm")
    return im, m


@lru_cache(maxsize=64)
def pill_image(text, fmt):
    """PowerPoint's effect names: a small dark pill."""
    f = font("Medium", 30 if fmt == "x" else 34)
    tw = f.getlength(text)
    w, h = int(tw + 40), 54 if fmt == "x" else 60
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=12, fill=(20, 20, 24, 200))
    d.text((20, h / 2), text, font=f, fill=(235, 235, 235, 255), anchor="lm")
    return im


@lru_cache(maxsize=16)
def url_image(text, fmt):
    f = font("Bold", 78 if fmt == "x" else 92)
    tw = f.getlength(text)
    asc, desc = f.getmetrics()
    im = Image.new("RGBA", (int(tw) + 8, asc + desc + 8), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((4, 4), text, font=f, fill=INK + (255,))
    return im


def draw_overlay(frame, ov, T, fmt, colour):
    W, H = frame.size
    t0, t1 = ov["t0"], ov["t1"]
    if not (t0 <= T <= t1):
        return
    a_in = ease_out((T - t0) / 0.28)
    a_out = 1 - smooth((T - (t1 - 0.22)) / 0.22) if T > t1 - 0.22 else 1
    alpha = a_in * a_out
    rise = (1 - a_in) * 18
    if ov["type"] == "label":
        im, m = label_image(ov["text"], ov.get("colour", colour), fmt)
        if fmt == "x":
            x, y = 64 - m, H - 150 - (im.size[1] - 2 * m) - m
            if ov.get("pos") == "top":
                y = 60 - m
        else:
            x = (W - im.size[0]) // 2
            y = 285 - m
        _paste(frame, im, int(x), int(y + rise), alpha)
    elif ov["type"] == "fx":
        im = pill_image(ov["text"], fmt)
        x = 64 if fmt == "x" else (W - im.size[0]) // 2
        y = (H - 150 if fmt == "x" else 1560)
        _paste(frame, im, x, int(y + rise), alpha)
    elif ov["type"] == "url":
        im = url_image(ov["text"], fmt)
        x, y = ov["xy"][fmt]
        x = (W - im.size[0]) // 2 if x == "c" else x
        _paste(frame, im, int(x), int(y + rise), alpha)


def _paste(frame, im, x, y, alpha):
    if alpha <= 0:
        return
    if alpha < 1:
        im = im.copy()
        im.putalpha(im.getchannel("A").point(lambda a: int(a * alpha)))
    frame.alpha_composite(im, (x, y)) if frame.mode == "RGBA" else frame.paste(im, (x, y), im)


# ---------------------------------------------------------------- one frame of one segment
def render_segment_frame(seg, tc, fmt, colour):
    W, H = FORMATS[fmt]
    c = clip(seg["clip"].format(fmt=fmt))
    i = c.index(tc)
    img = c.image(i)
    if seg.get("native"):
        frame = img.resize((W, H), Image.LANCZOS) if img.size != (W, H) else img.copy()
        s = W / c.vw
        left = top = 0.0
        content = (0, 0, W, H)
    else:
        cx, cy, z = camera_at(seg.get("cam", {}).get(fmt, []), tc, c)
        left, top, w, h, s = view(c, cx, cy, z, W, H)
        # the part of the page inside the view, in device pixels
        sl, st = max(0, left), max(0, top)
        sr, sb = min(c.vw, left + w), min(c.vh, top + h)
        dx0, dy0 = (sl - left) * s, (st - top) * s
        dw, dh = (sr - sl) * s, (sb - st) * s
        content = (int(round(dx0)), int(round(dy0)), int(round(dx0 + dw)), int(round(dy0 + dh)))
        cw, ch = content[2] - content[0], content[3] - content[1]
        box = (sl * c.dpr, st * c.dpr, min(sr * c.dpr, img.width), min(sb * c.dpr, img.height))
        part = img.resize((cw, ch), Image.LANCZOS, box=box, reducing_gap=2.5)
        if (cw, ch) == (W, H):
            frame = part
        else:
            frame = backdrop(img, W, H)
            bands = content[1] > 2 or content[0] > 2
            if bands:
                r = 26
                sh = Image.new("L", (W // 4, H // 4), 0)
                ImageDraw.Draw(sh).rounded_rectangle([v // 4 for v in (content[0], content[1] + 14, content[2], content[3] + 14)], radius=r // 4, fill=110)
                sh = sh.filter(ImageFilter.GaussianBlur(9)).resize((W, H), Image.BILINEAR)
                frame.paste((30, 30, 40), (0, 0, W, H), sh)
                mask = Image.new("L", (cw, ch), 0)
                ImageDraw.Draw(mask).rounded_rectangle((0, 0, cw - 1, ch - 1), radius=r, fill=255)
                frame.paste(part, content[:2], mask)
            else:
                frame.paste(part, content[:2])
    if not seg.get("hide_cursor"):
        draw_cursor(frame, c, tc, left, top, s, content, colour, seg)
    return frame


def backdrop(img, W, H):
    """Blurred, softened copy of the frame for the bands of the 9:16 version."""
    small = img.resize((48, 27), Image.BILINEAR)
    k = max(W / 48, H / 27)
    big = small.resize((int(48 * k) + 2, int(27 * k) + 2), Image.BILINEAR)
    x0, y0 = (big.size[0] - W) // 2, (big.size[1] - H) // 2
    big = big.crop((x0, y0, x0 + W, y0 + H)).filter(ImageFilter.GaussianBlur(30))
    return Image.blend(big, Image.new("RGB", (W, H), PAPER), 0.45)


def draw_cursor(frame, c, tc, left, top, s, content, colour, seg):
    i = c.index(tc)
    mx, my, kind, down = c.frames[i]
    if mx > c.vw + 50 or my > c.vh + 50:
        return
    unit = min(2.5, max(1.35, 1.15 * s))
    if seg.get("cursor_scale"):
        unit *= seg["cursor_scale"]
    ox, oy = (mx - left) * s, (my - top) * s
    # click rings, in the version's colour
    rgb = hexrgb(colour)
    d = ImageDraw.Draw(frame, "RGBA")
    for e in c.events:
        if e["type"] == "click" and 0 <= tc - e["t"] < 0.42:
            u = (tc - e["t"]) / 0.42
            ex, ey = (e["x"] - left) * s, (e["y"] - top) * s
            r = (7 + 20 * ease_out(u)) * unit
            a = int(200 * (1 - u))
            d.ellipse((ex - r, ey - r, ex + r, ey + r), outline=rgb + (a,), width=max(2, int(2.6 * unit)))
    im, hot = cursor_image(CURSOR_KINDS.get(kind, "arrow"), round(unit * (0.9 if down else 1), 2))
    frame.paste(im, (int(ox - hot[0]), int(oy - hot[1])), im)


# ---------------------------------------------------------------- transitions
def blend(a, b, kind, u, fmt, args):
    W, H = a.size
    if kind == "dissolve":
        return Image.blend(a, b, smooth(u))
    if kind == "white":
        white = Image.new("RGB", (W, H), (255, 255, 255))
        return Image.blend(a, white, smooth(u * 2)) if u < 0.5 else Image.blend(white, b, smooth(u * 2 - 1))
    if kind == "paper":
        paper = Image.new("RGB", (W, H), PAPER)
        return Image.blend(a, paper, smooth(u * 2)) if u < 0.5 else Image.blend(paper, b, smooth(u * 2 - 1))
    if kind == "circle":       # a paint-bucket flood from a point (fractions of the frame)
        point = args[2] if len(args) > 2 else (0.5, 0.5)       # args = (name, seconds, point)
        px, py = point[fmt] if isinstance(point, dict) else point
        R = math.hypot(max(px, 1 - px) * W, max(py, 1 - py) * H) * smooth(u) * 1.02
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).ellipse((px * W - R, py * H - R, px * W + R, py * H + R), fill=255)
        out = a.copy()
        out.paste(b, (0, 0), mask)
        return out
    if kind == "box":          # PowerPoint's Box Out
        e = smooth(u)
        w, h = W * e, H * e
        out = a.copy()
        if w >= 2 and h >= 2:
            box = (int((W - w) / 2), int((H - h) / 2), int((W + w) / 2), int((H + h) / 2))
            out.paste(b.crop(box), box[:2])
        return out
    return b


# ---------------------------------------------------------------- the whole video
def timeline(video):
    t = 0.0
    out = []
    for seg in video["segments"]:
        dur = (seg["out"] - seg["in"]) / seg.get("speed", 1)
        out.append((t, t + dur, seg))
        t += dur
    return out, t


def render(video, fmt, preview=None):
    """Render one format. preview=[t, ...] writes stills instead of a video (for checking)."""
    W, H = FORMATS[fmt]
    colour = video.get("colour", "#1f4e8c")
    segs, total = timeline(video)
    OUT.mkdir(parents=True, exist_ok=True)

    def frame_at(T):
        for k, (a, b, seg) in enumerate(segs):
            if a <= T < b or (k == len(segs) - 1 and T >= a):
                tc = seg["in"] + (T - a) * seg.get("speed", 1)
                img = render_segment_frame(seg, tc, fmt, colour)
                tr = seg.get("trans")
                if tr and tr[0] != "cut" and k > 0 and T - a < tr[1]:
                    pa, pb, prev = segs[k - 1]
                    ptc = prev["out"] + (T - a) * prev.get("speed", 1)
                    pimg = render_segment_frame(prev, ptc, fmt, colour)
                    img = blend(pimg, img, tr[0], (T - a) / tr[1], fmt, tr)
                break
        img = img.convert("RGBA")
        for ov in video.get("overlays", []):
            if fmt in ov.get("only", (fmt,)):
                draw_overlay(img, ov, T, fmt, colour)
        return img.convert("RGB")

    if preview:
        paths = []
        for old in (CACHE / "preview").glob(f"{video['name']}_{fmt}_*.jpg"):
            old.unlink()
        for T in preview:
            p = CACHE / "preview" / f"{video['name']}_{fmt}_{T:05.2f}.jpg"
            p.parent.mkdir(parents=True, exist_ok=True)
            frame_at(T).save(p, quality=90)
            paths.append(p)
        return paths

    wav = CACHE / f"{video['name']}_{fmt}.wav"
    make_audio(video, segs, total, wav)
    out = OUT / f"lehanzhang_{video['name']}_{'x_16x9' if fmt == 'x' else 'story_9x16'}.mp4"
    rate = ["-maxrate", "20M", "-bufsize", "40M"] if fmt == "x" else ["-maxrate", "12M", "-bufsize", "24M"]
    cmd = [FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-i", str(wav), "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
           "-c:v", "libx264", "-preset", "slow", "-crf", "17", *rate, "-profile:v", "high", "-level", "4.2",
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", "-shortest", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    n = int(round(total * FPS))
    for k in range(n):
        proc.stdin.write(frame_at(k / FPS).tobytes())
        if k % 90 == 0:
            print(f"  {video['name']} {fmt}: {k}/{n}", flush=True)
    proc.stdin.close()
    if proc.wait():
        raise RuntimeError("ffmpeg failed")
    print(f"  wrote {out.name} ({total:.1f}s)")
    return out


def make_audio(video, segs, total, path):
    """Clicks and key presses from the captures, plus each video's own sound effects."""
    events = []
    rng = np.random.default_rng(7)
    for a, b, seg in segs:
        if seg.get("mute"):
            continue
        c = clip(seg["clip"].format(fmt="x") if "{fmt}" in seg["clip"] else seg["clip"])
        sp = seg.get("speed", 1)
        for e in c.events:
            if not (seg["in"] <= e["t"] < seg["out"]):
                continue
            T = a + (e["t"] - seg["in"]) / sp
            pan = 0.0
            if e["type"] == "click" and e.get("sound", True) and sp <= 1.5:
                pan = max(-0.5, min(0.5, (e.get("x", 720) / c.vw - 0.5)))
                events.append((T, SFX.click(int(rng.integers(0, 99))), 1.0, pan))
            elif e["type"] == "key" and sp <= 1.5:
                events.append((T, SFX.key(int(rng.integers(0, 999))), 0.9, 0.0))
            elif e["type"] == "sfx":
                kw = {k: v for k, v in e.items() if k not in ("t", "type", "name", "gain")}
                events.append((T, SFX.make(e["name"], **kw), e.get("gain", 1.0), 0.0))
    for item in video.get("sfx", []):
        t, name = item[0], item[1]
        gain = item[2] if len(item) > 2 else 1.0
        kw = item[3] if len(item) > 3 else {}
        events.append((t, SFX.make(name, **kw), gain, 0.0))
    SFX.mix(events, total, path)
