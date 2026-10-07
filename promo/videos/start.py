"""Start page + classic: "this is my website".

The classic home ("this is my website") -> Research, an abstract opens -> the footer's "Try a fun
version" menu: each version, hovered, cuts to a glimpse of it ("so is this", "and this" x3; the glimpses
reuse the other videos' captures, so capture those first) -> the start page with its five doors,
"(i got a little carried away)", and lehanzhang.com. No separate end card: the start page is the end.
"""
from lib.capture import Recorder
from lib.compose import clip

NAME = "start"
COLOUR = "#1f4e8c"
VERSIONS = ["kitchen", "paint", "powerpoint", "overleaf"]
VCOLOUR = {"kitchen": "#6a4c9c", "paint": "#1f62d4", "powerpoint": "#c43e1c", "overleaf": "#13800a"}
GLIMPSE_TEXT = ["so is this", "and this", "and this", "and this"]


def capture():
    with Recorder("classic_main", "classic/index.html", start_mouse=(1500, 600)) as r:
        r.wait(0.3)
        r.mark("start")
        r.wait(1.6)
        r.move_to(900, 300, seconds=0.5)
        r.mark("nav")
        # the click on Research is only recorded (ring and sound): a real one would navigate mid-frame,
        # so Research is a second take that starts where this one ends
        r.move_to('.site-nav a[href$="research.html"]', seconds=0.5)
        r.events.append({"t": r.t, "type": "click", "x": r.mouse[0], "y": r.mouse[1], "button": "left", "sound": True})
        r.down = True
        r.wait(0.1)
        r.down = False
        r.mark("home_end")
        mouse = list(r.mouse)
    with Recorder("classic_research", "classic/research.html", start_mouse=mouse) as r:
        r.wait(0.4)
        r.mark("research")
        r.click("summary", seconds=0.55, after=0)
        r.wait(1.2)
        # the open abstract pushed the footer below the fold: scroll to the very bottom (measured each frame)
        y0 = r.js("() => scrollY")
        n = 18
        for k in range(1, n + 1):
            u = k / n
            r.js("([y0, u]) => { const max = document.scrollingElement.scrollHeight - innerHeight; "
                 "window.scrollTo({ top: y0 + (max - y0) * (u * u * (3 - 2 * u)), behavior: 'instant' }); }", [y0, u])
            r.frame()
        r.wait(0.2)
        r.mark("footer")
        r.click("#fun-toggle", seconds=0.7, after=0.3)
        for k in range(4):
            r.move_to(f"#fun-list li:nth-child({k + 1}) a", seconds=0.35)
            r.mark(f"hover{k}")
            r.wait(0.7)
        r.mark("end")
    with Recorder("start_main", "index.html?motion=on", start_mouse=(1500, 700)) as r:
        r.wait(0.3)
        r.mark("start")
        for sel, pause in [("#classic-door", 0.45)] + [(f".fun-tile >> nth={k}", 0.35) for k in range(4)]:
            x, y = r.center(sel.split(" >> ")[0], nth=int(sel.split("nth=")[1]) if "nth=" in sel else 0)
            r.move_to(x, y, seconds=0.45)
            r.wait(pause)
        r.move_to(1010, 545, seconds=0.5)
        r.wait(2.4)
        r.mark("end")


def edit():
    h = clip("classic_main").markers
    c = clip("classic_research").markers
    s = clip("start_main").markers
    k_ = clip("kitchen_main").markers
    p_ = clip("paint_main").markers
    pp = clip("pp_main").markers
    ol = clip("ol_main").markers
    MENU = {"x": [(0, 830, 600, 1.9)], "story": [(0, 840, 610, 3.0)]}
    glimpses = {
        "kitchen": {"clip": "kitchen_main", "in": k_["start"] + 0.5, "out": k_["start"] + 1.3,
                    "cam": {"x": [(0, 720, 405, 1.0)], "story": [(0, 420, 470, 1.9)]}},
        "paint": {"clip": "paint_main", "in": p_["start"] + 0.55, "out": p_["start"] + 1.35,
                  "cam": {"x": [(0, 770, 384, 1.5)], "story": [(0, 715, 384, 2.6)]}},
        "powerpoint": {"clip": "pp_main", "in": pp["s0"], "out": pp["s0"] + 0.8,
                       "cam": {"x": [(0, 720, 405, 1.0)], "story": [(0, 390, 405, 1.9)]}},
        "overleaf": {"clip": "ol_main", "in": ol["compile"] + 0.85, "out": ol["compile"] + 1.65,
                     "cam": {"x": [(0, 1040, 300, 1.6)], "story": [(0, 960, 270, 2.6)]}},
    }
    segs = [
        # the classic home: "this is my website"
        {"clip": "classic_main", "in": h["start"], "out": h["home_end"],
         "cam": {"x": [(h["start"], 720, 300, 1.15), (h["nav"], 720, 290, 1.25)],
                 "story": [(h["start"], 720, 290, 2.0), (h["nav"], 720, 280, 2.1)]}},
        # Research, an abstract opens
        {"clip": "classic_research", "in": 0.1, "out": c["footer"] + 0.2,
         "cam": {"x": [(c["research"], 720, 330, 1.2), (c["footer"], 720, 380, 1.25)],
                 "story": [(c["research"], 640, 300, 2.3), (c["research"] + 0.8, 640, 400, 2.3)]}},
        # the footer: "Try a fun version"
        {"clip": "classic_research", "in": c["footer"] + 0.2, "out": c["hover0"] + 0.25,
         "cam": {"x": [(c["footer"], 840, 680, 1.7), (c["hover0"], 830, 600, 1.9)],
                 "story": [(c["footer"], 860, 700, 2.8), (c["hover0"], 840, 610, 3.0)]}},
    ]
    overlays = [{"type": "label", "text": "this is my website", "t0": 0.25, "t1": 2.5}]
    t = sum(x["out"] - x["in"] for x in segs)
    for k, v in enumerate(VERSIONS):
        if k:   # back to the menu, the next version hovered
            segs.append({"clip": "classic_research", "in": c[f"hover{k}"] - 0.2, "out": c[f"hover{k}"] + 0.25, "cam": MENU})
            t += 0.45
        segs.append(glimpses[v])
        overlays.append({"type": "label", "text": GLIMPSE_TEXT[k], "colour": VCOLOUR[v], "t0": t, "t1": t + 0.8})
        t += 0.8
    # the start page: all five doors
    segs.append({"clip": "start_main", "in": s["start"], "out": s["end"], "trans": ("paper", 0.35),
                 "cam": {"x": [(s["start"], 900, 430, 1.25), (s["end"], 720, 405, 1.0)],
                         "story": [(s["start"], 1018, 470, 2.6), (s["end"], 1018, 450, 2.35)]}})
    overlays += [
        {"type": "label", "text": "(i got a little carried away)", "t0": t + 0.4, "t1": t + 2.9},
        {"type": "url", "text": "lehanzhang.com", "t0": t + 2.7, "t1": t + (s["end"] - s["start"]) + 0.2,
         "xy": {"x": (1050, 112), "story": ("c", 268)}},
    ]
    return {"name": NAME, "colour": COLOUR, "segments": segs, "overlays": overlays}
