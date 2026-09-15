const baseProject = {
  title: 'PROJECT PLACEHOLDER',
  subtitle: 'COMING SOON',
  description: 'Project details will be added soon.',
  category: 'CATEGORY',
  tech: ['TECH'],
  status: 'STATUS',
  image: null,
  githubUrl: null,
  liveUrl: null,
  featured: false,
};

export const PROJECTS = Array.from({ length: 10 }, (_, index) => ({
  ...baseProject,
  id: String(index + 1).padStart(2, '0'),
  tech: [...baseProject.tech],
}));
