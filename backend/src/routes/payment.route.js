const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');

router.get('/vip-pricing', paymentController.getVipPricing);
router.post('/request-pin', protect, paymentController.requestPaymentPin);
router.post('/confirm-transfer', protect, paymentController.confirmTransfer);
router.post('/verify-payos', protect, paymentController.verifyPayOS);

// PayOS Webhook
router.post('/payos-webhook', paymentController.payosWebhook);

// Admin routes
router.get('/admin/list', protect, requireAdmin, paymentController.adminListPayments);
router.patch('/admin/update-status', protect, requireAdmin, paymentController.adminUpdateStatus);

module.exports = router;
