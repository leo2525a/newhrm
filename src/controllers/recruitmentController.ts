import { Request, Response } from 'express';
import JobPosting from '../models/JobPosting';
import Applicant from '../models/Applicant';
import mongoose from 'mongoose';

// ============== Job Posting Controllers ==============

// @desc    Get all open job postings (public for careers page)
// @route   GET /api/recruitment/jobs
// @access  Public
export const getOpenJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await JobPosting.find({ status: 'open' })
      .select('-postedBy')
      .sort({ postedAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get all job postings (admin)
// @route   GET /api/recruitment/jobs/all
// @access  Private/Admin or Manager
export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.status) {
      filter.status = req.query.status as string;
    }
    if (req.query.department) {
      filter.department = req.query.department as string;
    }

    const jobs = await JobPosting.find(filter)
      .populate('postedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await JobPosting.countDocuments(filter);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get single job posting
// @route   GET /api/recruitment/jobs/:id
// @access  Public
export const getJob = async (req: Request, res: Response) => {
  try {
    const job = await JobPosting.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Create job posting
// @route   POST /api/recruitment/jobs
// @access  Private/Admin or Manager
export const createJob = async (req: Request, res: Response) => {
  try {
    const job = await JobPosting.create({
      ...req.body,
      postedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Update job posting
// @route   PUT /api/recruitment/jobs/:id
// @access  Private/Admin or Manager
export const updateJob = async (req: Request, res: Response) => {
  try {
    let job = await JobPosting.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/recruitment/jobs/:id
// @access  Private/Admin
export const deleteJob = async (req: Request, res: Response) => {
  try {
    const job = await JobPosting.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    // Also delete all applicants
    await Applicant.deleteMany({ jobPostingId: req.params.id });
    await job.deleteOne();

    res.json({
      success: true,
      message: 'Job posting deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// ============== Applicant Controllers ==============

// @desc    Submit job application (public)
// @route   POST /api/recruitment/applications
// @access  Public
export const createApplication = async (req: Request, res: Response) => {
  try {
    const { jobPostingId } = req.body;

    const job = await JobPosting.findById(jobPostingId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found'
      });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job posting is no longer open'
      });
    }

    // Check if applicant already applied with same email
    const existingApplication = await Applicant.findOne({
      jobPostingId,
      email: req.body.email
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position'
      });
    }

    const applicant = await Applicant.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        id: applicant._id,
        status: applicant.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get all applicants for a job
// @route   GET /api/recruitment/applications
// @access  Private/Admin or Manager
export const getAllApplicants = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.jobPostingId) {
      filter.jobPostingId = new mongoose.Types.ObjectId(req.query.jobPostingId as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as string;
    }

    const applicants = await Applicant.find(filter)
      .populate('jobPostingId', 'title department')
      .populate('notes.createdBy', 'firstName lastName')
      .populate('interviews.interviewer', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Applicant.countDocuments(filter);

    // Get status summary
    const statusSummary = await Applicant.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      count: applicants.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      statusSummary,
      data: applicants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get single applicant
// @route   GET /api/recruitment/applications/:id
// @access  Private/Admin or Manager
export const getApplicant = async (req: Request, res: Response) => {
  try {
    const applicant = await Applicant.findById(req.params.id)
      .populate('jobPostingId', 'title department location employmentType')
      .populate('notes.createdBy', 'firstName lastName')
      .populate('interviews.interviewer', 'firstName lastName email');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    res.json({
      success: true,
      data: applicant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Update applicant status
// @route   PUT /api/recruitment/applications/:id/status
// @access  Private/Admin or Manager
export const updateApplicantStatus = async (req: Request, res: Response) => {
  try {
    const { status, stage } = req.body;
    const applicant = await Applicant.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    applicant.status = status;
    if (stage !== undefined) {
      applicant.stage = stage;
    }

    if (req.body.note) {
      applicant.notes.push({
        content: req.body.note,
        createdBy: req.user._id,
        createdAt: new Date()
      });
    }

    await applicant.save();

    const updatedApplicant = await Applicant.findById(req.params.id)
      .populate('notes.createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedApplicant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Add interview to applicant
// @route   POST /api/recruitment/applications/:id/interview
// @access  Private/Admin or Manager
export const addInterview = async (req: Request, res: Response) => {
  try {
    const { date, interviewerId } = req.body;
    const applicant = await Applicant.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    applicant.interviews.push({
      date: new Date(date),
      interviewer: new mongoose.Types.ObjectId(interviewerId),
      status: 'scheduled'
    });

    applicant.status = 'interview';
    await applicant.save();

    const updatedApplicant = await Applicant.findById(req.params.id)
      .populate('interviews.interviewer', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Interview scheduled',
      data: updatedApplicant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Add note to applicant
// @route   POST /api/recruitment/applications/:id/note
// @access  Private/Admin or Manager
export const addNote = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const applicant = await Applicant.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found'
      });
    }

    applicant.notes.push({
      content,
      createdBy: req.user._id,
      createdAt: new Date()
    });

    await applicant.save();

    const updatedApplicant = await Applicant.findById(req.params.id)
      .populate('notes.createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedApplicant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get recruitment statistics
// @route   GET /api/recruitment/stats
// @access  Private/Admin
export const getRecruitmentStats = async (req: Request, res: Response) => {
  try {
    const totalJobs = await JobPosting.countDocuments();
    const openJobs = await JobPosting.countDocuments({ status: 'open' });
    const totalApplicants = await Applicant.countDocuments();

    const applicantsByStatus = await Applicant.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const jobsByStatus = await JobPosting.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const recentApplications = await Applicant.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('jobPostingId', 'title');

    res.json({
      success: true,
      data: {
        totalJobs,
        openJobs,
        totalApplicants,
        applicantsByStatus,
        jobsByStatus,
        recentApplications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};
