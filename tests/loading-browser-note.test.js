import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../scripts/browser-verify.mjs', import.meta.url), 'utf8');

test('browser verification covers loading lifecycle', () => {
  assert.match(script, /content-ready/);
  assert.match(script, /visuals-ready/);
  assert.match(script, /loading-skeleton/);
});
