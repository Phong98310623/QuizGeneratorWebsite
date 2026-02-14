const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: false });

const usedByEntrySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answer: { type: String, default: '' },
  attemptedAt: { type: Date, default: Date.now },
  attemptId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlayAttempt', required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  options: [optionSchema],
  correctAnswer: { type: String }, // text của đáp án đúng (cho fill-in hoặc trắc nghiệm)
  tags: [{ type: String, trim: true }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  explanation: { type: String },
  // Mỗi phần tử: { user, answer, attemptedAt, attemptId }. Dữ liệu cũ có thể là ObjectId (ref User).
  usedBy: [{ type: mongoose.Schema.Types.Mixed }],
  verified: { type: Boolean, default: false },
  archived: { type: Boolean, default: false }, // nếu true thì ẩn khỏi UI / không dùng trong quiz
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema, 'questions');
