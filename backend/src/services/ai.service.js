const QuestionSet = require('../models/question_set.model');
const Question = require('../models/question.model');

const GENERATIVE_LANGUAGE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-2.5-flash';

const responseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      question: { type: 'string', description: 'Nội dung câu hỏi.' },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Danh sách các lựa chọn trả lời (nếu là trắc nghiệm). Để trống nếu là tự luận.',
      },
      correctAnswer: { type: 'string', description: 'Đáp án đúng.' },
      explanation: { type: 'string', description: 'Giải thích ngắn gọn tại sao đáp án này đúng.' },
    },
    required: ['question', 'correctAnswer', 'explanation'],
  },
};

/**
 * Kiểm tra cache: nếu đã có question_set với cùng (topic, count, difficulty, type) thì trả về data từ cache.
 */
async function getCachedQuestions(topicTrim, numCount, difficultyStr, typeStr) {
  const cached = await QuestionSet.findOne({
    generatorTopic: topicTrim,
    generatorCount: numCount,
    generatorDifficulty: difficultyStr,
    generatorType: typeStr,
  }).lean();

  if (!cached || !Array.isArray(cached.questionIds) || cached.questionIds.length === 0) {
    return null;
  }

  const questions = await Question.find({ _id: { $in: cached.questionIds }, archived: { $ne: true } }).lean();
  const orderMap = new Map(cached.questionIds.map((id, i) => [id.toString(), i]));
  const sorted = [...questions].sort(
    (a, b) => (orderMap.get(a._id.toString()) ?? 0) - (orderMap.get(b._id.toString()) ?? 0)
  );
  return {
    data: sorted.map((q) => ({
      question: q.content || '',
      options: (q.options || []).map((o) => o.text),
      correctAnswer: q.correctAnswer || '',
      explanation: q.explanation || '',
    })),
    fromCache: true,
    existingPin: cached.pin || null,
  };
}

function buildPrompt(topicTrim, numCount, difficultyStr, typeStr) {
  return `
    Hãy đóng vai một chuyên gia giáo dục.
    Nhiệm vụ: Tạo ra ${numCount} câu hỏi về chủ đề "${topicTrim}".
    Độ khó: ${difficultyStr}.
    Loại câu hỏi: ${typeStr}.
    Ngôn ngữ: Tiếng Việt.

    Yêu cầu bổ sung:
    - Nếu là Trắc nghiệm (Multiple Choice), hãy cung cấp 4 lựa chọn trong mảng 'options'.
    - Nếu là Đúng/Sai (True/False), hãy cung cấp 2 lựa chọn "Đúng" và "Sai" trong mảng 'options'.
    - Nếu là Tự luận ngắn (Short Answer), hãy để mảng 'options' rỗng.
    - Đảm bảo câu hỏi rõ ràng, chính xác và mang tính giáo dục.
    Trả về đúng một mảng JSON, mỗi phần tử có: question, options (mảng), correctAnswer, explanation.
  `;
}

/**
 * Gọi Gemini REST API và parse response thành danh sách câu hỏi.
 */
async function callGeminiGenerate(apiKey, topicTrim, numCount, difficultyStr, typeStr) {
  const modelId = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `${GENERATIVE_LANGUAGE_URL}/models/${modelId}:generateContent?key=${apiKey}`;
  const prompt = buildPrompt(topicTrim, numCount, difficultyStr, typeStr);
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMessage =
      (data.error && (data.error.message || data.error.status)) || `Gemini API lỗi: ${response.status}`;
    const err = new Error(errMessage);
    err.statusCode = response.status >= 500 ? 502 : 400;
    throw err;
  }

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const err = new Error('Không nhận được nội dung từ Gemini.');
    err.statusCode = 502;
    throw err;
  }

  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : [parsed];
  return list.map((q) => ({
    question: q.question != null ? String(q.question) : '',
    options: Array.isArray(q.options) ? q.options.map((o) => String(o)) : [],
    correctAnswer: q.correctAnswer != null ? String(q.correctAnswer) : '',
    explanation: q.explanation != null ? String(q.explanation) : '',
  }));
}

/**
 * Sinh câu hỏi: ưu tiên cache, không có thì gọi Gemini.
 * @returns { data, fromCache?, existingPin? }
 */
async function generateQuestions(params) {
  const { topic, count, difficulty, type } = params;
  const topicTrim = (topic && typeof topic === 'string' ? topic : '').trim();
  if (!topicTrim) {
    const err = new Error('Thiếu chủ đề (topic).');
    err.statusCode = 400;
    throw err;
  }

  const numCount = Math.min(10, Math.max(1, parseInt(count, 10) || 5));
  const difficultyStr = difficulty && String(difficulty).trim() ? String(difficulty).trim() : 'Trung bình';
  const typeStr = type && String(type).trim() ? String(type).trim() : 'Trắc nghiệm';

  const cached = await getCachedQuestions(topicTrim, numCount, difficultyStr, typeStr);
  if (cached) return cached;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error('Chưa cấu hình GEMINI_API_KEY trên server. Không thể tạo câu hỏi bằng AI.');
    err.statusCode = 503;
    throw err;
  }

  const data = await callGeminiGenerate(apiKey, topicTrim, numCount, difficultyStr, typeStr);
  return { data, fromCache: false };
}

module.exports = {
  generateQuestions,
};
