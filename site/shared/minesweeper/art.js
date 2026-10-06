/* ==========================================================================
   shared/minesweeper/art.js — the game's pictures, one set per theme, all drawn for this
   site as small inline SVGs (nothing copied from Microsoft's Minesweeper).

   Per theme:
     face.idle / face.press / face.lose / face.win   the button above the board (26 x 26)
     mine     what a "mine" looks like once it is shown (20 x 20)
     flag     the marker for a square the player thinks is a mine (20 x 20)
   Wording lives in themes.js; colours in minesweeper.css.
   ========================================================================== */

(function () {
  "use strict";

  function svg(viewBox, body) {
    return '<svg viewBox="' + viewBox + '" aria-hidden="true" focusable="false">' + body + "</svg>";
  }
  function face(body) { return svg("0 0 26 26", body); }
  function cell(body) { return svg("0 0 20 20", body); }

  // Shared bits
  var SWEAT = '<path d="M22.2 8.6c1.1 1.5 1.6 2.4 1.6 3.1a1.6 1.6 0 0 1-3.2 0c0-.7.5-1.6 1.6-3.1z" fill="#55acee" stroke="#1f6fb5" stroke-width=".5"/>';
  function pennant(colour, label, size) {
    return cell(
      '<path d="M6 2.5v13.6" stroke="#2b2b2b" stroke-width="1.4"/>' +
      '<path d="M3 16.8h7.4" stroke="#2b2b2b" stroke-width="1.8" stroke-linecap="round"/>' +
      '<path d="M6.7 2.6h10l-2.5 3.7 2.5 3.7h-10z" fill="' + colour + '" stroke="rgba(0,0,0,.35)" stroke-width=".5"/>' +
      '<text x="10.9" y="' + (size > 6 ? 8.9 : 8) + '" font-family="Georgia,\'Times New Roman\',serif" font-size="' + size +
      '" font-weight="bold" fill="#fff" text-anchor="middle">' + label + "</text>");
  }

  // ---------------------------------------------------------------------
  // Specification Search: a researcher in glasses; the mine is a spiky mine with a white glint, like
  // the game's icon in shared/xp/xp.js (Lehan, 2026-10-05; it was a cartoon bomb marked "n.s.").
  // ---------------------------------------------------------------------
  var SPEC_HEAD = '<circle cx="13" cy="14.5" r="9" fill="#f5d0a6" stroke="#7a5233"/>';
  var SPEC_HAIR = '<path d="M4.3 12.6C4.8 7.6 8.5 5 13 5s8.2 2.6 8.7 7.6c-2.3-2-5.3-3-8.7-3s-6.4 1-8.7 3z" fill="#3b2a1e"/>';
  var SPEC_GLASSES = '<circle cx="9.4" cy="14" r="2.6" fill="#fff" stroke="#1f1f1f" stroke-width="1.1"/>' +
    '<circle cx="16.6" cy="14" r="2.6" fill="#fff" stroke="#1f1f1f" stroke-width="1.1"/><path d="M12 13.8h2" stroke="#1f1f1f"/>';

  var spec = {
    face: {
      idle: face(SPEC_HEAD + SPEC_HAIR + SPEC_GLASSES +
        '<circle cx="9.6" cy="14.2" r="1" fill="#1f1f1f"/><circle cx="16.8" cy="14.2" r="1" fill="#1f1f1f"/>' +
        '<path d="M10 18.6c1.8 1.4 4.2 1.4 6 0" fill="none" stroke="#7a3b22" stroke-width="1.2" stroke-linecap="round"/>'),
      press: face(SPEC_HEAD + SPEC_HAIR + SPEC_GLASSES +
        '<circle cx="9.4" cy="13.3" r="1" fill="#1f1f1f"/><circle cx="16.6" cy="13.3" r="1" fill="#1f1f1f"/>' +
        '<ellipse cx="13" cy="19.3" rx="1.4" ry="1.7" fill="#7a3b22"/>' + SWEAT),
      lose: face('<circle cx="13" cy="14.5" r="9" fill="#cdb69c" stroke="#5e4029"/>' +
        '<circle cx="7.6" cy="18.2" r="1.7" fill="#6b5a4a" opacity=".45"/><circle cx="18.6" cy="17.4" r="1.3" fill="#6b5a4a" opacity=".45"/>' +
        '<path d="M4.5 12 3 7.4l3.3 2L6 4.6l3.6 3 .9-4.9 2.6 4.3 2.6-4.3.9 5 3.6-3-.3 4.7 3.3-2L21.5 12c-2.4-1.8-5.3-2.6-8.5-2.6s-6.1.8-8.5 2.6z" fill="#2a1d14"/>' +
        SPEC_GLASSES + '<path d="M15.2 12.2l1.2 1.6-.8 1.4 1.2 1" fill="none" stroke="#1f1f1f" stroke-width=".6"/>' +
        '<path d="M8.4 13l2 2M10.4 13l-2 2M15.6 13l2 2M17.6 13l-2 2" stroke="#1f1f1f" stroke-width="1" stroke-linecap="round"/>' +
        '<path d="M9.6 19.6c.9-.8 1.7.8 2.6 0s1.7.8 2.6 0 1.7.8 2.6 0" fill="none" stroke="#5a2a18" stroke-width="1.1" stroke-linecap="round"/>' +
        '<circle cx="21" cy="4.4" r="1.9" fill="#8f8f8f" opacity=".85"/><circle cx="23.3" cy="2.7" r="1.3" fill="#b5b5b5" opacity=".85"/>'),
      win: face(SPEC_HEAD + SPEC_HAIR + SPEC_GLASSES +
        '<path d="M8.3 14.6c.6-.9 1.7-.9 2.3 0M15.5 14.6c.6-.9 1.7-.9 2.3 0" fill="none" stroke="#1f1f1f" stroke-width="1.1" stroke-linecap="round"/>' +
        '<path d="M9 17.6h8c0 2.6-1.8 4-4 4s-4-1.4-4-4z" fill="#7a3b22"/><path d="M9.6 17.6h6.8v1.1H9.6z" fill="#fff"/>' +
        '<text x="13" y="7.4" font-family="Georgia,serif" font-size="8.5" font-weight="bold" fill="#f2b400" stroke="#7a5600" stroke-width=".35" text-anchor="middle">***</text>')
    },
    mine: cell('<g stroke="#111" stroke-linecap="round">' +
      '<path d="M10 1.8v16.4M1.8 10h16.4" stroke-width="1.8"/><path d="M4.3 4.3l11.4 11.4M15.7 4.3 4.3 15.7" stroke-width="1.6"/></g>' +
      '<circle cx="10" cy="10" r="5.3" fill="#111"/>' +
      '<rect x="7.1" y="7.1" width="2.4" height="2.4" rx=".4" fill="#fff"/>'),
    flag: pennant("#1565c0", "†", 7.5)
  };

  // ---------------------------------------------------------------------
  // Scooped!: an ice-cream cone that loses its scoop; the mine is a scoop in a scooper.
  // ---------------------------------------------------------------------
  var CONE = '<path d="M8.3 14.5h9.4L13 25z" fill="#e3a95c" stroke="#9a6526" stroke-linejoin="round"/>' +
    '<path d="M10.2 16.6l4.2 3.2M15.8 16.6l-4.2 3.2M12 14.8l3.6 2.6M14 14.8l-3.6 2.6" stroke="#b67a35" stroke-width=".7"/>';
  var SCOOP = '<path d="M6.2 13.4a6.8 6.8 0 1 1 13.6 0c-.8.9-1.6.2-2.3.9s-1.5-.3-2.3.4-1.5-.3-2.2.4-1.5-.4-2.3.3-1.6-.4-2.3.3c-.9-.1-1.5-.9-2.2-1.6z" fill="#f6a5c6" stroke="#c4517f"/>';
  var CHEEKS = '<circle cx="9" cy="12.4" r=".9" fill="#ee6f9f" opacity=".7"/><circle cx="17" cy="12.4" r=".9" fill="#ee6f9f" opacity=".7"/>';

  var scooped = {
    face: {
      idle: face(CONE + SCOOP + CHEEKS +
        '<circle cx="10.6" cy="10.6" r=".95" fill="#4a2333"/><circle cx="15.4" cy="10.6" r=".95" fill="#4a2333"/>' +
        '<path d="M11.2 12.4c1 .9 2.6.9 3.6 0" fill="none" stroke="#4a2333" stroke-width="1" stroke-linecap="round"/>'),
      press: face(CONE + '<g transform="rotate(-14 13 14)">' + SCOOP +
        '<circle cx="10.6" cy="10.2" r=".95" fill="#4a2333"/><circle cx="15.4" cy="10.2" r=".95" fill="#4a2333"/>' +
        '<ellipse cx="13" cy="12.6" rx="1.1" ry="1.3" fill="#4a2333"/></g>' + SWEAT),
      lose: face(CONE +
        '<path d="M6.2 13.4a6.8 6.8 0 1 1 13.6 0" fill="none" stroke="#c4517f" stroke-width=".8" stroke-dasharray="1.4 1.4" opacity=".7"/>' +
        '<circle cx="11.5" cy="16.3" r=".8" fill="#4a2333"/><circle cx="14.5" cy="16.3" r=".8" fill="#4a2333"/>' +
        '<path d="M11.7 19.3c.8-.7 1.8-.7 2.6 0" fill="none" stroke="#4a2333" stroke-width=".9" stroke-linecap="round"/>' +
        '<path d="M15.3 16.9c.5.8.8 1.2.8 1.6a.8.8 0 0 1-1.6 0c0-.4.3-.8.8-1.6z" fill="#55acee"/>' +
        '<path d="M16.2 25.2c0-1.7 1.6-2.8 3.6-2.8s3.7 1.1 3.7 2.8z" fill="#f6a5c6" stroke="#c4517f"/>' +
        '<circle cx="15" cy="23.6" r=".6" fill="#f6a5c6"/><circle cx="24.4" cy="23.2" r=".5" fill="#f6a5c6"/>'),
      win: face(CONE + SCOOP + CHEEKS +
        '<path d="M9.4 9.6l.8 1.6M15.6 8.8l1.6.4M12.6 7.6l-.4 1.4M17.6 11.2l.4 1.4M8.2 12.2l1.4-.6" stroke-width="1" stroke-linecap="round" stroke="#6a1b9a"/>' +
        '<path d="M11.6 8.4l1.2.6M14.6 11.6l-.6 1.2" stroke="#1e88e5" stroke-width="1" stroke-linecap="round"/>' +
        '<path d="M9.6 10.8c.5-.7 1.5-.7 2 0M14.4 10.8c.5-.7 1.5-.7 2 0" fill="none" stroke="#4a2333" stroke-width=".95" stroke-linecap="round"/>' +
        '<path d="M10.8 12.2h4.4c0 1.6-1 2.4-2.2 2.4s-2.2-.8-2.2-2.4z" fill="#4a2333"/>' +
        '<path d="M13 4.6c.3-1.4 1.2-2.4 2.6-2.9" fill="none" stroke="#2e7d32" stroke-width=".9"/><circle cx="13" cy="5.4" r="2" fill="#e53935" stroke="#9e1b1b" stroke-width=".5"/>')
    },
    mine: cell('<path d="M12.4 9.6 18.2 3.8" stroke="#7d8793" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle cx="8.4" cy="11.4" r="5.6" fill="#f6a5c6" stroke="#c4517f"/>' +
      '<circle cx="6.6" cy="9.4" r="1.2" fill="#fff" opacity=".5"/>' +
      '<path d="M2.8 12.2a5.6 5.6 0 0 0 11 1.2" fill="none" stroke="#9aa4b0" stroke-width="2.2" stroke-linecap="round"/>'),
    flag: pennant("#c2185b", "cf.", 5)
  };

  // ---------------------------------------------------------------------
  // Quick Question: the presenter with a headset microphone; the mine is a raised hand.
  // ---------------------------------------------------------------------
  var PRES = '<circle cx="13" cy="14" r="9" fill="#e9b88c" stroke="#7a4f2c"/>' +
    '<path d="M4.2 12.5C4.4 7.4 8.2 4.6 13 4.6s8.6 2.8 8.8 7.9c-1.3-1.8-3-2.9-5.2-3.4-2.2 1.3-6.4 1.9-9.3 1.2-1.2.5-2.3 1.2-3.1 2.2z" fill="#5b3a1e"/>' +
    '<rect x="3.1" y="12.4" width="2.1" height="4.2" rx="1" fill="#333"/>' +
    '<path d="M4.4 16c.5 2.4 2.6 4.3 5.2 4.6" fill="none" stroke="#333"/><circle cx="10" cy="20.6" r="1.1" fill="#333"/>';

  var seminar = {
    face: {
      idle: face(PRES +
        '<circle cx="9.8" cy="13.4" r="1.1" fill="#2a1a0e"/><circle cx="16.2" cy="13.4" r="1.1" fill="#2a1a0e"/>' +
        '<path d="M11 17.4c1.3 1.1 3.2 1.1 4.5 0" fill="none" stroke="#7a3b22" stroke-width="1.2" stroke-linecap="round"/>'),
      press: face(PRES +
        '<path d="M8.4 11.2l2.6-.7M17.6 11.2l-2.6-.7" stroke="#5b3a1e" stroke-width="1" stroke-linecap="round"/>' +
        '<circle cx="9.8" cy="13.6" r="1.1" fill="#2a1a0e"/><circle cx="16.2" cy="13.6" r="1.1" fill="#2a1a0e"/>' +
        '<ellipse cx="13.6" cy="18" rx="1.3" ry="1.6" fill="#7a3b22"/>' + SWEAT),
      lose: face(PRES +
        '<path d="M8.6 13.6h2.4M15 13.6h2.4" stroke="#2a1a0e" stroke-width="1.2" stroke-linecap="round"/>' +
        '<path d="M11.2 18.4c.8-.7 1.6.7 2.4 0s1.6.7 2.4 0" fill="none" stroke="#7a3b22" stroke-width="1.1" stroke-linecap="round"/>' +
        '<path d="M17.4 1h7a1.5 1.5 0 0 1 1.5 1.5V7a1.5 1.5 0 0 1-1.5 1.5H21l-2.6 2.2V8.5h-1A1.5 1.5 0 0 1 15.9 7V2.5A1.5 1.5 0 0 1 17.4 1z" fill="#fff" stroke="#c62828"/>' +
        '<text x="20.9" y="7.2" font-family="Georgia,serif" font-size="6.6" font-weight="bold" fill="#c62828" text-anchor="middle">?</text>'),
      win: face(PRES +
        '<path d="M8.6 13.8c.6-.9 1.8-.9 2.4 0M15 13.8c.6-.9 1.8-.9 2.4 0" fill="none" stroke="#2a1a0e" stroke-width="1.1" stroke-linecap="round"/>' +
        '<path d="M10.4 16.6h5.6c0 2-1.2 3.2-2.8 3.2s-2.8-1.2-2.8-3.2z" fill="#7a3b22"/>' +
        '<circle cx="21.4" cy="20.8" r="3.7" fill="#2e7d32" stroke="#fff" stroke-width=".8"/>' +
        '<path d="M19.7 20.8l1.2 1.2 2.3-2.5" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>')
    },
    mine: cell('<g fill="#f2c79b" stroke="#8a5a2b" stroke-width=".8">' +
      '<rect x="5.4" y="3.8" width="2" height="7.4" rx="1"/><rect x="7.6" y="2.4" width="2" height="8.6" rx="1"/>' +
      '<rect x="9.8" y="2.8" width="2" height="8.2" rx="1"/><rect x="12" y="4.4" width="1.9" height="6.6" rx=".95"/>' +
      '<rect x="2.4" y="9.6" width="2" height="5" rx="1" transform="rotate(-32 3.4 12.1)"/>' +
      '<rect x="5.2" y="9" width="8.7" height="7.4" rx="2.4"/></g>' +
      '<rect x="6" y="16.2" width="7" height="3.4" fill="#3f51b5"/>' +
      '<circle cx="16.4" cy="5.4" r="3.4" fill="#c62828"/>' +
      '<text x="16.4" y="7.5" font-family="Georgia,serif" font-size="5.6" font-weight="bold" fill="#fff" text-anchor="middle">?</text>'),
    flag: cell('<path d="M3.4 3.4h13.2v9.2l-4 4H3.4z" fill="#ffe066" stroke="#b8960c"/>' +
      '<path d="M16.6 12.6h-4v4" fill="#f5c800" stroke="#b8960c" stroke-linejoin="round"/>' +
      '<path d="M5.8 6.6h8.4M5.8 9.2h8.4M5.8 11.8h5" stroke="#9a7d00" stroke-width=".9"/>')
  };

  // ---------------------------------------------------------------------
  // Exclusion Restriction: the weather; the mine is a thunderstorm.
  // ---------------------------------------------------------------------
  var CLOUD = "M7 20.5h12.5a4 4 0 0 0 .4-8 5.6 5.6 0 0 0-10.8-1.2A4.7 4.7 0 0 0 7 20.5z";

  var rain = {
    face: {
      idle: face('<circle cx="19" cy="7.4" r="4.2" fill="#ffc933" stroke="#e09a00"/>' +
        '<path d="M19 .9v1.6M24.4 2.6l-1.2 1.1M25.5 7.4h-1.6M14.4 2.8l1.1 1.1" stroke="#e09a00" stroke-width="1.1" stroke-linecap="round"/>' +
        '<path d="' + CLOUD + '" fill="#fff" stroke="#6f8bab"/>' +
        '<circle cx="10.8" cy="15.4" r=".95" fill="#29405c"/><circle cx="15.4" cy="15.4" r=".95" fill="#29405c"/>' +
        '<path d="M11.4 17.3c.9.8 2.5.8 3.4 0" fill="none" stroke="#29405c" stroke-width="1" stroke-linecap="round"/>'),
      press: face('<path d="' + CLOUD + '" fill="#d3dce7" stroke="#6f8bab"/>' +
        '<circle cx="10.8" cy="15" r=".95" fill="#29405c"/><circle cx="15.4" cy="15" r=".95" fill="#29405c"/>' +
        '<ellipse cx="13.1" cy="17.6" rx="1" ry="1.2" fill="#29405c"/>' +
        '<path d="M9 22.6l-.8 2M13 22.6l-.8 2M17 22.6l-.8 2" stroke="#3d8fd8" stroke-width="1.3" stroke-linecap="round"/>'),
      lose: face('<path d="' + CLOUD + '" fill="#5f6e80" stroke="#37424f"/>' +
        '<path d="M9.4 13.4l2.4.9M16.8 13.4l-2.4.9" stroke="#fff" stroke-width="1" stroke-linecap="round"/>' +
        '<circle cx="10.8" cy="15.6" r=".9" fill="#fff"/><circle cx="15.4" cy="15.6" r=".9" fill="#fff"/>' +
        '<path d="M11.4 18.4c.9-.8 2.5-.8 3.4 0" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>' +
        '<path d="M14.2 19.6l-2.8 3.4h2.2l-1.4 2.8 4-4.2h-2.3l1.6-2z" fill="#ffd400" stroke="#9c7c00" stroke-width=".5" stroke-linejoin="round"/>'),
      win: face('<g fill="none" stroke-width="1.5">' +
        '<path d="M.6 16a12.4 12.4 0 0 1 24.8 0" stroke="#e53935"/><path d="M2.1 16a10.9 10.9 0 0 1 21.8 0" stroke="#fb8c00"/>' +
        '<path d="M3.6 16a9.4 9.4 0 0 1 18.8 0" stroke="#fdd835"/><path d="M5.1 16a7.9 7.9 0 0 1 15.8 0" stroke="#43a047"/>' +
        '<path d="M6.6 16a6.4 6.4 0 0 1 12.8 0" stroke="#1e88e5"/></g>' +
        '<path d="' + CLOUD + '" fill="#fff" stroke="#6f8bab"/>' +
        '<path d="M9.8 15.6c.5-.7 1.5-.7 2 0M14.4 15.6c.5-.7 1.5-.7 2 0" fill="none" stroke="#29405c" stroke-width=".95" stroke-linecap="round"/>' +
        '<path d="M11 17h4.2c0 1.5-.9 2.3-2.1 2.3S11 18.5 11 17z" fill="#29405c"/>')
    },
    mine: cell('<path d="M3.5 12h11a3.3 3.3 0 0 0 .3-6.6 4.6 4.6 0 0 0-8.9-1A3.8 3.8 0 0 0 3.5 12z" fill="#56657a" stroke="#2f3946"/>' +
      '<path d="M10.6 10.8l-2.8 4.2h2.3l-1.5 4.2 4.4-5.4h-2.4l1.7-3z" fill="#ffd400" stroke="#9c7c00" stroke-width=".5" stroke-linejoin="round"/>' +
      '<path d="M5.4 13.6l-.7 1.8M15.4 13.6l-.7 1.8" stroke="#3d8fd8" stroke-width="1.2" stroke-linecap="round"/>'),
    flag: pennant("#00796b", "⊥", 7)
  };

  window.MS_ART = { spec: spec, scooped: scooped, seminar: seminar, rain: rain };
})();
