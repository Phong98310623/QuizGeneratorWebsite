const paymentService = require('../services/payment.service');

const requestPaymentPin = async (req, res) => {
    try {
        const { amount, method } = req.body;
        const userId = req.user._id;

        if (!amount || !method) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin số tiền hoặc phương thức thanh toán'
            });
        }

        const payment = await paymentService.createPaymentRequest(userId, amount, method);

        res.status(201).json({
            success: true,
            data: {
                transactionContent: payment.transactionContent,
                amount: payment.amount,
                method: payment.method
            }
        });
    } catch (error) {
        console.error('requestPaymentPin error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi yêu cầu mã thanh toán'
        });
    }
};

const confirmTransfer = async (req, res) => {
    try {
        const { transactionContent } = req.body;
        const userId = req.user._id;

        if (!transactionContent) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã giao dịch'
            });
        }

        const payment = await paymentService.confirmTransfer(userId, transactionContent);

        res.status(200).json({
            success: true,
            message: 'Đã thông báo cho admin kiểm tra',
            data: payment
        });
    } catch (error) {
        console.error('confirmTransfer error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xác nhận chuyển khoản'
        });
    }
};

const adminListPayments = async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const payments = await paymentService.getAllPayments(query);

        res.status(200).json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('adminListPayments error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách thanh toán'
        });
    }
};

const adminUpdateStatus = async (req, res) => {
    try {
        const { paymentId, status } = req.body;
        const adminId = req.user._id;

        if (!paymentId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu paymentId hoặc trạng thái mới'
            });
        }

        const payment = await paymentService.updatePaymentStatus(paymentId, status, adminId);

        res.status(200).json({
            success: true,
            message: `Đã cập nhật trạng thái giao dịch sang ${status}`,
            data: payment
        });
    } catch (error) {
        console.error('adminUpdateStatus error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật trạng thái thanh toán'
        });
    }
};

module.exports = {
    requestPaymentPin,
    confirmTransfer,
    adminListPayments,
    adminUpdateStatus
};
