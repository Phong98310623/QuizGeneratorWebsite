const userService = require('../services/user.service');

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
    res.json({ success: true, message: 'User deleted' });
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

const getMyHistory = async (req, res) => {
  try {
    const result = await userService.getMyHistory(req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('getMyHistory error:', error);
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải lịch sử' });
  }
};

const getMyFavoritesAndCollections = async (req, res) => {
  try {
    const withDetails = req.query.details === '1' || req.query.details === 'true';
    const data = await userService.getMyFavoritesAndCollections(req.user._id, withDetails);
    if (!data) return res.status(404).json({ success: false, message: 'User not found' });
    if (!withDetails) {
      return res.json({ success: true, data: { favorites: data.favorites, savedCollections: data.savedCollections } });
    }
    res.json({
      success: true,
      data: {
        favorites: data.favorites,
        favoriteQuestions: data.favoriteQuestions,
        savedCollections: data.savedCollections,
        savedCollectionsWithQuestions: data.savedCollectionsWithQuestions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Lỗi khi tải dữ liệu' });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const { questionId } = req.body;
    const data = await userService.toggleFavorite(req.user._id, questionId);
    if (!data) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Lỗi khi cập nhật favorites' });
  }
};

const createSavedCollection = async (req, res) => {
  try {
    const { name } = req.body;
    const data = await userService.createSavedCollection(req.user._id, name);
    if (!data) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Lỗi khi tạo bộ sưu tập' });
  }
};

const addQuestionToCollection = async (req, res) => {
  try {
    const { nameid } = req.params;
    const { questionId } = req.body;
    const data = await userService.addQuestionToCollection(req.user._id, nameid, questionId);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.message === 'User not found' || error.message === 'Bộ sưu tập không tồn tại' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi thêm câu hỏi' });
  }
};

const removeQuestionFromCollection = async (req, res) => {
  try {
    const { nameid } = req.params;
    const { questionId } = req.body;
    const data = await userService.removeQuestionFromCollection(req.user._id, nameid, questionId);
    res.json({ success: true, data });
  } catch (error) {
    const status = error.message === 'User not found' || error.message === 'Bộ sưu tập không tồn tại' ? 404 : 400;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi xóa câu hỏi' });
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
