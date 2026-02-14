const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');

/**
 * POST /api/sets (protect) - User creates a set from generated questions. Body: { title, description?, type?, questions: [...] }
 * Each question: { content or question, options?: string[] or { text, isCorrect }[], correctAnswer, difficulty?, explanation? }
 */
const createSet = async (req, res) => {
  try {
    const { title, description, type, questions: rawQuestions } = req.body;
    if (!title || !Array.isArray(rawQuestions) || rawQuestions.length === 0) {
      return res.status(400).json({ success: false, message: 'Cần tiêu đề và ít nhất một câu hỏi' });
    }

    const questionDocs = [];
    for (const q of rawQuestions) {
      const content = q.content || q.question || '';
      if (!content) continue;
      let options = [];
      if (Array.isArray(q.options)) {
        if (typeof q.options[0] === 'string') {
          const correct = (q.correctAnswer || '').trim();
          options = q.options.map((text) => ({ text: String(text).trim(), isCorrect: String(text).trim() === correct }));
        } else {
          options = q.options.map((o) => ({ text: o.text || o.option || '', isCorrect: !!o.isCorrect }));
        }
      }
      const difficulty = ['easy', 'medium', 'hard'].includes(String(q.difficulty || '').toLowerCase())
        ? String(q.difficulty).toLowerCase()
        : 'medium';
      const doc = await Question.create({
        content,
        options: options.length ? options : undefined,
        correctAnswer: q.correctAnswer ? String(q.correctAnswer).trim() : undefined,
        difficulty,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
        tags: [],
      });
      questionDocs.push(doc._id);
    }

    if (questionDocs.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có câu hỏi hợp lệ nào' });
    }

    const pin = await QuestionSet.generateUniquePin();
    const set = await QuestionSet.create({
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      type: type ? String(type).trim() : 'Other',
      questionIds: questionDocs,
      verified: false,
      createdBy: req.user.id,
      pin,
    });

    return res.status(201).json({
      success: true,
      data: {
        id: set._id.toString(),
        pin: set.pin,
        title: set.title,
        description: set.description || '',
        type: set.type || 'Other',
        count: questionDocs.length,
      },
    });
  } catch (error) {
    console.error('createSet error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo bộ câu hỏi' });
  }
};

const getStats = async (req, res) => {
  try {
    const [totalQuestions, totalSets, verifiedSets] = await Promise.all([
      Question.countDocuments(),
      QuestionSet.countDocuments(),
      QuestionSet.countDocuments({ verified: true }),
    ]);
    res.json({ totalQuestions, totalSets, verifiedSets });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thống kê' });
  }
};

const getQuestionSets = async (req, res) => {
  try {
    const sets = await QuestionSet.find().sort({ createdAt: -1 }).lean();
    const mapped = sets.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      description: s.description || '',
      type: s.type || 'Other',
      count: Array.isArray(s.questionIds) ? s.questionIds.length : 0,
      verified: !!s.verified,
    }));
    res.json(mapped);
  } catch (error) {
    console.error('getQuestionSets error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách question sets' });
  }
};

const getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1 }).limit(100).lean();
    const mapped = questions.map((q) => ({
      id: q._id.toString(),
      content: q.content,
      tags: q.tags || [],
      difficulty: q.difficulty || 'medium',
      usedCount: Array.isArray(q.usedBy) ? q.usedBy.length : 0,
    }));
    res.json(mapped);
  } catch (error) {
    console.error('getQuestions error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách câu hỏi' });
  }
};

const getQuestionsBySet = async (req, res) => {
  try {
    const { id } = req.params;

    const set = await QuestionSet.findById(id).lean();
    if (!set) {
      return res.status(404).json({ success: false, message: 'Question set không tồn tại' });
    }

    const questionIds = Array.isArray(set.questionIds) ? set.questionIds : [];

    if (questionIds.length === 0) {
      return res.json([]);
    }

    const questions = await Question.find({ _id: { $in: questionIds } })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = questions.map((q) => ({
      id: q._id.toString(),
      content: q.content,
      tags: q.tags || [],
      difficulty: q.difficulty || 'medium',
      usedCount: Array.isArray(q.usedBy) ? q.usedBy.length : 0,
      verified: !!q.verified,
      archived: !!q.archived,
    }));

    res.json(mapped);
  } catch (error) {
    console.error('getQuestionsBySet error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải câu hỏi theo bộ' });
  }
};

const updateQuestionSetVerify = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Trường "verified" phải là boolean' });
    }

    const set = await QuestionSet.findByIdAndUpdate(
      id,
      { verified },
      { new: true }
    );

    if (!set) {
      return res.status(404).json({ success: false, message: 'Question set không tồn tại' });
    }

    return res.json({
      success: true,
      data: {
        id: set._id.toString(),
        title: set.title,
        description: set.description || '',
        type: set.type || 'Other',
        count: Array.isArray(set.questionIds) ? set.questionIds.length : 0,
        verified: !!set.verified,
      },
    });
  } catch (error) {
    console.error('updateQuestionSetVerify error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái verify của question set' });
  }
};

const reviewQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'GOOD' | 'HIDE'

    if (!['GOOD', 'HIDE'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action không hợp lệ' });
    }

    const update = {};
    if (action === 'GOOD') {
      update.verified = true;
      update.archived = false;
    }
    if (action === 'HIDE') {
      update.archived = true;
    }

    const question = await Question.findByIdAndUpdate(
      id,
      update,
      { new: true }
    );

    if (!question) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }

    return res.json({
      success: true,
      data: {
        id: question._id.toString(),
        content: question.content,
        tags: question.tags || [],
        difficulty: question.difficulty || 'medium',
        usedCount: Array.isArray(question.usedBy) ? question.usedBy.length : 0,
        verified: !!question.verified,
        archived: !!question.archived,
      },
    });
  } catch (error) {
    console.error('reviewQuestion error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi đánh giá câu hỏi' });
  }
};

module.exports = {
  getStats,
  getQuestionSets,
  getQuestions,
  getQuestionsBySet,
  updateQuestionSetVerify,
  reviewQuestion,
  createSet,
};
