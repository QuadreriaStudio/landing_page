/* =========================================================
   QUADRERIA STUDIO — PROJECTS
   ---------------------------------------------------------
   This one list feeds the Home carousel, the Highlights,
   the Work page and the project gallery that opens on click.

   To update a project:
   1. Put your images in  assets/images/projects/project-0X/
       - cover.jpg      → square (1:1), used in the carousel + Work list
      - highlight.jpg  → wide (16:9), used in Home › Highlights
      - gallery-01.jpg … → any ratio (or .mp4 for moving images), shown in the opened project
   2. Change the text below (title, category, year, description…).
   Keep the same file names and nothing else needs to change.
   ========================================================= */
window.QS_PROJECTS = [
  {
    id: "project-01",
    title: "Concept 01",
    category: "Streetwear",
    year: "2026",
    tags: "Concept · Moodboard · 3D Mockups",
    description: "Nullform is a contemporary streetwear label rooted in absence, structure and a fluid sense of form. It explores the space between presence and absence - where form is not fixed, but constantly shifting, through minimal design, functional silhouettes and graphic systems that reflect movement, distortion and states of transition.",
    // deliverables: "Moodboard, colour palette, 3D mockups",
    folder: "assets/images/projects/project-01/",
    gallery: ["gallery-01.mp4", "gallery-02.jpg", "gallery-03.jpg", "gallery-04.jpg", "gallery-05.jpg", "gallery-06.jpg", "gallery-07.jpg"]
  },
  {
    id: "project-02",
    title: "Concept 02",
    category: "Contemporary",
    year: "2026",
    tags: "Concept · Moodboard · 3D Mockups",
    description: "MARGIN KIDS is a premium womenswear label that celebrates the space between work and personal life, creating clothing for women who work from home but never compromise on style.The Monday–Friday collection translates the rhythm of the working week into five relaxed, contemporary looks, balancing the comfort of loungewear with the understated appeal of premium streetwear.",
    // deliverables: "Moodboard, colour palette, 3D mockups",
    folder: "assets/images/projects/project-02/",
    gallery: ["gallery-01.mp4", "gallery-02.jpg", "gallery-03.jpg", "gallery-04.jpg", "gallery-05.jpg", "gallery-06.jpg", "gallery-07.jpg"]
  },
  // {
  //   id: "project-03",
  //   title: "Concept 03",
  //   category: "Contemporary Wear",
  //   year: "2026",
  //   tags: "Concept · Moodboard · 3D Mockups",
  //   description: "Placeholder — add the story of this concept collection here: the founder idea it answers, the mood, and how colour, form and detail came together.",
  //   deliverables: "Moodboard, colour palette, 3D mockups",
  //   folder: "assets/images/projects/project-03/",
  //   gallery: ["gallery-01.png", "gallery-02.png", "gallery-03.png", "gallery-04.png", "gallery-05.png"]
  // },
  // {
  //   id: "project-04",
  //   title: "Concept 04",
  //   category: "Streetwear",
  //   year: "2026",
  //   tags: "Concept · Moodboard · 3D Mockups",
  //   description: "Placeholder — add the story of this concept collection here: the founder idea it answers, the mood, and how colour, form and detail came together.",
  //   deliverables: "Moodboard, colour palette, 3D mockups",
  //   folder: "assets/images/projects/project-04/",
  //   gallery: ["gallery-01.png", "gallery-02.png", "gallery-03.png", "gallery-04.png", "gallery-05.png"]
  // },
  // {
  //   id: "project-05",
  //   title: "Concept 05",
  //   category: "Minimal Premium T-Shirts",
  //   year: "2026",
  //   tags: "Concept · Moodboard · 3D Mockups",
  //   description: "Placeholder — add the story of this concept collection here: the founder idea it answers, the mood, and how colour, form and detail came together.",
  //   deliverables: "Moodboard, colour palette, 3D mockups",
  //   folder: "assets/images/projects/project-05/",
  //   gallery: ["gallery-01.png", "gallery-02.png", "gallery-03.png", "gallery-04.png", "gallery-05.png"]
  // }
];
