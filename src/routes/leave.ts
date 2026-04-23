import express from 'express';
import {
  getAllLeaves,
  getLeave,
  createLeave,
  approveLeave,
  rejectLeave,
  cancelLeave,
  getMyLeaves,
  getMyBalance
} from '../controllers/leaveController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAllLeaves)
  .post(createLeave);

router.get('/my-leaves', getMyLeaves);
router.get('/my-balance', getMyBalance);

router.get('/:id', getLeave);
router.put('/:id/approve', authorize('admin', 'manager'), approveLeave);
router.put('/:id/reject', authorize('admin', 'manager'), rejectLeave);
router.put('/:id/cancel', cancelLeave);

export default router;
