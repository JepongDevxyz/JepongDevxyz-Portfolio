import test from 'node:test';
import assert from 'node:assert/strict';
import { detectPerformanceTier } from '../scene.js';

test('selects low tier for constrained or reduced-motion devices', () => {
  assert.equal(detectPerformanceTier({ webgl: false, reducedMotion: false, memory: 8, cores: 8 }), 'low');
  assert.equal(detectPerformanceTier({ webgl: true, reducedMotion: true, memory: 8, cores: 8 }), 'low');
  assert.equal(detectPerformanceTier({ webgl: true, reducedMotion: false, memory: 2, cores: 4 }), 'low');
});

test('selects mid and high tiers from capability budget', () => {
  assert.equal(detectPerformanceTier({ webgl: true, reducedMotion: false, memory: 4, cores: 6 }), 'mid');
  assert.equal(detectPerformanceTier({ webgl: true, reducedMotion: false, memory: 8, cores: 8 }), 'high');
});
