/**
 * AI Content Controller – sinh câu hỏi bằng Gemini (API key chỉ ở backend).
 * POST /api/ai/generate (protect) – body: { topic, count, difficulty, type }
 * Nếu đã có question_set với cùng (topic, count, difficulty, type) thì trả từ cache, không gọi AI.
 */
const aiService = require('../services/ai.service');

const generateQuestions = async (req, res) => {
  try {
    const result = await aiService.generateQuestions(req.body || {});
    const statusCode = result.fromCache ? 200 : 200;
    return res.status(statusCode).json({
      success: true,
      data: result.data,
      ...(result.fromCache !== undefined && { fromCache: result.fromCache }),
      ...(result.existingPin != null && { existingPin: result.existingPin }),
    });
  } catch (err) {
    console.error('AI generateQuestions error:', err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Lỗi khi gọi AI tạo câu hỏi.',
    });
  }
};

module.exports = {
  generateQuestions,
};
