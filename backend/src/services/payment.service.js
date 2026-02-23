const Payment = require('../models/payment.model');
const notificationService = require('./notification.service');

const generateUniquePin = async () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pin = '';
    let isUnique = false;
    
    while (!isUnique) {
        pin = '';
        for (let i = 0; i < 8; i++) {
            pin += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const existing = await Payment.findOne({ transactionContent: `VIP-${pin}` });
        if (!existing) {
            isUnique = true;
        }
    }
    
    return `VIP-${pin}`;
};

const createPaymentRequest = async (userId, amount, method) => {
    const transactionContent = await generateUniquePin();
    
    const payment = new Payment({
        userId,
        amount,
        method,
        transactionContent,
        status: 'PENDING'
    });
    
    await payment.save();
    return payment;
};

const updatePaymentStatus = async (paymentId, status, adminId = null) => {
    const payment = await Payment.findById(paymentId).populate('userId');
    if (!payment) {
        throw new Error('Không tìm thấy thông tin thanh toán');
    }

    const oldStatus = payment.status;
    payment.status = status;
    
    const User = require('../models/user.model');

    if (status === 'APPROVED' || status === 'COMPLETED') {
        payment.completedAt = new Date();
        await User.findByIdAndUpdate(payment.userId._id, { role: 'VIP' });
    } else if (oldStatus === 'APPROVED' || oldStatus === 'COMPLETED') {
        // Nếu chuyển từ APPROVED sang trạng thái khác (ví dụ REVIEW hoặc CANCELLED), hạ cấp role xuống USER
        await User.findByIdAndUpdate(payment.userId._id, { role: 'USER' });
        payment.completedAt = null;
    }
    
    await payment.save();

    // Notify user about status update
    if (status !== 'REVIEW' && status !== 'PENDING') {
        let type = 'INFO';
        let statusText = status === 'APPROVED' ? 'được duyệt' : 'bị hủy';
        if (status === 'APPROVED') type = 'SUCCESS';
        else if (status === 'CANCELLED' || status === 'REJECTED') type = 'ERROR';

        await notificationService.createNotification({
            title: 'Cập nhật trạng thái thanh toán',
            content: `Giao dịch ${payment.transactionContent} của bạn đã ${statusText}.`,
            targetType: 'USER',
            targetUsers: [payment.userId._id],
            type: type,
            isActive: true,
            createdBy: adminId || payment.userId._id
        });
    }

    return payment;
};

const confirmTransfer = async (userId, transactionContent) => {
    const payment = await Payment.findOne({ userId, transactionContent, status: 'PENDING' });
    if (!payment) {
        throw new Error('Không tìm thấy yêu cầu thanh toán chờ xử lý');
    }

    payment.status = 'REVIEW';
    await payment.save();

    // Notify admin
    await notificationService.createNotification({
        title: 'Yêu cầu xác nhận thanh toán mới',
        content: `Người dùng đã báo chuyển khoản cho giao dịch ${transactionContent}. Số tiền: ${payment.amount.toLocaleString()}đ`,
        targetType: 'ROLE',
        targetRoles: ['ADMIN'],
        type: 'INFO',
        isActive: true,
        createdBy: userId,
        link: '/admin/payments'
    });

    return payment;
};

const getAllPayments = async (query = {}) => {
    return await Payment.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 });
};

module.exports = {
    createPaymentRequest,
    updatePaymentStatus,
    confirmTransfer,
    getAllPayments
};
