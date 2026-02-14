const express = require('express');
const router = express.Router();
const { register, login, getMe, updateMe } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe); // Route cần token để truy cập

module.exports = router;