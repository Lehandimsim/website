/* ==========================================================================
   fun/powerpoint/ribbon.js — what the PowerPoint 2007 window contains:
   the ribbon (tabs, groups, buttons), the Office button menu, the
   galleries, the messages the decorative buttons show, and this version's
   other wording (help, the "About this PowerPoint" box).

   Also here: each slide's transition and entrance animations (PP_SLIDE_FX),
   with the names and speeds of every transition and effect.

   This file is data only; powerpoint.js draws it and makes it work.
   Icons are named from icons.js (PP_ICONS).

   A ribbon item is one of:
     { type: "big",   icon, label, ... }    big button, label under the icon.
                                            "\n" in a label forces a line break.
     { type: "stack", items: [...] }        a column of up to 3 small buttons
                                            (icon + label) or checkboxes.
     { type: "rows",  rows: [[part, ...], [part, ...]] }   rows of small parts:
         [ {icon, label}, ... ]             a segment of icon-only buttons
         { type: "combo", value, width }    a drop-down box
     { type: "gallery", kind: "transitions" | "themes" | "shapes" }
     { type: "checks", items: [...] }       a column of checkboxes
   A small item can also be { type: "check", label, checked } or
     { type: "field", icon, label, value, width, options: [...] }.

   What a button does:
     act: "show-begin"         run a command (list in powerpoint.js, function run())
     say: "save"               show the message PP_SAY.save (below)
     (neither)                 show PP_SAY.generic: "this button is just for show"
   Other keys: menu: true (draws a drop-down arrow), tip: "ScreenTip text",
     key: "F5" (shortcut shown in the ScreenTip), disabled: true,
     hero: true (the big pulsing From Beginning button).
   A group can have launcher: true (the little corner arrow) and
     hideOrder: 900. When the window is too narrow for every group, groups
     are hidden one by one, highest hideOrder first; groups without one stay.
   ========================================================================== */

