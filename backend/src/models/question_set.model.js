const mongoose = require('mongoose');

const questionSetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, trim: true }, // Technical, Academic, Geography, Business, etc.
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  verified: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('QuestionSet', questionSetSchema, 'question_sets');
