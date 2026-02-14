const authService = require('../services/auth.service');

const isProd = process.env.NODE_ENV === 'production';
const COOKIE_ACCESS_MAX_AGE = 15 * 60 * 1000;       // 15m
const COOKIE_REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30d

function setAuthCookies(res, accessToken, refreshToken) {
    const base = { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/' };
    res.cookie('auth_token', accessToken, { ...base, maxAge: COOKIE_ACCESS_MAX_AGE });
    res.cookie('auth_refresh_token', refreshToken, { ...base, maxAge: COOKIE_REFRESH_MAX_AGE });
}

function clearAuthCookies(res) {
    res.clearCookie('auth_token', { path: '/' });
    res.clearCookie('auth_refresh_token', { path: '/' });
}

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        setAuthCookies(res, user.accessToken, user.refreshToken);
        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: user
        });
    } catch (error) {
        return res.status(400).json({
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
        setAuthCookies(res, user.accessToken, user.refreshToken);
        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: user
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Refresh access + refresh token (cookie auth_refresh_token hoặc body refreshToken)
// @route   POST /api/auth/refresh
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.auth_refresh_token || req.body?.refreshToken;
        const data = await authService.refreshTokens(refreshToken);
        setAuthCookies(res, data.accessToken, data.refreshToken);
        return res.status(200).json({
            success: true,
            message: 'Token đã gia hạn',
            data
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Logout: xóa cookie auth_token, auth_refresh_token
// @route   POST /api/auth/logout
const logout = async (req, res) => {
    clearAuthCookies(res);
    return res.status(200).json({ success: true, message: 'Đã đăng xuất' });
};

// @desc    Lấy thông tin user hiện tại (Route bảo vệ)
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: req.user
    });
};

// @desc    Cập nhật profile (username). Route bảo vệ.
// @route   PATCH /api/auth/me
const updateMe = async (req, res) => {
    try {
        const user = await authService.updateProfile(req.user.id, req.body);
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Đổi mật khẩu. Route bảo vệ. Body: currentPassword, newPassword
// @route   PATCH /api/auth/me/password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Cần nhập mật khẩu hiện tại và mật khẩu mới'
            });
        }
        await authService.changePassword(req.user.id, currentPassword, newPassword);
        return res.status(200).json({
            success: true,
            message: 'Đã đổi mật khẩu thành công'
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    register,
    login,
    refresh,
    logout,
    getMe,
    updateMe,
    changePassword
};