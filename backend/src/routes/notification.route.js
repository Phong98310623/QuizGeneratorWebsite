const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');

// User (đăng nhập): xem thông báo của mình + đánh dấu đã đọc
router.get('/me', protect, notificationController.getMyNotifications);
router.post('/me/read', protect, notificationController.markMyNotificationsRead);

// Admin: SSE stream (thông báo realtime)
router.get('/stream', protect, requireAdmin, notificationController.stream);

// Admin: quản lý thông báo
router.get('/', protect, requireAdmin, notificationController.getAll);
router.post('/', protect, requireAdmin, notificationController.create);

module.exports = router;
