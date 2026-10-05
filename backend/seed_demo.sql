-- ============================================================
-- LIBSYS DEMO SEED — 20 of everything, every scenario covered
-- ============================================================
-- HOW TO RUN (Neon SQL Editor, in this order):
--   1. backend/migration_department.sql   (once — adds department columns)
--   2. backend/seed_demo.sql              (this file — safe to re-run,
--                                          existing rows are skipped)
--
-- DEMO LOGINS (password for ALL: Admin@123)
--   Admin:      admin@library.edu
--   Librarian:  librarian@library.edu
--   Student (CS, has books):     aarav.sharma@student.edu
--   Student (blocked):           kabir.singh@student.edu
--   Student (owes pending fine): diya.patel@student.edu
--   Teacher:    ramesh.iyer@library.edu
--
-- WHAT'S COVERED:
--   Users .... 1 admin + 2 librarians + 20 students + 4 teachers
--   Books .... 30 books across 5 departments (CS, Math, Physics,
--              Management, Commerce) with individual copies
--   Issues ... 20 records: active on-time, active overdue, returned
--              on-time, returned late, reissued x1/x2, teacher issues
--   Fines .... pending + paid + waived (fines appear ONLY at return)
--   Audit .... sample trail so Admin > Audit Logs has data
-- ============================================================

-- ============================================================
-- 0. SAFETY: make sure department columns exist (in case the
--    migration file was never run — harmless if already present)
-- ============================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE books ADD COLUMN IF NOT EXISTS department VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_books_department ON books(department);

