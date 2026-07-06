const fs = require('fs');
const { parseResumeFromFile } = require('../services/resumeParserService');
const { extractSkillsFromText } = require('../services/skillExtractionService');
const { scoreApplication } = require('../services/atsScoringService');

const analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Resume PDF is required',
      });
    }

    const { jobDescription } = req.body;

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: 'Job description is required',
      });
    }

    const parsedResume = await parseResumeFromFile(req.file.path);

    const extractedSkills = extractSkillsFromText(parsedResume.text);

    const fakeJob = {
      title: 'ATS Scanner',
      description: jobDescription,
      screeningQuestions: [],
    };

    const atsEvaluation = scoreApplication({
      job: fakeJob,
      resumeText: parsedResume.text,
      extractedSkills,
    });

    fs.unlink(req.file.path, () => {});

    res.status(200).json({
      success: true,
      data: {
        atsEvaluation,
        extractedSkills,
        resumeMetadata: parsedResume.metadata,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  analyzeResume,
};