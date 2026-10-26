# Saltlight Studio website (working name)

A single-page static website for a web design studio based on Koh Samui and in Bangkok.

Everything is in `index.html`. Fonts load from Google Fonts. There is no build step.

## Preview locally

Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Deploy

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root.
- **Netlify or Vercel:** import the repo with no build command and `/` as the publish directory.

## Placeholders to replace

- Agency name "Saltlight Studio", email, phone and addresses
- Package prices (฿35,000 / ฿85,000 / ฿4,500 per month)
- Portfolio projects (sample projects)
- The light-and-shadow panels (swap in real photography)
- The contact form, which isn't connected yet (use Formspree, Netlify Forms or similar)

## Alternative design

`index_notion.html` is a Notion-style version of the same site. Open it directly to compare, or rename it to `index.html` to make it the main page.
