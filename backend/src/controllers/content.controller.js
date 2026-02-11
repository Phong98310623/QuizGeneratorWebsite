const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');

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
};
