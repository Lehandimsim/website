"""Paint: "my website, but in ms paint".

Start button (three hovers, three colours) -> "hi! i'm Lehan" written on -> Enter -> Research,
palette clicks repaint the doodles ("pick a colour!") -> Talks (circled in red) -> Paint!: a bin
chicken raiding a wheelie bin -> Save & send -> "Sent! Thank you, bin chicken." -> end card.
The send is answered inside the capture, so nothing reaches Lehan.
"""
from lib import endcard
from lib.capture import Recorder
from lib.compose import clip
from lib.inpage import FADE_OUT, PAINT_NOTE, WRITE_ON

NAME = "paint"
COLOUR = "#1f62d4"
LABEL = "my website, but in ms paint"
END_LINE = "draw me something · behind the blue door"


def fake_send(route):
    route.fulfill(status=200, headers={"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"},
                  body='{"ok":true}')


def well(i):
    return f'.pt-well[data-i="{i}"]'


def tool(name):
    return f'.pt-tool[data-tool="{name}"]'


BLACK, GREEN, RED, LIME, MAGENTA, ORANGE, CYAN = 0, 4, 16, 18, 21, 27, 19

# The drawing, in page coordinates (the canvas is x 360-1177, y 140-630). Strokes are drawn with the
# Brush; closed shapes overlap where they start and end, so the bucket fills stay inside.
IBIS_BODY = [(600, 432), (626, 398), (684, 378), (752, 380), (800, 402), (812, 432), (790, 463), (730, 479),
             (660, 476), (612, 459), (598, 436), (604, 426)]
TAIL = [(604, 440), (566, 452), (584, 462), (608, 457), (603, 437)]
NECK = [[(784, 395), (797, 352), (814, 314)], [(792, 398), (806, 354), (822, 316)], [(799, 402), (814, 357), (830, 318)]]
HEAD = [(826 + 21 * c, 299 + 19 * s) for c, s in
        [(1, 0), (0.7, 0.71), (0, 1), (-0.7, 0.71), (-1, 0), (-0.7, -0.71), (0, -1), (0.7, -0.71), (1, 0), (0.75, 0.6)]]
BILL = [(843, 300), (878, 309), (910, 326), (932, 350), (940, 372)]
LEGS = [[(706, 477), (700, 524), (707, 574)], [(742, 477), (747, 524), (754, 574)]]
FEET = [[(684, 576), (726, 577)], [(735, 576), (777, 577)]]
BIN = [(884, 352), (1030, 352), (1013, 582), (900, 582), (884, 352), (895, 350)]
LID = [(1030, 352), (1054, 258), (1072, 263), (1047, 356), (1028, 356)]
WHEEL = [(918 + 13 * c, 592 + 13 * s) for c, s in
         [(1, 0), (0.7, 0.71), (0, 1), (-0.7, 0.71), (-1, 0), (-0.7, -0.71), (0, -1), (0.7, -0.71), (1, 0.1)]]


def capture():
    with Recorder("paint_main", "fun/paint/index.html?motion=on#start", routes={"**/macros/**": fake_send},
                  css=".pt-tip { display: none !important; }") as r:
        r.wait(0.4)
        r.mark("start")
        # three hovers on the start button: a new fill colour each time
        for k, (inside, outside) in enumerate([((900, 420), (1075, 470)), ((860, 330), (1060, 300)), ((700, 450), (1050, 420))]):
            r.move_to(*inside, seconds=0.4 if k else 0.55)
            r.sfx("boing", freq=420 + 90 * k)
            r.wait(0.32)
            if k < 2:
                r.move_to(*outside, seconds=0.28)
                r.wait(0.06)
        r.wait(0.1)
        r.click(770, 390, seconds=0.35, after=0)
        r.mark("home")
        r.settle_until(".pt-home-hand")
        r.js(WRITE_ON, [".pt-home-hand", [[0, 36, 380], [36, 66, 650], [66, 100, 950]]])
        r.sfx("scribble", sec=2.0, peak=0.06)
        r.wait(2.05)
        r.mark("enter")
        r.click(*r.center(".pt-enter"), seconds=0.5, after=0)
        r.sfx("whoosh", sec=0.35, peak=0.12)
        r.wait(0.7)
        r.mark("research")
        r.js(PAINT_NOTE, ["note1", "pick a colour!", 650, 585, {"size": 0.42, "arrow": [[-6, 30], [-44, 62], [-80, 76]], "duration": 650}])
        r.sfx("scribble", sec=0.7, peak=0.06)
        r.wait(0.75)
        for i in (MAGENTA, LIME, ORANGE):
            r.click(well(i), seconds=0.36, after=0.3)
        r.js(FADE_OUT, ["note1", 250])
        r.wait(0.2)
        r.mark("talks")
        r.click(427, 90, seconds=0.55, after=0.1)
        top = r.js("() => document.querySelector('.pt-talk.is-upcoming').getBoundingClientRect().top")
        r.scroll("#pt-workspace", top - 330, seconds=0.8)
        r.wait(0.7)
        r.mark("paint")
        r.click(650, 90, seconds=0.6, after=0.15)
        r.js(PAINT_NOTE, ["note2", "draw me something!\n(it actually gets sent to me)", 392, 160,
                          {"size": 0.34, "duration": 1300}])
        r.sfx("scribble", sec=1.3, peak=0.06)
        r.wait(1.4)
        r.mark("draw")
        r.click(tool("brush"), seconds=0.5, after=0.05)
        r.click('.pt-opt[data-v="1"]', seconds=0.3, after=0.05)      # round brush, size 6
        r.click(well(BLACK), seconds=0.4, after=0.1)                    # the palette clicks changed the colour
        for pts, secs in [(IBIS_BODY, 0.8), (TAIL, 0.3), (HEAD, 0.4), (BILL, 0.42)]:
            r.drag(pts, secs)
            r.wait(0.05)
        r.click('.pt-opt[data-v="0"]', seconds=0.35, after=0.05)      # size 10 for the neck
        for pts in NECK:
            r.drag(pts, 0.28)
            r.wait(0.05)
        r.click('.pt-opt[data-v="1"]', seconds=0.35, after=0.05)
        for pts, secs in [(s, 0.3) for s in LEGS] + [(s, 0.18) for s in FEET] + [(BIN, 0.8), (LID, 0.42), (WHEEL, 0.3)]:
            r.drag(pts, secs)
            r.wait(0.05)
        r.mark("fill")
        r.click(tool("fill"), seconds=0.45, after=0.05)
        for colour, spots in ((BLACK, [(826, 299), (590, 451)]), (GREEN, [(957, 470)]), (RED, [(1050, 300)])):
            r.click(well(colour), seconds=0.4, after=0.05)
            for x, y in spots:
                r.click(x, y, seconds=0.45, after=0.12)
                r.sfx("fill")
        r.wait(0.5)
        r.js(FADE_OUT, ["note2", 300])
        r.mark("save")
        r.click(*r.center(".pt-act--save"), seconds=0.6, after=0.6)
        r.type("bin chicken", cps=11)
        r.wait(0.35)
        r.click(*r.center(".xp-modal .xp-dialog-buttons button"), seconds=0.55, after=0)
        r.sfx("sent")
        r.wait(0.5)
        r.mark("sent")
        r.wait(1.9)
        r.mark("end")
    for fmt in ("x", "story"):
        endcard.capture(NAME, "paint", END_LINE, fmt)


