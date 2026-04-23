import express from 'express';
import {
  createReview,
  getAllReviews,
  getReview,
  getMyReviews,
  submitSelfAssessment,
  submitManagerReview,
  updateGoalProgress,
  updateReview,
  deleteReview,
  getPerformanceStats
} from '../controllers/performanceController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getAllReviews)
  .post(authorize('admin', 'manager'), createReview);

router.get('/my-reviews', getMyReviews);
router.get('/stats', authorize('admin'), getPerformanceStats);

router
  .route('/:id')
  .get(getReview)
  .put(authorize('admin', 'manager'), updateReview)
  .delete(authorize('admin'), deleteReview);

router.put('/:id/self-assessment', submitSelfAssessment);
router.put('/:id/manager-review', authorize('admin', 'manager'), submitManagerReview);
router.put('/:id/goals/:goalId', updateGoalProgress);

export default router;
