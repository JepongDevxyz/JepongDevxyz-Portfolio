import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const VIEWPORTS = [
  [320, 640],
  [360, 800],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1366, 768],
  [1440, 900],
  [1920, 1080],
];

const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('Static server did not become ready.');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspectLayout(page) {
  return page.evaluate(() => {
    const round = (value) => Math.round(value * 10) / 10;
    const rectOf = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        selector,
        left: round(rect.left),
        top: round(rect.top),
        right: round(rect.right),
        bottom: round(rect.bottom),
        width: round(rect.width),
        height: round(rect.height),
      };
    };

    const intersects = (a, b, tolerance = 1) => {
      if (!a || !b) return false;
      return (
        a.left < b.right - tolerance
        && a.right > b.left + tolerance
        && a.top < b.bottom - tolerance
        && a.bottom > b.top + tolerance
      );
    };

    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const allElements = [...document.querySelectorAll('body *')];
    const offenders = overflow > 1
      ? allElements
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id || '',
              className: typeof element.className === 'string' ? element.className : '',
              left: round(rect.left),
              right: round(rect.right),
              width: round(rect.width),
            };
          })
          .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
          .slice(0, 20)
      : [];

    const chapter = rectOf('#chapter-01');
    const number = rectOf('#chapter-01 .project-number');
    const title = rectOf('#chapter-01 .project-title-wrap');
    const visual = rectOf('#chapter-01 .project-visual');
    const meta = rectOf('#chapter-01 .project-meta');
    const brand = rectOf('.brand');
    const readout = rectOf('.chapter-readout');

    const collisions = [];
    const pairs = [
      ['number/title', number, title],
      ['number/visual', number, visual],
      ['number/meta', number, meta],
      ['title/visual', title, visual],
      ['title/meta', title, meta],
      ['visual/meta', visual, meta],
      ['brand/title', brand, title],
      ['readout/title', readout, title],
    ];
    for (const [name, first, second] of pairs) {
      if (intersects(first, second)) collisions.push({ name, first, second });
    }

    return {
      projects: document.querySelectorAll('.chapter--project').length,
      placeholders: [...document.querySelectorAll('.project-title')]
        .filter((node) => node.textContent?.trim() === 'PROJECT PLACEHOLDER').length,
      disabled: document.querySelectorAll('.project-action[aria-disabled="true"]').length,
      nav: document.querySelectorAll('#chapter-nav a').length,
      overflow,
      offenders,
      chapter,
      collisions,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    };
  });
}

async function verifyViewport(browser, width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.chapter--project');
  await page.locator('#chapter-01').scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);

  const layout = await inspectLayout(page);

  assert(layout.projects === 10, `Expected 10 project chapters at ${width}x${height}, found ${layout.projects}.`);
  assert(layout.placeholders === 10, `Expected 10 placeholder titles at ${width}x${height}, found ${layout.placeholders}.`);
  assert(layout.disabled === 20, `Expected 20 disabled project actions at ${width}x${height}, found ${layout.disabled}.`);
  assert(layout.nav === 11, `Expected 11 chapter nav entries at ${width}x${height}, found ${layout.nav}.`);
  assert(layout.overflow <= 1, `Horizontal overflow at ${width}x${height}: ${layout.overflow}px. ${JSON.stringify(layout.offenders)}`);
  assert(layout.chapter && layout.chapter.height <= height + 1, `Chapter 01 is not fit-to-screen at ${width}x${height}: ${layout.chapter?.height}px tall for ${height}px viewport.`);
  assert(layout.collisions.length === 0, `Overlapping UI at ${width}x${height}: ${JSON.stringify(layout.collisions)}`);
  assert(pageErrors.length === 0, `Page errors at ${width}x${height}: ${pageErrors.join(' | ')}`);
  assert(consoleErrors.length === 0, `Console errors at ${width}x${height}: ${consoleErrors.join(' | ')}`);

  if (width > 980) {
    await page.locator('#chapter-nav a[href="#chapter-03"]').click();
  } else {
    await page.locator('#chapter-03').scrollIntoViewIfNeeded();
  }

  await page.waitForFunction(() => document.querySelector('#chapter-nav a[href="#chapter-03"]')?.getAttribute('aria-current') === 'true');
  const navState = await page.getAttribute('#chapter-nav a[href="#chapter-03"]', 'aria-current');
  assert(navState === 'true', `Chapter 03 did not become active at ${width}x${height}.`);

  const overflowAfterNavigation = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert(overflowAfterNavigation <= 1, `Horizontal overflow appeared after navigation at ${width}x${height}: ${overflowAfterNavigation}px.`);

  await context.close();
}

async function verifyReducedMotion(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const state = await page.evaluate(() => ({
    reduced: document.documentElement.classList.contains('is-reduced-motion'),
    low: document.documentElement.classList.contains('performance-low'),
    readable: Boolean(document.querySelector('.project-title')),
  }));
  assert(state.reduced, 'Reduced-motion class was not applied.');
  assert(state.low, 'Reduced-motion mode did not select the low-performance fallback.');
  assert(state.readable, 'Project content disappeared in reduced-motion mode.');
  await context.close();
}

async function verifyWebglFailure(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(type, ...args) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
      return original.call(this, type, ...args);
    };
  });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.chapter--project');
  const state = await page.evaluate(() => ({
    fallback: document.documentElement.classList.contains('scene-fallback'),
    projects: document.querySelectorAll('.chapter--project').length,
    readable: Boolean(document.querySelector('.project-description')),
  }));
  assert(state.fallback, 'WebGL failure did not activate the CSS fallback.');
  assert(state.projects === 10 && state.readable, 'WebGL failure broke readable project content.');
  await context.close();
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });

  for (const [width, height] of VIEWPORTS) {
    await verifyViewport(browser, width, height);
  }
  await verifyReducedMotion(browser);
  await verifyWebglFailure(browser);

  console.log(`Browser verification passed: ${VIEWPORTS.length} viewport profiles, fit-to-screen chapters, no overlap, navigation/scroll activation, reduced motion, WebGL fallback, 0 console/page errors.`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await sleep(100);
  if (!server.killed) server.kill('SIGKILL');
}
