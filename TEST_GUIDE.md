# 🎯 Hướng dẫn Test - Trang Khám Phá Bộ Đề

## 🚀 Hệ Thống Đang Chạy

```
Backend:   http://localhost:3000  (Node.js + Express + MongoDB)
Frontend:  http://localhost:5173  (Vite + React)
```

## 📝 Bước 1: Truy cập ứng dụng

1. Mở trình duyệt và truy cập: **http://localhost:5173**
2. Đăng nhập hoặc đăng ký tài khoản người dùng
3. Bạn sẽ thấy Dashboard

## 🎮 Bước 2: Truy cập trang Khám Phá Bộ Đề

Cách 1: Click vào "Khám Phá Bộ Đề" trong navigation bar  
Cách 2: Trực tiếp vào: **http://localhost:5173/#/explore-sets**

## 🧪 Bộ Dữ Liệu Test

5 bộ đề đã được tạo và xác nhận bởi admin:

| Tên Bộ Đề | PIN | Thể Loại | Số Câu |
|-----------|-----|----------|--------|
| Geography Basics | 4WAVP9 | Geography | 1 |
| Math Fundamentals | QUM2SY | Academic | 1 |
| Space & Astronomy | GZYP3U | Academic | 1 |
| Literature Quiz | UGWMEV | Academic | 1 |
| General Knowledge Mix | EKW6UA | Other | 2 |

## ✨ Tính năng có thể test

### 1. **Tìm kiếm (Search)**
- Nhập từ khóa vào ô "Tìm kiếm bộ đề"
- Ví dụ: "Geography", "Math", "Knowledge"
- Page sẽ tự động tìm kiếm theo tiêu đề và mô tả

### 2. **Lọc theo thể loại (Filter)**
- Click vào dropdown "Thể loại"
- Chọn một thể loại cụ thể
- Page sẽ lọc ra những bộ đề thuộc thể loại đó

### 3. **Chơi bộ đề (Play)**
- Click nút "Chơi" trên bất kỳ bộ đề nào
- Bạn sẽ được chuyển tới trang chơi quiz
- Trả lời tất cả câu hỏi và xem kết quả

### 4. **Copy mã PIN**
- Click "Copy" trên bộ đề bất kỳ
- Mã PIN sẽ được sao chép vào clipboard
- Nút sẽ hiển thị "Đã copy!" trong 2 giây

### 5. **Pagination (Xem Thêm)**
- Scrolldown tới cuối trang
- Click "Xem Thêm" để tải thêm bộ đề

### 6. **Responsive Design**
- Thử trên điện thoại (F12 → Toggle device toolbar)
- Bộ đề responsive trên các kích thước khác nhau

## 🔐 Admin Verification (Admin Test)

Để kiểm tra tính năng xác nhận từ admin:

1. Truy cập: **http://localhost:5173/#/admin/login**
2. Đăng nhập với tài khoản admin
3. Vào "Quản lý Nội Dung" (Content Management)
4. Chuyển sang tab "Sets" (Bộ Đề)
5. Bật / Tắt nút verify trên một bộ đề
6. Quay lại trang "Khám Phá Bộ Đề" - bộ đề sẽ biến mất nếu bị unverify

## 📋 API Testing

### Kiểm tra API bằng curl:

```bash
# Lấy danh sách tất cả bộ đề verified
curl http://localhost:3000/api/public/sets

# Lấy theo thể loại
curl "http://localhost:3000/api/public/sets?type=Academic"

# Tìm kiếm
curl "http://localhost:3000/api/public/sets?q=Math"

# Pagination
curl "http://localhost:3000/api/public/sets?offset=0&limit=3"

# Lấy chi tiết một bộ đề
curl "http://localhost:3000/api/public/sets/by-pin/4WAVP9"

# Lấy danh sách câu hỏi
curl "http://localhost:3000/api/public/sets/by-pin/4WAVP9/questions"
```

## 🎨 Features Được Implement

✅ **Frontend ExploreSetsPage**
- Search & filter
- Pagination với "Load More"
- Beautiful card UI
- Copy PIN functionality
- Responsive design
- Loading & error states
- Play button redirects

✅ **Backend APIs**
- GET `/api/public/sets` - List verified sets
- GET `/api/public/sets/by-pin/:pin` - Get set metadata
- GET `/api/public/sets/:id/questions` - Get questions
- PATCH `/api/content/sets/:id/verify` - Admin verify/unverify

✅ **Database**
- Only `verified: true` sets are shown
- Full search/filter support
- Proper indexing for performance

## 🐛 Troubleshooting

**Trang trắng / không tải?**
- Kiểm tra console (F12)
- Đảm bảo backend chạy trên port 3000
- Đảm bảo frontend chạy trên port 5173

**Không thấy bộ đề nào?**
- Kiểm tra xem bộ đề có verified: true không
- Chạy lại script: `node src/scripts/create-test-sets.js`

**API không respond?**
- Kiểm tra backend còn chạy không: `curl http://localhost:3000`
- MongoDB có connected không

## 📚 Files Được Tạo/Sửa

### Created:
- `frontend/pages/ExploreSetsPage.tsx` - Trang chính
- `backend/src/scripts/create-test-sets.js` - Script tạo test data

### Modified:
- `frontend/App.tsx` - Thêm route & import
- `frontend/components/UserLayout.tsx` - Thêm navigation link

### Already Existed (Backend):
- API endpoints trong `public.controller.js`
- Admin verify endpoints trong `content.controller.js`
- Routes trong `public.route.js` & `content.route.js`

---

**Enjoy testing! 🎉**
