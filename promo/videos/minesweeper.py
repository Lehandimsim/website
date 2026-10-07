"""Minesweeper: "also: minesweeper, but for economists".

On the Paint desktop: double-click the icon above the Recycle Bin -> hover a few squares (their names
show under the board) -> first click opens an area -> footnote two fragile specifications -> boom on
Specification 14 -> Scooped!, Quick Question and Exclusion Restriction, one loss each -> a win.

The game draws its mines with Math.random(), which the capture controls (lib/capture.py), so each board
is designed here (layout()) and every loss shows the line Lehan approved:
  Specification 14: kitchen-sink controls; individual FE; robust SEs: the pre-trends look like a ski slope.
  Idea 57: Rainfall and happiness? A 1974 paper did it first, with better data.
  Row C, seat 4: "Not a question, more of a comment..."
  Rainfall also affects mood. Your instrument is now a control variable.
"""
from lib import endcard
from lib.capture import Recorder
from lib.compose import clip

NAME = "minesweeper"
COLOUR = "#3d4a5c"
LABEL = "also: minesweeper, but for economists"
END_LINE = "on the desktop, right above the recycle bin"
COLS = ROWS = 9


def neighbours(i):
    r, c = divmod(i, COLS)
    return [rr * COLS + cc for rr in range(r - 1, r + 2) for cc in range(c - 1, c + 2)
            if (rr, cc) != (r, c) and 0 <= rr < ROWS and 0 <= cc < COLS]


def layout(first, mines):
    """The Math.random() values that make the site's placeMines() put the mines exactly here."""
    keep = {first, *neighbours(first)}
    pool = [i for i in range(ROWS * COLS) if i not in keep]
    values = []
    for k, m in enumerate(mines):
        j = pool.index(m)
        assert j >= k, "mine listed twice or kept clear"
        values.append((j - k + 0.5) / (len(pool) - k))
        pool[k], pool[j] = pool[j], pool[k]
    return values


def reason(i):
    """Math.random() value that picks lose.reasons[i]."""
    return (i + 0.5) / 1000


def cell(i):
    return f'.ms-cell[data-i="{i}"]'


def safe_cells(mines):
    return [i for i in range(81) if i not in mines]


# Boards (index = row * 9 + column, both from 0)
SPEC_MINES = [2, 6, 10, 13, 16, 20, 24, 27, 31, 35]          # all in the top four rows: the bottom opens up
SCOOP_MINES = [56, 1, 5, 19, 23, 38, 42, 60, 70, 74]
SEMINAR_MINES = [21, 3, 7, 25, 30, 44, 47, 58, 66, 78]
RAIN_MINES = [40, 0, 8, 22, 28, 52, 54, 63, 71, 80]
# a wall of mines down the middle column (+ one corner): two clicks win it, one per side, so the win
# can say a believable time (time passes between them, unrecorded)
WIN_MINES = [4, 13, 22, 31, 40, 49, 58, 67, 76, 80]


def pick_theme(r, name, tag):
    """Theme menu -> the theme -> a new game (switching theme keeps the old board)."""
    r.mark(tag + "_menu")
    r.click('.ms-menubtn[data-menu="theme"]', seconds=0.45, after=0.25)
    item = r.page.locator(".ms-dropdown button").filter(has_text=name).first
    b = item.bounding_box()
    r.click(b["x"] + 30, b["y"] + b["height"] / 2, seconds=0.4, after=0.2)
    r.mark(tag + "_picked")
    r.click(".ms-face", seconds=0.4, after=0.2)


def play_loss(r, first, mines, boom_cell, why, tag):
    r.force_random(*layout(first, mines))
    r.click(cell(first), seconds=0.4, after=0.35)
    r.sfx("cascade")
    r.mark(tag + "_open")
    r.force_random(reason(why))
    r.click(cell(boom_cell), seconds=0.5, after=0)
    r.sfx("boom")
    r.mark(tag + "_boom")
    r.wait(0.5)
    r.sfx("womp", gain=0.7)
    r.wait(1.4)
    r.mark(tag + "_end")


