const userService = require("../services/user.service");
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

module.exports = {
  createUser,
  getUsers,
  getUser,
  deleteUser,
  updateUserStatus,
  getMyHistory,
};