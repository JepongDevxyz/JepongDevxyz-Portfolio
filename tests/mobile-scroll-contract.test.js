import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const containment = await readFile(new URL('../scene-containment.css', import.meta.url), 'utf8');
const css = `${styles}\n${containment}`;

test('mobile root scroller is locked to vertical pan only and browser scrollbars are hidden', () => {
  assert.match(css, /html\s*,\s*body\s*\{[^}]*overflow-x\s*:\s*(?:clip|hidden)/s,
    'Expected html and body to both clip horizontal overflow.');
  assert.match(css, /html\s*,\s*body\s*\{[^}]*touch-action\s*:\s*pan-y/s,
    'Expected root touch handling to allow vertical pan only.');
  assert.match(css, /scrollbar-width\s*:\s*none/,
    'Expected standards scrollbar hiding.');
  assert.match(css, /::-webkit-scrollbar\s*\{[^}]*display\s*:\s*none/s,
    'Expected WebKit/Chromium scrollbar hiding.');
});
