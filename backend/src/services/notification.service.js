const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

/**
 * Lấy danh sách thông báo áp dụng cho user hiện tại (isActive, chưa hết hạn).
 * Chỉ trả về thông báo mới chưa đọc: createdAt > lastNotificationReadAt (lọc thông báo cũ đã đọc).
 */
async function getNotificationsForUser(userId) {
  const user = await User.findById(userId).select('role lastNotificationReadAt').lean();
  if (!user) return { notifications: [], lastReadAt: null };

  const now = new Date();
  const role = user.role || 'USER';
  const userIdObj = new mongoose.Types.ObjectId(userId);
  const lastReadAt = user.lastNotificationReadAt ? new Date(user.lastNotificationReadAt) : null;

  const query = {
    isActive: true,
    $and: [
      {
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: now } },
        ],
      },
      {
        $or: [
          { isGlobal: true },
          { targetType: 'ALL' },
          { targetType: 'ROLE', targetRoles: role },
          { targetType: 'USER', targetUsers: userIdObj },
        ],
      },
    ],
  };

  // Chỉ lấy thông báo mới sau thời điểm đã đọc (bỏ thông báo cũ)
  if (lastReadAt) {
    query.$and.push({ createdAt: { $gt: lastReadAt } });
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('createdBy', 'username email')
    .lean();

  return {
    notifications: notifications.map((n) => ({
      _id: n._id,
      title: n.title,
      content: n.content,
      icon: n.icon,
      type: n.type,
      createdAt: n.createdAt,
      createdBy: n.createdBy,
      link: n.link,
    })),
    lastReadAt,
  };
}

/**
 * Đánh dấu đã đọc tất cả: cập nhật lastNotificationReadAt = now cho user.
 */
async function markAllAsRead(userId) {
  const user = await User.findByIdAndUpdate(
    userId,
    { lastNotificationReadAt: new Date() },
    { new: true }
  ).select('lastNotificationReadAt');
  return user ? user.lastNotificationReadAt : null;
}

/**
 * Admin: tạo thông báo mới.
 */
async function createNotification(data) {
  return await Notification.create(data);
}

/**
 * Admin: lấy tất cả thông báo (quản lý).
 */
async function getAllNotifications() {
  return await Notification.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'username email')
    .lean();
}

module.exports = {
  getNotificationsForUser,
  markAllAsRead,
  createNotification,
  getAllNotifications,
};
