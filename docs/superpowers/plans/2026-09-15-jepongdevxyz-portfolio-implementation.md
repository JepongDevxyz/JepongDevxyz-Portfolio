# Jepong Devxyz Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an original Jepong Devxyz cinematic portfolio inspired by Kage's scroll-driven interaction language, using placeholder project content and adaptive rendering that remains smooth from low-end phones to high-end desktops.

**Architecture:** Use semantic HTML as the permanent content layer, CSS for responsive/editorial presentation, and small vanilla JavaScript modules for project data, chapter state, capability detection, and optional WebGL visuals. The visual scene is progressive enhancement only: content and navigation must remain complete when WebGL is unavailable, reduced motion is requested, or scene initialization fails.

**Tech Stack:** HTML5, CSS3, modern vanilla JavaScript ES modules, Three.js, Vitest for unit tests, Playwright for browser checks, and Vite for local build/preview.

**Spec:** `docs/superpowers/specs/2026-09-15-jepongdevxyz-portfolio-design.md`

## Global Constraints

- Brand is **Jepong Devxyz**.
- Project chapters 01–10 remain placeholders until official project names and links are supplied by the user.
- Do not copy Kage source code, artwork, temple scene, or proprietary assets.
- Native document scrolling remains the source of truth; no scroll-jacking.
- WebGL must be optional and must never block readable content.
- `prefers-reduced-motion: reduce` must remove camera travel and decorative looping motion.
- Null project URLs must render visibly disabled controls and never navigate to `#`.
- Clamp device pixel ratio and dynamically reduce visual quality when frame time degrades.
- No heavy framework, CMS, authentication, analytics, backend contact form, user accounts, or heavy 3D models in v1.
- First readable paint must not wait for WebGL.
- Layout must remain usable down to 320px width.

---

## File Structure

- `index.html` — semantic page shell, intro, chapter mount point, navigation, fallback content.
- `src/projects.js` — placeholder project data and validation helpers.
- `src/app.js` — app bootstrap, chapter observer, navigation state, progressive enhancement orchestration.
- `src/performance.js` — capability detection, quality tier selection, frame-time adaptation, visibility pause rules.
- `src/scene.js` — optional Three.js scene lifecycle and scroll-state rendering.
- `src/styles.css` — design tokens, typography, cinematic layout, responsive rules, reduced-motion/fallback states.
- `tests/projects.test.js` — project schema/null-link tests.
- `tests/performance.test.js` — deterministic quality-tier tests.
- `tests/app.test.js` — chapter-state helpers and disabled-link behavior.
- `tests/browser/portfolio.spec.js` — Playwright navigation, mobile, reduced-motion, and fallback verification.
- `public/assets/` — original Jepong Devxyz branding and optimized scene assets only.
- `vite.config.js` — static build configuration.
- `package.json` — scripts and pinned dependencies.
- `README.md` — setup, architecture, performance strategy, and placeholder-link policy.

---

### Task 1: Bootstrap the static portfolio and placeholder data

**Files:** Create `package.json`, `vite.config.js`, `index.html`, `src/projects.js`, `src/styles.css`, and `tests/projects.test.js`.

**Interfaces:** Produces `PROJECTS: Project[]` and `getProjectById(id: string): Project | null`. Project shape is `{ id, title, subtitle, description, category, tech, status, image, githubUrl, liveUrl, featured }`.

- [ ] **Step 1: Write the failing project-data tests**

```js
import { describe, expect, it } from 'vitest';
import { PROJECTS, getProjectById } from '../src/projects.js';

describe('placeholder project data', () => {
  it('contains exactly ten placeholder projects', () => {
    expect(PROJECTS).toHaveLength(10);
    expect(PROJECTS.every(p => p.title === 'PROJECT PLACEHOLDER')).toBe(true);
  });

  it('keeps official URLs empty until supplied by the user', () => {
    expect(PROJECTS.every(p => p.githubUrl === null && p.liveUrl === null)).toBe(true);
  });

  it('looks projects up by id', () => {
    expect(getProjectById('01')?.id).toBe('01');
    expect(getProjectById('99')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npm test -- tests/projects.test.js`
Expected: FAIL because `src/projects.js` does not exist yet.

- [ ] **Step 3: Implement the project model and ten placeholders**

```js
export const PROJECTS = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1).padStart(2, '0'),
  title: 'PROJECT PLACEHOLDER',
  subtitle: 'COMING SOON',
  description: 'Project details will be added soon.',
  category: 'CATEGORY',
  tech: ['TECH'],
  status: 'STATUS',
  image: null,
  githubUrl: null,
  liveUrl: null,
  featured: false,
}));

export function getProjectById(id) {
  return PROJECTS.find(project => project.id === id) ?? null;
}
```

Create a semantic `index.html` with `00 — PROJECT ARCHIVE`, a navigation region, and a `<main id="project-archive">` mount point. Add only minimal base CSS needed for readable dark content before JavaScript runs.

- [ ] **Step 4: Run unit tests and a production build**