window.PP_RIBBON = [

  // ------------------------------------------------------------------ Home
  {
    id: "home", label: "Home",
    groups: [
      { label: "Clipboard", launcher: true, items: [
        { type: "big", icon: "paste", label: "Paste", menu: true, say: "paste" },
        { type: "stack", items: [
          { icon: "cut", label: "Cut", say: "paste" },
          { icon: "copy", label: "Copy", say: "paste" },
          { icon: "painter", label: "Format Painter" }
        ] }
      ] },
      { label: "Slides", items: [
        { type: "big", icon: "new-slide", label: "New\nSlide", menu: true, say: "newSlide", tip: "Add a slide to the presentation." },
        { type: "stack", items: [
          { icon: "layout", label: "Layout", menu: true },
          { icon: "reset", label: "Reset" },
          { icon: "delete-slide", label: "Delete", say: "deleteSlide" }
        ] }
      ] },
      { label: "Font", launcher: true, items: [
        { type: "rows", rows: [
          [ { type: "combo", value: "Calibri (Body)", width: 116, label: "Font", say: "fonts" },
            { type: "combo", value: "18", width: 40, label: "Font Size", say: "fonts" },
            [ { icon: "grow-font", label: "Grow Font" }, { icon: "shrink-font", label: "Shrink Font" } ],
            [ { icon: "clear-fmt", label: "Clear All Formatting" } ] ],
          [ [ { icon: "bold", label: "Bold", key: "Ctrl+B" }, { icon: "italic", label: "Italic", key: "Ctrl+I" },
              { icon: "underline", label: "Underline", key: "Ctrl+U" }, { icon: "text-shadow", label: "Text Shadow" },
              { icon: "strike", label: "Strikethrough" } ],
            [ { icon: "spacing", label: "Character Spacing", menu: true } ],
            [ { icon: "change-case", label: "Change Case", menu: true } ],
            [ { icon: "font-color", label: "Font Color", menu: true } ] ]
        ] }
      ] },
      { label: "Paragraph", launcher: true, hideOrder: 760, items: [
        { type: "rows", rows: [
          [ [ { icon: "bullets", label: "Bullets", menu: true }, { icon: "numbering", label: "Numbering", menu: true } ],
            [ { icon: "indent-less", label: "Decrease List Level" }, { icon: "indent-more", label: "Increase List Level" } ],
            [ { icon: "line-spacing", label: "Line Spacing", menu: true } ] ],
          [ [ { icon: "align-left", label: "Align Text Left" }, { icon: "align-center", label: "Center" },
              { icon: "align-right", label: "Align Text Right" }, { icon: "justify", label: "Justify" } ],
            [ { icon: "columns", label: "Columns", menu: true } ] ]
        ] },
        { type: "stack", items: [
          { icon: "text-dir", label: "Text Direction", menu: true },
          { icon: "align-text", label: "Align Text", menu: true },
          { icon: "to-smartart", label: "Convert to SmartArt", menu: true }
        ] }
      ] },
      { label: "Drawing", launcher: true, hideOrder: 1000, items: [
        { type: "gallery", kind: "shapes", label: "Shapes" },
        { type: "big", icon: "arrange", label: "Arrange", menu: true },
        { type: "big", icon: "quick-styles", label: "Quick\nStyles", menu: true },
        { type: "stack", items: [
          { icon: "shape-fill", label: "Shape Fill", menu: true },
          { icon: "shape-outline", label: "Shape Outline", menu: true },
          { icon: "shape-effects", label: "Shape Effects", menu: true }
        ] }
      ] },
      { label: "Editing", hideOrder: 1180, items: [
        { type: "stack", items: [
          { icon: "find", label: "Find", key: "Ctrl+F" },
          { icon: "replace", label: "Replace", menu: true },
          { icon: "select", label: "Select", menu: true }
        ] }
      ] }
    ]
  },

  // ------------------------------------------------------------------ Insert
  {
    id: "insert", label: "Insert",
    groups: [
      { label: "Tables", items: [
        { type: "big", icon: "table", label: "Table", menu: true }
      ] },
      { label: "Illustrations", items: [
        { type: "big", icon: "picture", label: "Picture", say: "picture", tip: "Insert a picture from a file." },
        { type: "big", icon: "clipart", label: "Clip\nArt", say: "picture" },
        { type: "big", icon: "photo-album", label: "Photo\nAlbum", menu: true, say: "picture" },
        { type: "big", icon: "shapes", label: "Shapes", menu: true },
        { type: "big", icon: "smartart", label: "SmartArt" },
        { type: "big", icon: "chart", label: "Chart", say: "chart" }
      ] },
      { label: "Links", items: [
        { type: "big", icon: "hyperlink", label: "Hyperlink", say: "hyperlink", key: "Ctrl+K", tip: "Create a link to a web page, a picture or an e-mail address." },
        { type: "big", icon: "action", label: "Action", say: "hyperlink" }
      ] },
      { label: "Text", hideOrder: 820, items: [
        { type: "big", icon: "textbox", label: "Text\nBox", menu: true },
        { type: "big", icon: "header-footer", label: "Header\n& Footer" },
        { type: "big", icon: "wordart", label: "WordArt", menu: true },
        { type: "stack", items: [
          { icon: "date-time", label: "Date & Time" },
          { icon: "slide-number", label: "Slide Number" },
          { icon: "symbol", label: "Symbol" }
        ] }
      ] },
      { label: "Media Clips", hideOrder: 960, items: [
        { type: "big", icon: "movie", label: "Movie", menu: true, say: "movie" },
        { type: "big", icon: "sound", label: "Sound", menu: true, say: "movie" }
      ] }
    ]
  },

  // ------------------------------------------------------------------ Design
  {
    id: "design", label: "Design",
    groups: [
      { label: "Page Setup", items: [
        { type: "big", icon: "page-setup", label: "Page\nSetup", say: "pageSetup" },
        { type: "big", icon: "orientation", label: "Slide\nOrientation", menu: true, say: "pageSetup" }
      ] },
      { label: "Themes", items: [
        { type: "gallery", kind: "themes", label: "Themes" },
        { type: "stack", items: [
          { icon: "theme-colors", label: "Colors", menu: true, say: "themeParts" },
          { icon: "theme-fonts", label: "Fonts", menu: true, say: "fonts" },
          { icon: "theme-effects", label: "Effects", menu: true, say: "themeParts" }
        ] }
      ] },
      { label: "Background", launcher: true, hideOrder: 820, items: [
        { type: "big", icon: "bg-styles", label: "Background\nStyles", menu: true, say: "themeParts" },
        { type: "checks", items: [
          { label: "Hide Background Graphics" }
        ] }
      ] }
    ]
  },

  // ------------------------------------------------------------------ Animations
  {
    id: "animations", label: "Animations",
    groups: [
      { label: "Preview", items: [
        { type: "big", icon: "preview", label: "Preview", act: "preview", tip: "Play this slide's transition and animations." }
      ] },
      { label: "Animations", hideOrder: 900, items: [
        { type: "stack", items: [
          { type: "field", icon: "animate", label: "Animate:", value: "Custom Animation", width: 112, act: "custom-anim" },
          { icon: "custom-anim", label: "Custom Animation", act: "custom-anim", tip: "See this slide's animations, in the order they play." }
        ] }
      ] },
      { label: "Transition to This Slide", items: [
        { type: "gallery", kind: "transitions", label: "Transitions" },
        { type: "stack", items: [
          { type: "field", icon: "trans-sound", label: "", value: "[No Sound]", width: 96 },
          { type: "field", icon: "trans-speed", label: "", value: "Fast", width: 96 },
          { icon: "apply-all", label: "Apply To All", act: "apply-all", tip: "Use this slide's transition for every slide (until the page is reloaded)." }
        ] }
      ] },
      { label: "Advance Slide", hideOrder: 1080, items: [
        { type: "checks", items: [
          { label: "On Mouse Click", checked: true },
          { label: "Automatically After:", extra: "00:00" }
        ] }
      ] }
    ]
  },

  // ------------------------------------------------------------------ Slide Show (opens first)
  {
    id: "slideshow", label: "Slide Show",
    groups: [
      { label: "Start Slide Show", items: [
        { type: "big", hero: true, icon: "ss-begin", label: "From\nBeginning", act: "show-begin", key: "F5",
          tip: "Start the slide show from the first slide." },
        { type: "big", icon: "ss-current", label: "From\nCurrent Slide", act: "show-current", key: "Shift+F5",
          tip: "Start the slide show from the slide you are looking at." },
        { type: "big", icon: "ss-custom", label: "Custom\nSlide Show", menu: true, act: "show-custom",
          tip: "Start the slide show at any page of {first}'s website." }
      ] },
      { label: "Set Up", items: [
        { type: "big", icon: "ss-setup", label: "Set Up\nSlide Show", act: "show-setup",
          tip: "Slide show settings, and the keyboard shortcuts for presenting." },
        { type: "big", icon: "hide-slide-big", label: "Hide\nSlide", say: "hideSlide",
          tip: "Hide the current slide from the presentation." },
        { type: "stack", items: [
          { icon: "narration", label: "Record Narration", say: "narration" },
          { icon: "rehearse", label: "Rehearse Timings", act: "rehearse",
            tip: "Start a slide show with a timer, to rehearse the presentation." },
          { type: "check", label: "Use Rehearsed Timings", checked: true }
        ] }
      ] },
      { label: "Monitors", hideOrder: 640, items: [
        { type: "stack", items: [
          { type: "field", icon: "monitor", label: "Resolution:", value: "Use Current Resolution", width: 150,
            options: ["Use Current Resolution", "640x480 (Fastest, Lowest Fidelity)", "800x600", "1024x768 (Slowest, Highest Fidelity)"] },
          { type: "field", icon: "show-on", label: "Show Presentation On:", value: "", width: 108, disabled: true },
          { type: "check", label: "Use Presenter View", say: "presenter" }
        ] }
      ] }
    ]
  },

  // ------------------------------------------------------------------ Review
  {
    id: "review", label: "Review",
    groups: [
      { label: "Proofing", items: [
        { type: "big", icon: "spelling", label: "Spelling", act: "spelling", key: "F7" },
        { type: "big", icon: "research", label: "Research", act: "go:research",
          tip: "Look up {first}'s research (the Research slide)." },
        { type: "big", icon: "thesaurus", label: "Thesaurus" },
        { type: "stack", items: [
          { icon: "translate", label: "Translate" },
          { icon: "language", label: "Language" }
        ] }
      ] },
      { label: "Comments", items: [
        { type: "big", icon: "show-markup", label: "Show\nMarkup" },
        { type: "big", icon: "new-comment", label: "New\nComment", say: "comment", tip: "Leave {first} a comment (by email)." },
        { type: "big", icon: "delete-comment", label: "Delete", menu: true, say: "comment" },
        { type: "big", icon: "prev-comment", label: "Previous" },
        { type: "big", icon: "next-comment", label: "Next" }
      ] },
      { label: "Protect", hideOrder: 700, items: [
        { type: "big", icon: "protect", label: "Protect\nPresentation", menu: true, say: "protect" }
      ] }
    ]
  },

  // ------------------------------------------------------------------ View
  {
    id: "view", label: "View",
    groups: [
      { label: "Presentation Views", items: [
        { type: "big", icon: "view-normal", label: "Normal", act: "view-normal" },
        { type: "big", icon: "view-sorter", label: "Slide\nSorter", act: "view-sorter", tip: "See every slide at once." },
        { type: "big", icon: "view-notes", label: "Notes\nPage", say: "notesPage" },
        { type: "big", icon: "view-show", label: "Slide\nShow", act: "show-current", key: "F5" }
      ] },
      { label: "Master Views", hideOrder: 1060, items: [
        { type: "big", icon: "slide-master", label: "Slide\nMaster", say: "master" },
        { type: "big", icon: "handout-master", label: "Handout\nMaster", say: "master" },
        { type: "big", icon: "notes-master", label: "Notes\nMaster", say: "master" }
      ] },
      { label: "Show/Hide", hideOrder: 700, items: [
        { type: "checks", items: [
          { label: "Ruler", act: "toggle-ruler" },
          { label: "Gridlines", act: "toggle-grid" },
          { label: "Message Bar", disabled: true }
        ] }
      ] },
      { label: "Zoom", items: [
        { type: "big", icon: "zoom", label: "Zoom", act: "zoom-menu" },
        { type: "big", icon: "fit-window", label: "Fit to\nWindow", act: "zoom-fit" }
      ] },
      { label: "Color/Grayscale", hideOrder: 860, items: [
        { type: "stack", items: [
          { icon: "color", label: "Color", act: "color" },
          { icon: "grayscale", label: "Grayscale", act: "grayscale" },
          { icon: "pure-bw", label: "Pure Black and White", act: "bw" }
        ] }
      ] },
      { label: "Window", hideOrder: 1180, items: [
        { type: "big", icon: "new-window", label: "New\nWindow" },
        { type: "stack", items: [
          { icon: "arrange-all", label: "Arrange All" },
          { icon: "cascade", label: "Cascade" },
          { icon: "move-split", label: "Move Split" }
        ] },
        { type: "big", icon: "switch-windows", label: "Switch\nWindows", menu: true, act: "switch-windows" }
      ] },
      { label: "Macro", hideOrder: 1260, items: [
        { type: "big", icon: "macros", label: "Macros", say: "macros" }
      ] }
    ]
  }
];

