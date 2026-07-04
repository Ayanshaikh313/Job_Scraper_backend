const fs = require('fs');
const path = require('path');
const Application = require('../models/Application');
const Job = require('../models/Job');
const { parseResumeFromFile } = require('../services/resumeParserService');
const { extractSkillsFromText } = require('../services/skillExtractionService');
const { scoreApplication } = require('../services/atsScoringService');
const { generateApplicationReportPdf } = require('../services/pdfReportService');

const toNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const getResumeFilePath = (resumeUrl = '') => {
  if (!resumeUrl) {
    return null;
  }

  const fileName = path.basename(resumeUrl);
  return path.join(__dirname, '../../uploads/resumes', fileName);
};

const buildAtsSnapshot = async (job, resumeUrl) => {
  const resumeFilePath = getResumeFilePath(resumeUrl);
  let resumeText = '';
  let resumeMetadata = {
    wordCount: 0,
    characterCount: 0,
    pageCount: 0,
    parsedAt: new Date(),
  };

  if (resumeFilePath && fs.existsSync(resumeFilePath)) {
    const parsedResume = await parseResumeFromFile(resumeFilePath);
    resumeText = parsedResume.text;
    resumeMetadata = parsedResume.metadata;
  }

  const extractedSkills = extractSkillsFromText(resumeText);
  const atsEvaluation = scoreApplication({
    job,
    resumeText,
    extractedSkills,
  });

  return {
    resumeText,
    resumeMetadata,
    extractedSkills,
    atsEvaluation,
  };
};

const assignInsightsToApplication = (application, insights) => {
  application.resumeText = insights.resumeText;
  application.resumeMetadata = insights.resumeMetadata;
  application.extractedSkills = insights.extractedSkills;
  application.atsEvaluation = insights.atsEvaluation;
};

const ensureApplicationInsights = async (application, jobDoc) => {
  const job = jobDoc || (application.jobId && application.jobId._id ? application.jobId : await Job.findById(application.jobId));

  if (!job) {
    return application;
  }

  const hasEvaluation = application.atsEvaluation && application.atsEvaluation.evaluatedAt;
  const hasResumeText = typeof application.resumeText === 'string' && application.resumeText.length > 0;
  const hasExtractedSkills = Array.isArray(application.extractedSkills?.all) && application.extractedSkills.all.length > 0;
  const hasMatchedSkills = Array.isArray(application.atsEvaluation?.matchedSkills) && application.atsEvaluation.matchedSkills.length > 0;
  const shouldRecompute = !hasEvaluation || !hasResumeText || !hasExtractedSkills || (hasResumeText && !hasMatchedSkills);

  if (!shouldRecompute) {
    return application;
  }

  const insights = await buildAtsSnapshot(job, application.resumeUrl);
  assignInsightsToApplication(application, insights);
  await application.save();

  return application;
};

const createRankedApplications = (applications) =>
  applications
    .sort((a, b) => {
      const scoreDelta = (b.atsEvaluation?.totalScore || 0) - (a.atsEvaluation?.totalScore || 0);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return new Date(a.appliedAt).getTime() - new Date(b.appliedAt).getTime();
    })
    .map((application, index) => ({
      ...application.toObject(),
      rank: index + 1,
    }));

const buildAtsSummary = (applications) => {
  const totalApplicants = applications.length;
  const totalScore = applications.reduce((sum, application) => sum + (application.atsEvaluation?.totalScore || 0), 0);

  return {
    totalApplicants,
    averageAtsScore: totalApplicants === 0 ? 0 : Math.round(totalScore / totalApplicants),
    strongMatches: applications.filter((application) => application.atsEvaluation?.totalScore >= 80).length,
    mediumMatches: applications.filter((application) => {
      const score = application.atsEvaluation?.totalScore || 0;
      return score >= 60 && score < 80;
    }).length,
    weakMatches: applications.filter((application) => (application.atsEvaluation?.totalScore || 0) < 60).length,
  };
};

const authorizeHiringManagerForJob = async (jobId, hiringManagerId) => {
  const job = await Job.findById(jobId);

  if (!job) {
    return {
      error: {
        status: 404,
        message: 'Job not found',
      },
    };
  }

  if (job.createdBy.toString() !== hiringManagerId) {
    return {
      error: {
        status: 403,
        message: 'You are not authorized to view applicants for this job',
      },
    };
  }

  return { job };
};

