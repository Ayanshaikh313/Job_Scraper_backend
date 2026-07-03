const express = require('express');
const {
  applyToJob,
  getMyApplications,
  getJobApplicants,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/applications
 * Apply to a job
 * Protected - Only Students
 */
router.post('/', authenticate, authorizeRoles('student'), applyToJob);

/**
 * GET /api/applications/my
 * Get student's applications
 * Protected - Only Students
 * Query params: page, limit
 */
router.get('/my', authenticate, authorizeRoles('student'), getMyApplications);

/**
 * GET /api/applications/job/:jobId
 * Get applicants for a job
 * Protected - Only Hiring Managers (job creator)
 * Query params: page, limit
 */
router.get('/job/:jobId', authenticate, authorizeRoles('hiring_manager'), getJobApplicants);

/**
 * PATCH /api/applications/:id/status
 * Update application status
 * Protected - Only Hiring Managers (job creator)
 */
router.patch('/:id/status', authenticate, authorizeRoles('hiring_manager'), updateApplicationStatus);

module.exports = router;
