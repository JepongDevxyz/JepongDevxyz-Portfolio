import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const loadingCss = readFileSync(new URL('../loading.css', import.meta.url), 'utf8');

test('loading lifecycle exposes content and visual readiness states', () => {
  assert.match(app, /classList\.add\(['"]content-ready['"]\)/);
  assert.match(app, /visuals-ready/);
  assert.match(app, /import\(['"]\.\/scene\.js['"]\)/);
});

test('decorative skeleton exists and is reduced-motion safe', () => {
  assert.match(html, /class=["'][^"']*loading-skeleton[^"']*["']/);
  assert.match(html, /aria-hidden=["']true["']/);
  assert.match(loadingCss, /\.loading-skeleton/);
  assert.match(loadingCss, /prefers-reduced-motion:\s*reduce/);
  assert.match(loadingCss, /\.content-ready\s+\.loading-skeleton/);
});

test('vercel cache policy is revalidating and not offline', () => {
  const url = new URL('../vercel.json', import.meta.url);
  assert.equal(existsSync(url), true, 'vercel.json must exist');
  const config = readFileSync(url, 'utf8');
  assert.match(config, /max-age=0, must-revalidate/);
  assert.match(config, /stale-while-revalidate=86400/);
  assert.doesNotMatch(config, /service[- ]?worker|offline/i);
});
