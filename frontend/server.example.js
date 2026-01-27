
/**
 * ĐÂY LÀ VÍ DỤ FILE SERVER.JS (NODE.JS + EXPRESS)
 * Dùng để tham khảo khi bạn triển khai backend thực tế.
 */

/*
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg'); // Nếu dùng PostgreSQL
// const mongoose = require('mongoose'); // Nếu dùng MongoDB

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'your_super_secret_key';

// --- DATABASE LOGIC START ---
// Kết nối DB ở đây
// const pool = new Pool({ ... });
// --- DATABASE LOGIC END ---

// Route Đăng ký
app.post('/api/register', async (req, res) => {
    const { fullName, email, password } = req.body;
    
    // --- DATABASE LOGIC START ---
    // 1. Kiểm tra email tồn tại: SELECT * FROM users WHERE email = $1
    // 2. Hash mật khẩu: const hashedPassword = await bcrypt.hash(password, 10);
    // 3. Lưu user mới: INSERT INTO users (full_name, email, password) VALUES (...)
    // --- DATABASE LOGIC END ---

    res.status(201).json({ success: true, message: 'User registered' });
});

// Route Đăng nhập
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // --- DATABASE LOGIC START ---
    // 1. Tìm user: SELECT * FROM users WHERE email = $1
    // 2. So sánh pass: const isValid = await bcrypt.compare(password, user.password);
    // --- DATABASE LOGIC END ---

    if (isValid) {
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ 
            success: true, 
            data: { 
                user: { id: user.id, fullName: user.full_name, email: user.email }, 
                token 
            } 
        });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));
*/
