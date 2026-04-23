import { Request, Response } from 'express';
import Payroll from '../models/Payroll';
import Employee from '../models/Employee';
import mongoose from 'mongoose';

// HK MPF calculation (employer and employee each contribute 5% up to HKD 1500 cap)
const calculateMPF = (relevantIncome: number): number => {
  const contributionRate = 0.05;
  const maxContribution = 1500;
  const calculated = relevantIncome * contributionRate;
  return Math.min(calculated, maxContribution);
};

// @desc    Create payroll record
// @route   POST /api/payroll
// @access  Private/Admin
export const createPayroll = async (req: Request, res: Response) => {
  try {
    const {
      employeeId,
      payPeriod,
      payDate,
      baseSalary,
      additions = [],
      deductions = [],
      includeMPF = true,
      notes
    } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if payroll already exists for this period
    const existingPayroll = await Payroll.findOne({ employeeId, payPeriod });
    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: `Payroll already exists for ${payPeriod}`
      });
    }

    const payrollData = {
      employeeId,
      payPeriod,
      payDate: new Date(payDate),
      baseSalary,
      additions,
      deductions,
      notes,
      createdBy: req.user._id
    };

    // Auto-calculate MPF if requested
    if (includeMPF) {
      const mpfAmount = calculateMPF(baseSalary);
      deductions.push({
        name: 'Mandatory Provident Fund',
        amount: mpfAmount,
        type: 'mpf'
      });
    }

    const payroll = await Payroll.create(payrollData);

    const populatedPayroll = await payroll.populate(
      'employeeId',
      'firstName lastName email department position salary'
    );

    res.status(201).json({
      success: true,
      data: populatedPayroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get all payrolls
// @route   GET /api/payroll
// @access  Private/Admin
export const getAllPayrolls = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.query.payPeriod) {
      filter.payPeriod = req.query.payPeriod as string;
    }
    if (req.query.status) {
      filter.status = req.query.status as string;
    }
    if (req.query.employeeId) {
      filter.employeeId = new mongoose.Types.ObjectId(req.query.employeeId as string);
    }

    const payrolls = await Payroll.find(filter)
      .populate('employeeId', 'firstName lastName department')
      .populate('approvedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ payDate: -1 });

    const total = await Payroll.countDocuments(filter);

    res.json({
      success: true,
      count: payrolls.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get single payroll
// @route   GET /api/payroll/:id
// @access  Private
export const getPayroll = async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'firstName lastName email department position employeeId address bankDetails')
      .populate('approvedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    // Check permissions - only admin or the employee themselves
    if (req.user.role !== 'admin' && payroll.employeeId._id.toString() !== req.user.employeeId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payroll'
      });
    }

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Update payroll
// @route   PUT /api/payroll/:id
// @access  Private/Admin
export const updatePayroll = async (req: Request, res: Response) => {
  try {
    let payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    if (payroll.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update already paid payroll'
      });
    }

    payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('employeeId', 'firstName lastName department');

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Approve payroll
// @route   PUT /api/payroll/:id/approve
// @access  Private/Admin
export const approvePayroll = async (req: Request, res: Response) => {
  try {
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    if (payroll.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Payroll is already ${payroll.status}`
      });
    }

    payroll.status = 'approved';
    payroll.approvedBy = req.user._id;
    await payroll.save();

    const updatedPayroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'firstName lastName department')
      .populate('approvedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedPayroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Mark as paid
// @route   PUT /api/payroll/:id/mark-paid
// @access  Private/Admin
export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.body;
    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found'
      });
    }

    if (payroll.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Payroll must be approved first'
      });
    }

    payroll.status = 'paid';
    payroll.paidAt = new Date();
    if (transactionId) {
      payroll.transactionId = transactionId;
    }
    await payroll.save();

    res.json({
      success: true,
      data: payroll
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get my payrolls
// @route   GET /api/payroll/my-payrolls
// @access  Private
export const getMyPayrolls = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;
    const employeeId = req.user.employeeId;

    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked'
      });
    }

    const payrolls = await Payroll.find({ employeeId })
      .skip(skip)
      .limit(limit)
      .sort({ payDate: -1 });

    const total = await Payroll.countDocuments({ employeeId });

    res.json({
      success: true,
      count: payrolls.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: payrolls
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Generate payroll for entire department
// @route   POST /api/payroll/generate-department
// @access  Private/Admin
export const generateDepartmentPayroll = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { department, payPeriod, payDate } = req.body;

    const employees = await Employee.find({
      department,
      status: 'active'
    }).session(session);

    if (employees.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'No active employees found in this department'
      });
    }

    const createdPayrolls = [];

    for (const employee of employees) {
      // Check if already exists
      const existing = await Payroll.findOne({
        employeeId: employee._id,
        payPeriod
      }).session(session);

      if (existing) {
        continue; // Skip if already exists
      }

      const mpfAmount = calculateMPF(employee.salary);

      const payroll = await Payroll.create(
        [
          {
            employeeId: employee._id,
            payPeriod,
            payDate: new Date(payDate),
            baseSalary: employee.salary,
            additions: [],
            deductions: [
              {
                name: 'Mandatory Provident Fund',
                amount: mpfAmount,
                type: 'mpf'
              }
            ],
            createdBy: req.user._id
          }
        ],
        { session }
      );

      createdPayrolls.push(payroll[0]);
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: `Generated ${createdPayrolls.length} payrolls`,
      data: createdPayrolls
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

// @desc    Get payroll summary by period
// @route   GET /api/payroll/summary/:payPeriod
// @access  Private/Admin
export const getPayrollSummary = async (req: Request, res: Response) => {
  try {
    const { payPeriod } = req.params;

    const summary = await Payroll.aggregate([
      { $match: { payPeriod } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalNetPay: { $sum: '$netPay' },
          totalGrossPay: { $sum: '$grossPay' },
          totalMPF: { $sum: '$mpfContribution' }
        }
      }
    ]);

    const totalStats = await Payroll.aggregate([
      { $match: { payPeriod } },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalNetPayAll: { $sum: '$netPay' },
          totalGrossPayAll: { $sum: '$grossPay' },
          totalMPFAll: { $sum: '$mpfContribution' }
        }
      }
    ]);

    res.json({
      success: true,
      payPeriod,
      byStatus: summary,
      total: totalStats[0] || null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};
