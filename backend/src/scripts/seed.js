/**
 * Seed script: tạo ADMIN, USER, demo user, Report, Questions và Question Sets mẫu.
 * Collections: users, reports, questions, question_sets
 * Chạy: node src/scripts/seed.js hoặc npm run seed
 */
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const USERS = [
  { email: 'admin@original.com', password: '666666', username: 'admin', role: 'ADMIN' },
  { email: 'interface.daodung@gmail.com', password: '666666', username: 'daodung', role: 'USER' },
  { email: 'demo@example.com', password: '666666', username: 'demo', role: 'USER' },
];

const COLLECTION_USERS = 'users';
const COLLECTION_REPORTS = 'reports';
const COLLECTION_QUESTIONS = 'questions';
const COLLECTION_QUESTION_SETS = 'question_sets';

// Mẫu câu hỏi đa dạng: Technical, Academic, Geography, Business
const SAMPLE_QUESTIONS = [
  // Technical
  { content: 'React Hook useState trả về gì?', options: [{ text: 'Giá trị và hàm setter', isCorrect: true }, { text: 'Chỉ giá trị', isCorrect: false }, { text: 'Chỉ hàm', isCorrect: false }], tags: ['react', 'hooks', 'frontend'], difficulty: 'easy' },
  { content: 'useEffect chạy sau mỗi render khi nào?', options: [{ text: 'Khi deps thay đổi', isCorrect: true }, { text: 'Chỉ lần đầu', isCorrect: false }, { text: 'Không bao giờ', isCorrect: false }], tags: ['react', 'hooks'], difficulty: 'medium' },
  { content: 'Python list comprehension dùng cú pháp gì?', options: [{ text: '[x for x in iterable]', isCorrect: true }, { text: '{x for x}', isCorrect: false }, { text: '(x for x)', isCorrect: false }], tags: ['python', 'syntax'], difficulty: 'easy' },
  { content: 'REST API dùng phương thức HTTP nào cho cập nhật?', options: [{ text: 'PUT hoặc PATCH', isCorrect: true }, { text: 'POST', isCorrect: false }, { text: 'GET', isCorrect: false }], tags: ['api', 'rest'], difficulty: 'medium' },
  { content: 'SQL JOIN INNER trả về gì?', options: [{ text: 'Chỉ dòng khớp 2 bảng', isCorrect: true }, { text: 'Tất cả bảng trái', isCorrect: false }, { text: 'Tất cả bảng phải', isCorrect: false }], tags: ['sql', 'database'], difficulty: 'medium' },
  { content: 'Git merge và rebase khác nhau thế nào?', options: [{ text: 'Merge tạo commit mới, rebase sắp xếp lại', isCorrect: true }, { text: 'Giống nhau', isCorrect: false }, { text: 'Rebase xóa history', isCorrect: false }], tags: ['git', 'vcs'], difficulty: 'hard' },
  { content: 'MongoDB dùng kiểu dữ liệu gì cho ID?', options: [{ text: 'ObjectId', isCorrect: true }, { text: 'UUID', isCorrect: false }, { text: 'Integer', isCorrect: false }], tags: ['mongodb', 'database'], difficulty: 'easy' },
  { content: 'TypeScript cung cấp gì so với JavaScript?', options: [{ text: 'Static typing', isCorrect: true }, { text: 'Chỉ syntax mới', isCorrect: false }, { text: 'Chạy nhanh hơn', isCorrect: false }], tags: ['typescript', 'javascript'], difficulty: 'easy' },
  // Academic
  { content: 'Cách mạng Công nghiệp bắt đầu ở đâu?', options: [{ text: 'Anh', isCorrect: true }, { text: 'Pháp', isCorrect: false }, { text: 'Đức', isCorrect: false }], tags: ['lịch sử', 'công nghiệp'], difficulty: 'easy' },
  { content: 'Tế bào nhân thực có gì mà nhân sơ không có?', options: [{ text: 'Màng nhân', isCorrect: true }, { text: 'DNA', isCorrect: false }, { text: 'Ribosome', isCorrect: false }], tags: ['sinh học', 'tế bào'], difficulty: 'medium' },
  { content: 'Thủ đô Nhật Bản là gì?', options: [{ text: 'Tokyo', isCorrect: true }, { text: 'Osaka', isCorrect: false }, { text: 'Kyoto', isCorrect: false }], tags: ['địa lý', 'châu á'], difficulty: 'easy' },
  { content: 'H2O là công thức hóa học của gì?', options: [{ text: 'Nước', isCorrect: true }, { text: 'Hydrogen peroxide', isCorrect: false }, { text: 'Ozone', isCorrect: false }], tags: ['hóa học'], difficulty: 'easy' },
  { content: 'Chiến tranh thế giới thứ nhất kết thúc năm nào?', options: [{ text: '1918', isCorrect: true }, { text: '1914', isCorrect: false }, { text: '1920', isCorrect: false }], tags: ['lịch sử'], difficulty: 'medium' },
  { content: 'Định lý Pythagore áp dụng cho tam giác gì?', options: [{ text: 'Tam giác vuông', isCorrect: true }, { text: 'Tam giác đều', isCorrect: false }, { text: 'Mọi tam giác', isCorrect: false }], tags: ['toán học', 'hình học'], difficulty: 'easy' },
  // Geography
  { content: 'Thủ đô Việt Nam là gì?', options: [{ text: 'Hà Nội', isCorrect: true }, { text: 'TP.HCM', isCorrect: false }, { text: 'Đà Nẵng', isCorrect: false }], tags: ['địa lý', 'việt nam'], difficulty: 'easy' },
  { content: 'Sông dài nhất thế giới là sông gì?', options: [{ text: 'Sông Nile', isCorrect: true }, { text: 'Sông Amazon', isCorrect: false }, { text: 'Sông Trường Giang', isCorrect: false }], tags: ['địa lý', 'sông'], difficulty: 'medium' },
  { content: 'Châu lục lớn nhất về diện tích?', options: [{ text: 'Châu Á', isCorrect: true }, { text: 'Châu Phi', isCorrect: false }, { text: 'Châu Mỹ', isCorrect: false }], tags: ['địa lý'], difficulty: 'easy' },
  { content: 'Thủ đô Trung Quốc?', options: [{ text: 'Bắc Kinh', isCorrect: true }, { text: 'Thượng Hải', isCorrect: false }, { text: 'Hồng Kông', isCorrect: false }], tags: ['địa lý', 'châu á'], difficulty: 'easy' },
  // Business
  { content: 'Supply chain management quản lý gì?', options: [{ text: 'Luồng hàng hóa và thông tin', isCorrect: true }, { text: 'Chỉ kho bãi', isCorrect: false }, { text: 'Chỉ vận chuyển', isCorrect: false }], tags: ['logistics', 'kinh doanh'], difficulty: 'medium' },
  { content: 'SWOT phân tích những yếu tố nào?', options: [{ text: 'Strengths, Weaknesses, Opportunities, Threats', isCorrect: true }, { text: 'Sales, Workforce, Output, Time', isCorrect: false }, { text: 'Strategy, Work, Organization, Team', isCorrect: false }], tags: ['chiến lược', 'kinh doanh'], difficulty: 'medium' },
  { content: 'ROI là viết tắt của gì?', options: [{ text: 'Return on Investment', isCorrect: true }, { text: 'Rate of Interest', isCorrect: false }, { text: 'Risk of Inflation', isCorrect: false }], tags: ['tài chính', 'kinh doanh'], difficulty: 'easy' },
  { content: 'Lean manufacturing tập trung vào gì?', options: [{ text: 'Giảm lãng phí', isCorrect: true }, { text: 'Tăng số lượng máy', isCorrect: false }, { text: 'Mở rộng nhà xưởng', isCorrect: false }], tags: ['sản xuất', 'kinh doanh'], difficulty: 'medium' },
];

