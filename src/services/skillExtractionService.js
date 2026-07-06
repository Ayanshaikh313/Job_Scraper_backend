const SKILL_CATALOG = {
  frontend: [
    { name: 'React', patterns: ['react', 'react.js', 'reactjs'] },
    { name: 'Next.js', patterns: ['next.js', 'nextjs', 'next js'] },
    { name: 'Angular', patterns: ['angular'] },
    { name: 'Vue', patterns: ['vue', 'vue.js', 'vuejs'] },
    { name: 'JavaScript', patterns: ['javascript'] },
    { name: 'TypeScript', patterns: ['typescript'] },
    { name: 'HTML', patterns: ['html', 'html5'] },
    { name: 'CSS', patterns: ['css', 'css3'] },
    { name: 'Tailwind CSS', patterns: ['tailwind', 'tailwind css'] },
    { name: 'Bootstrap', patterns: ['bootstrap'] },
  ],
  backend: [
    { name: 'Node.js', patterns: ['node.js', 'nodejs', 'node js'] },
    { name: 'Express', patterns: ['express', 'express.js', 'expressjs'] },
    { name: 'FastAPI', patterns: ['fastapi', 'fast api'] },
    { name: 'Django', patterns: ['django'] },
    { name: 'Python', patterns: ['python'] },
    { name: 'Java', patterns: ['java'] },
    { name: 'Spring Boot', patterns: ['spring boot'] },
    { name: 'REST API', patterns: ['rest api', 'restful api', 'api development'] },
  ],
  database: [
    { name: 'MongoDB', patterns: ['mongodb', 'mongo db'] },
    { name: 'PostgreSQL', patterns: ['postgresql', 'postgres', 'postgre sql'] },
    { name: 'MySQL', patterns: ['mysql', 'my sql'] },
    { name: 'Redis', patterns: ['redis'] },
    { name: 'SQL', patterns: [' sql ', 'sql,', 'sql.', 'sql\n'] },
  ],
  cloud: [
    { name: 'AWS', patterns: ['aws', 'amazon web services'] },
    { name: 'Azure', patterns: ['azure', 'microsoft azure'] },
    { name: 'GCP', patterns: ['gcp', 'google cloud'] },
    { name: 'Docker', patterns: ['docker'] },
    { name: 'Kubernetes', patterns: ['kubernetes', 'k8s'] },
    { name: 'CI/CD', patterns: ['ci/cd', 'cicd', 'continuous integration'] },
  ],
  tools: [
    { name: 'Git', patterns: ['git'] },
    { name: 'GitHub', patterns: ['github'] },
    { name: 'Postman', patterns: ['postman'] },
    { name: 'Figma', patterns: ['figma'] },
    { name: 'Jest', patterns: ['jest'] },
    { name: 'Cypress', patterns: ['cypress'] },
  ],
};

const CATEGORY_KEYS = Object.keys(SKILL_CATALOG);

const normalizeText = (value = '') =>
  ` ${String(value).toLowerCase().replace(/[^a-z0-9.+#/\s-]/g, ' ')} `;

const containsPattern = (text, pattern) => text.includes(` ${pattern.toLowerCase()} `) || text.includes(pattern.toLowerCase());

const dedupe = (items) => Array.from(new Set(items)).sort((a, b) => a.localeCompare(b));

const extractSkillsFromText = (text = '') => {
  const normalized = normalizeText(text);
  const extractedSkills = {};

  for (const category of CATEGORY_KEYS) {
    extractedSkills[category] = dedupe(
      SKILL_CATALOG[category]
        .filter((skill) => skill.patterns.some((pattern) => containsPattern(normalized, pattern)))
        .map((skill) => skill.name)
    );
  }

  extractedSkills.all = dedupe(
    CATEGORY_KEYS.flatMap((category) => extractedSkills[category])
  );

  return extractedSkills;
};

module.exports = {
  CATEGORY_KEYS,
  SKILL_CATALOG,
  extractSkillsFromText,
};
