import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8').catch(() => '');

test('contains responsive, reduced-motion, and active chapter contracts', () => {
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /\.chapter--active/);
  assert.match(css, /@media\s*\(max-width:\s*480px\)/);
  assert.match(css, /:focus-visible/);
});
