-- Migration: add department to students and books
ALTER TABLE students ADD COLUMN IF NOT EXISTS department VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);

ALTER TABLE books ADD COLUMN IF NOT EXISTS department VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_books_department ON books(department);