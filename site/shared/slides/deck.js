/* ==========================================================================
   shared/slides/deck.js — the slide deck shared by the PowerPoint (V3) and
   Overleaf (V4) versions. Styles: slides.css.

     var slides = Deck.fromContent(window.SITE);   // content.js -> slide objects
     var slides = Deck.fromContent(window.SITE, { abstracts: true });   // + one slide per paper abstract
     container.appendChild(Deck.render(slides[0]));

   The slides follow the page order in content.js (SITE.pages); each page has one or more slides.

   V3 renders these slides directly. V4 turns them into beamer .tex
   (one frame per slide), lets visitors edit and recompile, and parses the
   .tex back into slide objects of exactly this shape before rendering, so
   both versions look the same.

   A slide object:
     {
       id: "research",            unique; V4 uses it for file names
       page: "research",          the site page it belongs to (SITE.pages ids)
       layout: "title" | "bullets" | "two-column" | "boxes" | "abstract" | "end",
       title: "Research",
       subtitle: "..." or ["...", "..."],   optional, one line (or one per array item) under the title
       dense: true,               optional, smaller text for long lists
       image: { src, alt },       "title" layout: the photo (site-relative path)
       paragraphs: ["..."],       "title" and "end" layouts
       bullets: ["...", { text: "...", sub: ["...", "..."] }],   "bullets" and "boxes"
       columns: [{ heading: "...", bullets: [...] }, ...],      "two-column" (two of them)
       boxes: [{ label, text, href }],                          "boxes"
       block: { title: "Abstract", text: "..." },               "abstract" (then paragraphs: the paper's status and links)
       notes: "..."               optional speaker notes (plain text)
     }
   Every text field may use the content.js mini-markdown: **bold**, *italic*, [text](url).
   ========================================================================== */

