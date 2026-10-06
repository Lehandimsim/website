/* ==========================================================================
   fun/kitchen/game.js — the playable second recipe in the recipe book:
   fried rice, in five easy Cooking Mama-style steps.

     chop   click (or tap) on each dashed line          keyboard: Space
     crack  tap the egg twice                           keyboard: Space
     stir   circle the pointer over the wok             or click / Space
     pour   press and hold, let go at the dashed line   keyboard: hold Space
     toss   click when the marker is in the green zone  keyboard: Space

   Nothing can fail: a better job earns a gold medal instead of bronze, and
   every step has a Skip button. At the end: a plate, 1-3 stars, a cheer.
   The drawings are the <template id="tpl-game-..."> blocks in index.html;
   the words are in text.js (KITCHEN_TEXT.game).
   ========================================================================== */

(function () {
  "use strict";

  var T = window.KITCHEN_TEXT, G = T.game, U = window.SiteUtil;
  var STAGES = ["chop", "crack", "stir", "pour", "toss"];
  var MEDALS = ["", "is-bronze", "is-silver", "is-gold"];   // by points (1-3)

  function $(id) { return document.getElementById(id); }
  function fmt(text, values) {
    return String(text).replace(/\{(\w+)\}/g, function (m, k) { return values[k] != null ? values[k] : m; });
  }
  function clamp(x, lo, hi) { return Math.max(lo, Math.min(hi, x)); }
  // Motion off (system setting or the Motion switch): shorter waits, no swinging.
  function reduced() { return document.documentElement.classList.contains("motion-off"); }

  var hit = $("game-hit"), art = $("game-art"), popEl = $("game-pop");
  var game = null;      // { index, name, scores, svg, stage, timers, raf, finishing }

  // ---------------------------------------------------------------------------
  // Shared plumbing
  // ---------------------------------------------------------------------------
  function later(ms, fn) { if (game) game.timers.push(setTimeout(fn, ms)); }
  function loop(fn) {
    var last = performance.now();
    function frame(now) {
      if (!game) return;
      fn(Math.min((now - last) / 1000, .1), now);
      last = now;
      game.raf = requestAnimationFrame(frame);
    }
    game.raf = requestAnimationFrame(frame);
  }
  function cleanupStage() {
    if (!game) return;
    game.timers.forEach(clearTimeout);
    game.timers = [];
    cancelAnimationFrame(game.raf);
    if (game.stage && game.stage.teardown) game.stage.teardown();
    game.stage = null;
    game.finishing = false;
    popEl.className = "game-pop";
  }

  // Client (screen) coordinates -> the SVG's own coordinates.
  function toSvg(e) {
    if (!game || !game.svg || !game.svg.getScreenCTM) return null;
    var p = game.svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(game.svg.getScreenCTM().inverse());
  }

  // "Perfect!" etc. over the stage. x is in SVG units (0-640), optional.
  function pop(text, x) {
    popEl.textContent = text;
    popEl.style.left = (x != null ? clamp(x / 640 * 100, 18, 82) : 50) + "%";
    popEl.className = "game-pop";
    void popEl.offsetWidth;
    popEl.className = "game-pop is-on";
  }

  function instruct(text) { $("game-instruction").textContent = text; }

  function renderPips() {
    var html = "";
    STAGES.forEach(function (name, i) {
      var cls = game.scores[name] ? "is-on " + MEDALS[game.scores[name]] : (i === game.index ? "is-now" : "");
      html += '<li class="' + cls + '"></li>';
    });
    $("game-pips").innerHTML = html;
  }

  // A step is finished: remember the points (1-3), cheer, move on.
  function finish(points, message, x) {
    if (!game || game.finishing) return;
    game.finishing = true;
    game.scores[game.name] = points;
    renderPips();
    pop(message || G.ratings[points - 1], x);
    later(reduced() ? 500 : 1150, nextStage);
  }
  function nextStage() {
    if (!game) return;
    if (game.index < STAGES.length - 1) startStage(game.index + 1);
    else showResult();
  }

  // ---------------------------------------------------------------------------
  // Starting, stopping, steps
  // ---------------------------------------------------------------------------
  // Visitor statistics (via scene.js; does nothing until analytics is switched on).
  function track(name, props) {
    try { if (window.Kitchen && window.Kitchen.track) window.Kitchen.track(name, props); } catch (e) { /* optional */ }
  }

  // quiet: true when a link opens the result directly (#fried-rice/done): not a game played.
  function newGame(quiet) {
    stop();
    game = { index: 0, name: "", scores: {}, svg: null, stage: null, timers: [], raf: 0, finishing: false, quiet: !!quiet };
    if (!quiet) track("kitchen_second_recipe_started");
  }

  function startStage(i) {
    cleanupStage();
    var name = STAGES[i], info = G.stages[name];
    game.index = i;
    game.name = name;
    window.Kitchen.syncHash("fried-rice/" + name);

    $("game-kicker").textContent = G.kickerShort + " · " + fmt(G.stepOf, { n: i + 1, total: STAGES.length });
    $("game-title").textContent = info.title;
    instruct(info.instruction);
    $("game-keys").textContent = info.keys;
    $("game-skip").hidden = false;
    $("game-actions").hidden = true;
    hit.hidden = false;
    hit.setAttribute("aria-label", info.title + ". " + info.instruction + " " + info.keys);
    renderPips();

    art.innerHTML = "";
    art.appendChild(document.importNode($("tpl-game-" + name).content, true));
    game.svg = art.querySelector("svg");
    game.svg.setAttribute("preserveAspectRatio", "xMidYMid slice");   // phones: zoom in, trim the sides
    $("game").setAttribute("data-stage", name);
    game.stage = STAGE[name]();
    if (game.stage.setup) game.stage.setup(game.svg);
    // Keyboard users land on the big play button; others just get the title (no stray focus ring).
    var target = document.documentElement.classList.contains("kb") ? hit : $("game-title");
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  function showResult() {
    cleanupStage();
    game.index = STAGES.length;
    game.name = "done";
    window.Kitchen.syncHash("fried-rice/done");
    // Steps never played count as "Great" (2 points): you can't do badly by skipping ahead.
    // Out of 15: 12+ is three stars, 8+ two, anything else one. (Generous on purpose.)
    var total = 0;
    STAGES.forEach(function (s) { total += game.scores[s] || 2; });
    var stars = total >= 12 ? 3 : total >= 8 ? 2 : 1;
    if (!game.quiet) track("kitchen_second_recipe_finished", { stars: stars });

    $("game").setAttribute("data-stage", "done");
    $("game-kicker").textContent = G.kicker;
    $("game-title").textContent = G.resultTitle;
    // The cheer, plus the star count for screen readers (the stars themselves are a drawing).
    $("game-instruction").innerHTML = U.esc(G.results[stars - 1]) +
      '<span class="sr-only"> ' + U.esc(fmt(G.starsLabel, { n: stars })) + "</span>";
    $("game-keys").textContent = "";
    $("game-skip").hidden = true;
    hit.hidden = true;
    renderPips();

    art.innerHTML = "";
    art.appendChild(document.importNode($("tpl-game-result").content, true));
    game.svg = art.querySelector("svg");
    game.svg.classList.add("stars-" + stars);

    var actions = $("game-actions");
    actions.innerHTML =
      '<button class="btn btn--primary" type="button" data-act="again">' + U.esc(G.again) + "</button>" +
      '<a class="btn" href="#recipe-book">' + U.esc(G.toBook) + "</a>" +
      '<a class="btn" href="#kitchen">' + U.esc(G.toKitchen) + "</a>" +
      '<a class="btn btn--blog" ' + U.linkAttrs(window.SITE.person.links.blog) + ">" + U.esc(G.blog) + ' <span aria-hidden="true">↗</span></a>';
    actions.hidden = false;
    actions.querySelector('[data-act="again"]').addEventListener("click", function () { newGame(); startStage(0); });
    try { $("game-title").focus({ preventScroll: true }); } catch (e) { /* fine */ }
  }

  // Open the game at a step ("chop" ... "toss", "done"), or from the start.
  function show(name) {
    if (name === "done") {
      if (!game) newGame(true);
      if (game.name !== "done") showResult();
      return;
    }
    var i = STAGES.indexOf(name);
    if (i < 0) { newGame(); startStage(0); return; }
    if (game && game.name === name) return;
    if (!game) newGame();
    startStage(i);
  }

  function stop() {
    if (!game) return;
    cleanupStage();
    game = null;
  }

  // ---------------------------------------------------------------------------
  // Input: one big button over the stage. Mouse/touch use pointer events;
  // keyboard and screen readers arrive as clicks with detail 0, or keys.
  // ---------------------------------------------------------------------------
  var keyHold = false;
  hit.addEventListener("pointerdown", function (e) {
    var st = game && game.stage;
    if (!st || game.finishing) return;
    if (hit.setPointerCapture) { try { hit.setPointerCapture(e.pointerId); } catch (err) { /* fine */ } }
    var pt = toSvg(e);
    if (st.down) st.down(pt, e);
    if (st.press) st.press(pt, e);
  });
  hit.addEventListener("pointermove", function (e) {
    var st = game && game.stage;
    if (st && st.move) st.move(toSvg(e), e);
  });
  function release(e) {
    var st = game && game.stage;
    if (st && st.up) st.up(e);
  }
  hit.addEventListener("pointerup", release);
  hit.addEventListener("pointercancel", release);
  hit.addEventListener("click", function (e) {
    var st = game && game.stage;
    if (!st || game.finishing || e.detail !== 0) return;   // real pointer clicks were handled on pointerdown
    if (keyHold) { keyHold = false; return; }
    if (st.press) st.press(null, e);
    else if (st.toggle) st.toggle();
  });
  hit.addEventListener("keydown", function (e) {
    var st = game && game.stage;
    if (st && st.keydown && st.keydown(e)) { keyHold = true; e.preventDefault(); }
  });
  hit.addEventListener("keyup", function (e) {
    var st = game && game.stage;
    if (st && st.keyup && st.keyup(e)) e.preventDefault();
  });
  hit.addEventListener("contextmenu", function (e) { e.preventDefault(); });   // long-press on phones

  $("game-skip").innerHTML = U.esc(G.skip) + ' <span aria-hidden="true">›</span>';
  $("game-skip").addEventListener("click", function () {
    if (!game || game.finishing || !game.stage) return;
    finish(1, G.skipped);
  });
  $("game-quit").setAttribute("aria-label", G.quit);
  $("game-quit").addEventListener("click", function () { window.Kitchen.go("recipe-book"); });

  // ---------------------------------------------------------------------------
  // The five steps
  // ---------------------------------------------------------------------------
  var STAGE = {

    // 1. Chop: the knife follows the pointer; each click chops the nearest dashed line.
    chop: function () {
      var LINES = [200, 280, 360, 440], cut = [false, false, false, false];
      var total = 0, busy = false, knife, knifeIn, segs, lines;
      function setKnife(x) { knife.setAttribute("transform", "translate(" + x + " 166) scale(.78)"); }
      function chop(i, points) {
        busy = true;
        setKnife(LINES[i] - 4);
        knifeIn.classList.remove("is-chopping");
        void knifeIn.getBoundingClientRect();
        knifeIn.classList.add("is-chopping");
        cut[i] = true;
        lines[i].classList.add("is-cut");
        // Pieces to the right of each cut slide over a little.
        Array.prototype.forEach.call(segs, function (seg, j) {
          var shift = 0;
          for (var k = 0; k < j; k++) if (cut[k]) shift += 12;
          seg.style.transform = "translateX(" + shift + "px)";
        });
        total += points;
        if (cut.indexOf(false) < 0) { finish(Math.round(total / 4), null, LINES[i]); return; }
        pop(G.ratings[points - 1], LINES[i]);
        later(320, function () { busy = false; });
      }
      return {
        setup: function (svg) {
          knife = svg.querySelector(".g-knife");
          knifeIn = svg.querySelector(".g-knife-in");
          segs = svg.querySelectorAll(".g-seg");
          lines = svg.querySelectorAll(".g-line");
          setKnife(520);
        },
        move: function (pt) { if (pt && !busy) setKnife(clamp(pt.x, 150, 540)); },
        press: function (pt) {
          if (busy) return;
          var best = -1, bestD = 1e9;
          LINES.forEach(function (x, i) {
            if (cut[i]) return;
            var d = pt ? Math.abs(pt.x - x) : i;   // keyboard: the next line, chopped perfectly
            if (d < bestD) { bestD = d; best = i; }
          });
          if (best < 0) return;
          chop(best, !pt ? 3 : bestD <= 14 ? 3 : bestD <= 34 ? 2 : 1);
        }
      };
    },

    // 2. Crack: two taps (same drawing and animation as the eggs in the kitchen).
    crack: function () {
      var taps = 0, busy = false, svg;
      return {
        setup: function (s) { svg = s; },
        press: function () {
          if (busy) return;
          taps++;
          svg.classList.add("s" + taps);
          if (taps === 1) {
            pop("Crack!");
            instruct(G.stages.crack.more);
            busy = true;
            later(420, function () { busy = false; });
          } else {
            busy = true;
            later(reduced() ? 50 : 650, function () { finish(3); });
          }
        }
      };
    },

    // 3. Stir: circle over the wok (any direction). Clicks and Space stir too.
    stir: function () {
      var GOAL = 720, CX = 320, CY = 180, R = 164;
      var turned = 0, lastAngle = null, contents, ring, spatula, C = 2 * Math.PI * R;
      function add(deg) {
        if (game.finishing) return;
        turned += deg;
        contents.setAttribute("transform", "rotate(" + (turned * .8).toFixed(1) + " " + CX + " " + CY + ")");
        ring.style.strokeDashoffset = (C * (1 - Math.min(turned / GOAL, 1))).toFixed(1);
        if (turned >= GOAL) finish(3);
      }
      return {
        setup: function (svg) {
          contents = svg.querySelector(".g-contents");
          ring = svg.querySelector(".g-ring");
          spatula = svg.querySelector(".g-spatula");
          ring.style.strokeDasharray = C.toFixed(1);
          ring.style.strokeDashoffset = C.toFixed(1);
          spatula.setAttribute("transform", "translate(400 230)");
        },
        move: function (pt, e) {
          if (!pt) return;
          spatula.setAttribute("transform", "translate(" + clamp(pt.x, 150, 500).toFixed(0) + " " + clamp(pt.y, 40, 330).toFixed(0) + ")");
          var dx = pt.x - CX, dy = pt.y - CY, dist = Math.sqrt(dx * dx + dy * dy);
          // Mouse: hovering counts. Touch and pen: only while pressed.
          if (dist < 20 || dist > 260 || (e.pointerType !== "mouse" && !e.buttons)) { lastAngle = null; return; }
          var a = Math.atan2(dy, dx) * 180 / Math.PI;
          if (lastAngle != null) {
            var d = a - lastAngle;
            if (d > 180) d -= 360;
            if (d < -180) d += 360;
            if (Math.abs(d) < 70) add(Math.abs(d));
          }
          lastAngle = a;
        },
        up: function () { lastAngle = null; },
        press: function (pt) { add(pt ? 30 : 90); }
      };
    },

    // 4. Pour: hold to pour; let go near the dashed line. Too little? Keep going.
    pour: function () {
      var TOP = 120, BOTTOM = 312, TARGET = .62, RATE = .21;
      var level = 0, pouring = false, svg, liquid, stream, evalTimer = null;
      function y(l) { return BOTTOM - l * (BOTTOM - TOP); }
      function draw() {
        liquid.setAttribute("y", y(level).toFixed(1));
        liquid.setAttribute("height", (BOTTOM - y(level) + 10).toFixed(1));
      }
      function startPour() {
        if (game.finishing || pouring) return;
        clearTimeout(evalTimer);
        pouring = true;
        svg.classList.add("is-pouring");
        instruct(G.stages.pour.instruction);
      }
      function stopPour() {
        if (!pouring) return;
        pouring = false;
        svg.classList.remove("is-pouring");
        if (level < TARGET - .12) { instruct(G.pourMore); return; }
        clearTimeout(evalTimer);
        evalTimer = setTimeout(evaluate, reduced() ? 200 : 650);
        game.timers.push(evalTimer);
      }
      function evaluate() {
        if (pouring || game.finishing) return;
        var d = Math.abs(level - TARGET);
        var points = d <= .05 ? 3 : d <= .12 ? 2 : 1;
        finish(points, level >= .96 ? G.pourOver : null);
      }
      function isKey(e) { return e.key === " " || e.key === "Enter" || e.key === "Spacebar"; }
      return {
        setup: function (s) {
          svg = s;
          liquid = svg.querySelector(".g-liquid");
          stream = svg.querySelector(".g-stream");
          var ty = y(TARGET).toFixed(1);
          svg.querySelector(".g-target").setAttribute("d", "M250 " + ty + " H440");
          var zone = svg.querySelector(".g-zone");
          zone.setAttribute("y", y(TARGET + .05).toFixed(1));
          zone.setAttribute("height", (y(TARGET - .05) - y(TARGET + .05)).toFixed(1));
          draw();
          loop(function (dt) {
            if (!pouring) return;
            level = Math.min(1, level + dt * RATE);
            draw();
            if (level >= 1) stopPour();
          });
        },
        down: startPour,
        up: stopPour,
        toggle: function () { if (pouring) stopPour(); else startPour(); },
        keydown: function (e) { if (!isKey(e)) return false; if (!e.repeat) startPour(); return true; },
        keyup: function (e) { if (!isKey(e)) return false; stopPour(); return true; },
        teardown: function () { clearTimeout(evalTimer); }
      };
    },

    // 5. Toss: a marker swings across the meter; the green zone is half of it.
    toss: function () {
      var PERIOD = reduced() ? 3.2 : 1.9, tosses = 0, total = 0, busy = false, x = 320, t0 = 0, svg, marker;
      return {
        setup: function (s) {
          svg = s;
          marker = svg.querySelector(".g-marker");
          t0 = performance.now();
          loop(function (dt, now) {
            if (busy) return;
            var phase = ((now - t0) / 1000) / PERIOD * 2 * Math.PI;
            x = 320 + 196 * Math.sin(phase);
            marker.setAttribute("transform", "translate(" + x.toFixed(1) + " 37)");
          });
        },
        press: function () {
          if (busy || game.finishing) return;
          var points = (x >= 290 && x <= 350) ? 3 : (x >= 220 && x <= 420) ? 2 : 1;
          tosses++;
          total += points;
          busy = true;
          svg.classList.remove("is-tossing");
          void svg.getBoundingClientRect();
          svg.classList.add("is-tossing");
          if (tosses >= 3) { finish(Math.round(total / 3), points === 1 ? G.tossMiss : null); return; }
          pop(points === 1 ? G.tossMiss : G.ratings[points - 1]);
          later(reduced() ? 150 : 760, function () { busy = false; svg.classList.remove("is-tossing"); });
        }
      };
    }
  };

  window.FriedRiceGame = { show: show, stop: stop };
})();
