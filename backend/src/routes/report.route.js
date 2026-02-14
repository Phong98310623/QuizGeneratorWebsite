const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { protect, requireAdmin } = require('../middlewares/auth.middleware');

router.post('/', reportController.createReport);
router.get('/', protect, requireAdmin, reportController.getReports);
router.get('/:id', protect, requireAdmin, reportController.getReportById);
router.patch('/:id/resolve', protect, requireAdmin, reportController.resolveReport);
router.patch('/:id/dismiss', protect, requireAdmin, reportController.dismissReport);

module.exports = router;
