/* ==========================================================================
   fun/powerpoint/icons.js — the icons of the PowerPoint 2007 homage.

   Every icon is an original drawing (no Microsoft artwork): small SVGs on a
   32x32 grid (big ribbon buttons, the Office menu) or a 16x16 grid (small
   buttons, toolbars, the status bar).

     PP_ICONS["ss-begin"]   -> '<svg viewBox="0 0 32 32">...</svg>'
     PP_ICON_DEFS           -> one hidden <svg> holding the shared gradients
                               (url(#pp-g-blue) etc.); powerpoint.js adds it to
                               the page once.

   To change an icon, edit its string below. To add one, add a key and use
   that key as `icon:` in ribbon.js.
   ========================================================================== */

(function () {
  "use strict";

  // ---------- Shared gradients (top colour -> bottom colour) ----------
  var GRADIENTS = {
    page:   ["#ffffff", "#e3ebf6"],   // paper
    screen: ["#ffffff", "#d9e6f7"],   // projector screen
    blue:   ["#a3cdf8", "#2c6cc7"],
    blue2:  ["#e2f0fd", "#8fbbea"],   // pale blue (skies, photos)
    green:  ["#b9e98f", "#3a9824"],
    orange: ["#ffd394", "#ee7a17"],
    red:    ["#ffb09b", "#cf381a"],
    gold:   ["#fff5b8", "#f1b934"],
    grey:   ["#fcfcfc", "#b3bcc8"],
    yellow: ["#fffcd8", "#f5dc6e"],   // sticky-note comments
    purple: ["#e6cff8", "#8452c4"],
    brown:  ["#eabd80", "#a5672a"]
  };

  var defs = "";
  Object.keys(GRADIENTS).forEach(function (id) {
    defs += '<linearGradient id="pp-g-' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + GRADIENTS[id][0] + '"/>' +
      '<stop offset="1" stop-color="' + GRADIENTS[id][1] + '"/></linearGradient>';
  });
  // Left-to-right fades, for the transition gallery pictures.
  defs += '<linearGradient id="pp-g-fadeh" x1="0" y1="0" x2="1" y2="0"><stop offset=".15" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="pp-g-blackh" x1="0" y1="0" x2="1" y2="0"><stop offset=".15" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>';
  window.PP_ICON_DEFS =
    '<svg class="pp-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' + defs + "</defs></svg>";

  // ---------- Small drawing helpers ----------
  function svg(size, body) {
    return '<svg viewBox="0 0 ' + size + " " + size + '">' + body + "</svg>";
  }
  function s32(body) { return svg(32, body); }
  function s16(body) { return svg(16, body); }

  // Text inside an icon (B, I, U, ABC...). Arial is on every Windows/Mac machine.
  function txt(x, y, text, size, extra) {
    return '<text x="' + x + '" y="' + y + '" font-family="Arial,Helvetica,sans-serif" font-size="' + size + '" ' +
      (extra || 'fill="#1f3f73"') + ">" + text + "</text>";
  }

  // A projector screen on a tripod (32 grid), with `inner` drawn on it.
  function screen(inner) {
    return '<path d="M16 21.5v4.3m0 0-5 4.6m5-4.6 5 4.6" stroke="#6b7789" stroke-width="1.5" stroke-linecap="round" fill="none"/>' +
      '<rect x="3.5" y="4.5" width="25" height="17" fill="url(#pp-g-screen)" stroke="#3a67ad"/>' +
      '<rect x="2" y="2.5" width="28" height="3" rx="1.5" fill="url(#pp-g-blue)" stroke="#2c5797" stroke-width=".8"/>' +
      (inner || "");
  }
  // Green "play" badge, bottom right of a 32 icon.
  var PLAY = '<circle cx="23" cy="17.8" r="6.3" fill="url(#pp-g-green)" stroke="#2d7b1d"/><path d="M21.1 14.6v6.4l5.3-3.2z" fill="#fff"/>';
  // Grey gear badge, bottom right of a 32 icon.
  var GEAR = '<circle cx="23" cy="17.8" r="4.7" fill="none" stroke="#66768b" stroke-width="3.2" stroke-dasharray="2.1 1.6"/>' +
    '<circle cx="23" cy="17.8" r="4" fill="url(#pp-g-grey)" stroke="#5a687c"/><circle cx="23" cy="17.8" r="1.6" fill="#fff" stroke="#5a687c" stroke-width=".8"/>';
  // Lines of "text" on a slide or page.
  function lines(x, y, w, n, gap, colour) {
    var d = "";
    for (var i = 0; i < n; i++) d += "M" + x + " " + (y + i * gap) + "h" + (i === n - 1 ? Math.round(w * 0.7) : w);
    return '<path d="' + d + '" stroke="' + (colour || "#9db8dc") + '" stroke-width="1.3"/>';
  }
  // A small slide (16 grid) with a title bar, plus `inner`.
  function slide16(inner) {
    return '<rect x="1.5" y="3.5" width="13" height="10" fill="url(#pp-g-page)" stroke="#5274a8"/><rect x="3" y="5" width="10" height="2" fill="#a9c6ee"/>' + (inner || "");
  }
  // A document page with a folded corner (32 grid).
  var PAGE = '<path d="M7.5 3.5h12l6 6v19h-18z" fill="url(#pp-g-page)" stroke="#6f87ab"/><path d="M19.5 3.5v6h6" fill="#dfe8f5" stroke="#6f87ab"/>';
  // A yellow comment note (32 grid).
  var NOTE = '<path d="M4.5 5.5h22v15h-11l-6 6v-6h-5z" fill="url(#pp-g-yellow)" stroke="#b39223" stroke-linejoin="round"/>';
  // Magnifying glass (32 grid).
  var LENS = '<circle cx="13" cy="13" r="8" fill="url(#pp-g-blue2)" fill-opacity=".9" stroke="#2c5797" stroke-width="2.2"/><path d="M19 19l8 8" stroke="#2c5797" stroke-width="3.6" stroke-linecap="round"/><path d="M8.5 11a5 5 0 0 1 4-4" stroke="#fff" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  // Horizontal text lines, 16 grid, for the paragraph buttons.
  function para(rows) {
    return '<path d="' + rows + '" stroke="#3f4f66" stroke-width="1.2"/>';
  }

  window.PP_ICONS = {

    // ---------- Quick Access Toolbar ----------
    save: s16('<path d="M1.5 2.5h11l2 2v9h-13z" fill="url(#pp-g-blue)" stroke="#1d4e9a"/><rect x="4" y="2.5" width="7" height="4.5" fill="url(#pp-g-grey)" stroke="#1d4e9a" stroke-width=".8"/><rect x="8.4" y="3.3" width="1.6" height="2.9" fill="#1d4e9a"/><rect x="3.5" y="8.8" width="9" height="4.7" fill="#fff" stroke="#1d4e9a" stroke-width=".8"/><path d="M5 10.5h6M5 12h4" stroke="#9db8dc" stroke-width=".8"/>'),
    undo: s16('<path d="M5.5 6.5h4.5a3.5 3.5 0 0 1 0 7H7" fill="none" stroke="#2c65b8" stroke-width="2" stroke-linecap="round"/><path d="M1.2 6.5 5.8 2.6v7.8z" fill="#2c65b8"/>'),
    redo: s16('<path d="M10.5 6.5H6a3.5 3.5 0 0 0 0 7h3" fill="none" stroke="#2c65b8" stroke-width="2" stroke-linecap="round"/><path d="M14.8 6.5 10.2 2.6v7.8z" fill="#2c65b8"/>'),
    "qat-show": s16('<rect x="1.5" y="2.5" width="13" height="9" fill="url(#pp-g-screen)" stroke="#3a67ad"/><path d="M6.6 4.6v5l4.1-2.5z" fill="#2f8f1f"/><path d="M8 11.5v3M5.5 14.5h5" stroke="#6b7789"/>'),
    "qat-more": s16('<path d="M4.5 5.5h7" stroke="#3b4a60" stroke-width="1.2"/><path d="M4.5 8h7L8 11.5z" fill="#3b4a60"/>'),

    // ---------- Slide Show tab ----------
    "ss-begin": s32(screen(txt(9.6, 17.2, "1", 11.5, 'font-weight="bold" fill="#2c5797" text-anchor="middle"') + '<path d="M6 8.3h7" stroke="#9db8dc" stroke-width="1.3"/>' + PLAY)),
    "ss-current": s32(screen('<rect x="6" y="7.5" width="10" height="7.5" fill="#fff" stroke="#ee8a1e" stroke-width="1.5"/>' + lines(8, 10, 6, 2, 2.5) + PLAY)),
    "ss-custom": s32(screen('<rect x="6" y="7.3" width="6.5" height="5" fill="#fff" stroke="#5b7fb4"/><rect x="14.5" y="7.3" width="6.5" height="5" fill="#fff" stroke="#5b7fb4"/><rect x="6" y="14.3" width="6.5" height="5" fill="#fff" stroke="#ee8a1e"/><rect x="14.5" y="14.3" width="6.5" height="5" fill="#fff" stroke="#5b7fb4"/><path d="M23.5 8.5h3M23.5 11h3M23.5 13.5h3" stroke="#9db8dc"/>')),
    "ss-setup": s32(screen(lines(6, 9, 11, 3, 3) + GEAR)),
    "hide-slide": s16(slide16('<path d="M3 15 14 2" stroke="#cf381a" stroke-width="1.7" stroke-linecap="round"/>')),
    "hide-slide-big": s32('<rect x="3.5" y="6.5" width="25" height="19" fill="url(#pp-g-page)" stroke="#5274a8" stroke-dasharray="2.5 1.5"/><rect x="6" y="9" width="20" height="3.5" fill="#bcd3f0"/>' + lines(6.5, 16, 15, 3, 3) + '<rect x="17.5" y="15.5" width="11" height="11" fill="#fff" stroke="#5274a8"/><path d="M19.5 24.5l7-7" stroke="#cf381a" stroke-width="2" stroke-linecap="round"/>'),
    narration: s16('<rect x="5.5" y="1.5" width="5" height="8" rx="2.5" fill="url(#pp-g-grey)" stroke="#556070"/><path d="M6 4h4M6 6h4" stroke="#8a95a5" stroke-width=".7"/><path d="M3.5 7.5a4.5 4.5 0 0 0 9 0" fill="none" stroke="#556070" stroke-width="1.2"/><path d="M8 12v2.5M5.5 14.5h5" stroke="#556070" stroke-width="1.2"/>'),
    rehearse: s16('<circle cx="8" cy="9" r="5.6" fill="#fff" stroke="#3f62a0" stroke-width="1.2"/><path d="M8 9V5.6M8 9l2.3 1.5" stroke="#cf381a" stroke-width="1.2" stroke-linecap="round"/><rect x="6.3" y="1" width="3.4" height="2" rx=".5" fill="#3f62a0"/><path d="M12.4 4.1 13.6 2.9" stroke="#3f62a0" stroke-width="1.4"/>'),
    monitor: s16('<rect x="1.5" y="2.5" width="13" height="9" rx="1" fill="url(#pp-g-screen)" stroke="#3f62a0"/><path d="M8 11.5v2.5M5 14.5h6" stroke="#3f62a0" stroke-width="1.2"/>'),
    "show-on": s16('<rect x="1" y="2.5" width="8.5" height="6.5" fill="url(#pp-g-screen)" stroke="#3f62a0"/><rect x="6.5" y="6.5" width="8.5" height="6.5" fill="url(#pp-g-screen)" stroke="#3f62a0"/><path d="M10.7 13v1.5M8.7 14.5h4" stroke="#3f62a0"/>'),

    // ---------- Home tab ----------
    paste: s32('<rect x="3.5" y="5.5" width="19" height="23" rx="2" fill="url(#pp-g-brown)" stroke="#7a4d18"/><rect x="7" y="9" width="12" height="16" fill="#fff" stroke="#a88a62" stroke-width=".8"/><rect x="8.5" y="2.5" width="9" height="5" rx="1.5" fill="url(#pp-g-grey)" stroke="#556070"/><path d="M14.5 13.5h10l3 3v13h-13z" fill="url(#pp-g-page)" stroke="#4f6f9f"/>' + lines(17, 18.5, 8, 3, 3)),
    cut: s16('<path d="M5 1.5 10.2 10.5M11 1.5 5.8 10.5" stroke="#6b7789" stroke-width="1.3" stroke-linecap="round"/><circle cx="4.6" cy="12.4" r="2.2" fill="none" stroke="#c4342c" stroke-width="1.4"/><circle cx="11.4" cy="12.4" r="2.2" fill="none" stroke="#c4342c" stroke-width="1.4"/>'),
    copy: s16('<path d="M1.5 1.5h6l2 2v7h-8z" fill="#fff" stroke="#6f87ab"/><path d="M6.5 5.5h6l2 2v7h-8z" fill="url(#pp-g-page)" stroke="#45679b"/><path d="M8 9h5M8 11h5M8 13h3" stroke="#9db8dc"/>'),
    painter: s16('<rect x="1.5" y="1.5" width="11" height="4.5" rx="1" fill="url(#pp-g-gold)" stroke="#a37b16"/><path d="M12.5 3.8h2v4H8v2" fill="none" stroke="#6b7789" stroke-width="1.1"/><rect x="6.8" y="9.5" width="2.4" height="5.5" rx=".8" fill="#9a6a2a" stroke="#6c4718" stroke-width=".7"/>'),
    "new-slide": s32('<rect x="3.5" y="8.5" width="23" height="18" fill="url(#pp-g-page)" stroke="#4b6fa5"/><rect x="6" y="11" width="18" height="4" fill="#bcd3f0"/>' + lines(6, 18.5, 12, 2, 3) + '<path d="M25 1.5l1.5 3.9 3.9 1.5-3.9 1.5L25 12.3l-1.5-3.9-3.9-1.5 3.9-1.5z" fill="url(#pp-g-gold)" stroke="#c48a0e" stroke-width=".8"/>'),
    layout: s16('<rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#4b6fa5"/><rect x="3" y="4" width="10" height="2" fill="#f0a030"/><rect x="3" y="7.5" width="4.5" height="4.5" fill="#bcd3f0"/><rect x="8.5" y="7.5" width="4.5" height="4.5" fill="#bcd3f0"/>'),
    reset: s16('<rect x="1.5" y="3.5" width="10" height="8" fill="#fff" stroke="#4b6fa5"/><path d="M14.3 10.2a3.6 3.6 0 1 1-1.3-3.6" fill="none" stroke="#2f8a2f" stroke-width="1.4"/><path d="M13.6 4.3v2.9h-2.9" fill="none" stroke="#2f8a2f" stroke-width="1.4"/>'),
    "delete-slide": s16('<rect x="1.5" y="3.5" width="11" height="8" fill="#fff" stroke="#4b6fa5"/><path d="M9.5 8.5l5 5M14.5 8.5l-5 5" stroke="#cf381a" stroke-width="1.9" stroke-linecap="round"/>'),

    "grow-font": s16(txt(0.5, 13.5, "A", 13, 'font-weight="bold" fill="#1f3f73"') + '<path d="M10.5 6.5 13 3l2.5 3.5z" fill="#2c65b8"/>'),
    "shrink-font": s16(txt(1, 13.5, "A", 10, 'font-weight="bold" fill="#1f3f73"') + '<path d="M10.5 3.5 13 7l2.5-3.5z" fill="#2c65b8"/>'),
    "clear-fmt": s16(txt(0.5, 12.5, "A", 11.5, 'font-weight="bold" fill="#1f3f73"') + '<path d="M9 14.5l2.5-5 4 2-1.5 3z" fill="#f4a0b4" stroke="#b5476a" stroke-width=".8" stroke-linejoin="round"/>'),
    bold: s16(txt(3.4, 12.6, "B", 12, 'font-weight="bold" fill="#1d1d1d"')),
    italic: s16(txt(5.2, 12.6, "I", 12.5, 'font-family="Georgia,serif" font-style="italic" font-weight="bold" fill="#1d1d1d"')),
    underline: s16(txt(3.3, 11.5, "U", 11, 'fill="#1d1d1d"') + '<path d="M3 14h10" stroke="#1d1d1d" stroke-width="1.2"/>'),
    "text-shadow": s16(txt(4.6, 13, "S", 12, 'font-weight="bold" fill="#a9b3c2"') + txt(3.4, 12, "S", 12, 'font-weight="bold" fill="#1d1d1d"')),
    strike: s16(txt(0.6, 11.5, "abc", 7.4, 'fill="#1d1d1d"') + '<path d="M0.5 8.4h15" stroke="#cf381a" stroke-width="1.1"/>'),
    spacing: s16(txt(1, 9.5, "AV", 7.6, 'font-weight="bold" fill="#1d1d1d"') + '<path d="M1.5 13h13M1.5 13l2-1.6M1.5 13l2 1.6M14.5 13l-2-1.6M14.5 13l-2 1.6" stroke="#2c65b8" fill="none"/>'),
    "change-case": s16(txt(0.3, 12.5, "Aa", 10.5, 'fill="#1d1d1d"')),
    "font-color": s16(txt(3.4, 11, "A", 11.5, 'font-weight="bold" fill="#1d1d1d"') + '<rect x="1.5" y="12.5" width="13" height="3" fill="#e32b1c"/>'),

    bullets: s16('<circle cx="2.8" cy="4" r="1.4" fill="#2c65b8"/><circle cx="2.8" cy="8" r="1.4" fill="#2c65b8"/><circle cx="2.8" cy="12" r="1.4" fill="#2c65b8"/>' + para("M6 4h9M6 8h9M6 12h9")),
    numbering: s16(txt(0.6, 6, "1", 5.5, 'fill="#2c65b8" font-weight="bold"') + txt(0.6, 10, "2", 5.5, 'fill="#2c65b8" font-weight="bold"') + txt(0.6, 14, "3", 5.5, 'fill="#2c65b8" font-weight="bold"') + para("M6 4h9M6 8h9M6 12h9")),
    "indent-less": s16(para("M1 2.5h14M8 6h7M8 9.5h7M1 13h14") + '<path d="M5.5 5.5 2 7.8l3.5 2.2z" fill="#2c65b8"/>'),
    "indent-more": s16(para("M1 2.5h14M8 6h7M8 9.5h7M1 13h14") + '<path d="M2 5.5l3.5 2.3L2 10z" fill="#2c65b8"/>'),
    "line-spacing": s16(para("M7 3.5h8M7 7h8M7 10.5h8M7 14h8") + '<path d="M3 2v12M3 2 1 4.5M3 2l2 2.5M3 14l-2-2.5M3 14l2-2.5" stroke="#2c65b8" fill="none"/>'),
    "align-left": s16(para("M1 2.5h14M1 6h9M1 9.5h14M1 13h9")),
    "align-center": s16(para("M1 2.5h14M3.5 6h9M1 9.5h14M3.5 13h9")),
    "align-right": s16(para("M1 2.5h14M6 6h9M1 9.5h14M6 13h9")),
    justify: s16(para("M1 2.5h14M1 6h14M1 9.5h14M1 13h14")),
    columns: s16(para("M1 2.5h6M1 6h6M1 9.5h6M1 13h6M9 2.5h6M9 6h6M9 9.5h6M9 13h4")),
    "text-dir": s16(txt(1.2, 9, "ab", 7.5, 'fill="#1d1d1d" transform="rotate(-90 5 7)"') + '<path d="M11 2v12M11 14l-2-2.5M11 14l2-2.5" stroke="#2c65b8" fill="none"/>'),
    "align-text": s16('<rect x="1.5" y="1.5" width="13" height="13" fill="#fff" stroke="#6f87ab"/>' + para("M4 6.5h8M4 9.5h8")),
    "to-smartart": s16('<rect x="1" y="2" width="6" height="4" rx="1" fill="url(#pp-g-green)" stroke="#2d7b1d" stroke-width=".8"/><rect x="9" y="2" width="6" height="4" rx="1" fill="url(#pp-g-green)" stroke="#2d7b1d" stroke-width=".8"/><rect x="5" y="10" width="6" height="4" rx="1" fill="url(#pp-g-green)" stroke="#2d7b1d" stroke-width=".8"/><path d="M4 6v2h8V6M8 8v2" fill="none" stroke="#2d7b1d" stroke-width=".9"/>'),

    arrange: s32('<rect x="3.5" y="3.5" width="15" height="13" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><rect x="9.5" y="9.5" width="15" height="13" fill="url(#pp-g-orange)" stroke="#b55d12"/><rect x="15.5" y="15.5" width="13" height="13" fill="url(#pp-g-green)" stroke="#2d7b1d"/>'),
    "quick-styles": s32('<rect x="2.5" y="5.5" width="17" height="13" rx="1.5" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><rect x="8.5" y="10.5" width="17" height="13" rx="1.5" fill="url(#pp-g-orange)" stroke="#b55d12"/><rect x="14.5" y="15.5" width="15" height="12" rx="1.5" fill="#fff" stroke="#556070"/>' + txt(16.4, 24.5, "Abc", 7.5, 'font-weight="bold" fill="#1f3f73"')),
    "shape-fill": s16('<path d="M3 7.5 7.5 3l5 5-4.5 4.5z" fill="url(#pp-g-grey)" stroke="#556070" stroke-linejoin="round"/><path d="M12.5 8.5c.8 1.3 1.6 2.3 1.6 3.1a1.6 1.6 0 0 1-3.2 0c0-.8.8-1.8 1.6-3.1z" fill="#2c65b8"/><rect x="1" y="13" width="14" height="2.5" fill="#f1b934"/>'),
    "shape-outline": s16('<path d="M3 11.5 11 3.5l2 2-8 8H3z" fill="url(#pp-g-gold)" stroke="#8a6512" stroke-linejoin="round"/><path d="M10 4.5l2 2" stroke="#8a6512"/><rect x="1" y="13" width="14" height="2.5" fill="#2c65b8"/>'),
    "shape-effects": s16('<rect x="2.5" y="2.5" width="11" height="10" rx="2.5" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><ellipse cx="6.5" cy="5" rx="3" ry="1.4" fill="#fff" opacity=".75"/><path d="M3.5 14.5h10" stroke="#9fb5d6" stroke-width="1.4" stroke-linecap="round"/>'),
    find: s16('<rect x="1.5" y="6" width="5" height="7.5" rx="2" fill="#4d5b70" stroke="#2b3443"/><rect x="9.5" y="6" width="5" height="7.5" rx="2" fill="#4d5b70" stroke="#2b3443"/><rect x="6" y="7.5" width="4" height="2.5" fill="#2b3443"/><rect x="2.5" y="2.5" width="3" height="4" fill="#7f8b9c"/><rect x="10.5" y="2.5" width="3" height="4" fill="#7f8b9c"/><circle cx="4" cy="11" r="1.4" fill="#9fd3ff"/><circle cx="12" cy="11" r="1.4" fill="#9fd3ff"/>'),
    replace: s16(txt(0.4, 7, "ab", 6.8, 'fill="#1d1d1d"') + txt(7.5, 15, "ac", 6.8, 'fill="#cf381a"') + '<path d="M9 3.5h3.5v4M12.5 7.5l-1.6-1.6M12.5 7.5l1.6-1.6" fill="none" stroke="#2c65b8"/>'),
    select: s16('<rect x="1.5" y="1.5" width="10" height="9" fill="none" stroke="#6f87ab" stroke-dasharray="1.6 1.2"/><path d="M7 6v9l2.2-2.2 1.7 3 1.3-.7-1.7-3h3z" fill="#fff" stroke="#1d1d1d" stroke-linejoin="round"/>'),

    // ---------- Insert tab ----------
    table: s32('<rect x="3.5" y="5.5" width="25" height="21" fill="#fff" stroke="#4b6fa5"/><rect x="3.5" y="5.5" width="25" height="5" fill="url(#pp-g-blue)" stroke="#4b6fa5"/><path d="M3.5 15.8h25M3.5 21.2h25M11.8 5.5v21M20.2 5.5v21" stroke="#7d9cc9"/>'),
    picture: s32('<rect x="3.5" y="5.5" width="25" height="21" fill="#fff" stroke="#66768b"/><rect x="6" y="8" width="20" height="16" fill="url(#pp-g-blue2)"/><circle cx="21" cy="12.5" r="2.3" fill="#ffd34d"/><path d="M6 24l6.5-8 4.5 5 3-3 6 6z" fill="url(#pp-g-green)"/>'),
    clipart: s32('<circle cx="16" cy="9.5" r="5" fill="#ffd9a1" stroke="#a5672a"/><path d="M7 29c0-6.5 4-11.5 9-11.5s9 5 9 11.5z" fill="url(#pp-g-orange)" stroke="#b25a10"/><path d="M14 8.6h.01M18 8.6h.01" stroke="#5a3a12" stroke-width="1.7" stroke-linecap="round"/><path d="M14 11.4a2.6 2.6 0 0 0 4 0" stroke="#5a3a12" fill="none"/><path d="M3 6l2.5 1M3.5 11l2.4-.6M29 6l-2.5 1M28.5 11l-2.4-.6" stroke="#f1b934" stroke-width="1.4" stroke-linecap="round"/>'),
    "photo-album": s32('<rect x="5.5" y="3.5" width="21" height="25" rx="1.5" fill="url(#pp-g-purple)" stroke="#5c3592"/><path d="M8 3.5v25" stroke="#3e2068" stroke-width="2"/><rect x="11" y="8" width="12.5" height="11" fill="#fff" stroke="#5c3592" stroke-width=".8"/><path d="M12 18l3.4-4 2.4 2.4 2-1.5 3.6 3.1z" fill="#5fa83c"/><circle cx="20.3" cy="11" r="1.4" fill="#ffd34d"/>'),
    shapes: s32('<rect x="3.5" y="13.5" width="13" height="13" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><circle cx="21" cy="11" r="7.5" fill="url(#pp-g-orange)" stroke="#b55d12"/><path d="M18.5 28.5l5.5-10 5.5 10z" fill="url(#pp-g-green)" stroke="#2d7b1d" stroke-linejoin="round"/>'),
    smartart: s32('<rect x="11.5" y="3.5" width="9" height="6" rx="1" fill="url(#pp-g-green)" stroke="#2d7b1d"/><rect x="2.5" y="21.5" width="8" height="6" rx="1" fill="url(#pp-g-green)" stroke="#2d7b1d"/><rect x="12" y="21.5" width="8" height="6" rx="1" fill="url(#pp-g-green)" stroke="#2d7b1d"/><rect x="21.5" y="21.5" width="8" height="6" rx="1" fill="url(#pp-g-green)" stroke="#2d7b1d"/><path d="M16 9.5v6M6.5 21.5v-6h19v6M16 15.5v6" fill="none" stroke="#2d7b1d"/>'),
    chart: s32('<path d="M4.5 3.5v24h24" fill="none" stroke="#556070"/><rect x="7.5" y="15.5" width="5" height="12" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><rect x="14.5" y="8.5" width="5" height="19" fill="url(#pp-g-red)" stroke="#9e2a15"/><rect x="21.5" y="12.5" width="5" height="15" fill="url(#pp-g-green)" stroke="#2d7b1d"/>'),
    hyperlink: s32('<circle cx="13" cy="13" r="9.5" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><path d="M5 10.5c3 1 4 3 3 5s1 4 3 4M15.5 4c-1 2 1 3 3 3s3 2 2 4" fill="none" stroke="#7cc44f" stroke-width="2"/><g fill="none" stroke="#556070" stroke-width="2"><rect x="15" y="19.5" width="8.5" height="5" rx="2.5" transform="rotate(-35 19.25 22)"/><rect x="20" y="23.5" width="8.5" height="5" rx="2.5" transform="rotate(-35 24.25 26)"/></g>'),
    action: s32('<rect x="3.5" y="5.5" width="21" height="15" rx="2" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><path d="M11.5 9v8l6.5-4z" fill="#fff"/><path d="M19.5 15.5v13l3-3 2.6 5.2 2-1-2.6-5.2h4.2z" fill="#fff" stroke="#1d1d1d" stroke-linejoin="round"/>'),
    textbox: s32('<rect x="3.5" y="5.5" width="25" height="21" fill="#fff" stroke="#4b6fa5" stroke-dasharray="2 1.3"/>' + txt(6.5, 23, "A", 16, 'font-weight="bold" fill="#1f4f9c"') + lines(19, 11.5, 7, 4, 3.5, "#8a9bb5")),
    "header-footer": s32(PAGE + '<rect x="10" y="6.5" width="8" height="2.6" fill="#ee8a1e"/><rect x="10" y="23.8" width="13" height="2.6" fill="#ee8a1e"/>' + lines(10, 13, 13, 3, 3)),
    wordart: s32('<path d="M5.5 29.5 15 5.5h5l9.5 24h-6l-2-5.5h-8l-2 5.5z" fill="#9aa7ba"/><path d="M4 28 13.5 4h5L28 28h-6l-2-5.5h-8L10 28z" fill="url(#pp-g-blue)" stroke="#1d3f7a" stroke-linejoin="round"/><path d="M13.6 18.4h4.8L16 11.3z" fill="#fff" stroke="#1d3f7a" stroke-linejoin="round"/>'),
    "date-time": s16('<rect x="1.5" y="2.5" width="13" height="12" fill="#fff" stroke="#66768b"/><rect x="1.5" y="2.5" width="13" height="3.2" fill="#cf381a" stroke="#9e2a15" stroke-width=".7"/><path d="M4 8.5h2M7 8.5h2M10 8.5h2M4 11.5h2M7 11.5h2" stroke="#66768b" stroke-width="1.2"/>'),
    "slide-number": s16('<rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#5274a8"/>' + txt(8, 11.8, "#", 9, 'text-anchor="middle" font-weight="bold" fill="#1f4f9c"')),
    symbol: s16(txt(8, 13.5, "&#937;", 13.5, 'text-anchor="middle" font-weight="bold" fill="#1f4f9c"')),
    object: s16('<rect x="1.5" y="1.5" width="13" height="13" fill="#fff" stroke="#66768b"/><path d="M4.5 6.5 8 4.5l3.5 2v4l-3.5 2-3.5-2z" fill="url(#pp-g-orange)" stroke="#b25a10" stroke-width=".8" stroke-linejoin="round"/>'),
    movie: s32('<rect x="5.5" y="3.5" width="21" height="25" fill="#3f3f46" stroke="#1d1d22"/><rect x="9.5" y="6.5" width="13" height="8.5" fill="url(#pp-g-blue2)"/><rect x="9.5" y="17" width="13" height="8.5" fill="url(#pp-g-blue2)"/><path d="M7.5 5v23M24.5 5v23" stroke="#fff" stroke-width="1.6" stroke-dasharray="1.6 2.2"/>'),
    sound: s32('<path d="M4.5 12.5h6l7-6v19l-7-6h-6z" fill="url(#pp-g-grey)" stroke="#4f5967" stroke-linejoin="round"/><path d="M21 11.5c2 2.5 2 6.5 0 9M24.5 8.5c3.8 4.5 3.8 10.5 0 15" fill="none" stroke="#2c65b8" stroke-width="1.9" stroke-linecap="round"/>'),

    // ---------- Design tab ----------
    "page-setup": s32(PAGE + '<path d="M10.5 16h12M10.5 16l2.6-2.6M10.5 16l2.6 2.6M22.5 16l-2.6-2.6M22.5 16l-2.6 2.6" stroke="#2c65b8" stroke-width="1.4" fill="none" stroke-linecap="round"/>'),
    orientation: s32('<rect x="2.5" y="11.5" width="17" height="12" fill="url(#pp-g-page)" stroke="#5274a8"/><rect x="17.5" y="9.5" width="12" height="18" fill="url(#pp-g-page)" stroke="#5274a8"/><path d="M6.5 8.5a8 8 0 0 1 9-5" fill="none" stroke="#2f8a2f" stroke-width="1.6"/><path d="M13 1.2l2.6 2.2-2.6 2.2" fill="none" stroke="#2f8a2f" stroke-width="1.6" stroke-linejoin="round"/>'),
    "theme-colors": s16('<rect x="1.5" y="1.5" width="6" height="6" fill="#4f81bd"/><rect x="8.5" y="1.5" width="6" height="6" fill="#c0504d"/><rect x="1.5" y="8.5" width="6" height="6" fill="#9bbb59"/><rect x="8.5" y="8.5" width="6" height="6" fill="#f79646"/>'),
    "theme-fonts": s16(txt(0.5, 13, "A", 13, 'font-family="Georgia,serif" fill="#1f4f9c"') + txt(9.5, 13, "a", 9, 'fill="#c0504d" font-weight="bold"')),
    "theme-effects": s16('<circle cx="8" cy="8" r="6.3" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><ellipse cx="6.4" cy="5.6" rx="3" ry="1.7" fill="#fff" opacity=".75"/>'),
    "bg-styles": s32('<rect x="3.5" y="6.5" width="25" height="19" fill="url(#pp-g-blue2)" stroke="#4b6fa5"/><path d="M3.5 18.5c6-4 12 4 25-2v9h-25z" fill="url(#pp-g-blue)"/><path d="M5.5 13.5c5-3 10 2 21-2" stroke="#fff" stroke-width="1.2" fill="none" opacity=".8"/>'),

    // ---------- Animations tab ----------
    preview: s32('<rect x="3.5" y="5.5" width="23" height="18" fill="url(#pp-g-page)" stroke="#4b6fa5"/><path d="M13.5 8.3l1.9 4 4.4.5-3.2 3 .9 4.3-4-2.2-3.9 2.2.9-4.3-3.2-3 4.4-.5z" fill="url(#pp-g-gold)" stroke="#b8860b" stroke-width=".8"/><circle cx="24" cy="23" r="5.8" fill="url(#pp-g-green)" stroke="#2d7b1d"/><path d="M22.3 20.2v5.6l4.6-2.8z" fill="#fff"/>'),
    animate: s16('<path d="M10 1.5l1.5 3.2 3.5.4-2.6 2.4.7 3.5-3.1-1.8-3.1 1.8.7-3.5L5 5.1l3.5-.4z" fill="url(#pp-g-gold)" stroke="#a87a0b" stroke-width=".7" stroke-linejoin="round"/><path d="M.8 9.5h4M1.8 12h4.5M3 14.5h4.5" stroke="#2c65b8" stroke-width="1.1"/>'),
    "custom-anim": s16('<path d="M5 1.2l1.2 2.5 2.7.3-2 1.9.5 2.7L5 7.2 2.6 8.6l.5-2.7-2-1.9 2.7-.3z" fill="url(#pp-g-gold)" stroke="#a87a0b" stroke-width=".6" stroke-linejoin="round"/>' + para("M10 2.5h5M10 5.5h5M1.5 11h13.5M1.5 14h13.5")),
    "trans-sound": s16('<path d="M1.5 6h3l4-3.5v11l-4-3.5h-3z" fill="url(#pp-g-grey)" stroke="#4f5967" stroke-linejoin="round"/><path d="M11 5.5c1.3 1.5 1.3 3.5 0 5M13 3.5c2.4 2.7 2.4 6.3 0 9" fill="none" stroke="#2c65b8" stroke-width="1.2" stroke-linecap="round"/>'),
    "trans-speed": s16('<path d="M1.5 12.5a6.5 6.5 0 1 1 13 0z" fill="url(#pp-g-blue2)" stroke="#2c5797"/><path d="M8 12.2l3-4.2" stroke="#cf381a" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="12.2" r="1.4" fill="#2c5797"/>'),
    // The little "this slide is animated" star under a slide's number (slides pane, Slide Sorter).
    "anim-star": '<svg viewBox="0 0 14 12"><path d="M.6 4.4h3.6M0 6.6h3.4M.6 8.8h3.3" stroke="#6f8fbf" stroke-width="1" stroke-linecap="round"/>' +
      '<path d="M9.5 1.3l1.2 3 3.1.2-2.4 2 .8 3.1-2.7-1.7-2.7 1.7.8-3.1-2.4-2 3.1-.2z" fill="url(#pp-g-gold)" stroke="#a87a0b" stroke-width=".7" stroke-linejoin="round"/></svg>',
    "apply-all": s16('<rect x="4.5" y="1.5" width="10" height="7.5" fill="#fff" stroke="#5274a8"/><rect x="2.5" y="3.5" width="10" height="7.5" fill="#fff" stroke="#5274a8"/><rect x=".5" y="5.5" width="10" height="7.5" fill="url(#pp-g-page)" stroke="#5274a8"/><path d="M6.2 12l2.4 2.5 6-6.5" fill="none" stroke="#2f8a2f" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>'),

    // ---------- Review tab ----------
    spelling: s32(txt(1.5, 14.5, "ABC", 10.5, 'font-weight="bold" fill="#1f4f9c"') + '<path d="M9 21.5l5 5L28.5 11" fill="none" stroke="#2f8a2f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>'),
    research: s32('<path d="M2.5 8.5c4-2 8.5-2 13.5 1 5-3 9.5-3 13.5-1v17c-4-2-8.5-2-13.5 1-5-3-9.5-3-13.5-1z" fill="#fff" stroke="#5274a8"/><path d="M16 9.5v17" stroke="#5274a8"/>' + lines(5, 13, 7, 4, 3) + '<circle cx="21.5" cy="16" r="4.6" fill="url(#pp-g-blue2)" fill-opacity=".9" stroke="#2c5797" stroke-width="1.7"/><path d="M24.8 19.3l4.3 4.3" stroke="#2c5797" stroke-width="2.7" stroke-linecap="round"/>'),
    thesaurus: s32('<rect x="6.5" y="3.5" width="19" height="25" rx="1.5" fill="url(#pp-g-red)" stroke="#8e2a14"/><path d="M9.5 3.5v25" stroke="#8e2a14"/><rect x="12" y="8" width="11" height="9" fill="#fff" stroke="#8e2a14" stroke-width=".7"/>' + txt(17.5, 14.8, "A-Z", 5.6, 'text-anchor="middle" font-weight="bold" fill="#8e2a14"')),
    translate: s16('<rect x="1.5" y="1.5" width="8" height="8" rx="1" fill="url(#pp-g-blue)" stroke="#1f4f9c"/>' + txt(5.5, 8, "a", 7, 'text-anchor="middle" fill="#fff" font-weight="bold"') + '<rect x="6.5" y="6.5" width="8" height="8" rx="1" fill="url(#pp-g-orange)" stroke="#b25a10"/>' + txt(10.5, 13, "b", 7, 'text-anchor="middle" fill="#fff" font-weight="bold"')),
    language: s16('<circle cx="7" cy="8" r="5.6" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><path d="M2.5 6.5c2 .7 2.6 2 2 3.2s.5 2.5 2 2.5M8 2.8c-.8 1.6.8 2.4 2.1 2.4" fill="none" stroke="#7cc44f" stroke-width="1.4"/><path d="M9.5 12.2l2 2.1 3.6-5.1" fill="none" stroke="#2f8a2f" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'),
    "show-markup": s32(NOTE + '<path d="M8 10h15M8 14h11" stroke="#b39223" stroke-width="1.3"/>'),
    "new-comment": s32(NOTE + '<path d="M8 11h11M8 15h8" stroke="#b39223" stroke-width="1.3"/><path d="M25 .8l1.5 3.8 3.8 1.5-3.8 1.5-1.5 3.8-1.5-3.8-3.8-1.5 3.8-1.5z" fill="url(#pp-g-gold)" stroke="#c48a0e" stroke-width=".7"/>'),
    "edit-comment": s16('<path d="M1.5 2.5h12v8h-6l-3 3v-3h-3z" fill="url(#pp-g-yellow)" stroke="#b39223" stroke-linejoin="round"/><path d="M7 12.5l6.5-6.5 1.6 1.6-6.5 6.5H7z" fill="url(#pp-g-gold)" stroke="#8a6512" stroke-width=".8" stroke-linejoin="round"/>'),
    "delete-comment": s32(NOTE + '<path d="M18 17l9 9M27 17l-9 9" stroke="#cf381a" stroke-width="3" stroke-linecap="round"/>'),
    "prev-comment": s32(NOTE + '<path d="M22 13H10m0 0 4.5-4.5M10 13l4.5 4.5" stroke="#2c65b8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    "next-comment": s32(NOTE + '<path d="M9 13h12m0 0-4.5-4.5M21 13l-4.5 4.5" stroke="#2c65b8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    protect: s32(PAGE + lines(10, 9, 9, 2, 3) + '<rect x="14.5" y="17.5" width="13" height="11" rx="1.5" fill="url(#pp-g-gold)" stroke="#8f700f"/><path d="M17.5 17.5v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#66768b" stroke-width="1.9"/><circle cx="21" cy="22.3" r="1.5" fill="#6c5208"/><path d="M21 23v2.5" stroke="#6c5208" stroke-width="1.2"/>'),

    // ---------- View tab ----------
    "view-normal": s32('<rect x="2.5" y="4.5" width="27" height="23" fill="#fff" stroke="#4b6fa5"/><rect x="2.5" y="4.5" width="27" height="3" fill="url(#pp-g-blue)"/><g fill="#dfe8f5" stroke="#7d9cc9" stroke-width=".7"><rect x="4.5" y="9.5" width="6" height="4"/><rect x="4.5" y="15" width="6" height="4"/><rect x="4.5" y="20.5" width="6" height="4"/></g><rect x="12.5" y="9.5" width="15" height="11" fill="url(#pp-g-page)" stroke="#7d9cc9"/><path d="M12.5 23h15M12.5 25.5h10" stroke="#b2c4dd"/>'),
    "view-sorter": s32('<g fill="url(#pp-g-page)" stroke="#4b6fa5"><rect x="2.5" y="5.5" width="8" height="6"/><rect x="12" y="5.5" width="8" height="6"/><rect x="21.5" y="5.5" width="8" height="6"/><rect x="2.5" y="13.5" width="8" height="6"/><rect x="12" y="13.5" width="8" height="6"/><rect x="21.5" y="13.5" width="8" height="6"/><rect x="2.5" y="21.5" width="8" height="6"/><rect x="12" y="21.5" width="8" height="6"/></g><rect x="21.5" y="21.5" width="8" height="6" fill="#fff" stroke="#ee8a1e" stroke-width="1.3"/>'),
    "view-notes": s32('<rect x="6.5" y="2.5" width="19" height="27" fill="#fff" stroke="#66768b"/><rect x="9" y="5" width="14" height="10" fill="url(#pp-g-page)" stroke="#4b6fa5"/><rect x="10.5" y="6.5" width="11" height="2" fill="#bcd3f0"/>' + lines(9, 19, 14, 3, 3, "#8a9bb5")),
    "view-show": s32(screen('<path d="M12.5 8.2v9.6l8-4.8z" fill="url(#pp-g-green)" stroke="#2d7b1d" stroke-linejoin="round"/>')),
    "slide-master": s32('<rect x="9.5" y="2.5" width="20" height="15" fill="#fff" stroke="#7d9cc9"/><rect x="6" y="6.5" width="20" height="15" fill="#fff" stroke="#6f87ab"/><rect x="2.5" y="10.5" width="20" height="15" fill="url(#pp-g-page)" stroke="#4b6fa5"/><rect x="4.5" y="12.5" width="16" height="3" fill="#ee8a1e"/>' + lines(5, 19, 13, 2, 3)),
    "handout-master": s32('<rect x="6.5" y="2.5" width="19" height="27" fill="#fff" stroke="#66768b"/><g fill="url(#pp-g-page)" stroke="#4b6fa5"><rect x="9" y="5" width="7" height="5"/><rect x="9" y="12.5" width="7" height="5"/><rect x="9" y="20" width="7" height="5"/></g>' + lines(18, 6.5, 5, 6, 3, "#8a9bb5")),
    "notes-master": s32('<rect x="6.5" y="2.5" width="19" height="27" fill="#fff" stroke="#66768b"/><rect x="9" y="5" width="14" height="10" fill="url(#pp-g-page)" stroke="#4b6fa5"/><rect x="10.5" y="6.5" width="11" height="2" fill="#ee8a1e"/>' + lines(9, 19, 14, 3, 3, "#ee8a1e")),
    zoom: s32(LENS + '<path d="M10 13h6M13 10v6" stroke="#1f3f73" stroke-width="1.6"/>'),
    "fit-window": s32('<rect x="7.5" y="9.5" width="17" height="13" fill="url(#pp-g-page)" stroke="#4b6fa5"/><path d="M2.5 7V2.5H7M25 2.5h4.5V7M29.5 25v4.5H25M7 29.5H2.5V25" fill="none" stroke="#2c65b8" stroke-width="1.8"/><path d="M3 3l4 4M29 3l-4 4M29 29l-4-4M3 29l4-4" stroke="#2c65b8" stroke-width="1.4"/>'),
    color: s16('<rect x="1.5" y="1.5" width="6" height="6" fill="#4f81bd"/><rect x="8.5" y="1.5" width="6" height="6" fill="#c0504d"/><rect x="1.5" y="8.5" width="6" height="6" fill="#9bbb59"/><rect x="8.5" y="8.5" width="6" height="6" fill="#f79646"/>'),
    grayscale: s16('<rect x="1.5" y="1.5" width="6" height="6" fill="#7a7a7a"/><rect x="8.5" y="1.5" width="6" height="6" fill="#a6a6a6"/><rect x="1.5" y="8.5" width="6" height="6" fill="#c8c8c8"/><rect x="8.5" y="8.5" width="6" height="6" fill="#4d4d4d"/>'),
    "pure-bw": s16('<rect x="1.5" y="1.5" width="13" height="13" fill="#fff" stroke="#1d1d1d"/><path d="M1.5 14.5 14.5 1.5v13z" fill="#1d1d1d"/>'),
    "new-window": s32('<rect x="3.5" y="9.5" width="19" height="16" fill="#fff" stroke="#4b6fa5"/><rect x="3.5" y="9.5" width="19" height="3" fill="url(#pp-g-blue)"/><path d="M25 2.5l1.5 3.8 3.8 1.5-3.8 1.5-1.5 3.8-1.5-3.8-3.8-1.5 3.8-1.5z" fill="url(#pp-g-gold)" stroke="#c48a0e" stroke-width=".8"/>'),
    "arrange-all": s16('<rect x="1" y="2.5" width="6.5" height="11" fill="#fff" stroke="#4b6fa5"/><rect x="8.5" y="2.5" width="6.5" height="11" fill="#fff" stroke="#4b6fa5"/><rect x="1" y="2.5" width="6.5" height="2" fill="#5f97de"/><rect x="8.5" y="2.5" width="6.5" height="2" fill="#5f97de"/>'),
    cascade: s16('<rect x="1.5" y="1.5" width="9" height="7" fill="#fff" stroke="#4b6fa5"/><rect x="3.5" y="4" width="9" height="7" fill="#fff" stroke="#4b6fa5"/><rect x="5.5" y="6.5" width="9" height="7" fill="#fff" stroke="#4b6fa5"/><rect x="5.5" y="6.5" width="9" height="2" fill="#5f97de"/>'),
    "move-split": s16('<rect x="1.5" y="1.5" width="13" height="13" fill="#fff" stroke="#4b6fa5"/><path d="M1.5 8h13M8 5v6M8 5 6.5 6.5M8 5l1.5 1.5M8 11l-1.5-1.5M8 11l1.5-1.5" fill="none" stroke="#2c65b8"/>'),
    "switch-windows": s32('<rect x="8.5" y="3.5" width="20" height="15" fill="#fff" stroke="#6f87ab"/><rect x="8.5" y="3.5" width="20" height="3" fill="#9ab8e3"/><rect x="3.5" y="10.5" width="20" height="15" fill="#fff" stroke="#4b6fa5"/><rect x="3.5" y="10.5" width="20" height="3" fill="url(#pp-g-blue)"/><path d="M26 22.5v6m0 0-2.6-2.6M26 28.5l2.6-2.6" stroke="#2f8a2f" stroke-width="1.7" fill="none" stroke-linecap="round"/>'),
    macros: s32(PAGE + lines(10, 9, 9, 2, 3) + GEAR.replace(/cx="23" cy="17.8"/g, 'cx="18" cy="21"')),

    // ---------- Office menu (32) ----------
    "om-new": s32(PAGE + '<path d="M25 13.5l1.4 3.6 3.6 1.4-3.6 1.4-1.4 3.6-1.4-3.6-3.6-1.4 3.6-1.4z" fill="url(#pp-g-gold)" stroke="#c48a0e" stroke-width=".8"/>'),
    "om-open": s32('<path d="M2.5 8.5h9l2.5 2.5h12.5v15h-24z" fill="url(#pp-g-gold)" stroke="#a37b16"/><path d="M5 14.5h24.5l-3.5 12H2.5z" fill="#fde49b" stroke="#a37b16" stroke-linejoin="round"/>'),
    "om-save": s32('<path d="M3.5 3.5h21l4 4v21h-25z" fill="url(#pp-g-blue)" stroke="#1d4e9a"/><rect x="8.5" y="3.5" width="14" height="9" fill="url(#pp-g-grey)" stroke="#1d4e9a"/><rect x="17.5" y="5" width="3" height="6" fill="#1d4e9a"/><rect x="7.5" y="16.5" width="17" height="12" fill="#fff" stroke="#1d4e9a"/>' + lines(10, 20, 12, 3, 2.6)),
    "om-saveas": s32('<path d="M3.5 3.5h21l4 4v21h-25z" fill="url(#pp-g-blue)" stroke="#1d4e9a"/><rect x="8.5" y="3.5" width="14" height="9" fill="url(#pp-g-grey)" stroke="#1d4e9a"/><rect x="17.5" y="5" width="3" height="6" fill="#1d4e9a"/><rect x="7.5" y="16.5" width="17" height="12" fill="#fff" stroke="#1d4e9a"/><path d="M14 29.5l1-4 12-12 3 3-12 12z" fill="url(#pp-g-gold)" stroke="#8a6512" stroke-linejoin="round"/>'),
    "om-print": s32('<rect x="8.5" y="2.5" width="15" height="10" fill="#fff" stroke="#66768b"/><rect x="2.5" y="11.5" width="27" height="12" rx="2" fill="url(#pp-g-grey)" stroke="#4f5967"/><rect x="7.5" y="19.5" width="17" height="10" fill="#fff" stroke="#66768b"/>' + lines(10, 23, 12, 2, 3) + '<circle cx="25.5" cy="15" r="1.2" fill="#3a9824"/>'),
    "om-send": s32('<rect x="2.5" y="7.5" width="27" height="18" rx="1.5" fill="#fff" stroke="#556070"/><path d="M3 8.5l13 10 13-10" fill="none" stroke="#556070" stroke-width="1.6"/><path d="M3 25l10-8M29 25l-10-8" stroke="#9aa7ba"/>'),
    "om-publish": s32(PAGE + '<circle cx="21" cy="21" r="7" fill="url(#pp-g-blue)" stroke="#1f4f9c"/><path d="M15.5 19c2 .7 3 2.2 2.3 3.6s.6 3 2 3M22 14.5c-.7 1.6.9 2.6 2.4 2.6s2.2 1.4 1.5 3" fill="none" stroke="#7cc44f" stroke-width="1.6"/>'),
    "om-close": s32('<path d="M2.5 8.5h9l2.5 2.5h12.5v15h-24z" fill="url(#pp-g-gold)" stroke="#a37b16"/><circle cx="23" cy="22" r="6.5" fill="url(#pp-g-red)" stroke="#9e2a15"/><path d="M20.3 19.3l5.4 5.4M25.7 19.3l-5.4 5.4" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'),
    "om-mail": s32('<rect x="2.5" y="7.5" width="27" height="18" rx="1.5" fill="#fff" stroke="#556070"/><path d="M3 8.5l13 10 13-10" fill="none" stroke="#556070" stroke-width="1.6"/>'),
    "om-pdf": s32('<path d="M6 2.5h14l7 7v20H6z" fill="#fff" stroke="#8b8b8b"/><path d="M20 2.5v7h7" fill="#eee" stroke="#8b8b8b"/><rect x="3.5" y="15.5" width="19" height="8" rx="1.2" fill="#d32f2f"/>' + txt(13, 21.9, "PDF", 6.6, 'font-weight="bold" fill="#fff" text-anchor="middle"')),
    "om-pptx": s32('<path d="M6 2.5h14l7 7v20H6z" fill="#fff" stroke="#8b8b8b"/><path d="M20 2.5v7h7" fill="#eee" stroke="#8b8b8b"/><rect x="3.5" y="13.5" width="16" height="12" rx="1.5" fill="url(#pp-g-orange)" stroke="#b25a10"/>' + txt(11.5, 22.6, "P", 9.5, 'font-weight="bold" fill="#fff" text-anchor="middle"')),
    "om-web": s32('<circle cx="16" cy="16" r="12.5" fill="url(#pp-g-blue)" stroke="#1d5bb5"/><path d="M7.5 10.5c3 1 4.5 3.5 3.2 5.8s.8 4.2 3 4.2 1.4 3.6 3 4.8M19 5.5c-1.2 2.8 1.6 4.2 3.8 4.2s3.2 3 2.2 5.2" fill="none" stroke="#7cc44f" stroke-width="2.6" stroke-linecap="round"/>'),
    "om-camera": s32('<rect x="3" y="9" width="26" height="18" rx="3" fill="#575757" stroke="#222"/><rect x="10" y="5.5" width="9" height="4.5" rx="1" fill="#575757" stroke="#222"/><circle cx="16" cy="18" r="6" fill="#222" stroke="#a5a5a5" stroke-width="2"/><circle cx="16" cy="18" r="3" fill="#4a6fa5"/><circle cx="24.5" cy="12.5" r="1.3" fill="#f5c542"/>'),
    "om-blog": s32('<rect x="6" y="4" width="20" height="25" rx="1" fill="#fff" stroke="#6b7a90"/><rect x="6" y="4" width="20" height="5" fill="#4a7fd4"/><path d="M9 13h14M9 17h14M9 21h14M9 25h9" stroke="#9db3d6"/>'),
    "om-options": s16('<rect x="1.5" y="2.5" width="13" height="11" rx="1" fill="#fff" stroke="#66768b"/><path d="M4 6h8M4 9h8M4 12h5" stroke="#9db8dc"/><circle cx="11.5" cy="11.5" r="3" fill="url(#pp-g-grey)" stroke="#556070" stroke-dasharray="1.4 .9" stroke-width="1.6"/>'),
    "om-exit": s16('<rect x="1.5" y="1.5" width="13" height="13" rx="2" fill="url(#pp-g-red)" stroke="#9e2a15"/><path d="M5 5l6 6M11 5l-6 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>'),
    pin: s16('<path d="M6 2.5h4v4.5l2 2.5H4l2-2.5z" fill="url(#pp-g-grey)" stroke="#556070" stroke-linejoin="round"/><path d="M8 9.5v5" stroke="#556070" stroke-width="1.2"/>'),
    "doc-small": s16('<path d="M3.5 1.5h6l3 3v10h-9z" fill="#fff" stroke="#6f87ab"/><path d="M9.5 1.5v3h3" fill="#dfe8f5" stroke="#6f87ab"/><rect x="2" y="7" width="7" height="5.5" rx="1" fill="url(#pp-g-orange)" stroke="#b25a10" stroke-width=".7"/>'),

    // ---------- Panes and status bar (16) ----------
    "pane-slides": s16('<g fill="url(#pp-g-page)" stroke="#4b6fa5"><rect x="3.5" y="1.5" width="9" height="5.5"/><rect x="3.5" y="9" width="9" height="5.5"/></g>'),
    "pane-outline": s16('<rect x="1.5" y="2" width="4" height="3" fill="url(#pp-g-page)" stroke="#4b6fa5" stroke-width=".8"/>' + para("M7 3.5h8M4 7.5h11M4 10.5h11M4 13.5h7")),
    "st-normal": s16('<rect x="1.5" y="2.5" width="13" height="11" fill="#fff" stroke="#3f62a0"/><path d="M5.5 2.5v11M5.5 10.5h9" stroke="#3f62a0"/><rect x="2.5" y="4" width="2" height="1.6" fill="#7d9cc9"/><rect x="2.5" y="7" width="2" height="1.6" fill="#7d9cc9"/>'),
    "st-sorter": s16('<g fill="#fff" stroke="#3f62a0"><rect x="1.5" y="2.5" width="5" height="4"/><rect x="9.5" y="2.5" width="5" height="4"/><rect x="1.5" y="9.5" width="5" height="4"/><rect x="9.5" y="9.5" width="5" height="4"/></g>'),
    "st-show": s16('<rect x="1.5" y="2.5" width="13" height="9" fill="url(#pp-g-screen)" stroke="#3f62a0"/><path d="M8 11.5v3M5.5 14.5h5" stroke="#3f62a0"/><path d="M6.7 4.6v4.8l3.9-2.4z" fill="#3a9824"/>'),
    "st-fit": s16('<rect x="4.5" y="5.5" width="7" height="5" fill="#fff" stroke="#3f62a0"/><path d="M1.5 5V1.5H5M11 1.5h3.5V5M14.5 11v3.5H11M5 14.5H1.5V11" fill="none" stroke="#3f62a0" stroke-width="1.2"/>'),
    "st-spell": s16('<path d="M1.5 3.5h9v11h-9z" fill="#fff" stroke="#3f62a0"/><path d="M1.5 3.5c2-1.5 7-1.5 9 0" fill="none" stroke="#3f62a0"/><path d="M6.5 10.5l2.5 2.5 5.5-7" fill="none" stroke="#3a9824" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'),
    "st-web": s16('<circle cx="8" cy="8" r="6.3" fill="url(#pp-g-blue)" stroke="#1d5bb5"/><path d="M3.5 6c1.6.5 2.3 1.8 1.7 3s.4 2.2 1.6 2.2M9.5 2.2c-.6 1.4.8 2.1 2 2.1s1.6 1.5 1.1 2.6" fill="none" stroke="#7cc44f" stroke-width="1.4" stroke-linecap="round"/>'),
    "st-pdf": s16('<path d="M3 1.5h7l3 3v10H3z" fill="#fff" stroke="#8b8b8b"/><rect x="1.5" y="7.5" width="10" height="4.5" rx=".8" fill="#d32f2f"/>' + txt(6.5, 11.1, "PDF", 3.6, 'font-weight="bold" fill="#fff" text-anchor="middle"'))
  };

  // Pictures for the transition gallery (Animations tab), 44x33 each:
  // a little slide, then a hint of the movement.
  var MINI = '<rect x=".5" y=".5" width="43" height="32" fill="#fff" stroke="#9aa7ba"/><rect x="5" y="5" width="34" height="5" fill="#c9daf1"/>' +
    '<path d="M6 15.5h26M6 20h22M6 24.5h17" stroke="#c3cfdf" stroke-width="2"/>';
  function tile(body) { return '<svg viewBox="0 0 44 33">' + body + "</svg>"; }
  window.PP_TRANSITION_TILES = {
    none: tile(MINI),
    fade: tile(MINI + '<rect x="1" y="1" width="42" height="31" fill="url(#pp-g-fadeh)"/>'),
    "fade-black": tile(MINI + '<rect x="1" y="1" width="42" height="31" fill="url(#pp-g-blackh)"/>'),
    push: tile('<g transform="translate(-24 0)">' + MINI + '</g><g transform="translate(20 0)">' + MINI + '</g><path d="M34 16.5H16m0 0 4.5-4.5M16 16.5l4.5 4.5" stroke="#2c65b8" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    wipe: tile(MINI + '<rect x="1" y="1" width="22" height="31" fill="#2c65b8" opacity=".22"/><path d="M23 1v31" stroke="#2c65b8" stroke-width="1.5"/><path d="M27 16.5h11m0 0-4-4m4 4-4 4" stroke="#2c65b8" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    circle: tile(MINI + '<path d="M1 1h42v31H1zM22 7a9.5 9.5 0 1 0 .01 0z" fill="#7f95b6" fill-rule="evenodd" opacity=".55"/><circle cx="22" cy="16.5" r="9.5" fill="none" stroke="#2c65b8" stroke-width="1.5"/>'),
    newsflash: tile('<rect x=".5" y=".5" width="43" height="32" fill="#dfe6f0" stroke="#9aa7ba"/><g transform="translate(22 16.5) rotate(-28) scale(.6) translate(-22 -16.5)">' + MINI + '</g><path d="M5 27a18 18 0 0 1 4-21M39 6a18 18 0 0 1-4 21" stroke="#2c65b8" stroke-width="2" fill="none" stroke-linecap="round"/>'),
    split: tile(MINI + '<path d="M1 1h13v31H1zM30 1h13v31H30z" fill="#2c65b8" opacity=".22"/><path d="M14 1v31M30 1v31" stroke="#2c65b8" stroke-width="1.5"/>' +
      '<path d="M19 16.5h-8m0 0 3-3m-3 3 3 3M25 16.5h8m0 0-3-3m3 3-3 3" stroke="#2c65b8" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    "box-out": tile(MINI + '<path d="M1 1h42v31H1zM13 9h18v15H13z" fill="#2c65b8" fill-opacity=".22" fill-rule="evenodd"/><rect x="13" y="9" width="18" height="15" fill="none" stroke="#2c65b8" stroke-width="1.5"/>' +
      '<path d="M11 7 5 3m0 0h3.5M5 3v3.5M33 26l6 4m0 0h-3.5m3.5 0v-3.5" stroke="#2c65b8" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'),
    wheel: tile(MINI + '<path d="M22 16.5V1.5A15 15 0 0 1 35 9z M22 16.5H43A15 15 0 0 1 34.5 28z M22 16.5V31.5A15 15 0 0 1 9 24z M22 16.5H1A15 15 0 0 1 9.5 5z" fill="#2c65b8" opacity=".25"/>' +
      '<path d="M22 16.5V1M22 16.5H43M22 16.5V32M22 16.5H1" stroke="#2c65b8" stroke-width="1.3"/>'),
    "random-bars": tile(MINI + '<path d="M1 3h42v2H1zM1 8h42v3H1zM1 14h42v1.5H1zM1 19h42v3H1zM1 25h42v2H1zM1 29h42v2H1z" fill="#2c65b8" opacity=".3"/>'),
    checkerboard: tile(MINI + '<path d="M1 1h7v8H1zM15 1h7v8h-7zM29 1h7v8h-7zM8 9h7v8H8zM22 9h7v8h-7zM36 9h7v8h-7zM1 17h7v8H1zM15 17h7v8h-7zM29 17h7v8h-7zM8 25h7v7H8zM22 25h7v7h-7zM36 25h7v7h-7z" fill="#2c65b8" opacity=".28"/>'),
    bounce: tile('<rect x=".5" y=".5" width="43" height="32" fill="#dfe6f0" stroke="#9aa7ba"/><g transform="translate(9 3) scale(.6)">' + MINI + '</g>' +
      '<path d="M4 30q4-14 8 0q3-8 6 0q2-4 4 0" stroke="#2c65b8" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
  };

  // Shapes shown in the Home tab's little Shapes gallery (12x12 grid each).
  window.PP_SHAPES = [
    '<path d="M1.5 10.5l9-9" stroke="#1f3f73" stroke-width="1.2"/>',
    '<path d="M1.5 10.5l8-8M9.5 2.5H6M9.5 2.5V6" stroke="#1f3f73" stroke-width="1.2" fill="none"/>',
    '<rect x="1.5" y="2.5" width="9" height="7" fill="#fff" stroke="#1f3f73"/>',
    '<ellipse cx="6" cy="6" rx="4.5" ry="3.8" fill="#fff" stroke="#1f3f73"/>',
    '<rect x="1.5" y="2.5" width="9" height="7" rx="2" fill="#fff" stroke="#1f3f73"/>',
    '<path d="M6 1.5l4.5 9h-9z" fill="#fff" stroke="#1f3f73" stroke-linejoin="round"/>',
    '<path d="M1.5 4.5h5.5V2l3.5 4-3.5 4V7.5H1.5z" fill="#fff" stroke="#1f3f73" stroke-linejoin="round"/>',
    '<path d="M6 1.2l1.4 3 3.3.3-2.5 2.2.8 3.2L6 8.2 3 9.9l.8-3.2-2.5-2.2 3.3-.3z" fill="#fff" stroke="#1f3f73" stroke-linejoin="round"/>',
    '<path d="M1.5 2.5h9v5.5h-5l-2.5 2.5V8h-1.5z" fill="#fff" stroke="#1f3f73" stroke-linejoin="round"/>',
    '<path d="M1.5 9c2-6 7-6 9 0" fill="none" stroke="#1f3f73" stroke-width="1.2"/>',
    '<path d="M2 6c0-2.5 2-4.5 4-4.5M2 6c0 2.5 2 4.5 4 4.5M10 6c0-2.5-2-4.5-4-4.5" fill="none" stroke="#1f3f73"/>',
    '<path d="M4.5 1.5c-2 0-2 1.5-2 3s-1 1.5-1 1.5 1 0 1 1.5 0 3 2 3M7.5 1.5c2 0 2 1.5 2 3s1 1.5 1 1.5-1 0-1 1.5 0 3-2 3" fill="none" stroke="#1f3f73"/>'
  ];
})();
