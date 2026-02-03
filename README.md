# AI Quiz Generator

Website tạo câu hỏi trắc nghiệm tích hợp AI và tự động hoá.

## 📋 Mục lục

- [Tech Stack](#tech-stack)
- [Tính năng](#tính-năng)
- [Cài đặt và chạy](#cài-đặt-và-chạy)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [API Documentation](#api-documentation)

## 🛠 Tech Stack

### Frontend

#### Core Framework & Library
- **React** `^19.2.3` - Thư viện JavaScript để xây dựng giao diện người dùng, component-based architecture
- **React DOM** `^19.2.3` - Render React components vào DOM, bridge giữa React và browser APIs
- **React Router DOM** `^7.13.0` - Điều hướng và quản lý routing trong ứng dụng React (SPA)
- **React Context API** - State management cho authentication và global state (AuthContext)

#### Build Tools & Development
- **Vite** `^6.2.0` - Build tool và dev server nhanh, hiện đại với HMR (Hot Module Replacement)
- **TypeScript** `~5.8.2` - Ngôn ngữ lập trình với type safety, compile-time error checking
- **@vitejs/plugin-react** `^5.0.0` - Plugin Vite cho React, hỗ trợ JSX và Fast Refresh
- **@types/node** `^22.14.0` - Type definitions cho Node.js APIs
- **ESM (ES Modules)** - Module system hiện đại cho JavaScript

#### Styling & UI
- **Tailwind CSS** (via CDN) - Utility-first CSS framework cho styling nhanh và responsive design
- **Google Fonts (Inter)** - Font chữ hiện đại, professional typography
- **CSS3** - Custom styles, animations và transitions

### Backend

#### Core Framework
- **Django** `>=4.2` - Web framework Python mạnh mẽ, MVC pattern
- **Django REST Framework** - Toolkit để xây dựng RESTful APIs, serializers, viewsets

#### Authentication & Security
- **Django REST Framework Simple JWT** - JWT authentication cho DRF, token-based auth
- **django-cors-headers** - Xử lý CORS cho frontend, cross-origin requests
- **werkzeug** - Security utilities (password hashing với bcrypt)
- **pycryptodome** - Cryptographic library cho encryption/decryption

#### Database
- **MongoDB** - NoSQL database, document-based storage
- **MongoEngine** `mongoengine` - ODM (Object Document Mapper) cho MongoDB, Django-like ORM
- **pymongo[srv]** - MongoDB driver cho Python, hỗ trợ MongoDB Atlas connection strings

#### AI Integration
- **OpenAI** - API để tích hợp AI (GPT models) cho việc tạo quiz tự động

#### Utilities
- **python-dotenv** - Quản lý environment variables từ file .env

### Planned Features
- **n8n** - Workflow automation platform cho tự động hoá các tác vụ

## ✨ Tính năng

- ✅ **Tạo quiz thủ công** - Tạo câu hỏi trắc nghiệm bằng tay
- ✅ **Tạo quiz bằng AI** - Sử dụng AI để tự động tạo câu hỏi
- ✅ **Làm bài và chấm điểm tự động** - Hệ thống tự động chấm điểm
- ✅ **Xác thực người dùng** - Đăng ký, đăng nhập với JWT
- ✅ **Quản lý người dùng** - Phân quyền USER/ADMIN
- ✅ **Báo cáo và thống kê** - Xem kết quả và phân tích

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống

- **Python** >= 3.8
- **Node.js** >= 18.x
- **npm** hoặc **yarn**
- **MongoDB** (local hoặc MongoDB Atlas)

### Backend Setup

1. **Di chuyển vào thư mục backend:**
```bash
cd backend
```

2. **Tạo virtual environment (khuyến nghị):**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Cài đặt dependencies:**
```bash
pip install -r requirements.txt
```

4. **Cấu hình MongoDB:**
   - Tạo file `.env` trong thư mục `backend/`
   - Thêm cấu hình MongoDB:
   ```
   MONGODB_HOST=localhost
   MONGODB_PORT=27017
   MONGODB_DB_NAME=quiz_generator
   MONGODB_USERNAME=your_username
   MONGODB_PASSWORD=your_password
   ```

5. **Chạy migrations (nếu có):**
```bash
python manage.py migrate
```

6. **Chạy server:**
```bash
python manage.py runserver
```

Backend sẽ chạy tại: `http://localhost:8000`

### Frontend Setup

1. **Di chuyển vào thư mục frontend:**
```bash
cd frontend
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Chạy development server:**
```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

4. **Build cho production:**
```bash
npm run build
```

5. **Preview production build:**
```bash
npm run preview
```

## 📁 Cấu trúc dự án

```
QuizGeneratorWebsite/
├── backend/                 # Django REST API
│   ├── apps/
│   │   ├── accounts/       # Quản lý người dùng, authentication
│   │   │   ├── views.py   # API views (register, login)
│   │   │   ├── mongo_models.py  # MongoDB models (User, AuthToken)
│   │   │   ├── serializers.py   # DRF serializers
│   │   │   └── authentication.py # JWT authentication
│   │   ├── ai_generator/   # Tích hợp AI để tạo quiz
│   │   ├── questions/      # Quản lý câu hỏi
│   │   ├── quizzes/       # Quản lý quiz
│   │   ├── submissions/   # Quản lý bài nộp
│   │   └── reports/       # Báo cáo và thống kê
│   ├── config/            # Cấu hình Django
│   │   ├── settings.py   # Django settings, CORS, JWT config
│   │   └── urls.py       # URL routing
│   └── requirements.txt   # Python dependencies
│
└── frontend/              # React + TypeScript + Vite
    ├── components/        # React components (Input.tsx)
    ├── context/          # React Context (AuthContext.tsx)
    ├── pages/           # Các trang chính (LoginPage, RegisterPage, Dashboard)
    ├── services/        # API services (api.ts)
    ├── types.ts         # TypeScript type definitions
    ├── App.tsx          # Main App component với routing
    ├── index.tsx        # Entry point
    ├── vite.config.ts   # Vite configuration
    ├── tsconfig.json    # TypeScript configuration
    └── package.json     # Node.js dependencies
```

## 🗄️ Database Schema

### MongoDB Database: `quizgenerator`

Database được host trên **MongoDB Atlas** với connection string được cấu hình trong `settings.py`.

### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ auth_tokens : "has"
    users ||--o{ questions : "creates"
    users ||--o{ question_attempts : "attempts"
    users ||--o{ question_sets : "creates"
    users ||--o{ reports : "reports"
    
    questions ||--o{ question_attempts : "has"
    questions ||--o{ question_set_items : "belongs_to"
    question_sets ||--o{ question_set_items : "contains"
    
    users {
        ObjectId _id PK
        string username UK
        string email UK
        string password
        string role "USER|ADMIN"
        string status "ACTIVE|BLOCKED"
        int total_score
        datetime created_at
    }
    
    auth_tokens {
        ObjectId _id PK
        ObjectId user_id FK
        string access_token
        string refresh_token
        string ip_address
        datetime expires_at
        boolean revoked
        datetime created_at
    }
    
    questions {
        ObjectId _id PK
        ObjectId creator_id FK
        string question
        string correct_answer
        string explanation
        array options "Embedded QuestionOption"
        datetime created_at
    }
    
    question_attempts {
        ObjectId _id PK
        ObjectId user_id FK
        ObjectId question_id FK
        string user_answer
        boolean is_correct
        int score
        datetime created_at
    }
    
    question_sets {
        ObjectId _id PK
        string title
        string description
        ObjectId creator_id FK
        boolean is_public
        int total_questions
        int total_score
        int time_limit
        array items "Embedded QuestionSetItem"
        datetime created_at
    }
    
    question_set_items {
        ObjectId _id PK
        ObjectId question_id FK
        ObjectId question_set_id FK
        int order_no
        int score
    }
    
    reports {
        ObjectId _id PK
        ObjectId reporter_id FK
        ObjectId target_user_id FK
        ObjectId question_id FK
        string reason
        string status "PENDING|RESOLVED|REJECTED"
        ObjectId resolved_by FK
        datetime created_at
        datetime resolved_at
    }
```

### Collections Overview

| Collection | Description | Key Fields |
|------------|-------------|------------|
| **users** | Người dùng hệ thống | `_id`, `username`, `email`, `role`, `status` |
| **auth_tokens** | JWT tokens cho authentication | `user_id`, `access_token`, `refresh_token` |
| **questions** | Câu hỏi trắc nghiệm | `_id`, `creator_id`, `question`, `options` |
| **question_attempts** | Lịch sử làm câu hỏi | `user_id`, `question_id`, `is_correct` |
| **question_sets** | Bộ câu hỏi/Quiz | `_id`, `creator_id`, `title`, `items[]` |
| **question_set_items** | Câu hỏi trong bộ câu hỏi | `question_id`, `question_set_id`, `order_no` |
| **reports** | Báo cáo vi phạm | `reporter_id`, `target_user_id`, `status` |

### Indexes

Các collections đã được index để tối ưu performance:
- **users**: `username`, `email`, `created_at`
- **auth_tokens**: `user_id`, `access_token`, `refresh_token`
- **questions**: `creator_id`, `created_at`
- **question_attempts**: `user_id`, `question_id`, `(user_id, question_id)`
- **question_sets**: `creator_id`, `is_public`, `created_at`

## 📡 API Documentation

### Authentication Endpoints

- `POST /api/accounts/register/` - Đăng ký tài khoản mới
- `POST /api/accounts/login/` - Đăng nhập và nhận JWT token

### Request/Response Examples

**Register:**
```json
POST /api/accounts/register/
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 201 Created
{
  "id": "...",
  "username": "user123",
  "email": "user@example.com",
  "role": "USER",
  "total_score": 0,
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Login:**
```json
POST /api/accounts/login/
Content-Type: application/json

{
  "username": "user123",
  "password": "securepassword"
}

Response: 200 OK
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "...",
    "username": "user123",
    "email": "user@example.com",
    "role": "USER",
    "total_score": 0,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Using JWT Token:**
```http
GET /api/protected-endpoint/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

## 🔐 Environment Variables

Tạo file `.env` trong thư mục `backend/`:

```env
# MongoDB Configuration
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB_NAME=quiz_generator
MONGODB_USERNAME=your_username
MONGODB_PASSWORD=your_password

# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Django Secret Key
SECRET_KEY=your_secret_key_here

# Debug Mode
DEBUG=True

# Allowed Hosts
ALLOWED_HOSTS=localhost,127.0.0.1
```

## 🧪 Development Notes

### Frontend Development
- Sử dụng **React 19** với hooks (useState, useEffect, useContext)
- **TypeScript** cho type safety và IntelliSense
- **Vite** cho fast HMR và build
- **Tailwind CSS** cho rapid UI development

### Backend Development
- **Django REST Framework** cho RESTful API design
- **MongoDB** với MongoEngine cho flexible schema
- **JWT** cho stateless authentication
- **CORS** enabled cho frontend integration

## 📝 License

MIT License

## 👥 Contributors

- Your Name Here

## 📞 Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
