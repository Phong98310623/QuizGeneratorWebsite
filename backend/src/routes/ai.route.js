const express = require('express');
const router = express.Router();
const multer = require('multer');
const aiController = require('../controllers/ai.controller');
const { protect } = require('../middlewares/auth.middleware');

// Cấu hình multer cho file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB voor PDF support
  fileFilter: (req, file, cb) => {
    // Cho phép text files và PDF
    const allowedMimes = [
      'text/plain', 
      'text/txt', 
      'application/txt',
      'application/pdf',
      'text/markdown',
      'text/x-markdown',
      'image/png',
      'image/jpeg'
    ];
    const allowedExt = ['.txt', '.md', '.text', '.pdf', '.png', '.jpg', '.jpeg'];
    
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (allowedMimes.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file text (.txt, .md), PDF (.pdf) và ảnh (.png, .jpg, .jpeg). Vui lòng upload file đúng định dạng.'));
    }
  },
});

router.post('/generate', protect, aiController.generateQuestions);
router.post('/generate-from-file', protect, upload.single('file'), aiController.generateQuestionsFromFile);

module.exports = router;
