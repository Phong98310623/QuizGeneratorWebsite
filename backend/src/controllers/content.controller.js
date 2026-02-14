const contentService = require('../services/content.service');

const createSet = async (req, res) => {
  try {
    const { set, questionCount } = await contentService.createSet(req.body, req.user._id || req.user.id);
    return res.status(201).json({
      success: true,
      data: {
        id: set._id.toString(),
        pin: set.pin,
        title: set.title,
        description: set.description || '',
        type: set.type || 'Other',
        count: questionCount,
      },
    });
  } catch (error) {
    console.error('createSet error:', error);
    const status = error.message && (error.message.includes('Cần') || error.message.includes('Không có')) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi tạo bộ câu hỏi' });
  }
};

const getStats = async (req, res) => {
  try {
    const data = await contentService.getStats();
    res.json(data);
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thống kê' });
  }
};

const getSetById = async (req, res) => {
  try {
    const data = await contentService.getSetById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Question set không tồn tại' });
    res.json(data);
  } catch (error) {
    console.error('getSetById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin bộ câu hỏi' });
  }
};

const updateSet = async (req, res) => {
  try {
    const data = await contentService.updateSet(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Question set không tồn tại' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('updateSet error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bộ câu hỏi' });
  }
};

const getQuestionById = async (req, res) => {
  try {
    const data = await contentService.getQuestionById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    res.json(data);
  } catch (error) {
    console.error('getQuestionById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải thông tin câu hỏi' });
  }
};

const getQuestionSets = async (req, res) => {
  try {
    const mapped = await contentService.getQuestionSets();
    res.json(mapped);
  } catch (error) {
    console.error('getQuestionSets error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách question sets' });
  }
};

const getQuestions = async (req, res) => {
  try {
    const mapped = await contentService.getQuestions();
    res.json(mapped);
  } catch (error) {
    console.error('getQuestions error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách câu hỏi' });
  }
};

const getQuestionsBySet = async (req, res) => {
  try {
    const data = await contentService.getQuestionsBySet(req.params.id);
    if (data === null) return res.status(404).json({ success: false, message: 'Question set không tồn tại' });
    res.json(data);
  } catch (error) {
    console.error('getQuestionsBySet error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải câu hỏi theo bộ' });
  }
};

const updateQuestionSetVerify = async (req, res) => {
  try {
    const { verified } = req.body;
    const data = await contentService.updateQuestionSetVerify(req.params.id, verified);
    if (!data) return res.status(404).json({ success: false, message: 'Question set không tồn tại' });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('updateQuestionSetVerify error:', error);
    const status = error.message && error.message.includes('verified') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi cập nhật trạng thái verify của question set' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const data = await contentService.updateQuestion(req.params.id, req.body);
    if (!data) return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('updateQuestion error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật câu hỏi' });
  }
};

const updateQuestionVerify = async (req, res) => {
  try {
    const { verified } = req.body;
    const data = await contentService.updateQuestionVerify(req.params.id, verified);
    if (!data) return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('updateQuestionVerify error:', error);
    const status = error.message && error.message.includes('verified') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi cập nhật trạng thái verify' });
  }
};

const updateQuestionArchive = async (req, res) => {
  try {
    const { archived } = req.body;
    const data = await contentService.updateQuestionArchive(req.params.id, archived);
    if (!data) return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('updateQuestionArchive error:', error);
    const status = error.message && error.message.includes('archived') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi cập nhật trạng thái archive' });
  }
};

const reviewQuestion = async (req, res) => {
  try {
    const { action } = req.body;
    const data = await contentService.reviewQuestion(req.params.id, action);
    if (!data) return res.status(404).json({ success: false, message: 'Câu hỏi không tồn tại' });
    return res.json({ success: true, data });
  } catch (error) {
    console.error('reviewQuestion error:', error);
    const status = error.message && error.message.includes('action') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi đánh giá câu hỏi' });
  }
};

module.exports = {
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
  createSet,
};
