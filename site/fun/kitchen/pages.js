/* ==========================================================================
   fun/kitchen/pages.js — the content of each page, as HTML for the panels.

   Everything shown here is read from window.SITE (../../content.js), so a CV
   update in content.js reaches the kitchen automatically. Only the small
   section headings ("Papers", "Teaching", ...) come from text.js.
   Any content string may hold mini-markdown (**bold**, *italic*, [link](url)),
   so content is always rendered with inline(); its links get class
   "text-link" (underlined, otherwise like the text around them).
   One function per page; KitchenPages.render(id) picks the right one.
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil, S = window.SITE, T = window.KITCHEN_TEXT;
  var H = T.headings, L = T.labels;

  function esc(text) { return U.esc(text); }
  function inline(text) { return U.inline(text); }
  function newTabNote() { return '<span class="sr-only"> ' + esc(L.newTab) + "</span>"; }

  // A standalone link from content.js ({ label, url }), e.g. "PDF" or "Video feature".
  // External links open in a new tab and say so.
  function link(label, url, cls) {
    var ext = U.isExternal(url) && !/^mailto:/i.test(url);
    return "<a " + (cls ? 'class="' + cls + '" ' : "") + U.linkAttrs(url) + ">" + inline(label) +
      (ext ? ' <span aria-hidden="true">↗</span>' + newTabNote() : "") + "</a>";
  }
  // A link inside running text or a heading: looks like the words around it, underlined.
  function textLink(htmlLabel, url) {
    var ext = U.isExternal(url) && !/^mailto:/i.test(url);
    return '<a class="text-link" ' + U.linkAttrs(url) + ">" + htmlLabel + (ext ? newTabNote() : "") + "</a>";
  }
  function links(list) {
    if (!list || !list.length) return "";
    return '<p class="links">' + list.map(function (l) { return link(l.label, l.url); }).join("") + "</p>";
  }
  function bullets(list) {
    if (!list || !list.length) return "";
    return "<ul>" + list.map(function (b) { return "<li>" + inline(b) + "</li>"; }).join("") + "</ul>";
  }
  function chips(list) {
    return '<ul class="chips">' + list.map(function (i) { return "<li>" + inline(i) + "</li>"; }).join("") + "</ul>";
  }
  // Heading row of an entry: name on the left, dates on the right.
  function entryHead(nameHtml, dates) {
    return '<div class="entry-head"><h3>' + nameHtml + "</h3>" +
      (dates ? '<span class="entry-dates">' + inline(dates) + "</span>" : "") + "</div>";
  }

  // ---- Home: the text from the brief, verbatim, plus the photo ----------------
  function home() {
    var P = S.person, Home = S.home;
    var paragraphs = Home.paragraphs.map(function (p) { return '<p class="lead">' + inline(p) + "</p>"; }).join("");
    // The email line exactly as written in content.js, with the address made clickable.
    var email = esc(P.email);
    var emailLine = inline(Home.emailLine).replace(email, '<a class="text-link" href="mailto:' + email + '">' + email + "</a>");
    return '<div class="home-grid">' +
        '<figure class="polaroid">' +
          '<img src="' + esc(U.url(P.photo.portrait)) + '" alt="' + esc(P.photo.alt) + '" width="335" height="493">' +
          "<figcaption>" + esc(L.photoCaption) + "</figcaption>" +
        "</figure>" +
        "<div>" +
          '<h2 class="home-name">' + inline(Home.heading) + "</h2>" +
          paragraphs +
          "<p>" + emailLine + "</p>" +
          '<div class="quick-links">' +
            '<a class="btn" href="' + esc(U.url("classic/index.html")) + '">' + esc(L.quickClassic) + "</a>" +
            (P.links.scholar ? '<a class="btn" ' + U.linkAttrs(P.links.scholar) + ">" + esc(L.quickScholar) + ' <span aria-hidden="true">↗</span>' + newTabNote() + "</a>" : "") +
            '<a class="btn" href="' + esc(U.url(P.links.cv)) + '" target="_blank" rel="noopener">' + esc(L.quickCv) + "</a>" +
            '<a class="btn" ' + U.linkAttrs(P.links.photography) + ">" + esc(L.quickPhotography) + ' <span aria-hidden="true">↗</span>' + newTabNote() + "</a>" +
            '<a class="btn" ' + U.linkAttrs(P.links.blog) + ">" + esc(L.quickBlog) + ' <span aria-hidden="true">↗</span>' + newTabNote() + "</a>" +
          "</div>" +
        "</div>" +
      "</div>";
  }

  // ---- Research: interests and methods (one line each), then papers ----------
  function research() {
    var R = S.research;
    var html = '<dl class="research-lines">';
    if (R.interests && R.interests.length) html += "<dt>" + inline(R.interestsLabel) + "</dt><dd>" + chips(R.interests) + "</dd>";
    if (R.methods && R.methods.length) html += "<dt>" + inline(R.methodsLabel) + '</dt><dd class="is-methods">' + chips(R.methods) + "</dd>";
    html += "</dl>";
    html += "<h2>" + esc(H.papers) + "</h2>";
    html += R.papers.map(function (p) {
      var status = [p.status, p.year].filter(function (x) { return x != null && x !== ""; }).join(", ");
      var withLine = U.withCoauthorsMd(p);   // "with [Name](homepage), ...": names link to their homepages
      // One line under the coauthors: "CEPR Discussion Paper, 2026 · PDF"
      var meta = [];
      if (status) meta.push('<span class="paper-status">' + inline(status) + "</span>");
      (p.links || []).forEach(function (l) { meta.push(link(l.label, l.url)); });
      return '<div class="entry">' +
        "<h3>" + inline(p.title) + "</h3>" +
        (withLine ? '<p class="paper-with">' + inline(withLine) + "</p>" : "") +
        (meta.length ? '<p class="paper-meta">' + meta.join(' <span class="dot" aria-hidden="true">·</span> ') + "</p>" : "") +
        "</div>";
    }).join("");
    return html;
  }

  // ---- Talks: grouped by year, upcoming ones marked ----------------------------
  function talks() {
    return S.talks.map(function (group) {
      var items = group.items.map(function (t) {
        var upcoming = U.isUpcoming(group.year, t.month);
        return "<li" + (upcoming ? ' class="is-upcoming"' : "") + ">" +
          '<span class="talk-event">' + inline(t.event) + "</span>" +
          (t.detail ? '<span class="talk-detail">, ' + inline(t.detail) + "</span>" : "") +
          (t.note ? ' <span class="talk-note">(' + inline(t.note) + ")</span>" : "") +
          (upcoming ? '<span class="upcoming">' + esc(L.upcoming) + "</span>" : "") +
          "</li>";
      }).join("");
      return '<section class="talk-year"><h2>' + esc(group.year) + '</h2><ul class="talk-list">' + items + "</ul></section>";
    }).join("");
  }

  // ---- CV: the PDF (view or download), then education --------------------------
  function cv() {
    var pdf = U.url(S.cv.pdf);
    var html = '<div class="cv-actions">' +
      '<a class="btn btn--primary" href="' + esc(pdf) + '" target="_blank" rel="noopener">' + esc(L.viewCv) + "</a>" +
      '<a class="btn" href="' + esc(pdf) + '" download>' + inline(S.cv.downloadLabel) + "</a>" +
      "</div>";
    html += "<h2>" + esc(H.education) + "</h2>";
    html += S.education.map(function (e) {
      return '<div class="entry">' + entryHead(inline(e.institution), e.dates) +
        '<p class="entry-sub">' + inline(e.degree) + "</p>" + bullets(e.details) + "</div>";
    }).join("");
    return html;
  }

  // ---- Art: photography and writing (the blog) first, then performances and the projects --------
  function art() {
    var A = S.art;
    function entry(p) {
      return '<div class="entry">' + entryHead(inline(p.title), p.dates) +
        '<p class="entry-sub">' + inline(p.medium) + "</p>" +
        "<p>" + inline(p.description) + "</p>" + links(p.links) + "</div>";
    }
    var html = "<h2>" + esc(H.photoWriting) + '</h2><div class="art-cards">' +
      [A.photography, A.writing].map(function (c) {
        return '<div class="art-card"><h3>' + inline(c.title) + "</h3><p>" + inline(c.description) + "</p>" +
          link(c.linkLabel, c.url, "btn") + "</div>";
      }).join("") + "</div>";
    if (A.performances && A.performances.length) html += "<h2>" + esc(H.performances) + "</h2>" + A.performances.map(entry).join("");
    html += "<h2>" + esc(H.projects) + "</h2>" + A.projects.map(entry).join("");
    return html;
  }

  // ---- Other Experience: teaching and service first, then work, awards, skills ---
  function experience() {
    var E = S.experience;
    var html = "<h2>" + esc(H.teaching) + "</h2>";
    html += E.teaching.map(function (t) {
      return '<div class="entry"><h3>' + inline(t.institution) + '</h3><p class="entry-sub">' + inline(t.role) + "</p>" +
        '<ul class="course-list">' + t.courses.map(function (c) {
          return "<li><span>" + inline(c.name) + '</span><span class="course-years">' + inline(c.years) + "</span></li>";
        }).join("") + "</ul></div>";
    }).join("");

    html += "<h2>" + esc(H.service) + "</h2>" + bullets(E.service);

    html += "<h2>" + esc(H.work) + "</h2>";
    html += E.work.map(function (w) {
      var org = w.url ? textLink(inline(w.org), w.url) : inline(w.org);
      var role = inline(w.role) + (w.type ? ' <span class="meta">(' + inline(w.type) + ")</span>" : "");
      return '<div class="entry">' + entryHead(org, w.dates) + '<p class="entry-sub">' + role + "</p>" + bullets(w.bullets) + "</div>";
    }).join("");

    html += "<h2>" + esc(H.awards) + '</h2><ul class="award-list">' + E.awards.map(function (a) {
      return "<li><span>" + inline(a.text) + '</span><span class="award-years">' + inline(a.years) + "</span></li>";
    }).join("") + "</ul>";

    html += "<h2>" + esc(H.skills) + '</h2><dl class="skills">' + E.skills.map(function (s) {
      return "<dt>" + inline(s.label) + "</dt><dd>" + inline(s.items.join(", ")) + "</dd>";
    }).join("") + "</dl>";
    return html;
  }

  var RENDER = { home: home, research: research, talks: talks, cv: cv, art: art, experience: experience };

  window.KitchenPages = {
    // HTML for the page with this id (an id from SITE.pages), or "" if unknown.
    render: function (id) { return RENDER[id] ? RENDER[id]() : ""; }
  };
})();
