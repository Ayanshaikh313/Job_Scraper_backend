const Application = require('../models/Application');
const Job = require('../models/Job');

/**
 * Apply to a job
 * POST /api/applications
 * Protected - Only Students
 */
const applyToJob = async (req, res, next) => {
  try {
    const { jobId } = req.body;
    const studentId = req.userId;

    // Validation
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a job ID',
      });
    }

    // Validate job exists
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if already applied
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

    // Create application
    const application = await Application.create({
      studentId,
      jobId,
      status: 'Applied',
      appliedAt: new Date(),
    });

    // Populate details
    await application.populate('studentId', 'name email');
    await application.populate('jobId', 'title company location');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    // Handle duplicate key error
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

    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get applications
    const applications = await Application.find({ studentId })
      .populate('jobId', 'title company location salary employmentType')
      .populate('studentId', 'name email')
      .sort({ appliedAt: -1 })
      .limit(limit)
      .skip(skip);

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

    // Validate job exists
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the job creator
    if (job.createdBy.toString() !== hiringManagerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view applicants for this job',
      });
    }

    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get applicants for the job
    const applications = await Application.find({ jobId })
      .populate('studentId', 'name email')
      .populate('jobId', 'title company')
      .sort({ appliedAt: -1 })
      .limit(limit)
      .skip(skip);

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
 * Update application status
 * PATCH /api/applications/:id/status
 * Protected - Only Hiring Managers (job creator)
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const hiringManagerId = req.userId;

    // Validation
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status',
      });
    }

    // Validate status value
    const validStatuses = ['Applied', 'Reviewing', 'Rejected', 'Accepted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // Find application
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Find job to check creator
    const job = await Job.findById(application.jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the job creator
    if (job.createdBy.toString() !== hiringManagerId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this application status',
      });
    }

    // Update application status
    application.status = status;
    await application.save();

    // Populate details for response
    await application.populate('studentId', 'name email');
    await application.populate('jobId', 'title company');

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
  updateApplicationStatus,
};