// Question sets tương ứng ContentManagement UI
const SAMPLE_QUESTION_SETS = [
  { title: 'Advanced React Patterns', description: 'Hooks, Suspense, and Concurrent rendering.', type: 'Technical', questionIndexes: [0, 1, 6, 7], verified: true },
  { title: 'World History 101', description: 'From the Industrial Revolution to Modern Day.', type: 'Academic', questionIndexes: [8, 12], verified: true },
  { title: 'Python for Beginners', description: 'Data types, loops, and functions basics.', type: 'Technical', questionIndexes: [2, 3, 5], verified: true },
  { title: 'Biology Basics', description: 'Cell structures and fundamental processes.', type: 'Academic', questionIndexes: [9, 10], verified: false },
  { title: 'Capital Cities of Asia', description: 'Geography quiz covering 48 countries.', type: 'Geography', questionIndexes: [10, 14, 16], verified: true },
  { title: 'Logistics Management', description: 'Supply chain principles and flows.', type: 'Business', questionIndexes: [18, 21], verified: false },
  { title: 'Lịch sử Việt Nam', description: 'Từ thời kỳ phong kiến đến hiện đại.', type: 'Academic', questionIndexes: [8, 12, 13], verified: true },
  { title: 'Địa lý thế giới', description: 'Các quốc gia, thủ đô và sông núi.', type: 'Geography', questionIndexes: [13, 14, 15, 16], verified: true },
  { title: 'Web API & Backend', description: 'REST, database và authentication.', type: 'Technical', questionIndexes: [3, 4, 6, 7], verified: true },
  { title: 'Business Strategy', description: 'Phân tích SWOT, ROI và lean manufacturing.', type: 'Business', questionIndexes: [19, 20, 21], verified: false },
];

