-- Migration: normalize legacy free-typed departments to the standard list
-- Standard list (must match frontend src/utils/lists.js DEPARTMENTS):
--   Commerce, Computer Science, Management, Mathematics, Physics
-- Adjust/add mappings below if your data uses other variants, then run once.

-- 1. trim stray spaces everywhere first
UPDATE students SET department = TRIM(department) WHERE department IS NOT NULL;
UPDATE teachers SET department = TRIM(department) WHERE department IS NOT NULL;
UPDATE books    SET department = TRIM(department) WHERE department IS NOT NULL;

-- 2. map common variants to standard names (students)
UPDATE students SET department = 'Computer Science' WHERE department IN ('CS','CSE','C.S.E','Comp Sci','Computer Sciences','Comp. Science','Computer');
UPDATE students SET department = 'Mathematics'      WHERE department IN ('Maths','Math','Mathematics Dept','M.Sc');
UPDATE students SET department = 'Physics'          WHERE department IN ('Phy','Physics Dept');
UPDATE students SET department = 'Management'       WHERE department IN ('Mgmt','MBA','BBA','Management Dept');
UPDATE students SET department = 'Commerce'         WHERE department IN ('Comm','Commerce Dept','B.Com','M.Com');

-- 3. same mappings for teachers
UPDATE teachers SET department = 'Computer Science' WHERE department IN ('CS','CSE','C.S.E','Comp Sci','Computer Sciences','Comp. Science','Computer');
UPDATE teachers SET department = 'Mathematics'      WHERE department IN ('Maths','Math','Mathematics Dept');
UPDATE teachers SET department = 'Physics'          WHERE department IN ('Phy','Physics Dept');
UPDATE teachers SET department = 'Management'       WHERE department IN ('Mgmt','MBA','BBA','Management Dept');
UPDATE teachers SET department = 'Commerce'         WHERE department IN ('Comm','Commerce Dept');

-- 4. same mappings for books
UPDATE books SET department = 'Computer Science' WHERE department IN ('CS','CSE','C.S.E','Comp Sci','Computer Sciences','Comp. Science','Computer');
UPDATE books SET department = 'Mathematics'      WHERE department IN ('Maths','Math','Mathematics Dept');
UPDATE books SET department = 'Physics'          WHERE department IN ('Phy','Physics Dept');
UPDATE books SET department = 'Management'       WHERE department IN ('Mgmt','MBA','BBA','Management Dept');
UPDATE books SET department = 'Commerce'         WHERE department IN ('Comm','Commerce Dept');

-- 5. course names: same idea — standard list must match frontend
--    src/utils/lists.js COURSE_GROUPS (B.Sc Physics / M.Sc Physics, not Phy)
UPDATE students SET course = 'B.Sc Physics' WHERE course = 'B.Sc Phy';
UPDATE students SET course = 'M.Sc Physics' WHERE course = 'M.Sc Phy';
UPDATE students SET course = TRIM(course) WHERE course IS NOT NULL;

-- 6. leftover check: anything still outside the standard list will show here
SELECT 'students' AS tbl, department, COUNT(*) FROM students
 WHERE department IS NOT NULL AND department NOT IN ('Commerce','Computer Science','Management','Mathematics','Physics')
 GROUP BY department
UNION ALL
SELECT 'teachers', department, COUNT(*) FROM teachers
 WHERE department IS NOT NULL AND department NOT IN ('Commerce','Computer Science','Management','Mathematics','Physics')
 GROUP BY department
UNION ALL
SELECT 'books', department, COUNT(*) FROM books
 WHERE department IS NOT NULL AND department NOT IN ('Commerce','Computer Science','Management','Mathematics','Physics')
 GROUP BY department;
