import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../styles.css', import.meta.url), 'utf8');

test('loading lifecycle exposes content and visual readiness states', () => {
  assert.match(app, /classList\.add\(['"]content-ready['"]\)/);
  assert.match(app, /classList\.add\(['"]visuals-ready['"]\)/);
  assert.match(app, /import\(['"]\.\/scene\.js['"]\)/);
});

test('decorative skeleton exists and is reduced-motion safe', () => {
  assert.match(html, /class=["'][^"']*loading-skeleton[^"']*["']/);
  assert.match(html, /aria-hidden=["']true["']/);
  assert.match(css, /\.loading-skeleton/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.content-ready[\s\S]*loading-skeleton|loading-skeleton[\s\S]*\.content-ready/);
});
