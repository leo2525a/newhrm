import express from 'express';
import {
  getEmployeeDocuments,
  getMyDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getAllDocuments,
  getExpiringDocuments,
  uploadNewVersion
} from '../controllers/documentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('admin', 'manager'), getAllDocuments)
  .post(authorize('admin', 'manager'), createDocument);

router.get('/my-documents', getMyDocuments);
router.get('/employee/:employeeId', getEmployeeDocuments);
router.get('/expiring/:days', authorize('admin', 'manager'), getExpiringDocuments);

router
  .route('/:id')
  .get(getDocument)
  .put(authorize('admin', 'manager'), updateDocument)
  .delete(authorize('admin'), deleteDocument);

router.put('/:id/new-version', authorize('admin', 'manager'), uploadNewVersion);

export default router;
