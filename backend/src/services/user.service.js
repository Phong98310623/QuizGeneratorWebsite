const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/user.model');
const PlayAttempt = require('../models/play_attempt.model');
const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');
const { USER_STATUS, USER_ROLES } = require('../shares/constants/userRolesAndStatus.js');

const createUser = async (data) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    throw new Error("Email already exists");
  }
  return await User.create(data);
};

const getAllUsers = async () => {
  return await User.find();
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
};

//This function changes user status to inactive after 3 days of inactivity
const deactivateInactiveUsers = async () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  await User.updateMany(
    { updatedAt: { $lt: threeDaysAgo }, status: USER_STATUS.ACTIVE },
    { status: USER_STATUS.INACTIVE }
  );
};

//This function promotes user to admin
const promoteToAdmin = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === USER_ROLES.ADMIN) {
    throw new Error("User is already an admin");
  }

  user.role = USER_ROLES.ADMIN;
  await user.save();
  return user;
}

//This function ban user
const banUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.status === USER_STATUS.BANNED) {
    throw new Error("User is already banned");
  }

  user.status = USER_STATUS.BANNED;
  await user.save();
  return user;
};

const updateUserStatus = async (id, status) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  user.status = status;
  await user.save();
  return user;
};

/**
 * Lịch sử làm bài của user: mỗi attempt có pin, setTitle, completedAt, correct/total, chi tiết từng câu.
 */
async function getMyHistory(userId) {
  const attempts = await PlayAttempt.find({ userId })
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
  return result;
}

/**
 * Favorites và savedCollections của user. Nếu withDetails=true thì lấy thêm nội dung câu hỏi.
 */
async function getMyFavoritesAndCollections(userId, withDetails = false) {
  const user = await User.findById(userId).select('favorites savedCollections').lean();
  if (!user) return null;

  const favIds = (user.favorites || []).map((id) =>
    typeof id === 'object' && id?._id ? id._id.toString() : String(id)
  );
  const collections = (user.savedCollections || []).map((c) => ({
    nameid: c.nameid,
    name: c.name,
    questionIds: (c.questionIds || []).map((q) =>
      typeof q === 'object' && q?._id ? q._id.toString() : String(q)
    ),
  }));

  if (!withDetails) {
    return { favorites: favIds, savedCollections: collections };
  }

  const allIds = [...new Set([...favIds, ...collections.flatMap((c) => c.questionIds)])]
    .filter((id) => id && mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const questions =
    allIds.length > 0
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

  return {
    favorites: favIds,
    favoriteQuestions,
    savedCollections: collections,
    savedCollectionsWithQuestions,
  };
}

/**
 * Thêm/xóa câu hỏi khỏi favorites. Trả về { favorites, added }.
 */
async function toggleFavorite(userId, questionId) {
  if (!questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
    throw new Error('questionId không hợp lệ');
  }
  const user = await User.findById(userId);
  if (!user) return null;
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
  return {
    favorites: favs.map((f) => String(f)),
    added: idx < 0,
  };
}

/**
 * Tạo savedCollection mới. Trả về { nameid, name, questionIds }.
 */
async function createSavedCollection(userId, name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Tên bộ sưu tập không được để trống');
  }
  const user = await User.findById(userId);
  if (!user) return null;
  const nameid = crypto.randomBytes(6).toString('hex');
  const collections = Array.isArray(user.savedCollections) ? user.savedCollections : [];
  collections.push({ nameid, name: name.trim(), questionIds: [] });
  user.savedCollections = collections;
  await user.save();
  const col = collections[collections.length - 1];
  return { nameid: col.nameid, name: col.name, questionIds: [] };
}

/**
 * Thêm câu hỏi vào savedCollection.
 */
async function addQuestionToCollection(userId, nameid, questionId) {
  if (!nameid || !questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
    throw new Error('nameid hoặc questionId không hợp lệ');
  }
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const collections = Array.isArray(user.savedCollections) ? user.savedCollections : [];
  const col = collections.find((c) => c.nameid === nameid);
  if (!col) throw new Error('Bộ sưu tập không tồn tại');
  const qIds = col.questionIds || [];
  if (!qIds.some((q) => String(q) === questionId)) {
    qIds.push(new mongoose.Types.ObjectId(questionId));
  }
  await user.save();
  return { nameid, name: col.name, questionIds: qIds.map((q) => String(q)) };
}

/**
 * Xóa câu hỏi khỏi savedCollection.
 */
async function removeQuestionFromCollection(userId, nameid, questionId) {
  if (!nameid || !questionId || !mongoose.Types.ObjectId.isValid(questionId)) {
    throw new Error('nameid hoặc questionId không hợp lệ');
  }
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  const collections = Array.isArray(user.savedCollections) ? user.savedCollections : [];
  const col = collections.find((c) => c.nameid === nameid);
  if (!col) throw new Error('Bộ sưu tập không tồn tại');
  const qIds = (col.questionIds || []).filter((q) => String(q) !== questionId);
  col.questionIds = qIds;
  await user.save();
  return { nameid, name: col.name, questionIds: qIds.map((q) => String(q)) };
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  deleteUser,
  deactivateInactiveUsers,
  promoteToAdmin,
  banUser,
  updateUserStatus,
  getMyHistory,
  getMyFavoritesAndCollections,
  toggleFavorite,
  createSavedCollection,
  addQuestionToCollection,
  removeQuestionFromCollection,
};