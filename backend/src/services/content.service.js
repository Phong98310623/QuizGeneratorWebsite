const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');
const User = require('../models/user.model');

/**
 * Chuẩn hóa raw question từ body thành document options và trả về mảng _id của Question đã tạo.
 */
async function normalizeAndCreateQuestions(rawQuestions) {
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
  return questionDocs;
}

function buildSetPayloadFromBody(body, questionIds, createdByUserId) {
  const {
    title,
    description,
    type,
    generatorTopic,
    generatorCount,
    generatorDifficulty,
    generatorType,
  } = body;
  const payload = {
    title: String(title).trim(),
    description: description ? String(description).trim() : '',
    type: type ? String(type).trim() : 'Other',
    questionIds,
    verified: false,
    createdBy: createdByUserId,
  };
  if (generatorTopic != null && String(generatorTopic).trim()) payload.generatorTopic = String(generatorTopic).trim();
  if (generatorCount != null) payload.generatorCount = Math.min(10, Math.max(1, parseInt(generatorCount, 10) || 0)) || undefined;
  if (generatorDifficulty != null && String(generatorDifficulty).trim()) payload.generatorDifficulty = String(generatorDifficulty).trim();
  if (generatorType != null && String(generatorType).trim()) payload.generatorType = String(generatorType).trim();
  return payload;
}

async function createSet(body, createdByUserId) {
  const { title, questions: rawQuestions } = body;
  if (!title || !Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error('Cần tiêu đề và ít nhất một câu hỏi');
  }
  const questionDocs = await normalizeAndCreateQuestions(rawQuestions);
  if (questionDocs.length === 0) {
    throw new Error('Không có câu hỏi hợp lệ nào');
  }
  const pin = await QuestionSet.generateUniquePin();
  const setPayload = buildSetPayloadFromBody(body, questionDocs, createdByUserId);
  setPayload.pin = pin;
  const set = await QuestionSet.create(setPayload);
  return {
    set,
    questionCount: questionDocs.length,
  };
}

async function getStats() {
  const [totalQuestions, totalSets, verifiedSets] = await Promise.all([
    Question.countDocuments(),
    QuestionSet.countDocuments(),
    QuestionSet.countDocuments({ verified: true }),
  ]);
  return { totalQuestions, totalSets, verifiedSets };
}

function mapCreatedBy(createdBy) {
  if (!createdBy) return null;
  return {
    id: createdBy._id.toString(),
    email: createdBy.email || '',
    fullName: createdBy.username || createdBy.email || '—',
  };
}

function mapQuestionIds(set) {
  return Array.isArray(set.questionIds)
    ? set.questionIds.map((id) => (id && id._id ? id._id.toString() : String(id)))
    : [];
}

async function getSetById(id) {
  const set = await QuestionSet.findById(id).populate('createdBy', 'email username').lean();
  if (!set) return null;
  const questionIds = mapQuestionIds(set);
  const createdBy = mapCreatedBy(set.createdBy);
  return {
    id: set._id.toString(),
    title: set.title,
    description: set.description || '',
    type: set.type || 'Other',
    pin: set.pin || null,
    count: questionIds.length,
    questionIds,
    verified: !!set.verified,
    createdBy,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
    generatorTopic: set.generatorTopic || '',
    generatorCount: set.generatorCount ?? null,
    generatorDifficulty: set.generatorDifficulty || '',
    generatorType: set.generatorType || '',
  };
}

