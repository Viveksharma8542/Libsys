-- ============================================================
-- LIBRARY MANAGEMENT SYSTEM - PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE (base for all roles)
-- ============================================================
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'librarian', 'student')),
    is_active     BOOLEAN DEFAULT TRUE,
    must_change_password BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE students (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course        VARCHAR(100),
    semester      VARCHAR(20),
    year          INT,
    mobile        VARCHAR(20),
    address       TEXT,
    is_blocked    BOOLEAN DEFAULT FALSE,
    block_reason  TEXT,
    enrollment_no VARCHAR(50) UNIQUE,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_students_user_id ON students(user_id);

-- ============================================================
-- LIBRARIANS TABLE
-- ============================================================
CREATE TABLE librarians (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE,
    department  VARCHAR(100),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BOOKS TABLE
-- ============================================================
CREATE TABLE books (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title            VARCHAR(255) NOT NULL,
    author           VARCHAR(255) NOT NULL,
    isbn             VARCHAR(20) UNIQUE,
    category         VARCHAR(100),
    publisher        VARCHAR(150),
    publication_year INT,
    total_copies     INT NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INT NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    shelf_location   VARCHAR(50),
    description      TEXT,
    cover_url        VARCHAR(500),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_books_title    ON books(title);
CREATE INDEX idx_books_author   ON books(author);
CREATE INDEX idx_books_isbn     ON books(isbn);
CREATE INDEX idx_books_category ON books(category);

-- ============================================================
-- ISSUED BOOKS TABLE
-- ============================================================
CREATE TABLE issued_books (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    book_id         UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    issued_by       UUID NOT NULL REFERENCES users(id),   -- librarian
    issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE NOT NULL,
    return_date     DATE,
    is_returned     BOOLEAN DEFAULT FALSE,
    reissue_count   INT DEFAULT 0,
    last_reissue_at DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issued_student   ON issued_books(student_id);
CREATE INDEX idx_issued_book      ON issued_books(book_id);
CREATE INDEX idx_issued_returned  ON issued_books(is_returned);

-- ============================================================
-- FINES TABLE
-- ============================================================
CREATE TABLE fines (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    issued_book_id UUID NOT NULL REFERENCES issued_books(id) ON DELETE CASCADE,
    amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
    days_late     INT DEFAULT 0,
    status        VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived')),
    paid_at       TIMESTAMPTZ,
    paid_by       UUID REFERENCES users(id),   -- librarian who marked paid
    modified_by   UUID REFERENCES users(id),   -- admin who modified
    modified_at   TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fines_student ON fines(student_id);
CREATE INDEX idx_fines_status  ON fines(status);

-- ============================================================
-- BOOK REQUESTS (demand list)
-- ============================================================
CREATE TABLE book_requests (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    book_name    VARCHAR(255) NOT NULL,
    author       VARCHAR(255),
    isbn         VARCHAR(20),
    reason       TEXT,
    status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
    admin_notes  TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_book_requests_student ON book_requests(student_id);
CREATE INDEX idx_book_requests_status  ON book_requests(status);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id),
    user_role   VARCHAR(20),
    action      VARCHAR(100) NOT NULL,
    entity      VARCHAR(50),
    entity_id   UUID,
    details     JSONB,
    ip_address  VARCHAR(45),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user   ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_time   ON audit_logs(created_at);

-- ============================================================
-- REFRESH TOKENS TABLE
-- ============================================================
CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_token ON refresh_tokens(token);

-- ============================================================
-- SYSTEM CONFIG TABLE
-- ============================================================
CREATE TABLE system_config (
    key         VARCHAR(100) PRIMARY KEY,
    value       VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Default config
INSERT INTO system_config (key, value, description) VALUES
    ('issue_duration_days', '7',  'Default number of days for book issue'),
    ('fine_per_day',        '5',  'Fine amount per day in INR'),
    ('max_books_per_student', '3', 'Max books a student can issue at once'),
    ('cooldown_days',       '1',  'Days before same book can be reissued');

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students       FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_books_updated_at    BEFORE UPDATE ON books          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_issued_updated_at   BEFORE UPDATE ON issued_books   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_fines_updated_at    BEFORE UPDATE ON fines          FOR EACH ROW EXECUTE FUNCTION update_updated_at();
