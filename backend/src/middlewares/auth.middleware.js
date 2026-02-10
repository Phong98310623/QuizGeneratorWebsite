const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Lấy token từ header "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];

            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Tìm user từ token và gán vào req (loại bỏ password)
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, message: 'Token không hợp lệ' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'Không có token, từ chối truy cập' });
    }
};

module.exports = { protect };