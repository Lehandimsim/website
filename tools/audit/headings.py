"""Per state: document title, lang, number of h1s, heading outline (first 12), landmarks."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cdp import Browser  # noqa: E402
from states import STATES, file_url  # noqa: E402

PROBE = r"""
(() => {
  const vis = e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length) && !e.closest('[aria-hidden="true"],[hidden],[inert]');
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(vis);
  const lm = [...document.querySelectorAll('main,[role=main],nav,[role=navigation],header,footer,aside,[role=banner],[role=contentinfo],[role=complementary],[role=region],section[aria-label],section[aria-labelledby]')].filter(vis).map(e => (e.getAttribute('role') || e.tagName.toLowerCase()));
  return {title: document.title, lang: document.documentElement.lang, h1: hs.filter(h => h.tagName === 'H1').length,
          outline: hs.slice(0, 12).map(h => h.tagName[1] + ':' + h.textContent.trim().slice(0, 22)).join(' | '), main: lm.filter(x => x === 'main').length};
})()
"""
seen = set()
with Browser() as b:
    p = b.page()
    p.viewport(1440, 900)
    for st in STATES:
        p.goto(file_url(st), settle=1.6)
        r = p.eval(PROBE)
        print("%-42s lang=%s h1=%d main=%d title=%r\n      %s" % (st, r["lang"], r["h1"], r["main"], r["title"], r["outline"]))
