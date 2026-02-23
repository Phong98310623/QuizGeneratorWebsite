/**
 * AI Content Controller – sinh câu hỏi bằng Gemini (API key chỉ ở backend).
 * POST /api/ai/generate (protect) – body: { topic, count, difficulty, type }
 * POST /api/ai/generate-from-file (protect, multipart) – tạo câu hỏi từ file upload
 * Nếu đã có question_set với cùng (topic, count, difficulty, type) thì trả từ cache, không gọi AI.
 */
const aiService = require('../services/ai.service');
const User = require('../models/user.model');

/**
 * Helper: Kiểm tra và cập nhật giới hạn sử dụng AI cho user thường.
 * Trả về { restricted: true, message } nếu hết lượt.
 * Trả về { restricted: false, updateLimit: fn } nếu còn lượt.
 */
const checkAiLimit = async (user) => {
  // Admin và VIP không bị giới hạn
  if (user.role === 'ADMIN' || user.role === 'VIP') {
    return { restricted: false };
  }

  const limitCount = parseInt(process.env.AI_FREE_LIMIT || '1', 10);
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  let { date, count } = user.aiLimit || { date: null, count: 0 };

  // Nếu là ngày mới, reset count
  if (date !== today) {
    date = today;
    count = 0;
  }

  if (count >= limitCount) {
    return {
      restricted: true,
      message: `Bạn đã sử dụng hết ${limitCount} lượt tạo câu hỏi AI miễn phí của ngày hôm nay. Vui lòng nâng cấp VIP để sử dụng không giới hạn!`,
    };
  }

  // Trả về function để cập nhật sau khi gọi AI thành công
  return {
    restricted: false,
    updateLimit: async () => {
      await User.findByIdAndUpdate(user._id, {
        'aiLimit.date': today,
        'aiLimit.count': count + 1,
      });
    },
  };
};

const generateQuestions = async (req, res) => {
  try {
    // Kiểm tra giới hạn trước
    const limitCheck = await checkAiLimit(req.user);
    if (limitCheck.restricted) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        isLimitReached: true, // Thêm flag để frontend dễ xử lý
      });
    }

    const { topic, count, difficulty, type, title, description } = req.body || {};
    const result = await aiService.generateQuestions({
      topic,
      count,
      difficulty,
      type,
      title,
      description,
      createdBy: req.user._id,
    });

    // Nếu tạo thành công (không lỗi), cập nhật giới hạn (trừ khi là từ cache - tùy bạn quyết định)
    // Ở đây ta cứ tính 1 lần yêu cầu là 1 lần dùng, kể cả cache để đơn giản
    if (limitCheck.updateLimit) {
      await limitCheck.updateLimit();
    }

    const statusCode = result.fromCache ? 200 : 200;
    return res.status(statusCode).json({
      success: true,
      data: result.data,
      setId: result.setId,
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
    // Kiểm tra giới hạn trước
    const limitCheck = await checkAiLimit(req.user);
    if (limitCheck.restricted) {
      return res.status(403).json({
        success: false,
        message: limitCheck.message,
        isLimitReached: true,
      });
    }

    // Kiểm tra file hoặc textContent
    if (!req.file && (!req.body || !req.body.textContent)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload một file hoặc cung cấp nội dung văn bản.',
      });
    }

    const { count, difficulty, type, title, description, textContent } = req.body || {};
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
      title || '',
      description || '',
      req.user._id
    );

    // Cập nhật giới hạn sau khi thành công
    if (limitCheck.updateLimit) {
      await limitCheck.updateLimit();
    }

    return res.status(200).json({
      success: true,
      data: result.data,
      setId: result.setId,
      fromCache: false,
      existingPin: result.existingPin,
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
