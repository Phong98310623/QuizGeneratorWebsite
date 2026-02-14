const reportService = require('../services/report.service');
const sse = require('../lib/sse');

const createReport = async (req, res) => {
  try {
    const { report, notification } = await reportService.createReport(req.body, req.user?._id);
    if (notification) {
      sse.broadcast({
        type: 'NEW_NOTIFICATION',
        payload: {
          _id: notification._id?.toString?.(),
          title: notification.title,
          content: notification.content,
          icon: notification.icon,
          type: notification.type,
          createdAt: notification.createdAt,
          link: notification.link,
        },
      });
    }
    res.status(201).json({
      success: true,
      data: {
        id: report._id.toString(),
        status: report.status,
      },
    });
  } catch (error) {
    console.error('createReport error:', error);
    const status = error.message && (error.message.includes('Thiếu') || error.message.includes('phải là')) ? 400 : 500;
    res.status(status).json({ success: false, message: error.message || 'Lỗi khi gửi báo cáo' });
  }
};

const getReportById = async (req, res) => {
  try {
    const mapped = await reportService.getReportById(req.params.id);
    if (!mapped) return res.status(404).json({ success: false, message: 'Report không tồn tại' });
    res.json(mapped);
  } catch (error) {
    console.error('getReportById error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải chi tiết report' });
  }
};

const getReports = async (req, res) => {
  try {
    const mapped = await reportService.getReports();
    res.json(mapped);
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách report' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const data = await reportService.resolveReport(req.params.id, req.user?.username || 'Admin');
    if (!data) return res.status(404).json({ success: false, message: 'Report không tồn tại' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('resolveReport error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi resolve report' });
  }
};

const dismissReport = async (req, res) => {
  try {
    const data = await reportService.dismissReport(req.params.id, req.user?.username || 'Admin');
    if (!data) return res.status(404).json({ success: false, message: 'Report không tồn tại' });
    res.json({ success: true, data });
  } catch (error) {
    console.error('dismissReport error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi dismiss report' });
  }
};

module.exports = { createReport, getReportById, getReports, resolveReport, dismissReport };
