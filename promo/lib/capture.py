"""Frame-exact capture of the website with headless Edge (Playwright).

The page runs on a virtual clock: JavaScript time (Date, timers, requestAnimationFrame) is
Playwright's fake clock, and every CSS / Web Animation is paused and stepped by hand
(VT_JS below). So each frame shows exactly 1/fps seconds more than the last, however long a
screenshot takes, and the same script always gives the same video.

The mouse is real (Playwright sends real events, so :hover and click handlers work); the
pointer you see in the video is drawn later by compose.py from what we record here:
per-frame mouse position, button state and CSS cursor, plus clicks, key presses and markers.

Nothing here changes the website's files: everything happens inside the browser session.
"""
import base64
import json
import math
import os
import shutil
from datetime import datetime
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]          # the project root (LIFE/website)
SITE = ROOT / "site"
CACHE = Path(os.environ.get("PROMO_CACHE", Path(os.environ.get("TEMP", "/tmp")) / "lehanzhang-promo"))

VIEWPORT = (1440, 810)    # the desktop layout, 16:9 (CSS pixels)
DPR = 2                   # captured at 2x, so zoomed shots stay sharp
FPS = 30

# Runs in the page before the site's scripts. __vt.sync(ms) puts every running animation at
# the virtual time; __vt.random lets a script force the next Math.random() values.
VT_JS = r"""
(() => {
  const seen = new WeakMap();
  const forced = [];
  let seed = 12345;
  function prng() {               // mulberry32: same "random" choices every run
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  Math.random = function () { return forced.length ? forced.shift() : prng(); };
  function cursorAt(x, y) {
    const e = document.elementFromPoint(x, y);
    if (!e) return "default";
    const c = getComputedStyle(e).cursor;
    if (c && c !== "auto") return c;
    if (e.isContentEditable || e.closest("textarea, input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]):not([type=range])")) return "text";
    return "default";
  }
  window.__vt = {
    force(values) { forced.push(...values); },
    sync(ms, x, y) {
      for (const a of document.getAnimations()) {
        let s = seen.get(a);
        if (!s) {
          if (a.playState !== "running") continue;      // paused by the site, or finished: leave it
          s = { base: a.currentTime || 0, t0: ms, done: false };
          seen.set(a, s);
          try { a.pause(); } catch (e) { continue; }
        }
        if (s.done) continue;
        const rate = a.playbackRate || 1;
        const t = s.base + (ms - s.t0) * rate;
        let end = Infinity;
        try { end = a.effect ? a.effect.getComputedTiming().endTime : Infinity; } catch (e) {}
        if ((rate > 0 && isFinite(end) && t >= end) || (rate < 0 && t <= 0)) {
          try { a.finish(); } catch (e) { try { a.currentTime = rate > 0 ? end : 0; } catch (e2) {} }
          s.done = true;
        } else {
          try { a.currentTime = t; } catch (e) {}
        }
      }
      return [x == null ? null : cursorAt(x, y), scrollX, scrollY];
    }
  };
})();
"""


def ease(u, kind="inout"):
    u = max(0.0, min(1.0, u))
    if kind == "linear":
        return u
    if kind == "out":
        return 1 - (1 - u) ** 3
    if kind == "in":
        return u ** 3
    return u * u * (3 - 2 * u) if kind == "smooth" else (4 * u ** 3 if u < 0.5 else 1 - (-2 * u + 2) ** 3 / 2)


def site_url(rel):
    """file:// address of a page in site/ ('fun/paint/index.html?x=1#home')."""
    path, _, rest = rel.partition("?")
    hashpart = ""
    if "#" in path:
        path, _, h = path.partition("#")
        hashpart = "#" + h
    url = (SITE / path).as_uri()
    if rest:
        url += "?" + rest
    return url + hashpart


