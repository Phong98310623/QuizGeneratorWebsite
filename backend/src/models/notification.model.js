const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    icon: { type: String, default: 'bell' }, // tên icon hoặc URL
    type: {
      type: String,
      enum: ['SYSTEM', 'EVENT', 'REWARD', 'WARNING', 'UPDATE'],
      default: 'SYSTEM',
    },
    targetType: {
      type: String,
      enum: ['ALL', 'ROLE', 'USER'],
      default: 'ROLE',
    },
    targetRoles: [{ type: String }], // ['USER', 'ADMIN']
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isGlobal: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    link: { type: String }, // path để chuyển trang khi click (vd. /admin/preview/report/:id)
  },
  { timestamps: true }
);

const collectionName = process.env.MONGO_NOTIFICATION_COLLECTION || 'notifications';
module.exports = mongoose.model('Notification', notificationSchema, collectionName);
