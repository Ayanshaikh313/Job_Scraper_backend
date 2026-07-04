const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide student ID'],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Please provide job ID'],
    },
    status: {
      type: String,
      enum: ['Applied', 'Reviewing', 'Rejected', 'Accepted'],
      default: 'Applied',
      required: true,
    },
    resumeUrl: {
      type: String,
      required: false,
    },
    answers: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
      },
    ],
    resumeText: {
      type: String,
      default: '',
    },
    resumeMetadata: {
      wordCount: {
        type: Number,
        default: 0,
      },
      characterCount: {
        type: Number,
        default: 0,
      },
      pageCount: {
        type: Number,
        default: 0,
      },
      parsedAt: {
        type: Date,
      },
    },
    extractedSkills: {
      frontend: {
        type: [String],
        default: [],
      },
      backend: {
        type: [String],
        default: [],
      },
      database: {
        type: [String],
        default: [],
      },
      cloud: {
        type: [String],
        default: [],
      },
      tools: {
        type: [String],
        default: [],
      },
      all: {
        type: [String],
        default: [],
      },
    },
    atsEvaluation: {
      totalScore: {
        type: Number,
        default: 0,
      },
      recommendation: {
        type: String,
        default: 'Weak Match',
      },
      matchedSkills: {
        type: [String],
        default: [],
      },
      missingSkills: {
        type: [String],
        default: [],
      },
      jobSkills: {
        frontend: {
          type: [String],
          default: [],
        },
        backend: {
          type: [String],
          default: [],
        },
        database: {
          type: [String],
          default: [],
        },
        cloud: {
          type: [String],
          default: [],
        },
        tools: {
          type: [String],
          default: [],
        },
        all: {
          type: [String],
          default: [],
        },
      },
      keywordAnalysis: {
        matchedKeywords: {
          type: [String],
          default: [],
        },
        missingKeywords: {
          type: [String],
          default: [],
        },
        keywordMatchPercentage: {
          type: Number,
          default: 0,
        },
      },
      experienceAnalysis: {
        requiredYears: {
          type: Number,
          default: 0,
        },
        candidateYears: {
          type: Number,
          default: 0,
        },
        experienceMatchPercentage: {
          type: Number,
          default: 0,
        },
      },
      educationAnalysis: {
        requiredEducation: {
          type: String,
          default: 'Not specified',
        },
        candidateEducation: {
          type: String,
          default: 'Not Found',
        },
        educationMatchPercentage: {
          type: Number,
          default: 0,
        },
      },
      resumeQualityScore: {
        type: Number,
        default: 0,
      },
      scoreBreakdown: {
        keywordMatch: {
          type: Number,
          default: 0,
        },
        skillsMatch: {
          type: Number,
          default: 0,
        },
        experienceMatch: {
          type: Number,
          default: 0,
        },
        educationMatch: {
          type: Number,
          default: 0,
        },
        resumeQuality: {
          type: Number,
          default: 0,
        },
      },
      evaluatedAt: {
        type: Date,
      },
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index to prevent duplicate applications (unique constraint on studentId + jobId)
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
