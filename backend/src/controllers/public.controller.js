const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');
const PlayAttempt = require('../models/play_attempt.model');
const mongoose = require('mongoose');

/**
 * GET /api/public/sets
 * List verified sets. Query: type, q (search title/description), limit, offset
 */
const listVerifiedSets = async (req, res) => {
  try {
    const { type, q, limit = 20, offset = 0 } = req.query;
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

    const mapped = sets.map((s) => ({
      id: s._id.toString(),
      pin: s.pin || null,
      title: s.title,
      description: s.description || '',
      type: s.type || 'Other',
      count: Array.isArray(s.questionIds) ? s.questionIds.length : 0,
    }));

    res.json({ data: mapped, total });
  } catch (error) {
    console.error('listVerifiedSets error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách bộ câu hỏi' });
  }
};

/**
 * GET /api/public/sets/by-pin/:pin
 * Get one set by PIN (meta only: title, description, type, count)
 */
const getSetByPin = async (req, res) => {
  try {
    const pin = String(req.params.pin || '').trim().toUpperCase();
    if (!pin) {
      return res.status(400).json({ success: false, message: 'Mã PIN không hợp lệ' });
    }

    const set = await QuestionSet.findOne({ pin }).lean();
    if (!set) {
      return res.status(404).json({ success: false, message: 'Bộ câu hỏi không tồn tại hoặc mã PIN không đúng' });
    }

    res.json({
      data: {
        id: set._id.toString(),
        pin: set.pin,
        title: set.title,
        description: set.description || '',
        type: set.type || 'Other',
        count: Array.isArray(set.questionIds) ? set.questionIds.length : 0,
      },
    });
  } catch (error) {
    console.error('getSetByPin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải bộ câu hỏi' });
  }
};

/**
 * GET /api/public/sets/by-pin/:pin/questions
 * Get questions for a set (for playing). Returns questions with content and options.
 */
const getQuestionsByPin = async (req, res) => {
  try {
    const pin = String(req.params.pin || '').trim().toUpperCase();
    if (!pin) {
      return res.status(400).json({ success: false, message: 'Mã PIN không hợp lệ' });
    }

    const set = await QuestionSet.findOne({ pin }).lean();
    if (!set) {
      return res.status(404).json({ success: false, message: 'Bộ câu hỏi không tồn tại hoặc mã PIN không đúng' });
    }

    const questionIds = Array.isArray(set.questionIds) ? set.questionIds : [];
    if (questionIds.length === 0) {
      return res.json({ data: [] });
    }

    const questions = await Question.find({ _id: { $in: questionIds }, archived: { $ne: true } })
      .sort({ createdAt: 1 })
      .lean();

    const orderMap = new Map(questionIds.map((id, i) => [id.toString(), i]));
    const sorted = [...questions].sort((a, b) => (orderMap.get(a._id.toString()) ?? 0) - (orderMap.get(b._id.toString()) ?? 0));

    const mapped = sorted.map((q) => ({
      id: q._id.toString(),
      content: q.content,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      difficulty: q.difficulty || 'medium',
      explanation: q.explanation,
    }));

    res.json({ data: mapped });
  } catch (error) {
    console.error('getQuestionsByPin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải câu hỏi' });
  }
};

/**
 * POST /api/public/sets/by-pin/:pin/submit (protect)
 * Body: { answers: [{ questionId, selectedAnswer }] }
 * Ghi nhận lần làm bài: tạo PlayAttempt, cập nhật usedBy từng câu hỏi.
 */
const submitAttempt = async (req, res) => {
  try {
    const pin = String(req.params.pin || '').trim().toUpperCase();
    const { answers } = req.body || {};
    if (!pin || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Thiếu mã PIN hoặc danh sách câu trả lời' });
    }

    const set = await QuestionSet.findOne({ pin }).lean();
    if (!set) {
      return res.status(404).json({ success: false, message: 'Bộ câu hỏi không tồn tại' });
    }

    const questionIds = Array.isArray(set.questionIds) ? set.questionIds.map((id) => id.toString()) : [];
    const attempt = await PlayAttempt.create({
      userId: req.user._id,
      pin,
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
            user: req.user._id,
            answer: selectedAnswer,
            attemptedAt,
            attemptId: attempt._id,
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        attemptId: attempt._id.toString(),
        pin,
        completedAt: attempt.completedAt,
      },
    });
  } catch (error) {
    console.error('submitAttempt error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lưu kết quả' });
  }
};

module.exports = {
  listVerifiedSets,
  getSetByPin,
  getQuestionsByPin,
  submitAttempt,
};
