const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  options: [optionSchema],
  correctAnswer: { type: String }, // text của đáp án đúng (cho fill-in hoặc trắc nghiệm)
  tags: [{ type: String, trim: true }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  explanation: { type: String },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // user IDs đã dùng/trả lời câu hỏi
  verified: { type: Boolean, default: false },
  archived: { type: Boolean, default: false }, // nếu true thì ẩn khỏi UI / không dùng trong quiz
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema, 'questions');
