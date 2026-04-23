import { Request, Response } from 'express';
import Employee from '../models/Employee';
import Leave from '../models/Leave';
import Attendance from '../models/Attendance';
import Payroll from '../models/Payroll';
import {
  calculateHeadcountByDepartment,
  calculateTurnoverRate,
  calculateAbsenceRate,
  generateEmployeeReport,
  generatePayrollSummary
} from '../utils/reports';
import mongoose from 'mongoose';

// @desc    Get employee report
// @route   GET /api/reports/employees
// @access  Private/Admin
export const getEmployeeReport = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({});
    const report = generateEmployeeReport(employees);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get headcount by department
// @route   GET /api/reports/headcount
// @access  Private/Admin
export const getHeadcountByDepartment = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({ status: 'active' });
    const headcount = calculateHeadcountByDepartment(employees);

    const result = Object.entries(headcount).map(([department, count]) => ({
      department,
      count
    }));

    res.json({
      success: true,
      total: employees.length,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get turnover report
// @route   GET /api/reports/turnover
// @access  Private/Admin
export const getTurnoverReport = async (req: Request, res: Response) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const terminatedEmployees = await Employee.countDocuments({
      status: 'terminated',
      endDate: { $gte: startDate }
    });

    const turnoverRate = calculateTurnoverRate(totalEmployees, terminatedEmployees, months);

    res.json({
      success: true,
      periodMonths: months,
      totalEmployees,
      terminatedInPeriod: terminatedEmployees,
      turnoverRatePercent: turnoverRate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get leave report
// @route   GET /api/reports/leave
// @access  Private/Admin
export const getLeaveReport = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), 0, 1);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const filter: any = {
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (req.query.status) {
      filter.status = req.query.status as string;
    }

    const leaves = await Leave.find(filter).populate('employeeId', 'department');

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    let totalDays = 0;

    leaves.forEach(leave => {
      byType[leave.leaveType] = (byType[leave.leaveType] || 0) + leave.numberOfDays;
      byStatus[leave.status] = (byStatus[leave.status] || 0) + 1;
      totalDays += leave.numberOfDays;

      if (leave.employeeId && typeof leave.employeeId !== 'string' && 'department' in leave.employeeId) {
        byDepartment[(leave.employeeId as any).department] =
          (byDepartment[(leave.employeeId as any).department] || 0) + leave.numberOfDays;
      }
    });

    res.json({
      success: true,
      period: {
        startDate,
        endDate
      },
      totalRequests: leaves.length,
      totalDays,
      byType,
      byStatus,
      byDepartment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get attendance report
// @route   GET /api/reports/attendance
// @access  Private/Admin
export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : new Date();

    const filter: any = {
      date: { $gte: startDate, $lte: endDate }
    };

    if (req.query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
    }

    const attendance = await Attendance.find(filter).populate('employeeId', 'department');

    const byStatus: Record<string, number> = {};
    let totalWorkingHours = 0;
    let totalRecords = attendance.length;

    attendance.forEach(record => {
      byStatus[record.status] = (byStatus[record.status] || 0) + 1;
      totalWorkingHours += record.workingHours;
    });

    // Calculate absence rate
    const totalWorkingDays = attendance.length;
    const absentDays = byStatus['absent'] || 0;
    const absenceRate = calculateAbsenceRate(totalWorkingDays, absentDays);

    res.json({
      success: true,
      period: { startDate, endDate },
      totalRecords,
      totalWorkingHours: parseFloat(totalWorkingHours.toFixed(2)),
      byStatus,
      absenceRatePercent: parseFloat(absenceRate.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get payroll report
// @route   GET /api/reports/payroll
// @access  Private/Admin
export const getPayrollReport = async (req: Request, res: Response) => {
  try {
    const payPeriod = req.query.payPeriod as string;

    const filter: any = {};
    if (payPeriod) {
      filter.payPeriod = payPeriod;
    }

    const payrolls = await Payroll.find(filter);
    const summary = generatePayrollSummary(payrolls);

    res.json({
      success: true,
      payPeriod,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get dashboard overview
// @route   GET /api/reports/dashboard
// @access  Private/Admin
export const getDashboardOverview = async (req: Request, res: Response) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const pendingApprovalAttendance = await Attendance.countDocuments({ approved: false });
    const draftPayrolls = await Payroll.countDocuments({ status: 'draft' });
    const openJobs = await mongoose.connection.collection('jobpostings').countDocuments({ status: 'open' });
    const newApplications = await mongoose.connection.collection('applicants').countDocuments({ status: 'new' });

    // Recent new hires (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newHires = await Employee.countDocuments({
      startDate: { $gte: thirtyDaysAgo },
      status: 'active'
    });

    // Headcount by department
    const activeEmployees = await Employee.find({ status: 'active' });
    const headcountByDepartment = calculateHeadcountByDepartment(activeEmployees);

    res.json({
      success: true,
      data: {
        totalActiveEmployees: totalEmployees,
        pendingLeaveApprovals: pendingLeaves,
        pendingAttendanceApprovals: pendingApprovalAttendance,
        draftPayrolls: draftPayrolls,
        openJobPostings: openJobs,
        newApplications: newApplications,
        newHiresLast30Days: newHires,
        headcountByDepartment
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