const authorizeHiringManagerForApplication = async (applicationId, hiringManagerId) => {
  const application = await Application.findById(applicationId).populate('jobId', 'createdBy');

  if (!application) {
    return {
      error: {
        status: 404,
        message: 'Application not found',
      },
    };
  }

  if (!application.jobId) {
    return {
      error: {
        status: 404,
        message: 'Job for application not found',
      },
    };
  }

  if (application.jobId.createdBy.toString() !== hiringManagerId) {
    return {
      error: {
        status: 403,
        message: 'You are not authorized to view this application',
      },
    };
  }

  return { application };
};

const parseAnswers = (answers) => {
  if (!answers) {
    return [];
  }

  return Array.isArray(answers) ? answers : JSON.parse(answers);
};

/**
 * Apply to a job with resume and screening answers
 * POST /api/applications
 * Protected - Only Students
 * Content-Type: multipart/form-data
 */
const applyToJob = async (req, res, next) => {
  try {
    const { jobId, answers } = req.body;
    const studentId = req.userId;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a job ID',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume (PDF only)',
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    const existingApplication = await Application.findOne({
      studentId,
      jobId,
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    const parsedAnswers = parseAnswers(answers);
    const requiredQuestions = (job.screeningQuestions || []).filter((question) => question.required);

    for (const requiredQuestion of requiredQuestions) {
      const answered = parsedAnswers.some(
        (item) => item.question === requiredQuestion.question && item.answer && item.answer.trim()
      );

      if (!answered) {
        return res.status(400).json({
          success: false,
          message: `Please answer all required screening questions: ${requiredQuestion.question}`,
        });
      }
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;
    const insights = await buildAtsSnapshot(job, resumeUrl);

    const application = await Application.create({
      studentId,
      jobId,
      status: 'Applied',
      resumeUrl,
      answers: parsedAnswers,
      resumeText: insights.resumeText,
      resumeMetadata: insights.resumeMetadata,
      extractedSkills: insights.extractedSkills,
      atsEvaluation: insights.atsEvaluation,
      appliedAt: new Date(),
    });

    await application.populate('studentId', 'name email');
    await application.populate('jobId', 'title company location description salary employmentType screeningQuestions');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    next(error);
  }
};

/**
 * Get student's applications
 * GET /api/applications/my
 * Protected - Only Students
 */
const getMyApplications = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const page = toNumber(req.query.page, 1);
    const limit = toNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const applications = await Application.find({ studentId })
      .populate('jobId', 'title company location description salary employmentType screeningQuestions')
      .populate('studentId', 'name email')
      .sort({ appliedAt: -1 })
      .limit(limit)
      .skip(skip);

    await Promise.all(
      applications.map((application) => ensureApplicationInsights(application, application.jobId))
    );

    const total = await Application.countDocuments({ studentId });

    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: applications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get applicants for a job
 * GET /api/applications/job/:jobId
 * Protected - Only Hiring Managers (job creator)
 */
const getJobApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const hiringManagerId = req.userId;
    const page = toNumber(req.query.page, 1);
    const limit = toNumber(req.query.limit, 10);
    const skip = (page - 1) * limit;

    const { job, error } = await authorizeHiringManagerForJob(jobId, hiringManagerId);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const applications = await Application.find({ jobId })
      .populate('studentId', 'name email')
      .populate('jobId', 'title company location description salary employmentType screeningQuestions')
      .sort({ appliedAt: -1 })
      .limit(limit)
      .skip(skip);

    await Promise.all(
      applications.map((application) => ensureApplicationInsights(application, job))
    );

    const total = await Application.countDocuments({ jobId });

    res.status(200).json({
      success: true,
      message: 'Applicants retrieved successfully',
      data: applications,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ranked applicants for a job
 * GET /api/applications/job/:jobId/ranking
 * Protected - Only Hiring Managers (job creator)
 */
const getRankedApplicants = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const hiringManagerId = req.userId;
    const { job, error } = await authorizeHiringManagerForJob(jobId, hiringManagerId);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const applications = await Application.find({ jobId })
      .populate('studentId', 'name email')
      .populate('jobId', 'title company location description salary employmentType screeningQuestions')
      .sort({ appliedAt: -1 });

    await Promise.all(
      applications.map((application) => ensureApplicationInsights(application, job))
    );

    const rankedApplications = createRankedApplications(applications);
    const summary = buildAtsSummary(applications);

    res.status(200).json({
      success: true,
      message: 'Ranked applicants retrieved successfully',
      data: rankedApplications,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get ATS dashboard stats for hiring manager
 * GET /api/applications/dashboard/hiring-manager
 * Protected - Only Hiring Managers
 */
const getHiringManagerDashboardStats = async (req, res, next) => {
  try {
    const jobs = await Job.find({ createdBy: req.userId }).select('_id title company');
    const jobIds = jobs.map((job) => job._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('studentId', 'name email')
      .populate('jobId', 'title company location description salary employmentType screeningQuestions');

    await Promise.all(
      applications.map((application) => ensureApplicationInsights(application, application.jobId))
    );

    const summary = buildAtsSummary(applications);
    const applicantsByStatus = {
      applied: applications.filter((application) => application.status === 'Applied').length,
      reviewing: applications.filter((application) => application.status === 'Reviewing').length,
      accepted: applications.filter((application) => application.status === 'Accepted').length,
      rejected: applications.filter((application) => application.status === 'Rejected').length,
    };

    const topCandidates = createRankedApplications(applications).slice(0, 5);

    res.status(200).json({
      success: true,
      message: 'Hiring manager ATS dashboard retrieved successfully',
      data: {
        totalJobs: jobs.length,
        totalApplicants: summary.totalApplicants,
        averageAtsScore: summary.averageAtsScore,
        strongMatches: summary.strongMatches,
        mediumMatches: summary.mediumMatches,
        weakMatches: summary.weakMatches,
        applicantsByStatus,
        topCandidates,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get application ATS details
 * GET /api/applications/job/:jobId/:applicationId
 * Protected - Only Hiring Managers (job creator)
 */
const getApplicationDetails = async (req, res, next) => {
  try {
    const { jobId, applicationId } = req.params;
    const hiringManagerId = req.userId;

    const { job, error } = await authorizeHiringManagerForJob(jobId, hiringManagerId);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    const application = await Application.findOne({ _id: applicationId, jobId })
      .populate('studentId', 'name email')
      .populate('jobId', 'title company location description salary employmentType screeningQuestions');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    await ensureApplicationInsights(application, job);

    res.status(200).json({
      success: true,
      message: 'Application details retrieved successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationDetailsById = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const hiringManagerId = req.userId;

    const { application, error } = await authorizeHiringManagerForApplication(applicationId, hiringManagerId);

    if (error) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }

    await application.populate('studentId', 'name email');
    await application.populate('jobId', 'title company location description salary employmentType screeningQuestions');

    await ensureApplicationInsights(application, application.jobId);

    res.status(200).json({
      success: true,
      message: 'Application details retrieved successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download application ATS report
 * GET /api/applications/:id/report
 * Protected - Only Hiring Managers (job creator)
 */
const downloadEvaluationReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate('studentId', 'name email')
      .populate('jobId', 'title company location description salary employmentType screeningQuestions createdBy');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (!application.jobId || application.jobId.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to download this report',
      });
    }

    await ensureApplicationInsights(application, application.jobId);

    const pdfBuffer = generateApplicationReportPdf(application);
    const candidateName = (application.studentId?.name || 'candidate').replace(/[^a-z0-9]+/gi, '-').toLowerCase();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${candidateName}-ats-report.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Update application status
 * PATCH /api/applications/:id/status
 * Protected - Only Hiring Managers (job creator)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hiringManagerId = req.userId;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status',
      });
    }

    const validStatuses = ['Applied', 'Reviewing', 'Rejected', 'Accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const job = await Job.findById(application.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    if (job.createdBy.toString() !== hiringManagerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this application status',
      });
    }

    application.status = status;
    await ensureApplicationInsights(application, job);
    await application.save();

    await application.populate('studentId', 'name email');
    await application.populate('jobId', 'title company location description salary employmentType screeningQuestions');

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  getRankedApplicants,
  getHiringManagerDashboardStats,
  getApplicationDetails,
  getApplicationDetailsById,
  downloadEvaluationReport,
  updateApplicationStatus,
};
