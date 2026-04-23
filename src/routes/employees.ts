import express from 'express';
import {
  getAllEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment
} from '../controllers/employeeController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllEmployees)
  .post(authorize('admin', 'manager'), createEmployee);

router
  .route('/:id')
  .get(getEmployee)
  .put(authorize('admin', 'manager'), updateEmployee)
  .delete(authorize('admin'), deleteEmployee);

router.get('/department/:department', getEmployeesByDepartment);

export default router;
