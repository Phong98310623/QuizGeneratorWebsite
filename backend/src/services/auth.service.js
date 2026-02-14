const User = require('../models/user.model');
const RefreshTokenModule = require('../models/refreshToken.model');
const RefreshToken = RefreshTokenModule;
const hashToken = RefreshTokenModule.hashToken;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/** Parse "30d", "7d", "24h" to milliseconds */
function parseExpiresToMs(str) {
    if (!str || typeof str !== 'string') return 30 * 24 * 60 * 60 * 1000;
    const m = str.trim().match(/^(\d+)(d|h|m|s)$/);
    if (!m) return 30 * 24 * 60 * 60 * 1000;
    const n = parseInt(m[1], 10);
    const unit = m[2];
    const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
    return n * (multipliers[unit] || 86400000);
}

const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
};

/** Lưu refresh token vào DB (hash), trả về expiresAt */
async function saveRefreshToken(userId, token) {
    const expiresMs = parseExpiresToMs(REFRESH_EXPIRES);
    const expiresAt = new Date(Date.now() + expiresMs);
    await RefreshToken.create({
        userId,
        tokenHash: hashToken(token),
        expiresAt,
    });
    return expiresAt;
}

async function findRefreshTokenByToken(token) {
    const tokenHash = hashToken(token);
    return RefreshToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).populate('userId');
}

async function deleteRefreshToken(token) {
    const tokenHash = hashToken(token);
    await RefreshToken.deleteOne({ tokenHash });
}

/** Trả về { user, accessToken, refreshToken } */
async function buildAuthResponse(user) {
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);
    return {
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar || null,
        accessToken,
        refreshToken,
    };
}

const registerUser = async (userData) => {
    const { username, email, password } = userData;

    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new Error('Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        username,
        email,
        password: hashedPassword
    });

    return buildAuthResponse(user);
};

const loginUser = async (loginData) => {
    const { email, password } = loginData;

    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== 'ACTIVE') {
        throw new Error('Tài khoản đã bị khóa hoặc vô hiệu hóa');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    return buildAuthResponse(user);
};

/** Refresh token rotation: validate, tạo cặp mới, xóa token cũ */
const refreshTokens = async (refreshToken) => {
    if (!refreshToken) throw new Error('Thiếu refresh token');

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
        throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const doc = await findRefreshTokenByToken(refreshToken);
    if (!doc || !doc.userId) {
        throw new Error('Refresh token không tồn tại hoặc đã bị thu hồi');
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
        await RefreshToken.deleteMany({ userId: decoded.id });
        throw new Error('User không tồn tại');
    }
    if (user.status !== 'ACTIVE') {
        await RefreshToken.deleteMany({ userId: user.id });
        throw new Error('Tài khoản đã bị khóa hoặc vô hiệu hóa');
    }

    await deleteRefreshToken(refreshToken);
    return buildAuthResponse(user);
};

const updateProfile = async (userId, data) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    if (data.username != null && String(data.username).trim()) {
        user.username = String(data.username).trim();
    }
    if (data.avatar !== undefined) {
        if (data.avatar === null || data.avatar === '') {
            user.avatar = null;
        } else {
            const str = String(data.avatar);
            if (str.length > 500000) throw new Error('Ảnh avatar quá lớn (tối đa ~500KB)');
            user.avatar = str;
        }
    }
    await user.save();
    return {
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar || null,
    };
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        throw new Error('Mật khẩu hiện tại không đúng');
    }
    if (!newPassword || String(newPassword).length < 6) {
        throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
};

module.exports = {
    registerUser,
    loginUser,
    refreshTokens,
    updateProfile,
    changePassword
};