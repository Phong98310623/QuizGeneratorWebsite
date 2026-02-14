const mongoose = require('mongoose');

/** Generate a short alphanumeric PIN (e.g. 6 chars) */
function generatePin(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const questionSetSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  type: { type: String, trim: true }, // Technical, Academic, Geography, Business, etc.
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  verified: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pin: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
  // Cache prompt: nếu trùng (topic, count, difficulty, type) thì trả từ set này, không gọi AI lại
  generatorTopic: { type: String, trim: true },
  generatorCount: { type: Number },
  generatorDifficulty: { type: String, trim: true },
  generatorType: { type: String, trim: true },
}, { timestamps: true });

questionSetSchema.index({ generatorTopic: 1, generatorCount: 1, generatorDifficulty: 1, generatorType: 1 });

questionSetSchema.statics.generateUniquePin = async function () {
  let pin;
  let exists = true;
  while (exists) {
    pin = generatePin(6);
    exists = await this.findOne({ pin });
  }
  return pin;
};

module.exports = mongoose.model('QuestionSet', questionSetSchema, 'question_sets');
