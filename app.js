import { PROJECTS } from './projects.js';
const root = document.documentElement;
const chapterHost = document.querySelector('#project-chapters');
const navHost = document.querySelector('#chapter-nav');
const canvas = document.querySelector('#scene-canvas');
const currentChapter = document.querySelector('#current-chapter');

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reducedMotionQuery.matches) root.classList.add('is-reduced-motion');

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function disabledAction(label, value = 'TBD') {
  return `
    <span class="project-action" aria-disabled="true">
      <span>${escapeText(label)}</span>
      <span>${escapeText(value)}</span>
    </span>
  `;
}

function liveAction(label, url) {
  if (!url) return disabledAction(label, 'TBD');
  return `
    <a class="project-action" href="${escapeText(url)}" target="_blank" rel="noopener noreferrer">
      <span>${escapeText(label)}</span>
      <span>OPEN ↗</span>
    </a>
  `;
}

function projectSection(project, index) {
  const direction = index % 2 === 0 ? 'forward' : 'reverse';
  const tags = [project.category, ...project.tech, project.status]
    .map((tag) => `<li>${escapeText(tag)}</li>`)
    .join('');

  return `
    <section
      id="chapter-${project.id}"
      class="chapter chapter--project chapter--${direction}"
      data-chapter="${project.id}"
      aria-labelledby="project-title-${project.id}"
    >
      <div class="chapter-inner project-layout">
        <div class="project-number reveal" aria-hidden="true">${project.id}</div>
        <header class="project-title-wrap reveal">
          <p class="project-kicker">Jepong Devxyz / Project ${project.id}</p>
          <h2 id="project-title-${project.id}" class="project-title">${escapeText(project.title)}</h2>
        </header>
        <div class="project-visual reveal" aria-hidden="true">
          <div class="visual-monogram">JD</div>
          <div class="visual-crosshair">${project.id}</div>
        </div>
        <aside class="project-meta reveal" aria-label="Project ${project.id} details">
          <p class="project-subtitle">${escapeText(project.subtitle)}</p>
          <p class="project-description">${escapeText(project.description)}</p>
          <ul class="project-tags" aria-label="Project metadata">${tags}</ul>
          <div class="project-actions">
            ${liveAction('View Project', project.githubUrl)}
            ${liveAction('Live Link', project.liveUrl)}
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderProjects() {
  chapterHost.innerHTML = PROJECTS.map(projectSection).join('');
}

function renderNavigation() {
  const items = ['00', ...PROJECTS.map((project) => project.id)];
  navHost.innerHTML = items.map((id) => `
    <a href="#chapter-${id}" aria-label="Go to chapter ${id}" ${id === '00' ? 'aria-current="true"' : ''}>
      <span>${id}</span>
    </a>
  `).join('');
}

renderProjects();
renderNavigation();
root.classList.add('content-ready');

const sections = [...document.querySelectorAll('.chapter[data-chapter]')];
const navLinks = [...navHost.querySelectorAll('a')];

const fallbackScene = {
  setProgress() {}, setChapter() {}, resize() {}, start() {}, stop() {}, destroy() {},
};

let scene = fallbackScene;
let latestProgress = 0;
let activeSection = sections[0];

import('./scene.js')
  .then(({ createScene }) => {
    scene = createScene(canvas);
    scene.setProgress(latestProgress);
    scene.setChapter(Number.parseInt(activeSection?.dataset.chapter || '00', 10) || 0);
    scene.start();
    root.classList.add('visuals-ready');
  })
  .catch((error) => {
    root.classList.add('scene-fallback', 'performance-low', 'visuals-ready');
    console.warn('[Jepong Devxyz] Optional scene unavailable:', error);
  });

let ticking = false;

function setActiveSection(section) {
  if (!section || activeSection === section) return;
  activeSection?.classList.remove('chapter--active');
  activeSection = section;
  activeSection.classList.add('chapter--active');
  const chapter = activeSection.dataset.chapter || '00';
  currentChapter.textContent = chapter;
  scene.setChapter(Number.parseInt(chapter, 10) || 0);
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === `#chapter-${chapter}`;
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function updateScrollState() {
  ticking = false;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  latestProgress = progress;
  root.style.setProperty('--progress', progress.toFixed(5));
  scene.setProgress(progress);
  if (activeSection) {
    const rect = activeSection.getBoundingClientRect();
    const viewport = Math.max(1, window.innerHeight);
    const local = Math.min(1, Math.max(0, (viewport - rect.top) / (viewport + rect.height)));
    activeSection.style.setProperty('--chapter-progress', local.toFixed(5));
  }
}

function requestScrollUpdate() {
  if (ticking) return;
  ticking = true;
  window.requestAnimationFrame(updateScrollState);
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (visible[0]) setActiveSection(visible[0].target);
  }, { root: null, rootMargin: '-28% 0px -28% 0px', threshold: [0, 0.08, 0.18, 0.35, 0.55, 0.8] });
  sections.forEach((section) => observer.observe(section));
} else {
  const fallbackActiveCheck = () => {
    const center = window.innerHeight * 0.5;
    const nearest = sections.map((section) => ({ section, distance: Math.abs(section.getBoundingClientRect().top - center) })).sort((a, b) => a.distance - b.distance)[0];
    if (nearest) setActiveSection(nearest.section);
  };
  window.addEventListener('scroll', fallbackActiveCheck, { passive: true });
}

window.addEventListener('scroll', requestScrollUpdate, { passive: true });
window.addEventListener('resize', requestScrollUpdate, { passive: true });
reducedMotionQuery.addEventListener?.('change', (event) => root.classList.toggle('is-reduced-motion', event.matches));

navHost.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#chapter-"]');
  if (!link) return;
  const target = document.querySelector(link.getAttribute('href'));
  if (!target) return;
  event.preventDefault();
  target.scrollIntoView({ behavior: reducedMotionQuery.matches ? 'auto' : 'smooth', block: 'start' });
});

window.addEventListener('pagehide', () => scene.stop(), { once: true });
updateScrollState();
