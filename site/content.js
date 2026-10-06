/* ==========================================================================
   content.js — ALL the text on the website lives in this one file.

   The classic site and all four fun versions (kitchen, paint, powerpoint,
   overleaf) read from here, so editing a line below changes it everywhere.

   Source: References/CV_lehanzhang_oct26.pdf, with its typos fixed
   (list: Memos/2026-10-01_project_setup_and_build_plan.md §4.2).
   The home text is verbatim from the brief.

   Inline formatting inside any text string:
     **bold**    *italic*    [link text](https://example.com)
   File paths are relative to the site/ folder.
   ========================================================================== */

window.SITE = {

  person: {
    name: "Lehan Zhang",
    email: "lehan.zhang@gess.ethz.ch",
    tagline: "Economist and data scientist",
    affiliation: "PhD Candidate, [AI & Economics Lab](https://ai-econ-lab.org/), ETH Zurich",
    // Made from one photo by tools/make_photos.py.
    photo: {
      headshot: "assets/img/lehan-headshot.jpg", // square, for small round avatars
      portrait: "assets/img/lehan-portrait.jpg",   // 335 x 493
      wide: "assets/img/lehan-wide.jpg",           // 560 x 583
      alt: "Lehan Zhang"
    },
    // Placeholder for the V1 kitchen logo, until Lehan supplies an illustrated face.
    face: { src: "assets/img/lehan-face.jpg", alt: "Lehan Zhang" },
    links: {
      scholar: "https://scholar.google.com/citations?user=JYuPwdgAAAAJ&hl=en",   // Lehan, 2026-10-05
      cv: "assets/cv/CV_lehanzhang_oct26.pdf",
      photography: "https://lehanzzhang.wixsite.com/photography",
      blog: "https://congeecosmicbinchicken.wordpress.com/"
    }
  },

  // The site's pages, in navigation order (every version follows it). Change a label here to
  // rename it everywhere. Order from Lehan, 2026-10-02.
  pages: [
    { id: "home",       label: "Home" },
    { id: "research",   label: "Research" },
    { id: "talks",      label: "Talks" },
    { id: "experience", label: "Other Experience" },
    { id: "cv",         label: "CV" },
    { id: "art",        label: "Art" }
  ],

  // From the brief ("/tab" = paragraph break), as amended by Lehan on 2026-10-02.
  // The two labs are links wherever they appear on the site (Lehan, 2026-10-02).
  home: {
    heading: "Lehan Zhang",
    paragraphs: [
      "I am an economist and data scientist. My research focuses on political economics, media, and culture.",
      "I am currently a third year PhD Candidate in the [AI & Economics Lab](https://ai-econ-lab.org/) at ETH Zurich, Switzerland. Previously, I completed a B. Data Science and Decisions (Quantitative), and B. Economics (Honours Class I) (Econometrics) from UNSW Sydney, Australia and worked as a research fellow at the [Resilient Democracy Lab](https://resilientdemocracylab.org/)."
    ],
    emailLine: "Email: lehan.zhang@gess.ethz.ch"
  },

  research: {
    interestsLabel: "Research interests",
    interests: ["culture and identity", "media", "political economics"],
    // Shown on its own line under the interests (Lehan, 2026-10-02).
    methodsLabel: "Methods",
    methods: ["Causal inference", "unstructured data", "NLP/AI"],
    abstractLabel: "Abstract",
    // Coauthors' homepages (checked 2026-10-02). A coauthor's name links here wherever papers are listed.
    coauthorPages: {
      "Gabriele Gratton": "https://gratton.org/",
      "Pauline Grosjean": "https://sites.google.com/site/paulinegrosjeanperso/home",
      "Hasin Yousaf": "https://sites.google.com/site/hasinyousaf08/home",
      "Elliott Ash": "https://elliottash.com/",
      "Sergio Galletta": "https://sergio-galletta.com/",
      "Federico Masera": "https://sites.google.com/site/fgmasera/home",
      "Alexander Hoyle": "https://alexanderhoyle.com/"
    },
    // abstract: verbatim from the paper's PDF (only line-break hyphens rejoined). Papers without a PDF have none.
    papers: [
      {
        title: "Adding Fuel to the (Gun)Fire: How Politicians Polarize the Public Debate",
        coauthors: ["Gabriele Gratton", "Pauline Grosjean", "Hasin Yousaf"],
        status: "CEPR Discussion Paper",   // CEPR's series name (Lehan, 2026-10-05; the CV says "Working Paper")
        year: 2026,
        links: [{ label: "PDF", url: "https://gratton.org/papers/AddingFuel.pdf" }],
        // From the PDF dated October 22, 2025.
        abstract: "We document how politicians politicize public debates. Analyzing 4.75 million tweets related to 57 mass shooting events, two-way fixed effects and event studies results show that the partisan and issue-polarized content of tweets systematically increases after a politician first tweets about an event. Analysis of the timing of interventions suggests that politicians do not intervene in response to specific characteristics of the event, nor to immediate changes in the debate. Interventions by non-politicians focal influencers do not have similar effects. We show how the rhetorical supply of politicians explains the polarizing effect of their interventions."
      },
      {
        title: "The Joe Rogan Effect: Politicized Podcasts and the Youth Gender Voting Gap",
        coauthors: ["Elliott Ash", "Sergio Galletta", "Federico Masera"],
        status: "Working Paper",
        year: 2026,
        // Link from Lehan (2026-10-01). The CV's copy of this link lacks "?rlkey=..." and does not open
        // the file, so keep this one if the content is re-derived from an unfixed CV.
        links: [{ label: "PDF", url: "https://www.dropbox.com/scl/fi/jwpe8kepwumiompwu0q5f/Rogan-ONLINE-VERSION.pdf?rlkey=kpzzl6tlw81zd4sw9kms8tpbc&e=1&dl=0" }],
        // From the PDF's current version, 17 June 2026.
        abstract: "Online creators have become a central source of political information for young adults in recent years, and over the same period, young men have shifted toward the political right relative to young women. We examine whether these two major developments are connected by focusing on “The Joe Rogan Experience”, the leading long-form podcast, which has a disproportionately male audience. Our identification leverages the timing and location of Ultimate Fighting Championship (UFC) events, for which Rogan has long served as the lead commentator. In a difference-in-differences design, we find that local UFC events trigger a significant increase in Google searches and in time spent consuming Joe Rogan episodes among young men. Applying text analysis to podcast transcripts, we document a pronounced shift in Rogan’s political rhetoric: until 2020, Rogan frequently expressed support for Sanders with left-populist rhetoric; starting in 2021, his commentary became supportive of Trump with a right-populist slant. Using administrative voter files, we show that exposure to UFC events until 2020 increased Democratic voting in primaries with Sanders, while after that, exposure to UFC events increased Republican voting in primaries with Trump with all effects concentrated among young men."
      },
      {
        title: "Socioeconomic Paths into Misogynistic Online Cultures: Evidence from Reddit",
        coauthors: ["Elliott Ash", "Alexander Hoyle"],
        status: null,
        year: null,
        links: []
      }
    ]
  },

  // Newest first. month (1-12) is used only to mark upcoming talks; leave null if unknown.
  talks: [
    {
      year: 2026,
      items: [
        { event: "Natural Language in Economics seminar", month: 3, detail: "March, Online" },
        { event: "COMPTEXT", month: 4, detail: "April, Birmingham" },
        { event: "Workshop IdEP in Sustainable Economics", month: 5, detail: "May, USI" },
        { event: "Economics of Media Bias Workshop", month: 5, detail: "May, Hertie School" },
        { event: "Center for Law and Economics Brown Bag Seminar Series", month: 5, detail: "May, ETHZ" },
        { event: "CESifo Workshop on Digital Platforms", month: 6, detail: "June, Warwick" },
        { event: "4th CEPR Workshop on Media, Technology, Politics, and Society", month: 6, detail: "June, EIEF", note: "coauthor presentation" },
        { event: "Women in Political Economics Workshop", month: 9, detail: "September, WU Vienna" },
        { event: "Zurich Political Economy Seminar Series", month: 10, detail: "October, ETHZ/UZH" },
        { event: "Digital Publics Conference", month: 10, detail: "October, DSI UZH" },
        { event: "OB Research Seminar", month: 11, detail: "November, HEC Lausanne", note: "invited talk" }   // Lehan, 2026-10-06
      ]
    },
    {
      year: 2025,
      items: [
        { event: "TILEC Workshop on Economic Governance of Social Media", month: null, detail: "Tilburg University" },
        { event: "3rd CEPR Workshop on Media, Technology, Politics, and Society", month: null, detail: "Bocconi University" },
        { event: "Applied Young Economists Workshop on Political Economics", month: null, detail: "Online" },
        { event: "Zurich Political Economy Seminar Series", month: null, detail: "" },
        { event: "Meditation Chan & Future World Conference", month: null, detail: "Shaolin Temple" }
      ]
    },
    {
      year: 2024,
      items: [
        { event: "Center for Law and Economics Brown Bag Seminar Series", month: null, detail: "ETHZ" },
        { event: "2nd [Resilient Democracy Lab](https://resilientdemocracylab.org/) Workshop", month: null, detail: "UNSW" }
      ]
    },
    {
      year: 2023,
      items: [
        { event: "Econometric Society Australasia Meeting", month: null, detail: "UNSW" }
      ]
    }
  ],

  // Shown on the CV page, above the PDF.
  education: [
    {
      institution: "ETH Zürich, Switzerland",
      degree: "PhD in Economics and Data Science",
      dates: "Aug. 2024 – present",
      details: [
        "Chair of Law, Data Science, and Economics (Ash Group) at the Center for Law & Economics, D-GESS",
        "Advisor: Prof. Elliott Ash. Secondary advisor: Prof. Karsten Donnay (UZH)",
        "Coursework and summer schools: [Swiss Program for Beginning Doctoral Students in Economics](https://www.szgerzensee.ch/programs/beginning-doctoral-program) (Study Center Gerzensee), AI & Economics Summer Institute (Chicago Booth), Zurich Summer School in AI & Applied Economics (ETHZ), Language Models for Law and Social Science (Elliott Ash, ETHZ), Causal Inference (Alberto Abadie, Gerzensee Advanced Courses in Economics), Labor Economics (David Dorn, UZH), Social Norms and Development (Eliana La Ferrara, Gerzensee Advanced Courses in Economics), Economic History: Migration, Networks, Religion (Sascha Becker, ISEG Summer School)"
      ]
    },
    {
      institution: "University of New South Wales (UNSW), Australia",
      degree: "B. Economics (Honours) (Econometrics), First Class Honours",
      dates: "Feb. 2022 – Apr. 2023",
      details: [
        "Recipient of the Gail Kelly Honours Award for Business, a $20,000 AUD scholarship awarded on the basis of all-round academic achievement and leadership",
        "Advisors: Prof. Gabriele Gratton and Prof. Pauline Grosjean"
      ]
    },
    {
      institution: "University of New South Wales (UNSW), Australia",
      degree: "B. Data Science and Decisions (Quantitative Data Science), with Distinction",
      dates: "Feb. 2018 – Dec. 2021",
      details: []
    }
  ],

  cv: {
    pdf: "assets/cv/CV_lehanzhang_oct26.pdf",
    downloadLabel: "Download CV (PDF)"
  },

  art: {
    // Shown above the art projects, in the same style (Lehan, 2026-10-05). Newest first.
    performances: [
      {
        title: "Musikalischer Abend, Musikplattform ETH/UZH, Zürich",
        dates: "May 2026",
        medium: "Piano duet with Damian Camenisch",
        description: "Antonín Dvořák, Slavonic Dances, Op. 46, No. 1: Presto, No. 8: Presto",
        links: []
      },
      {
        title: "Musikalischer Abend, Musikplattform ETH/UZH, Zürich",
        dates: "Nov. 2025",
        medium: "Piano duet with Damian Camenisch",
        description: "Johannes Brahms, Sixteen Waltzes, Op. 39, No. 1, 2, 3, 5, 7, 13, 14 & 15",
        links: []
      }
    ],
    projects: [
      {
        title: "Visible Artist's Noticeboard",
        dates: "May – Jul. 2023",
        medium: "Mixed-media installation, exhibited at Bankstown Arts Centre",
        description: "Commissioned for visible Australia's Western Sydney project, a creative collaboration between artists and young Australians experiencing mental health challenges to share their story as visual advocacy.",
        links: [{ label: "Video feature", url: "https://www.youtube.com/watch?v=Hg2WQwo7xjc" }]
      },
      {
        title: "In the box",
        dates: "2023",
        medium: "1:30 video, exhibited at Customs House Sydney",
        description: "Created for the Diversified x Essem Projects x UNSW Sydney project, a collaboration between inclusive design research and pluriversal community-led participatory exploration into the impact of public space media and digital inclusion for neurodivergent communities.",
        links: [{ label: "About the project", url: "https://www.disabilityinnovation.unsw.edu.au/diversified-storybox-sydney" }]
      },
      {
        title: "Genderbility",
        dates: "2023",
        medium: "Community engagement zine project",
        description: "Lived-experience informed community zine project about neurodiversity and gender, collating qualitative research findings conducted through the University of Sydney Brain and Mind Centre in conjunction with headspace Camperdown. Recipient of the Future Me Fund from Wear it Purple Australia 2023.",
        links: [{ label: "About the project", url: "https://www.instagram.com/genderbility/" }]
      }
    ],
    photography: {
      title: "Photography",
      description: "Portfolio: freelance photojournalist since 2017.",
      url: "https://lehanzzhang.wixsite.com/photography",
      linkLabel: "View the photography portfolio"
    },
    writing: {
      title: "Writing",
      description: "My blog. I write essays about technology, food, creativity, and everyday life.",
      url: "https://congeecosmicbinchicken.wordpress.com/",
      linkLabel: "Read the blog"
    }
  },

  experience: {
    work: [
      {
        org: "UNSW Resilient Democracy Lab",
        url: "https://resilientdemocracylab.org/",
        role: "Research Fellow",
        type: "full-time",
        dates: "Apr. 2023 – Aug. 2024",
        bullets: [
          "Conducting independent economics research and joint research with senior Lab fellows for publication",
          "Prepare replication reports for Institute for Replication (I4R) meta-analysis on terrorism and politics papers",
          "Administrative tasks including maintaining the Lab website and organizing research workshops"
        ]
      },
      {
        org: "UNSW School of Economics",
        role: "Research Assistant",
        type: null,
        dates: "Oct. 2020 – Apr. 2024",
        bullets: [
          "Undergraduate Research Fellow of the UNSW [Resilient Democracy Lab](https://resilientdemocracylab.org/): building the lab website and summarizing research for showcase on the website",
          "RA work for Prof. Pauline Grosjean on data visualization, textual analysis, and data cleaning for various projects, including [Grosjean, Masera, and Yousaf (2023), *QJE*](https://academic.oup.com/qje/article/138/1/413/6710386) and [*Patriarcapitalisme* (2021)](https://www.seuil.com/ouvrage/patriarcapitalisme-pauline-grosjean/9782021479867)",
          "RA work for A.Prof. Jane Zhang: writing ethics applications, conducting literature review, co-designing an experiment on mental health and technology, building the experimental treatment mobile application and Qualtrics survey, managing logistics of pilot implementation"
        ]
      },
      {
        org: "Lehan Zhang Photography",
        url: "https://lehanzzhang.wixsite.com/photography",
        role: "Freelance Photographer, Photojournalist",
        type: null,
        dates: "Jan. 2017 – present",
        bullets: [
          "Provide reportage photography services to private and corporate clients including MigrArt, 4A Centre for Contemporary Asian Art, Belvoir Street Theatre, UNSW Sydney, Gonski Institute, OutInCanberra, Region Canberra",
          "Managing editor of Australian and Swiss music and entertainment media publication [*Music Beyond Headlines*](https://www.facebook.com/MusicBeyondHeadlines/), coordinating a team of 10+ photographers and writers across Australia to produce industry-standard content",
          "Contributing music photographer to publications and venues including Roundhouse UNSW, FBi Radio, AAA-Backstage",
          "Portrait and fashion photography published in magazines including Picton Magazine, Sheeba Magazine, Leiden",
          "1 of 11 chosen from over 1300 applicants for a 6-month photography mentorship with Canon Australia in their inaugural Red Straps youth mentoring program in 2019"
        ]
      },
      {
        org: "headspace Australia",
        role: "Youth National Reference Group Member",
        type: null,
        dates: "May 2021 – Jul. 2023",
        bullets: [
          "Selected to advise on national public engagement, media and brand strategy and development, governance, and risk and assurance for the National Youth Mental Health Foundation, established by the Australian Government",
          "Attended the International Association of Youth Mental Health (IAYMH) conference in Copenhagen, Denmark 2022. Awarded financial bursary from IAYMH to attend.",
          "Public advocacy media features on cultural identity and mental health in an [*Australia-wide campaign*](https://headspace.org.au/our-impact/campaigns/cultural-identity/), invited speaker on [*SBS Insight*](https://www.sbs.com.au/ondemand/news-series/insight/insight-2023/insight-s2023-ep16/2206880323958), a current affairs TV program, and SBS news articles ([*web*](https://www.sbs.com.au/news/article/lehans-mental-health-suffered-during-covid-19-lockdown-its-a-struggle-many-young-people-shared/uqcj8puiv), radio, and TV)",
          "Drafted submissions to the Australian Government Senate inquiry on ADHD and the National Mental Health Commission",
          "Consultant on [*Digital Safety in the Metaverse*](https://www.projectrockit.com.au/blog/our-metaverse/) with Meta and Project Rockit"
        ]
      },
      {
        org: "Quantium",
        role: "Graduate Data Analyst",
        type: "full-time",
        dates: "Feb. 2023 – Apr. 2023",
        bullets: [
          "Data analyst in the data management team of global data science and AI company utilizing SQL and Python to maintain database and draw business insights from Woolworths Group data",
          "Resigned to focus on pursuing career as an academic economist and to undertake pre-doc Research Fellow role full-time"
        ]
      },
      {
        org: "New South Wales Ageing and Disability Commission",
        role: "Project Officer Intern",
        type: "part-time",
        dates: "Jan. 2021 – May 2021",
        bullets: [
          "Internship placement within the Strategy and Communications team",
          "Projects: setting up SQL database infrastructure, data analytics and communication to create marketing and quantitative collateral for external stakeholders, develop project briefs for multicultural community engagement and promotion of the rights of older people and adults with disability"
        ]
      },
      {
        org: "Toyota Finance Australia",
        role: "Data Science Intern",
        type: "full-time",
        dates: "Jun. 2020 – Dec. 2020",
        bullets: [
          "UNSW Co-op Scholarship sponsored industry placement within the Data Science and Risk Management team",
          "Projects: predictive modeling in R and PowerBI to monitor customer retention trends, designed and built a competitor pricing engine using webscraping in Python for KINTO car rental service"
        ]
      },
      {
        org: "UNSW Founders",
        role: "Program Coordinator",
        type: "part-time",
        dates: "Jul. 2019 – Mar. 2022",
        bullets: [
          "Developed, designed, and delivered entrepreneurial programs to UNSW students, staff, and alumni",
          "Managed the Higher-Degree Research Program supporting graduate research students commercialize their research innovations (2022), and the New Wave Program for promoting female engagement in entrepreneurship and within the startup space (2019)",
          "Developed an effective marketing strategy to recruit female participation in the New Wave program, resulting in the largest cohort since program inception",
          "Facilitate and teach design thinking, rapid prototyping, and lean canvas workshops"
        ]
      }
    ],

    teaching: [
      {
        institution: "ETH Zurich",
        role: "Teaching Assistant",
        courses: [{ name: "Methods IV: Statistical Learning", years: "2025" }]
      },
      {
        institution: "University of New South Wales",
        role: "Teaching Assistant",
        courses: [
          { name: "ECON5306/3106: Politics and Economics", years: "tutor-in-charge, 2022, 2023, 2024" },
          { name: "ECON2111: Developmental Economics", years: "2022, 2023" },
          { name: "ECON3124: Behavioural Economics", years: "2022" },
          { name: "ECON1401: Economic Perspectives", years: "2022, 2023" },
          { name: "ECON1202: Quantitative Analysis for Economics", years: "2023" },
          { name: "COMM5000: Data Literacy for Business", years: "2023" }
        ]
      }
    ],

    service: [
      "Organizer of the [Symposium in AI+Mindfulness 2025](https://lawecon.ethz.ch/conferences-workshops/ai-mindfulness-symposium.html)"
    ],

    awards: [
      { text: "Board Director of World Meditation Day Association", years: "2025 –" },
      { text: "Winner of the Australian Financial Review/Gradconnection Top100 Future Leaders Award for the AECOM Mechanical and Electrical Engineering Award", years: "2020" },
      { text: "Board Director of Arc@UNSW and Chair of Nominations and Remunerations Subcommittee, the not-for-profit overarching organization for student experience and support services at UNSW", years: "2019 – 2021" },
      { text: "Undergraduate representative on the Faculty of Science Equity, Diversity, and Inclusion working group", years: "2019 – 2022" },
      { text: "Student representative on the UNSW Centre for Ideas advisory committee", years: "2020 – 2022" },
      { text: "Youth advisory group member for headspace Camperdown", years: "2019 – 2023" },
      { text: "Football Coach of the Randwick City Football Club's not-for-profit Purple Hearts all-abilities squads", years: "2019 – 2020" },
      { text: "Women's Premier League (WPL) football player, Australian Capital Territory", years: "2015 – 2017 seasons" }
    ],

    skills: [
      { label: "Programming languages", items: ["Python", "Stata", "R", "SQL", "C"] },
      { label: "Certifications", items: ["Standard Mental Health First Aid Certificate Australia (issued 2019)"] }
    ]
  },

  // Wording used on the slides of the PowerPoint and Overleaf versions.
  slides: {
    upcoming: "upcoming",
    teachingTitle: "Teaching and service",
    awardsTitle: "Awards and extracurriculars",
    performancesTitle: "Performances",   // the two groups on the Art slide
    projectsTitle: "Art Projects",
    endTitle: "Thank you",
    endLinks: { classic: "Classic website", scholar: "Google Scholar", cv: "CV", photography: "Photography", blog: "Blog" },
    // Speaker notes under the first slide in PowerPoint.
    homeNotes: "Welcome! Press From Beginning (Slide Show tab) to present, or pick any slide to look around."
  }
};
