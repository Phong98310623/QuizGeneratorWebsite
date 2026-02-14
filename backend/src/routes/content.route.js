const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/stats', protect, requireAdmin, contentController.getStats);
router.get('/sets', protect, requireAdmin, contentController.getQuestionSets);
router.get('/sets/:id/questions', protect, requireAdmin, contentController.getQuestionsBySet);
router.get('/sets/:id', protect, requireAdmin, contentController.getSetById);
router.get('/questions', protect, requireAdmin, contentController.getQuestions);
router.get('/questions/:id', protect, requireAdmin, contentController.getQuestionById);

// Admin thao tác trực tiếp trên nội dung
router.patch(
  '/sets/:id/verify',
  protect,
  requireAdmin,
  contentController.updateQuestionSetVerify
);

router.patch(
  '/questions/:id/verify',
  protect,
  requireAdmin,
  contentController.updateQuestionVerify
);
router.patch(
  '/questions/:id/archive',
  protect,
  requireAdmin,
  contentController.updateQuestionArchive
);
router.patch(
  '/questions/:id/review',
  protect,
  requireAdmin,
  contentController.reviewQuestion
);
router.patch(
  '/questions/:id',
  protect,
  requireAdmin,
  contentController.updateQuestion
);

module.exports = router;
