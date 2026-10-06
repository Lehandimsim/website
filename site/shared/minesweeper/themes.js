/* ==========================================================================
   shared/minesweeper/themes.js — ALL the game's wording: one block per theme.
   Edit the jokes here. (Pictures: art.js. Colours: minesweeper.css. Rules: minesweeper.js.)

   gameName      the game's own name: the desktop icon, the start menu and the window title
   defaultTheme  the theme the game opens in
   order         the order of the Theme menu (delete a theme's id here to hide it)

   In a theme's texts, {curly} words are filled in by the game:
     {time}   seconds taken            {safe}   squares opened to win
     {mines}  how many "mines"         {level}  the level's name in this theme
     {cell}   what the square that went off stands for (see "cells")
     {reason} one of lose.reasons, picked at random
   "cells" names every square: "{n}" is its number, "{row}"/"{col}" its row and column ("{rowLetter}"
   = A, B, C...), and {0}, {1}, {2} pick a word from parts[0], parts[1], parts[2] (a different mix
   for each square). The names show under the board when the mouse is over a square.
   On touch screens the game shows "press and hold" wherever an intro says "right-click".

   Jokes are about academic life in general. None quotes a real person; the one reference to a
   real paper (the "rain" theme) is checked: Mellon (2024), AJPS, doi:10.1111/ajps.12894.
   ========================================================================== */

