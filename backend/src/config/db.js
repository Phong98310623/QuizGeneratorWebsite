const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  const dbName = process.env.MONGO_DB_NAME || 'quizgenerator';
  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is required in .env.local');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        dbName,
        serverSelectionTimeoutMS: 10000,
      });
      console.log('✅ MongoDB connected, db:', dbName);
      return;
    } catch (error) {
      console.error(`❌ MongoDB error (attempt ${attempt}/${MAX_RETRIES}):`, error.message);
      if (attempt < MAX_RETRIES) {
        console.log(`⏳ Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        if (error.code === 'ECONNREFUSED' && error.syscall === 'querySrv') {
          console.error('');
          console.error('💡 DNS resolution failed (querySrv ECONNREFUSED). Try:');
          console.error('   1. Kiểm tra DNS: mở PowerShell chạy "nslookup google.com"');
          console.error('   2. Đổi DNS: Cài đặt → Mạng → Adapter → Thuộc tính → IPv4 → DNS: 8.8.8.8 hoặc 1.1.1.1');
          console.error('   3. Tắt VPN hoặc thử mạng khác (VD: phát sóng từ điện thoại)');
          console.error('   4. Kiểm tra firewall/antivirus có chặn port 53');
        } else {
          console.error('💡 Check internet, VPN, firewall. Verify Atlas cluster is running.');
        }
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
