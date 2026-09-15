import test from 'node:test';
import assert from 'node:assert/strict';
import { PROJECTS } from '../projects.js';

test('exports exactly ten placeholder projects with null official links', () => {
  assert.equal(PROJECTS.length, 10);
  PROJECTS.forEach((project, index) => {
    assert.equal(project.id, String(index + 1).padStart(2, '0'));
    assert.equal(project.title, 'PROJECT PLACEHOLDER');
    assert.equal(project.githubUrl, null);
    assert.equal(project.liveUrl, null);
  });
});
