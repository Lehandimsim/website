"""Kitchen: "my website, but you cook it". Dinner time (19:30), the window at night.

The glowing rice cooker ("Rice -> Research / Click to cook") -> COOK, "Fluffy rice!" -> the Research
panel -> a montage of the other four ingredients (crack, chop + smash, slice, season), each cut on its
click, with the recipe card filling between -> the wok -> "Dinner is served!" -> a one-second glimpse
of the fried rice game ("Whoa, salty!") -> end card.
"""
from lib import endcard
from lib.capture import Recorder
from lib.compose import clip

NAME = "kitchen"
COLOUR = "#6a4c9c"
LABEL = "my website, but you cook it"
END_LINE = "serves 1 hungry visitor · behind the purple door"
URL = "fun/kitchen/index.html?motion=on&sky=night#kitchen"
SOUNDS = {"rice": ["rice_cooker"], "eggs": ["crack", "crack"], "onions": ["chop", "chop"],
          "tomatoes": ["slice", "slice"], "seasoning": ["shake"]}
# a page panel is open when its "Back to the kitchen" button can be seen
PANEL_OPEN = """() => [...document.querySelectorAll('button, a')].some(b => /Back to the kitchen/.test(b.textContent)
                  && b.getBoundingClientRect().width > 0 && getComputedStyle(b).visibility !== 'hidden')"""


def back_to_kitchen(r):
    btn = r.page.locator("button:visible, a:visible").filter(has_text="Back to the kitchen").first
    b = btn.bounding_box()
    r.click(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, seconds=0.45, after=0.35)


def cook(r, ing, panel_hold):
    r.mark(f"{ing}_go")
    r.click(f"#hot-{ing}", seconds=0.55, after=0)
    r.settle_until("#station-hit")
    r.wait(0.45)
    r.mark(f"{ing}_cook")
    for k, snd in enumerate(SOUNDS[ing]):
        x, y = r.center("#station-hit", dx=0.5 + 0.06 * k, dy=0.45)
        r.click(x, y, seconds=0.3, after=0.25)
        r.sfx(snd)
    r.mark(f"{ing}_cheer")
    r.wait_until(PANEL_OPEN)             # the cheer, then the page panel opens
    r.wait(0.25)
    r.mark(f"{ing}_panel")
    r.wait(panel_hold)
    back_to_kitchen(r)
    r.mark(f"{ing}_back")
    r.wait(0.45)


def capture():
    capture_main()
    capture_game()
    for fmt in ("x", "story"):
        endcard.capture(NAME, "kitchen", END_LINE, fmt)


def capture_main():
    with Recorder("kitchen_main", URL, storage={"kitchen.welcomed": "1"}, start_mouse=(700, 330)) as r:
        r.wait(0.3)
        r.mark("start")
        r.move_to(*r.center("#hot-rice", dy=0.55), seconds=0.6)     # it glows harder and wiggles
        r.wait(0.9)
        cook(r, "rice", 1.8)
        for ing in ("eggs", "onions", "tomatoes", "seasoning"):
            cook(r, ing, 0.7)
        r.wait(0.6)
        r.mark("wok")
        r.move_to(*r.center("#hot-wok", dx=0.45, dy=0.5), seconds=0.8)
        r.wait(0.8)
        r.click(after=0)
        r.sfx("sizzle", sec=2.0)
        r.mark("serve")
        r.wait(2.0)
        r.sfx("confetti")
        r.sfx("fanfare", gain=0.9)
        r.wait(2.4)
        r.mark("end")