// The tab that is open when the page loads (Lehan's brief: the Slide Show tab).
window.PP_START_TAB = "slideshow";

// The page's main heading. Screen readers only: it is not shown. {name} comes from content.js.
window.PP_H1 = "{name}: website as a PowerPoint presentation";

// ---------- Transitions and animations ----------

// Slide transitions, in the order of the gallery on the Animations tab. ms = how long it takes.
// The movements are in powerpoint.js (transitionFrames); the gallery pictures in icons.js.
// Clicking a picture gives the selected slide that transition (until the page is reloaded).
window.PP_TRANSITIONS = [
  { id: "none",         label: "No Transition",               ms: 0 },
  { id: "fade",         label: "Fade Smoothly",               ms: 500 },
  { id: "split",        label: "Split Vertical Out",          ms: 600 },
  { id: "box-out",      label: "Box Out",                     ms: 700 },
  { id: "circle",       label: "Shape Circle",                ms: 700 },
  { id: "wheel",        label: "Wheel Clockwise, 4 Spokes",   ms: 800 },
  { id: "random-bars",  label: "Random Bars Horizontal",      ms: 700 },
  { id: "checkerboard", label: "Checkerboard Across",         ms: 800 },
  { id: "push",         label: "Push Left",                   ms: 600 },
  { id: "bounce",       label: "Bounce",                      ms: 850 },
  { id: "newsflash",    label: "Newsflash",                   ms: 800 }
];