function buildReportDocs(demoUserId) {
  const demoIdStr = demoUserId.toString();
  const now = new Date();
  const baseTime = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  return [
    {
      reporterName: 'Nguyễn Văn A',
      reporterEmail: 'nguyenvana@example.com',
      reportedEntityType: 'USER',
      reportedEntityId: demoIdStr,
      reportedEntityTitle: 'demo',
      reason: 'Spam / quảng cáo',
      description: 'Tài khoản demo gửi tin nhắn rác trong các quiz.',
      status: 'PENDING',
      priority: 'HIGH',
      createdAt: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
      updatedAt: new Date(baseTime.getTime() + 2 * 60 * 60 * 1000),
    },
    {
      reporterName: 'Trần Thị B',
      reporterEmail: 'tranthib@example.com',
      reportedEntityType: 'USER',
      reportedEntityId: demoIdStr,
      reportedEntityTitle: 'demo',
      reason: 'Hành vi không phù hợp',
      description: 'Bình luận không phù hợp trong phần thảo luận.',
      status: 'PENDING',
      priority: 'MEDIUM',
      createdAt: new Date(baseTime.getTime() + 5 * 60 * 60 * 1000),
      updatedAt: new Date(baseTime.getTime() + 5 * 60 * 60 * 1000),
    },
    {
      reporterName: 'Lê Văn C',
      reporterEmail: 'levanc@example.com',
      reportedEntityType: 'USER',
      reportedEntityId: demoIdStr,
      reportedEntityTitle: 'demo',
      reason: 'Nội dung vi phạm bản quyền',
      description: 'User demo tạo quiz copy từ nguồn khác.',
      status: 'RESOLVED',
      priority: 'LOW',
      createdAt: new Date(baseTime.getTime()),
      resolvedAt: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000),
      resolvedBy: 'Admin',
      updatedAt: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000),
    },
  ];
}

const seed = async () => {
  await connectDB();
  const usersColl = mongoose.connection.db.collection(COLLECTION_USERS);
  const reportsColl = mongoose.connection.db.collection(COLLECTION_REPORTS);

  let demoUser = await usersColl.findOne({ email: 'demo@example.com' });

  for (const u of USERS) {
    const existing = await usersColl.findOne({ email: u.email });
    if (existing) {
      console.log(`⏭️  Đã tồn tại: ${u.email} (${u.role})`);
      if (u.email === 'demo@example.com') demoUser = existing;
      continue;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(u.password, salt);
    const now = new Date();
    const result = await usersColl.insertOne({
      username: u.username,
      email: u.email.toLowerCase(),
      password: hashedPassword,
      role: u.role,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✅ Đã tạo trong "${COLLECTION_USERS}": ${u.email} (${u.role}, password: ${u.password})`);
    if (u.email === 'demo@example.com') demoUser = { _id: result.insertedId };
  }

  if (demoUser) {
    const existingReports = await reportsColl.countDocuments({ reportedEntityId: demoUser._id.toString() });
    if (existingReports === 0) {
      const reportDocs = buildReportDocs(demoUser._id);
      await reportsColl.insertMany(reportDocs);
      console.log(`✅ Đã tạo ${reportDocs.length} report demo trong "${COLLECTION_REPORTS}" (dùng id user demo)`);
    } else {
      console.log(`⏭️  Report demo đã tồn tại cho user demo`);
    }
  }

  // Questions & Question Sets
  const questionsColl = mongoose.connection.db.collection(COLLECTION_QUESTIONS);
  const setsColl = mongoose.connection.db.collection(COLLECTION_QUESTION_SETS);

  const existingQuestions = await questionsColl.countDocuments();
  if (existingQuestions === 0) {
    const now = new Date();
    const questionDocs = SAMPLE_QUESTIONS.map((q, idx) => ({
      content: q.content,
      options: q.options,
      correctAnswer: q.options?.find((o) => o.isCorrect)?.text,
      tags: q.tags || [],
      difficulty: q.difficulty || 'medium',
      explanation: null,
      usedBy: demoUser && idx < 8 ? [demoUser._id] : [], // 8 câu đầu gắn user demo đã dùng
      createdAt: now,
      updatedAt: now,
    }));
    const qResult = await questionsColl.insertMany(questionDocs);
    const questionIds = Object.values(qResult.insertedIds);

    const setDocs = SAMPLE_QUESTION_SETS.map((s) => {
      const ids = (s.questionIndexes || []).map((i) => questionIds[i]).filter(Boolean);
      return {
        title: s.title,
        description: s.description || '',
        type: s.type || 'Other',
        questionIds: ids,
        verified: s.verified ?? false,
        createdBy: demoUser?._id ?? null,
        createdAt: now,
        updatedAt: now,
      };
    });
    await setsColl.insertMany(setDocs);
    console.log(`✅ Đã tạo ${questionDocs.length} câu hỏi và ${setDocs.length} question set trong "${COLLECTION_QUESTIONS}" / "${COLLECTION_QUESTION_SETS}"`);
  } else {
    console.log(`⏭️  Questions và Question Sets đã tồn tại`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
