const Job = require('../models/Job');

/**
 * Create a new job
 * POST /api/jobs
 * Protected - Only Hiring Managers
 */
const createJob = async (req, res, next) => {
  try {
    const { title, company, location, description, salary, employmentType, screeningQuestions } = req.body;
    console.log(
      "CREATE JOB BODY:",
      JSON.stringify(req.body, null, 2)
    );
    // Validation
    if (!title || !company || !location || !description || !salary || !employmentType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Validate employment type
    const validEmploymentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'];
    if (!validEmploymentTypes.includes(employmentType)) {
      return res.status(400).json({
        success: false,
        message: `Employment type must be one of: ${validEmploymentTypes.join(', ')}`,
      });
    }

    // Create job with creator ID from JWT token
    const job = await Job.create({
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      description,
      salary: salary.trim(),
      employmentType,
      screeningQuestions: screeningQuestions || [],
      createdBy: req.userId,
    });

    // Populate creator details
    await job.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all jobs
 * GET /api/jobs
 * Protected - All authenticated users
 * Optional query: search, location, employmentType
 */
const getAllJobs = async (req, res, next) => {
  try {
    const { search, location, employmentType } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (employmentType) {
      filter.employmentType = employmentType;
    }

    // Get jobs with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const jobs = await Job.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Job.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: jobs,
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
 * Get single job by ID
 * GET /api/jobs/:id
 * Protected - All authenticated users
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id).populate('createdBy', 'name email');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Job retrieved successfully',
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a job
 * PUT /api/jobs/:id
 * Protected - Only Hiring Managers who created the job
 */
const updateJob = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, company, location, description, salary, employmentType, screeningQuestions } = req.body;

    // Validation - at least one field required
    if (!title && !company && !location && !description && !salary && !employmentType && !screeningQuestions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one field to update',
      });
    }

    // Find job
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the creator
    if (job.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this job',
      });
    }

    // Validate employment type if provided
    if (employmentType) {
      const validEmploymentTypes = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'];
      if (!validEmploymentTypes.includes(employmentType)) {
        return res.status(400).json({
          success: false,
          message: `Employment type must be one of: ${validEmploymentTypes.join(', ')}`,
        });
      }
    }

    // Build update object
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (company) updateData.company = company.trim();
    if (location) updateData.location = location.trim();
    if (description) updateData.description = description;
    if (salary) updateData.salary = salary.trim();
    if (employmentType) updateData.employmentType = employmentType;
    if (screeningQuestions) updateData.screeningQuestions = screeningQuestions;

    // Update job
    const updatedJob = await Job.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a job
 * DELETE /api/jobs/:id
 * Protected - Only Hiring Managers who created the job
 */
const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find job
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if user is the creator
    if (job.createdBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this job',
      });
    }

    // Delete job
    await Job.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
};
