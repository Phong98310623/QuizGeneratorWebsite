const publicService = require('../services/public.service');

const listVerifiedSets = async (req, res) => {
  try {
    const { data, total } = await publicService.listVerifiedSets(req.query);
    res.json({ data, total });
  } catch (error) {
    console.error('listVerifiedSets error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách bộ câu hỏi' });
  }
};

const getSetByPin = async (req, res) => {
  try {
    const result = await publicService.getSetByPin(req.params.pin);
    if (result && result.error === 'invalid') {
      return res.status(400).json({ success: false, message: 'Mã PIN không hợp lệ' });
    }
    if (!result) {
      return res.status(404).json({ success: false, message: 'Bộ câu hỏi không tồn tại hoặc mã PIN không đúng' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('getSetByPin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải bộ câu hỏi' });
  }
};

const getQuestionsByPin = async (req, res) => {
  try {
    const result = await publicService.getQuestionsByPin(req.params.pin);
    if (result && result.error === 'invalid') {
      return res.status(400).json({ success: false, message: 'Mã PIN không hợp lệ' });
    }
    if (!result) {
      return res.status(404).json({ success: false, message: 'Bộ câu hỏi không tồn tại hoặc mã PIN không đúng' });
    }
    res.json({ data: result });
  } catch (error) {
    console.error('getQuestionsByPin error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải câu hỏi' });
  }
};

const submitAttempt = async (req, res) => {
  try {
    const pin = req.params.pin;
    const { answers } = req.body || {};
    const data = await publicService.submitAttempt(pin, req.user._id, answers);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Bộ câu hỏi không tồn tại' });
    }
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('submitAttempt error:', error);
    const status = error.message && error.message.includes('Thiếu') ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi lưu kết quả' });
  }
};

module.exports = {
  listVerifiedSets,
  getSetByPin,
  getQuestionsByPin,
  submitAttempt,
};
