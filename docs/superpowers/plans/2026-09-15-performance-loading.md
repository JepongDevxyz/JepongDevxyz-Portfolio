# Portfolio Performance Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add skeleton loading, non-offline static asset caching, and optimistic/progressive rendering to the existing vanilla portfolio without breaking responsive behavior or fallbacks.

**Architecture:** Keep the current HTML/CSS/ES-module structure. Add a root readiness state in `app.js`, skeleton presentation in CSS, cache headers in `vercel.json`, and browser tests that prove core content appears before optional visuals settle. WebGL remains optional and dynamically imported.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node test runner, Playwright, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-09-15-performance-loading-design.md`

## Global Constraints
- No Service Worker or offline mode.
- No new runtime dependencies or frontend framework.
- Preserve 10 placeholder projects and null-link behavior.
- Preserve reduced-motion, WebGL fallback, mobile side-scroll prevention, and responsive no-overlap behavior.
- Core text/navigation must not wait for WebGL.
- Skeletons must be decorative and reduced-motion safe.

---

### Task 1: Add regression tests for readiness and skeleton behavior

**Files:**
- Create: `tests/loading-contract.test.js`
- Modify: `scripts/browser-verify.mjs`

**Interfaces:**
- Consumes: current `app.js`, `index.html`, `styles.css`
- Produces: browser assertions for `content-ready` and `visuals-ready` root classes and skeleton lifecycle

- [ ] **Step 1: Write the failing static contract test**

Create `tests/loading-contract.test.js` that reads `app.js`, `index.html`, and `styles.css` and asserts the intended readiness classes, skeleton selectors, reduced-motion rule, and non-blocking scene import contract are present.

- [ ] **Step 2: Run the focused test to verify RED**

Run: `node --test tests/loading-contract.test.js`
Expected: FAIL because readiness/skeleton implementation is not present yet.

- [ ] **Step 3: Extend browser verification with loading-state assertions**

In `scripts/browser-verify.mjs`, add checks that:
- the page starts with skeleton/loading state available before app readiness settles
- project text becomes present and readable with `content-ready`
- `visuals-ready` eventually appears on normal load
- forced WebGL failure still reaches `visuals-ready` via fallback
- no permanent skeleton remains after settlement

- [ ] **Step 4: Run browser verification to confirm RED**

Run: `npm run verify:browser`
Expected: FAIL on readiness/skeleton assertions before implementation.

- [ ] **Step 5: Commit tests**

Commit message: `test: define loading and optimistic rendering contracts`

---

### Task 2: Implement skeleton loader and optimistic core rendering

**Files:**
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Produces: root classes `content-ready` and `visuals-ready`
- Produces: skeleton elements/selectors that are `aria-hidden="true"`
- Consumes: existing `PROJECTS`, `projectSection()`, dynamic `scene.js` import

- [ ] **Step 1: Add minimal skeleton shell to initial HTML**

Add a decorative skeleton container inside the project host or adjacent initial shell. It must mirror title/visual/meta/action geometry enough to prevent a large layout jump and use `aria-hidden="true"`.

- [ ] **Step 2: Render core project/navigation content immediately and mark `content-ready`**

After synchronous `renderProjects()` and `renderNavigation()`, add `root.classList.add('content-ready')`. Do not wait for `scene.js`.

- [ ] **Step 3: Settle visual readiness on both scene success and failure**

In both dynamic import branches, add `root.classList.add('visuals-ready')` after scene creation/start or fallback activation. Ensure no thrown optional-scene error leaves the skeleton active.

- [ ] **Step 4: Add skeleton CSS and progressive fade**

Add shimmer/pulse skeleton styling, then hide/fade it when `.content-ready` or `.visuals-ready` is reached depending on the skeleton element. Keep real content interactive throughout.

- [ ] **Step 5: Respect reduced motion**

Inside existing reduced-motion media rules, disable skeleton animation and use an immediate/static transition.

- [ ] **Step 6: Run focused and full tests**

Run: `node --test tests/loading-contract.test.js`
Expected: PASS.

Run: `npm run verify`
Expected: all static/unit tests PASS.

Run: `npm run verify:browser`
Expected: loading lifecycle, existing viewport/no-overlap/side-scroll, reduced-motion, and WebGL fallback checks PASS.

- [ ] **Step 7: Commit implementation**

Commit message: `feat: add progressive skeleton loading`

---

### Task 3: Add static caching headers without offline behavior

**Files:**
- Create: `vercel.json`
- Modify: `tests/loading-contract.test.js`

**Interfaces:**
- Produces: Vercel header rules for HTML and static assets
- Does not produce: Service Worker, Cache Storage, offline fallback

- [ ] **Step 1: Extend test with cache configuration assertions**

Assert `vercel.json` exists and contains explicit `Cache-Control` rules where HTML is revalidated and static CSS/JS/assets receive browser caching suitable for repeat visits without offline persistence.

- [ ] **Step 2: Run focused test to verify RED**

Run: `node --test tests/loading-contract.test.js`
Expected: FAIL because `vercel.json` does not exist yet.

- [ ] **Step 3: Add `vercel.json` cache headers**

Use explicit header rules such as:
- `/` and `/*.html`: `public, max-age=0, must-revalidate`
- `/*.css`, `/*.js`: `public, max-age=3600, stale-while-revalidate=86400`
- future image/font asset patterns: longer browser cache with stale-while-revalidate

Do not add a Service Worker or offline rewrite.

- [ ] **Step 4: Run focused and full verification**

Run: `node --test tests/loading-contract.test.js`
Expected: PASS.

Run: `npm run verify`
Expected: PASS.

Run: `npm run verify:browser`
Expected: PASS.

- [ ] **Step 5: Commit caching configuration**

Commit message: `perf: add revalidating static cache headers`

---

### Task 4: Final verification and branch readiness

**Files:**
- Review only; no unrelated refactor

**Interfaces:**
- Consumes: Tasks 1–3 outputs
- Produces: verified feature branch ready for user review before merge

- [ ] **Step 1: Run complete CI-equivalent verification**

Run: `npm run verify && npm run verify:browser`
Expected: all tests PASS with zero console/page errors.

- [ ] **Step 2: Verify responsive regression matrix**

Confirm browser verification covers 320×640, 360×800, 390×844, 844×390, 768×1024, 1024×768, 1366×768, 1440×900, and 1920×1080 with no overlap or horizontal overflow.

- [ ] **Step 3: Verify fallback behavior**

Confirm reduced-motion and forced WebGL failure both leave readable content visible and clear loading state.

- [ ] **Step 4: Compare branch against `main`**

Review changed files and ensure only loading/performance docs, tests, app/CSS/HTML, and `vercel.json` changed.

- [ ] **Step 5: Report exact results**

Report commit SHA(s), test counts/results, browser matrix result, and any Vercel deployment limitation separately. Do not merge to `main` without explicit user approval.
