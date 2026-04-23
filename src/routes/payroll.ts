import express from 'express';
import {
  createPayroll,
  getAllPayrolls,
  getPayroll,
  updatePayroll,
  approvePayroll,
  markAsPaid,
  getMyPayrolls,
  generateDepartmentPayroll,
  getPayrollSummary
} from '../controllers/payrollController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllPayrolls)
  .post(authorize('admin'), createPayroll);

router.get('/my-payrolls', getMyPayrolls);
router.get('/summary/:payPeriod', authorize('admin'), getPayrollSummary);
router.post('/generate-department', authorize('admin'), generateDepartmentPayroll);

router
  .route('/:id')
  .get(getPayroll)
  .put(authorize('admin'), updatePayroll);

router.put('/:id/approve', authorize('admin'), approvePayroll);
router.put('/:id/mark-paid', authorize('admin'), markAsPaid);

export default router;
