import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { PROJECTS } from '../projects.js';

const requiredFiles = ['index.html', 'styles.css', 'app.js', 'scene.js', 'projects.js'];
const failures = [];

for (const file of requiredFiles) {
  try {
    await access(new URL(`../${file}`, import.meta.url), constants.R_OK);
  } catch {
    failures.push(`Missing required file: ${file}`);
  }
}

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
if (!/href=["']styles\.css["']/.test(html)) failures.push('index.html does not reference styles.css');
if (!/src=["']app\.js["']/.test(html)) failures.push('index.html does not reference app.js');
if (/\b(?:src|href)=["']http:\/\//i.test(html)) failures.push('index.html contains insecure http:// resource URL');
if (!/id=["']chapter-00["']/.test(html)) failures.push('intro chapter 00 is missing');
if (!/id=["']project-chapters["']/.test(html)) failures.push('project chapter host is missing');
if (!/id=["']scene-canvas["']/.test(html)) failures.push('decorative scene canvas is missing');

if (PROJECTS.length !== 10) failures.push(`Expected 10 placeholder projects, found ${PROJECTS.length}`);
for (const project of PROJECTS) {
  if (project.title !== 'PROJECT PLACEHOLDER') failures.push(`Project ${project.id} has non-placeholder title`);
  if (project.githubUrl !== null || project.liveUrl !== null) failures.push(`Project ${project.id} contains an official URL before approval`);
}

if (failures.length) {
  console.error('Static verification failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Static verification passed: ${requiredFiles.length} core files, ${PROJECTS.length} placeholder projects, 0 official URLs.`);
