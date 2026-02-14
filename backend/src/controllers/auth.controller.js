const authService = require('../services/auth.service');

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Đăng nhập
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const user = await authService.loginUser(req.body);
        res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: user
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Lấy thông tin user hiện tại (Route bảo vệ)
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    // req.user đã được gán từ middleware
    res.status(200).json({
        success: true,
        data: req.user
    });
};

// @desc    Cập nhật profile (username). Route bảo vệ.
// @route   PATCH /api/auth/me
const updateMe = async (req, res) => {
    try {
        const user = await authService.updateProfile(req.user.id, req.body);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateMe
};