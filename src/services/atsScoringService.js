const { extractSkillsFromText } = require('./skillExtractionService');

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'build', 'by', 'for', 'from', 'have',
  'in', 'into', 'is', 'job', 'looking', 'of', 'on', 'or', 'our', 'role', 'team',
  'that', 'the', 'this', 'to', 'using', 'with', 'will', 'you', 'your',
]);

const EDUCATION_LEVELS = [
  { label: 'PhD', patterns: ['phd', 'doctorate'] },
  { label: 'Masters', patterns: ['master', 'msc', 'm.tech', 'mba'] },
  { label: 'Bachelors', patterns: ['bachelor', 'b.tech', 'b.e', 'bs ', 'bsc'] },
  { label: 'Associate', patterns: ['associate degree'] },
  { label: 'Diploma', patterns: ['diploma'] },
];

const normalizeText = (value = '') =>
  ` ${String(value).toLowerCase().replace(/[^a-z0-9.+#/\s-]/g, ' ')} `;

const toTitleCase = (word) => word.charAt(0).toUpperCase() + word.slice(1);

const extractKeywordCandidates = (job) => {
  const source = [
    job.title,
    job.description,
    ...(job.screeningQuestions || []).map((item) => item.question),
  ]
    .filter(Boolean)
    .join(' ');

  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const frequency = normalized.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 20)
    .map(([word]) => toTitleCase(word));
};

const getMatchedAndMissingKeywords = (keywords, resumeText) => {
  const normalizedResume = normalizeText(resumeText);
  const matchedKeywords = [];
  const missingKeywords = [];

  keywords.forEach((keyword) => {
    const present = normalizedResume.includes(` ${keyword.toLowerCase()} `) || normalizedResume.includes(keyword.toLowerCase());
    if (present) {
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  const percentage = keywords.length === 0
    ? 100
    : Math.round((matchedKeywords.length / keywords.length) * 100);

  return {
    matchedKeywords,
    missingKeywords,
    keywordMatchPercentage: percentage,
  };
};

const extractYears = (text = '') => {
  const matches = [...text.toLowerCase().matchAll(/(\d+)\+?\s*(?:years?|yrs?)/g)];
  if (matches.length === 0) {
    return 0;
  }

  return Math.max(...matches.map((match) => parseInt(match[1], 10)).filter((num) => !Number.isNaN(num)));
};

const scoreExperience = (jobText, resumeText) => {
  const requiredYears = extractYears(jobText);
  const candidateYears = extractYears(resumeText);

  if (!requiredYears) {
    return {
      requiredYears: 0,
      candidateYears,
      experienceMatchPercentage: candidateYears > 0 ? 100 : 70,
    };
  }

  return {
    requiredYears,
    candidateYears,
    experienceMatchPercentage: Math.min(100, Math.round((candidateYears / requiredYears) * 100)),
  };
};

const detectEducationLevel = (text = '') => {
  const normalized = normalizeText(text);
  const matchedIndex = EDUCATION_LEVELS.findIndex((level) =>
    level.patterns.some((pattern) => normalized.includes(pattern))
  );

  if (matchedIndex === -1) {
    return {
      level: 'Not Found',
      rank: -1,
    };
  }

  return {
    level: EDUCATION_LEVELS[matchedIndex].label,
    rank: EDUCATION_LEVELS.length - matchedIndex,
  };
};

const scoreEducation = (jobText, resumeText) => {
  const required = detectEducationLevel(jobText);
  const candidate = detectEducationLevel(resumeText);

  if (required.rank === -1) {
    return {
      requiredEducation: 'Not specified',
      candidateEducation: candidate.level,
      educationMatchPercentage: candidate.rank === -1 ? 70 : 100,
    };
  }

  const educationMatchPercentage = candidate.rank >= required.rank
    ? 100
    : candidate.rank === -1
      ? 20
      : 60;

  return {
    requiredEducation: required.level,
    candidateEducation: candidate.level,
    educationMatchPercentage,
  };
};

const scoreResumeQuality = (resumeText) => {
  const normalized = resumeText.toLowerCase();
  const words = resumeText.split(/\s+/).filter(Boolean).length;
  let points = 0;

  if (words >= 250) points += 35;
  else if (words >= 150) points += 25;
  else if (words >= 80) points += 15;

  if (/\b(email|phone|linkedin|github)\b/.test(normalized)) points += 20;
  if (/\b(experience|employment|work history)\b/.test(normalized)) points += 20;
  if (/\b(education|university|college)\b/.test(normalized)) points += 15;
  if (/\b(skill|skills|technology|technologies|tools)\b/.test(normalized)) points += 10;

  return Math.min(100, points);
};

const getRecommendation = (score) => {
  if (score >= 80) return 'Strong Match';
  if (score >= 60) return 'Medium Match';
  return 'Weak Match';
};

const scoreApplication = ({ job, resumeText, extractedSkills }) => {
  const jobText = [job.title, job.description, ...(job.screeningQuestions || []).map((item) => item.question)]
    .filter(Boolean)
    .join(' ');

  const jobSkills = extractSkillsFromText(jobText);
  const matchedSkills = extractedSkills.all.filter((skill) => jobSkills.all.includes(skill));
  const missingSkills = jobSkills.all.filter((skill) => !extractedSkills.all.includes(skill));

  const keywordCandidates = Array.from(
    new Set([...extractKeywordCandidates(job), ...jobSkills.all])
  );
  const keywordAnalysis = getMatchedAndMissingKeywords(keywordCandidates, resumeText);

  const skillsMatchPercentage = jobSkills.all.length === 0
    ? 100
    : Math.round((matchedSkills.length / jobSkills.all.length) * 100);

  const experienceAnalysis = scoreExperience(jobText, resumeText);
  const educationAnalysis = scoreEducation(jobText, resumeText);
  const resumeQualityScore = scoreResumeQuality(resumeText);

  const breakdown = {
    keywordMatch: Math.round(keywordAnalysis.keywordMatchPercentage * 0.4),
    skillsMatch: Math.round(skillsMatchPercentage * 0.25),
    experienceMatch: Math.round(experienceAnalysis.experienceMatchPercentage * 0.2),
    educationMatch: Math.round(educationAnalysis.educationMatchPercentage * 0.1),
    resumeQuality: Math.round(resumeQualityScore * 0.05),
  };

  const totalScore = Math.min(
    100,
    breakdown.keywordMatch +
      breakdown.skillsMatch +
      breakdown.experienceMatch +
      breakdown.educationMatch +
      breakdown.resumeQuality
  );

  return {
    totalScore,
    recommendation: getRecommendation(totalScore),
    matchedSkills,
    missingSkills,
    jobSkills,
    keywordAnalysis,
    experienceAnalysis,
    educationAnalysis,
    resumeQualityScore,
    scoreBreakdown: breakdown,
    evaluatedAt: new Date(),
  };
};

module.exports = {
  scoreApplication,
};
