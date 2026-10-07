-- Migration: replace department with course everywhere
-- Model after this migration:
--   students:   course only (department column dropped — course already existed)
--   books:      course (renamed from department, values remapped below)
--   teachers:   course (renamed from department, values remapped below)
--   librarians: no department/course (column dropped)
-- Works whether or not migration_department.sql ever ran.

DO $$ BEGIN
  -- books: rename department -> course (or add course if dept never existed)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'department') THEN
    ALTER TABLE books RENAME COLUMN department TO course;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'course') THEN
    ALTER TABLE books ADD COLUMN course VARCHAR(100);
  END IF;

  -- teachers: rename department -> course (or add course if dept never existed)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'department') THEN
    ALTER TABLE teachers RENAME COLUMN department TO course;
  ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'course') THEN
    ALTER TABLE teachers ADD COLUMN course VARCHAR(100);
  END IF;

  -- students + librarians: drop department (students already have course)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'department') THEN
    ALTER TABLE students DROP COLUMN department;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'librarians' AND column_name = 'department') THEN
    ALTER TABLE librarians DROP COLUMN department;
  END IF;
END $$;

-- indexes: rename / rebuild to match
ALTER INDEX IF EXISTS idx_books_department RENAME TO idx_books_course;
DROP INDEX IF EXISTS idx_students_department;
CREATE INDEX IF NOT EXISTS idx_books_course ON books(course);
CREATE INDEX IF NOT EXISTS idx_teachers_course ON teachers(course);

-- remap old department names to representative courses (admin can refine via Edit)
UPDATE books SET course = 'B.Tech CSE'  WHERE course = 'Computer Science';
UPDATE books SET course = 'B.Sc Maths'  WHERE course = 'Mathematics';
UPDATE books SET course = 'B.Tech EE'   WHERE course = 'Physics';
UPDATE books SET course = 'BBA'         WHERE course = 'Management';
UPDATE books SET course = 'B.Com'       WHERE course = 'Commerce';

UPDATE teachers SET course = 'B.Tech CSE'  WHERE course = 'Computer Science';
UPDATE teachers SET course = 'B.Sc Maths'  WHERE course = 'Mathematics';
UPDATE teachers SET course = 'B.Tech EE'   WHERE course = 'Physics';
UPDATE teachers SET course = 'BBA'         WHERE course = 'Management';
UPDATE teachers SET course = 'B.Com'       WHERE course = 'Commerce';
