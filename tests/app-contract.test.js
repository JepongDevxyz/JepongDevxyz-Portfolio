import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const js = await readFile(new URL('../app.js', import.meta.url), 'utf8').catch(() => '');

test('app wires projects, optional scene, observers, and null-link disabling', () => {
  assert.match(js, /PROJECTS/);
  assert.match(js, /import\(['"]\.\/scene\.js['"]\)/);
  assert.match(js, /createScene/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /aria-disabled/);
  assert.match(js, /Optional scene unavailable/);
  assert.doesNotMatch(js, /^import\s+\{\s*createScene/m);
  assert.doesNotMatch(js, /href\s*=\s*["'`]#["'`]/);
});
