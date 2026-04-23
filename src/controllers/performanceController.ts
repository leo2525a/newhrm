import { Request, Response } from 'express';
import PerformanceReview from '../models/Performance';
import mongoose from 'mongoose';

// @desc    Create new performance review
// @route   POST /api/performance
// @access  Private/Manager or Admin
export const createReview = async (req: Request, res: Response) => {
  try {
    const { employeeId, reviewPeriod, reviewType, startDate, endDate, goals } = req.body;

    // Check if review already exists for this period
    const existingReview = await PerformanceReview.findOne({
      employeeId,
      reviewPeriod
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: `Performance review already exists for ${reviewPeriod}`
      });
    }

    const review = await PerformanceReview.create({
      employeeId,
      reviewPeriod,
      reviewType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      goals: goals || [],
      createdBy: req.user._id,
      status: 'draft'
    });

    const populatedReview = await review.populate(
      'employeeId',
      'firstName lastName email department position'
    );

    res.status(201).json({
      success: true,
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get all performance reviews
// @route   GET /api/performance
// @access  Private/Manager or Admin
export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as string;
    }
    if (req.query.reviewPeriod) {
      filter.reviewPeriod = req.query.reviewPeriod as string;
    }

    const reviews = await PerformanceReview.find(filter)
      .populate('employeeId', 'firstName lastName email department position')
      .populate('createdBy', 'firstName lastName')
      .populate('managerAssessment.submittedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await PerformanceReview.countDocuments(filter);

    res.json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get single performance review
// @route   GET /api/performance/:id
// @access  Private
export const getReview = async (req: Request, res: Response) => {
  try {
    const review = await PerformanceReview.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email department position employeeId')
      .populate('createdBy', 'firstName lastName')
      .populate('managerAssessment.submittedBy', 'firstName lastName');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    // Check permissions - employee can only see their own reviews
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      if (review.employeeId._id.toString() !== req.user.employeeId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this review'
        });
      }
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get my performance reviews
// @route   GET /api/performance/my-reviews
// @access  Private
export const getMyReviews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const reviews = await PerformanceReview.find({ employeeId })
      .populate('createdBy', 'firstName lastName')
      .populate('managerAssessment.submittedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await PerformanceReview.countDocuments({ employeeId });

    res.json({
      success: true,
      count: reviews.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Submit self assessment
// @route   PUT /api/performance/:id/self-assessment
// @access  Private (Employee)
export const submitSelfAssessment = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    // Check if employee owns this review
    if (review.employeeId.toString() !== req.user.employeeId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this review'
      });
    }

    if (review.status !== 'draft' && review.status !== 'self-assessment') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit self assessment at this stage (current status: ${review.status})`
      });
    }

    review.selfAssessment = {
      content,
      submittedAt: new Date()
    };
    review.status = 'manager-review';

    await review.save();

    const updatedReview = await PerformanceReview.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email department position')
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Self assessment submitted',
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Submit manager review
// @route   PUT /api/performance/:id/manager-review
// @access  Private (Manager/Admin)
export const submitManagerReview = async (req: Request, res: Response) => {
  try {
    const { content, rating, overallRating, strengths, areasForImprovement, developmentPlan } = req.body;
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    if (review.status !== 'manager-review') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit manager review at this stage (current status: ${review.status})`
      });
    }

    review.managerAssessment = {
      content,
      rating,
      submittedBy: req.user._id,
      submittedAt: new Date()
    };

    if (overallRating) review.overallRating = overallRating;
    if (strengths) review.strengths = strengths;
    if (areasForImprovement) review.areasForImprovement = areasForImprovement;
    if (developmentPlan) review.developmentPlan = developmentPlan;

    review.status = 'completed';
    review.completedAt = new Date();

    await review.save();

    const updatedReview = await PerformanceReview.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email department position')
      .populate('createdBy', 'firstName lastName')
      .populate('managerAssessment.submittedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Manager review submitted',
      data: updatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Update goal progress
// @route   PUT /api/performance/:id/goals/:goalId
// @access  Private
export const updateGoalProgress = async (req: Request, res: Response) => {
  try {
    const { progress, status, comments, achieved } = req.body;
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    // Find the goal
    const goalIndex = review.goals.findIndex(
      (g: any) => g._id.toString() === req.params.goalId
    );

    if (goalIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    // Update fields
    if (progress !== undefined) review.goals[goalIndex].progress = progress;
    if (status) review.goals[goalIndex].status = status;
    if (comments !== undefined) review.goals[goalIndex].comments = comments;
    if (achieved !== undefined) review.goals[goalIndex].achieved = achieved;

    await review.save();

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Update review
// @route   PUT /api/performance/:id
// @access  Private/Manager or Admin
export const updateReview = async (req: Request, res: Response) => {
  try {
    let review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    review = await PerformanceReview.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('employeeId', 'firstName lastName email department position')
      .populate('createdBy', 'firstName lastName');

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/performance/:id
// @access  Private/Admin
export const deleteReview = async (req: Request, res: Response) => {
  try {
    const review = await PerformanceReview.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found'
      });
    }

    await review.deleteOne();

    res.json({
      success: true,
      message: 'Performance review deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get performance statistics
// @route   GET /api/performance/stats
// @access  Private/Admin
export const getPerformanceStats = async (req: Request, res: Response) => {
  try {
    const totalReviews = await PerformanceReview.countDocuments();
    const completedReviews = await PerformanceReview.countDocuments({ status: 'completed' });
    const pendingSelfAssessment = await PerformanceReview.countDocuments({ status: 'self-assessment' });
    const pendingManagerReview = await PerformanceReview.countDocuments({ status: 'manager-review' });

    const averageRating = await PerformanceReview.aggregate([
      { $match: { overallRating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
    ]);

    const reviewsByRating = await PerformanceReview.aggregate([
      { $match: { overallRating: { $exists: true } } },
      { $group: { _id: '$overallRating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalReviews,
        completedReviews,
        pendingSelfAssessment,
        pendingManagerReview,
        averageRating: averageRating[0]?.avgRating || 0,
        reviewsByRating
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
