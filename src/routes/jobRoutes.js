const express = require('express');
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/jobs
 * Create a new job
 * Protected - Only Hiring Managers
 */
router.post('/', authenticate, authorizeRoles('hiring_manager'), createJob);

/**
 * GET /api/jobs
 * Get all jobs with optional filters
 * Protected - All authenticated users
 * Query params: search, location, employmentType, page, limit
 */
router.get('/', authenticate, getAllJobs);

/**
 * GET /api/jobs/:id
 * Get single job by ID
 * Protected - All authenticated users
 */
router.get('/:id', authenticate, getJobById);

/**
 * PUT /api/jobs/:id
 * Update a job
 * Protected - Only Hiring Managers who created the job
 */
router.put('/:id', authenticate, authorizeRoles('hiring_manager'), updateJob);

/**
 * DELETE /api/jobs/:id
 * Delete a job
 * Protected - Only Hiring Managers who created the job
 */
router.delete('/:id', authenticate, authorizeRoles('hiring_manager'), deleteJob);

module.exports = router;
