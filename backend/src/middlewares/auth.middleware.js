const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token =
        req.cookies?.auth_token ||
        (req.headers.authorization && req.headers.authorization.startsWith('Bearer')
            ? req.headers.authorization.split(' ')[1]
            : null);

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại' });
            }
            if (req.user.status !== 'ACTIVE') {
                return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa hoặc vô hiệu hóa' });
            }

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
        }
    }

    return res.status(401).json({ success: false, message: 'Không có token, từ chối truy cập' });
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Chỉ ADMIN mới được phép truy cập' });
    }
    next();
};

module.exports = { protect, requireAdmin };