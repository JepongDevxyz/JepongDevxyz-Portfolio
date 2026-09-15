# Jepong Devxyz Portfolio — Kage-Inspired Design

Date: 2026-09-15
Status: Approved by user for implementation

## Goal

Build a smooth, cinematic project portfolio inspired by the interaction language of MengTo/Kage while using original code, original branding, and placeholder project content until official project names and live links are provided.

The experience should feel like one continuous scroll-driven journey rather than a conventional grid of cards.

## Visual Direction

- Brand: **Jepong Devxyz**
- Dark, cinematic full-screen presentation.
- Large editorial typography layered over the scene.
- Project chapters replace Kage's story chapters.
- Project cards initially use placeholders only.
- Original visual assets only; no copying Kage artwork or source code.
- Subtle depth from foreground, midground, and background layers.
- Fine grain, vignette, glow, fog, and light effects only when performance budget allows.

## Placeholder Chapter Structure

- 00 — Intro / Project Archive
- 01 — Project Placeholder
- 02 — Project Placeholder
- 03 — Project Placeholder
- 04 — Project Placeholder
- 05 — Project Placeholder
- 06 — Project Placeholder
- 07 — Project Placeholder
- 08 — Project Placeholder
- 09 — Project Placeholder
- 10 — Project Placeholder

Each project chapter contains:

- Chapter number
- `PROJECT PLACEHOLDER`
- `COMING SOON`
- Short placeholder description
- Placeholder tags: `CATEGORY`, `TECH`, `STATUS`
- Disabled `VIEW PROJECT` / `LIVE LINK — TBD` control

Official names, descriptions, repository links, and live links will be filled in only after the user provides them.

## Interaction and Motion

The motion language should match the *feel* of Kage rather than reproduce its implementation.

- Native document scrolling remains the source of truth.
- A persistent visual scene reacts continuously to scroll progress.
- Each project chapter gets a defined camera/composition state.
- Text reveals use masks, opacity, blur, and vertical translation.
- Foreground layers use restrained parallax.
- Chapter transitions crossfade visual states instead of hard-cutting.
- Navigation updates based on the active project chapter.
- Scroll remains reversible: scrolling upward restores the previous state cleanly.
- No scroll-jacking that traps the user or breaks browser accessibility.

## Rendering Strategy

### High / capable devices

- WebGL/Three.js visual layer.
- Persistent scene with a lightweight procedural environment.
- Camera movement synchronized to chapter progress.
- Restrained post-processing only if frame-time headroom exists.
- Optional light particles / ambient motion.

### Mid-range devices

- WebGL stays enabled but with lower pixel ratio, reduced particles, simplified materials, and no expensive post-processing.

### Low-end / constrained devices

- DOM/CSS-first fallback with static or lightly animated scene plates.
- WebGL can be skipped completely when capability/performance checks fail.
- Preserve the same chapter typography, layout, and content hierarchy so the design remains recognizable.

### Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Disable camera travel and decorative looping motion.
- Remove blur-heavy transitions.
- Use short opacity transitions or static layouts.
- Keep navigation and project content fully functional.

## Performance Requirements

Primary success criterion: the portfolio must remain responsive on low-end and high-end phones, tablets, and desktops.

Performance controls:

- Clamp device pixel ratio; never render unrestricted DPR on high-density phones.
- Dynamically reduce render resolution when frame time degrades.
- Cap particle counts and alpha layers.
- Avoid large continuous CSS blur filters on mobile.
- Use transform/opacity for DOM animation.
- Pause visual work when the tab is hidden.
- Pause expensive effects when their section is far outside the viewport.
- Decode/lazy-load non-critical images.
- Prefer WebP/AVIF for visual assets.
- Keep JavaScript dependencies minimal.
- Do not require a heavy framework for the first version.

Target behavior:

- No input-blocking startup animation.
- Fast readable first paint before WebGL is ready.
- Stable page height and no unexpected layout shifts.
- Smooth scrolling even while scene assets are loading.
- Graceful degradation instead of blank/error states.

## Responsive Layout

### Desktop

- Full-screen scene.
- Large typography with asymmetrical editorial layout.
- Small persistent chapter/navigation UI around the edges.

### Mobile

- Same cinematic identity, not a separate generic mobile site.
- Typography scales with `clamp()`.
- Project copy uses safe-width text columns.
- Decorative content is reduced before readable content is reduced.
- No hover-only functionality.
- Controls respect touch target sizes and safe areas.

## Architecture

Keep the first version deliberately small and easy to host on Vercel/static hosting.

Suggested structure:

- `index.html` — semantic sections and project placeholders
- `styles.css` — visual system, layout, responsive states, reduced motion
- `app.js` — chapter state, scroll choreography, capability detection
- `scene.js` — isolated WebGL scene and renderer
- `projects.js` — placeholder project data, later replaced with official project metadata
- `assets/` — original optimized branding and scene imagery

The WebGL layer must be optional. The portfolio content must still work if `scene.js` fails or WebGL is unavailable.

## Data Model for Future Official Projects

Each project entry will support:

- `id`
- `title`
- `subtitle`
- `description`
- `category`
- `tech[]`
- `status`
- `image`
- `githubUrl`
- `liveUrl`
- `featured`

Until official details are supplied, URL fields remain null and buttons remain disabled.

## Error Handling

- If WebGL initialization fails, switch immediately to the CSS/static fallback.
- If a project image fails, show a branded neutral placeholder.
- Null links must never navigate to `#` accidentally; render them visibly disabled.
- JS errors in optional visual effects must not block project content.

## Accessibility

- Semantic sections/headings.
- Keyboard-accessible navigation.
- Visible focus states.
- Sufficient contrast.
- Reduced-motion support.
- Decorative canvas hidden from assistive technology.
- Text content exists in the DOM, never only inside WebGL.

## Testing / Verification

Before calling the portfolio complete:

1. Validate semantic HTML and console for runtime errors.
2. Verify all placeholder chapters and navigation states.
3. Verify WebGL path and fallback path separately.
4. Verify `prefers-reduced-motion` behavior.
5. Test common mobile widths down to 320px.
6. Test touch navigation and orientation changes.
7. Test with CPU/GPU throttling and reduced network conditions.
8. Confirm project content remains usable with JavaScript visual effects disabled/failing.
9. Run Lighthouse-style checks for performance, accessibility, and layout stability.
10. Only attach official project URLs after the user supplies and confirms them.

## Non-Goals for First Version

- CMS/backend.
- Authentication.
- Contact form backend.
- Analytics.
- User accounts.
- Heavy 3D models.
- Copying Kage's original imagery, temple scene, or implementation code.

## Acceptance Criteria

The first version is accepted when:

- It visually reads as a Jepong Devxyz portfolio with a Kage-like cinematic scroll language.
- All project entries are placeholders only.
- Scroll and transitions remain smooth on constrained/mobile devices through adaptive degradation.
- High-end devices receive enhanced visual depth without changing content or navigation.
- The experience remains fully readable and navigable without WebGL.
- Official project/live links are not invented or added before the user provides them.