// Entrance animations for things on a slide (PowerPoint's Custom Animation names).
// The movements are in powerpoint.js (entranceFrames).
window.PP_ENTRANCES = {
  "fly-in-right":  { label: "Fly In (From Right)",       ms: 500 },
  "fly-in-left":   { label: "Fly In (From Left)",        ms: 450 },
  "swivel":        { label: "Swivel",                    ms: 700 },
  "custom-path":   { label: "Custom Path (a new random path every time)", ms: 900 },
  "grow-turn":     { label: "Grow & Turn",               ms: 600 },
  "spiral-in":     { label: "Spiral In",                 ms: 800 },
  "bounce":        { label: "Bounce",                    ms: 800 },
  "float":         { label: "Float",                     ms: 600 },
  "faded-zoom":    { label: "Faded Zoom",                ms: 500 },
  "boomerang":     { label: "Boomerang",                 ms: 800 },
  "pinwheel":      { label: "Pinwheel",                  ms: 800 }
};

// What each slide does in the slide show, by slide id (shared/slides/deck.js): its transition, then
// its build, one entrance after another ("After Previous"), so a single click always moves on.
// Targets: "title", "photo" (the first slide's picture), "box1" and "box2" (the Art slide's Writing
// and Photography boxes). "*" is for any slide not listed.
window.PP_SLIDE_FX = {
  home:       { transition: "circle",       build: [ { target: "photo", effect: "pinwheel" }, { target: "title", effect: "fly-in-right" } ] },
  research:   { transition: "bounce",       build: [ { target: "title", effect: "swivel" } ] },
  talks:      { transition: "random-bars",  build: [ { target: "title", effect: "custom-path" } ] },
  teaching:   { transition: "wheel",        build: [ { target: "title", effect: "grow-turn" } ] },
  experience: { transition: "push",         build: [ { target: "title", effect: "spiral-in" } ] },
  awards:     { transition: "checkerboard", build: [ { target: "title", effect: "bounce" } ] },
  cv:         { transition: "split",        build: [ { target: "title", effect: "float" } ] },
  art:        { transition: "newsflash",    build: [ { target: "title", effect: "faded-zoom" },
                                                     { target: "box1", effect: "fly-in-left" },
                                                     { target: "box2", effect: "fly-in-right" } ] },
  end:        { transition: "box-out",      build: [ { target: "title", effect: "boomerang" } ] },
  "*":        { transition: "fade",         build: [ { target: "title", effect: "faded-zoom" } ] }
};