-- ============================================================
-- 1. USERS (password for all = Admin@123)
-- hash: $2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy
-- ============================================================
INSERT INTO users (id, name, email, password_hash, role, must_change_password) VALUES
-- admin (1)
('a0000000-0000-0000-0000-000000000001', 'Super Admin',   'admin@library.edu',     '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'admin', FALSE),
-- librarians (2)
('b0000000-0000-0000-0000-000000000001', 'Rajesh Kumar',  'librarian@library.edu', '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'librarian', FALSE),
('b0000000-0000-0000-0000-000000000002', 'Sunita Sharma', 'sunita@library.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'librarian', FALSE),
-- students (20)
('c1000000-0000-0000-0000-000000000001', 'Aarav Sharma',   'aarav.sharma@student.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000002', 'Diya Patel',     'diya.patel@student.edu',     '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000003', 'Arjun Mehta',    'arjun.mehta@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000004', 'Ishita Verma',   'ishita.verma@student.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000005', 'Kabir Singh',    'kabir.singh@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000006', 'Ananya Iyer',    'ananya.iyer@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000007', 'Vivaan Rao',     'vivaan.rao@student.edu',     '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000008', 'Myra Nair',      'myra.nair@student.edu',      '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000009', 'Advait Joshi',   'advait.joshi@student.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000010', 'Sara Khan',      'sara.khan@student.edu',      '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000011', 'Krishna Menon',  'krishna.menon@student.edu',  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000012', 'Riya Kapoor',    'riya.kapoor@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000013', 'Ayaan Sheikh',   'ayaan.sheikh@student.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000014', 'Navya Reddy',    'navya.reddy@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000015', 'Yash Thakur',    'yash.thakur@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000016', 'Pari Malhotra',  'pari.malhotra@student.edu',  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000017', 'Dev Chauhan',    'dev.chauhan@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000018', 'Zara Ali',       'zara.ali@student.edu',       '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000019', 'Rudra Pillai',   'rudra.pillai@student.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
('c1000000-0000-0000-0000-000000000020', 'Aisha Bhatt',    'aisha.bhatt@student.edu',    '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE),
-- teachers (4)
('f1000000-0000-0000-0000-000000000001', 'Dr. Ramesh Iyer',  'ramesh.iyer@library.edu',  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'teacher', FALSE),
('f1000000-0000-0000-0000-000000000002', 'Prof. Kavita Rao', 'kavita.rao@library.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'teacher', FALSE),
('f1000000-0000-0000-0000-000000000003', 'Dr. Vikram Nair',  'vikram.nair@library.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'teacher', FALSE),
('f1000000-0000-0000-0000-000000000004', 'Ms. Pooja Desai',  'pooja.desai@library.edu',  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'teacher', FALSE)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2. PROFILES
-- ============================================================
INSERT INTO librarians (user_id, employee_id, department)
SELECT id, v.emp, v.dept FROM users u
JOIN (VALUES
  ('librarian@library.edu', 'LIB001', 'Central Library'),
  ('sunita@library.edu',    'LIB002', 'Reference Section')
) AS v(email, emp, dept) ON v.email = u.email
ON CONFLICT (user_id) DO NOTHING;

-- 20 student profiles across 5 departments (one is BLOCKED for testing)
INSERT INTO students (user_id, course, department, semester, year, mobile, address, enrollment_no, is_blocked, block_reason)
SELECT u.id, v.course, v.dept, v.sem, v.yr, v.mobile, v.addr, v.enroll, v.blocked, v.reason
FROM users u JOIN (VALUES
  ('aarav.sharma@student.edu',  'B.Tech CSE', 'Computer Science', '5th', 3, '9811000001', '12 MG Road, Agra',        'EN2023001', FALSE, NULL),
  ('diya.patel@student.edu',    'B.Tech CSE', 'Computer Science', '5th', 3, '9811000002', '34 Fatehabad Rd, Agra',   'EN2023002', FALSE, NULL),
  ('arjun.mehta@student.edu',   'BCA',        'Computer Science', '3rd', 2, '9811000003', '7 Sikandra, Agra',        'EN2023003', FALSE, NULL),
  ('ishita.verma@student.edu',  'BCA',        'Computer Science', '3rd', 2, '9811000004', '9 Taj Nagri, Agra',       'EN2023004', FALSE, NULL),
  ('kabir.singh@student.edu',   'B.Tech CSE', 'Computer Science', '7th', 4, '9811000005', '21 Civil Lines, Agra',    'EN2023005', TRUE,  'Unpaid fines over Rs. 100'),
  ('ananya.iyer@student.edu',   'B.Sc Maths', 'Mathematics',      '3rd', 2, '9811000006', '5 Sadar Bazaar, Agra',    'EN2023006', FALSE, NULL),
  ('vivaan.rao@student.edu',    'B.Sc Maths', 'Mathematics',      '1st', 1, '9811000007', '11 Kamla Nagar, Agra',    'EN2023007', FALSE, NULL),
  ('myra.nair@student.edu',     'M.Sc Maths', 'Mathematics',      '1st', 1, '9811000008', '3 Vibhav Nagar, Agra',    'EN2023008', FALSE, NULL),
  ('advait.joshi@student.edu',  'B.Sc Maths', 'Mathematics',      '5th', 3, '9811000009', '8 Shastri Nagar, Agra',   'EN2023009', FALSE, NULL),
  ('sara.khan@student.edu',     'B.Tech EE',  'Physics',          '3rd', 2, '9811000010', '15 Shahganj, Agra',       'EN2023010', FALSE, NULL),
  ('krishna.menon@student.edu', 'B.Sc Phy',   'Physics',          '1st', 1, '9811000011', '2 Dayalbagh, Agra',       'EN2023011', FALSE, NULL),
  ('riya.kapoor@student.edu',   'B.Sc Phy',   'Physics',          '5th', 3, '9811000012', '6 Khandari, Agra',        'EN2023012', FALSE, NULL),
  ('ayaan.sheikh@student.edu',  'M.Sc Phy',   'Physics',          '3rd', 2, '9811000013', '19 Loha Mandi, Agra',     'EN2023013', FALSE, NULL),
  ('navya.reddy@student.edu',   'BBA',        'Management',       '3rd', 2, '9811000014', '4 Sanjay Place, Agra',    'EN2023014', FALSE, NULL),
  ('yash.thakur@student.edu',   'BBA',        'Management',       '5th', 3, '9811000015', '23 Balkeshwar, Agra',     'EN2023015', FALSE, NULL),
  ('pari.malhotra@student.edu', 'MBA',        'Management',       '1st', 1, '9811000016', '10 Lawyers Colony, Agra', 'EN2023016', FALSE, NULL),
  ('dev.chauhan@student.edu',   'B.Com',      'Commerce',         '3rd', 2, '9811000017', '14 Chipitola, Agra',      'EN2023017', FALSE, NULL),
  ('zara.ali@student.edu',      'B.Com',      'Commerce',         '1st', 1, '9811000018', '17 Nai ki Mandi, Agra',   'EN2023018', FALSE, NULL),
  ('rudra.pillai@student.edu',  'M.Com',      'Commerce',         '3rd', 2, '9811000019', '20 Idgah Colony, Agra',   'EN2023019', FALSE, NULL),
  ('aisha.bhatt@student.edu',   'B.Com',      'Commerce',         '5th', 3, '9811000020', '25 Ghatia Azam, Agra',    'EN2023020', FALSE, NULL)
) AS v(email, course, dept, sem, yr, mobile, addr, enroll, blocked, reason) ON v.email = u.email
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO teachers (user_id, employee_id, department, designation, mobile, address)
SELECT u.id, v.emp, v.dept, v.desig, v.mobile, v.addr FROM users u
JOIN (VALUES
  ('ramesh.iyer@library.edu', 'TCH001', 'Computer Science', 'Associate Professor', '9822000001', '30 Professors Colony, Agra'),
  ('kavita.rao@library.edu',  'TCH002', 'Mathematics',      'Assistant Professor', '9822000002', '31 Professors Colony, Agra'),
  ('vikram.nair@library.edu', 'TCH003', 'Physics',          'Professor',           '9822000003', '32 Professors Colony, Agra'),
  ('pooja.desai@library.edu', 'TCH004', 'Management',       'Assistant Professor', '9822000004', '33 Professors Colony, Agra')
) AS v(email, emp, dept, desig, mobile, addr) ON v.email = u.email
WHERE NOT EXISTS (SELECT 1 FROM teachers t WHERE t.user_id = u.id OR t.employee_id = v.emp);

-- ============================================================
-- 3. BOOKS (30 across 5 departments, all with book_code)
-- ============================================================
INSERT INTO books (id, title, author, isbn, book_code, category, department, publisher, publication_year, total_copies, available_copies, shelf_location) VALUES
-- Computer Science (4)
('d1000000-0000-0000-0000-000000000001', 'Introduction to Algorithms', 'Thomas H. Cormen',  '9780262033848', 'CS-001', 'Computer Science', 'Computer Science', 'MIT Press',      2009, 5, 5, 'CS-A1'),
('d1000000-0000-0000-0000-000000000002', 'Clean Code',                 'Robert C. Martin',  '9780132350884', 'CS-002', 'Computer Science', 'Computer Science', 'Prentice Hall',  2008, 3, 3, 'CS-A2'),
('d1000000-0000-0000-0000-000000000003', 'Database System Concepts',   'A. Silberschatz',   '9780078022159', 'CS-003', 'Database',         'Computer Science', 'McGraw Hill',    2010, 4, 4, 'CS-A3'),
('d1000000-0000-0000-0000-000000000004', 'Operating System Concepts',  'A. Silberschatz',   '9781118063330', 'CS-004', 'Operating Systems','Computer Science', 'Wiley',          2012, 2, 2, 'CS-A4'),
-- Mathematics (4)
('d1000000-0000-0000-0000-000000000005', 'Discrete Mathematics',       'Kenneth Rosen',     '9780072899054', 'MA-001', 'Mathematics',      'Mathematics',      'McGraw Hill',    2007, 5, 5, 'MA-B1'),
('d1000000-0000-0000-0000-000000000006', 'Engineering Mathematics',    'H.K. Dass',         '9788121903455', 'MA-002', 'Mathematics',      'Mathematics',      'S. Chand',       2015, 6, 6, 'MA-B2'),
('d1000000-0000-0000-0000-000000000007', 'Linear Algebra Done Right',  'Sheldon Axler',     '9783319110790', 'MA-003', 'Mathematics',      'Mathematics',      'Springer',        2014, 3, 3, 'MA-B3'),
('d1000000-0000-0000-0000-000000000008', 'Calculus: Early Transcendentals', 'James Stewart','9780538497909', 'MA-004', 'Mathematics',      'Mathematics',      'Cengage',        2011, 4, 4, 'MA-B4'),
-- Physics (4)
('d1000000-0000-0000-0000-000000000009', 'Concepts of Physics Vol 1',  'H.C. Verma',        '9788177091878', 'PH-001', 'Physics',          'Physics',          'Bharati Bhawan', 2010, 6, 6, 'PH-C1'),
('d1000000-0000-0000-0000-000000000010', 'Engineering Physics',        'M.N. Avadhanulu',   '9788121908061', 'PH-002', 'Physics',          'Physics',          'S. Chand',       2014, 4, 4, 'PH-C2'),
('d1000000-0000-0000-0000-000000000011', 'Quantum Mechanics',          'David Griffiths',   '9781107189638', 'PH-003', 'Physics',          'Physics',          'Cambridge',      2016, 2, 2, 'PH-C3'),
('d1000000-0000-0000-0000-000000000012', 'Thermodynamics',             'P.K. Nag',          '9789332903479', 'PH-004', 'Physics',          'Physics',          'McGraw Hill',    2013, 3, 3, 'PH-C4'),
-- Management (4)
('d1000000-0000-0000-0000-000000000013', 'Principles of Management',   'P.C. Tripathi',     '9780070620391', 'MG-001', 'Management',       'Management',       'McGraw Hill',    2012, 4, 4, 'MG-D1'),
('d1000000-0000-0000-0000-000000000014', 'Marketing Management',       'Philip Kotler',     '9780136009986', 'MG-002', 'Marketing',        'Management',       'Prentice Hall',  2011, 3, 3, 'MG-D2'),
('d1000000-0000-0000-0000-000000000015', 'Human Resource Management',  'Gary Dessler',      '9780135173603', 'MG-003', 'HR',               'Management',       'Pearson',        2019, 2, 2, 'MG-D3'),
('d1000000-0000-0000-0000-000000000016', 'Organisational Behaviour',   'Stephen Robbins',   '9780134103983', 'MG-004', 'Management',       'Management',       'Pearson',        2016, 5, 5, 'MG-D4'),
-- Commerce (4)
('d1000000-0000-0000-0000-000000000017', 'Financial Accounting',       'T.S. Grewal',       '9788126914821', 'CM-001', 'Accounting',       'Commerce',         'Sultan Chand',   2018, 5, 5, 'CM-E1'),
('d1000000-0000-0000-0000-000000000018', 'Business Economics',         'H.L. Ahuja',        '9788121923163', 'CM-002', 'Economics',        'Commerce',         'S. Chand',       2017, 3, 3, 'CM-E2'),
('d1000000-0000-0000-0000-000000000019', 'Cost Accounting',            'M.N. Arora',        '9789325980902', 'CM-003', 'Accounting',       'Commerce',         'Vikas',          2016, 4, 4, 'CM-E3'),
('d1000000-0000-0000-0000-000000000020', 'Income Tax Law and Practice','H.C. Mehrotra',     '9788121913072', 'CM-004', 'Taxation',         'Commerce',         'Sahitya Bhawan', 2020, 2, 2, 'CM-E4'),
-- Computer Science (2 more)
('d1000000-0000-0000-0000-000000000021', 'Data Structures and Algorithms', 'Alfred Aho',    '9780201000239', 'CS-005', 'Computer Science', 'Computer Science', 'Addison-Wesley', 2011, 4, 4, 'CS-A5'),
('d1000000-0000-0000-0000-000000000022', 'Software Engineering',       'Ian Sommerville',   '9780133943030', 'CS-006', 'Software Engg.',   'Computer Science', 'Pearson',        2015, 6, 6, 'CS-A6'),
-- Mathematics (2 more)
('d1000000-0000-0000-0000-000000000023', 'Probability and Statistics', 'S.C. Gupta',        '9788121902819', 'MA-005', 'Statistics',       'Mathematics',      'S. Chand',       2013, 5, 5, 'MA-B5'),
('d1000000-0000-0000-0000-000000000024', 'Differential Equations',     'B.D. Sharma',       '9788122403001', 'MA-006', 'Mathematics',      'Mathematics',      'Kedar Nath',     2012, 3, 3, 'MA-B6'),
-- Physics (2 more)
('d1000000-0000-0000-0000-000000000025', 'Modern Physics',             'Arthur Beiser',     '9780072843998', 'PH-005', 'Physics',          'Physics',          'McGraw Hill',    2009, 4, 4, 'PH-C5'),
('d1000000-0000-0000-0000-000000000026', 'A Textbook of Optics',       'N. Subrahmanyam',   '9788121909488', 'PH-006', 'Optics',           'Physics',          'S. Chand',       2016, 5, 5, 'PH-C6'),
-- Management (2 more)
('d1000000-0000-0000-0000-000000000027', 'Financial Management',       'I.M. Pandey',       '9789325989424', 'MG-005', 'Finance',          'Management',       'Vikas',          2015, 3, 3, 'MG-D5'),
('d1000000-0000-0000-0000-000000000028', 'Operations Management',      'Jay Heizer',        '9780134130422', 'MG-006', 'Operations',       'Management',       'Pearson',        2017, 4, 4, 'MG-D6'),
-- Commerce (2 more)
('d1000000-0000-0000-0000-000000000029', 'Auditing and Assurance',     'T.R. Sharma',       '9788121907316', 'CM-005', 'Auditing',         'Commerce',         'Sahitya Bhawan', 2019, 3, 3, 'CM-E5'),
('d1000000-0000-0000-0000-000000000030', 'Business Law',               'M.C. Kuchhal',      '9789325996156', 'CM-006', 'Law',              'Commerce',         'Vikas',          2018, 4, 4, 'CM-E6')
ON CONFLICT (book_code) DO NOTHING;

-- ============================================================
-- 4. BOOK COPIES (auto-generated: CODE-001, CODE-002 ... per book)
-- ============================================================
INSERT INTO book_copies (book_id, copy_code, status)
SELECT b.id, b.book_code || '-' || LPAD(g.s::text, 3, '0'), 'available'
FROM books b CROSS JOIN LATERAL generate_series(1, b.total_copies) g(s)
WHERE b.book_code LIKE 'CS-%' OR b.book_code LIKE 'MA-%' OR b.book_code LIKE 'PH-%'
   OR b.book_code LIKE 'MG-%' OR b.book_code LIKE 'CM-%'
ON CONFLICT (copy_code) DO NOTHING;

-- ============================================================
-- 5. ISSUED BOOKS (20 records — every scenario)
-- ============================================================
-- helper: librarian who issues everything
-- (uses Rajesh Kumar's user id)

-- --- ACTIVE, ON TIME (due in future, no fine) ---
-- 1. Aarav (CS) holds CS-001-001, due in 5 days
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000001',
  (SELECT id FROM students WHERE enrollment_no='EN2023001'),
  (SELECT id FROM books WHERE book_code='CS-001'),
  (SELECT id FROM book_copies WHERE copy_code='CS-001-001'),
  'CS-001-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 2, CURRENT_DATE + 5, FALSE
ON CONFLICT (id) DO NOTHING;

-- 2. Ananya (Maths) holds MA-001-001, due in 2 days
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000002',
  (SELECT id FROM students WHERE enrollment_no='EN2023006'),
  (SELECT id FROM books WHERE book_code='MA-001'),
  (SELECT id FROM book_copies WHERE copy_code='MA-001-001'),
  'MA-001-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 5, CURRENT_DATE + 2, FALSE
ON CONFLICT (id) DO NOTHING;

-- --- ACTIVE, OVERDUE (still out, Overdue badge, NO rupee fine yet) ---
-- 3. Diya (CS) holds CS-002-001, 3 days overdue
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000003',
  (SELECT id FROM students WHERE enrollment_no='EN2023002'),
  (SELECT id FROM books WHERE book_code='CS-002'),
  (SELECT id FROM book_copies WHERE copy_code='CS-002-001'),
  'CS-002-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 10, CURRENT_DATE - 3, FALSE
ON CONFLICT (id) DO NOTHING;

-- 4. Vivaan (Maths) holds MA-002-001, 10 days overdue
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000004',
  (SELECT id FROM students WHERE enrollment_no='EN2023007'),
  (SELECT id FROM books WHERE book_code='MA-002'),
  (SELECT id FROM book_copies WHERE copy_code='MA-002-001'),
  'MA-002-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 17, CURRENT_DATE - 10, FALSE
ON CONFLICT (id) DO NOTHING;

-- 5. Sara (Physics) holds PH-001-001, 1 day overdue
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000005',
  (SELECT id FROM students WHERE enrollment_no='EN2023010'),
  (SELECT id FROM books WHERE book_code='PH-001'),
  (SELECT id FROM book_copies WHERE copy_code='PH-001-001'),
  'PH-001-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 8, CURRENT_DATE - 1, FALSE
ON CONFLICT (id) DO NOTHING;

-- --- RETURNED ON TIME (no fine) ---
-- 6. Arjun returned CS-003-001 on the due date
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000006',
  (SELECT id FROM students WHERE enrollment_no='EN2023003'),
  (SELECT id FROM books WHERE book_code='CS-003'),
  (SELECT id FROM book_copies WHERE copy_code='CS-003-001'),
  'CS-003-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 20, CURRENT_DATE - 13, CURRENT_DATE - 13, TRUE
ON CONFLICT (id) DO NOTHING;

-- 7. Myra returned MA-003-001 two days early
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000007',
  (SELECT id FROM students WHERE enrollment_no='EN2023008'),
  (SELECT id FROM books WHERE book_code='MA-003'),
  (SELECT id FROM book_copies WHERE copy_code='MA-003-001'),
  'MA-003-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 25, CURRENT_DATE - 18, CURRENT_DATE - 20, TRUE
ON CONFLICT (id) DO NOTHING;

-- --- RETURNED LATE (fines recorded below) ---
-- 8. Diya returned CS-001-002, 4 days late -> PENDING fine Rs.20
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000008',
  (SELECT id FROM students WHERE enrollment_no='EN2023002'),
  (SELECT id FROM books WHERE book_code='CS-001'),
  (SELECT id FROM book_copies WHERE copy_code='CS-001-002'),
  'CS-001-002',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 30, CURRENT_DATE - 23, CURRENT_DATE - 19, TRUE
ON CONFLICT (id) DO NOTHING;

-- 9. Arjun returned MA-001-002, 7 days late -> PENDING fine Rs.35
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000009',
  (SELECT id FROM students WHERE enrollment_no='EN2023003'),
  (SELECT id FROM books WHERE book_code='MA-001'),
  (SELECT id FROM book_copies WHERE copy_code='MA-001-002'),
  'MA-001-002',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 35, CURRENT_DATE - 28, CURRENT_DATE - 21, TRUE
ON CONFLICT (id) DO NOTHING;

-- 10. Ishita returned PH-002-001, 2 days late -> PAID fine Rs.10
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000010',
  (SELECT id FROM students WHERE enrollment_no='EN2023004'),
  (SELECT id FROM books WHERE book_code='PH-002'),
  (SELECT id FROM book_copies WHERE copy_code='PH-002-001'),
  'PH-002-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 40, CURRENT_DATE - 33, CURRENT_DATE - 31, TRUE
ON CONFLICT (id) DO NOTHING;

-- 11. Kabir (blocked) returned MG-001-001, 12 days late -> WAIVED fine Rs.60
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000011',
  (SELECT id FROM students WHERE enrollment_no='EN2023005'),
  (SELECT id FROM books WHERE book_code='MG-001'),
  (SELECT id FROM book_copies WHERE copy_code='MG-001-001'),
  'MG-001-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 50, CURRENT_DATE - 43, CURRENT_DATE - 31, TRUE
ON CONFLICT (id) DO NOTHING;

-- 12. Navya returned CM-001-001, 1 day late -> PENDING fine Rs.5 (minimum case)
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000012',
  (SELECT id FROM students WHERE enrollment_no='EN2023014'),
  (SELECT id FROM books WHERE book_code='CM-001'),
  (SELECT id FROM book_copies WHERE copy_code='CM-001-001'),
  'CM-001-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 15, CURRENT_DATE - 8, CURRENT_DATE - 7, TRUE
ON CONFLICT (id) DO NOTHING;

-- 13. Yash returned CM-002-001 on time
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000013',
  (SELECT id FROM students WHERE enrollment_no='EN2023015'),
  (SELECT id FROM books WHERE book_code='CM-002'),
  (SELECT id FROM book_copies WHERE copy_code='CM-002-001'),
  'CM-002-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 22, CURRENT_DATE - 15, CURRENT_DATE - 16, TRUE
ON CONFLICT (id) DO NOTHING;

-- --- REISSUED (due date extended, still out) ---
-- 14. Advait reissued MA-004-001 once (reissue_count 1)
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned, reissue_count, last_reissue_at)
SELECT 'e1000000-0000-0000-0000-000000000014',
  (SELECT id FROM students WHERE enrollment_no='EN2023009'),
  (SELECT id FROM books WHERE book_code='MA-004'),
  (SELECT id FROM book_copies WHERE copy_code='MA-004-001'),
  'MA-004-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 20, CURRENT_DATE + 1, FALSE, 1, CURRENT_DATE - 6
ON CONFLICT (id) DO NOTHING;

-- 15. Krishna reissued PH-003-001 twice (reissue_count 2)
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned, reissue_count, last_reissue_at)
SELECT 'e1000000-0000-0000-0000-000000000015',
  (SELECT id FROM students WHERE enrollment_no='EN2023011'),
  (SELECT id FROM books WHERE book_code='PH-003'),
  (SELECT id FROM book_copies WHERE copy_code='PH-003-001'),
  'PH-003-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 30, CURRENT_DATE - 2, FALSE, 2, CURRENT_DATE - 9
ON CONFLICT (id) DO NOTHING;

-- 16. Dev (Commerce) holds CM-003-001, due in 4 days
INSERT INTO issued_books (id, student_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000016',
  (SELECT id FROM students WHERE enrollment_no='EN2023017'),
  (SELECT id FROM books WHERE book_code='CM-003'),
  (SELECT id FROM book_copies WHERE copy_code='CM-003-001'),
  'CM-003-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 3, CURRENT_DATE + 4, FALSE
ON CONFLICT (id) DO NOTHING;

-- --- TEACHER ISSUES (no fines, long/no-pressure loans) ---
-- 17. Dr. Ramesh Iyer holds CS-004-001
INSERT INTO issued_books (id, teacher_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000017',
  (SELECT t.id FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.email='ramesh.iyer@library.edu'),
  (SELECT id FROM books WHERE book_code='CS-004'),
  (SELECT id FROM book_copies WHERE copy_code='CS-004-001'),
  'CS-004-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 12, CURRENT_DATE + 30, FALSE
ON CONFLICT (id) DO NOTHING;

-- 18. Prof. Kavita Rao holds MA-002-002
INSERT INTO issued_books (id, teacher_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000018',
  (SELECT t.id FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.email='kavita.rao@library.edu'),
  (SELECT id FROM books WHERE book_code='MA-002'),
  (SELECT id FROM book_copies WHERE copy_code='MA-002-002'),
  'MA-002-002',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 6, CURRENT_DATE + 30, FALSE
ON CONFLICT (id) DO NOTHING;

-- 19. Dr. Vikram Nair returned PH-004-001 (teachers return too, no fine)
INSERT INTO issued_books (id, teacher_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, return_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000019',
  (SELECT t.id FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.email='vikram.nair@library.edu'),
  (SELECT id FROM books WHERE book_code='PH-004'),
  (SELECT id FROM book_copies WHERE copy_code='PH-004-001'),
  'PH-004-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 45, CURRENT_DATE - 10, CURRENT_DATE - 12, TRUE
ON CONFLICT (id) DO NOTHING;

-- 20. Ms. Pooja Desai holds MG-004-001
INSERT INTO issued_books (id, teacher_id, book_id, copy_id, copy_code, issued_by, issue_date, due_date, is_returned)
SELECT 'e1000000-0000-0000-0000-000000000020',
  (SELECT t.id FROM teachers t JOIN users u ON u.id = t.user_id WHERE u.email='pooja.desai@library.edu'),
  (SELECT id FROM books WHERE book_code='MG-004'),
  (SELECT id FROM book_copies WHERE copy_code='MG-004-001'),
  'MG-004-001',
  (SELECT id FROM users WHERE email='librarian@library.edu'),
  CURRENT_DATE - 4, CURRENT_DATE + 30, FALSE
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. FINES (born ONLY at return — see issues 8,9,10,11,12)
-- ============================================================
-- PENDING Rs.20 — Diya, 4 days late (issue ...008)
INSERT INTO fines (student_id, issued_book_id, amount, days_late, status)
SELECT (SELECT id FROM students WHERE enrollment_no='EN2023002'),
  'e1000000-0000-0000-0000-000000000008', 20.00, 4, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE issued_book_id='e1000000-0000-0000-0000-000000000008');

-- PENDING Rs.35 — Arjun, 7 days late (issue ...009)
INSERT INTO fines (student_id, issued_book_id, amount, days_late, status)
SELECT (SELECT id FROM students WHERE enrollment_no='EN2023003'),
  'e1000000-0000-0000-0000-000000000009', 35.00, 7, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE issued_book_id='e1000000-0000-0000-0000-000000000009');

-- PAID Rs.10 — Ishita, 2 days late (issue ...010)
INSERT INTO fines (student_id, issued_book_id, amount, days_late, status, paid_at, paid_by)
SELECT (SELECT id FROM students WHERE enrollment_no='EN2023004'),
  'e1000000-0000-0000-0000-000000000010', 10.00, 2, 'paid',
  CURRENT_DATE - 30, (SELECT id FROM users WHERE email='librarian@library.edu')
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE issued_book_id='e1000000-0000-0000-0000-000000000010');

-- WAIVED Rs.60 — Kabir, 12 days late (issue ...011)
INSERT INTO fines (student_id, issued_book_id, amount, days_late, status, notes)
SELECT (SELECT id FROM students WHERE enrollment_no='EN2023005'),
  'e1000000-0000-0000-0000-000000000011', 60.00, 12, 'waived', 'First offence — waived by admin'
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE issued_book_id='e1000000-0000-0000-0000-000000000011');

-- PENDING Rs.5 — Navya, 1 day late (issue ...012, minimum case)
INSERT INTO fines (student_id, issued_book_id, amount, days_late, status)
SELECT (SELECT id FROM students WHERE enrollment_no='EN2023014'),
  'e1000000-0000-0000-0000-000000000012', 5.00, 1, 'pending'
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE issued_book_id='e1000000-0000-0000-0000-000000000012');

-- PAID Rs.25 — extra history: Arjun older return, 5 days late
INSERT INTO fines (student_id, issued_book_id, amount, days_late, status, paid_at, paid_by)
SELECT (SELECT id FROM students WHERE enrollment_no='EN2023003'),
  'e1000000-0000-0000-0000-000000000006', 25.00, 5, 'paid',
  CURRENT_DATE - 12, (SELECT id FROM users WHERE email='librarian@library.edu')
WHERE NOT EXISTS (SELECT 1 FROM fines WHERE issued_book_id='e1000000-0000-0000-0000-000000000006');

-- ============================================================
-- 7. SYNC COUNTS (copies status + available_copies from reality)
-- ============================================================
-- mark copies of books still out as issued
UPDATE book_copies bc SET status='issued'
WHERE bc.id IN (SELECT copy_id FROM issued_books WHERE is_returned=FALSE AND copy_id IS NOT NULL);

-- recompute available_copies on the 30 demo books
UPDATE books b SET available_copies = b.total_copies -
  COALESCE((SELECT COUNT(*) FROM issued_books ib WHERE ib.book_id=b.id AND ib.is_returned=FALSE), 0)
WHERE b.book_code IN ('CS-001','CS-002','CS-003','CS-004','CS-005','CS-006',
  'MA-001','MA-002','MA-003','MA-004','MA-005','MA-006',
  'PH-001','PH-002','PH-003','PH-004','PH-005','PH-006',
  'MG-001','MG-002','MG-003','MG-004','MG-005','MG-006',
  'CM-001','CM-002','CM-003','CM-004','CM-005','CM-006');

-- ============================================================
-- 8. SYSTEM CONFIG (ensure defaults exist)
-- ============================================================
INSERT INTO system_config (key, value, description) VALUES
  ('issue_duration_days', '7', 'Default number of days for book issue'),
  ('fine_per_day', '5', 'Fine amount per day in INR'),
  ('max_books_per_student', '3', 'Max books a student can issue at once'),
  ('cooldown_days', '1', 'Days before same book can be reissued'),
  ('issue_duration_days_teacher', '0', 'Teacher loan period in days (0 = unlimited)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9. AUDIT LOG SAMPLES (so Admin > Audit Logs has data)
-- ============================================================
INSERT INTO audit_logs (user_id, user_role, action, entity, entity_id, details)
SELECT (SELECT id FROM users WHERE email='librarian@library.edu'), 'librarian', v.action, v.entity,
  (SELECT id FROM books WHERE book_code='CS-001'), '{}'::jsonb
FROM (VALUES
  ('ADD_BOOK', 'books'),
  ('ISSUE_BOOK', 'issued_books'),
  ('RETURN_BOOK', 'issued_books'),
  ('REISSUE_BOOK', 'issued_books'),
  ('MARK_FINE_PAID', 'fines')
) AS v(action, entity);