Run: `npm test -- tests/projects.test.js && npm run build`
Expected: PASS and Vite emits `dist/` without errors.

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.js index.html src/projects.js src/styles.css tests/projects.test.js
git commit -m "feat: bootstrap cinematic portfolio placeholders"
```

---

### Task 2: Render cinematic chapters and safe disabled controls

**Files:** Create `src/app.js`, modify `index.html` and `src/styles.css`, create `tests/app.test.js`.

**Interfaces:** Consumes `PROJECTS`. Produces `renderProjectChapter(project): HTMLElement` and `resolveProjectLink(url): { enabled: boolean, href: string | null }`.

- [ ] **Step 1: Write failing tests for disabled links and chapter markup**

```js
import { describe, expect, it } from 'vitest';
import { resolveProjectLink } from '../src/app.js';

describe('project links', () => {
  it('disables null links', () => {
    expect(resolveProjectLink(null)).toEqual({ enabled: false, href: null });
  });

  it('allows https links', () => {
    expect(resolveProjectLink('https://example.com')).toEqual({ enabled: true, href: 'https://example.com' });
  });
});
```

- [ ] **Step 2: Verify the test fails**

Run: `npm test -- tests/app.test.js`
Expected: FAIL because `src/app.js` does not exist.

- [ ] **Step 3: Implement chapter rendering and the Kage-inspired editorial layout**

Each section must render its numeric chapter marker, title, subtitle, placeholder description, tags, and disabled controls with `aria-disabled="true"` when URLs are null. Use asymmetrical full-screen composition, `clamp()` typography, safe-area padding, and transform/opacity-only reveal classes.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.html src/app.js src/styles.css tests/app.test.js
git commit -m "feat: render cinematic project chapters"
```

---

### Task 3: Add chapter-aware native scrolling and navigation

**Files:** Modify `src/app.js`, `src/styles.css`, and `tests/app.test.js`.

**Interfaces:** Produces `getActiveChapter(entries): string | null` and `setActiveChapter(id: string): void`.

- [ ] **Step 1: Add failing state-selection tests**

```js
import { expect, it } from 'vitest';
import { getActiveChapter } from '../src/app.js';

it('chooses the most visible chapter', () => {
  const entries = [
    { target: { dataset: { chapter: '01' } }, intersectionRatio: 0.25 },
    { target: { dataset: { chapter: '02' } }, intersectionRatio: 0.7 },
  ];
  expect(getActiveChapter(entries)).toBe('02');
});
```

- [ ] **Step 2: Verify failure, then implement using `IntersectionObserver`**

Use native scrolling, update `aria-current`, and keep reverse scrolling symmetrical. Do not call `preventDefault()` for wheel/touch navigation.

- [ ] **Step 3: Verify unit tests and build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app.js src/styles.css tests/app.test.js
git commit -m "feat: add native scroll chapter navigation"
```

---

### Task 4: Build deterministic adaptive-performance tiers

**Files:** Create `src/performance.js`, `tests/performance.test.js`, modify `src/app.js`.

**Interfaces:** Produces `selectQualityTier(capabilities): 'high' | 'medium' | 'low'` and `createFrameBudgetController(options)`.

- [ ] **Step 1: Write failing quality-tier tests**

```js
import { describe, expect, it } from 'vitest';
import { selectQualityTier } from '../src/performance.js';

describe('quality selection', () => {
  it('uses low mode for reduced motion', () => {
    expect(selectQualityTier({ reducedMotion: true, webgl: true, memory: 8, cores: 8 })).toBe('low');
  });

  it('uses low mode without WebGL', () => {
    expect(selectQualityTier({ reducedMotion: false, webgl: false, memory: 8, cores: 8 })).toBe('low');
  });

  it('uses high mode only on capable devices', () => {
    expect(selectQualityTier({ reducedMotion: false, webgl: true, memory: 8, cores: 8 })).toBe('high');
  });
});
```

- [ ] **Step 2: Verify failure, implement tier selection and DPR caps**

Required caps: high max DPR `1.75`, medium `1.35`, low `1.0`. Use conservative defaults when `navigator.deviceMemory` or `hardwareConcurrency` is absent.

- [ ] **Step 3: Add frame-time degradation**

The controller must downgrade quality after sustained slow frames rather than oscillating every frame. Pause sampling when `document.hidden` is true.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/performance.js src/app.js tests/performance.test.js
git commit -m "feat: add adaptive rendering quality"
```

---

### Task 5: Add the optional persistent WebGL scene

**Files:** Create `src/scene.js`, modify `src/app.js`, `src/styles.css`, and `package.json`.

**Interfaces:** Consumes quality tier and active chapter progress. Produces `createScene({ canvas, tier }): { setProgress(number), setChapter(string), resize(), pause(), resume(), destroy() } | null`.

- [ ] **Step 1: Add Three.js as a pinned dependency and implement failure-safe scene creation**

`createScene()` must return `null` instead of throwing when WebGL initialization fails. Canvas must be `aria-hidden="true"` and `pointer-events: none`.

