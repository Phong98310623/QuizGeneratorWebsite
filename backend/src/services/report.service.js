const Report = require('../models/report.model');
const notificationService = require('./notification.service');

const VALID_ENTITY_TYPES = ['USER', 'QUIZ', 'CONTENT', 'OTHER'];

function validateCreatePayload(body) {
  const { reporterName, reporterEmail, reportedEntityType, reportedEntityId, reportedEntityTitle, reason } = body;
  if (!reporterName || !reporterEmail || !reportedEntityType || !reportedEntityId || !reportedEntityTitle || !reason) {
    throw new Error('Thiếu thông tin: reporterName, reporterEmail, reportedEntityType, reportedEntityId, reportedEntityTitle, reason là bắt buộc');
  }
  if (!VALID_ENTITY_TYPES.includes(reportedEntityType)) {
    throw new Error(`reportedEntityType phải là một trong: ${VALID_ENTITY_TYPES.join(', ')}`);
  }
}

/**
 * Tạo report mới. Trả về { report, notification } (notification có thể null nếu tạo thất bại).
 */
async function createReport(body, createdByUserId) {
  validateCreatePayload(body);
  const {
    reporterName,
    reporterEmail,
    reportedEntityType,
    reportedEntityId,
    reportedEntityTitle,
    reason,
    description,
  } = body;

  const report = await Report.create({
    reporterName: String(reporterName).trim(),
    reporterEmail: String(reporterEmail).trim(),
    reportedEntityType,
    reportedEntityId: String(reportedEntityId),
    reportedEntityTitle: String(reportedEntityTitle).substring(0, 500),
    reason: String(reason).trim(),
    description: description ? String(description).trim() : undefined,
  });

  let notification = null;
  try {
    const reportIdStr = report._id.toString();
    const shortTitle = String(reportedEntityTitle).substring(0, 80);
    notification = await notificationService.createNotification({
      title: 'Báo cáo mới',
      content: `Có báo cáo mới: "${shortTitle}" (${reportedEntityType}) - từ ${String(reporterName).trim()}.`,
      icon: 'warning',
      type: 'WARNING',
      targetType: 'ROLE',
      targetRoles: ['ADMIN'],
      isGlobal: false,
      createdBy: createdByUserId,
      isActive: true,
      link: `/admin/preview/report/${reportIdStr}`,
    });
  } catch (err) {
    console.error('report.service createReport: tạo thông báo thất bại', err);
  }

  return { report, notification };
}

function mapReport(report) {
  if (!report) return null;
  const r = report.toObject ? report.toObject() : report;
  return {
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
  };
}

async function getReportById(id) {
  const report = await Report.findById(id).lean();
  return report ? mapReport(report) : null;
}

async function getReports() {
  const reports = await Report.find().sort({ createdAt: -1 }).lean();
  return reports.map(mapReport);
}

async function resolveReport(id, resolvedBy) {
  const report = await Report.findByIdAndUpdate(
    id,
    { status: 'RESOLVED', resolvedAt: new Date(), resolvedBy: resolvedBy || 'Admin' },
    { new: true }
  );
  if (!report) return null;
  return {
    id: report._id.toString(),
    status: report.status,
    resolvedAt: report.resolvedAt?.toISOString?.(),
    resolvedBy: report.resolvedBy,
  };
}

async function dismissReport(id, resolvedBy) {
  const report = await Report.findByIdAndUpdate(
    id,
    { status: 'DISMISSED', resolvedAt: new Date(), resolvedBy: resolvedBy || 'Admin' },
    { new: true }
  );
  if (!report) return null;
  return {
    id: report._id.toString(),
    status: report.status,
    resolvedAt: report.resolvedAt?.toISOString?.(),
    resolvedBy: report.resolvedBy,
  };
}

module.exports = {
  createReport,
  getReportById,
  getReports,
  resolveReport,
  dismissReport,
};
