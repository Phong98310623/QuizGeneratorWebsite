const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');

router.post('/request-pin', protect, paymentController.requestPaymentPin);
router.post('/confirm-transfer', protect, paymentController.confirmTransfer);

// Admin routes
router.get('/admin/list', protect, requireAdmin, paymentController.adminListPayments);
router.patch('/admin/update-status', protect, requireAdmin, paymentController.adminUpdateStatus);

module.exports = router;
