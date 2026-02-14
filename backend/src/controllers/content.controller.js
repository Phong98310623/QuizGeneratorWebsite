const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');
const User = require('../models/user.model');

/**
 * POST /api/sets (protect) - User creates a set from generated questions. Body: { title, description?, type?, questions: [...] }
 * Each question: { content or question, options?: string[] or { text, isCorrect }[], correctAnswer, difficulty?, explanation? }
 */
const createSet = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      questions: rawQuestions,
      generatorTopic,
      generatorCount,
      generatorDifficulty,
      generatorType,
    } = req.body;
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
    const setPayload = {
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      type: type ? String(type).trim() : 'Other',
      questionIds: questionDocs,
      verified: false,
      createdBy: req.user._id || req.user.id,
      pin,
    };
    if (generatorTopic != null && String(generatorTopic).trim()) setPayload.generatorTopic = String(generatorTopic).trim();
    if (generatorCount != null) setPayload.generatorCount = Math.min(10, Math.max(1, parseInt(generatorCount, 10) || 0)) || undefined;
    if (generatorDifficulty != null && String(generatorDifficulty).trim()) setPayload.generatorDifficulty = String(generatorDifficulty).trim();
    if (generatorType != null && String(generatorType).trim()) setPayload.generatorType = String(generatorType).trim();
    const set = await QuestionSet.create(setPayload);

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

const getSetById = async (req, res) => {
  try {
    const set = await QuestionSet.findById(req.params.id).lean();
    if (!set) {
      return res.status(404).json({ success: false, message: 'Question set không tồn tại' });
    }
    res.json({
      id: set._id.toString(),
      title: set.title,
      description: set.description || '',
      type: set.type || 'Other',
      pin: set.pin || null,
      count: Array.isArray(set.questionIds) ? set.questionIds.length : 0,
      verified: !!set.verified,
    });
  } catch (error) {
    console.error('getSetById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin bộ câu hỏi' });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }

    const correctAnswer = question.correctAnswer || '';
    const options = question.options || [];
    const usedByRaw = Array.isArray(question.usedBy) ? question.usedBy : [];

    const userIds = new Set();
    const usedByEntries = [];
    for (const entry of usedByRaw) {
      let userId, answer, attemptedAt;
      if (entry && typeof entry === 'object' && entry.user) {
        userId = entry.user?.toString?.() || entry.user;
        answer = entry.answer != null ? String(entry.answer).trim() : '';
        attemptedAt = entry.attemptedAt;
      } else if (typeof entry === 'string' || (entry && entry.toString)) {
        userId = String(entry);
        answer = '';
        attemptedAt = null;
      } else continue;
      if (!userId) continue;
      userIds.add(userId);

      let isCorrect = false;
      if (answer) {
        if (correctAnswer && answer === correctAnswer) isCorrect = true;
        else if (options.length) {
          const correctOpt = options.find((o) => o && o.isCorrect);
          if (correctOpt && answer === correctOpt.text) isCorrect = true;
        }
      }

      usedByEntries.push({ userId, answer, attemptedAt, isCorrect });
    }

    const usersMap = {};
    if (userIds.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(userIds) } })
        .select('email username')
        .lean();
      for (const u of users) {
        usersMap[u._id.toString()] = {
          id: u._id.toString(),
          email: u.email || '',
          fullName: u.username || u.email || '—',
        };
      }
    }

    const userStats = {};
    for (const e of usedByEntries) {
      if (!userStats[e.userId]) {
        userStats[e.userId] = { total: 0, correct: 0, user: usersMap[e.userId] || { id: e.userId, email: '—', fullName: '—' } };
      }
      userStats[e.userId].total += 1;
      if (e.isCorrect) userStats[e.userId].correct += 1;
    }
    const usedByUsers = Object.values(userStats).map((s) => ({
      ...s.user,
      totalAttempts: s.total,
      correctAttempts: s.correct,
      ratio: s.total > 0 ? `${s.correct}/${s.total}` : '0/0',
    }));

    let creator = null;
    let questionSet = null;
    const setWithQuestion = await QuestionSet.findOne({ questionIds: question._id })
      .populate('createdBy', 'email username')
      .lean();
    if (setWithQuestion) {
      questionSet = {
        id: setWithQuestion._id.toString(),
        title: setWithQuestion.title || '—',
      };
      if (setWithQuestion.createdBy) {
        const c = setWithQuestion.createdBy;
        creator = {
          id: c._id.toString(),
          email: c.email || '',
          fullName: c.username || c.email || '—',
        };
      }
    }

    res.json({
      id: question._id.toString(),
      content: question.content,
      options: question.options || [],
      correctAnswer: question.correctAnswer,
      tags: question.tags || [],
      difficulty: question.difficulty || 'medium',
      explanation: question.explanation,
      verified: !!question.verified,
      archived: !!question.archived,
      createdAt: question.createdAt?.toISOString?.() ?? question.createdAt,
      updatedAt: question.updatedAt?.toISOString?.() ?? question.updatedAt,
      usedCount: usedByEntries.length,
      usedByUsers,
      creator,
      questionSet,
    });
  } catch (error) {
    console.error('getQuestionById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin câu hỏi' });
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

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, options, correctAnswer, difficulty, explanation } = req.body;
    const update = {};
    if (content !== undefined) update.content = String(content).trim();
    if (correctAnswer !== undefined) update.correctAnswer = String(correctAnswer).trim();
    if (explanation !== undefined) update.explanation = String(explanation).trim() || null;
    if (difficulty !== undefined && ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())) {
      update.difficulty = String(difficulty).toLowerCase();
    }
    if (options !== undefined && Array.isArray(options)) {
      update.options = options.map((o) => {
        if (typeof o === 'string') {
          return { text: String(o).trim(), isCorrect: false };
        }
        return {
          text: String(o?.text ?? o?.option ?? '').trim(),
          isCorrect: !!o?.isCorrect,
        };
      }).filter((o) => o.text);
    }
    const question = await Question.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }
    res.json({
      success: true,
      data: {
        id: question._id.toString(),
        content: question.content,
        options: question.options || [],
        correctAnswer: question.correctAnswer,
        difficulty: question.difficulty,
        explanation: question.explanation,
      },
    });
  } catch (error) {
    console.error('updateQuestion error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật câu hỏi' });
  }
};

const updateQuestionVerify = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Trường "verified" phải là boolean' });
    }
    const question = await Question.findByIdAndUpdate(id, { verified }, { new: true }).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }
    res.json({
      success: true,
      data: {
        id: question._id.toString(),
        verified: !!question.verified,
      },
    });
  } catch (error) {
    console.error('updateQuestionVerify error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái verify' });
  }
};

const updateQuestionArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { archived } = req.body;
    if (typeof archived !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Trường "archived" phải là boolean' });
    }
    const question = await Question.findByIdAndUpdate(id, { archived }, { new: true }).lean();
    if (!question) {
      return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    }
    res.json({
      success: true,
      data: {
        id: question._id.toString(),
        archived: !!question.archived,
      },
    });
  } catch (error) {
    console.error('updateQuestionArchive error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái archive' });
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
  getSetById,
  getQuestionById,
  getQuestionSets,
  getQuestions,
  getQuestionsBySet,
  updateQuestionSetVerify,
  updateQuestion,
  updateQuestionVerify,
  updateQuestionArchive,
  reviewQuestion,
  createSet,
};
