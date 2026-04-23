import { Request, Response } from 'express';
import Attendance from '../models/Attendance';
import mongoose from 'mongoose';

// Helper to get start and end of day
const getDayRange = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @desc    Clock in
// @route   POST /api/attendance/clock-in
// @access  Private
export const clockIn = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, deviceInfo } = req.body;
    const today = new Date();
    const { start, end } = getDayRange(today);

    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    // Check if already clocked in today
    let attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    if (attendance && attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today'
      });
    }

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: today,
        status: 'pending'
      });
    }

    attendance.clockIn = {
      time: new Date(),
      latitude,
      longitude,
      deviceInfo
    };

    await attendance.save();

    res.json({
      success: true,
      message: 'Clocked in successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Clock out
// @route   POST /api/attendance/clock-out
// @access  Private
export const clockOut = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, deviceInfo } = req.body;
    const today = new Date();
    const { start, end } = getDayRange(today);

    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Not clocked in today'
      });
    }

    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today'
      });
    }

    attendance.clockOut = {
      time: new Date(),
      latitude,
      longitude,
      deviceInfo
    };

    await attendance.save();

    res.json({
      success: true,
      message: `Clocked out successfully. Working hours: ${attendance.workingHours.toFixed(2)}`,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Start break
// @route   POST /api/attendance/break-start
// @access  Private
export const startBreak = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const { start, end } = getDayRange(today);
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    if (!attendance || !attendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Must clock in first'
      });
    }

    if (attendance.breakStart && !attendance.breakEnd) {
      return res.status(400).json({
        success: false,
        message: 'Break already in progress'
      });
    }

    attendance.breakStart = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: 'Break started',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    End break
// @route   POST /api/attendance/break-end
// @access  Private
export const endBreak = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const { start, end } = getDayRange(today);
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    });

    if (!attendance || !attendance.breakStart) {
      return res.status(400).json({
        success: false,
        message: 'No break in progress'
      });
    }

    attendance.breakEnd = new Date();
    await attendance.save();

    res.json({
      success: true,
      message: `Break ended. Break duration: ${attendance.breakDuration.toFixed(2)} hours`,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get my attendance for today
// @route   GET /api/attendance/today
// @access  Private
export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const { start, end } = getDayRange(today);
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const attendance = await Attendance.findOne({
      employeeId,
      date: { $gte: start, $lte: end }
    }).populate('employeeId', 'firstName lastName');

    res.json({
      success: true,
      data: attendance || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get all attendance records
// @route   GET /api/attendance
// @access  Private
export const getAllAttendance = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
    }
    if (req.query.status) {
      filter.status = req.query.status as string;
    }
    if (req.query.approved !== undefined) {
      filter.approved = req.query.approved === 'true';
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string)
      };
    }

    const attendance = await Attendance.find(filter)
      .populate('employeeId', 'firstName lastName department employeeId')
      .populate('approvedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      count: attendance.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get my attendance history
// @route   GET /api/attendance/my-attendance
// @access  Private
export const getMyAttendance = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const filter: any = { employeeId };

    if (req.query.startDate && req.query.endDate) {
      filter.date = {
        $gte: new Date(req.query.startDate as string),
        $lte: new Date(req.query.endDate as string)
      };
    }

    const attendance = await Attendance.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 });

    const total = await Attendance.countDocuments(filter);

    // Calculate summary
    const summary = await Attendance.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalWorkingDays: { $sum: { $cond: [{ $eq: ['$status', 'complete'] }, 1, 0] } },
          totalHalfDays: { $sum: { $cond: [{ $eq: ['$status', 'half-day'] }, 1, 0] } },
          totalAbsent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          totalWorkingHours: { $sum: '$workingHours' }
        }
      }
    ]);

    res.json({
      success: true,
      count: attendance.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      summary: summary[0] || null,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Approve attendance
// @route   PUT /api/attendance/:id/approve
// @access  Private/Manager or Admin
export const approveAttendance = async (req: Request, res: Response) => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    attendance.approved = true;
    attendance.approvedBy = req.user._id;
    await attendance.save();

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};
