"""PowerPoint: "my website, but it's a powerpoint from 2007".

The pulsing From Beginning button -> a gag (Delete: "These slides are load-bearing.") -> From Beginning ->
the show up to the Talks slide, each with its own 2007 transition and entrance -> straight to
"End of slide show, click to exit." with polite applause -> Box Out into the end card.
(Lehan, 2026-10-07: no captions naming the effects; the show stops after Talks.)
"""
import re

from lib import endcard
from lib.capture import Recorder
from lib.compose import clip

NAME = "powerpoint"
COLOUR = "#c43e1c"
LABEL = "my website, but it's a powerpoint from 2007"
END_LINE = "every single transition, on purpose · behind the orange door"

# Seconds on each slide shown (transition + build + a beat): Home, Research, Talks. Then the end screen.
HOLD = [1.75, 1.6, 1.9]


def capture():
    with Recorder("pp_main", "fun/powerpoint/index.html?motion=on#slide-1", start_mouse=(520, 330)) as r:
        r.wait(0.3)
        r.mark("start")
        r.move_to(300, 160, seconds=0.5)             # near the button, which pulses
        r.wait(0.6)
        # the gag: Home > Delete
        r.mark("gag")
        r.click("#pp-tab-home", seconds=0.45, after=0.25)
        delete = r.page.locator(".pp-btn").filter(has_text=re.compile(r"^\s*Delete\s*$")).first
        b = delete.bounding_box()
        r.click(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, seconds=0.45, after=0.15)
        r.markers["delete"] = [b["x"] + b["width"] / 2, b["y"] + b["height"] / 2]
        r.sfx("bonk", gain=0.6)
        r.settle_until(".xp-modal")
        r.mark("dialog_t")
        b = r.box(".xp-modal .xp-dialog, .xp-modal > *")
        r.markers["dialog"] = [b["x"], b["y"], b["width"], b["height"]]
        r.wait(1.5)
        r.click(".xp-modal .xp-dialog-buttons button", seconds=0.4, after=0.1)
        r.mark("gag_end")
        r.click("#pp-tab-slideshow", seconds=0.45, after=0.2)
        r.move_to("#pp-hero", seconds=0.45)          # it hops on hover
        r.wait(0.45)
        r.mark("go")
        r.click(after=0)
        r.page.mouse.move(1600, 950)                 # out of the way: a presenter does not wave the mouse
        r.mouse = [1600, 950]
        for k, hold in enumerate(HOLD):
            r.mark(f"s{k}")
            r.sfx("whoosh", sec=0.5, peak=0.18)
            r.wait(hold)
            if k + 1 < len(HOLD):
                r.page.keyboard.press("ArrowRight")
        r.page.evaluate("location.hash = '#end'")    # after Talks, straight to the end screen
        r.settle_until("#pp-show-end:not([hidden])")
        r.mark("black")
        r.sfx("applause", sec=2.4)
        r.wait(2.2)
        r.mark("end")
    for fmt in ("x", "story"):
        endcard.capture(NAME, "powerpoint", END_LINE, fmt)


def edit():
    m = clip("pp_main").markers
    dx, dy, dw, dh = m["dialog"]
    D = (dx + dw / 2, dy + dh / 2)
    HERO = (217, 160)
    DEL = tuple(m["delete"])
    segs = [
        # the pulsing button and its balloon
        {"clip": "pp_main", "in": m["start"], "out": m["gag"] + 0.05,
         "cam": {"x": [(m["start"], 330, 210, 2.3), (m["gag"], 330, 200, 2.4)],
                 "story": [(m["start"], 300, 215, 3.6), (m["gag"], 290, 210, 3.7)]}},
        # Home > Delete > "load-bearing"
        {"clip": "pp_main", "in": m["gag"] + 0.05, "out": m["gag_end"],
         "cam": {"x": [(m["gag"], 330, 200, 2.0), (m["dialog_t"] - 0.1, *DEL, 2.2), (m["dialog_t"] + 0.35, *D, 2.1), (m["gag_end"], *D, 2.15)],
                 "story": [(m["gag"], 300, 180, 3.0), (m["dialog_t"] - 0.1, *DEL, 3.4), (m["dialog_t"] + 0.35, *D, 3.4), (m["gag_end"], *D, 3.5)]}},
        # back to Slide Show, From Beginning
        {"clip": "pp_main", "in": m["gag_end"], "out": m["s0"],
         "cam": {"x": [(m["gag_end"], 330, 200, 2.0), (m["go"], *HERO, 2.3)],
                 "story": [(m["gag_end"], 300, 180, 3.2), (m["go"], *HERO, 3.6)]}},
        # the show, full screen
        {"clip": "pp_main", "in": m["s0"], "out": m["end"],
         # 16:9: the whole screen, then a push in on "End of slide show, click to exit."
         # 9:16: the left of each slide (the titles); on the black screen, wide enough to keep that line
         # inside the Stories safe area.
         "cam": {"x": [(m["s0"], 720, 405, 1.0), (m["black"], 720, 405, 1.0), (m["black"] + 0.7, 720, 150, 2.6)],
                 "story": [(m["s0"], 390, 405, 1.9), (m["black"], 390, 405, 1.9), (m["black"] + 0.5, 720, 405, 2.0)]}},
        {"clip": "endcard_powerpoint_{fmt}", "native": True, "in": 0, "out": 3.6, "trans": ("box", 0.7)},
    ]
    overlays = [{"type": "label", "text": LABEL, "t0": 0.2, "t1": 2.4}]
    return {"name": NAME, "colour": COLOUR, "segments": segs, "overlays": overlays}
