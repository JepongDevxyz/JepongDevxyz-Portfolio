# Portfolio Performance Loading Design

## Goal
Add three performance-oriented UX features to the Jepong Devxyz portfolio without introducing offline mode or a framework: skeleton loading, browser/Vercel caching for static assets, and optimistic/progressive rendering of content before heavier visuals.

## Scope

### Skeleton Loader
- Show a lightweight skeleton immediately on first paint for project title, visual block, metadata, and actions.
- Skeleton geometry must closely match the final layout to avoid layout shifts.
- Skeletons must be decorative only and ignored by assistive technology.
- Skeleton animation must respect `prefers-reduced-motion`.
- Skeleton removal must be progressive and must never hide readable content after a failure.

### Caching
- No Service Worker and no offline mode.
- Use HTTP cache headers suitable for Vercel/static hosting.
- HTML must remain revalidatable so new deployments appear promptly.
- Versioned/static JS and CSS may use longer browser caching with revalidation-safe behavior.
- Do not cache user data because the portfolio currently has none.

### Optimistic / Progressive Rendering
- Render project text, navigation, links, and layout immediately from local `projects.js`.
- Do not block first useful paint on WebGL scene creation.
- Heavy visuals and future images load after core content is present.
- If WebGL or an image fails, the readable portfolio remains fully usable and skeleton state resolves cleanly.

## Architecture
Keep the existing vanilla HTML/CSS/ES-module architecture. `app.js` remains responsible for rendering and progressive readiness state. CSS owns skeleton presentation and transitions. `vercel.json` defines cache headers. The optional scene remains dynamically imported and cannot block content readiness.

## Readiness Model
Use root CSS classes/data attributes to represent phases:
- initial: skeleton shell visible
- `content-ready`: project/navigation markup is rendered and readable
- `visuals-ready`: optional scene and visual enhancements have either loaded or settled into fallback

Skeletons should disappear as soon as the corresponding real content is ready, not after every optional visual finishes.

## Error Handling
- Dynamic scene import failure activates the existing fallback classes and must also settle visual readiness.
- Future image loading failures must remove their skeleton and show the existing visual fallback rather than leaving a permanent loading state.
- No loading state may block navigation or scrolling.

## Performance Constraints
- No new runtime dependency or framework.
- No Service Worker.
- No horizontal overflow or overlap regressions.
- Preserve current reduced-motion and low-performance fallbacks.
- Keep current 10 placeholder project behavior and null-link handling unchanged.

## Verification
Automated checks must cover:
- skeleton markup/styles exist and are accessible/decorative
- content becomes readable before optional scene completion
- skeleton state clears on success and scene failure
- reduced-motion disables skeleton animation
- cache headers are defined as intended
- all existing viewport, overlap, side-scroll, WebGL fallback, unit, and browser tests remain green
- zero console/page errors in browser verification