window.MS_THEMES = {

  // The game is called Minesweeper; each theme keeps its own name (Lehan, 2026-10-05).
  gameName: "Minesweeper",
  defaultTheme: "spec",
  order: ["spec", "scooped", "seminar", "rain"],

  // The desktop icon's tooltip.
  iconTip: "A game: Minesweeper for economists",

  // Wording shared by every theme. {mine}, {mines}, {flag}, {flagVerb}, {square}, {squares} come
  // from the theme's "words".
  common: {
    menus: { game: "Game", theme: "Theme", help: "Help" },
    newGame: "New game",
    levels: { beginner: "Beginner", intermediate: "Intermediate", expert: "Expert" },
    expertTooSmall: "needs a wider screen",
    flagMode: "Flag mode",
    flagModeTip: "On: a click or tap marks a square instead of opening it",
    bestTimes: "Best times…",
    exit: "Exit",
    chooseTheme: "Choose a theme",
    howToPlay: "How to play",
    aboutTheme: "About this theme",
    about: "About",
    playAgain: "New game",
    newBest: "New best time for {level}!",
    bestTitle: "Best times",
    bestNone: "not yet",
    bestReset: "Reset",
    howToHtml:
      "<p><b>Goal:</b> open every {square} that is not a {mine}.</p>" +
      "<p><b>Numbers</b> count the {mines} in the eight squares around one.</p>" +
      "<p><b>Right-click</b> a square (on a phone: press and hold, or turn on <b>Flag mode</b>) to {flagVerb}: " +
      "it marks a {mine}. Click a number whose {mines} are all marked to open everything around it.</p>" +
      "<p>The first click is always safe. The face above the board starts a new game.</p>" +
      "<p><b>Keyboard:</b> Tab to the board; arrow keys move; Enter or Space opens; F marks; F2 starts a new game.</p>",
    aboutHtml:
      "<p><b>Minesweeper for economists.</b> An homage to the game that came with Windows, retold in four " +
      "academic themes (Theme menu). Every picture is drawn for this website.</p>" +
      "<p>Your best times stay in this browser only.</p>"
  },

  themes: {

    // ------------------------------------------------------------------
    spec: {
      name: "Specification Search",
      pitch: "Try every specification. The wrong one blows up your paper.",
      words: { mine: "fragile specification", mines: "fragile specifications", flag: "footnote",
               flagVerb: "footnote it", square: "specification", squares: "specifications" },
      levels: { beginner: "Pre-analysis plan", intermediate: "Working paper", expert: "Top 5 submission" },
      counter: "Fragile specifications not yet footnoted",
      timer: "Seconds of specification search",
      face: "Start a new specification search",
      intro: "Each square is one way to run your regression. Run them all, but footnote (right-click) the ones that would blow up the paper.",
      cells: {
        format: "Specification {n}: {0}; {1}; {2}",
        parts: [
          ["no controls", "baseline controls", "+ demographics", "+ income", "kitchen-sink controls"],
          ["no fixed effects", "state FE", "county FE", "state × year FE", "county × year FE", "individual FE"],
          ["robust SEs", "SEs clustered by state", "SEs clustered by county", "two-way clustered SEs", "wild bootstrap"]
        ]
      },
      win: {
        title: "Robust to everything***",
        text: "All {safe} specifications survive, in {time} seconds. Referee 2 has no further comments (for now)."
      },
      lose: {
        title: "Your paper exploded",
        text: "{cell}: {reason}.",
        reasons: [
          "the coefficient flipped sign",
          "the p-value went to 0.38",
          "the effect halved and the standard errors doubled",
          "the pre-trends look like a ski slope",
          "the first-stage F-statistic fell to 2.1",
          "the result now only holds in Ohio, in 2007"
        ]
      },
      about:
        "<p><b>About this theme:</b> the garden of forking paths. A result should survive every reasonable way of " +
        "running the regression: other controls, fixed effects, clustering. Here every square is one such " +
        "specification. The numbers count the fragile ones next door, a flag puts one in a footnote (†), and " +
        "one wrong click and the paper explodes.</p>"
    },

    // ------------------------------------------------------------------
    scooped: {
      name: "Scooped!",
      pitch: "Explore the literature without landing on someone else's paper.",
      words: { mine: "rival paper", mines: "rival papers", flag: "citation",
               flagVerb: "cite it", square: "corner of the literature", squares: "corners of the literature" },
      levels: { beginner: "Second-year paper", intermediate: "Dissertation", expert: "Research agenda" },
      counter: "Rival papers not yet cited",
      timer: "Seconds since you had the idea",
      face: "Have a new idea",
      intro: "Each square is a corner of the literature. Open them all to show your idea is new; cite (right-click) the rival papers before you land on one.",
      cells: {
        format: "Idea {n}: {0} and {1}",
        parts: [
          ["Social media", "Rainfall", "Minimum wages", "Television", "Remote work", "Newspapers", "Football", "Pop music", "Chatbots", "Railways"],
          ["voting", "trust", "marriage", "migration", "polarisation", "happiness", "crime", "language", "religion", "protest"]
        ]
      },
      win: {
        title: "Novel contribution!",
        text: "You searched all {safe} corners of the literature in {time} seconds, and nobody has written your paper. Post it today."
      },
      lose: {
        title: "Scooped!",
        text: "{cell}? {reason}.",
        reasons: [
          "A working paper with your exact idea went online on Monday. It even has your pun in the title",
          "A 1974 paper did it first, with better data",
          "Footnote 12 of a 1962 paper already has your main result",
          "It is the job market paper of someone you met at a conference last year",
          "Someone posted the whole paper as a thread last night",
          "A poster you walked past at a conference had the same idea, and the same graph"
        ]
      },
      about:
        "<p><b>About this theme:</b> every researcher's fear. You find a great idea, spend a year on it, and someone " +
        "else's paper appears first. Here every square is a corner of the literature. The numbers count rival " +
        "papers nearby, a flag cites one (cf.), and the face is an ice-cream cone that loses its scoop.</p>"
    },

    // ------------------------------------------------------------------
    seminar: {
      name: "Quick Question",
      pitch: "Reach your conclusion slide before “a quick clarifying question” eats the hour.",
      words: { mine: "quick question", mines: "quick questions", flag: "“I’ll come back to that”",
               flagVerb: "defer it", square: "seat", squares: "seats" },
      levels: { beginner: "Brown-bag lunch", intermediate: "Department seminar", expert: "Job talk" },
      counter: "Quick questions not yet deferred",
      timer: "Seconds into your seminar slot",
      face: "Start a new seminar",
      intro: "Each square is a seat in the seminar room. Look at everyone, but defer (right-click) the people about to ask “a quick clarifying question”.",
      cells: { format: "Row {rowLetter}, seat {col}" },
      win: {
        title: "You reached the conclusion slide!",
        text: "All {safe} seats checked, {time} seconds in, and there is still time for questions. Nobody asked about clustering."
      },
      lose: {
        title: "“Just a quick clarifying question…”",
        text: "{cell}: {reason}.",
        reasons: [
          "a question about slide 2. Forty minutes later you are still on slide 2",
          "“Is this causal?”, asked one slide before your identification slide",
          "a follow-up to the follow-up to the question before",
          "“Have you thought about selection?” You have. It is slide 31",
          "“Not a question, more of a comment…”",
          "“A few small points.” There are fourteen"
        ]
      },
      about:
        "<p><b>About this theme:</b> economics seminars are famous for interruptions. A hand goes up on slide 2 with " +
        "“a quick clarifying question”, and the hour is gone. Here every square is a seat. The numbers count " +
        "the questions about to come from nearby seats, a flag is a sticky note (“I’ll come back to that”), " +
        "and you win if you reach your conclusion slide.</p>"
    },

    // ------------------------------------------------------------------
    rain: {
      name: "Exclusion Restriction",
      pitch: "Rainfall is your instrument. Does it really affect nothing else?",
      words: { mine: "exclusion-restriction violation", mines: "violations", flag: "assumption (⊥)",
               flagVerb: "assume it away", square: "channel", squares: "channels" },
      levels: { beginner: "One village", intermediate: "District panel", expert: "Global panel, 1950–2020" },
      counter: "Violations not yet assumed away",
      timer: "Seconds since your first stage",
      face: "Find a new instrument",
      intro: "You use rainfall as an instrument. Each square is a channel from rain to your outcome. Open the harmless ones; assume away (right-click) the ones that break your IV.",
      cells: {
        format: "Channel {n}: rainfall → {0}",
        parts: [
          ["crop yields", "voter turnout", "mood", "traffic accidents", "protest turnout", "conflict", "migration",
           "stadium attendance", "school attendance", "umbrella sales", "electricity demand", "commuting", "flooding", "crime"]
        ]
      },
      win: {
        title: "Exclusion restriction holds!",
        text: "All {safe} channels are clear, in {time} seconds. Rain affects your outcome only through your treatment (in this grid, at least)."
      },
      lose: {
        title: "Exclusion restriction violated",
        text: "Rainfall also affects {reason}. Your instrument is now a control variable.",
        reasons: ["voter turnout", "crop yields, and so incomes", "mood", "who turns up to protests", "conflict", "migration", "traffic accidents"]
      },
      about:
        "<p><b>About this theme:</b> rainfall is a favourite instrumental variable, which only works if rain affects the " +
        "outcome through one channel. Mellon (2024, <i>American Journal of Political Science</i>) found 194 variables " +
        "that studies have linked to weather, each a potential exclusion-restriction violation " +
        "(<a href=\"https://doi.org/10.1111/ajps.12894\" target=\"_blank\" rel=\"noopener\">doi:10.1111/ajps.12894</a>). " +
        "Here every square is a channel. The numbers count violations nearby, a flag assumes one away (⊥), and the " +
        "face is the weather.</p>"
    }
  }
};
