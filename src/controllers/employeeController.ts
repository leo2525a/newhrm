import { Request, Response } from 'express';
import Employee from '../models/Employee';
import User from '../models/User';

// @desc    Get all employees
// @route   GET /api/employees
// @access  Private
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter: any = {};
    if (req.query.department) {
      filter.department = req.query.department as string;
    }
    if (req.query.status) {
      filter.status = req.query.status as string;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    const employees = await Employee.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(filter);

    res.json({
      success: true,
      count: employees.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
// @access  Private
export const getEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Create new employee
// @route   POST /api/employees
// @access  Private/Admin or Manager
export const createEmployee = async (req: Request, res: Response) => {
  try {
    // Check if employee with this email already exists
    const existingEmployee = await Employee.findOne({ email: req.body.email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Generate employee ID (EMP-YYYY-MM-XXXX)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await Employee.countDocuments();
    const employeeId = `EMP-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    const employeeData = {
      ...req.body,
      employeeId,
      createdBy: req.user._id
    };

    const employee = await Employee.create(employeeData);

    // If email is provided, create a user account
    if (req.body.email && req.body.createUserAccount) {
      const password = req.body.password || Math.random().toString(36).slice(-8);
      await User.create({
        email: employee.email,
        password,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: req.body.role || 'employee',
        employeeId: employee._id
      });
    }

    res.status(201).json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
// @access  Private/Admin or Manager
export const updateEmployee = async (req: Request, res: Response) => {
  try {
    let employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
// @access  Private/Admin
export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Deactivate user account if exists
    await User.findOneAndUpdate({ employeeId: req.params.id }, { isActive: false });

    await employee.deleteOne();

    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};

// @desc    Get employees by department
// @route   GET /api/employees/department/:department
// @access  Private
export const getEmployeesByDepartment = async (req: Request, res: Response) => {
  try {
    const employees = await Employee.find({
      department: req.params.department,
      status: 'active'
    });

    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: (error as Error).message
    });
  }
};
