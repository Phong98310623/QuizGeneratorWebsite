const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/sets', publicController.listVerifiedSets);
router.get('/sets/by-pin/:pin', publicController.getSetByPin);
router.get('/sets/by-pin/:pin/questions', publicController.getQuestionsByPin);
router.post('/sets/by-pin/:pin/submit', protect, publicController.submitAttempt);

module.exports = router;
