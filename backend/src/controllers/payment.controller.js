const paymentService = require('../services/payment.service');

const getVipPricing = (req, res) => {
    const payosPrice = Number(process.env.VIP_PRICE_PAYOS) || 100000;
    const transferPrice = Number(process.env.VIP_PRICE_TRANSFER) || 95000;
    res.json({
        success: true,
        data: {
            payosPrice,
            transferPrice,
            packageName: process.env.VIP_PACKAGE_NAME || 'VIP Pro',
            duration: process.env.VIP_DURATION || 'Vinh vien',
        }
    });
};

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
        
        const responseData = {
            transactionContent: payment.transactionContent,
            amount: payment.amount,
            method: payment.method
        };

        if (payment.method === 'PAYOS') {
            if (payment.checkoutUrl) responseData.checkoutUrl = payment.checkoutUrl;
            if (payment.orderCode) responseData.orderCode = payment.orderCode;
        }

        res.status(201).json({
            success: true,
            data: responseData
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

const verifyPayOS = async (req, res) => {
    try {
        const { orderCode } = req.body;
        const userId = req.user._id;

        if (!orderCode) {
            return res.status(400).json({ success: false, message: 'Thiếu orderCode' });
        }

        const payment = await paymentService.verifyPayOSPayment(userId, Number(orderCode));

        res.status(200).json({
            success: true,
            data: {
                status: payment.status,
                completed: payment.status === 'COMPLETED'
            }
        });
    } catch (error) {
        console.error('verifyPayOS error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi xác minh thanh toán'
        });
    }
};

const payosWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        console.log('PayOS Webhook data:', webhookData);
        
        // PayOS sends status in body.data for verification
        // For simplicity in this demo, we use req.body directly
        // In production, use payOS.verifyPaymentWebhookData(req.body)
        
        const { orderCode, status } = webhookData.data || webhookData;
        
        if (orderCode) {
            await paymentService.handlePayOSWebhook({ orderCode, status });
        }

        res.status(200).json({
            success: true,
            message: 'Webhook processed'
        });
    } catch (error) {
        console.error('payosWebhook error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    getVipPricing,
    requestPaymentPin,
    confirmTransfer,
    verifyPayOS,
    adminListPayments,
    adminUpdateStatus,
    payosWebhook
};
