const express = require('express');
const {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  getRankedApplicants,
  getHiringManagerDashboardStats,
  getApplicationDetails,
  getApplicationDetailsById,
  downloadEvaluationReport,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * POST /api/applications
 * Apply to a job with resume and screening answers
 * Protected - Only Students
 * Content-Type: multipart/form-data
 * Fields: jobId, resume (file), answers (JSON array)
 */
router.post('/', authenticate, authorizeRoles('student'), upload.single('resume'), applyToJob);

/**
 * GET /api/applications/my
 * Get student's applications
 * Protected - Only Students
 * Query params: page, limit
 */
router.get('/my', authenticate, authorizeRoles('student'), getMyApplications);

/**
 * GET /api/applications/dashboard/hiring-manager
 * Get ATS dashboard stats for hiring manager
 * Protected - Only Hiring Managers
 */
router.get('/dashboard/hiring-manager', authenticate, authorizeRoles('hiring_manager'), getHiringManagerDashboardStats);

/**
 * GET /api/applications/job/:jobId
 * Get applicants for a job
 * Protected - Only Hiring Managers (job creator)
 * Query params: page, limit
 */
router.get('/job/:jobId', authenticate, authorizeRoles('hiring_manager'), getJobApplicants);

/**
 * GET /api/applications/job/:jobId/ranking
 * Get ranked applicants for a job
 * Protected - Only Hiring Managers (job creator)
 */
router.get('/job/:jobId/ranking', authenticate, authorizeRoles('hiring_manager'), getRankedApplicants);

/**
 * GET /api/applications/job/:jobId/:applicationId
 * Get ATS details for a single application
 * Protected - Only Hiring Managers (job creator)
 */
router.get('/job/:jobId/:applicationId', authenticate, authorizeRoles('hiring_manager'), getApplicationDetails);

/**
 * GET /api/applications/details/:applicationId
 * Get ATS details for a single application by application ID
 * Protected - Only Hiring Managers (job creator)
 */
router.get('/details/:applicationId', authenticate, authorizeRoles('hiring_manager'), getApplicationDetailsById);

/**
 * GET /api/applications/:id/report
 * Download ATS PDF report for an application
 * Protected - Only Hiring Managers (job creator)
 */
router.get('/:id/report', authenticate, authorizeRoles('hiring_manager'), downloadEvaluationReport);

/**
 * PATCH /api/applications/:id/status
 * Update application status
 * Protected - Only Hiring Managers (job creator)
 */
router.patch('/:id/status', authenticate, authorizeRoles('hiring_manager'), updateApplicationStatus);

module.exports = router;