def capture():
    with Recorder("ms_main", "fun/paint/index.html?motion=on#home", css=".pt-tip { display: none !important; }",
                  start_mouse=(250, 620), dpr=3) as r:      # 3x: the 9:16 version zooms right in
        r.wait(0.3)
        r.mark("start")
        r.move_to("#xp-game-icon", seconds=0.6)
        r.dblclick()
        r.settle_until(".ms-board .ms-cell")
        r.wait(0.5)
        r.mark("open")
        # hover a few squares: their names show under the board
        for i in (19, 50):
            r.move_to(cell(i), seconds=0.4)
            r.wait(0.6)
        r.mark("first")
        r.force_random(*layout(76, SPEC_MINES))
        r.click(cell(76), seconds=0.5, after=0.4)
        r.sfx("cascade")
        for i in (31, 27):                       # footnote two fragile specifications
            r.click(cell(i), seconds=0.4, button="right", after=0.25)
            r.sfx("flag")
        r.move_to(cell(22), seconds=0.4)
        r.wait(0.35)
        r.mark("aim")
        r.force_random(reason(3))                 # "the pre-trends look like a ski slope"
        r.click(cell(13), seconds=0.55, after=0)
        r.sfx("boom")
        r.mark("boom")
        r.wait(0.5)
        r.sfx("womp", gain=0.7)
        r.wait(2.2)
        b = r.box("#ms-window")                   # the window at its tallest (a result showing): the camera's frame
        r.markers["win_box"] = [b["x"], b["y"], b["width"], b["height"]]
        r.mark("boom_end")
        pick_theme(r, "Scooped!", "scooped")
        play_loss(r, 8, SCOOP_MINES, 56, 1, "scooped")
        pick_theme(r, "Quick Question", "seminar")
        play_loss(r, 80, SEMINAR_MINES, 21, 4, "seminar")
        pick_theme(r, "Exclusion Restriction", "rain")
        play_loss(r, 4, RAIN_MINES, 40, 2, "rain")
        pick_theme(r, "Specification Search", "spec2")
        r.mark("levels")
        r.click('.ms-menubtn[data-menu="game"]', seconds=0.45, after=1.3)    # the level names
        r.press("Escape", after=0.2)
        r.mark("win")
        r.force_random(*layout(36, WIN_MINES))
        r.click(cell(36), seconds=0.4, after=0.3)
        r.sfx("cascade")
        r.settle(9000)                # unrecorded game time, so the win does not say "in 1 seconds"
        r.click(cell(44), seconds=0.5, after=0.1)
        r.sfx("cascade")
        for i in safe_cells(WIN_MINES):
            if r.js("i => document.querySelector(`.ms-cell[data-i='${i}']`).classList.contains('is-open')", i):
                continue
            r.click(cell(i), seconds=0.18, after=0.02, sound=False)
        r.sfx("win")
        r.mark("won")
        r.wait(2.6)
        r.mark("end")
    for fmt in ("x", "story"):
        endcard.capture(NAME, "ms", END_LINE, fmt, click=False)


def edit():
    m = clip("ms_main").markers
    x, y, w, h = m["win_box"]
    W = (x + w / 2, y + h / 2)              # the game window's centre
    ZX, ZS = 1.42, 4.4                      # 16:9 keeps some desktop around it; 9:16 fills the frame with it
    still = {"x": [(0, *W, ZX)], "story": [(0, *W, ZS)]}
    segs = [
        # the icon, double-clicked
        {"clip": "ms_main", "in": m["start"], "out": m["open"] + 0.1,
         "cam": {"x": [(m["start"], 380, 400, 1.35), (m["open"] - 0.2, 520, 390, 1.4), (m["open"], *W, ZX)],
                 "story": [(m["start"], 150, 470, 2.6), (m["open"] - 0.3, 330, 420, 2.6), (m["open"], *W, ZS)]}},
        # names on hover, the first click, footnotes, boom
        {"clip": "ms_main", "in": m["open"] + 0.1, "out": m["boom_end"], "cam": still},
    ]
    # three more themes: the menu opening, then (cut) the board just opened, the boom and its line
    for tag in ("scooped", "seminar", "rain"):
        # (out just as the theme is clicked: after that the old board shows re-themed for a moment)
        segs.append({"clip": "ms_main", "in": m[tag + "_menu"] + 0.35, "out": m[tag + "_picked"] - 0.3, "cam": still})
        segs.append({"clip": "ms_main", "in": m[tag + "_open"] - 0.25, "out": m[tag + "_end"], "cam": still})
    segs += [
        # the level names, then a win (the clicking at 3x)
        {"clip": "ms_main", "in": m["levels"] + 0.4, "out": m["win"] + 0.75, "cam": still},
        {"clip": "ms_main", "in": m["win"] + 0.75, "out": m["won"], "speed": 3.0, "mute": True, "cam": still},
        {"clip": "ms_main", "in": m["won"], "out": m["end"] - 0.3, "cam": still},
        {"clip": "endcard_minesweeper_{fmt}", "native": True, "in": 0, "out": 3.4, "trans": ("dissolve", 0.4)},
    ]
    return {"name": NAME, "colour": COLOUR, "segments": segs,
            "overlays": [{"type": "label", "text": LABEL, "t0": 0.2, "t1": 2.6}]}