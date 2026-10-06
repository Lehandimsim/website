"""Every page and documented deep-link state (Kitchen and Minesweeper added 2026-10-02, round 2)."""
from pathlib import Path

SITE = Path(__file__).resolve().parents[2] / "site"   # tools/audit/ -> project root -> site/

STATES = [
    # start + all versions
    "index.html",
    "pages.html",
    # classic
    "classic/index.html", "classic/research.html", "classic/research.html#paper-2", "classic/talks.html",
    "classic/experience.html", "classic/cv.html", "classic/art.html",
    # paint
    "fun/paint/index.html", "fun/paint/index.html#start", "fun/paint/index.html#home", "fun/paint/index.html#research",
    "fun/paint/index.html#research/abstract-1", "fun/paint/index.html#research/abstract-2", "fun/paint/index.html#talks",
    "fun/paint/index.html#experience", "fun/paint/index.html#cv", "fun/paint/index.html#art", "fun/paint/index.html#paint",
    "fun/paint/index.html#home/about", "fun/paint/index.html#about",
    # powerpoint
    "fun/powerpoint/index.html", "fun/powerpoint/index.html#slide-1", "fun/powerpoint/index.html#slide-4",
    "fun/powerpoint/index.html#show", "fun/powerpoint/index.html#show-5", "fun/powerpoint/index.html#show-8",
    "fun/powerpoint/index.html#end", "fun/powerpoint/index.html#about", "fun/powerpoint/index.html#sorter",
    "fun/powerpoint/index.html#outline", "fun/powerpoint/index.html#menu", "fun/powerpoint/index.html#research",
    "fun/powerpoint/index.html#tab-home", "fun/powerpoint/index.html#tab-insert", "fun/powerpoint/index.html#tab-design",
    "fun/powerpoint/index.html#tab-animations", "fun/powerpoint/index.html#tab-slideshow",
    "fun/powerpoint/index.html#tab-review", "fun/powerpoint/index.html#tab-view", "fun/powerpoint/index.html#motion+show",
    # overleaf
    "fun/overleaf/index.html", "fun/overleaf/index.html#main", "fun/overleaf/index.html#home",
    "fun/overleaf/index.html#research", "fun/overleaf/index.html#talks", "fun/overleaf/index.html#experience",
    "fun/overleaf/index.html#cv", "fun/overleaf/index.html#art", "fun/overleaf/index.html#paper-1",
    "fun/overleaf/index.html#paper-2", "fun/overleaf/index.html#teaching", "fun/overleaf/index.html#awards",
    "fun/overleaf/index.html#end", "fun/overleaf/index.html#demo-edit", "fun/overleaf/index.html#demo-error",
    "fun/overleaf/index.html#history",
    # kitchen
    "fun/kitchen/index.html", "fun/kitchen/index.html#kitchen", "fun/kitchen/index.html#home", "fun/kitchen/index.html#research",
    "fun/kitchen/index.html#talks", "fun/kitchen/index.html#experience", "fun/kitchen/index.html#cv", "fun/kitchen/index.html#art",
    "fun/kitchen/index.html#recipe-book", "fun/kitchen/index.html#fried-rice", "fun/kitchen/index.html#finale",
    "fun/kitchen/index.html#about", "fun/kitchen/index.html?sky=night#kitchen",
    # minesweeper (on the XP desktops)
    "fun/paint/index.html?minesweeper=spec#home", "fun/powerpoint/index.html?minesweeper=scooped",
    "fun/overleaf/index.html?minesweeper=seminar", "fun/paint/index.html?minesweeper=rain&ms-demo=lost#home",
    # go-live pages
    "privacy.html", "404.html",
]

SIZES = [(1440, 900), (1366, 768), (1280, 720), (768, 1024), (390, 844)]


def file_url(state):
    path, _, frag = state.partition("#")
    path, _, query = path.partition("?")
    return (SITE / path).resolve().as_uri() + ("?" + query if query else "") + ("#" + frag if frag else "")


def http_url(state, port=8765):
    return "http://127.0.0.1:%d/%s" % (port, state)


def slug(state):
    return state.replace("/", "_").replace("#", "__").replace("+", "_").replace("?", "_").replace("&", "_").replace("=", "-").replace(".html", "")
