const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');
const PlayAttempt = require('../models/play_attempt.model');
const mongoose = require('mongoose');

/**
 * List verified sets với filter type, search q, limit, offset.
 */
async function listVerifiedSets(query) {
  const { type, q, limit = 20, offset = 0 } = query;
  const filter = { verified: true };

  if (type && String(type).trim()) {
    filter.type = new RegExp(String(type).trim(), 'i');
  }
  if (q && String(q).trim()) {
    const search = new RegExp(String(q).trim(), 'i');
    filter.$or = [{ title: search }, { description: search }];
  }

  const skip = Math.max(0, parseInt(offset, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

  const [sets, total] = await Promise.all([
    QuestionSet.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    QuestionSet.countDocuments(filter),
  ]);

  const data = sets.map((s) => ({
    id: s._id.toString(),
    pin: s.pin || null,
    title: s.title,
    description: s.description || '',
    type: s.type || 'Other',
    count: Array.isArray(s.questionIds) ? s.questionIds.length : 0,
  }));

  return { data, total };
}

/**
 * Lấy một set theo PIN (chỉ meta).
 */
async function getSetByPin(pin) {
  const pinStr = String(pin || '').trim().toUpperCase();
  if (!pinStr) return { error: 'invalid' };
  const set = await QuestionSet.findOne({ pin: pinStr }).lean();
  if (!set) return null;
  return {
    id: set._id.toString(),
    pin: set.pin,
    title: set.title,
    description: set.description || '',
    type: set.type || 'Other',
    count: Array.isArray(set.questionIds) ? set.questionIds.length : 0,
  };
}

/**
 * Lấy câu hỏi của set theo PIN (để chơi).
 */
async function getQuestionsByPin(pin) {
  const pinStr = String(pin || '').trim().toUpperCase();
  if (!pinStr) return { error: 'invalid' };
  const set = await QuestionSet.findOne({ pin: pinStr }).lean();
  if (!set) return null;
  const questionIds = Array.isArray(set.questionIds) ? set.questionIds : [];
  if (questionIds.length === 0) return [];
  const questions = await Question.find({ _id: { $in: questionIds }, archived: { $ne: true } })
    .sort({ createdAt: 1 })
    .lean();
  const orderMap = new Map(questionIds.map((id, i) => [id.toString(), i]));
  const sorted = [...questions].sort(
    (a, b) => (orderMap.get(a._id.toString()) ?? 0) - (orderMap.get(b._id.toString()) ?? 0)
  );
  return sorted.map((q) => ({
    id: q._id.toString(),
    content: q.content,
    options: q.options || [],
    correctAnswer: q.correctAnswer,
    difficulty: q.difficulty || 'medium',
    explanation: q.explanation,
  }));
}

/**
 * Ghi nhận lần làm bài: tạo PlayAttempt, cập nhật usedBy từng câu hỏi.
 */
async function submitAttempt(pin, userId, answers) {
  const pinStr = String(pin || '').trim().toUpperCase();
  if (!pinStr || !Array.isArray(answers) || answers.length === 0) {
    throw new Error('Thiếu mã PIN hoặc danh sách câu trả lời');
  }
  const set = await QuestionSet.findOne({ pin: pinStr }).lean();
  if (!set) return null;
  const questionIds = Array.isArray(set.questionIds) ? set.questionIds.map((id) => id.toString()) : [];

  const attempt = await PlayAttempt.create({
    userId,
    pin: pinStr,
    completedAt: new Date(),
  });
  const attemptedAt = attempt.completedAt;

  for (const item of answers) {
    const qId = item.questionId;
    const selectedAnswer = item.selectedAnswer != null ? String(item.selectedAnswer).trim() : '';
    if (!qId || !questionIds.includes(qId)) continue;
    if (!mongoose.isValidObjectId(qId)) continue;
    await Question.findByIdAndUpdate(qId, {
      $push: {
        usedBy: {
          user: userId,
          answer: selectedAnswer,
          attemptedAt,
          attemptId: attempt._id,
        },
      },
    });
  }

  return {
    attemptId: attempt._id.toString(),
    pin: pinStr,
    completedAt: attempt.completedAt,
  };
}

module.exports = {
  listVerifiedSets,
  getSetByPin,
  getQuestionsByPin,
  submitAttempt,
};
