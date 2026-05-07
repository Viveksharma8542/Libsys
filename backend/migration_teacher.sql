-- ============================================================
-- MIGRATION: Add Teacher Role Support
-- Run this to enable teacher functionality in the LMS
-- ============================================================

-- 1. Update users.role CHECK constraint to include 'teacher'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'librarian', 'student', 'teacher'));

-- 2. Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id   VARCHAR(50) UNIQUE,
    department    VARCHAR(100),
    designation   VARCHAR(100),
    mobile        VARCHAR(20),
    address       TEXT,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);

-- 3. Add teacher_id column to issued_books
ALTER TABLE issued_books ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE;

-- 4. Add trigger for teachers updated_at
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Add teacher config if not exists
INSERT INTO system_config (key, value, description)
VALUES ('issue_duration_days_teacher', '14', 'Teacher loan period in days')
ON CONFLICT (key) DO NOTHING;
