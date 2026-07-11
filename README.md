# 📚 College Library Management System (LMS)

A full-stack Library Management System built with React.js, Node.js/Express, and PostgreSQL.

---

## 🏗️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router 6, Recharts  |
| Backend   | Node.js, Express.js                 |
| Database  | PostgreSQL                          |
| Auth      | JWT (Access + Refresh with rotation)|
| Security  | bcrypt, helmet, rate-limiting       |
| Testing   | Jest, Supertest                     |
| Docs      | Swagger / OpenAPI                   |

---

## 👥 Roles & Credentials (Demo)

| Role      | Email                    | Password   |
|-----------|--------------------------|------------|
| Admin     | admin@library.edu        | Admin@123  |
| Librarian | librarian@library.edu    | Admin@123  |
| Student   | amit@student.edu         | Admin@123  |
| Teacher   | teacher@library.edu     | Admin@123  |

---

## 🚀 Setup Instructions

### 1. PostgreSQL Setup

```bash
createdb lms_db
psql -U postgres -d lms_db -f backend/schema.sql
psql -U postgres -d lms_db -f backend/seed.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # Edit with your DB credentials
npm install
npm run dev            # Development (nodemon on port 5003)
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start              # Runs on http://localhost:3000
```

Backend runs on **http://localhost:5003**  
Frontend proxies `/api/*` to backend automatically.

### Docker (optional — runs everything at once)

```bash
docker-compose up
```

---

## 📖 API Documentation

Interactive Swagger docs available when backend is running:

**http://localhost:5003/api-docs**

---

## 🧪 Testing

```bash
cd backend
npm test               # Jest + Supertest
```

---

## 📁 Project Structure

```
lms/
├── docker-compose.yml
├── .eslintrc.json
├── .prettierrc
├── backend/
│   ├── Dockerfile
│   ├── schema.sql
│   ├── seed.sql
│   ├── jest.config.js
│   ├── __tests__/
│   │   └── health.test.js
│   ├── package.json
│   └── src/
│       ├── app.js              ← Express entry (Swagger, rate-limit, HTTPS redirect)
│       ├── config/db.js        ← PostgreSQL pool
│       ├── middleware/
│       │   ├── auth.js         ← JWT + RBAC
│       │   ├── audit.js        ← Audit logging
│       │   └── validate.js     ← Input validation + pagination helpers
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── adminController.js
│       │   ├── librarianController.js
│       │   ├── studentController.js
│       │   └── teacherController.js
│       └── routes/
│           ├── auth.js         ← Login, refresh, logout, me, change-password
│           ├── admin.js        ← Dashboard, users, fines, config, audit, requests
│           ├── librarian.js    ← Books CRUD, issue/return, students, teachers, fines
│           ├── student.js      ← Dashboard, profile, books, issued, history, fines, requests
│           └── teacher.js      ← Dashboard, profile, books, issued, history
└── frontend/
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.js              ← Routes + role-based guards
        ├── index.css           ← Design system
        ├── context/AuthContext.js
        ├── utils/api.js        ← Axios + interceptors + auto token refresh
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   └── UI.jsx          ← Spinner, Alert, Badge, Pagination, Modal, etc.
        └── pages/
            ├── Login.jsx
            ├── ChangePassword.jsx
            ├── admin/          ← Dashboard, Users, Fines, Config, Audit, BookRequests
            ├── librarian/      ← Dashboard, Books, IssueBook, IssuedBooks, Students, Teachers, Fines, Profile
            ├── student/        ← Dashboard, Profile, Books, Issued, History, Fines, Request
            └── teacher/        ← Dashboard, Profile, Books, Issued, History
```

---

## 💡 Key Features

- ✅ JWT with refresh token rotation (automatic silent refresh)
- ✅ Role-based access (Admin / Librarian / Student / Teacher)
- ✅ Auto fine calculation on book return
- ✅ Live overdue tracking with estimated fines
- ✅ Admin fine modification
- ✅ Student blocking with reason
- ✅ Teacher support (no fines, indefinite borrowing)
- ✅ Book cooldown period & max books per student
- ✅ Book purchase requests by students
- ✅ Audit logs for all actions
- ✅ Pagination + search on all list endpoints
- ✅ Force password change on first login
- ✅ Rate limiting + helmet security headers
- ✅ Bulk CSV user upload
- ✅ Swagger API docs at `/api-docs`
- ✅ Docker Compose one-command setup
- ✅ ESLint + Prettier code quality
- ✅ Jest + Supertest test suite

---

## ⚙️ Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lms_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=min_32_chars_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=min_32_chars_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

PORT=5003
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BCRYPT_ROUNDS=10
```
