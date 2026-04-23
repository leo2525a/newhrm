import { Request, Response } from 'express';
import Leave from '../models/Leave';
import LeaveBalance from '../models/LeaveBalance';
import mongoose from 'mongoose';

// @desc    Get all leave requests
// @route   GET /api/leave
// @access  Private
export const getAllLeaves = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    if (req.query.status) {
      filter.status = req.query.status as string;
    }
    
    if (req.query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
    }

    const leaves = await Leave.find(filter)
      .populate('employeeId', 'firstName lastName department')
      .populate('approvedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Leave.countDocuments(filter);

    res.json({
      success: true,
      count: leaves.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get leave by ID
// @route   GET /api/leave/:id
// @access  Private
export const getLeave = async (req: Request, res: Response) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email department phone')
      .populate('approvedBy', 'firstName lastName');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Create new leave request
// @route   POST /api/leave
// @access  Private
export const createLeave = async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveType, startDate, endDate, halfDay, reason } = req.body;

    const leave = await Leave.create({
      employeeId: employeeId || req.user.employeeId,
      leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      halfDay: halfDay || false,
      reason,
      status: 'pending'
    });

    const populatedLeave = await leave.populate('employeeId', 'firstName lastName department');

    res.status(201).json({
      success: true,
      data: populatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Approve leave
// @route   PUT /api/leave/:id/approve
// @access  Private/Manager or Admin
export const approveLeave = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`
      });
    }

    // Update leave status
    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.comments = req.body.comments;
    await leave.save({ session });

    // Update leave balance for paid leave types
    if (leave.leaveType !== 'unpaid') {
      const year = leave.startDate.getFullYear();
      
      let balance = await LeaveBalance.findOne({
        employeeId: leave.employeeId,
        year,
        leaveType: leave.leaveType
      }).session(session);

      if (!balance) {
        // Create default balance if not exists
        // Default entitlements based on HK standards
        const defaultEntitlements: any = {
          annual: 14,
          sick: 12,
          casual: 2,
          maternity: 14 * 4, // 14 weeks
          paternity: 5,
          other: 0
        };

        balance = new LeaveBalance({
          employeeId: leave.employeeId,
          year,
          leaveType: leave.leaveType,
          entitlement: defaultEntitlements[leave.leaveType] || 0,
          used: 0,
          carriedForward: 0
        });
      }

      balance.used += leave.numberOfDays;
      await balance.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const updatedLeave = await Leave.findById(req.params.id)
      .populate('employeeId', 'firstName lastName department')
      .populate('approvedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedLeave
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Reject leave
// @route   PUT /api/leave/:id/reject
// @access  Private/Manager or Admin
export const rejectLeave = async (req: Request, res: Response) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Leave already ${leave.status}`
      });
    }

    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.approvedAt = new Date();
    leave.rejectionReason = req.body.rejectionReason || '';

    await leave.save();

    const updatedLeave = await Leave.findById(req.params.id)
      .populate('employeeId', 'firstName lastName department')
      .populate('approvedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedLeave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Cancel leave (by employee)
// @route   PUT /api/leave/:id/cancel
// @access  Private
export const cancelLeave = async (req: Request, res: Response) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if leave belongs to the employee
    if (leave.employeeId.toString() !== req.user.employeeId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this leave'
      });
    }

    if (leave.status === 'approved' || leave.status === 'rejected') {
      // If already approved, we need to refund the balance
      if (leave.status === 'approved' && leave.leaveType !== 'unpaid') {
        const year = leave.startDate.getFullYear();
        await LeaveBalance.findOneAndUpdate(
          {
            employeeId: leave.employeeId,
            year,
            leaveType: leave.leaveType
          },
          { $inc: { used: -leave.numberOfDays } }
        );
      }
    }

    leave.status = 'cancelled';
    await leave.save();

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get my leave requests
// @route   GET /api/leave/my-leaves
// @access  Private
export const getMyLeaves = async (req: Request, res: Response) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user'
      });
    }

    const leaves = await Leave.find({ employeeId: req.user.employeeId })
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get my leave balance
// @route   GET /api/leave/my-balance
// @access  Private
export const getMyBalance = async (req: Request, res: Response) => {
  try {
    if (!req.user.employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user'
      });
    }

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    
    const balances = await LeaveBalance.find({
      employeeId: req.user.employeeId,
      year
    });

    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};
