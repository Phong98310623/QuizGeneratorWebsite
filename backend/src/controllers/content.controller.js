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

module.exports = { getStats, getQuestionSets, getQuestions };