def capture_game():
    """The fried rice game, poured far past the line."""
    with Recorder("kitchen_game", "fun/kitchen/index.html?motion=on&sky=night#recipe-book",
                  storage={"kitchen.welcomed": "1"}, start_mouse=(1500, 900)) as r:
        r.settle(300)
        r.js("() => [...document.querySelectorAll('button,a')].find(b => /Play the recipe/.test(b.textContent)).click()")
        r.settle_until("#game-skip")
        for _ in range(3):
            r.js("() => document.querySelector('#game-skip').click()")
            r.settle(1600)
        r.wait(0.2)
        r.mark("pour")
        r.move_to(*r.center("#game-hit"), seconds=0.3)
        r.page.mouse.down()
        r.down = True
        r.wait(6.0)                     # past the brim: "Whoa, salty!" needs 96% full
        r.page.mouse.up()
        r.down = False
        r.wait_until("() => document.body.innerText.includes('Whoa, salty')", 4)
        r.mark("salty")
        r.wait(1.2)
        r.mark("end")


def edit():
    m = clip("kitchen_main").markers
    g = clip("kitchen_game").markers
    c = clip("kitchen_main")
    RICE = (175, 520)
    MODAL = (720, 420)
    segs = [
        # the rice cooker, glowing; then COOK and "Fluffy rice!"
        {"clip": "kitchen_main", "in": m["start"], "out": m["rice_panel"],
         "cam": {"x": [(m["start"], 420, 480, 1.5), (m["rice_go"], 330, 500, 1.6), (m["rice_cook"], *MODAL, 1.35)],
                 "story": [(m["start"], 300, 500, 2.8), (m["rice_go"], *RICE, 2.9), (m["rice_cook"], *MODAL, 2.25)]}},
        # the Research panel
        {"clip": "kitchen_main", "in": m["rice_panel"], "out": m["rice_panel"] + 1.7,
         "cam": {"x": [(m["rice_panel"], 720, 405, 1.15), (m["rice_back"], 720, 380, 1.25)],
                 "story": [(m["rice_panel"], 560, 330, 2.1), (m["rice_back"], 560, 380, 2.1)]}},
    ]
    # the montage: the recipe card filling (a beat), then the close-up from the first click
    for ing in ("eggs", "onions", "tomatoes", "seasoning"):
        segs.append({"clip": "kitchen_main", "in": m[f"{ing}_go"] - 0.35, "out": m[f"{ing}_go"] + 0.05,
                     "cam": {"x": [(0, 760, 650, 1.6)], "story": [(0, 'm', 700, 2.6)]}})
        segs.append({"clip": "kitchen_main", "in": m[f"{ing}_cook"] - 0.1, "out": m[f"{ing}_cheer"] + 0.85,
                     "cam": {"x": [(0, *MODAL, 1.35)], "story": [(0, *MODAL, 2.25)]}})
    segs += [
        # the whole kitchen at night, the card full; the wok; dinner
        {"clip": "kitchen_main", "in": m["seasoning_back"], "out": m["serve"],
         "cam": {"x": [(m["seasoning_back"], 720, 405, 1.0), (m["wok"], 720, 405, 1.0), (m["serve"], 1150, 520, 1.5)],
                 "story": [(m["seasoning_back"], 330, 280, 2.2), (m["wok"], 330, 300, 2.2), (m["serve"], 1180, 530, 2.6)]}},
        {"clip": "kitchen_main", "in": m["serve"], "out": m["end"],
         "cam": {"x": [(m["serve"], 720, 405, 1.0), (m["end"], 720, 405, 1.08)],
                 "story": [(m["serve"], 720, 400, 1.9), (m["end"], 720, 400, 2.0)]}},
        # one second of fried rice, unexplained
        {"clip": "kitchen_game", "in": g["salty"] - 0.7, "out": g["salty"] + 0.5, "trans": ("white", 0.3),
         "cam": {"x": [(0, 720, 420, 1.3)], "story": [(0, 720, 430, 2.0)]}},
        {"clip": "endcard_kitchen_{fmt}", "native": True, "in": 0, "out": 3.6, "trans": ("white", 0.6)},
    ]
    return {"name": NAME, "colour": COLOUR, "segments": segs,
            "overlays": [{"type": "label", "text": LABEL, "t0": 0.2, "t1": 2.6}]}
