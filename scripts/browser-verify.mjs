import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const VIEWPORTS = [[320,640],[360,800],[390,844],[844,390],[768,1024],[1024,768],[1366,768],[1440,900],[1920,1080]];
const server = spawn('python3', ['-m','http.server',String(PORT),'--bind','127.0.0.1'], { stdio:['ignore','pipe','pipe'] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try { if ((await fetch(BASE)).ok) return; } catch {}
    await sleep(250);
  }
  throw new Error('Static server did not become ready.');
}

async function inspectLayout(page) {
  return page.evaluate(() => {
    const round = (v) => Math.round(v * 10) / 10;
    const rectOf = (selector) => {
      const el = document.querySelector(selector); if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left:round(r.left), top:round(r.top), right:round(r.right), bottom:round(r.bottom), width:round(r.width), height:round(r.height) };
    };
    const intersects = (a,b,t=1) => a && b && a.left < b.right-t && a.right > b.left+t && a.top < b.bottom-t && a.bottom > b.top+t;
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const number = rectOf('#chapter-01 .project-number');
    const title = rectOf('#chapter-01 .project-title-wrap');
    const visual = rectOf('#chapter-01 .project-visual');
    const meta = rectOf('#chapter-01 .project-meta');
    const brand = rectOf('.brand');
    const readout = rectOf('.chapter-readout');
    const pairs = [['number/title',number,title],['number/visual',number,visual],['number/meta',number,meta],['title/visual',title,visual],['title/meta',title,meta],['visual/meta',visual,meta],['brand/title',brand,title],['readout/title',readout,title]];
    return {
      projects: document.querySelectorAll('.chapter--project').length,
      placeholders: [...document.querySelectorAll('.project-title')].filter((n)=>n.textContent?.trim()==='PROJECT PLACEHOLDER').length,
      disabled: document.querySelectorAll('.project-action[aria-disabled="true"]').length,
      nav: document.querySelectorAll('#chapter-nav a').length,
      overflow,
      chapter: rectOf('#chapter-01'),
      collisions: pairs.filter(([,a,b])=>intersects(a,b)).map(([name])=>name),
      contentReady: document.documentElement.classList.contains('content-ready'),
      visualsReady: document.documentElement.classList.contains('visuals-ready'),
      skeletonHidden: getComputedStyle(document.querySelector('.loading-skeleton')).visibility === 'hidden',
    };
  });
}

async function verifyViewport(browser, width, height) {
  const context = await browser.newContext({ viewport:{ width, height } });
  const page = await context.newPage();
  const pageErrors = []; const consoleErrors = [];
  page.on('pageerror', (e)=>pageErrors.push(e.message));
  page.on('console', (m)=>{ if (m.type()==='error') consoleErrors.push(m.text()); });
  await page.goto(BASE, { waitUntil:'networkidle' });
  await page.waitForSelector('.chapter--project');
  await page.waitForFunction(() => document.documentElement.classList.contains('content-ready'));
  await page.waitForFunction(() => document.documentElement.classList.contains('visuals-ready'));
  await page.locator('#chapter-01').scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const layout = await inspectLayout(page);
  assert(layout.projects===10, `Expected 10 project chapters at ${width}x${height}.`);
  assert(layout.placeholders===10, `Expected 10 placeholders at ${width}x${height}.`);
  assert(layout.disabled===20, `Expected 20 disabled actions at ${width}x${height}.`);
  assert(layout.nav===11, `Expected 11 nav entries at ${width}x${height}.`);
  assert(layout.overflow<=1, `Horizontal overflow at ${width}x${height}: ${layout.overflow}px.`);
  assert(layout.chapter && layout.chapter.height<=height+1, `Chapter 01 not fit-to-screen at ${width}x${height}.`);
  assert(layout.collisions.length===0, `Overlapping UI at ${width}x${height}: ${layout.collisions.join(', ')}`);
  assert(layout.contentReady, `content-ready missing at ${width}x${height}.`);
  assert(layout.visualsReady, `visuals-ready missing at ${width}x${height}.`);
  assert(layout.skeletonHidden, `loading-skeleton remained visible at ${width}x${height}.`);
  assert(pageErrors.length===0, `Page errors at ${width}x${height}: ${pageErrors.join(' | ')}`);
  assert(consoleErrors.length===0, `Console errors at ${width}x${height}: ${consoleErrors.join(' | ')}`);
  if (width>980) await page.locator('#chapter-nav a[href="#chapter-03"]').click();
  else await page.locator('#chapter-03').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('#chapter-nav a[href="#chapter-03"]')?.getAttribute('aria-current')==='true');
  assert((await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth))<=1, `Horizontal overflow appeared after navigation at ${width}x${height}.`);
  await context.close();
}

async function verifyReducedMotion(browser) {
  const context = await browser.newContext({ viewport:{ width:390,height:844 }, reducedMotion:'reduce' });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.documentElement.classList.contains('visuals-ready'));
  const state = await page.evaluate(() => ({
    reduced:document.documentElement.classList.contains('is-reduced-motion'),
    low:document.documentElement.classList.contains('performance-low'),
    contentReady:document.documentElement.classList.contains('content-ready'),
    visualsReady:document.documentElement.classList.contains('visuals-ready'),
    readable:Boolean(document.querySelector('.project-title')),
  }));
  assert(state.reduced && state.low && state.contentReady && state.visualsReady && state.readable, 'Reduced-motion loading/fallback contract failed.');
  await context.close();
}

async function verifyWebglFailure(browser) {
  const context = await browser.newContext({ viewport:{ width:390,height:844 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(type,...args) {
      if (type==='webgl'||type==='webgl2'||type==='experimental-webgl') return null;
      return original.call(this,type,...args);
    };
  });
  await page.goto(BASE, { waitUntil:'networkidle' });
  await page.waitForFunction(() => document.documentElement.classList.contains('visuals-ready'));
  const state = await page.evaluate(() => ({
    fallback:document.documentElement.classList.contains('scene-fallback'),
    contentReady:document.documentElement.classList.contains('content-ready'),
    visualsReady:document.documentElement.classList.contains('visuals-ready'),
    skeletonHidden:getComputedStyle(document.querySelector('.loading-skeleton')).visibility==='hidden',
    projects:document.querySelectorAll('.chapter--project').length,
    readable:Boolean(document.querySelector('.project-description')),
  }));
  assert(state.fallback && state.contentReady && state.visualsReady && state.skeletonHidden, 'WebGL failure did not settle loading state.');
  assert(state.projects===10 && state.readable, 'WebGL failure broke readable project content.');
  await context.close();
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless:true });
  for (const [w,h] of VIEWPORTS) await verifyViewport(browser,w,h);
  await verifyReducedMotion(browser);
  await verifyWebglFailure(browser);
  console.log(`Browser verification passed: ${VIEWPORTS.length} viewport profiles, fit-to-screen chapters, no overlap, loading lifecycle, navigation/scroll activation, reduced motion, WebGL fallback, 0 console/page errors.`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
  await sleep(100);
  if (!server.killed) server.kill('SIGKILL');
}
