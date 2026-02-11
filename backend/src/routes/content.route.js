const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/stats', protect, requireAdmin, contentController.getStats);
router.get('/sets', protect, requireAdmin, contentController.getQuestionSets);
router.get('/questions', protect, requireAdmin, contentController.getQuestions);

module.exports = router;
