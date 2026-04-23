import express from 'express';
import {
  getOpenJobs,
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  createApplication,
  getAllApplicants,
  getApplicant,
  updateApplicantStatus,
  addInterview,
  addNote,
  getRecruitmentStats
} from '../controllers/recruitmentController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/jobs', getOpenJobs);
router.get('/jobs/:id', getJob);
router.post('/applications', createApplication);

// Protected routes
router.use(protect);

router.get('/jobs/all', authorize('admin', 'manager'), getAllJobs);
router
  .route('/jobs')
  .post(authorize('admin', 'manager'), createJob);

router
  .route('/jobs/:id')
  .put(authorize('admin', 'manager'), updateJob)
  .delete(authorize('admin'), deleteJob);

router.get('/applications', authorize('admin', 'manager'), getAllApplicants);
router.get('/applications/:id', authorize('admin', 'manager'), getApplicant);
router.put('/applications/:id/status', authorize('admin', 'manager'), updateApplicantStatus);
router.post('/applications/:id/interview', authorize('admin', 'manager'), addInterview);
router.post('/applications/:id/note', authorize('admin', 'manager'), addNote);
router.get('/stats', authorize('admin'), getRecruitmentStats);

export default router;
