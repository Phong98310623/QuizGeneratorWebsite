const mongoose = require('mongoose');

const playAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pin: { type: String, required: true, trim: true, uppercase: true },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

playAttemptSchema.index({ userId: 1, completedAt: -1 });

module.exports = mongoose.model('PlayAttempt', playAttemptSchema, 'play_attempts');
