/* ==========================================================================
   fun/kitchen/scene.js — how the kitchen behaves.

    1. Setup: text and links from content.js / text.js
    2. Layout: the whole kitchen on screen, or (phones held upright) a kitchen
       you swipe across; 2b. the swiping itself (arrows, hint, full screen)
    3. Progress: which ingredients are done (remembered for this browser tab)
    4. The clickable things: hover labels, clicks, "start here"
    5. Recipe card
    6. Router: the URL hash decides what is open (#research, #cook/rice, ...)
    7. Overlays: opening, closing, focus
    8. Page panel
    9. Cooking moments (the tiny can't-fail interactions)
   10. Recipe book and the fried rice game
   11. Finale
   12. The chef's speech bubble; 12b. "About this kitchen" (the rice bowl)
   13. Start (also: the wall clock and the window's day / night, and visitor statistics)

   URL hashes (any state can be opened directly):
     #kitchen (or nothing)   the kitchen
     #home #research #talks #cv #art #experience   a page
     #cook/rice  #cook/eggs  #cook/tomatoes  #cook/onions  #cook/seasoning
     #recipe-book            the recipe book (fried rice game + blog)
     #fried-rice  #fried-rice/chop|crack|stir|pour|toss|done   the game
     #finale                 the plated dish
     #welcome                the welcome bubble again
     #about                  the "About this kitchen" popup (the rice bowl, bottom right)

   Query switches (for reviews and screenshots):
     ?sky=day  ?sky=night    force the window's daytime or night-time view
                             (otherwise it follows the visitor's own clock: day 06:00-17:59)
     ?motion=on  ?motion=off animations on or off (shared/site.js)
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil, S = window.SITE, T = window.KITCHEN_TEXT;
  var root = document.documentElement;

  // Motion: on or off? index.html's <head> made a first guess; shared/site.js has since
  // applied ?motion=on|off. Settle it now, so <html> has exactly one of motion-on / motion-off.
  // Order: an explicit "on" (class from site.js or the head), then the shared setting
  // ("site.motion": "on" / "off"), then the computer's "reduce motion" setting.
  function motionIsOn() {
    if (root.classList.contains("motion-on")) return true;
    var s = U.motionSetting ? U.motionSetting() : null;
    if (s === "on" || s === "off") return s === "on";
    return !U.prefersReducedMotion();
  }
  function setMotionClasses(on) {
    root.classList.toggle("motion-on", on);
    root.classList.toggle("motion-off", !on);
  }
  setMotionClasses(motionIsOn());
  var reduced = root.classList.contains("motion-off");

  function $(id) { return document.getElementById(id); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function fmt(text, values) {
    return String(text).replace(/\{(\w+)\}/g, function (m, k) { return values[k] != null ? values[k] : m; });
  }
  function icon(id) { return '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  function pageLabel(id) { var p = U.page(id); return p ? p.label : id; }
  function storage(kind) { try { return window[kind]; } catch (e) { return null; } }
  function load(kind, key) { try { return storage(kind).getItem(key); } catch (e) { return null; } }
  function save(kind, key, value) { try { storage(kind).setItem(key, value); } catch (e) { /* private mode: fine */ } }

  var scene = $("scene"), stage = $("stage"), panEl = $("pan"), topbar = document.querySelector(".topbar");

  // Visitor statistics (shared/site.js): does nothing until analytics is switched on, and
  // must never break the kitchen. Events: kitchen_page_opened, kitchen_served,
  // kitchen_about_opened, kitchen_photography_clicked, kitchen_blog_clicked,
  // kitchen_cv_clicked (here), kitchen_second_recipe_started / _finished (game.js).
  function track(name, props) {
    try { if (U.track) U.track(name, props || {}); } catch (e) { /* statistics are optional */ }
  }

  // Ingredients in recipe order (text.js), plus their icons.
  var ICONS = { rice: "i-rice", eggs: "i-egg", tomatoes: "i-tomato", onions: "i-onion", seasoning: "i-seasoning" };
  var INGREDIENT = {}, BY_PAGE = {};
  T.ingredients.forEach(function (ing, i) {
    ing.n = i + 1;
    ing.icon = ICONS[ing.id];
    INGREDIENT[ing.id] = ing;
    BY_PAGE[ing.page] = ing;
  });
  var TOTAL = T.ingredients.length;
  // Page panels follow the recipe: the chef (Home), then the ingredients in order.
  var ORDER = ["home"].concat(T.ingredients.map(function (ing) { return ing.page; }));

  // =========================================================================
  // 1. Setup
  // =========================================================================
  function setup() {
    var P = S.person;
    each(document.querySelectorAll(".js-face"), function (img) {
      img.src = U.url(P.face.src);
      img.alt = P.face.alt;
    });
    document.querySelector(".bubble-face").alt = "";   // beside the chef's words: decoration
    $("page-heading").textContent = T.siteName + " · " + P.name;
    $("logo").setAttribute("aria-label", P.name + ": " + T.logo.hint);
    $("logo-name").textContent = P.name;
    $("logo-sub").textContent = T.logo.hint;
    $("logo-tag").textContent = pageLabel("home");

    $("link-classic").href = U.url("classic/index.html");
    $("link-cv").href = U.url(P.links.cv);
    $("link-landing").href = U.url("index.html");

    // Tags under the clickable things: page names come from SITE.pages.
    T.ingredients.forEach(function (ing) {
      $("hot-" + ing.id).querySelector(".tag-text").textContent = pageLabel(ing.page);
    });
    var frames = $("hot-frames");
    frames.setAttribute("href", P.links.photography);
    // "Pictures: My photography site, in a new tab. A singer in ... A fashion shoot ... An alpine lake ..."
    frames.setAttribute("aria-label", T.frames.label + ": " + T.frames.hint + ". " + (T.frames.pictures || []).join(" "));
    frames.querySelector(".tag-text").textContent = T.frames.tag + " ↗";
    var book = $("hot-book");
    book.setAttribute("aria-label", T.book.label + ": " + T.book.hint);
    book.querySelector(".tag-text").textContent = T.book.tag;
    $("hot-wok").querySelector(".tag-text").textContent = T.serve.tag;

    // Recipe card heading.
    $("recipe-kicker").textContent = T.recipe.kicker;
    $("recipe-dish").textContent = T.recipe.dish;
    $("recipe-served").textContent = T.recipe.servedWith;

    // Recipe book.
    var B = T.recipeBook;
    $("book-title").textContent = B.title;
    $("book-play-title").textContent = B.playTitle;
    $("book-play-blurb").textContent = B.playBlurb;
    $("book-play-meta").textContent = B.playMeta;
    $("book-play-steps").innerHTML = B.playSteps.map(function (s) { return "<li>" + U.esc(s) + "</li>"; }).join("");
    $("book-play").innerHTML = U.esc(B.playButton) + ' <span aria-hidden="true">›</span>';
    $("book-more-title").textContent = B.moreTitle;
    $("book-more-line").textContent = B.moreLine;
    var blog = $("book-blog");
    blog.href = P.links.blog;
    blog.innerHTML = U.esc(B.moreButton) + ' <span aria-hidden="true">↗</span><span class="sr-only"> ' + U.esc(T.labels.newTab) + "</span>";
    $("book-blog-url").textContent = P.links.blog.replace(/^https?:\/\//, "").replace(/\/$/, "");
    $("book").querySelector(".book-close").setAttribute("aria-label", B.close);

    // Finale.
    var F = T.finale;
    $("finale-title").textContent = F.title;
    $("finale-dish").textContent = F.dish;
    var classic = $("finale-classic");
    classic.href = U.url("classic/index.html");
    classic.textContent = F.classic;
    var cv = $("finale-cv");
    cv.href = U.url(P.links.cv);
    cv.textContent = F.cv;
    $("finale-play").textContent = F.play;
    var start = $("finale-start");
    start.href = U.url("index.html");
    start.textContent = F.start;
    // "Or try another version of this site: Paint, PowerPoint, and Overleaf" (each one a link).
    var others = ((window.SITE_CONFIG && SITE_CONFIG.funVersions) || []).filter(function (v) { return v.id !== "kitchen"; });
    $("finale-versions").innerHTML = others.length ? U.esc(F.versions) + " " + U.listJoin(others.map(function (v) {
      return '<a class="text-link" href="' + U.esc(U.url(v.path)) + '">' + U.esc(v.label) + "</a>";
    })) : "";

    // Panel, station and game close buttons speak the same words.
    each(document.querySelectorAll("button[data-close]"), function (b) {
      if (!b.closest(".book")) b.setAttribute("aria-label", T.panel.close);
    });
    $("panel-kitchen").textContent = T.panel.close;

    // The rice bowl's "About this kitchen" popup.
    var A = T.about;
    $("info-btn").setAttribute("title", A.button);
    $("info-btn-label").textContent = A.button;
    $("info-title").textContent = A.title;
    $("info-body").textContent = A.body;
    $("info-small").textContent = A.small;
    $("info-close").setAttribute("aria-label", A.close);

    // Phones held upright: the swipe hint.
    $("pan-hint-swipe").textContent = T.pan.swipe;
    $("pan-hint-turn").textContent = T.pan.turn;
    $("pan-hint-full").textContent = T.pan.fullScreen;
    $("pan-hint-close").setAttribute("aria-label", T.pan.close);
  }

  // =========================================================================
  // 2. Layout: the whole kitchen on screen, or (phones held upright) a kitchen
  //    you swipe across
  // =========================================================================
  // The kitchen is drawn on 1600 x 900. FOCUS: the part that must stay in view above the
  // recipe card, in drawing units (the wall, the counter and the name tags).
  var FOCUS = { w: 1600, h: 690 };
  // If the whole kitchen would be drawn at less than PAN_BELOW of its size because the screen
  // is narrow (a phone held upright), it is drawn bigger instead and the box around it (#pan)
  // scrolls sideways. How big: as tall as the free height allows, but at most PAN_MAX, and
  // small enough that the widest thing (the three pictures with their glow, PAN_ITEM units)
  // still fits on the screen. PAN_PAD: a little wall at each end.
  // (Short screens, such as phones held sideways, always show the whole kitchen.)
  var PAN_BELOW = 0.45, PAN_MAX = 0.75, PAN_ITEM = 500, PAN_PAD = 24;
  var view = { pan: false, k: 1, x: 0, W: 0 };   // now: swiping or not, scale, viewBox's left edge, width

  // The rice bowl ("About this kitchen", bottom right): beside the recipe card when there is
  // room to its right, otherwise just above the card's right end.
  // Its popup always sits above both the bowl and the recipe card.
  function placeInfo(card) {
    var beside = window.innerWidth - card.right >= 96;
    var bottom = beside ? window.innerHeight - card.bottom : window.innerHeight - card.top + 10;
    var popBottom = Math.max(bottom + ($("info-btn").offsetHeight || 64) + 14, window.innerHeight - card.top + 14);
    root.style.setProperty("--info-bottom", Math.round(bottom) + "px");
    root.style.setProperty("--info-pop-bottom", Math.round(popBottom) + "px");
    root.style.setProperty("--above-card", Math.round(window.innerHeight - card.top + 10) + "px");   // the swipe hint
  }

  function applyLayout() {
    var r = stage.getBoundingClientRect(), card = $("recipe-card").getBoundingClientRect();
    placeInfo(card);
    var W = r.width, H = r.height;
    // Height of the stage that is not covered by the recipe card.
    var free = Math.max(card.top - r.top - 8, H * 0.45);
    var kFit = Math.min(W / FOCUS.w, free / FOCUS.h);
    var pan = kFit < PAN_BELOW && W / FOCUS.w < free / FOCUS.h;
    var k = pan ? Math.max(kFit, Math.min(free / FOCUS.h, (W - 24) / PAN_ITEM, PAN_MAX)) : kFit;
    // Keep the spot in the middle of the screen in the middle (turning the phone, resizing).
    var mid = view.pan ? view.x + (panEl.scrollLeft + view.W / 2) / view.k : null;

    // Zoom so the focus area fills the free space; the rest of the kitchen (wall, cabinets,
    // floor) simply continues around it. Spare height goes 60% above and 40% below (when
    // swiping, 20% above: the swipe hint then sits on the cabinets, under the name tags).
    var x, w, h = H / k, y = -Math.max(0, (free - FOCUS.h * k) * (pan ? 0.2 : 0.6)) / k;
    if (pan) {
      var px = Math.ceil((FOCUS.w + 2 * PAN_PAD) * k);
      x = -PAN_PAD;
      w = px / k;
      scene.style.width = px + "px";
    } else {
      w = W / k;
      x = (FOCUS.w - w) / 2;
      scene.style.width = "";
    }
    scene.setAttribute("viewBox", [x, y, w, h].map(function (n) { return Math.round(n * 100) / 100; }).join(" "));
    root.classList.toggle("is-pan", pan);
    view = { pan: pan, k: k, x: x, W: W };
    // The arrows at the edges sit halfway up the free part of the screen.
    root.style.setProperty("--pan-mid", Math.round(free / 2) + "px");
    sizeTags(k);
    panEl.scrollLeft = pan && mid != null ? (mid - x) * k - W / 2 : 0;
    // Just started swiping (a first visit, or the phone turned upright): start where the
    // recipe is, i.e. the next ingredient (the rice cooker, at the left, on a first visit).
    if (pan && mid == null) panToThing(nextThing(), false);
    updatePan();
    placeStartHere();
    hideLabel();
  }

  // Name tags (and the hint dots) grow when the kitchen is drawn small, so that a tag always
  // reads at 12 px or more; then each tag's rounded box is sized to its text.
  var tagFont = 0;
  function sizeTags(k) {
    var font = Math.round(Math.min(Math.max(21, 12 / k), 30));
    scene.style.setProperty("--badge-scale", Math.min(Math.max(1, 0.55 / k), 1.6).toFixed(2));
    if (font === tagFont) return;
    scene.style.setProperty("--tag-font", font + "px");
    var pad = Math.round(font * 0.86), h = Math.round(font * 1.8), all = true;
    each(scene.querySelectorAll(".tag"), function (tag) {
      var text = tag.querySelector("text"), box = tag.querySelector("rect"), w = 0;
      try { w = text.getComputedTextLength(); } catch (e) { /* not rendered yet */ }
      if (!w) { all = false; return; }
      box.setAttribute("x", -(w / 2 + pad));
      box.setAttribute("width", w + pad * 2);
      box.setAttribute("y", -h / 2);
      box.setAttribute("height", h);
      box.setAttribute("rx", h / 2);
    });
    if (all) tagFont = font;   // otherwise measure again next time
  }

  // ---- 2b. Swiping across the kitchen (phones held upright) ----------------
  // #pan is an ordinary sideways-scrolling box: fingers swipe it, a mouse wheel turns it,
  // the arrows at the edges slide it, and Tab scrolls each thing into view as it is reached.
  var panPrev = $("pan-prev"), panNext = $("pan-next"), panHint = $("pan-hint");
  var KEY_PAN_HINT = "kitchen.panHint";   // localStorage: the swipe hint has been seen
  var panHintSeen = load("localStorage", KEY_PAN_HINT) === "1";
  var userPanAt = 0, scrollRaf = 0;

  function panMax() { return Math.max(0, panEl.scrollWidth - panEl.clientWidth); }
  function panTo(left, smooth) {
    left = Math.max(0, Math.min(panMax(), Math.round(left)));
    if (Math.abs(left - panEl.scrollLeft) < 1) return;
    var behavior = smooth && !U.prefersReducedMotion() ? "smooth" : "auto";
    try { panEl.scrollTo({ left: left, behavior: behavior }); } catch (e) { panEl.scrollLeft = left; }
  }
  // Slide the kitchen so that this thing is on screen (centred), unless it already is.
  function panToThing(hot, smooth) {
    if (!view.pan || !hot || !panEl.contains(hot)) return;
    var box = hot.querySelector(".hit") || hot;
    var r = box.getBoundingClientRect(), p = panEl.getBoundingClientRect();
    if (r.left >= p.left + 8 && r.right <= p.right - 8) return;
    panTo(panEl.scrollLeft + (r.left + r.width / 2) - (p.left + p.width / 2), smooth);
  }
  // The thing the recipe wants next: the next ingredient, or the wok.
  function nextThing() {
    var ing = nextIngredient();
    return ing ? $("hot-" + ing.id) : $("hot-wok");
  }

  // The hint shows once, and the rice bowl steps aside while it does (CSS: .pan-hint-on).
  function showPanHint(on) {
    panHint.hidden = !on;
    root.classList.toggle("pan-hint-on", on);
  }
  function updatePan() {
    var s = panEl.scrollLeft, max = panMax();
    panPrev.hidden = !view.pan || s <= 4;
    panNext.hidden = !view.pan || s >= max - 4;
    showPanHint(view.pan && !panHintSeen);
  }
  function closePanHint() {
    panHintSeen = true;
    save("localStorage", KEY_PAN_HINT, "1");
    showPanHint(false);
  }
  function panBy(dir) {
    userPanAt = Date.now();
    panTo(panEl.scrollLeft + dir * panEl.clientWidth * 0.7, true);
  }

  panEl.addEventListener("scroll", function () {
    // The visitor has found out how to swipe: the hint has done its job.
    if (!panHint.hidden && Date.now() - userPanAt < 1500) closePanHint();
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function () {
      scrollRaf = 0;
      updatePan();
      placeStartHere();
      if (!label.hidden && labelHot) placeNear(label, labelHot, 14);
    });
  }, { passive: true });
  ["touchstart", "pointerdown", "keydown"].forEach(function (type) {
    panEl.addEventListener(type, function () { userPanAt = Date.now(); }, { passive: true });
  });
  // A mouse wheel (up / down) slides the kitchen sideways.
  panEl.addEventListener("wheel", function (e) {
    userPanAt = Date.now();
    if (!view.pan || e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    panEl.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? panEl.clientWidth : 1);
    e.preventDefault();
  }, { passive: false });
  panPrev.addEventListener("click", function () { panBy(-1); });
  panNext.addEventListener("click", function () { panBy(1); });
  $("pan-hint-close").addEventListener("click", closePanHint);

  // "Full screen" (in the hint): only where the browser can do it (e.g. Chrome on Android;
  // iPhones cannot). It then also asks to stay sideways, where the whole kitchen fits.
  var fullBtn = $("pan-hint-full");
  try {
    var touch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    fullBtn.hidden = !(touch && document.fullscreenEnabled && document.documentElement.requestFullscreen);
  } catch (e) { fullBtn.hidden = true; }
  fullBtn.addEventListener("click", function () {
    closePanHint();
    function sideways() {
      try {
        var q = screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape");
        if (q && q.catch) q.catch(function () { /* not allowed here: fine */ });
      } catch (e) { /* not allowed here: fine */ }
    }
    try {
      var p = document.documentElement.requestFullscreen({ navigationUI: "hide" });
      if (p && p.then) p.then(sideways, function () { /* refused: fine */ }); else sideways();
    } catch (e) { /* no full screen here: fine */ }
  });

  // =========================================================================
  // 3. Progress (sessionStorage: a fresh dish for every new visit)
  // =========================================================================
  var KEY_DONE = "kitchen.done", KEY_SERVED = "kitchen.served", KEY_WELCOMED = "kitchen.welcomed";
  var done = {}, served = false;

  function loadProgress() {
    var list = [];
    try { list = JSON.parse(load("sessionStorage", KEY_DONE) || "[]"); } catch (e) { list = []; }
    list.forEach(function (id) { if (INGREDIENT[id]) done[id] = true; });
    served = load("sessionStorage", KEY_SERVED) === "1";
  }
  function saveProgress() {
    save("sessionStorage", KEY_DONE, JSON.stringify(Object.keys(done)));
    save("sessionStorage", KEY_SERVED, served ? "1" : "0");
  }
  function doneCount() { return Object.keys(done).length; }
  function allDone() { return doneCount() === TOTAL; }
  function nextIngredient() {
    for (var i = 0; i < TOTAL; i++) if (!done[T.ingredients[i].id]) return T.ingredients[i];
    return null;
  }
  function markDone(id) {
    if (!INGREDIENT[id] || done[id]) return;
    done[id] = true;
    saveProgress();
    renderProgress();
  }

  function renderProgress() {
    var next = nextIngredient(), n = doneCount(), ready = allDone() && !served;
    T.ingredients.forEach(function (ing) {
      var hot = $("hot-" + ing.id), isDone = !!done[ing.id];
      hot.classList.toggle("is-done", isDone);
      hot.classList.toggle("is-next", next === ing);
      hot.setAttribute("aria-label", ing.object + ": " + ing.step.toLowerCase() + ", then read " + pageLabel(ing.page) + (isDone ? " (done)" : ""));
      var step = document.querySelector('.step[data-ingredient="' + ing.id + '"]');
      if (step) {
        step.classList.toggle("is-done", isDone);
        step.classList.toggle("is-next", next === ing && !current);
        step.setAttribute("aria-label", "Step " + ing.n + ": " + ing.step + (ing.detail ? " (" + ing.detail + ")" : "") +
          ". Opens " + pageLabel(ing.page) + (isDone ? ". Done" : ""));
      }
    });
    var wok = $("hot-wok");
    wok.classList.toggle("is-ready", ready);
    wok.classList.toggle("is-served", served);
    wok.setAttribute("aria-label", T.serve.thing + ": " + T.serve.step + (ready ? ". Everything is ready" : ""));
    var serveStep = document.querySelector(".step--serve");
    if (serveStep) {
      serveStep.classList.toggle("is-ready", ready);
      serveStep.classList.toggle("is-done", served);
      serveStep.setAttribute("aria-label", "Step " + (TOTAL + 1) + ": " + T.serve.step + (served ? ". Done" : ""));
    }
    $("recipe-count").textContent = served && n === TOTAL ? T.recipe.served
      : n === TOTAL ? T.recipe.allReady : fmt(T.recipe.progress, { done: n, total: TOTAL });
    $("recipe-bar-fill").style.width = (100 * n / TOTAL) + "%";
    placeStartHere();
  }

  // =========================================================================
  // 4. The clickable things
  // =========================================================================
  var hots = scene.querySelectorAll(".hot");
  var label = $("hover-label"), labelHot = null;
  var lastTrigger = null, lastKeyboard = false;

  function labelInfo(hot) {
    var id = hot.getAttribute("data-ingredient"), kind = hot.getAttribute("data-kind");
    if (id) {
      var ing = INGREDIENT[id];
      return { thing: ing.name, dest: pageLabel(ing.page), hint: done[id] ? T.hover.again : T.hover.cook };
    }
    if (kind === "frames") return { thing: T.frames.label, dest: T.frames.tag, hint: T.frames.hint };
    if (kind === "book") return { thing: T.book.label, dest: T.book.tag, hint: T.book.hint };
    var left = TOTAL - doneCount();
    return { thing: T.serve.thing, dest: T.serve.step, hint: left ? fmt(T.serve.hoverLeft, { left: left }) : T.serve.hoverReady };
  }

  // Put a fixed-position element (centred by CSS) just above a scene item,
  // or just below it when there is no room above (the pictures on the wall).
  function placeNear(el, hot, gap) {
    var art = hot.querySelector(".art") || hot;
    var r = art.getBoundingClientRect();
    var half = el.offsetWidth / 2 + 8;
    var x = Math.min(Math.max(r.left + r.width / 2, half), window.innerWidth - half);
    var h = el.offsetHeight;
    var below = r.top - h - gap < topbar.offsetHeight + 20;
    el.classList.toggle("is-below", below);
    el.style.left = x + "px";
    // Below: under the whole thing, tag included.
    el.style.top = (below ? hot.getBoundingClientRect().bottom + gap : r.top - h - gap) + "px";
  }

  function showLabel(hot) {
    var info = labelInfo(hot);
    label.innerHTML = U.esc(info.thing) + '<span class="hl-arrow" aria-hidden="true">→</span>' + U.esc(info.dest) +
      '<span class="hl-hint">' + U.esc(info.hint) + "</span>";
    label.hidden = false;
    labelHot = hot;
    placeNear(label, hot, 14);
  }
  function hideLabel() { label.hidden = true; labelHot = null; }

  function onHotClick(e) {
    var hot = e.currentTarget, id = hot.getAttribute("data-ingredient"), kind = hot.getAttribute("data-kind");
    hideLabel();
    dismissWelcome();
    if (kind === "frames") return;               // a real link: opens the photography site in a new tab
    e.preventDefault();
    lastTrigger = hot;
    if (id) startIngredient(id);
    else if (kind === "book") go("recipe-book");
    else if (kind === "wok") serve();
  }

  // Clicking an ingredient: cook it first (once), then read its page.
  function startIngredient(id) {
    var ing = INGREDIENT[id];
    go(done[id] ? ing.page : "cook/" + id);
  }

  // The wok: serve if everything is ready, otherwise say what's missing.
  function serve() {
    if (allDone() || served) { go("finale"); return; }
    var missing = T.ingredients.filter(function (ing) { return !done[ing.id]; });
    var names = missing.map(function (ing) { return "**" + ing.name.toLowerCase() + "**"; });
    showBubble({
      title: T.serve.notReadyTitle,
      html: "<p>" + U.inline(fmt(T.serve.notReady, { missing: U.listJoin(names) })) + "</p>",
      actions: missing.map(function (ing) {
        return { label: ing.name + " → " + pageLabel(ing.page), onClick: function () { hideBubble(); startIngredient(ing.id); } };
      }).concat([{ label: T.serve.serveAnyway, href: "#finale", quiet: true }])
    });
  }

  each(hots, function (hot) {
    hot.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") showLabel(hot); });
    hot.addEventListener("pointerleave", hideLabel);
    hot.addEventListener("focus", function () {
      var visible = true;
      try { visible = hot.matches(":focus-visible"); } catch (e) { /* older browsers */ }
      if (!visible) return;
      panToThing(hot, false);   // keyboard: bring it on screen first (phones held upright)
      showLabel(hot);
    });
    hot.addEventListener("blur", hideLabel);
    hot.addEventListener("click", onHotClick);
  });
  $("logo").addEventListener("click", function () { lastTrigger = $("logo"); dismissWelcome(); });

  // A pointer bubble over the scene: "Start here!" over the first ingredient until
  // something has been cooked (once the welcome bubble is closed, so they never overlap),
  // and "Serve!" over the wok once all five ingredients are ready.
  var startHere = $("start-here");
  function placeStartHere() {
    var target = null, text = "";
    if (!current && doneCount() === 0 && $("bubble").hidden) {
      target = $("hot-" + nextIngredient().id); text = T.startHere;
    } else if (!current && allDone() && !served) {
      target = $("hot-wok"); text = T.serve.pointer;
    }
    // (Phones held upright: only while that thing is on screen.)
    if (target) {
      var r = target.querySelector(".hit").getBoundingClientRect(), mid = (r.left + r.right) / 2;
      if (mid < 0 || mid > window.innerWidth) target = null;
    }
    startHere.hidden = !target;
    if (!target) return;
    $("start-here-text").textContent = text;
    placeNear(startHere, target, 22);
  }

  // =========================================================================
  // 5. Recipe card: every step is also a shortcut
  // =========================================================================
  function buildRecipeCard() {
    var html = T.ingredients.map(function (ing) {
      return '<li><button class="step" type="button" data-ingredient="' + ing.id + '">' +
        '<span class="step-icon">' + icon(ing.icon) + '<span class="step-num" aria-hidden="true">' + ing.n + "</span></span>" +
        '<span class="step-text"><span class="step-action">' + U.esc(ing.step) + "</span>" +
        '<span class="step-page">' + U.esc(pageLabel(ing.page)) + "</span></span></button></li>";
    }).join("");
    html += '<li><button class="step step--serve" type="button" data-kind="wok">' +
      '<span class="step-icon">' + icon("i-wok") + '<span class="step-num" aria-hidden="true">' + (TOTAL + 1) + "</span></span>" +
      '<span class="step-text"><span class="step-action">' + U.esc(T.serve.step) + "</span>" +
      '<span class="step-page">' + U.esc(T.serve.stepPage) + "</span></span></button></li>";
    $("recipe-steps").innerHTML = html;
    // "Skip to the recipe" (first Tab stop): focus the first step, without changing the URL.
    document.querySelector(".skip-link").addEventListener("click", function (e) {
      e.preventDefault();
      focusQuietly(document.querySelector(".step"));
    });
    each(document.querySelectorAll(".step"), function (b) {
      b.addEventListener("click", function () {
        lastTrigger = b;
        dismissWelcome();
        var id = b.getAttribute("data-ingredient");
        if (id) startIngredient(id); else serve();
      });
    });
  }

  // =========================================================================
  // 6. Router
  // =========================================================================
  function currentHash() { return decodeURIComponent(location.hash.replace(/^#/, "")); }
  function go(hash) {
    if (currentHash() === hash) route();
    else location.hash = hash;
  }
  // Change the URL without adding a history step (so Back skips cooking moments).
  function replaceHash(hash) {
    if (window.history && history.replaceState) {
      history.replaceState(null, "", "#" + hash);
      route();
    } else {
      location.replace("#" + hash);
    }
  }
  // Same, but without acting on it (the game keeps its URL in step with its stage).
  function syncHash(hash) {
    try { if (window.history && history.replaceState) history.replaceState(null, "", "#" + hash); } catch (e) { /* not allowed here: fine */ }
  }

  function route() {
    var parts = currentHash().split("/"), key = parts[0];
    if (U.page(key)) openPage(key);
    else if (key === "cook" && INGREDIENT[parts[1]]) openStation(parts[1]);
    else if (key === "recipe-book") openBook();
    else if (key === "fried-rice") openGame(parts[1]);
    else if (key === "finale") openFinale();
    else if (key === "about") { closeOverlays(); openInfo(); }
    else {
      closeOverlays();
      if (key === "welcome") showWelcome(true);
      else if (allDone() && !served) showReady();
      else showWelcome(false);
    }
  }

  // =========================================================================
  // 7. Overlays
  // =========================================================================
  var current = null;   // id of the open overlay element, or null

  function setBackgroundInert(on) {
    [stage, topbar].forEach(function (el) {
      if (on) el.setAttribute("inert", ""); else el.removeAttribute("inert");
    });
  }

  function openOverlay(id) {
    if (current === id) return;
    closeOverlays(true);
    hideLabel();
    hideBubble();
    closeInfo(false);
    $(id).hidden = false;
    current = id;
    setBackgroundInert(true);
    renderProgress();
  }

  function closeOverlays(switching) {
    if (!current) return;
    var was = current;
    $(was).hidden = true;
    current = null;
    if (was === "station-overlay") stopStation();
    if (was === "game-overlay" && window.FriedRiceGame) FriedRiceGame.stop();
    if (was === "finale-overlay") stopFinale();
    if (switching) return;
    setBackgroundInert(false);
    document.title = T.siteName + " · " + S.person.name;
    renderProgress();
    // Keyboard users go back to the thing they opened it from (slid on screen if need be).
    if (lastKeyboard && lastTrigger && document.contains(lastTrigger)) {
      panToThing(lastTrigger, false);
      try { lastTrigger.focus({ preventScroll: true }); } catch (e) { lastTrigger.focus(); }
    }
  }

  // Closing anything: back to the kitchen. (Once everything is prepped, the kitchen
  // shows the "Serve!" hint, and the wok leads to the finale.)
  function backToKitchen() { go("kitchen"); }
  function closeCurrent() {
    if (current === "game-overlay") go("recipe-book");
    else backToKitchen();
  }

  each(document.querySelectorAll("[data-close]"), function (el) {
    el.addEventListener("click", function (e) { e.preventDefault(); backToKitchen(); });
  });
  // Clicking the dimmed backdrop (not the card) closes too.
  each(document.querySelectorAll(".overlay"), function (ov) {
    ov.addEventListener("click", function (e) { if (e.target === ov && ov.id !== "finale-overlay") closeCurrent(); });
  });

  // Remember whether the visitor is using the keyboard (html.kb), so focus only
  // jumps onto big buttons for keyboard users; mouse users never see stray focus rings.
  document.addEventListener("pointerdown", function () { lastKeyboard = false; root.classList.remove("kb"); }, true);
  document.addEventListener("keydown", function (e) {
    lastKeyboard = true;
    root.classList.add("kb");
    if (!infoPop.hidden) {   // the "About this kitchen" popup: Esc closes, Tab stays inside
      if (e.key === "Escape") { e.preventDefault(); closeInfo(true); return; }
      if (e.key === "Tab") { e.preventDefault(); focusQuietly($("info-close")); return; }
    }
    if (!current) return;
    if (e.key === "Escape") { e.preventDefault(); closeCurrent(); return; }
    if (e.key === "Tab") trapFocus(e);
    // Left / right arrows flip through the pages.
    if (current === "panel-overlay" && (e.key === "ArrowLeft" || e.key === "ArrowRight") && !e.altKey && !e.ctrlKey && !e.metaKey) {
      var tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      $(e.key === "ArrowLeft" ? "panel-prev" : "panel-next").click();
    }
  });

  // Keep Tab inside the open overlay (backup for browsers without `inert`).
  function trapFocus(e) {
    var box = $(current);
    var items = Array.prototype.filter.call(
      box.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
      function (el) { return el.getClientRects().length > 0 || el === document.activeElement; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  }

  function focusQuietly(el) {
    if (!el) return;
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
  }

  function announce(text) {
    var a = $("announcer");
    a.textContent = "";
    setTimeout(function () { a.textContent = text; }, 60);
  }

  // =========================================================================
  // 8. Page panel
  // =========================================================================
  var THEME = { home: "chef" }, PAGE_ICON = { home: "i-hat" };
  T.ingredients.forEach(function (ing) { THEME[ing.page] = ing.id; PAGE_ICON[ing.page] = ing.icon; });

  function navButton(el, id, dir) {
    el.href = "#" + id;
    el.innerHTML = icon(PAGE_ICON[id]) +
      '<span><span class="nav-dir">' + U.esc(dir === "prev" ? T.panel.prev : T.panel.next) + "</span>" + U.esc(pageLabel(id)) + "</span>";
    el.setAttribute("aria-label", (dir === "prev" ? T.panel.prev : T.panel.next) + ": " + pageLabel(id));
  }

  var shownPage = "";   // the page in the panel (for statistics)
  function openPage(id) {
    var ing = BY_PAGE[id], panel = $("panel");
    if (ing) markDone(ing.id);   // visiting a page = that ingredient is prepped
    shownPage = id;
    track("kitchen_page_opened", { page: id });
    panel.setAttribute("data-theme", THEME[id] || "chef");
    $("panel-icon").innerHTML = icon(PAGE_ICON[id] || "i-hat");
    $("panel-kicker").textContent = ing
      ? fmt(T.panel.ingredientKicker, { n: ing.n, total: TOTAL, name: ing.name })
      : T.panel.chefKicker;
    $("panel-title").textContent = pageLabel(id);
    var body = $("panel-body");
    body.innerHTML = window.KitchenPages.render(id);
    body.scrollTop = 0;
    var i = ORDER.indexOf(id), n = ORDER.length;
    navButton($("panel-prev"), ORDER[(i - 1 + n) % n], "prev");
    navButton($("panel-next"), ORDER[(i + 1) % n], "next");
    openOverlay("panel-overlay");
    document.title = pageLabel(id) + " · " + T.siteName + " · " + S.person.name;
    focusQuietly($("panel-title"));
  }

  // =========================================================================
  // 9. Cooking moments
  // =========================================================================
  // How long each moment's animation runs after the last press (ms).
  var COOK_TIME = { rice: 1500, eggs: 750, tomatoes: 750, onions: 700, seasoning: 2000 };
  var station = null, timers = [];

  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function stopStation() {
    timers.forEach(clearTimeout);
    timers = [];
    station = null;
  }

  function cloneTemplate(id) { return document.importNode($(id).content, true); }

  function openStation(id) {
    var ing = INGREDIENT[id];
    if (current === "station-overlay" && station && station.ing === ing) return;
    openOverlay("station-overlay");
    stopStation();
    var art = $("station-art");
    art.innerHTML = "";
    art.appendChild(cloneTemplate("tpl-cook-" + id));
    station = { ing: ing, presses: 0, finished: false, busy: false, svg: art.querySelector("svg") };
    station.svg.setAttribute("preserveAspectRatio", "xMidYMid slice");   // phones: zoom in, trim the sides

    $("station").setAttribute("data-theme", id);
    $("station-step").textContent = fmt(T.station.stepLabel, { n: ing.n, total: TOTAL });
    $("station-title").textContent = ing.title;
    $("station-instruction").innerHTML = U.inline(ing.instruction);
    $("station-cheer").hidden = true;
    var pips = "";
    for (var i = 0; i < ing.presses; i++) pips += "<li" + (i === 0 ? ' class="is-now"' : "") + "></li>";
    $("station-pips").innerHTML = ing.presses > 1 ? pips : "";
    var skip = $("station-skip");
    skip.innerHTML = U.esc(fmt(T.station.skip, { page: pageLabel(ing.page) })) + ' <span aria-hidden="true">›</span>';
    var hit = $("station-hit");
    hit.setAttribute("aria-label", ing.title + ". " + U.plain(ing.instruction));
    document.title = ing.title + " · " + T.siteName;
    focusQuietly(lastKeyboard ? hit : $("station"));
  }

  function pressStation() {
    var st = station;
    if (!st || st.finished || st.busy) return;
    st.presses++;
    st.svg.classList.add("s" + st.presses);
    each($("station-pips").children, function (li, i) {
      li.className = i < st.presses ? "is-on" : (i === st.presses ? "is-now" : "");
    });
    if (st.presses < st.ing.presses) {
      $("station-instruction").innerHTML = U.inline(st.ing.instructionMore || st.ing.instruction);
      $("station-hit").setAttribute("aria-label", st.ing.title + ". " + U.plain(st.ing.instructionMore || st.ing.instruction));
      st.busy = true;
      later(reduced ? 50 : 450, function () { st.busy = false; });
      return;
    }
    // Last press: let the animation play, cheer, then open the page.
    st.finished = true;
    var ing = st.ing, page = pageLabel(ing.page);
    later(reduced ? 100 : COOK_TIME[ing.id], function () {
      st.svg.classList.add("done");
      var cheer = $("station-cheer");
      cheer.innerHTML = U.esc(ing.cheer) + '<span class="cheer-sub">' + U.esc(fmt(T.station.opening, { page: page })) + "</span>";
      cheer.hidden = false;
      $("station-instruction").textContent = ing.cheer;
      announce(ing.cheer + " " + fmt(T.station.opening, { page: page }));
      markDone(ing.id);
      later(reduced ? 700 : 1400, function () { replaceHash(ing.page); });
    });
  }

  $("station-hit").addEventListener("click", pressStation);
  $("station-skip").addEventListener("click", function () {
    if (station) replaceHash(station.ing.page);
  });

  // =========================================================================
  // 10. Recipe book and the fried rice game
  // =========================================================================
  function openBook() {
    openOverlay("book-overlay");
    document.title = T.recipeBook.title + " · " + T.siteName;
    focusQuietly($("book-play"));
  }

  function openGame(stageName) {
    openOverlay("game-overlay");
    document.title = T.recipeBook.playTitle + " · " + T.siteName;
    if (window.FriedRiceGame) FriedRiceGame.show(stageName);
  }

  // =========================================================================
  // 11. Finale
  // =========================================================================
  var finaleTimer = null, confettiTimer = null;

  function openFinale() {
    if (current === "finale-overlay") return;
    var early = !allDone();
    if (!early) { served = true; saveProgress(); }
    track("kitchen_served", { all_ingredients: !early });
    var art = $("finale-art"), fin = $("finale");
    art.innerHTML = "";
    art.appendChild(cloneTemplate("tpl-finale"));
    fin.classList.remove("is-served");
    fin.classList.add("is-cooking");
    $("finale-cooking").textContent = T.finale.cooking;
    $("finale-body").textContent = early ? T.finale.bodyEarly : T.finale.body;
    openOverlay("finale-overlay");
    document.title = T.finale.title + " · " + T.siteName;
    finaleTimer = setTimeout(function () {
      fin.classList.remove("is-cooking");
      fin.classList.add("is-served");
      if (!reduced) confetti();
      announce(T.finale.title + " " + T.finale.dish);
      focusQuietly($("finale-title"));
    }, reduced ? 0 : 1600);
  }

  function stopFinale() {
    clearTimeout(finaleTimer);
    clearTimeout(confettiTimer);
    $("confetti").innerHTML = "";
  }

  function confetti() {
    var box = $("confetti"), colours = ["#ef4b3c", "#ffd23f", "#3fb36b", "#5aa9e6", "#ff9fb4", "#ff8c2a", "#fffaf0"];
    var html = "";
    for (var i = 0; i < 70; i++) {
      html += '<i style="left:' + (Math.random() * 100).toFixed(1) + "%;" +
        "background:" + colours[i % colours.length] + ";" +
        "animation-duration:" + (2.4 + Math.random() * 2).toFixed(2) + "s;" +
        "animation-delay:" + (Math.random() * .9).toFixed(2) + "s;" +
        "--drift:" + Math.round(Math.random() * 160 - 80) + "px;" +
        "--spin:" + Math.round(Math.random() * 900 - 450) + "deg;" +
        (i % 3 === 0 ? "border-radius:50%;width:12px;height:12px;" : "") + '"></i>';
    }
    box.innerHTML = html;
    confettiTimer = setTimeout(function () { box.innerHTML = ""; }, 5600);
  }

  // =========================================================================
  // 12. The chef's speech bubble (welcome, and little messages)
  // =========================================================================
  var bubble = $("bubble"), bubbleIsWelcome = false;

  function showBubble(opts) {
    $("bubble-title").textContent = opts.title;
    $("bubble-text").innerHTML = opts.html;
    var actions = $("bubble-actions");
    actions.innerHTML = "";
    (opts.actions || []).forEach(function (a) {
      var el = document.createElement(a.href ? "a" : "button");
      if (a.href) el.href = a.href; else el.type = "button";
      el.className = a.primary ? "btn btn--primary" : (a.quiet ? "btn btn--quiet" : "btn");
      el.textContent = a.label;
      if (a.onClick) el.addEventListener("click", a.onClick);
      if (a.href && a.href.charAt(0) === "#") el.addEventListener("click", hideBubble);
      actions.appendChild(el);
    });
    bubbleIsWelcome = !!opts.welcome;
    bubble.hidden = false;
    placeStartHere();
    // Re-run the pop-in animation.
    bubble.style.animation = "none";
    void bubble.offsetWidth;
    bubble.style.animation = "";
  }
  function hideBubble() {
    if (bubble.hidden) return;
    bubble.hidden = true;
    if (bubbleIsWelcome) save("localStorage", KEY_WELCOMED, "1");
    bubbleIsWelcome = false;
    placeStartHere();
  }
  $("bubble-close").addEventListener("click", hideBubble);

  function showWelcome(force) {
    if (!force && load("localStorage", KEY_WELCOMED) === "1") return;
    if (!force && !bubble.hidden) return;
    var W = T.welcome;
    showBubble({
      welcome: true,
      title: W.title,
      html: "<p>" + U.inline(W.body) + "</p>",
      actions: [
        { label: W.button, primary: true, onClick: hideBubble },
        { label: W.classic, href: U.url("classic/index.html"), quiet: true }
      ]
    });
  }
  function dismissWelcome() { if (bubbleIsWelcome) hideBubble(); }

  // =========================================================================
  // 12b. "About this kitchen": the little rice bowl, bottom right
  // =========================================================================
  // A small dialog: focus moves into it; Esc, the x, or a click elsewhere closes it, and
  // focus returns to the bowl. #about opens it directly (for links and screenshots).
  var infoBtn = $("info-btn"), infoPop = $("info-pop");

  function openInfo() {
    if (!infoPop.hidden) return;
    hideLabel();
    infoPop.hidden = false;
    infoBtn.setAttribute("aria-expanded", "true");
    focusQuietly(infoPop);
    track("kitchen_about_opened");
  }
  function closeInfo(returnFocus) {
    if (infoPop.hidden) return;
    infoPop.hidden = true;
    infoBtn.setAttribute("aria-expanded", "false");
    if (returnFocus) focusQuietly(infoBtn);
    if (currentHash() === "about") syncHash("kitchen");
  }
  infoBtn.addEventListener("click", function () {
    dismissWelcome();
    if (infoPop.hidden) openInfo(); else closeInfo(true);
  });
  $("info-close").addEventListener("click", function () { closeInfo(true); });
  document.addEventListener("pointerdown", function (e) {
    if (!infoPop.hidden && !infoPop.contains(e.target) && !infoBtn.contains(e.target)) closeInfo(false);
  });

  // All five ingredients are ready: one last step. (Phones held upright: slide to the wok.)
  function showReady() {
    showBubble({
      title: T.serve.readyTitle,
      html: "<p>" + U.inline(T.serve.ready) + "</p>",
      actions: [{ label: T.serve.readyButton, href: "#finale", primary: true }]
    });
    announce(T.serve.readyTitle + " " + T.serve.ready);
    if (!lastKeyboard) panToThing($("hot-wok"), true);
  }

  // =========================================================================
  // 13. Start
  // =========================================================================
  // The Motion switch in the top bar. It writes the shared setting "site.motion" ("on" / "off"),
  // so the choice also applies to the other versions of the site, in this browser.
  var motionBtn = $("motion-toggle");
  function renderMotion() {
    reduced = root.classList.contains("motion-off");
    motionBtn.setAttribute("aria-pressed", String(!reduced));
    motionBtn.title = reduced ? T.motion.turnOn : T.motion.turnOff;
    $("motion-label").textContent = T.motion.label;
  }
  motionBtn.addEventListener("click", function () {
    var on = root.classList.contains("motion-off");   // flip it
    if (U.setMotion) U.setMotion(on ? "on" : "off");
    else save("localStorage", "site.motion", on ? "on" : "off");
    setMotionClasses(on);
    renderMotion();
  });
  // The wall clock shows the visitor's own local time, from the device clock (no location
  // lookup), and the window shows Sydney Harbour by day (06:00-17:59) or by night.
  // For reviews and screenshots, ?sky=day or ?sky=night in the address forces one.
  var SKY = (/[?&]sky=(day|night)\b/.exec(location.search) || [])[1] || null;
  function setClock() {
    var d = new Date(), h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    $("clock-h").setAttribute("transform", "rotate(" + ((h % 12) * 30 + m / 2) + ")");
    $("clock-m").setAttribute("transform", "rotate(" + (m * 6 + s / 10) + ")");
    $("clock-s").setAttribute("transform", "rotate(" + (s * 6) + ")");   // ticks; hidden when Motion is off
    var night = SKY ? SKY === "night" : (h < 6 || h >= 18);
    var win = $("decor-window");
    win.classList.toggle("is-night", night);
    win.classList.toggle("is-day", !night);
  }

  // Statistics: clicks on the links out to the photography site, the blog and the CV,
  // and where on the page they were (the wall pictures, the recipe book, a page, ...).
  function linkContext(a) {
    if (a.closest("#hot-frames")) return "wall";
    if (a.closest(".topbar")) return "top_bar";
    if (a.closest("#book")) return "recipe_book";
    if (a.closest("#game")) return "recipe_game";
    if (a.closest("#finale")) return "finale";
    if (a.closest("#panel")) return "page_" + shownPage;
    return "kitchen";
  }
  document.addEventListener("click", function (e) {
    try {
      var a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "", L = S.person.links;
      var cvFile = String(L.cv).split("/").pop();
      var name = href === L.photography ? "kitchen_photography_clicked"
        : href === L.blog ? "kitchen_blog_clicked"
        : cvFile && href.indexOf(cvFile) >= 0 ? "kitchen_cv_clicked" : "";
      if (name) track(name, { from: linkContext(a) });
    } catch (err) { /* statistics are optional */ }
  }, true);

  // A small API for game.js.
  window.Kitchen = { go: go, syncHash: syncHash, text: T, track: track };

  setup();
  renderMotion();
  buildRecipeCard();
  loadProgress();
  applyLayout();
  renderProgress();
  setClock();
  setInterval(setClock, 1000);
  route();
  window.addEventListener("hashchange", route);

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyLayout, 120);
  });
})();