(function () {
  "use strict";

  var U = window.SiteUtil;

  function talkLine(t, withYear) {
    var bits = [];
    if (t.detail) bits.push(t.detail);
    if (t.note) bits.push("*" + t.note + "*");
    var line = t.event + (bits.length ? " (" + bits.join(", ") + ")" : "");
    if (withYear) line += ", " + withYear;
    return line;
  }

  // A paper's status, year and links as one mini-markdown line: "*Working Paper* 2026 · [PDF](...)".
  function paperMeta(p) {
    var meta = [];
    if (p.status) meta.push("*" + p.status + "*" + (p.year ? " " + p.year : ""));
    (p.links || []).forEach(function (l) { meta.push("[" + l.label + "](" + l.url + ")"); });
    return meta.join(" · ");
  }

  // ---------- content.js -> slides ----------
  // options.abstracts: after the Research slide, add one "abstract" slide per paper that has an
  // abstract (used by Overleaf).
  function fromContent(S, options) {
    options = options || {};
    var P = S.person, R = S.research, X = S.experience;
    var T = S.slides || {}, L = T.endLinks || {};   // the slides' own wording (content.js)
    var label = function (id) { var p = U.page(id); return p ? p.label : id; };
    var mail = "[" + P.email + "](mailto:" + P.email + ")";
    var byPage = {};   // page id -> its slides, in order

    // Home: the title slide (photo left, home text right), as in the PowerPoint mock.
    byPage.home = [{
      id: "home", page: "home", layout: "title",
      title: S.home.heading,
      image: { src: P.photo.wide, alt: P.photo.alt },
      paragraphs: S.home.paragraphs.concat([(S.home.emailLine || "Email: " + P.email).replace(P.email, mail)]),
      notes: T.homeNotes
    }];

    // Research: interests and methods (one line each), then one bullet per paper.
    byPage.research = [{
      id: "research", page: "research", layout: "bullets",
      title: label("research"),
      subtitle: U.researchLines(),
      bullets: R.papers.map(function (p) {
        var sub = [];
        if (p.coauthors.length) sub.push(U.withCoauthorsMd(p));
        var meta = paperMeta(p);
        if (meta) sub.push(meta);
        return { text: "**" + p.title + "**", sub: sub };
      })
    }];
    if (options.abstracts) {
      R.papers.forEach(function (p, i) {
        if (!p.abstract) return;
        byPage.research.push({
          id: "paper-" + (i + 1), page: "research", layout: "abstract",
          title: p.title,
          subtitle: U.withCoauthorsMd(p) || undefined,
          block: { title: R.abstractLabel || "Abstract", text: p.abstract },
          paragraphs: paperMeta(p) ? [paperMeta(p)] : []
        });
      });
    }

    // Talks: this year's on the left, earlier years on the right. Upcoming talks are marked.
    var newest = S.talks[0], older = S.talks.slice(1);
    byPage.talks = [{
      id: "talks", page: "talks", layout: "two-column", dense: true,
      title: label("talks"),
      columns: [
        {
          heading: String(newest.year),
          bullets: newest.items.map(function (t) {
            return talkLine(t) + (U.isUpcoming(newest.year, t.month) ? " · **" + (T.upcoming || "upcoming") + "**" : "");
          })
        },
        {
          heading: older.length ? older[older.length - 1].year + "–" + older[0].year : "",
          bullets: older.reduce(function (acc, y) {
            return acc.concat(y.items.map(function (t) { return talkLine(t, y.year); }));
          }, [])
        }
      ]
    }];

    // Other Experience: teaching and service first (Lehan, 2026-10-02), then work, then awards.
    byPage.experience = [
      {
        id: "teaching", page: "experience", layout: "bullets", dense: true,
        title: T.teachingTitle || "Teaching and service",
        bullets: X.teaching.map(function (t) {
          return {
            text: t.role + ", **" + t.institution + "**",
            sub: t.courses.map(function (c) { return c.name + " (" + c.years + ")"; })
          };
        }).concat(X.service).concat(X.skills.map(function (s) {
          return s.label + ": " + s.items.join(", ");
        }))
      },
      {
        id: "experience", page: "experience", layout: "bullets",
        title: label("experience"),
        bullets: X.work.map(function (w) {
          return "**" + w.role + "**, " + (w.url ? "[" + w.org + "](" + w.url + ")" : w.org) + " (" + w.dates + ")";
        })
      },
      {
        id: "awards", page: "experience", layout: "bullets", dense: true,
        title: T.awardsTitle || "Awards and extracurriculars",
        bullets: X.awards.map(function (a) { return a.text + " (" + a.years + ")"; })
      }
    ];

    // CV: education, then the PDF.
    byPage.cv = [{
      id: "cv", page: "cv", layout: "bullets",
      title: label("cv"),
      bullets: S.education.map(function (e) {
        return { text: "**" + e.degree + "**", sub: [e.institution + ", " + e.dates] };
      }).concat(["[" + S.cv.downloadLabel + "](" + S.cv.pdf + ")"])
    }];

    // Art: performances, then projects (Lehan, 2026-10-05), then the Writing and Photography boxes
    // from the mock. Each group is a heading point with its items under it. A title links to the
    // item's first link (e.g. the video feature) when it has one (Lehan, 2026-10-02).
    function artLine(a) {
      var first = (a.links || [])[0];
      var name = first ? "[" + a.title + "](" + first.url + ")" : a.title;
      return "**" + name + "** (" + a.dates + "): " + a.medium;
    }
    var artGroups = [[S.art.performances, T.performancesTitle || "Performances"], [S.art.projects, T.projectsTitle || "Art Projects"]]
      .filter(function (g) { return g[0] && g[0].length; });
    byPage.art = [{
      id: "art", page: "art", layout: "boxes",
      title: label("art"),
      bullets: artGroups.length > 1 ?
        artGroups.map(function (g) { return { text: "**" + g[1] + "**", sub: g[0].map(artLine) }; }) :
        (artGroups[0] ? artGroups[0][0].map(artLine) : []),
      boxes: [
        { label: S.art.writing.title, text: S.art.writing.description, href: S.art.writing.url },
        { label: S.art.photography.title, text: S.art.photography.description, href: S.art.photography.url }
      ]
    }];

    // In the site's page order; a page missing from SITE.pages still gets its slides, at the end.
    var slides = [], used = {};
    (S.pages || []).forEach(function (p) {
      if (byPage[p.id]) { slides = slides.concat(byPage[p.id]); used[p.id] = true; }
    });
    Object.keys(byPage).forEach(function (id) { if (!used[id]) slides = slides.concat(byPage[id]); });

    // Closing slide.
    slides.push({
      id: "end", page: "home", layout: "end",
      title: T.endTitle || "Thank you",
      paragraphs: [
        mail,
        "[" + (L.classic || "Classic website") + "](classic/index.html) · " +
          (P.links.scholar ? "[" + (L.scholar || "Google Scholar") + "](" + P.links.scholar + ") · " : "") +
          "[" + (L.cv || "CV") + "](" + P.links.cv + ") · [" +
          (L.photography || "Photography") + "](" + P.links.photography + ") · [" + (L.blog || "Blog") + "](" + P.links.blog + ")"
      ]
    });

    return slides;
  }

  // ---------- slide -> HTML ----------
  function bulletsHTML(items) {
    if (!items || !items.length) return "";
    return "<ul>" + items.map(function (b) {
      if (typeof b === "string") return "<li>" + U.inline(b) + "</li>";
      return "<li>" + U.inline(b.text) + bulletsHTML(b.sub) + "</li>";
    }).join("") + "</ul>";
  }

  function render(slide) {
    var el = document.createElement("div");
    el.className = "slide slide--" + slide.layout + (slide.dense ? " slide--dense" : "");
    el.setAttribute("data-slide", slide.id);
    var title = '<h2 class="slide-title">' + U.inline(slide.title || "") + "</h2>";
    var subLines = slide.subtitle == null ? [] : [].concat(slide.subtitle).filter(Boolean);
    var sub = subLines.length ? '<p class="slide-subtitle">' + subLines.map(U.inline).join("<br>") + "</p>" : "";
    var paras = (slide.paragraphs || []).map(function (p) { return "<p>" + U.inline(p) + "</p>"; }).join("");
    var html;

    switch (slide.layout) {
      case "title":
        html = '<div class="slide-photo">' +
          (slide.image ? '<img src="' + U.esc(U.url(slide.image.src)) + '" alt="' + U.esc(slide.image.alt || "") + '">' : "") +
          '</div><div class="slide-text">' + title + paras + "</div>";
        break;
      case "two-column":
        html = title + sub + '<div class="slide-body"><div class="slide-columns">' +
          (slide.columns || []).map(function (c) {
            return "<div>" + (c.heading ? '<h3 class="slide-col-heading">' + U.inline(c.heading) + "</h3>" : "") +
              bulletsHTML(c.bullets) + "</div>";
          }).join("") + "</div></div>";
        break;
      case "boxes":
        html = title + sub + '<div class="slide-body">' + bulletsHTML(slide.bullets) + '<div class="slide-boxes">' +
          (slide.boxes || []).map(function (b) {
            var inner = '<span class="slide-box-text">' + U.inline(b.text || "") + '</span><span class="slide-box-label">' + U.inline(b.label) + "</span>";
            return b.href ? "<a class=\"slide-box\" " + U.linkAttrs(b.href) + ">" + inner + "</a>" : '<div class="slide-box">' + inner + "</div>";
          }).join("") + "</div></div>";
        break;
      case "abstract":
        html = title + sub + '<div class="slide-body">' +
          (slide.block ? '<div class="slide-block"><h3 class="slide-block-title">' + U.inline(slide.block.title || "") +
            '</h3><p class="slide-block-text">' + U.inline(slide.block.text || "") + "</p></div>" : "") +
          (paras ? '<div class="slide-meta">' + paras + "</div>" : "") + "</div>";
        break;
      case "end":
        html = title + paras;
        break;
      default: // "bullets"
        html = title + sub + '<div class="slide-body">' + bulletsHTML(slide.bullets) + "</div>";
    }
    el.innerHTML = html;
    return el;
  }

  window.Deck = { fromContent: fromContent, render: render };
})();
