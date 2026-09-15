# JepongDevxyz Portfolio

A lightweight, cinematic portfolio for **Jepong Devxyz**. The interaction language is inspired by the feeling of MengTo's Kage project—full-screen chapters, editorial type, layered depth, and scroll-driven transitions—but this repository uses original code, branding, layout decisions, and visuals. It does not copy Kage source code or artwork.

## Current content

The first version intentionally ships with ten **PROJECT PLACEHOLDER** chapters. Project names, descriptions, GitHub URLs, and live URLs will be added only after they are confirmed as official.

## Performance approach

- Semantic DOM content is always readable, with or without WebGL.
- A dependency-free WebGL background is enabled only when device capability allows it.
- Low-memory, low-core, WebGL-disabled, and reduced-motion environments use the lightweight CSS fallback.
- Device pixel ratio is capped and rendering resolution can degrade when frame times become expensive.
- Native scrolling remains the source of truth; there is no scroll-jacking.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Verify before publishing

```bash
npm run verify
```

This runs syntax checks, static contract checks, and the Node test suite.

## Structure

- `index.html` — semantic shell and intro chapter
- `styles.css` — cinematic layout, responsive rules, reduced-motion/fallback styles
- `projects.js` — placeholder project data source
- `app.js` — chapter rendering, navigation, and scroll choreography
- `scene.js` — optional adaptive WebGL background
- `tests/` — source and behavior contracts
- `docs/superpowers/` — approved design spec and implementation plan