def edit():
    c = clip("paint_main")
    m = c.markers
    BTN = (770, 384)
    segs = [
        # 1. the start button
        {"clip": "paint_main", "in": m["start"] - 0.1, "out": m["home"] + 0.05,
         "cam": {"x": [(0, BTN[0], BTN[1] + 10, 1.55), (m["home"] - 0.3, BTN[0], BTN[1] + 10, 1.62)],
                 "story": [(0, 715, BTN[1], 2.6), (m["home"], 715, BTN[1], 2.68)]}},
        # 2. hello, then Enter
        {"clip": "paint_main", "in": m["home"] + 0.05, "out": m["research"] + 0.1,
         "cam": {"x": [(m["home"], 770, 380, 1.25), (m["enter"] + 0.3, 760, 400, 1.3)],
                 "story": [(m["home"], 790, 330, 2.05), (m["enter"] - 0.1, 800, 340, 2.1), (m["enter"] + 0.45, 767, 450, 2.7)]}},
        # 3. Research and the palette
        {"clip": "paint_main", "in": m["research"] + 0.1, "out": m["talks"] + 0.05,
         "cam": {"x": [(m["research"], 700, 420, 1.2), (m["research"] + 1.0, 640, 470, 1.4), (m["talks"], 640, 470, 1.4)],
                 "story": [(m["research"], 680, 330, 2.3), (m["research"] + 0.9, 640, 590, 2.6), (m["talks"], 640, 590, 2.6)]}},
        # 4. Talks, circled in red (cut in as the tab is clicked)
        {"clip": "paint_main", "in": m["talks"] + 0.62, "out": m["paint"] + 0.05,
         "cam": {"x": [(m["talks"], 740, 420, 1.35), (m["talks"] + 1.6, 760, 380, 1.75), (m["paint"], 760, 380, 1.75)],
                 "story": [(m["talks"], 760, 420, 2.4), (m["talks"] + 1.6, 790, 365, 2.75), (m["paint"], 790, 365, 2.75)]}},
        # 5. the canvas: the note, then the drawing at 4x
        {"clip": "paint_main", "in": m["paint"] + 0.6, "out": m["draw"] + 0.3,
         "cam": {"x": [(m["paint"], 768, 400, 1.15)], "story": [(m["paint"], 640, 225, 2.6), (m["draw"], 660, 240, 2.6)]}},
        {"clip": "paint_main", "in": m["draw"] + 0.3, "out": m["save"] + 0.2, "speed": 4.0,
         "cam": {"x": [(m["draw"], 768, 400, 1.15), (m["save"], 810, 420, 1.35)],
                 "story": [(m["draw"], 700, 380, 1.85), (m["fill"], 720, 390, 1.85), (m["save"], 760, 400, 1.9)]}},
        # 6. save and send
        {"clip": "paint_main", "in": m["save"] + 0.2, "out": m["end"],
         "cam": {"x": [(m["save"], 760, 400, 1.2), (m["save"] + 1.0, 720, 400, 1.5), (m["end"], 720, 400, 1.55)],
                 "story": [(m["save"], 720, 420, 2.5), (m["save"] + 0.9, 720, 400, 3.0), (m["end"], 720, 400, 3.1)]}},
        # 7. end card: a paint-bucket flood from where the cursor is
        {"clip": "endcard_paint_{fmt}", "native": True, "in": 0, "out": 3.6,
         "trans": ("circle", 0.55, {"x": (0.52, 0.62), "story": (0.5, 0.6)})},
    ]
    draw_start = sum((s["out"] - s["in"]) / s.get("speed", 1) for s in segs[:5])
    return {
        "name": NAME, "colour": COLOUR, "segments": segs,
        "overlays": [{"type": "label", "text": LABEL, "t0": 0.25, "t1": 2.9}],
        "sfx": [(draw_start, "scribble", 1.0, {"sec": (m["fill"] - m["draw"] - 0.3) / 4.0, "peak": 0.06})],
    }