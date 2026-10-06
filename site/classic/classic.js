/* ==========================================================================
   classic/classic.js — renders the classic site's header, footer and page
   body from content.js. Each HTML page sets <body data-page="...">.
   To change wording, edit content.js; to change layout, edit the render
   functions below; to change looks, edit classic.css.
   ========================================================================== */

(function () {
  "use strict";

  var U = SiteUtil, S = SITE, C = SITE_CONFIG;
  var esc = U.esc, inline = U.inline;
  var pageId = document.body.getAttribute("data-page") || "home";

  // Page id -> file name in this folder.
  var FILES = {
    home: "index.html", research: "research.html", talks: "talks.html",
    cv: "cv.html", art: "art.html", experience: "experience.html"
  };

  function label(id) { var p = U.page(id); return p ? p.label : id; }

  // ---------- Header and footer ----------
  function header() {
    var nav = S.pages.map(function (p) {
      return '<a href="' + FILES[p.id] + '"' + (p.id === pageId ? ' aria-current="page"' : "") + ">" + esc(p.label) + "</a>";
    }).join("");
    // The name leads back to the start page (Lehan, 2026-10-05); "Home" in the menu is this site's home.
    return '<div class="wrap"><a class="site-title" href="' + esc(U.url("index.html")) + '">' + esc(S.person.name) + "</a>" +
      '<nav class="site-nav" aria-label="Main">' + nav + "</nav></div>";
  }

  // "Try a fun version" opens a small menu of the four fun versions (setupFunMenu below).
  function footer() {
    var funs = C.funVersions || [];
    var menu = funs.length ? '<span class="fun-menu">' +
      '<button type="button" class="fun-link" id="fun-toggle" aria-expanded="false" aria-controls="fun-list"><span aria-hidden="true">&#10022;</span> Try a fun version <span aria-hidden="true">&#9652;</span></button>' +
      '<ul class="fun-list" id="fun-list" hidden>' + funs.map(function (v) {
        var c = U.versionColours(v.id);
        return '<li><a href="' + esc(U.url(v.path)) + '"><span class="fun-icon" style="background:' + c[0] + '">' + U.versionIcon(v.id) + "</span>" +
          '<span><span class="fun-name">' + esc(v.label) + '</span><span class="fun-blurb">' + esc(v.blurb) + "</span></span></a></li>";
      }).join("") + "</ul></span> &middot; " : "";
    return '<div class="wrap">' +
      "<span>&copy; " + new Date().getFullYear() + " " + esc(S.person.name) +
      ' &middot; <a href="mailto:' + esc(S.person.email) + '">' + esc(S.person.email) + "</a></span>" +
      "<span>" + menu + '<a href="' + esc(U.url("index.html")) + '">Start page</a> &middot; <a href="' + esc(U.url("privacy.html")) + '">Privacy</a></span></div>';
  }

  function setupFunMenu() {
    var btn = document.getElementById("fun-toggle"), list = document.getElementById("fun-list");
    if (!btn) return;
    function open(on, focusFirst) {
      list.hidden = !on;
      btn.setAttribute("aria-expanded", String(on));
      if (on && focusFirst) list.querySelector("a").focus();
    }
    btn.addEventListener("click", function () { open(list.hidden, false); });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); open(true, true); }
    });
    list.addEventListener("keydown", function (e) {
      var links = [].slice.call(list.querySelectorAll("a")), i = links.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        links[(i + (e.key === "ArrowDown" ? 1 : links.length - 1)) % links.length].focus();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !list.hidden) { open(false); btn.focus(); }
    });
    // Tabbing out of the menu closes it.
    btn.parentNode.addEventListener("focusout", function (e) {
      if (!list.hidden && e.relatedTarget && !btn.parentNode.contains(e.relatedTarget)) open(false);
    });
    document.addEventListener("click", function (e) {
      if (!list.hidden && !e.target.closest(".fun-menu")) open(false);
    });
  }

  // ---------- Pages ----------
  function renderHome() {
    var P = S.person, H = S.home, L = P.links;
    return '<div class="home">' +
      '<img src="' + esc(U.url(P.photo.portrait)) + '" alt="' + esc(P.photo.alt) + '" width="335" height="493">' +
      "<div><h1>" + esc(H.heading) + "</h1>" +
      H.paragraphs.map(function (p) { return "<p>" + inline(p) + "</p>"; }).join("") +
      '<p>Email: <a href="mailto:' + esc(P.email) + '">' + esc(P.email) + "</a></p>" +
      '<p class="quick-links"><a ' + U.linkAttrs(L.scholar) + ">Google Scholar</a> &middot; " +
      '<a href="' + esc(U.url(L.cv)) + '">CV (PDF)</a> &middot; ' +
      "<a " + U.linkAttrs(L.photography) + ">Photography</a> &middot; " +
      "<a " + U.linkAttrs(L.blog) + ">Blog</a></p>" +
      "</div></div>";
  }

  function renderResearch() {
    var R = S.research;
    return "<h1>" + esc(label("research")) + "</h1>" +
      '<p class="lead">' + U.researchLines().map(esc).join("<br>") + "</p>" +
      R.papers.map(function (p, i) {
        var links = p.links || [];
        var title = links.length ? "<a " + U.linkAttrs(links[0].url) + ">" + esc(p.title) + "</a>" : esc(p.title);
        var status = p.status ? "<em>" + esc(p.status) + "</em>" + (p.year ? ", " + p.year : "") : "";
        var chips = links.map(function (l) { return '<a class="chip" ' + U.linkAttrs(l.url) + ">" + esc(l.label) + "</a>"; }).join("");
        return '<article class="paper" id="paper-' + (i + 1) + '"><h2>' + title + "</h2>" +
          (p.coauthors.length ? '<p class="paper-meta">' + inline(U.withCoauthorsMd(p)) + "</p>" : "") +
          (status || chips ? '<p class="paper-meta">' + status + chips + "</p>" : "") +
          (p.abstract ? '<details class="abstract"><summary>' + esc(R.abstractLabel || "Abstract") + "</summary>" +
            "<p>" + esc(p.abstract) + "</p></details>" : "") +
          "</article>";
      }).join("");
  }

  function renderTalks() {
    return "<h1>" + esc(label("talks")) + "</h1>" + S.talks.map(function (y) {
      return "<h2>" + y.year + '</h2><ul class="talks">' + y.items.map(function (t) {
        var detail = [];
        if (t.detail) detail.push(esc(t.detail));
        if (t.note) detail.push("<em>" + esc(t.note) + "</em>");
        return "<li>" + inline(t.event) +
          (detail.length ? ' <span class="talk-detail">(' + detail.join(", ") + ")</span>" : "") +
          (U.isUpcoming(y.year, t.month) ? ' <span class="pill">Upcoming</span>' : "") + "</li>";
      }).join("") + "</ul>";
    }).join("");
  }

  function renderCV() {
    var pdf = esc(U.url(S.cv.pdf));
    return "<h1>" + esc(label("cv")) + "</h1>" +
      '<p class="actions"><a class="button" href="' + pdf + '" download>' + esc(S.cv.downloadLabel) + "</a>" +
      '<a class="button button--ghost" href="' + pdf + '" target="_blank" rel="noopener">Open in a new tab</a></p>' +
      "<h2>Education</h2>" + S.education.map(function (e) {
        return '<div class="edu"><div class="head-row"><h3>' + esc(e.degree) + '</h3><span class="dates">' + esc(e.dates) + "</span></div>" +
          '<div class="muted">' + esc(e.institution) + "</div>" +
          (e.details.length ? "<ul>" + e.details.map(function (d) { return "<li>" + inline(d) + "</li>"; }).join("") + "</ul>" : "") +
          "</div>";
      }).join("") +
      "<h2>Full CV</h2>" +
      '<iframe class="pdf-frame" src="' + pdf + '" title="' + esc(S.person.name) + ' CV (PDF)"></iframe>';
  }

  function card(x) {
    return '<a class="card" ' + U.linkAttrs(x.url) + '><span class="card-title">' + esc(x.title) + "</span>" +
      '<span class="card-text">' + esc(U.plain(x.description)) + "</span>" +
      '<span class="card-cta">' + esc(x.linkLabel) + " &#8599;</span></a>";
  }

  // A performance or an art project: title and dates, medium, description, links.
  function project(p) {
    var links = p.links || [];
    return '<article class="project"><div class="head-row"><h3>' + esc(p.title) + '</h3><span class="dates">' + esc(p.dates) + "</span></div>" +
      '<p class="medium">' + esc(p.medium) + "</p><p>" + inline(p.description) + "</p>" +
      (links.length ? "<p>" + links.map(function (l) {
        return "<a " + U.linkAttrs(l.url) + ">" + esc(l.label) + " &#8599;</a>";
      }).join(" &middot; ") + "</p>" : "") +
      "</article>";
  }

  // Performances above the art projects (Lehan, 2026-10-05).
  function renderArt() {
    var A = S.art;
    return "<h1>" + esc(label("art")) + "</h1>" +
      '<div class="cards">' + card(A.photography) + card(A.writing) + "</div>" +
      ((A.performances || []).length ? "<h2>Performances</h2>" + A.performances.map(project).join("") : "") +
      "<h2>Art Projects</h2>" + A.projects.map(project).join("");
  }

  function role(w) {
    var org = w.url ? "<a " + U.linkAttrs(w.url) + ">" + esc(w.org) + "</a>" : esc(w.org);
    return '<article class="role"><div class="head-row"><h3>' + org + '</h3><span class="dates">' + esc(w.dates) + "</span></div>" +
      '<div class="role-title">' + esc(w.role) + (w.type ? ", <em>" + esc(w.type) + "</em>" : "") + "</div>" +
      "<ul>" + w.bullets.map(function (b) { return "<li>" + inline(b) + "</li>"; }).join("") + "</ul></article>";
  }

  // Teaching and service first (Lehan, 2026-10-02), then work, awards and skills.
  function renderExperience() {
    var X = S.experience;
    return "<h1>" + esc(label("experience")) + "</h1>" +
      "<h2>Teaching</h2>" + X.teaching.map(function (t) {
        return '<div class="role"><h3>' + esc(t.role) + ", " + esc(t.institution) + "</h3><ul>" +
          t.courses.map(function (c) { return "<li>" + esc(c.name) + ' <span class="muted">(' + esc(c.years) + ")</span></li>"; }).join("") +
          "</ul></div>";
      }).join("") +
      "<h2>Service</h2><ul class=\"plain\">" + X.service.map(function (s) { return "<li>" + inline(s) + "</li>"; }).join("") + "</ul>" +
      "<h2>Work experience</h2>" + X.work.map(role).join("") +
      '<h2>Awards and extracurriculars</h2><ul class="awards">' + X.awards.map(function (a) {
        return "<li><span>" + inline(a.text) + '</span><span class="dates">' + esc(a.years) + "</span></li>";
      }).join("") + "</ul>" +
      "<h2>Skills</h2>" + X.skills.map(function (s) {
        return "<p><strong>" + esc(s.label) + ":</strong> " + esc(s.items.join(", ")) + "</p>";
      }).join("");
  }

  var RENDER = {
    home: renderHome, research: renderResearch, talks: renderTalks,
    cv: renderCV, art: renderArt, experience: renderExperience
  };

  document.getElementById("site-header").innerHTML = header();
  document.getElementById("main").innerHTML = '<div class="wrap page">' + (RENDER[pageId] || renderHome)() + "</div>";
  document.getElementById("site-footer").innerHTML = footer();
  setupFunMenu();

  // Statistics (no-op unless analytics is on): abstracts opened, fun versions picked from the footer.
  Array.prototype.forEach.call(document.querySelectorAll("details.abstract"), function (d, i) {
    d.addEventListener("toggle", function () { if (d.open) U.track("classic_abstract_opened", { paper: i + 1 }); });
  });
  Array.prototype.forEach.call(document.querySelectorAll("#fun-list a"), function (a, i) {
    a.addEventListener("click", function () { U.track("classic_fun_version_chosen", { version: (C.funVersions[i] || {}).id }); });
  });

  // research.html#paper-2 opens that paper's abstract and scrolls to it.
  var target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) {
    var details = target.querySelector("details");
    if (details) details.open = true;
    target.scrollIntoView();
  }
})();
