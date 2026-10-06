"""Core user flows, driven with real (CDP) mouse and keyboard input. Prints PASS/FAIL lines.
    python flows.py [classic|paint|powerpoint|overleaf|xp|all]
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import file_url  # noqa: E402

RESULTS = []


def check(name, ok, info=""):
    RESULTS.append((name, bool(ok), info))
    print(("PASS " if ok else "FAIL ") + name + ("  -- " + str(info) if info not in ("", None) else ""), flush=True)


def act(p):
    return p.eval("(() => { const a = document.activeElement; if (!a) return ''; return a.tagName.toLowerCase() + (a.id ? '#' + a.id : '') + (typeof a.className === 'string' && a.className ? '.' + a.className.split(' ').join('.') : '') + ' [' + ((a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 30)) + ']'; })()")


def click_sel(p, sel):
    r = p.eval("(() => { const e = document.querySelector(%r); if (!e) return null; e.scrollIntoView({block:'nearest'}); const r = e.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; })()" % sel)
    if not r:
        raise RuntimeError("no element " + sel)
    p.click(r[0], r[1])
    p.pump(0.3)


def tab_until(p, sel, n=80, shift=False):
    for _ in range(n):
        p.key("Tab", modifiers=8 if shift else 0)
        if p.eval("!!(document.activeElement && document.activeElement.matches(%r))" % sel):
            return True
    return False


def modal_open(p):
    return p.eval("!!document.querySelector('.xp-modal')")


def dialog_trap(p, label):
    """With an XP dialog open, Tab 8 times: does focus stay inside it?"""
    escaped = []
    for _ in range(8):
        p.key("Tab")
        inside = p.eval("!!(document.activeElement && document.activeElement.closest('.xp-modal'))")
        if not inside:
            escaped.append(act(p))
    check(label + ": Tab stays inside the dialog", not escaped, "focus escaped to " + "; ".join(escaped[:3]) if escaped else "")


# ---------------------------------------------------------------- classic
def classic(b):
    p = b.page()
    p.viewport(1440, 900)
    p.goto(file_url("classic/research.html"))
    n = p.eval("document.querySelectorAll('details.abstract').length")
    click_sel(p, "details.abstract summary")
    check("classic: abstract toggle opens on click", p.eval("document.querySelector('details.abstract').open"), "%d abstracts" % n)
    p.key("Enter")
    check("classic: abstract toggle closes with Enter (focused summary)", not p.eval("document.querySelector('details.abstract').open"))
    # Try a fun version menu
    tab_until(p, "#fun-toggle")
    p.key("Enter")
    p.pump(0.2)
    check("classic: fun menu opens with Enter", p.eval("!document.getElementById('fun-list').hidden") and p.eval("document.getElementById('fun-toggle').getAttribute('aria-expanded')") == "true")
    p.key("ArrowDown")
    p.pump(0.1)
    check("classic: ArrowDown on open menu moves into it", p.eval("document.getElementById('fun-list').contains(document.activeElement)"), act(p))
    p.key("Escape")
    p.pump(0.1)
    check("classic: Esc closes the menu and returns focus", p.eval("document.getElementById('fun-list').hidden") and p.eval("document.activeElement.id") == "fun-toggle", act(p))
    p.key("Enter")
    for _ in range(6):
        p.key("Tab")
    still = p.eval("!document.getElementById('fun-list').hidden")
    check("classic: menu closes when focus Tabs out of it", not still, "menu still open with focus on " + act(p) if still else "")
    p.key("Escape")
    # skip link
    p.goto(file_url("classic/talks.html"))
    p.key("Tab")
    check("classic: first Tab = visible skip link", p.eval("document.activeElement.className") == "skip" and p.eval("document.activeElement.getBoundingClientRect().left") >= 0)
    p.key("Enter")
    p.pump(0.2)
    p.key("Tab")
    check("classic: skip link moves focus into main", p.eval("!!document.activeElement.closest('main')"), act(p))
    # research.html#paper-2 opens abstract 2
    p.goto(file_url("classic/research.html#paper-2"))
    check("classic: #paper-2 opens its abstract", p.eval("document.querySelector('#paper-2 details').open"))
    check("classic: no JS errors", not p.errors, p.errors[:3])
    # headings
    for pg in ("index", "research", "talks", "experience", "cv", "art"):
        p.goto(file_url("classic/%s.html" % pg), settle=0.8)
        hs = p.eval("[...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName).join(' ')")
        h1 = p.eval("document.querySelectorAll('h1').length")
        jumps = p.eval("(() => { let prev = 1, bad = []; for (const h of document.querySelectorAll('h1,h2,h3,h4')) { const l = +h.tagName[1]; if (l > prev + 1) bad.push(h.tagName + ':' + h.textContent.slice(0,30)); prev = l; } return bad; })()")
        check("classic %s: one h1, no skipped heading levels" % pg, h1 == 1 and not jumps, "%s | %s | %s" % (p.eval("document.title"), hs[:60], jumps))


# ---------------------------------------------------------------- paint
def paint(b):
    p = b.page()
    p.viewport(1440, 900)
    p.goto(file_url("fun/paint/index.html"), settle=1.8)
    click_sel(p, ".pt-startbtn")
    p.pump(0.8)
    check("paint: start button opens #home", p.eval("location.hash") == "#home", p.eval("location.hash"))
    click_sel(p, ".pt-enter")
    p.pump(0.6)
    check("paint: Enter key image goes to #research", p.eval("location.hash") == "#research")
    check("paint: focus moved to the page title", p.eval("document.activeElement.tagName") == "H1", act(p))
    # abstract popup via keyboard
    tab_until(p, 'button[data-act="abstract"]')
    p.key("Enter")
    p.pump(0.4)
    check("paint: Abstract opens a dialog", modal_open(p))
    check("paint: focus starts inside the dialog", p.eval("!!document.activeElement.closest('.xp-modal')"), act(p))
    dialog_trap(p, "paint abstract")
    p.key("Escape")
    p.pump(0.3)
    check("paint: Esc closes the abstract", not modal_open(p))
    check("paint: focus returns to the Abstract button", p.eval("document.activeElement.getAttribute('data-act')") == "abstract", act(p))
    # Alt+letter tabs
    p.key("t", code="KeyT", keycode=84, modifiers=1)
    p.pump(0.5)
    check("paint: Alt+T opens Talks", p.eval("location.hash") == "#talks", p.eval("location.hash"))
    # paint canvas
    p.goto(file_url("fun/paint/index.html#paint"), settle=1.5)
    r = p.eval("(() => { const c = document.querySelector('canvas.pt-bitmap'); const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; })()")
    x0, y0 = r[0] + 40, r[1] + 40
    p.send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x0, "y": y0})
    p.send("Input.dispatchMouseEvent", {"type": "mousePressed", "x": x0, "y": y0, "button": "left", "buttons": 1, "clickCount": 1})
    for i in range(1, 12):
        p.send("Input.dispatchMouseEvent", {"type": "mouseMoved", "x": x0 + i * 10, "y": y0 + i * 6, "button": "left", "buttons": 1})
    p.send("Input.dispatchMouseEvent", {"type": "mouseReleased", "x": x0 + 110, "y": y0 + 66, "button": "left", "buttons": 0, "clickCount": 1})
    p.pump(0.3)
    check("paint: drawing enables Undo", p.eval("!document.querySelector('[data-do=undo]').disabled"))
    click_sel(p, "[data-do=undo]")
    check("paint: Undo works (Undo disabled again, Redo enabled)", p.eval("document.querySelector('[data-do=undo]').disabled && !document.querySelector('[data-do=redo]').disabled"))
    click_sel(p, "[data-do=redo]")
    click_sel(p, "[data-do=save]")
    p.pump(0.3)
    check("paint: Save opens the send dialog with the name box focused", modal_open(p) and p.eval("document.activeElement.id") == "pt-send-name", act(p))
    dialog_trap(p, "paint save")
    p.key("Escape")
    p.pump(0.3)
    check("paint: Esc cancels Save; focus back on Save button", not modal_open(p) and p.eval("document.activeElement.getAttribute('data-do')") == "save", act(p))
    click_sel(p, "[data-do=save]")
    p.pump(0.2)
    p.eval("document.getElementById('pt-send-name').value = 'Audit'")
    click_sel(p, ".xp-modal .xp-dialog-buttons button")   # Save and send
    p.pump(0.8)
    txt = p.eval("(document.querySelector('.xp-modal .xp-dialog-text')||{}).textContent || ''")
    check("paint: Save and send shows the stub (not sent: mockup) message", "not connected" in txt or "mockup" in txt.lower(), txt[:90])
    p.key("Escape")
    check("paint: no JS errors in flows", not p.errors, p.errors[:3])


# ---------------------------------------------------------------- powerpoint
def powerpoint(b):
    p = b.page()
    p.viewport(1440, 900)
    p.goto(file_url("fun/powerpoint/index.html"), settle=2)
    tab_until(p, "#pp-hero")
    p.key("Enter")
    p.pump(0.6)
    check("ppt: From Beginning (keyboard) starts the show", p.eval("!document.getElementById('pp-show').hidden"))
    check("ppt: focus moves into the show", p.eval("document.getElementById('pp-show').contains(document.activeElement)"), act(p))
    n = p.eval("document.getElementById('pp-show-count').textContent")
    seen = []
    for i in range(12):
        p.key("ArrowRight")
        p.key("ArrowRight")    # first press may only finish the slide's animations
        p.pump(0.15)
        seen.append(p.eval("location.hash"))
        if p.eval("!document.getElementById('pp-show-end').hidden"):
            break
    check("ppt: arrow keys reach the end screen", p.eval("!document.getElementById('pp-show-end').hidden"), " ".join(seen))
    live = p.eval("document.getElementById('pp-live').textContent")
    check("ppt: live region announces", bool(live), live)
    p.key("ArrowRight")
    p.pump(0.5)
    check("ppt: next on end screen exits the show", p.eval("document.getElementById('pp-show').hidden"))
    check("ppt: focus returns to From Beginning", p.eval("document.activeElement.id") == "pp-hero", act(p))
    # Esc mid-show
    p.key("F5", keycode=116, code="F5")
    p.pump(0.5)
    started = p.eval("!document.getElementById('pp-show').hidden")
    p.key("ArrowRight")
    p.key("Escape")
    p.pump(0.4)
    check("ppt: F5 starts, Esc ends the show", started and p.eval("document.getElementById('pp-show').hidden"))
    # Tab inside the show: where does focus go?
    p.goto(file_url("fun/powerpoint/index.html#show"), settle=2)
    stops = []
    for _ in range(8):
        p.key("Tab")
        stops.append(act(p)[:50])
    check("ppt: Tab during the show stays in the show or taskbar", all(("pp-" in s and "strip" in s) or "xp-" in s or "pp-show" in s or "a." in s or "a " in s for s in stops), " | ".join(stops))
    # XP help dialog in PowerPoint: focus trap?
    p.goto(file_url("fun/powerpoint/index.html"), settle=2)
    click_sel(p, ".xp-tray-btn")
    p.pump(0.3)
    check("ppt: tray ? opens Help with focus on its button", modal_open(p) and p.eval("!!document.activeElement.closest('.xp-modal')"), act(p))
    dialog_trap(p, "ppt help")
    p.key("Escape")
    p.pump(0.2)
    check("ppt: Esc closes Help, focus back on ?", not modal_open(p) and p.eval("document.activeElement.classList.contains('xp-tray-btn')"), act(p))
    check("ppt: no JS errors", not p.errors, p.errors[:3])


# ---------------------------------------------------------------- overleaf
def overleaf(b):
    p = b.page()
    p.viewport(1440, 900)
    p.goto(file_url("fun/overleaf/index.html"), settle=2)
    p.eval("window.__printed = 0; window.print = function () { window.__printed++; }")
    files = p.eval("[...document.querySelectorAll('#ol-tree button[data-file]')].map(b => b.getAttribute('data-file'))")
    bad = []
    for f in files:
        click_sel(p, '#ol-tree button[data-file="%s"]' % f)
        p.pump(0.2)
        cur = p.eval("(document.querySelector('.ol-code-input')||{}).value || (document.getElementById('ol-imageview-img')||{}).src || ''")
        if not cur:
            bad.append(f)
    check("overleaf: every file opens", not bad, "%d files; empty: %s" % (len(files), bad))
    click_sel(p, '#ol-tree button[data-file="research.tex"]')
    p.eval("(() => { const t = document.querySelector('.ol-code-input'); t.focus(); t.setSelectionRange(0, 0); })()")
    p.send("Input.insertText", {"text": "% audit edit\n"})
    p.pump(0.2)
    p.key("Enter", modifiers=2)   # Ctrl+Enter
    p.pump(1.5)
    check("overleaf: Ctrl+Enter recompiles (History has an entry)", p.eval("document.querySelectorAll('#ol-history .ol-hist, #ol-history details').length") > 0,
          p.eval("document.getElementById('ol-history').textContent.slice(0,80)"))
    # keyboard: Tab inside the editor, Esc then Tab leaves
    p.eval("document.querySelector('.ol-code-input').focus()")
    p.key("Tab")
    in_editor = p.eval("document.activeElement.classList.contains('ol-code-input')")
    p.key("Escape")
    p.key("Tab")
    left = not p.eval("document.activeElement.classList.contains('ol-code-input')")
    check("overleaf: Tab indents inside the editor; Esc then Tab leaves it", in_editor and left, act(p))
    # The visible hint is .ol-code-hint: shown to keyboard users while the editor has focus
    HINT = "(() => { const h = document.querySelector('.ol-code-hint'); if (!h) return 'none'; const r = h.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? 'visible: ' + h.textContent : 'hidden'; })()"
    xy = p.eval("(() => { const r = document.querySelector('.ol-code-scroll').getBoundingClientRect(); return [r.left + 160, r.top + 60]; })()")
    p.click(xy[0], xy[1])
    p.pump(0.2)
    after_click = p.eval(HINT) + " / focus: " + act(p)
    check("overleaf: no hint after a mouse click into the editor", after_click.startswith("hidden / focus: textarea"), after_click)
    p.key("Tab")
    visible_hint = p.eval(HINT)
    check("overleaf: the Esc-then-Tab hint is visible to sighted keyboard users", visible_hint.startswith("visible"), visible_hint)
    p.key("Escape")
    p.key("Tab", modifiers=8)    # Shift+Tab back into the editor after leaving it: arrives by keyboard
    p.key("Tab")
    arrived = p.eval("document.activeElement.classList.contains('ol-code-input')")
    check("overleaf: hint shown when the editor is reached with Tab", arrived and p.eval(HINT).startswith("visible"), act(p))
    p.key("Escape")
    p.key("Tab")
    gone = p.eval("(() => { const h = document.querySelector('.ol-code-hint'); return h.getBoundingClientRect().width === 0; })()")
    check("overleaf: the hint goes away when focus leaves the editor", gone, act(p))
    click_sel(p, "#ol-print-btn")
    p.pump(0.4)
    check("overleaf: Download PDF calls window.print()", p.eval("window.__printed") == 1)
    click_sel(p, "#ol-history-btn")
    click_sel(p, "#ol-history-btn")
    click_sel(p, "#ol-logs-btn")
    check("overleaf: Logs opens", p.eval("!document.getElementById('ol-logs').hidden"))
    # restore dialog trap
    click_sel(p, "#ol-restore-btn")
    p.pump(0.3)
    if modal_open(p):
        dialog_trap(p, "overleaf restore")
        p.key("Escape")
    # menu dialog
    click_sel(p, "#ol-menu-btn")
    p.pump(0.3)
    check("overleaf: Menu opens and takes focus", p.eval("!document.getElementById('ol-menu').hidden") and p.eval("document.getElementById('ol-menu').contains(document.activeElement)"), act(p))
    p.key("Escape")
    p.pump(0.2)
    check("overleaf: Esc closes Menu, focus back on Menu button", p.eval("document.getElementById('ol-menu').hidden") and p.eval("document.activeElement.id") == "ol-menu-btn", act(p))
    # demo-error: error announced?
    p.goto(file_url("fun/overleaf/index.html#demo-error"), settle=2.5)
    check("overleaf: #demo-error shows the error bar (role=alert)", p.eval("!document.getElementById('ol-errorbar').hidden"), p.eval("document.getElementById('ol-errorbar').textContent.slice(0,90)"))
    check("overleaf: no JS errors", not p.errors, p.errors[:3])


# ---------------------------------------------------------------- xp shell (in Paint)
def xp(b):
    p = b.page()
    p.viewport(1440, 900)
    p.goto(file_url("fun/paint/index.html#home"), settle=1.8)
    click_sel(p, ".xp-start")
    check("xp: start opens the menu, focus on first item", p.eval("document.getElementById('xp-startmenu').classList.contains('is-open')") and p.eval("document.activeElement.classList.contains('xp-sm-item')"), act(p))
    p.key("ArrowDown")
    p.pump(0.1)
    a1 = act(p)
    check("xp: arrow keys move inside the start menu", "xp-sm-item" in a1 and a1 != "", a1)
    p.key("Escape")
    check("xp: Esc closes start menu, focus back on start", not p.eval("document.getElementById('xp-startmenu').classList.contains('is-open')") and p.eval("document.activeElement.classList.contains('xp-start')"), act(p))
    p.key("Escape", modifiers=2)
    check("xp: Ctrl+Esc opens the start menu", p.eval("document.getElementById('xp-startmenu').classList.contains('is-open')"))
    for _ in range(25):
        p.key("Tab")
    still = p.eval("document.getElementById('xp-startmenu').classList.contains('is-open')")
    inside = p.eval("document.getElementById('xp-startmenu').contains(document.activeElement)")
    check("xp: start menu closes when focus leaves it", not still or inside, "still open, focus on " + act(p) if still and not inside else "")
    p.key("Escape")
    # minimise / restore
    click_sel(p, '#paint .xp-tbtn[data-act="min"]')
    mini = p.eval("document.getElementById('paint').classList.contains('is-minimized')")
    focus_after_min = act(p)
    click_sel(p, ".xp-taskbtn")
    check("xp: minimise hides the window, taskbar button restores it", mini and not p.eval("document.getElementById('paint').classList.contains('is-minimized')"), "focus after minimise: " + focus_after_min)
    click_sel(p, '#paint .xp-tbtn[data-act="max"]')
    mx = p.eval("document.getElementById('paint').classList.contains('is-maximized')")
    lbl = p.eval("document.querySelector('#paint .xp-tbtn[data-act=max]').getAttribute('aria-label')")
    click_sel(p, '#paint .xp-tbtn[data-act="max"]')
    check("xp: maximise toggles (label becomes Restore Down)", mx and lbl == "Restore Down")
    p.eval("document.querySelector('#paint .xp-tbtn[data-act=close]').focus()")
    p.key("Enter")
    p.pump(0.3)
    closed = p.eval("document.getElementById('paint').hidden")
    check("xp: close hides the window and shows the reopen balloon", closed and p.eval("!!document.querySelector('.xp-balloon')"), "focus after close: " + act(p))
    # desktop icon (button) opens with Enter; Space?
    p.eval("document.querySelector('.xp-icon[data-open=paint]').focus()")
    p.key(" ")
    p.pump(0.2)
    space_opens = not p.eval("document.getElementById('paint').hidden")
    p.key("Enter")
    p.pump(0.2)
    check("xp: desktop icon opens with Enter", not p.eval("document.getElementById('paint').hidden"))
    check("xp: desktop icon (a <button>) opens with Space", space_opens)
    # balloon: Esc?
    p.eval("XP.balloon({title: 't', text: 'x', timeout: 0})")
    p.key("Escape")
    check("xp: Esc dismisses a balloon tip", not p.eval("!!document.querySelector('.xp-balloon')"))
    check("xp: no JS errors", not p.errors, p.errors[:3])


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    with Browser() as b:
        for name, fn in (("classic", classic), ("paint", paint), ("powerpoint", powerpoint), ("overleaf", overleaf), ("xp", xp)):
            if which in ("all", name):
                try:
                    fn(b)
                except Exception as e:
                    check(name + ": harness", False, repr(e)[:200])
    print("\n%d passed, %d failed" % (sum(1 for r in RESULTS if r[1]), sum(1 for r in RESULTS if not r[1])))
