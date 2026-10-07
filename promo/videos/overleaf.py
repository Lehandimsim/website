"""Overleaf: "my website, but you can recompile it".

research.tex: type "% go on, edit my website (i won't know)" -> edit the slide title -> Ctrl+Enter, the
preview says "Research (edited by a visitor)" -> delete an \end{itemize}, recompile: a real-looking
LaTeX error and its hint -> History shows the diff -> Restore original files -> the site's balloon:
"Refresh the page to restore the original website." Edits stay in the browser (nothing is sent).
"""
from lib import endcard
from lib.capture import Recorder
from lib.compose import clip
from lib.inpage import FAKE_CARET, MARK_SCROLLER, SET_CARET, TEXT_XY

NAME = "overleaf"
COLOUR = "#13800a"
LABEL = "my website, but you can recompile it"
END_LINE = "break it, refresh, it's fine · behind the green door"
TA = ".ol-code-input"
COMMENT = "% go on, edit my website (i won't know)"
END_ITEMIZE = "  \\end{itemize}\n\\end{frame}"       # the outer list's end, just before the first frame ends


def capture():
    with Recorder("ol_main", "fun/overleaf/index.html?motion=on#research", start_mouse=(640, 560)) as r:
        r.settle(300)
        r.js(FAKE_CARET, TA)
        r.js(MARK_SCROLLER, TA)
        r.wait(0.4)
        r.mark("start")
        # 1. a comment above the first frame
        x, y = r.js(TEXT_XY, [TA, "% ---- Research ----", len("% ---- Research ----"), 0])
        r.click(x + 4, y, seconds=0.6, after=0.1)
        r.js(SET_CARET, [TA, "% ---- Research ----", len("% ---- Research ----"), 0, 0])
        r.wait(0.2)
        r.press("Enter", after=0.15)
        r.type(COMMENT, cps=17)
        r.wait(0.5)
        r.mark("typed")
        # 2. the slide title
        x, y = r.js(TEXT_XY, [TA, "\\frametitle{Research}", len("\\frametitle{Research"), 0])
        r.click(x + 2, y, seconds=0.5, after=0.1)
        r.js(SET_CARET, [TA, "\\frametitle{Research}", len("\\frametitle{Research"), 0, 0])
        r.type(" \\emph{(edited by a visitor)}", cps=17)
        r.wait(0.3)
        r.mark("compile")
        r.press("Control+Enter", after=0)
        r.sfx("ding", gain=0.8)
        r.wait(2.0)
        r.mark("compiled")
        # 3. break it: delete an \end{itemize}
        x, y = r.js(TEXT_XY, [TA, END_ITEMIZE, 2, 0])
        box = r.box("#ol-editor")
        if y > box["y"] + box["height"] - 80:
            r.scroll("[data-promo-scroll]", y - (box["y"] + box["height"] * 0.55), seconds=0.6)
            x, y = r.js(TEXT_XY, [TA, END_ITEMIZE, 2, 0])
        r.markers["break_xy"] = [x, y]
        r.move_to(x + 60, y, seconds=0.5)
        r.js(SET_CARET, [TA, END_ITEMIZE, 0, len("  \\end{itemize}\n"), 0])
        r.wait(0.45)
        r.press("Backspace", after=0.4)
        r.mark("break")
        r.press("Control+Enter", after=0)
        r.sfx("bonk", gain=0.8)
        r.wait(2.6)
        r.mark("error")
        # 4. History
        r.click("#ol-history-btn", seconds=0.6, after=0)
        r.wait(2.4)
        r.mark("history")
        # 5. Restore: everything comes back
        r.click(".ol-history-foot button", seconds=0.6, after=0.1)
        r.settle_until(".xp-modal")
        r.wait(0.7)
        r.click(".xp-modal .xp-dialog-buttons button", seconds=0.5, after=0)
        r.sfx("whoosh", sec=0.4, peak=0.15)
        r.wait(0.8)
        r.mark("restored")
        r.js("() => XP.balloon({ title: 'This website is written in LaTeX', icon: 'info', timeout: 9000, "
             "text: 'Edit any file and press Recompile. Refresh the page to restore the original website.' })")
        r.sfx("blip", freq=990)
        r.wait(2.6)
        r.mark("end")
    for fmt in ("x", "story"):
        endcard.capture(NAME, "overleaf", END_LINE, fmt)


def edit():
    m = clip("ol_main").markers
    bx, by = m["break_xy"]
    ED = (500, 300)                  # the top of the editor
    PV = (1040, 300)                 # the preview's first slide
    LOG = (1040, 330)                # the error, in the preview pane
    segs = [
        # typing the comment, then the title
        {"clip": "ol_main", "in": m["start"], "out": m["compile"],
         "cam": {"x": [(m["start"], *ED, 1.7), (m["typed"], 520, 330, 1.8), (m["compile"], 540, 340, 1.8)],
                 "story": [(m["start"], 470, 300, 3.3), (m["typed"] - 0.8, 480, 300, 3.3), (m["typed"] + 0.4, 520, 320, 3.3), (m["compile"], 540, 330, 3.3)]}},
        # recompiled: over to the preview
        {"clip": "ol_main", "in": m["compile"], "out": m["compiled"],
         "cam": {"x": [(m["compile"], 540, 340, 1.8), (m["compile"] + 0.7, *PV, 1.75)],
                 "story": [(m["compile"], 540, 330, 3.3), (m["compile"] + 0.7, 960, 270, 2.8)]}},
        # break it, recompile: the error
        {"clip": "ol_main", "in": m["compiled"], "out": m["error"],
         "cam": {"x": [(m["compiled"], 600, by, 1.7), (m["break"], 600, by, 1.7), (m["break"] + 0.5, *LOG, 1.75)],
                 "story": [(m["compiled"], 540, by, 3.3), (m["break"], 540, by, 3.3), (m["break"] + 0.5, 1040, 300, 2.5)]}},
        # History
        {"clip": "ol_main", "in": m["error"], "out": m["history"],
         "cam": {"x": [(m["error"], *LOG, 1.75), (m["error"] + 0.6, 440, 340, 1.55)],
                 "story": [(m["error"], 1040, 300, 2.5), (m["error"] + 0.6, 450, 330, 2.5)]}},
        # Restore, and the balloon
        {"clip": "ol_main", "in": m["history"], "out": m["end"],
         "cam": {"x": [(m["history"], 440, 340, 1.55), (m["restored"] - 0.6, 720, 405, 1.3), (m["restored"] + 0.4, 720, 405, 1.0),
                       (m["restored"] + 1.3, 1250, 640, 2.2)],
                 "story": [(m["history"], 450, 330, 2.5), (m["restored"] - 0.5, 720, 420, 2.0), (m["restored"] + 0.4, 720, 420, 2.0),
                           (m["restored"] + 1.2, 1240, 640, 3.6)]}},
        {"clip": "endcard_overleaf_{fmt}", "native": True, "in": 0, "out": 3.6, "trans": ("paper", 0.6)},
    ]
    return {"name": NAME, "colour": COLOUR, "segments": segs,
            "overlays": [{"type": "label", "text": LABEL, "t0": 0.2, "t1": 2.6}]}