class Recorder:
    """One continuous take. Use as a context manager:

        with Recorder("paint", "fun/paint/index.html?motion=on#start") as r:
            r.wait(1); r.move_to(700, 400, 0.8); r.click(); r.mark("clicked") ...
    """

    def __init__(self, name, url, *, clock="2026-10-06T19:30:00", storage=None, routes=None,
                 viewport=VIEWPORT, dpr=DPR, fps=FPS, quality=92, start_mouse=(1500, 900),
                 page_url=None, css=None):
        self.name, self.fps, self.quality = name, fps, quality
        self.url = page_url or site_url(url)
        self.clock_start = datetime.fromisoformat(clock)
        self.storage = storage or {}
        self.routes = routes or {}
        self.css = css           # extra CSS for this capture only (e.g. hide a tip that clutters a shot)
        self.viewport, self.dpr = viewport, dpr
        self.dir = CACHE / "clips" / name
        self.frames = []
        self.events = []          # {"t", "type": click|key|sfx, ...}
        self.markers = {}
        self.mouse = list(start_mouse)
        self.down = False
        self.cursor = "default"
        self.ms = 0
        self.i = 0

    # ---------- lifecycle ----------
    def __enter__(self):
        if self.dir.exists():
            shutil.rmtree(self.dir)
        (self.dir / "frames").mkdir(parents=True)
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(channel="msedge", headless=True,
                                               args=["--hide-scrollbars", "--force-color-profile=srgb",
                                                     "--font-render-hinting=none"])
        self.ctx = self.browser.new_context(viewport={"width": self.viewport[0], "height": self.viewport[1]},
                                            device_scale_factor=self.dpr, reduced_motion="no-preference",
                                            locale="en-AU", timezone_id="Europe/Zurich")
        self.ctx.add_init_script(VT_JS)
        if self.storage:
            js = "".join("try{localStorage.setItem(%s,%s)}catch(e){}" % (json.dumps(k), json.dumps(v))
                         for k, v in self.storage.items())
            self.ctx.add_init_script(js)
        # Nothing leaves this machine: local files load, every web request is refused, except the
        # ones a video fakes on purpose (routes registered later take precedence).
        def offline(route):
            if route.request.url.startswith(("file:", "data:", "blob:")):
                route.continue_()
            else:
                route.abort()
        self.ctx.route("**/*", offline)
        for pattern, handler in self.routes.items():
            self.ctx.route(pattern, handler)
        if self.css:
            self.ctx.add_init_script("document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); "
                                     "s.textContent = %s; document.head.appendChild(s); });" % json.dumps(self.css))
        self.page = self.ctx.new_page()
        self.page.clock.install(time=self.clock_start)
        self.page.goto(self.url, wait_until="load")
        # the fake clock ran naturally while the page loaded; stop it from here on
        for attempt in range(5):
            now_ms = self.page.evaluate("Date.now()")
            try:
                self.page.clock.pause_at(datetime.fromtimestamp((now_ms + 400) / 1000))
                break
            except Exception:
                if attempt == 4:
                    raise
        self.page.wait_for_timeout(300)        # real time: images and fonts settle
        self.cdp = self.ctx.new_cdp_session(self.page)
        self.page.mouse.move(*self.mouse)
        return self

    def __exit__(self, *exc):
        meta = {"name": self.name, "fps": self.fps, "viewport": self.viewport, "dpr": self.dpr,
                "frames": self.frames, "events": self.events, "markers": self.markers}
        (self.dir / "meta.json").write_text(json.dumps(meta))
        self.browser.close()
        self.pw.stop()
        if exc[0] is None:
            print(f"[{self.name}] {len(self.frames)} frames, {len(self.frames) / self.fps:.1f}s")

    # ---------- time ----------
    @property
    def t(self):
        return self.i / self.fps

    def frame(self):
        """Advance one frame of virtual time and save it."""
        self.i += 1
        step = round(self.i * 1000 / self.fps) - round((self.i - 1) * 1000 / self.fps)
        self.page.clock.run_for(step)
        self.ms += step           # virtual time (also counts settle() time, which is not recorded)
        cur, sx, sy = self.page.evaluate("([ms,x,y]) => __vt.sync(ms,x,y)", [self.ms, *self.mouse])
        self.cursor = cur or "default"
        # the clip's scale gives real device pixels (CDP alone ignores Playwright's device scale); its x/y
        # are document coordinates, so they follow the page's scroll position
        shot = self.cdp.send("Page.captureScreenshot", {"format": "jpeg", "quality": self.quality, "clip": {
            "x": sx, "y": sy, "width": self.viewport[0], "height": self.viewport[1], "scale": self.dpr}})
        (self.dir / "frames" / f"{self.i:05d}.jpg").write_bytes(base64.b64decode(shot["data"]))
        self.frames.append([round(self.mouse[0], 1), round(self.mouse[1], 1), self.cursor, int(self.down)])

    def wait(self, seconds):
        for _ in range(max(1, round(seconds * self.fps))):
            self.frame()

    def settle(self, ms=0):
        """Advance JavaScript time without recording (e.g. let a page finish loading)."""
        if ms:
            self.page.clock.run_for(ms)
        self.ms += ms
        self.page.evaluate("ms => __vt.sync(ms)", self.ms)

    def settle_until(self, selector, max_ms=2000, step=16):
        """Advance unrecorded time until `selector` is in the page (e.g. a view drawn after a click)."""
        waited = 0
        while not self.page.evaluate("s => !!document.querySelector(s)", selector):
            if waited >= max_ms:
                raise RuntimeError(f"{self.name}: {selector!r} never appeared")
            self.settle(step)
            waited += step

    def wait_until(self, js_condition, max_s=5.0):
        """Record frames until a JavaScript condition is true (e.g. a panel has opened)."""
        n = 0
        while not self.page.evaluate(js_condition):
            if n >= max_s * self.fps:
                raise RuntimeError(f"{self.name}: timed out waiting for {js_condition}")
            self.frame()
            n += 1

    def mark(self, name):
        self.markers[name] = self.t

    def sfx(self, name, **kw):
        self.events.append({"t": self.t, "type": "sfx", "name": name, **kw})

    def force_random(self, *values):
        self.page.evaluate("v => __vt.force(v)", list(values))

    # ---------- mouse ----------
    def box(self, selector, nth=0):
        loc = self.page.locator(selector).nth(nth)
        b = loc.bounding_box()
        if not b:
            raise RuntimeError(f"{self.name}: no box for {selector!r}")
        return b

    def center(self, selector, nth=0, dx=0.5, dy=0.5):
        b = self.box(selector, nth)
        return b["x"] + b["width"] * dx, b["y"] + b["height"] * dy

    def move_to(self, x, y=None, seconds=0.7, arc=0.12, kind="inout"):
        """Glide the mouse along a slightly curved path (x may be a selector)."""
        if isinstance(x, str):
            x, y = self.center(x)
        x0, y0 = self.mouse
        dx, dy = x - x0, y - y0
        dist = math.hypot(dx, dy)
        # control point: off to one side of the straight line, so the path bows a little
        cx, cy = x0 + dx * 0.5 - dy * arc, y0 + dy * 0.5 + dx * arc
        n = max(1, round(seconds * self.fps))
        for k in range(1, n + 1):
            u = ease(k / n, kind)
            px = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x
            py = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y
            self.mouse = [px, py]
            self.page.mouse.move(px, py)
            self.frame()
        if dist < 1:
            self.frame()

    def click(self, x=None, y=None, seconds=0.6, button="left", hold=0.1, after=0.25, sound=True):
        if x is not None:
            self.move_to(x, y, seconds)
        self.page.mouse.down(button=button)
        self.down = True
        self.events.append({"t": self.t, "type": "click", "x": self.mouse[0], "y": self.mouse[1],
                            "button": button, "sound": sound})
        self.wait(hold)
        self.page.mouse.up(button=button)
        self.down = False
        if after:
            self.wait(after)

    def dblclick(self, x=None, y=None, seconds=0.6):
        if x is not None:
            self.move_to(x, y, seconds)
        for k in (1, 2):      # click_count 2 on the second press makes the browser send dblclick
            self.page.mouse.down(click_count=k)
            self.down = True
            self.events.append({"t": self.t, "type": "click", "x": self.mouse[0], "y": self.mouse[1],
                                "button": "left", "sound": True})
            self.frame()
            self.page.mouse.up(click_count=k)
            self.down = False
            self.frame()
        self.wait(0.2)

    def drag(self, points, seconds, kind="linear"):
        """Press, follow a list of (x, y) points, release (drawing in Paint)."""
        self.move_to(*points[0], seconds=0.3)
        self.page.mouse.down()
        self.down = True
        # resample the polyline by length so the speed is even
        segs = [math.hypot(points[k + 1][0] - points[k][0], points[k + 1][1] - points[k][1]) for k in range(len(points) - 1)]
        total = sum(segs) or 1
        n = max(2, round(seconds * self.fps))
        sub = 4      # several real mouse events per frame, so strokes stay smooth
        for k in range(1, n + 1):
            for s in range(1, sub + 1):
                d = ease((k - 1 + s / sub) / n, kind) * total
                acc = 0
                for j, L in enumerate(segs):
                    if acc + L >= d or j == len(segs) - 1:
                        u = 0 if L == 0 else min(1, (d - acc) / L)
                        px = points[j][0] + (points[j + 1][0] - points[j][0]) * u
                        py = points[j][1] + (points[j + 1][1] - points[j][1]) * u
                        break
                    acc += L
                self.mouse = [px, py]
                self.page.mouse.move(px, py)
            self.frame()
        self.page.mouse.up()
        self.down = False

    # ---------- keyboard ----------
    def type(self, text, cps=14, jitter=0.35):
        """Type like a person: about cps characters a second, a little uneven."""
        import random
        rnd = random.Random(len(text))
        for ch in text:
            self.page.keyboard.type(ch)
            self.events.append({"t": self.t, "type": "key"})
            self.wait(max(1, round(self.fps / cps * (1 + rnd.uniform(-jitter, jitter)))) / self.fps)

    def press(self, keys, after=0.2):
        self.page.keyboard.press(keys)
        self.events.append({"t": self.t, "type": "key"})
        self.wait(after)

    # ---------- scrolling ----------
    def scroll(self, selector, dy, seconds=1.0, kind="inout"):
        """Scroll an element (or 'window') by dy CSS pixels, smoothly and frame by frame."""
        start = self.page.evaluate(
            "s => s === 'window' ? scrollY : document.querySelector(s).scrollTop", selector)
        n = max(1, round(seconds * self.fps))
        for k in range(1, n + 1):
            y = start + dy * ease(k / n, kind)
            self.page.evaluate("([s,y]) => { const e = s === 'window' ? document.scrollingElement : document.querySelector(s); "
                               "e.style.scrollBehavior = 'auto'; e.scrollTop = y; }", [selector, y])
            self.frame()

    def js(self, code, arg=None):
        return self.page.evaluate(code, arg)
