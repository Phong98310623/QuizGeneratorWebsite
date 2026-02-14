const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/generate', protect, aiController.generateQuestions);

module.exports = router;
