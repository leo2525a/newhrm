import express from 'express';
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getTodayAttendance,
  getAllAttendance,
  getMyAttendance,
  approveAttendance
} from '../controllers/attendanceController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.post('/break-start', startBreak);
router.post('/break-end', endBreak);
router.get('/today', getTodayAttendance);
router.get('/my-attendance', getMyAttendance);
router.get('/', getAllAttendance);
router.put('/:id/approve', authorize('admin', 'manager'), approveAttendance);

export default router;
