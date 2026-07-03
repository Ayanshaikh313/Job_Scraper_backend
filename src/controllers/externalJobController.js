const { fetchExternalJobs } = require('../services/externalJobService');

/**
 * Get external jobs from RemoteOK and Arbeitnow
 * GET /api/jobs/external
 * Protected - All authenticated users
 */
const getExternalJobs = async (req, res, next) => {
  try {
    const { search } = req.query;

    // Fetch jobs from external sources
    const jobs = await fetchExternalJobs(search || '');

    res.status(200).json({
      success: true,
      message: 'External jobs retrieved successfully',
      data: jobs,
      count: jobs.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExternalJobs,
};