// Wording around the animations: the Custom Animation box, the little star in the slides pane.
// {n}, {title}, {label}, {seconds} are filled in by powerpoint.js.
window.PP_ANIM_TEXT = {
  dialogTitle: "Custom Animation",
  slide: "Slide {n}: {title}",
  transition: "Transition to this slide: <b>{label}</b> ({seconds} seconds)",
  noTransition: "No transition: this slide just appears.",
  list: "Then, one after another (After Previous):",
  empty: "No animations on this slide.",
  play: "Play",
  targets: { title: "Title", photo: "Picture", box: "{label} box" },
  indicator: "Play Animations",
  indicatorTip: "Plays this slide's transition and animations.",
  tileTip: "Click to use it for the selected slide (rest the mouse on it for a preview).",
  applyAll: "<p><b>{label}</b> now plays before every slide.</p><p>Reload the page to get each slide's own transition back.</p>"
};

// Theme tiles (Design tab). Decorative: the slides always use the Office Theme.
// Each "Aa" (ink on bg) keeps a contrast of at least 4.5:1.
window.PP_THEMES = [
  { name: "Office Theme", bg: "#ffffff", ink: "#1f1f1f", accents: ["#4f81bd", "#c0504d", "#9bbb59", "#8064a2"] },
  { name: "Apex",         bg: "#ceccbd", ink: "#3d3d3d", accents: ["#ceb966", "#9cb084", "#6bb1c9", "#6585cf"] },
  { name: "Aspect",       bg: "#ffffff", ink: "#323232", accents: ["#f07f09", "#9f2936", "#1b587c", "#4e8542"] },
  { name: "Civic",        bg: "#f1ebe1", ink: "#5f6680", accents: ["#d16349", "#ccb400", "#8cadae", "#8c7b70"] },
  { name: "Concourse",    bg: "#ffffff", ink: "#464646", accents: ["#2da2bf", "#da1f28", "#eb641b", "#39639d"] },
  { name: "Equity",       bg: "#e9e5dc", ink: "#696464", accents: ["#d34817", "#9b2d1f", "#a28e6a", "#956251"] },
  { name: "Flow",         bg: "#04617b", ink: "#ffffff", accents: ["#0f6fc6", "#009dd9", "#0bd0d9", "#10cf9b"] },
  { name: "Metro",        bg: "#d6ecff", ink: "#4e5b6f", accents: ["#7fd13b", "#ea157a", "#feb80a", "#00addc"] }
];

