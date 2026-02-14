const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/', protect, contentController.createSet);

module.exports = router;