async function updateSet(id, body) {
  const {
    title,
    description,
    type,
    pin,
    verified,
    generatorTopic,
    generatorCount,
    generatorDifficulty,
    generatorType,
  } = body;
  const update = {};
  if (title !== undefined) update.title = String(title).trim();
  if (description !== undefined) update.description = String(description).trim();
  if (type !== undefined) update.type = String(type).trim() || 'Other';
  if (pin !== undefined) update.pin = pin === null || pin === '' ? null : String(pin).trim().toUpperCase();
  if (typeof verified === 'boolean') update.verified = verified;
  if (generatorTopic !== undefined) update.generatorTopic = String(generatorTopic).trim() || null;
  if (generatorCount !== undefined) {
    const n = parseInt(generatorCount, 10);
    update.generatorCount = Number.isFinite(n) ? Math.min(10, Math.max(0, n)) : null;
  }
  if (generatorDifficulty !== undefined) update.generatorDifficulty = String(generatorDifficulty).trim() || null;
  if (generatorType !== undefined) update.generatorType = String(generatorType).trim() || null;

  const set = await QuestionSet.findByIdAndUpdate(id, update, { new: true })
    .populate('createdBy', 'email username')
    .lean();
  if (!set) return null;
  const questionIds = mapQuestionIds(set);
  const createdBy = mapCreatedBy(set.createdBy);
  return {
    id: set._id.toString(),
    title: set.title,
    description: set.description || '',
    type: set.type || 'Other',
    pin: set.pin || null,
    count: questionIds.length,
    questionIds,
    verified: !!set.verified,
    createdBy,
    createdAt: set.createdAt,
    updatedAt: set.updatedAt,
    generatorTopic: set.generatorTopic || '',
    generatorCount: set.generatorCount ?? null,
    generatorDifficulty: set.generatorDifficulty || '',
    generatorType: set.generatorType || '',
  };
}

function parseUsedByEntries(question) {
  const correctAnswer = question.correctAnswer || '';
  const options = question.options || [];
  const usedByRaw = Array.isArray(question.usedBy) ? question.usedBy : [];
  const usedByEntries = [];
  const userIds = new Set();

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
  return { usedByEntries, userIds };
}

async function getQuestionById(id) {
  const question = await Question.findById(id).lean();
  if (!question) return null;

  const { usedByEntries, userIds } = parseUsedByEntries(question);

  const usersMap = {};
  if (userIds.size > 0) {
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('email username').lean();
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
      userStats[e.userId] = {
        total: 0,
        correct: 0,
        user: usersMap[e.userId] || { id: e.userId, email: '—', fullName: '—' },
        attempts: [],
      };
    }
    userStats[e.userId].total += 1;
    if (e.isCorrect) userStats[e.userId].correct += 1;
    let attemptedAtStr = null;
    if (e.attemptedAt) {
      if (typeof e.attemptedAt.toISOString === 'function') attemptedAtStr = e.attemptedAt.toISOString();
      else if (e.attemptedAt.$date) attemptedAtStr = typeof e.attemptedAt.$date === 'string' ? e.attemptedAt.$date : (e.attemptedAt.$date?.toISOString?.() ?? null);
      else if (typeof e.attemptedAt === 'string') attemptedAtStr = e.attemptedAt;
    }
    userStats[e.userId].attempts.push({
      answer: e.answer,
      attemptedAt: attemptedAtStr,
      isCorrect: e.isCorrect,
    });
  }
  const usedByUsers = Object.values(userStats).map((s) => ({
    ...s.user,
    totalAttempts: s.total,
    correctAttempts: s.correct,
    ratio: s.total > 0 ? `${s.correct}/${s.total}` : '0/0',
    attempts: s.attempts,
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

  return {
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
  };
}

async function getQuestionSets() {
  const sets = await QuestionSet.find().sort({ createdAt: -1 }).lean();
  return sets.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    description: s.description || '',
    type: s.type || 'Other',
    count: Array.isArray(s.questionIds) ? s.questionIds.length : 0,
    verified: !!s.verified,
  }));
}

async function getQuestions() {
  const questions = await Question.find().sort({ createdAt: -1 }).limit(100).lean();
  return questions.map((q) => ({
    id: q._id.toString(),
    content: q.content,
    tags: q.tags || [],
    difficulty: q.difficulty || 'medium',
    usedCount: Array.isArray(q.usedBy) ? q.usedBy.length : 0,
  }));
}

