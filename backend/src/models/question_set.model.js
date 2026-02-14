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
}, { timestamps: true });

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
