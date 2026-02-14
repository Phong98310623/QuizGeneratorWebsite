const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Hàm tạo JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const registerUser = async (userData) => {
    const { username, email, password } = userData;

    // Kiểm tra user tồn tại
    const userExists = await User.findOne({ email });
    if (userExists) {
        throw new Error('Email đã được sử dụng');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo user
    const user = await User.create({
        username,
        email,
        password: hashedPassword
    });

    return {
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user.id)
    };
};

const loginUser = async (loginData) => {
    const { email, password } = loginData;

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
        console.error('No user found with email:', email);
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    // So sánh password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        console.error('Password mismatch for user:', user._id);
        throw new Error('Email hoặc mật khẩu không đúng');
    }

    return {
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        token: generateToken(user.id)
    };
};

const updateProfile = async (userId, data) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    if (data.username != null && String(data.username).trim()) {
        user.username = String(data.username).trim();
    }
    await user.save();
    return {
        _id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
    };
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile
};