// ---------- The Office button menu ----------
// Left column: commands. Items with `sub` show more choices on the right when
// hovered or clicked. `recent` is the "Recent Documents" list.
// {doc}, {first}, {email}, {cvFile}, {photoText} and {blogText} are filled in from content.js.
window.PP_OFFICE_MENU = {
  items: [
    { label: "New", icon: "om-new", say: "newSlide" },
    { label: "Open", icon: "om-open", act: "recent" },
    { label: "Save", icon: "om-save", say: "save" },
    { label: "Save As", icon: "om-saveas", sub: {
      heading: "Save a copy of the document",
      items: [
        { label: "PowerPoint Presentation", text: "Save the presentation in the default file format.", icon: "om-pptx", say: "save" },
        { label: "PDF or XPS", text: "Download {first}'s CV as a PDF.", icon: "om-pdf", act: "open:cv" }
      ] } },
    { label: "Print", icon: "om-print", sub: {
      heading: "Preview and print the document",
      items: [
        { label: "Print", text: "Open {first}'s CV (PDF), ready to print.", icon: "om-print", act: "open:cv" },
        { label: "Print Preview", text: "Look through all the slides at once.", icon: "view-sorter", act: "view-sorter" }
      ] } },
    { label: "Send", icon: "om-send", sub: {
      heading: "Send a copy of the document to other people",
      items: [
        { label: "E-mail", text: "Write to {first}: {email}", icon: "om-mail", act: "mail" }
      ] } },
    { label: "Publish", icon: "om-publish", sub: {
      heading: "Distribute the presentation to other people",
      items: [
        { label: "Classic website", text: "The same content as a plain, text-based academic website.", icon: "om-web", act: "open:classic" },
        { label: "Photography", text: "{photoText}", icon: "om-camera", act: "open:photography" },
        { label: "Blog", text: "{blogText}", icon: "om-blog", act: "open:blog" }
      ] } },
    { label: "Close", icon: "om-close", act: "close-window" }
  ],
  recent: [
    { label: "Classic website.htm", act: "open:classic" },
    { label: "{cvFile}", act: "open:cv" },
    { label: "Photography.url", act: "open:photography" },
    { label: "Blog.url", act: "open:blog" },
    { label: "{doc}", act: "close-menu" }
  ],
  footer: [
    { label: "PowerPoint Options", icon: "om-options", act: "help" },
    { label: "Exit PowerPoint", icon: "om-exit", say: "exit" }
  ]
};

