/* ==========================================================================
   shared/minesweeper/minesweeper.js — a Minesweeper-style game on the XP desktop of the
   Paint, PowerPoint and Overleaf versions, in four economics themes.

     themes.js         ALL wording (edit the jokes there), the theme order and the default theme
     art.js            the pictures: faces, mines and flags per theme (original SVG)
     minesweeper.js    this file: the rules, the window, mouse / touch / keyboard
     minesweeper.css   the look, one palette per theme (.ms-theme-<id>)

   shared/xp/xp.js puts the icon on the desktop (above the Recycle Bin) and in the start menu,
   loads these files the first time the game is opened, and then calls
     Minesweeper.open({ theme: "spec", app: "paint", level: "beginner", seed: 42, demo: "won" })
   Every option is optional. ?minesweeper=<theme>&ms-level=...&ms-seed=...&ms-demo=won|lost in the
   address does the same on page load (see xp.js).

   Rules, as in the classic game: the first click is always safe and opens an area; a number counts
   the mines among the eight squares around it; right-click (touch: press and hold, or Flag mode)
   marks a square; clicking a number whose mines are all marked opens the squares around it.
   Keyboard: Tab to the board, arrows move, Enter or Space opens, F marks, F2 starts a new game.
   Only best times are kept (localStorage "ms.best"); nothing else persists.
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil || {};
  var T = window.MS_THEMES;
  var ART = window.MS_ART || {};
  if (!T || !window.XP) return;
  var C = T.common;

  var LEVELS = {
    beginner:     { rows: 9,  cols: 9,  mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert:       { rows: 16, cols: 30, mines: 99 }
  };
  var LEVEL_IDS = ["beginner", "intermediate", "expert"];
  var MENU_IDS = ["game", "theme", "help"];
  var BEST_KEY = "ms.best";
  var LONG_PRESS_MS = 450;
  var CHECK = '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M1.5 5.2 4 7.6l4.6-5.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  // ---------- State ----------
  var win, menubar, boardWrap, board, faceBtn, mineLed, timeLed, flagBtn, hintEl, resultEl, liveEl;
  var cells = [];
  var themeId = null, theme = null, art = null;
  var levelId = "beginner";
  var g = null;                 // the current game (makeGame)
  var cursor = 0;               // the board square that Tab lands on
  var rng = Math.random;
  var flagMode = false;
  var press = null;             // a mouse button or finger held down on the board
  var menuEl = null, menuId = null;
  var placedOnce = false;
  var app = "";
  var faceShown = "";

  // ---------- Small helpers ----------
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs || {}) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return U.esc ? U.esc(s) : String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fill(text, vars) {
    return String(text == null ? "" : text).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  }
  function isSmall() { return window.matchMedia ? matchMedia("(max-width: 700px)").matches : false; }
  function coarse() { return window.matchMedia ? matchMedia("(pointer: coarse)").matches : false; }
  function reducedMotion() {
    try { return U.prefersReducedMotion ? U.prefersReducedMotion() : false; } catch (e) { return false; }
  }
  // Statistics must never break the game.
  function track(event, props) {
    try { if (U.track) U.track(event, props || {}); } catch (e) { /* ignore */ }
  }
  function pad(n, width) { n = String(n); while (n.length < width) n = "0" + n; return n; }
  function themeIds() { return (T.order || Object.keys(T.themes)).filter(function (id) { return T.themes[id] && ART[id]; }); }
  // A small seeded random number generator (mulberry32), for ?ms-seed=... and tests.
  function seeded(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- The game ----------
  function makeGame(id) {
    var L = LEVELS[id], n = L.rows * L.cols;
    return {
      level: id, rows: L.rows, cols: L.cols, mines: L.mines, n: n,
      mine: new Uint8Array(n), open: new Uint8Array(n), flag: new Uint8Array(n), count: new Uint8Array(n),
      status: "ready",            // ready | playing | won | lost
      opened: 0, flags: 0, exploded: -1,
      elapsed: 0, since: 0, timer: 0,
      result: null                // { kind: "win"|"lose", time, best, reason }
    };
  }

  function over() { return g.status === "won" || g.status === "lost"; }

  function neighbours(i) {
    var r = Math.floor(i / g.cols), c = i % g.cols, out = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        var rr = r + dr, cc = c + dc;
        if ((dr || dc) && rr >= 0 && rr < g.rows && cc >= 0 && cc < g.cols) out.push(rr * g.cols + cc);
      }
    }
    return out;
  }

  // Mines go anywhere except the first square clicked and (room permitting) its neighbours,
  // so the first click always opens an area.
  function placeMines(safe) {
    var keep = {};
    keep[safe] = true;
    var around = neighbours(safe);
    if (g.n - 1 - around.length >= g.mines) around.forEach(function (k) { keep[k] = true; });
    var pool = [];
    for (var i = 0; i < g.n; i++) if (!keep[i]) pool.push(i);
    for (var k = 0; k < g.mines; k++) {
      var j = k + Math.floor(rng() * (pool.length - k));
      var t = pool[k]; pool[k] = pool[j]; pool[j] = t;
      g.mine[pool[k]] = 1;
    }
    for (i = 0; i < g.n; i++) {
      g.count[i] = neighbours(i).filter(function (x) { return g.mine[x]; }).length;
    }
  }

  // Open square i and, if it has no mines around it, everything connected (flags stay shut).
  function flood(i) {
    var stack = [i], changed = [];
    while (stack.length) {
      var k = stack.pop();
      if (g.open[k] || g.flag[k] || g.mine[k]) continue;
      g.open[k] = 1;
      g.opened++;
      changed.push(k);
      if (g.count[k] === 0) neighbours(k).forEach(function (x) { if (!g.open[x] && !g.flag[x]) stack.push(x); });
    }
    return changed;
  }

  // A click: open a closed square, or "chord" an open number.
  function act(i) {
    if (over()) return 0;
    var before = g.opened;
    if (g.open[i]) chord(i); else reveal(i);
    return g.opened - before;
  }

  function reveal(i) {
    if (over() || g.flag[i] || g.open[i]) return;
    if (g.status === "ready") {
      placeMines(i);
      g.status = "playing";
      resumeTimer();
    }
    if (g.mine[i]) { lose(i); return; }
    flood(i).forEach(paint);
    afterMove();
  }

  // Clicking a number whose flags are all placed opens the other squares around it
  // (a wrong flag means one of them is a mine: game over, as in the classic).
  function chord(i) {
    if (over() || !g.open[i] || !g.count[i]) return;
    var around = neighbours(i);
    var flagged = around.filter(function (x) { return g.flag[x]; }).length;
    if (flagged !== g.count[i]) { flash(around); return; }
    var hit = -1;
    around.forEach(function (x) {
      if (g.open[x] || g.flag[x]) return;
      if (g.mine[x]) { if (hit < 0) hit = x; return; }
      flood(x).forEach(paint);
    });
    if (hit >= 0) { lose(hit); return; }
    afterMove();
  }

  function toggleFlag(i) {
    if (over() || g.open[i]) return;
    g.flag[i] = g.flag[i] ? 0 : 1;
    g.flags += g.flag[i] ? 1 : -1;
    paint(i);
    showCounters();
  }

  function afterMove() {
    showCounters();
    if (g.opened === g.n - g.mines) win_();
  }

  function win_() {
    g.status = "won";
    pauseTimer();
    for (var i = 0; i < g.n; i++) {
      if (g.mine[i] && !g.flag[i]) { g.flag[i] = 1; g.flags++; }
      paint(i);
    }
    var secs = seconds();
    g.result = { kind: "win", time: secs, best: recordBest(secs) };
    showCounters();
    setFace();
    showResult(true);
    track("minesweeper_won", { theme: themeId, level: g.level, seconds: secs });
  }

  function lose(i) {
    g.status = "lost";
    g.exploded = i;
    pauseTimer();
    g.result = { kind: "lose", time: seconds(), reason: Math.floor(Math.random() * 1000) };
    for (var k = 0; k < g.n; k++) paint(k);
    showCounters();
    setFace();
    boom();
    showResult(true);
    track("minesweeper_lost", { theme: themeId, level: g.level });
  }

  // ---------- Timer (paused while the window is minimised) ----------
  function seconds() {
    if (g.status === "ready") return 0;
    var ms = g.elapsed + (g.since ? Date.now() - g.since : 0);
    return Math.min(999, Math.floor(ms / 1000) + 1);
  }
  function resumeTimer() {
    if (g.status !== "playing" || g.since) return;
    g.since = Date.now();
    g.timer = setInterval(showTime, 250);
    showTime();
  }
  function pauseTimer() {
    if (g.since) { g.elapsed += Date.now() - g.since; g.since = 0; }
    clearInterval(g.timer);
    g.timer = 0;
    showTime();
  }

  // ---------- Best times (this browser only) ----------
  function readBest() {
    try { return JSON.parse(localStorage.getItem(BEST_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function writeBest(b) {
    try { localStorage.setItem(BEST_KEY, JSON.stringify(b)); } catch (e) { /* storage blocked: no best times */ }
  }
  function recordBest(secs) {
    var b = readBest(), key = themeId + ":" + g.level;
    if (b[key] && b[key] <= secs) return false;
    b[key] = secs;
    writeBest(b);
    return true;
  }

  // ---------- Drawing the board ----------
  function words() { return theme.words; }

  function levelName(id) { return (theme.levels && theme.levels[id]) || C.levels[id]; }

  // What square i stands for in this theme (themes.js "cells"), e.g. "Row C, seat 7".
  function describe(i) {
    var cfg = theme.cells;
    if (!cfg || i < 0) return "";
    var r = Math.floor(i / g.cols), c = i % g.cols, parts = cfg.parts || [];
    return String(cfg.format).replace(/\{(\w+)\}/g, function (m, k) {
      if (k === "n") return i + 1;
      if (k === "row") return r + 1;
      if (k === "col") return c + 1;
      if (k === "rowLetter") return String.fromCharCode(65 + (r % 26));
      if (/^\d+$/.test(k)) {
        var list = parts[+k];
        if (!list || !list.length) return "";
        var h = (i + 1) * 2654435761 + (+k + 1) * 40503;
        h = (h ^ (h >>> 13)) >>> 0;
        return list[h % list.length];
      }
      return m;
    });
  }

  function cellState(i) {
    var w = words();
    if (g.open[i]) {
      var n = g.count[i];
      return n ? n + " " + (n === 1 ? w.mine : w.mines) + " nearby" : "empty";
    }
    if (g.status === "lost" && g.mine[i] && !g.flag[i]) return w.mine + (i === g.exploded ? ", went off" : "");
    if (g.flag[i]) return g.status === "lost" && !g.mine[i] ? "wrong flag" : "flagged as " + w.mine;
    return "unopened";
  }

  function paint(i) {
    var d = cells[i];
    if (!d) return;
    var cls = "ms-cell ms-f" + d._flavour, html = "";
    if (g.open[i]) {
      cls += " is-open" + (g.count[i] ? " n" + g.count[i] : "");
      html = g.count[i] ? String(g.count[i]) : "";
    } else if (g.status === "lost" && g.mine[i] && !g.flag[i]) {
      cls += " is-open is-mine" + (i === g.exploded ? " is-exploded" : "");
      html = art.mine;
    } else if (g.flag[i]) {
      cls += " is-hidden is-flag" + (g.status === "lost" && !g.mine[i] ? " is-wrong" : "");
      html = art.flag;
    } else {
      cls += " is-hidden";
    }
    if (d.className !== cls) d.className = cls;
    if (d._html !== html) { d.innerHTML = html; d._html = html; }
    var label = "Row " + (Math.floor(i / g.cols) + 1) + ", column " + (i % g.cols + 1) + ": " + cellState(i);
    if (d._label !== label) { d.setAttribute("aria-label", label); d._label = label; }
  }

  function paintAll() { for (var i = 0; i < g.n; i++) paint(i); }

  function buildBoard() {
    var frag = document.createDocumentFragment();
    cells = [];
    for (var r = 0; r < g.rows; r++) {
      var row = el("div", { "class": "ms-row", role: "row" });
      for (var c = 0; c < g.cols; c++) {
        var i = r * g.cols + c;
        var d = el("div", { "class": "ms-cell", role: "gridcell", tabindex: "-1", "data-i": String(i) });
        d._flavour = (r * 7 + c * 13 + (r * c) % 5) % 3;   // scooped: three ice-cream flavours
        cells.push(d);
        row.appendChild(d);
      }
      frag.appendChild(row);
    }
    board.innerHTML = "";
    board.appendChild(frag);
    board.setAttribute("aria-rowcount", String(g.rows));
    board.setAttribute("aria-colcount", String(g.cols));
    cursor = Math.min(cursor, g.n - 1);
    cells[cursor].tabIndex = 0;
    sizeBoard();
    paintAll();
  }

  // Square size: 24px with a mouse, 32px on touch screens; on phones as big as fits (28-44px).
  function sizeBoard() {
    if (!g || !board) return;
    var px;
    if (isSmall()) {
      var avail = Math.min(window.innerWidth, document.documentElement.clientWidth || window.innerWidth) - 44;
      px = Math.max(28, Math.min(44, Math.floor(avail / g.cols)));
    } else {
      px = coarse() ? 32 : 24;
    }
    board.style.setProperty("--ms-cell", px + "px");
  }

  function led(n) {
    n = Math.max(-99, Math.min(999, n));
    return n < 0 ? "-" + pad(-n, 2) : pad(n, 3);
  }
  function showCounters() {
    var left = g.mines - g.flags;
    mineLed.textContent = led(left);
    mineLed.setAttribute("aria-label", theme.counter + ": " + left);
    mineLed.title = theme.counter;
  }
  function showTime() {
    var s = seconds();
    var t = led(s);
    if (timeLed.textContent !== t) timeLed.textContent = t;
    timeLed.setAttribute("aria-label", theme.timer + ": " + s);
    timeLed.title = theme.timer;
  }

  function setFace(state) {
    state = state || (g.status === "won" ? "win" : g.status === "lost" ? "lose" : "idle");
    var key = themeId + ":" + state;
    if (faceShown === key) return;
    faceShown = key;
    faceBtn.innerHTML = art.face[state] || art.face.idle;
  }

  // Briefly press the closed squares around a number that cannot be chorded yet.
  function flash(list) {
    var hit = list.filter(function (x) { return !g.open[x] && !g.flag[x]; });
    hit.forEach(function (x) { cells[x].classList.add("is-pressed"); });
    setTimeout(function () { hit.forEach(function (x) { if (cells[x]) cells[x].classList.remove("is-pressed"); }); }, 160);
  }

  function boom() {
    if (reducedMotion()) return;
    boardWrap.classList.remove("is-boom");
    void boardWrap.offsetWidth;          // restart the animation
    boardWrap.classList.add("is-boom");
  }

  // ---------- Messages under the board ----------
  // The theme's introduction. On touch screens "right-click" reads "press and hold".
  function intro() {
    return coarse() ? String(theme.intro).replace(/right-click/g, "press and hold") : theme.intro;
  }

  function showIntro() {
    hintEl.style.minHeight = "";
    hintEl.textContent = intro();
    // Keep this height while the hint shows square names, so the window does not jump.
    if (hintEl.offsetHeight) hintEl.style.minHeight = hintEl.offsetHeight + "px";
  }

  function hint(text) {
    if (g.result) return;
    hintEl.textContent = text || intro();
  }

  function resultText() {
    var R = g.result, msg = R.kind === "win" ? theme.win : theme.lose;
    var reasons = (theme.lose && theme.lose.reasons) || [];
    var vars = {
      time: R.time, safe: g.n - g.mines, mines: g.mines, level: levelName(g.level),
      cell: describe(g.exploded) || cellPlace(g.exploded),
      reason: reasons.length ? reasons[(R.reason || 0) % reasons.length] : ""
    };
    var text = fill(msg.text, vars);
    return { title: fill(msg.title, vars), text: text.charAt(0).toUpperCase() + text.slice(1), best: R.best ? fill(C.newBest, vars) : "" };
  }

  function cellPlace(i) {
    return i < 0 ? "" : "Row " + (Math.floor(i / g.cols) + 1) + ", column " + (i % g.cols + 1);
  }

  function showResult(announceIt) {
    if (!g.result) {
      resultEl.hidden = true;
      hintEl.hidden = false;
      return;
    }
    var t = resultText();
    resultEl.className = "ms-result ms-result--" + g.result.kind;
    resultEl.innerHTML = "<b></b><p></p>" + (t.best ? '<p class="ms-best"></p>' : "") +
      '<button type="button" class="xp-button ms-again"></button>';
    resultEl.querySelector("b").textContent = t.title;
    resultEl.querySelector("p").textContent = t.text;
    if (t.best) resultEl.querySelector(".ms-best").textContent = t.best;
    resultEl.querySelector(".ms-again").textContent = C.playAgain;
    resultEl.hidden = false;
    hintEl.hidden = true;
    if (announceIt) announce(t.title + " " + t.text + (t.best ? " " + t.best : ""));
    place(false);
  }

  function announce(text) {
    liveEl.textContent = "";
    setTimeout(function () { liveEl.textContent = text; }, 40);
  }

  // ---------- New game, level, theme ----------
  function newGame(announceIt) {
    if (g) pauseTimer();
    g = makeGame(levelId);
    press = null;
    boardWrap.classList.remove("is-boom");
    resultEl.hidden = true;
    hintEl.hidden = false;
    buildBoard();
    showIntro();
    showCounters();
    showTime();
    setFace();
    if (announceIt) announce(C.newGame + ": " + C.levels[levelId] + ", " + g.mines + " " + words().mines + ".");
  }

  function setLevel(id) {
    if (!LEVELS[id] || (id === "expert" && isSmall())) return;
    levelId = id;
    newGame(true);
    place(false);
    focusCell(cursor);
  }

  function setTheme(id, quiet) {
    if (!T.themes[id] || !ART[id]) return;
    themeId = id;
    theme = T.themes[id];
    art = ART[id];
    var list = win.classList;
    themeIds().forEach(function (t) { list.remove("ms-theme-" + t); });
    list.add("ms-theme-" + id);
    XP.setTitle(win, T.gameName || "Minesweeper");   // the game's name, whatever the theme (Lehan, 2026-10-05)
    board.setAttribute("aria-label", theme.name + " board");
    flagBtn.innerHTML = art.flag + "<span></span>";
    flagBtn.querySelector("span").textContent = C.flagMode;
    flagBtn.title = C.flagModeTip + " (" + words().flag + ")";
    faceBtn.setAttribute("aria-label", theme.face);
    faceBtn.title = theme.face;
    if (g) {
      paintAll();
      showCounters();
      showTime();
      setFace();
      showIntro();
      showResult(false);
    }
    if (!quiet) {
      announce(theme.name + ". " + theme.pitch);
      track("minesweeper_theme_changed", { theme: id });
    }
  }

  function toggleFlagMode() {
    flagMode = !flagMode;
    flagBtn.setAttribute("aria-pressed", String(flagMode));
  }

  // ---------- The window ----------
  function build(initialTheme) {
    var first = T.themes[initialTheme] && ART[initialTheme] ? initialTheme : (T.themes[T.defaultTheme] ? T.defaultTheme : themeIds()[0]);
    win = el("div", {
      "class": "xp-window ms-window", id: "ms-window", "data-icon": "minesweeper",
      "data-title": T.gameName || "Minesweeper", "data-no-maximize": "", hidden: ""
    });
    win.innerHTML =
      '<div class="xp-window-body ms-body">' +
        '<div class="ms-menubar">' +
          MENU_IDS.map(function (id) {
            return '<button type="button" class="ms-menubtn" aria-haspopup="menu" aria-expanded="false" data-menu="' + id + '">' + esc(C.menus[id]) + "</button>";
          }).join("") +
        "</div>" +
        '<div class="ms-frame">' +
          '<div class="ms-panel">' +
            '<div class="ms-led ms-led--mines" role="img"></div>' +
            '<button type="button" class="ms-face"></button>' +
            '<div class="ms-led ms-led--time" role="img"></div>' +
          "</div>" +
          '<div class="ms-board-wrap"><div class="ms-board" role="grid"></div></div>' +
        "</div>" +
        '<div class="ms-foot">' +
          '<button type="button" class="xp-button ms-flagmode" aria-pressed="false"></button>' +
          '<p class="ms-hint"></p>' +
          '<div class="ms-result" role="group" hidden></div>' +
        "</div>" +
        '<div class="ms-live" aria-live="polite"></div>' +
      "</div>";
    (document.querySelector(".xp-desktop") || document.body).appendChild(win);

    menubar = win.querySelector(".ms-menubar");
    boardWrap = win.querySelector(".ms-board-wrap");
    board = win.querySelector(".ms-board");
    faceBtn = win.querySelector(".ms-face");
    mineLed = win.querySelector(".ms-led--mines");
    timeLed = win.querySelector(".ms-led--time");
    flagBtn = win.querySelector(".ms-flagmode");
    hintEl = win.querySelector(".ms-hint");
    resultEl = win.querySelector(".ms-result");
    liveEl = win.querySelector(".ms-live");

    XP.setupWindow(win);
    setTheme(first, true);
    newGame(false);
    wire();
  }

  // Centre the window the first time; later keep it where it is, but inside the desktop.
  function place(centre) {
    if (!win || win.hidden || isSmall()) return;
    var d = XP.desktopRect();
    win.style.width = "";
    win.style.height = "";
    win.style.right = "auto";
    win.style.bottom = "auto";
    win.style.transform = "none";
    var ww = win.offsetWidth, wh = win.offsetHeight;
    var left = parseFloat(win.style.left), top = parseFloat(win.style.top);
    if (centre || isNaN(left) || isNaN(top)) {
      left = (d.width - ww) / 2;
      top = (d.height - wh) / 2 - 12;
    }
    win.style.left = Math.round(Math.max(0, Math.min(d.width - ww, left))) + "px";
    win.style.top = Math.round(Math.max(0, Math.min(d.height - wh, top))) + "px";
  }

  function focusCell(i) {
    if (!cells.length) return;
    i = Math.max(0, Math.min(g.n - 1, i));
    if (cells[cursor]) cells[cursor].tabIndex = -1;
    cursor = i;
    cells[i].tabIndex = 0;
    try { cells[i].focus({ preventScroll: false }); } catch (e) { cells[i].focus(); }
  }

  function cellOf(target) {
    var d = target && target.closest ? target.closest(".ms-cell") : null;
    return d && board.contains(d) ? +d.getAttribute("data-i") : -1;
  }

  // ---------- Menus (Game, Theme, Help) ----------
  function menuItems(id) {
    var w = words();
    if (id === "game") {
      var items = [{ label: C.newGame, key: "F2", run: function () { newGame(true); focusCell(cursor); } }, "-"];
      LEVEL_IDS.forEach(function (lv) {
        var L = LEVELS[lv], tooBig = lv === "expert" && isSmall();
        items.push({
          label: C.levels[lv],
          sub: levelName(lv) + " · " + L.cols + " × " + L.rows + ", " + L.mines + " " + w.mines + (tooBig ? " (" + C.expertTooSmall + ")" : ""),
          checked: levelId === lv, radio: true, disabled: tooBig,
          run: function () { setLevel(lv); }
        });
      });
      items.push("-",
        { label: C.flagMode, sub: C.flagModeTip, checked: flagMode, run: toggleFlagMode },
        { label: C.bestTimes, run: showBest },
        "-",
        { label: C.exit, run: function () { XP.close(win); } });
      return items;
    }
    if (id === "theme") {
      var list = [{ head: C.chooseTheme }];
      themeIds().forEach(function (tid) {
        var t = T.themes[tid];
        list.push({ label: t.name, sub: t.pitch, checked: tid === themeId, radio: true, icon: ART[tid].face.idle,
          run: function () { setTheme(tid); focusCell(cursor); } });
      });
      return list;
    }
    return [
      { label: C.howToPlay, run: showHowTo },
      { label: C.aboutTheme + ": " + theme.name, run: showAboutTheme },
      "-",
      { label: C.about, run: showAbout }
    ];
  }

  function openMenu(id, focusFirst) {
    closeMenu(false);
    var btn = menubar.querySelector('[data-menu="' + id + '"]');
    var m = el("div", { "class": "ms-dropdown", role: "menu", "aria-label": btn.textContent });
    menuItems(id).forEach(function (it) {
      if (it === "-") { m.appendChild(el("div", { "class": "ms-sep", role: "separator" })); return; }
      if (it.head) { m.appendChild(el("div", { "class": "ms-menu-head", role: "presentation" }, esc(it.head))); return; }
      var role = it.checked == null ? "menuitem" : it.radio ? "menuitemradio" : "menuitemcheckbox";
      var b = el("button", { type: "button", "class": "ms-mi", role: role, tabindex: "-1" },
        '<span class="ms-mi-mark">' + (it.checked ? CHECK : "") + "</span>" +
        (it.icon ? '<span class="ms-mi-icon">' + it.icon + "</span>" : "") +
        '<span class="ms-mi-text"><span class="ms-mi-label"></span>' + (it.sub ? '<span class="ms-mi-sub"></span>' : "") + "</span>" +
        (it.key ? '<span class="ms-mi-key">' + esc(it.key) + "</span>" : ""));
      b.querySelector(".ms-mi-label").textContent = it.label;
      if (it.sub) b.querySelector(".ms-mi-sub").textContent = it.sub;
      if (it.checked != null) b.setAttribute("aria-checked", String(!!it.checked));
      if (it.disabled) b.setAttribute("aria-disabled", "true");
      b.addEventListener("click", function () {
        if (it.disabled) return;
        closeMenu(true);
        it.run();
      });
      m.appendChild(b);
    });
    win.appendChild(m);
    menuEl = m;
    menuId = id;
    btn.setAttribute("aria-expanded", "true");

    // Under its button, inside the screen.
    var wr = win.getBoundingClientRect(), br = btn.getBoundingClientRect();
    var left = br.left - wr.left - win.clientLeft;
    var maxLeft = window.innerWidth - 6 - m.offsetWidth - wr.left - win.clientLeft;
    m.style.left = Math.max(-wr.left, Math.min(left, maxLeft)) + "px";
    m.style.top = (br.bottom - wr.top) + "px";

    if (focusFirst !== false) {
      var first = m.querySelector(".ms-mi");
      if (first) first.focus();
    }
  }

  function closeMenu(refocus) {
    if (!menuEl) return;
    var btn = menubar.querySelector('[data-menu="' + menuId + '"]');
    menuEl.remove();
    menuEl = null;
    menuId = null;
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      if (refocus) btn.focus();
    }
  }

  function adjacentMenu(id, step) {
    var i = MENU_IDS.indexOf(id);
    return MENU_IDS[(i + step + MENU_IDS.length) % MENU_IDS.length];
  }

  // ---------- Dialogs ----------
  function showHowTo() {
    var w = words(), vars = {};
    ["mine", "mines", "flag", "flagVerb", "square", "squares"].forEach(function (k) { vars[k] = esc(w[k]); });
    XP.alert({ title: C.howToPlay + ": " + theme.name, icon: "help", html: fill(C.howToHtml, vars), buttons: ["OK"] });
  }
  function showAboutTheme() {
    XP.alert({ title: theme.name, icon: "info", html: theme.about, buttons: ["OK"] });
  }
  function showAbout() {
    XP.alert({ title: C.about, icon: "info", html: C.aboutHtml, buttons: ["OK"] });
  }
  function showBest() {
    var b = readBest();
    var rows = LEVEL_IDS.map(function (lv) {
      var s = b[themeId + ":" + lv];
      return "<tr><th>" + esc(C.levels[lv]) + " <span>(" + esc(levelName(lv)) + ")</span></th><td>" +
        (s ? s + " s" : esc(C.bestNone)) + "</td></tr>";
    }).join("");
    XP.alert({
      title: C.bestTitle + ": " + theme.name, icon: "info",
      html: '<table class="ms-best-table">' + rows + "</table>",
      buttons: [C.bestReset, "OK"]
    }).then(function (choice) {
      if (choice !== C.bestReset) return;
      var all = readBest();
      LEVEL_IDS.forEach(function (lv) { delete all[themeId + ":" + lv]; });
      writeBest(all);
    });
  }

  // ---------- Keyboard (via XP.ownKeys, so the apps behind never see these keys) ----------
  var NAV_KEY = /^(Arrow(Up|Down|Left|Right)|PageUp|PageDown|Home|End)$/;

  function onKey(e) {
    var t = e.target, k = e.key;
    if (menuEl && menuEl.contains(t)) return menuKey(e);
    var mb = t.closest ? t.closest(".ms-menubtn") : null;
    if (mb) return menubarKey(e, mb);
    if (k === "F2") { e.preventDefault(); newGame(true); focusCell(cursor); return true; }
    if (k === "Escape" && menuEl) { closeMenu(true); return true; }
    var i = t.classList && t.classList.contains("ms-cell") ? +t.getAttribute("data-i") : -1;
    if (i >= 0) return gridKey(e, i);
    return NAV_KEY.test(k);    // e.g. arrows on the face button: keep them from the app behind
  }

  function gridKey(e, i) {
    if (e.altKey || e.metaKey) return false;
    var r = Math.floor(i / g.cols), c = i % g.cols, to = -1, k = e.key;
    if (e.ctrlKey && k !== "Home" && k !== "End") return false;
    if (k === "ArrowUp") to = r > 0 ? i - g.cols : i;
    else if (k === "ArrowDown") to = r < g.rows - 1 ? i + g.cols : i;
    else if (k === "ArrowLeft") to = c > 0 ? i - 1 : i;
    else if (k === "ArrowRight") to = c < g.cols - 1 ? i + 1 : i;
    else if (k === "Home") to = e.ctrlKey ? 0 : r * g.cols;
    else if (k === "End") to = e.ctrlKey ? g.n - 1 : r * g.cols + g.cols - 1;
    else if (k === "PageUp") to = c;
    else if (k === "PageDown") to = (g.rows - 1) * g.cols + c;
    else if (k === "Enter" || k === " " || k === "Spacebar") {
      e.preventDefault();
      if (!e.repeat) {
        var opened = act(i);
        if (!over()) announce(cellState(i) + (opened > 1 ? ". " + opened + " squares opened." : ""));
      }
      return true;
    } else if (k === "f" || k === "F") {
      e.preventDefault();
      if (!e.repeat) { toggleFlag(i); if (!over()) announce(cellState(i)); }
      return true;
    } else return false;
    e.preventDefault();
    focusCell(to);
    return true;
  }

  function menuKey(e) {
    var items = Array.prototype.slice.call(menuEl.querySelectorAll(".ms-mi"));
    var i = items.indexOf(document.activeElement), k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      items[(i + (k === "ArrowDown" ? 1 : -1) + items.length) % items.length].focus();
      return true;
    }
    if (k === "Home" || k === "End") { e.preventDefault(); items[k === "Home" ? 0 : items.length - 1].focus(); return true; }
    if (k === "Escape") { e.preventDefault(); closeMenu(true); return true; }
    if (k === "ArrowLeft" || k === "ArrowRight") {
      e.preventDefault();
      openMenu(adjacentMenu(menuId, k === "ArrowRight" ? 1 : -1), true);
      return true;
    }
    if (k === "Tab") { closeMenu(false); return false; }
    return k === "Enter" || k === " " || NAV_KEY.test(k);
  }

  function menubarKey(e, b) {
    var k = e.key, id = b.getAttribute("data-menu");
    if (k === "ArrowDown" || k === "Enter" || k === " ") { e.preventDefault(); openMenu(id, true); return true; }
    if (k === "ArrowLeft" || k === "ArrowRight") {
      e.preventDefault();
      var next = adjacentMenu(id, k === "ArrowRight" ? 1 : -1);
      if (menuEl) openMenu(next, false);
      menubar.querySelector('[data-menu="' + next + '"]').focus();
      return true;
    }
    if (k === "Escape" && menuEl) { e.preventDefault(); closeMenu(true); return true; }
    if (k === "F2") { e.preventDefault(); newGame(true); focusCell(cursor); return true; }
    return NAV_KEY.test(k);
  }

  // ---------- Mouse and touch ----------
  function clearPressed() {
    var p = board.querySelectorAll(".is-pressed");
    for (var k = 0; k < p.length; k++) p[k].classList.remove("is-pressed");
  }
  function showPressed(i) {
    clearPressed();
    if (i >= 0 && !g.open[i] && !g.flag[i]) cells[i].classList.add("is-pressed");
  }
  function endPress() {
    if (!press) return;
    clearTimeout(press.timer);
    clearPressed();
    press = null;
    if (g) setFace();
  }

  function wire() {
    // Menu bar
    menubar.addEventListener("click", function (e) {
      var b = e.target.closest(".ms-menubtn");
      if (!b) return;
      var id = b.getAttribute("data-menu");
      if (menuId === id) closeMenu(false); else openMenu(id, true);
    });
    menubar.addEventListener("mouseover", function (e) {
      var b = e.target.closest(".ms-menubtn");
      if (b && menuEl && menuId !== b.getAttribute("data-menu")) openMenu(b.getAttribute("data-menu"), true);
    });
    document.addEventListener("pointerdown", function (e) {
      if (menuEl && !menuEl.contains(e.target) && !menubar.contains(e.target)) closeMenu(false);
    }, true);

    faceBtn.addEventListener("click", function () { newGame(true); });
    flagBtn.addEventListener("click", toggleFlagMode);
    resultEl.addEventListener("click", function (e) {
      if (e.target.closest(".ms-again")) { newGame(true); focusCell(cursor); }
    });

    // The board: left button opens, right button flags, middle button chords. Touch: tap opens,
    // press and hold flags (or tap flags in Flag mode).
    board.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    board.addEventListener("pointerdown", function (e) {
      var i = cellOf(e.target);
      if (i < 0 || !g) return;
      closeMenu(false);
      if (over()) return;
      if (e.button === 2) { e.preventDefault(); toggleFlag(i); return; }
      if (e.button === 1) { e.preventDefault(); chord(i); return; }
      if (e.button !== 0) return;
      endPress();
      var touch = e.pointerType === "touch" || e.pointerType === "pen";
      press = { i: i, id: e.pointerId, x: e.clientX, y: e.clientY, touch: touch, long: false, timer: 0 };
      showPressed(i);
      setFace("press");
      if (touch && !flagMode) {
        press.timer = setTimeout(function () {
          if (!press) return;
          press.long = true;
          clearPressed();
          toggleFlag(press.i);
          setFace();
          try { if (navigator.vibrate) navigator.vibrate(15); } catch (err) { /* no vibration */ }
        }, LONG_PRESS_MS);
      }
    });
    board.addEventListener("pointermove", function (e) {
      if (!press || e.pointerId !== press.id || press.long) return;
      if (press.touch) {
        if (Math.abs(e.clientX - press.x) > 10 || Math.abs(e.clientY - press.y) > 10) endPress();   // a scroll, not a tap
        return;
      }
      var i = cellOf(e.target);           // the mouse: the pressed look follows it, as in the classic
      if (i !== press.i) { press.i = i; showPressed(i); }
    });
    board.addEventListener("pointerleave", function (e) {
      if (press && !press.touch && e.pointerId === press.id) { press.i = -1; clearPressed(); }
    });
    board.addEventListener("pointerup", function (e) {
      if (!press || e.pointerId !== press.id) return;
      var p = press;
      endPress();
      if (p.long) return;
      var i = p.touch ? p.i : cellOf(e.target);   // a finger stays with the square it touched
      if (i < 0) return;
      if (flagMode && !g.open[i]) toggleFlag(i); else act(i);
    });
    board.addEventListener("pointercancel", endPress);
    // Released outside the board: nothing opens.
    document.addEventListener("pointerup", function (e) {
      if (press && e.pointerId === press.id && !board.contains(e.target)) endPress();
    }, true);

    // Under the board: what the square under the mouse (or keyboard focus) stands for.
    board.addEventListener("mouseover", function (e) {
      var i = cellOf(e.target);
      if (i >= 0) hint(describe(i));
    });
    board.addEventListener("mouseleave", function () { hint(""); });
    board.addEventListener("focusin", function (e) {
      var i = cellOf(e.target);
      if (i < 0) return;
      if (cells[cursor] && cursor !== i) cells[cursor].tabIndex = -1;
      cursor = i;
      cells[i].tabIndex = 0;
      hint(describe(i));
    });

    // Window events
    win.addEventListener("xp:minimize", function () { closeMenu(false); pauseTimer(); });
    win.addEventListener("xp:restore", function () { resumeTimer(); });
    win.addEventListener("xp:close", function () { closeMenu(false); endPress(); newGame(false); });   // closing ends the game

    var resizeQueued = false;
    window.addEventListener("resize", function () {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(function () {
        resizeQueued = false;
        sizeBoard();
        place(false);
      });
    });

    if (XP.ownKeys) XP.ownKeys(win, onKey);
    else win.addEventListener("keydown", function (e) { if (onKey(e)) e.stopPropagation(); });
  }

  // ---------- Demo boards (?ms-demo=won|lost), for screenshots ----------
  function demo(kind) {
    newGame(false);
    reveal(Math.floor(g.rows / 2) * g.cols + Math.floor(g.cols / 2));
    if (kind === "won") {
      for (var i = 0; i < g.n && g.status === "playing"; i++) if (!g.mine[i] && !g.open[i]) reveal(i);
      return;
    }
    if (kind !== "lost") return;
    var near = -1, other = -1, wrong = -1;
    for (i = 0; i < g.n; i++) {
      var touchesOpen = neighbours(i).some(function (x) { return g.open[x]; });
      if (g.mine[i] && touchesOpen) { if (near < 0) near = i; else if (other < 0) other = i; }
      if (!g.mine[i] && !g.open[i] && wrong < 0 && touchesOpen) wrong = i;
    }
    if (other >= 0) toggleFlag(other);      // a right flag
    if (wrong >= 0) toggleFlag(wrong);      // and a wrong one
    if (near >= 0) reveal(near);
  }

  // ---------- Public ----------
  function open(o) {
    o = o || {};
    if (o.seed != null && !isNaN(+o.seed)) rng = seeded(+o.seed);
    if (!win) build(o.theme);
    else if (T.themes[o.theme] && o.theme !== themeId) setTheme(o.theme, true);
    app = o.app || app;
    var wasHidden = win.hidden;
    if (o.level && LEVELS[o.level] && o.level !== levelId && !(o.level === "expert" && isSmall())) {
      levelId = o.level;
      newGame(false);
    } else if (o.seed != null && g.status !== "ready") {
      newGame(false);
    }
    XP.open(win);
    if (wasHidden) {
      sizeBoard();
      showIntro();
      place(!placedOnce);
      placedOnce = true;
    }
    if (o.demo) demo(o.demo);
    focusCell(cursor);         // so the keyboard works at once
    hint("");                  // ...but show the theme's introduction, not the square's name
    track("minesweeper_opened", { theme: themeId, app: app });
  }

  window.Minesweeper = {
    open: open,
    newGame: function () { if (g) newGame(true); },
    setTheme: function (id) { if (win) setTheme(id); },
    setLevel: function (id) { if (win) setLevel(id); },
    themes: themeIds,
    // For the automated tests only: a read-only picture of the current game.
    _state: function () {
      if (!g) return null;
      var mines = [];
      for (var i = 0; i < g.n; i++) if (g.mine[i]) mines.push(i);
      return {
        theme: themeId, level: g.level, rows: g.rows, cols: g.cols, status: g.status, opened: g.opened,
        flags: g.flags, mines: mines, open: Array.prototype.slice.call(g.open),
        count: Array.prototype.slice.call(g.count), cursor: cursor, flagMode: flagMode
      };
    }
  };
})();