- [ ] **Step 2: Implement an original abstract scene**

Use procedural gradients/planes, fog, restrained particles, and subtle camera offsets. Do not reproduce Kage's temple, artwork, textures, or source structure. High tier may use ambient particles; medium reduces particles/material complexity; low does not initialize WebGL.

- [ ] **Step 3: Synchronize scene state to native document scroll**

Read section geometry in the animation loop or cached observer state, interpolate camera/composition parameters, and never mutate document scroll position.

- [ ] **Step 4: Add visibility and resize lifecycle handling**

Pause render work when hidden; debounce resize; clamp DPR using performance-tier values.

- [ ] **Step 5: Run all tests and build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/scene.js src/app.js src/styles.css
git commit -m "feat: add optional adaptive WebGL scene"
```

---

### Task 6: Complete mobile, fallback, reduced-motion, and accessibility behavior

**Files:** Modify `src/styles.css` and `src/app.js`, create `tests/browser/portfolio.spec.js`, modify `package.json`.

- [ ] **Step 1: Add Playwright browser tests**

```js
import { test, expect } from '@playwright/test';

test('renders all ten placeholders at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('/');
  await expect(page.locator('[data-chapter^="0"]')).toHaveCount(10);
  await expect(page.getByText('PROJECT PLACEHOLDER').first()).toBeVisible();
});

test('null project links are disabled', async ({ page }) => {
  await page.goto('/');
  const disabled = page.locator('[aria-disabled="true"]');
  await expect(disabled.first()).toBeVisible();
});
```

Add a reduced-motion browser context test and a WebGL-disabled/failure-mode test that still verifies readable content.

- [ ] **Step 2: Verify browser tests expose missing behavior**

Run: `npm run test:e2e`
Expected initially: at least one failure until responsive/reduced-motion behavior is completed.

- [ ] **Step 3: Implement responsive and accessibility fixes**

Use safe-area insets, minimum 44px touch targets, visible `:focus-visible`, sufficient contrast, no hover-only controls, `@media (prefers-reduced-motion: reduce)` rules, and decorative-layer suppression before shrinking readable text.

- [ ] **Step 4: Run unit, E2E, and production build**

Run: `npm test && npm run test:e2e && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/app.js src/styles.css tests/browser/portfolio.spec.js
git commit -m "test: verify mobile fallback and reduced motion"
```

---

### Task 7: Performance verification and polish

**Files:** Modify `src/performance.js`, `src/scene.js`, `src/styles.css`, create `README.md`.

- [ ] **Step 1: Run throttled browser verification**

Verify 320px, 390px, tablet, and desktop viewports; reduced motion; WebGL failure; hidden-tab pause; orientation changes; and slow-network first paint. Record console errors and layout shifts.

- [ ] **Step 2: Tune only measured bottlenecks**

Reduce particle count, renderer scale, alpha layers, or post-processing if frame times degrade. Never remove readable content or navigation to improve scores.

- [ ] **Step 3: Write README**

Document setup commands, file responsibilities, adaptive quality tiers, WebGL fallback, reduced-motion behavior, and the rule that official project/live links remain null until user-confirmed.

- [ ] **Step 4: Run final local verification**

Run: `npm ci && npm test && npm run test:e2e && npm run build`
Expected: all commands exit `0`, no runtime console errors in the tested browser paths.

- [ ] **Step 5: Commit**

```bash
git add src/performance.js src/scene.js src/styles.css README.md
git commit -m "docs: finalize portfolio performance strategy"
```

---

### Task 8: Whole-branch review and GitHub verification

**Files:** Review all changed files; modify only files required to fix verified findings.

- [ ] **Step 1: Review the complete branch against the approved spec**

Check that all ten projects remain placeholders, all URL fields remain null, native scrolling remains intact, WebGL is optional, and Kage code/assets were not copied.

- [ ] **Step 2: Run the complete verification suite from a clean install**

Run: `rm -rf node_modules dist && npm ci && npm test && npm run test:e2e && npm run build`
Expected: all commands PASS.

- [ ] **Step 3: Verify production preview**

Run: `npm run preview -- --host 0.0.0.0`
Verify desktop/mobile rendering, chapter navigation, fallback mode, reduced motion, no console errors, and no broken/active placeholder links.

- [ ] **Step 4: Push the isolated implementation branch and inspect GitHub Actions**

Do not merge to `main` until the branch tests and any configured GitHub Actions checks are green.

- [ ] **Step 5: Final commit only if review fixes were required**

```bash
git add -A
git commit -m "fix: address final portfolio verification findings"
```

## Self-Review Result

- Spec coverage: all visual, content, progressive-enhancement, reduced-motion, responsive, accessibility, and performance requirements are mapped to tasks.
- Placeholder scan: no implementation requirement is left as TBD/TODO; the only intentional placeholder state is the user-approved project content itself.
- Interface consistency: project model, quality-tier API, chapter state, and scene lifecycle names are consistent across tasks.
