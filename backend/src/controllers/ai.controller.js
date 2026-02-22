/**
 * AI Content Controller – sinh câu hỏi bằng Gemini (API key chỉ ở backend).
 * POST /api/ai/generate (protect) – body: { topic, count, difficulty, type }
 * POST /api/ai/generate-from-file (protect, multipart) – tạo câu hỏi từ file upload
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

const generateQuestionsFromFile = async (req, res) => {
  try {
    // Kiểm tra file hoặc textContent
    if (!req.file && (!req.body || !req.body.textContent)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload một file hoặc cung cấp nội dung văn bản.',
      });
    }

    const { count, difficulty, type, title, textContent } = req.body || {};
    const fileExt = req.file ? require('path').extname(req.file.originalname).toLowerCase() : '';

    // Extract nội dung từ file (PDF hoặc text) hoặc dùng textContent trực tiếp
    let fileContent = '';
    if (textContent) {
      fileContent = textContent;
    } else if (req.file) {
      try {
        fileContent = await aiService.extractFileContent(req.file.buffer, fileExt);
      } catch (extractErr) {
        return res.status(400).json({
          success: false,
          message: extractErr.message || 'Lỗi khi đọc file.',
        });
      }
    }

    // Giới hạn kích thước nội dung
    if (fileContent.length > 20000) {
      fileContent = fileContent.substring(0, 20000) + '\n... (nội dung bị cắt ngắn)';
    }

    const result = await aiService.generateQuestionsFromFile(
      fileContent,
      count || 5,
      difficulty || 'Trung bình',
      type || 'Trắc nghiệm',
      title || ''
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      fromCache: false,
    });
  } catch (err) {
    console.error('AI generateQuestionsFromFile error:', err);
    const status = err.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: err.message || 'Lỗi khi tạo câu hỏi từ file.',
    });
  }
};

module.exports = {
  generateQuestions,
  generateQuestionsFromFile,
};
