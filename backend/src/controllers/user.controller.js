const crypto = require("crypto");
const mongoose = require("mongoose");
const userService = require("../services/user.service");
const User = require("../models/user.model");
const PlayAttempt = require("../models/play_attempt.model");
const QuestionSet = require("../models/question_set.model");
const Question = require("../models/question.model");

const createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const user = await userService.updateUserStatus(id, status);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/users/me/history (protect)
 * Trả về lịch sử làm bài của user: mỗi attempt có pin, setTitle, completedAt, correct/total, chi tiết từng câu (đúng/sai).
 */
const getMyHistory = async (req, res) => {
  try {
    const attempts = await PlayAttempt.find({ userId: req.user._id })
      .sort({ completedAt: -1 })
      .limit(50)
      .lean();

    const result = [];
    for (const att of attempts) {
      const set = await QuestionSet.findOne({ pin: att.pin }).lean();
      const setTitle = set ? set.title : att.pin;
      const questionIds = Array.isArray(set?.questionIds) ? set.questionIds : [];

      const questions = await Question.find({
        _id: { $in: questionIds },
        'usedBy.attemptId': att._id,
      }).lean();

      const details = [];
      let correctCount = 0;
      for (const q of questions) {
        const entry = (q.usedBy || []).find(
          (e) => e && e.attemptId && String(e.attemptId) === String(att._id)
        );
        const userAnswer = entry && entry.answer != null ? String(entry.answer).trim() : '';
        const correctAnswer = q.correctAnswer != null ? String(q.correctAnswer).trim() : '';
        const isCorrect = correctAnswer !== '' && userAnswer === correctAnswer;
        if (isCorrect) correctCount += 1;
        details.push({
          questionId: q._id.toString(),
          content: q.content,
          userAnswer,
          correctAnswer,
          isCorrect,
        });
      }

      result.push({
        attemptId: att._id.toString(),
        pin: att.pin,
        setTitle,
        completedAt: att.completedAt,
        correctCount,
        totalCount: questionIds.length,
        details,
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('getMyHistory error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải lịch sử' });
  }
};

/**
 * GET /api/users/me/favorites (protect)
 * Trả về favorites và savedCollections của user
 * Query: ?details=1 để lấy thêm nội dung câu hỏi (content, options, ...)
 */
const getMyFavoritesAndCollections = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('favorites savedCollections')
      .lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const favIds = (user.favorites || []).map((id) => (typeof id === 'object' && id?._id ? id._id.toString() : String(id)));
    const collections = (user.savedCollections || []).map((c) => ({
      nameid: c.nameid,
      name: c.name,
      questionIds: (c.questionIds || []).map((q) => (typeof q === 'object' && q?._id ? q._id.toString() : String(q))),
    }));

    const withDetails = req.query.details === '1' || req.query.details === 'true';
    if (!withDetails) {
      return res.json({
        success: true,
        data: { favorites: favIds, savedCollections: collections },
      });
    }

    const allIds = [...new Set([...favIds, ...collections.flatMap((c) => c.questionIds)])]
      .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
    const questions = allIds.length
      ? await Question.find({ _id: { $in: allIds }, archived: { $ne: true } })
          .select('content options correctAnswer explanation difficulty')
          .lean()
      : [];
    const qMap = {};
    for (const q of questions) {
      qMap[String(q._id)] = {
        id: q._id.toString(),
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        difficulty: q.difficulty,
      };
    }

    const favoriteQuestions = favIds.map((id) => qMap[id]).filter(Boolean);
    const savedCollectionsWithQuestions = collections.map((c) => ({
      ...c,
      questions: c.questionIds.map((id) => qMap[id]).filter(Boolean),
    }));

    res.json({
      success: true,
      data: {
        favorites: favIds,
        favoriteQuestions,
        savedCollections: collections,
        savedCollectionsWithQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải dữ liệu' });
  }
};

/**
 * POST /api/users/me/favorites/toggle (protect)
 * Body: { questionId }
 * Thêm/xóa câu hỏi khỏi favorites
 */
const toggleFavorite = async (req, res) => {
  try {
    const { questionId } = req.body;
    if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'questionId không hợp lệ' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const objId = new mongoose.Types.ObjectId(questionId);
    const favs = Array.isArray(user.favorites) ? user.favorites : [];
    const idx = favs.findIndex((f) => String(f) === questionId);
    if (idx >= 0) {
      favs.splice(idx, 1);
    } else {
      favs.push(objId);
    }
    user.favorites = favs;
    await user.save();
    res.json({
      success: true,
      data: {
        favorites: favs.map((f) => String(f)),
        added: idx < 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi cập nhật favorites' });
  }
};

/**
 * POST /api/users/me/saved-collections (protect)
 * Body: { name }
 * Tạo savedCollection mới
 */
const createSavedCollection = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Tên bộ sưu tập không được để trống' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const nameid = crypto.randomBytes(6).toString('hex');
    const collections = Array.isArray(user.savedCollections) ? user.savedCollections : [];
    collections.push({ nameid, name: name.trim(), questionIds: [] });
    user.savedCollections = collections;
    await user.save();
    const col = collections[collections.length - 1];
    res.status(201).json({
      success: true,
      data: { nameid: col.nameid, name: col.name, questionIds: [] },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tạo bộ sưu tập' });
  }
};

/**
 * POST /api/users/me/saved-collections/:nameid/add (protect)
 * Body: { questionId }
 * Thêm câu hỏi vào savedCollection
 */
const addQuestionToCollection = async (req, res) => {
  try {
    const { nameid } = req.params;
    const { questionId } = req.body;
    if (!nameid || !questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'nameid hoặc questionId không hợp lệ' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const collections = Array.isArray(user.savedCollections) ? user.savedCollections : [];
    const col = collections.find((c) => c.nameid === nameid);
    if (!col) {
      return res.status(404).json({ success: false, message: 'Bộ sưu tập không tồn tại' });
    }
    const qIds = col.questionIds || [];
    if (!qIds.some((q) => String(q) === questionId)) {
      qIds.push(new mongoose.Types.ObjectId(questionId));
    }
    await user.save();
    res.json({
      success: true,
      data: { nameid, name: col.name, questionIds: qIds.map((q) => String(q)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi thêm câu hỏi' });
  }
};

/**
 * POST /api/users/me/saved-collections/:nameid/remove (protect)
 * Body: { questionId }
 * Xóa câu hỏi khỏi savedCollection
 */
const removeQuestionFromCollection = async (req, res) => {
  try {
    const { nameid } = req.params;
    const { questionId } = req.body;
    if (!nameid || !questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: 'nameid hoặc questionId không hợp lệ' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const collections = Array.isArray(user.savedCollections) ? user.savedCollections : [];
    const col = collections.find((c) => c.nameid === nameid);
    if (!col) {
      return res.status(404).json({ success: false, message: 'Bộ sưu tập không tồn tại' });
    }
    const qIds = (col.questionIds || []).filter((q) => String(q) !== questionId);
    col.questionIds = qIds;
    await user.save();
    res.json({
      success: true,
      data: { nameid, name: col.name, questionIds: qIds.map((q) => String(q)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi xóa câu hỏi' });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  deleteUser,
  updateUserStatus,
  getMyHistory,
  getMyFavoritesAndCollections,
  toggleFavorite,
  createSavedCollection,
  addQuestionToCollection,
  removeQuestionFromCollection,
};