import { spawn } from 'node:child_process';
import process from 'node:process';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
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

  const counts = await page.evaluate(() => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const allElements = [...document.querySelectorAll('body *')];
    const round = (value) => Math.round(value * 10) / 10;

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
          .sort((a, b) => Math.max(b.right - window.innerWidth, -b.left) - Math.max(a.right - window.innerWidth, -a.left))
          .slice(0, 20)
      : [];

    const internalOverflows = overflow > 1
      ? allElements
          .map((element) => {
            const style = getComputedStyle(element);
            return {
              tag: element.tagName.toLowerCase(),
              id: element.id || '',
              className: typeof element.className === 'string' ? element.className : '',
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
              delta: element.scrollWidth - element.clientWidth,
              overflowX: style.overflowX,
              whiteSpace: style.whiteSpace,
              text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
            };
          })
          .filter((item) => item.delta > 1)
          .sort((a, b) => b.delta - a.delta)
          .slice(0, 20)
      : [];

    const textOffenders = [];
    if (overflow > 1) {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        if (rect.left < -1 || rect.right > window.innerWidth + 1) {
          textOffenders.push({
            text: node.textContent.trim().replace(/\s+/g, ' ').slice(0, 100),
            parent: node.parentElement?.tagName.toLowerCase() || '',
            className: node.parentElement?.className || '',
            left: round(rect.left),
            right: round(rect.right),
            width: round(rect.width),
          });
        }
        range.detach();
        if (textOffenders.length >= 20) break;
      }
    }

    return {
      projects: document.querySelectorAll('.chapter--project').length,
      placeholders: [...document.querySelectorAll('.project-title')].filter((node) => node.textContent?.trim() === 'PROJECT PLACEHOLDER').length,
      disabled: document.querySelectorAll('.project-action[aria-disabled="true"]').length,
      nav: document.querySelectorAll('#chapter-nav a').length,
      overflow,
      root: {
        innerWidth: window.innerWidth,
        htmlClientWidth: document.documentElement.clientWidth,
        htmlScrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
      },
      offenders,
      internalOverflows,
      textOffenders,
    };
  });

  assert(counts.projects === 10, `Expected 10 project chapters at ${width}x${height}, found ${counts.projects}.`);
  assert(counts.placeholders === 10, `Expected 10 placeholder titles at ${width}x${height}, found ${counts.placeholders}.`);
  assert(counts.disabled === 20, `Expected 20 disabled project actions at ${width}x${height}, found ${counts.disabled}.`);
  assert(counts.nav === 11, `Expected 11 chapter nav entries at ${width}x${height}, found ${counts.nav}.`);
  assert(counts.overflow <= 1, `Horizontal overflow detected at ${width}x${height}: ${counts.overflow}px. Root: ${JSON.stringify(counts.root)} Box offenders: ${JSON.stringify(counts.offenders)} Internal overflows: ${JSON.stringify(counts.internalOverflows)} Text offenders: ${JSON.stringify(counts.textOffenders)}`);
  assert(pageErrors.length === 0, `Page errors at ${width}x${height}: ${pageErrors.join(' | ')}`);
  assert(consoleErrors.length === 0, `Console errors at ${width}x${height}: ${consoleErrors.join(' | ')}`);

  await page.locator('#chapter-nav a[href="#chapter-03"]').click();
  await page.waitForTimeout(450);
  const navState = await page.getAttribute('#chapter-nav a[href="#chapter-03"]', 'aria-current');
  assert(navState === 'true', `Chapter 03 navigation did not become active at ${width}x${height}.`);

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

  for (const [width, height] of [[320, 640], [390, 844], [768, 1024], [844, 390], [1440, 900]]) {
    await verifyViewport(browser, width, height);
  }
  await verifyReducedMotion(browser);
  await verifyWebglFailure(browser);

  console.log('Browser verification passed: 5 viewport profiles, navigation, reduced motion, WebGL fallback, 0 console/page errors.');
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await sleep(100);
  if (!server.killed) server.kill('SIGKILL');
}