// ---------- Messages ----------
// What the decorative buttons say, as XP dialog boxes.
//   title (default "Microsoft Office PowerPoint"), icon (an XP.icon name, default "info"),
//   text (plain) or html, buttons (default ["OK"]),
//   then: { "Button label": "command" } runs a command when that button is clicked.
// Placeholders (filled from content.js): {label} (the button clicked), {doc} (Lehan Zhang.pptx),
// {name}, {first} (first name), {email}. They also work in button labels and ScreenTip text.
window.PP_SAY = {
  generic: {
    html: "<p><b>{label}</b> is just for show in this presentation.</p>" +
          "<p>To watch the slides, click <b>From Beginning</b> on the <b>Slide Show</b> tab, or press <b>F5</b>.</p>",
    buttons: ["From Beginning", "OK"], then: { "From Beginning": "show-begin" }
  },
  save:        { text: "{doc} is saved. It is a website now, so nothing you click here can break it." },
  undo:        { text: "There is nothing to undo. The slides are exactly as {first} left them." },
  paste:       { text: "The clipboard is empty. (Copying is fine. Citing is better.)" },
  fonts:       { html: "<p>This presentation is set in <b>Calibri</b>, the Office 2007 default.</p><p>Comic Sans was considered, briefly.</p>" },
  themeParts:  { text: "These slides use the Office Theme: white, Calibri and a little orange. {first} likes it plain." },
  newSlide:    { html: "<p>The deck is complete for now.</p><p>Have an idea for the next slide? {first} is always happy to hear about new projects: <b>{email}</b></p>",
                 buttons: ["Email {first}", "OK"], then: { "Email {first}": "mail" } },
  deleteSlide: { icon: "warning", text: "These slides are load-bearing. Deleting is switched off in this presentation." },
  hideSlide:   { text: "No slides are hidden. What you see is all there is." },
  narration:   { icon: "warning", html: "<p>No microphone was found.</p><p>{first} prefers to give talks in person. The <b>Talks</b> slide lists where.</p>",
                 buttons: ["Go to Talks", "OK"], then: { "Go to Talks": "go:talks" } },
  presenter:   { html: "<p>Presenter View needs a second monitor.</p><p>This computer has one monitor and one very green hill.</p>" },
  comment:     { html: "<p>Comments are welcome. Send them to <b>{email}</b>.</p>",
                 buttons: ["Email {first}", "OK"], then: { "Email {first}": "mail" } },
  protect:     { html: "<p>This presentation is read-only. A printable copy of the CV is one click away.</p>",
                 buttons: ["Open CV (PDF)", "OK"], then: { "Open CV (PDF)": "open:cv" } },
  picture:     { html: "<p>The pictures live on {first}'s photography website.</p>",
                 buttons: ["Open Photography", "Cancel"], then: { "Open Photography": "open:photography" } },
  chart:       { html: "<p>The charts are in the papers. The <b>Research</b> slide links to them.</p>",
                 buttons: ["Go to Research", "OK"], then: { "Go to Research": "go:research" } },
  movie:       { html: "<p>The video work is on the <b>Art</b> slide.</p>",
                 buttons: ["Go to Art", "OK"], then: { "Go to Art": "go:art" } },
  hyperlink:   { title: "Insert Hyperlink", html: "<p>Link to:</p>",
                 buttons: ["Classic website", "CV (PDF)", "Photography", "Blog", "Cancel"],
                 then: { "Classic website": "open:classic", "CV (PDF)": "open:cv", "Photography": "open:photography", "Blog": "open:blog" } },
  themes:      { html: "<p><b>{label}</b> is a fine theme, but {first} is sticking with the Office Theme. It goes with everything.</p>" },
  pageSetup:   { title: "Page Setup", text: "Slides sized for: On-screen Show (16:9). Width 25.4 cm, height 14.29 cm. Orientation: landscape, like a good conference talk." },
  notesPage:   { html: "<p>The speaker notes are under each slide in <b>Normal</b> view.</p>",
                 buttons: ["Normal View", "OK"], then: { "Normal View": "view-normal" } },
  master:      { text: "The slide master is locked. Every slide already follows it." },
  macros:      { icon: "warning", text: "Macros are disabled. This presentation is made of plain HTML, CSS and JavaScript." },
  spelling:    { text: "The spelling check is complete." },
  customShows: { title: "Custom Shows", html: "<p>Each custom show starts at a different page of {first}'s website. Pick one from the <b>Custom Slide Show</b> list.</p>" },
  recycle:     { title: "Recycle Bin", icon: "recycle", text: "The Recycle Bin is empty. ({first} recycles ideas, not slides.)" },
  exit:        { icon: "warning", text: "Do you want to save the changes you made to {doc}?",
                 buttons: ["Yes", "No", "Cancel"], then: { "Yes": "landing", "No": "landing" } },
  motionOff:   { html: "<p>This computer asks for less motion, so the transitions and animations are switched off.</p>" +
                       "<p>To see them anyway, add <b>?motion=on</b> to the address.</p>" }
};

