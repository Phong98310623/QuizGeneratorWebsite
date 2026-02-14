const Report = require('../models/report.model');

/** Tạo report mới (public - người chơi không cần đăng nhập) */
const createReport = async (req, res) => {
  try {
    const { reporterName, reporterEmail, reportedEntityType, reportedEntityId, reportedEntityTitle, reason, description } = req.body;
    const validTypes = ['USER', 'QUIZ', 'CONTENT', 'OTHER'];
    if (!reporterName || !reporterEmail || !reportedEntityType || !reportedEntityId || !reportedEntityTitle || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin: reporterName, reporterEmail, reportedEntityType, reportedEntityId, reportedEntityTitle, reason là bắt buộc',
      });
    }
    if (!validTypes.includes(reportedEntityType)) {
      return res.status(400).json({
        success: false,
        message: `reportedEntityType phải là một trong: ${validTypes.join(', ')}`,
      });
    }
    const report = await Report.create({
      reporterName: String(reporterName).trim(),
      reporterEmail: String(reporterEmail).trim(),
      reportedEntityType,
      reportedEntityId: String(reportedEntityId),
      reportedEntityTitle: String(reportedEntityTitle).substring(0, 500),
      reason: String(reason).trim(),
      description: description ? String(description).trim() : undefined,
    });
    res.status(201).json({
      success: true,
      data: {
        id: report._id.toString(),
        status: report.status,
      },
    });
  } catch (error) {
    console.error('createReport error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi gửi báo cáo' });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).lean();
    const mapped = reports.map((r) => ({
      id: r._id.toString(),
      reporterName: r.reporterName,
      reporterEmail: r.reporterEmail,
      reportedEntityType: r.reportedEntityType,
      reportedEntityId: r.reportedEntityId,
      reportedEntityTitle: r.reportedEntityTitle,
      reason: r.reason,
      description: r.description,
      status: r.status,
      priority: r.priority,
      createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
      resolvedAt: r.resolvedAt?.toISOString?.() ?? r.resolvedAt,
      resolvedBy: r.resolvedBy,
    }));
    res.json(mapped);
  } catch (error) {
    console.error('getReports error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tải danh sách report' });
  }
};

const resolveReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: req.user?.username || 'Admin' },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report không tồn tại' });
    }
    res.json({
      success: true,
      data: {
        id: report._id.toString(),
        status: report.status,
        resolvedAt: report.resolvedAt?.toISOString?.(),
        resolvedBy: report.resolvedBy,
      },
    });
  } catch (error) {
    console.error('resolveReport error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi resolve report' });
  }
};

const dismissReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status: 'DISMISSED', resolvedAt: new Date(), resolvedBy: req.user?.username || 'Admin' },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report không tồn tại' });
    }
    res.json({
      success: true,
      data: {
        id: report._id.toString(),
        status: report.status,
        resolvedAt: report.resolvedAt?.toISOString?.(),
        resolvedBy: report.resolvedBy,
      },
    });
  } catch (error) {
    console.error('dismissReport error:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi dismiss report' });
  }
};

module.exports = { createReport, getReports, resolveReport, dismissReport };
