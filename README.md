# 📚 College Library Management System (LMS)

A full-stack Library Management System built with React.js, Node.js/Express, and PostgreSQL.

---

## 🏗️ Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router 6, Recharts  |
| Backend   | Node.js, Express.js                 |
| Database  | PostgreSQL                          |
| Auth      | JWT (Access + Refresh tokens)       |
| Security  | bcrypt, helmet, rate-limiting       |

---

## 👥 Roles & Credentials (Demo)

| Role      | Email                    | Password   |
|-----------|--------------------------|------------|
| Admin     | admin@library.edu        | Admin@123  |
| Librarian | librarian@library.edu    | Admin@123  |
| Student   | amit@student.edu         | Admin@123  |
| Teacher   | teacher@library.edu     | Admin@123  |

---

## 📁 Project Structure

```
lms/
├── backend/
│   ├── schema.sql              ← Database schema
│   ├── seed.sql                ← Sample data
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js              ← Express entry
│       ├── config/db.js        ← PostgreSQL pool
│       ├── middleware/
│       │   ├── auth.js         ← JWT + RBAC
│       │   ├── audit.js        ← Audit logging
│       │   └── validate.js     ← Input validation
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── adminController.js
│       │   ├── librarianController.js
│       │   ├── studentController.js
│       │   └── teacherController.js
│       └── routes/
│           ├── auth.js
│           ├── admin.js
│           ├── librarian.js
│           ├── student.js
│           └── teacher.js
├── frontend/
│   ├── public/index.html
│   ├── package.json
│   └── src/
│       ├── App.js              ← Routes + guards
│       ├── index.css           ← Design system
│       ├── context/AuthContext.js
│       ├── utils/api.js        ← Axios + interceptors
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   └── UI.jsx          ← Shared components
│       └── pages/
│           ├── Login.jsx
│           ├── ChangePassword.jsx
│           ├── admin/
│           │   ├── Dashboard.jsx
│           │   ├── Users.jsx
│           │   └── AdminMisc.jsx
│           ├── librarian/
│           │   ├── Dashboard.jsx
│           │   ├── Books.jsx
│           │   └── LibrarianMisc.jsx
│           ├── student/
│           │   └── StudentPages.jsx
│           └── teacher/
│               └── TeacherPages.jsx
```

---

## 🚀 Setup Instructions

### 1. PostgreSQL Setup

```bash
createdb lms_db
psql -U postgres -d lms_db -f backend/schema.sql
psql -U postgres -d lms_db -f backend/seed.sql

# For Teacher support, run the migration (optional)
psql -U postgres -d lms_db -f migration_teacher.sql
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets

npm install
npm run dev        # Development (nodemon)
# or
npm start          # Production
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start          # Runs on http://localhost:3000
```

Backend runs on **http://localhost:5003**  
Frontend proxies `/api/*` to backend automatically.

---

## 🔗 API Endpoints

### Authentication
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
PUT    /api/auth/change-password
```

### Admin (`/api/admin/*`)
```
GET    /dashboard
GET    /users?role=&search=&page=&limit=
POST   /users                    ← Register librarian/student
PATCH  /users/:id/status         ← Activate/deactivate
PATCH  /fines/:id                ← Modify fine (admin only)
GET    /book-requests
GET    /config
PUT    /config
GET    /audit-logs
```

### Librarian (`/api/librarian/*`)
```
GET    /dashboard
GET    /books?search=&category=&page=
POST   /books
PUT    /books/:id
DELETE /books/:id
GET    /students?search=&page=
GET    /students/:id             ← Full profile
PATCH  /students/:id/block
POST   /issue                    ← Issue book to student
POST   /return/:issued_id        ← Return + auto fine
POST   /reissue/:issued_id       ← Extend due date
GET    /issued?page=
GET    /fines?status=&page=
POST   /fines/:id/paid           ← Mark fine paid (cash)
```

### Student (`/api/student/*`)
```
GET    /dashboard
GET    /profile
GET    /books?search=&category=&page=
GET    /issued
GET    /history?page=
GET    /fines
POST   /request-book
```

---

## 🗄️ Database Schema

```
users          → base table for all roles
students       → extends users (course, semester, enrollment)
librarians     → extends users (employee_id, department)
books          → title, author, isbn, copies tracking
issued_books   → issue/return records with dates
fines          → auto-calculated, paid by librarian
book_requests  → student demand list
audit_logs     → who did what, when
refresh_tokens → JWT refresh token store
system_config  → configurable rules (fine/day, issue duration)
```

---

## 💡 Key Features

- ✅ JWT with refresh token rotation
- ✅ Role-based access (Admin / Librarian / Student)
- ✅ Auto fine calculation on book return
- ✅ Admin-only fine modification
- ✅ Student blocking
- ✅ Book cooldown period (prevent immediate reissue)
- ✅ Max books per student limit
- ✅ Audit logs for all actions
- ✅ Pagination + search on all lists
- ✅ Force password change on first login
- ✅ Rate limiting + helmet security headers

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

PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
BCRYPT_ROUNDS=10
```
