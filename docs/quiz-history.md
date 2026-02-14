# Lưu và đọc lịch sử làm bài (Quiz History)

Tài liệu mô tả cách lịch sử làm bài được lưu vào database, đọc ra và các class/controller điều khiển luồng.

---

## 1. Tổng quan

- Mỗi lần người dùng **hoàn thành** một bộ câu hỏi (bấm "Xem kết quả"), frontend gửi toàn bộ câu trả lời lên backend.
- Backend tạo **một bản ghi lần làm bài** (PlayAttempt) và ghi vào **từng câu hỏi** (Question) thông tin: user, câu trả lời, thời điểm, và id lần làm bài (attemptId).
- Khi xem **Hoạt động gần đây** trên Profile, backend lấy danh sách PlayAttempt của user, rồi với mỗi attempt lấy các câu hỏi có `usedBy.attemptId` trùng để tính đúng/sai và trả về chi tiết.

---

## 2. Database

### 2.1 Collection `play_attempts`

Lưu **mỗi lần làm bài** (một session hoàn thành một bộ đề).

| Trường       | Kiểu        | Mô tả                          |
|-------------|-------------|---------------------------------|
| `userId`    | ObjectId    | Ref User – người làm            |
| `pin`       | String      | Mã PIN bộ câu hỏi               |
| `completedAt` | Date      | Thời điểm hoàn thành            |
| `createdAt`, `updatedAt` | Date | Tự động (timestamps)   |

- Index: `{ userId: 1, completedAt: -1 }` để truy vấn lịch sử theo user, mới nhất trước.

### 2.2 Collection `questions` – trường `usedBy`

Mỗi **câu hỏi** có mảng `usedBy` ghi lại từng lần có user trả lời (gắn với một lần làm bài).

**Cấu trúc mỗi phần tử trong `usedBy`:**

| Trường        | Kiểu     | Mô tả                                  |
|---------------|----------|----------------------------------------|
| `user`        | ObjectId | Ref User – người trả lời               |
| `answer`      | String   | Câu trả lời người dùng chọn (text)     |
| `attemptedAt` | Date     | Thời điểm trả lời (thường = completedAt của attempt) |
| `attemptId`   | ObjectId | Ref PlayAttempt – thuộc lần làm bài nào |

- Schema dùng `Mixed` để tương thích dữ liệu cũ (trước đây `usedBy` có thể chỉ là mảng ObjectId ref User).

### 2.3 Collection `question_sets`

Không lưu lịch sử, chỉ dùng để:

- Khi **ghi**: biết `questionIds` thuộc set (PIN) nào để chỉ cập nhật đúng các câu trong set.
- Khi **đọc**: lấy `title` (setTitle) và `questionIds` để biết attempt đó gồm những câu nào và hiển thị tên bộ đề.

---

## 3. Model (class) điều khiển dữ liệu

### 3.1 Backend – Mongoose models

| File | Model (collection) | Vai trò |
|------|--------------------|--------|
| `backend/src/models/play_attempt.model.js` | **PlayAttempt** (`play_attempts`) | Tạo và đọc từng lần làm bài (userId, pin, completedAt). |
| `backend/src/models/question.model.js` | **Question** (`questions`) | Cập nhật và đọc mảng `usedBy` (user, answer, attemptedAt, attemptId). |
| `backend/src/models/question_set.model.js` | **QuestionSet** (`question_sets`) | Đọc set theo PIN (title, questionIds) khi ghi và khi đọc lịch sử. |

### 3.2 Luồng ghi (lưu lịch sử)

1. **Route:** `POST /api/public/sets/by-pin/:pin/submit` (có auth).  
   **File:** `backend/src/routes/public.route.js` → `protect` + `publicController.submitAttempt`.

2. **Controller:** `submitAttempt` trong `backend/src/controllers/public.controller.js`:
   - Dùng **QuestionSet** tìm set theo `pin`, lấy `questionIds`.
   - Dùng **PlayAttempt** tạo một document mới: `userId`, `pin`, `completedAt`.
   - Với mỗi `{ questionId, selectedAnswer }` trong body (chỉ chấp nhận questionId thuộc set đó):
     - Dùng **Question.findByIdAndUpdate(questionId, { $push: { usedBy: { user, answer, attemptedAt, attemptId } } })`.
   - Trả về `attemptId`, `pin`, `completedAt`.

### 3.3 Luồng đọc (lấy lịch sử)

1. **Route:** `GET /api/users/me/history` (có auth).  
   **File:** `backend/src/routes/user.route.js` → `protect` + `userController.getMyHistory`.

2. **Controller:** `getMyHistory` trong `backend/src/controllers/user.controller.js`:
   - Dùng **PlayAttempt**:
     - `PlayAttempt.find({ userId: req.user._id }).sort({ completedAt: -1 }).limit(50).lean()`.
   - Với mỗi attempt:
     - Dùng **QuestionSet** tìm set theo `att.pin` → lấy `setTitle` và `questionIds`.
     - Dùng **Question**:
       - `Question.find({ _id: { $in: questionIds }, 'usedBy.attemptId': att._id }).lean()`.
     - Với mỗi câu hỏi: tìm trong `q.usedBy` phần tử có `attemptId === att._id` → lấy `answer`; so sánh với `q.correctAnswer` để suy ra `isCorrect`.
   - Trả về mảng: mỗi phần tử gồm `attemptId`, `pin`, `setTitle`, `completedAt`, `correctCount`, `totalCount`, `details` (từng câu: content, userAnswer, correctAnswer, isCorrect).

---

## 4. Tương quan DB và class (tóm tắt)

```
┌─────────────────────┐     ┌──────────────────────────────────────────┐
│ play_attempts        │     │ questions                                 │
│ (PlayAttempt)        │     │ (Question)                               │
├─────────────────────┤     ├──────────────────────────────────────────┤
│ _id (attemptId)      │◄────│ usedBy[]                                 │
│ userId               │     │   .user      (ObjectId → User)           │
│ pin                  │     │   .answer    (câu trả lời)               │
│ completedAt          │     │   .attemptedAt                           │
└──────────┬──────────┘     │   .attemptId  (ObjectId → PlayAttempt)    │
           │                 └──────────────────────────────────────────┘
           │
           │  pin
           ▼
┌─────────────────────┐
│ question_sets       │
│ (QuestionSet)       │
├─────────────────────┤
│ pin, title          │
│ questionIds[]       │  ──► _id của từng Question
└─────────────────────┘
```

- **Ghi:** PlayAttempt tạo mới → Question được cập nhật `$push` usedBy (user, answer, attemptedAt, attemptId). QuestionSet chỉ dùng để biết questionIds thuộc set.
- **Đọc:** PlayAttempt (theo userId) → với mỗi attempt, QuestionSet (theo pin) lấy title + questionIds → Question (theo _id + usedBy.attemptId) lấy câu trả lời và so sánh đúng/sai.

---

## 5. Frontend (tham chiếu)

- **Gửi lưu:** `frontend/services/api.ts` – `attemptsApi.submit(token, pin, answers)`.  
  `frontend/pages/PlayPage.tsx` khi user bấm "Xem kết quả" thu thập `answers` (questionId, selectedAnswer) và gọi `attemptsApi.submit`.
- **Đọc lịch sử:** `attemptsApi.getMyHistory(token)` trả về mảng `AttemptHistoryItem`.  
  `frontend/pages/ProfilePage.tsx` gọi khi vào trang Profile và hiển thị danh sách + chi tiết đúng/sai, nút "Làm lại".

Type/interface: `AttemptHistoryItem`, `AttemptHistoryDetail` trong `frontend/services/api.ts`.
