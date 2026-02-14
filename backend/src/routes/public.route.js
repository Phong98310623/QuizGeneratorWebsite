const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');

router.get('/sets', publicController.listVerifiedSets);
router.get('/sets/by-pin/:pin', publicController.getSetByPin);
router.get('/sets/by-pin/:pin/questions', publicController.getQuestionsByPin);

module.exports = router;
