import express from 'express';
import {
  getEmployeeReport,
  getHeadcountByDepartment,
  getTurnoverReport,
  getLeaveReport,
  getAttendanceReport,
  getPayrollReport,
  getDashboardOverview
} from '../controllers/reportController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/employees', getEmployeeReport);
router.get('/headcount', getHeadcountByDepartment);
router.get('/turnover', getTurnoverReport);
router.get('/leave', getLeaveReport);
router.get('/attendance', getAttendanceReport);
router.get('/payroll', getPayrollReport);
router.get('/dashboard', getDashboardOverview);

export default router;
