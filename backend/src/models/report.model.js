const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporterName: { type: String, required: true },
  reporterEmail: { type: String, required: true },
  reportedEntityType: { type: String, enum: ['USER', 'QUIZ', 'CONTENT', 'OTHER'], required: true },
  reportedEntityId: { type: String, required: true },
  reportedEntityTitle: { type: String, required: true },
  reason: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['PENDING', 'RESOLVED', 'DISMISSED'], default: 'PENDING' },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' },
  resolvedAt: { type: Date },
  resolvedBy: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema, 'reports');
