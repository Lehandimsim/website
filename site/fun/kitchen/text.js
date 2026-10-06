/* ==========================================================================
   fun/kitchen/text.js — the kitchen’s own words.

   Recipe steps, instructions, cheers and button labels for the Kitchen
   version only. The website’s actual content (home text, papers, talks,
   CV, art, experience) is NOT here: it is read from ../../content.js, and
   page names come from SITE.pages, so renaming a page there renames it here.

   Inline formatting works in the longer strings: **bold**  *italic*
   {page} is replaced by the page name, {done}/{total} by numbers.
   ========================================================================== */

window.KITCHEN_TEXT = {

  siteName: "Lehan’s Kitchen",

  // ---- The recipe card (bottom of the screen) -----------------------------
  recipe: {
    kicker: "Today’s recipe",
    dish: "Tomato & egg stir-fry",
    servedWith: "served with rice",
    progress: "{done} of {total} ingredients ready",
    allReady: "Everything’s prepped. Time to stir-fry!",
    served: "Served! Thanks for cooking with me."
  },

  // ---- The five ingredients, in recipe order ------------------------------
  // id:     used in the URL (#cook/<id>) and in the scene markup (data-ingredient)
  // page:   the SITE.pages id it opens
  // step:   the line on the recipe card
  // title / instruction / cheer: the little cooking moment before the page opens
  // presses: how many clicks (or taps, or key presses) the moment takes
  //           (the close-up drawings in index.html animate for exactly these numbers)
  // The order of this list is the order on the recipe card and of the page panels
  // (Previous / Next), and matches the counter, left to right (Lehan, 2026-10-02).
  ingredients: [
    {
      id: "rice", page: "research", name: "Rice", object: "Rice cooker",
      step: "Cook the rice", detail: "in the rice cooker",
      title: "Cook the rice",
      instruction: "Press **COOK** on the rice cooker.",
      cheer: "Fluffy rice!", presses: 1
    },
    {
      id: "eggs", page: "talks", name: "Eggs", object: "Bowl of eggs",
      step: "Crack the eggs", detail: "",
      title: "Crack the eggs",
      instruction: "Tap the egg on the bowl. Twice!",
      instructionMore: "One more tap!",
      cheer: "Perfect crack!", presses: 2
    },
    {
      id: "onions", page: "experience", name: "Spring onions & garlic", object: "Spring onions and garlic on the chopping board",
      step: "Chop the spring onions and garlic", detail: "",
      title: "Chop the spring onions & garlic",
      instruction: "Chop the spring onion!",
      instructionMore: "Now smash the garlic!",
      cheer: "Smells amazing!", presses: 2
    },
    {
      id: "tomatoes", page: "art", name: "Tomatoes", object: "Plate of tomatoes",
      step: "Cut the tomatoes", detail: "",
      title: "Cut the tomatoes",
      instruction: "Slice along the dashed lines: click (or tap) twice.",
      instructionMore: "And one more slice!",
      cheer: "So juicy!", presses: 2
    },
    {
      id: "seasoning", page: "cv", name: "Seasoning", object: "Seasoning shelf",
      step: "Season", detail: "oyster sauce, Shao Hsing cooking wine, salt, sugar, MSG",
      title: "Season it",
      instruction: "Click to add the seasoning.",
      cheer: "Perfectly seasoned!", presses: 1
    }
  ],

  // Step 6: the wok on the stove.
  serve: {
    step: "Stir-fry & serve",
    stepPage: "The finale",
    tag: "Stir-fry & serve",
    thing: "Wok",
    hoverLeft: "{left} more to prep first",
    hoverReady: "Everything’s ready: click to serve!",
    notReadyTitle: "The wok is hot!",
    notReady: "We still need: {missing}. Each ingredient opens a page of the site.",
    serveAnyway: "Serve it anyway",
    // When all five ingredients are ready:
    readyTitle: "Everything’s prepped!",
    ready: "Last step: toss it all in the wok and serve.",
    readyButton: "Stir-fry & serve!",
    pointer: "Serve!"
  },

  // ---- Hover labels and tags in the scene ----------------------------------
  // "Rice → Research", plus a short hint underneath.
  hover: {
    cook: "Click to cook",
    again: "Ready! Click to open"
  },
  logo: { hint: "Home: about me" },
  motion: { label: "Motion", turnOn: "Animations are off. Click to turn them on.", turnOff: "Animations are on. Click to turn them off." },
  frames: {
    label: "Pictures", tag: "Photography", hint: "My photography site, in a new tab",
    // Cartoon versions of three of Lehan's photos, left to right on the wall (read out by screen readers).
    pictures: [
      "A singer in sunglasses and a black jacket, belting into the microphone amid orange stage flames and smoke.",
      "A fashion shoot: a blonde model in a pale silver-blue suit, perched on a tilted white box, holding a giant leek.",
      "An alpine lake in autumn: golden larches dusted with snow, snowy peaks, and their reflections in dark water."
    ]
  },
  book: { label: "Recipe book", tag: "Recipes", hint: "Play a recipe, or find more on my blog" },

  // ---- Phones held upright: the kitchen is wider than the screen -----------
  // A one-time hint above the recipe card (the full-screen button appears only where the
  // browser allows it, e.g. Chrome on Android; not on iPhones).
  pan: {
    swipe: "Swipe to see the whole kitchen",
    turn: "Or turn your phone sideways to see it all.",
    fullScreen: "Full screen",
    close: "Got it"
  },

  // ---- The little rice bowl (bottom right) and its popup ---------------------
  about: {
    button: "About this kitchen",
    title: "About this kitchen",
    body: "This kitchen is a nostalgic nod to Cooking Mama, a game I loved playing as a kid. It's also here because I really love food.",
    small: "Cooking Mama belongs to its owners; this site is not affiliated with them.",
    close: "Close"
  },

  // ---- Chef speech bubbles -------------------------------------------------
  welcome: {
    title: "Welcome to my kitchen!",
    body: "Today we’re cooking **tomato & egg stir-fry, served with rice**. Everything that glows and wiggles can be clicked: each ingredient opens a page of my website.",
    button: "Let’s cook!",
    classic: "I’d rather read the classic site"
  },
  startHere: "Start here!",

  // ---- Cooking moments (shared bits) ---------------------------------------
  station: {
    stepLabel: "Step {n} of {total}",
    skip: "Skip to {page}",
    opening: "Opening {page}…"
  },

  // ---- Page panels ---------------------------------------------------------
  panel: {
    chefKicker: "The chef",
    ingredientKicker: "Ingredient {n} of {total} · {name}",
    close: "Back to the kitchen",
    prev: "Previous",
    next: "Next"
  },

  // Small headings and labels inside the pages (the content itself is from content.js;
  // "Research interests" and "Methods" are labels in content.js too).
  headings: {
    papers: "Papers",
    education: "Education",
    performances: "Performances",
    projects: "Art Projects",
    photoWriting: "Photography and writing",
    work: "Work experience",
    teaching: "Teaching",
    service: "Service",
    awards: "Awards and extracurriculars",
    skills: "Skills"
  },
  labels: {
    upcoming: "Upcoming",
    viewCv: "View the CV (PDF)",
    newTab: "(opens in a new tab)",
    photoCaption: "Chef Lehan",
    quickClassic: "Classic site",
    quickScholar: "Google Scholar",
    quickCv: "CV (PDF)",
    quickPhotography: "Photography",
    quickBlog: "Blog"
  },

  // ---- Recipe book ---------------------------------------------------------
  recipeBook: {
    title: "Lehan’s recipe book",
    playTitle: "Fried rice",
    playBlurb: "A recipe you can play: five quick steps, no way to burn it.",
    playMeta: "Serves 1 hungry visitor · about 2 minutes",
    playSteps: ["Chop the carrot", "Crack the egg", "Stir-fry the rice", "Pour the soy sauce", "Toss the wok"],
    playButton: "Play the recipe",
    moreTitle: "Hungry for more?",
    moreLine: "You can find more recipes here",
    moreButton: "Lehan’s blog",
    close: "Close the recipe book"
  },

  // ---- Finale --------------------------------------------------------------
  finale: {
    cooking: "Stir-frying…",
    title: "Dinner is served!",
    dish: "Tomato & egg stir-fry, served with rice.",
    body: "All five ingredients are in. Thanks for cooking with me!",
    bodyEarly: "Served straight to the table. The ingredients are still waiting in the kitchen if you’d like to visit them.",
    classic: "Read the classic site",
    cv: "Download my CV (PDF)",
    play: "Cook another recipe",
    start: "Back to the start page",
    // Followed by the other fun versions' names (from config.js), each a link.
    versions: "Or try another version of this site:"
  },

  // ---- The fried rice mini-game (game.js) ---------------------------------
  game: {
    kicker: "Recipe book · Fried rice",
    kickerShort: "Fried rice",
    quit: "Quit the game (back to the recipe book)",
    skip: "Skip step",
    stepOf: "Step {n} of {total}",
    ratings: ["Nice!", "Great!", "Perfect!"],   // 1, 2, 3 points
    stages: {
      chop:  { title: "Chop the carrot", instruction: "Click (or tap) on each dashed line to chop.", keys: "Keyboard: Space chops." },
      crack: { title: "Crack the egg", instruction: "Tap the egg on the bowl. Twice!", more: "One more tap!", keys: "Keyboard: Space taps." },
      stir:  { title: "Stir-fry the rice", instruction: "Stir in circles over the wok!", keys: "Or click / press Space to stir." },
      pour:  { title: "Pour the soy sauce", instruction: "Press and hold to pour. Let go at the dashed line!", keys: "Keyboard: hold Space." },
      toss:  { title: "Toss the wok", instruction: "Click (or tap) when the marker is in the green zone. Three tosses!", keys: "Keyboard: Space tosses." }
    },
    skipped: "Skipped!",
    pourMore: "A little more! Press and hold to keep pouring.",
    pourOver: "Whoa, salty!",
    tossMiss: "Rice everywhere! Still tasty.",
    resultTitle: "Fried rice is served!",
    starsLabel: "{n} out of 3 stars.",
    results: [
      "Tasty! Every great chef started with a messy wok.",   // 1 star
      "Delicious! A little more wok hei next time.",         // 2 stars
      "Perfect! Fluffy, smoky, restaurant-worthy fried rice." // 3 stars
    ],
    again: "Play again",
    toBook: "Back to the recipe book",
    toKitchen: "Back to the kitchen",
    blog: "More recipes on my blog"
  }
};