// ---------- Help ----------
// The "?" button, F1, the XP start menu's Help and Support, and Set Up Slide Show.
// {classicUrl} is filled in by powerpoint.js.
window.PP_KEYS_HTML =
  '<table class="pp-keys">' +
  "<tr><th>Next slide</th><td>Click, Space, &rarr;, &darr;, Page Down or N</td></tr>" +
  "<tr><th>Previous slide</th><td>&larr;, &uarr;, Page Up, Backspace or P</td></tr>" +
  "<tr><th>While a slide animates</th><td>Click once to finish its animations; the next click moves on</td></tr>" +
  "<tr><th>Go to slide 4</th><td>Type 4, then Enter</td></tr>" +
  "<tr><th>Black or white screen</th><td>B or W (any key to come back)</td></tr>" +
  "<tr><th>End the show</th><td>Esc</td></tr>" +
  "<tr><th>On a phone</th><td>Tap or swipe</td></tr></table>";
window.PP_HELP_HTML =
  "<p><b>Watching the presentation</b></p>" +
  "<p>Click <b>From Beginning</b> on the <b>Slide Show</b> tab, or press <b>F5</b>. Shift+F5 starts from the slide you are on.</p>" +
  "{keys}" +
  "<p><b>Looking around</b></p>" +
  "<p>Click a slide on the left to see it larger. The little star under a slide's number plays its transition and animations. " +
  "The round <b>Office button</b> (top left) has the CV, email, photography, the blog and the classic website.</p>" +
  '<p><a href="{classicUrl}">Open the classic website</a></p>';

// ---------- About ----------
// The "i" button beside Help in the taskbar tray: what inspired this version (in Lehan's words).
window.PP_ABOUT = {
  title: "About this PowerPoint",
  html: "<p>This version is inspired by my childhood: I wasn't allowed to play computer games as a kid, " +
        "so I spent my allocated screen time making animations and slideshows in PowerPoint.</p>"
};
