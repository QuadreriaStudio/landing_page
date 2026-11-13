# Quadreria Studio — website

A static site (plain HTML, CSS and JavaScript). There's no build step and nothing to install, so it runs on GitHub Pages as is.

```
index.html            Home
work.html             Work (Studio Concepts)
services.html         Services + FAQs
guides.html           Free guides (email → download)
about.html            About
contact.html          Contact
privacy-policy.html   Privacy Policy
404.html              Page-not-found
CNAME                 quadreria.studio (custom domain for GitHub Pages)
.nojekyll             tells GitHub Pages to serve files as they are
assets/
  css/style.css       all styling (colours + font sizes are at the top)
  js/main.js          all interactions (settings are at the very top)
  js/projects.js      ← your 5 projects: titles, text, images
  js/lenis.min.js     smooth scrolling (bundled, no CDN needed)
  fonts/              Higuen Serif + Glacial Indifference (web versions)
  brand/              logos, favicon
  guides/             the 5 guide PDFs + their cover images
  images/projects/    project-01 … project-05 (placeholders for now)
  images/menu/        the small image shown in the menu for each page
  images/about/       soft blurred image behind the About title
```

---

## 1. Put it on GitHub Pages

1. Create a new repository on GitHub (for example `quadreria-studio`).
2. Upload **everything inside this folder** to the repository root. Include `CNAME` and `.nojekyll`. Files starting with a dot can be hidden on your computer, so check that it's there.
3. In the repo, go to **Settings → Pages**. Under *Build and deployment*, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then **Save**.
4. Still in Settings → Pages, the custom domain should read `quadreria.studio` (it comes from the `CNAME` file). Tick **Enforce HTTPS** once it becomes available.

### Point the domain (Hostinger → DNS)
Add these records for `quadreria.studio`:

| Type  | Name | Value                    |
|-------|------|--------------------------|
| A     | @    | 185.199.108.153          |
| A     | @    | 185.199.109.153          |
| A     | @    | 185.199.110.153          |
| A     | @    | 185.199.111.153          |
| CNAME | www  | `<your-github-username>.github.io` |

Leave your Google Workspace **MX** records exactly as they are. Email keeps working because it uses MX records, not A records. DNS can take a few hours to update.

---

## 2. Replace the placeholder project images

Each project has its own folder: `assets/images/projects/project-01/` … `project-05/`.
Swap the images in place and **keep the same file names**:

| File | Shape | Where it shows |
|------|-------|----------------|
| `cover.jpg` | **square 1:1** (around 1400×1400) | Home carousel, Work list, first image in the opened project |
| `highlight.jpg` | wide 16:9 (around 2400×1350) | Home › Highlights |
| `gallery-01.jpg` … `gallery-05.jpg` | any ratio | the opened project gallery, in order |

To add or remove gallery images, edit the `gallery: [...]` list for that project in `assets/js/projects.js`.
Titles, category, year and description also live in `assets/js/projects.js`.

Tip: export JPGs at roughly 80% quality so each file stays under about 500 KB. That keeps the site fast.

The menu images (`assets/images/menu/home.jpg`, `work.jpg` …, portrait 4:5) and `assets/images/about/about-hero.jpg` are placeholders too. Replace them the same way.

---

## 3. Booking link

Every "Book a Discovery Call" button uses `bookingUrl` at the top of `assets/js/main.js`. Change it there once and every page updates.

---

## 4. Collecting guide emails (Google Sheet)

On the Guides page, the **Download** button only unlocks after a valid email is typed. To save those emails into a Google Sheet in your Workspace account:

1. Create a Google Sheet called *Guide downloads*. In row 1, type: `Timestamp | Email | Guide | Page`.
2. In the Sheet, open **Extensions → Apps Script**, delete what's there and paste:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const p = e.parameter;
  sheet.appendRow([new Date(), p.email || "", p.guide || "", p.page || ""]);
  return ContentService.createTextOutput("ok");
}
```

3. Click **Deploy → New deployment → Web app**. Set *Execute as*: **Me**, *Who has access*: **Anyone**, then **Deploy** and allow access.
4. Copy the Web app URL (it ends in `/exec`) and paste it into `assets/js/main.js`:

```js
guideFormEndpoint: "https://script.google.com/macros/s/XXXXXXXX/exec",
```

Until you do this, downloads still work; the emails just aren't saved anywhere.

---

## 5. Small settings you can change

At the top of `assets/js/main.js`:
- `bg.speed`: how fast the liquid background moves
- `bg.grain`: strength of the grain
- `bg.glow`: how dark the glow that follows the cursor is (0 turns it off)

At the top of `assets/css/style.css`:
- colours (`--bg`, `--text`, `--white`)
- heading and body sizes (`--h1`, `--h2`, `--h3`, `--body`)

---

## Preview on your computer

Double-clicking `index.html` works for a quick look. For an exact preview, open the folder in VS Code and use the "Live Server" extension, or run `python -m http.server` inside the folder and visit http://localhost:8000.