async function getQuestionsBySet(setId) {
  const set = await QuestionSet.findById(setId).lean();
  if (!set) return null;
  const questionIds = Array.isArray(set.questionIds) ? set.questionIds : [];
  if (questionIds.length === 0) return [];
  const questions = await Question.find({ _id: { $in: questionIds } }).sort({ createdAt: -1 }).lean();
  return questions.map((q) => ({
    id: q._id.toString(),
    content: q.content,
    tags: q.tags || [],
    difficulty: q.difficulty || 'medium',
    usedCount: Array.isArray(q.usedBy) ? q.usedBy.length : 0,
    verified: !!q.verified,
    archived: !!q.archived,
  }));
}

async function updateQuestionSetVerify(id, verified) {
  if (typeof verified !== 'boolean') throw new Error('Trường "verified" phải là boolean');
  const set = await QuestionSet.findByIdAndUpdate(id, { verified }, { new: true });
  if (!set) return null;
  return {
    id: set._id.toString(),
    title: set.title,
    description: set.description || '',
    type: set.type || 'Other',
    count: Array.isArray(set.questionIds) ? set.questionIds.length : 0,
    verified: !!set.verified,
  };
}

async function updateQuestion(id, body) {
  const { content, options, correctAnswer, difficulty, explanation } = body;
  const update = {};
  if (content !== undefined) update.content = String(content).trim();
  if (correctAnswer !== undefined) update.correctAnswer = String(correctAnswer).trim();
  if (explanation !== undefined) update.explanation = String(explanation).trim() || null;
  if (difficulty !== undefined && ['easy', 'medium', 'hard'].includes(String(difficulty).toLowerCase())) {
    update.difficulty = String(difficulty).toLowerCase();
  }
  if (options !== undefined && Array.isArray(options)) {
    update.options = options
      .map((o) => {
        if (typeof o === 'string') return { text: String(o).trim(), isCorrect: false };
        return {
          text: String(o?.text ?? o?.option ?? '').trim(),
          isCorrect: !!o?.isCorrect,
        };
      })
      .filter((o) => o.text);
  }
  const question = await Question.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!question) return null;
  return {
    id: question._id.toString(),
    content: question.content,
    options: question.options || [],
    correctAnswer: question.correctAnswer,
    difficulty: question.difficulty,
    explanation: question.explanation,
  };
}

async function updateQuestionVerify(id, verified) {
  if (typeof verified !== 'boolean') throw new Error('Trường "verified" phải là boolean');
  const question = await Question.findByIdAndUpdate(id, { verified }, { new: true }).lean();
  if (!question) return null;
  return { id: question._id.toString(), verified: !!question.verified };
}

async function updateQuestionArchive(id, archived) {
  if (typeof archived !== 'boolean') throw new Error('Trường "archived" phải là boolean');
  const question = await Question.findByIdAndUpdate(id, { archived }, { new: true }).lean();
  if (!question) return null;
  return { id: question._id.toString(), archived: !!question.archived };
}

async function reviewQuestion(id, action) {
  if (!['GOOD', 'HIDE'].includes(action)) throw new Error('action không hợp lệ');
  const update = {};
  if (action === 'GOOD') {
    update.verified = true;
    update.archived = false;
  }
  if (action === 'HIDE') update.archived = true;

  const question = await Question.findByIdAndUpdate(id, update, { new: true });
  if (!question) return null;
  return {
    id: question._id.toString(),
    content: question.content,
    tags: question.tags || [],
    difficulty: question.difficulty || 'medium',
    usedCount: Array.isArray(question.usedBy) ? question.usedBy.length : 0,
    verified: !!question.verified,
    archived: !!question.archived,
  };
}

module.exports = {
  createSet,
  getStats,
  getSetById,
  updateSet,
  getQuestionById,
  getQuestionSets,
  getQuestions,
  getQuestionsBySet,
  updateQuestionSetVerify,
  updateQuestion,
  updateQuestionVerify,
  updateQuestionArchive,
  reviewQuestion,
};
