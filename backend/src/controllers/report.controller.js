const Report = require('../models/report.model');

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

module.exports = { getReports, resolveReport, dismissReport };
