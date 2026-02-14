const notificationService = require('../services/notification.service');
const sse = require('../lib/sse');

/**
 * GET /api/notifications/me
 * Lấy thông báo cho user đăng nhập + lastReadAt (protect).
 */
const getMyNotifications = async (req, res) => {
  try {
    const result = await notificationService.getNotificationsForUser(req.user._id.toString());
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải thông báo' });
  }
};

/**
 * POST /api/notifications/me/read
 * Đánh dấu đã đọc tất cả (cập nhật lastNotificationReadAt) (protect).
 */
const markMyNotificationsRead = async (req, res) => {
  try {
    const lastReadAt = await notificationService.markAllAsRead(req.user._id.toString());
    res.json({ success: true, data: { lastReadAt } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi cập nhật' });
  }
};

/**
 * GET /api/notifications (admin)
 * Danh sách tất cả thông báo (requireAdmin).
 */
const getAll = async (req, res) => {
  try {
    const list = await notificationService.getAllNotifications();
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải danh sách' });
  }
};

/**
 * POST /api/notifications (admin)
 * Tạo thông báo mới (requireAdmin).
 * Body: title, content, icon?, type?, targetType?, targetRoles?, targetUsers?, isGlobal?, expiresAt?
 */
const create = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user._id,
    };
    const notification = await notificationService.createNotification(payload);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Lỗi khi tạo thông báo' });
  }
};

/**
 * GET /api/notifications/stream
 * SSE stream cho admin: khi có thông báo mới (vd. report) server gửi event.
 */
const stream = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  sse.register(res);
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  res.on('close', () => {
    sse.unregister(res);
  });
};

module.exports = {
  getMyNotifications,
  markMyNotificationsRead,
  getAll,
  create,
  stream,
};
