-- ============================================================
-- SEED DATA - Library Management System
-- Passwords are all: "Password@123" (bcrypt hashed)
-- ============================================================

-- Admin user (password: Admin@123)
INSERT INTO users (id, name, email, password_hash, role, must_change_password) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Super Admin',
  'admin@library.edu',
  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy',  -- Admin@123
  'admin',
  FALSE
);

-- Librarian users
INSERT INTO users (id, name, email, password_hash, role, must_change_password) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'Rajesh Kumar',
  'librarian@library.edu',
  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy',  -- Admin@123
  'librarian',
  FALSE
),
(
  'b0000000-0000-0000-0000-000000000002',
  'Sunita Sharma',
  'sunita@library.edu',
  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy',
  'librarian',
  FALSE
);

-- Student users
INSERT INTO users (id, name, email, password_hash, role, must_change_password) VALUES
(
  'c0000000-0000-0000-0000-000000000001', 'Amit Verma',     'amit@student.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE
),
(
  'c0000000-0000-0000-0000-000000000002', 'Priya Singh',    'priya@student.edu',  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE
),
(
  'c0000000-0000-0000-0000-000000000003', 'Rahul Gupta',    'rahul@student.edu',  '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE
),
(
  'c0000000-0000-0000-0000-000000000004', 'Neha Patel',     'neha@student.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'student', FALSE
);

-- Librarian profiles
INSERT INTO librarians (user_id, employee_id, department) VALUES
('b0000000-0000-0000-0000-000000000001', 'LIB001', 'Central Library'),
('b0000000-0000-0000-0000-000000000002', 'LIB002', 'Reference Section');

-- Student profiles
INSERT INTO students (user_id, course, semester, year, mobile, address, enrollment_no) VALUES
('c0000000-0000-0000-0000-000000000001', 'B.Tech CS',  '5th', 3, '9876543210', '123 MG Road, Agra', 'EN2021001'),
('c0000000-0000-0000-0000-000000000002', 'BCA',        '3rd', 2, '9876543211', '456 Fatehabad Road, Agra', 'EN2022001'),
('c0000000-0000-0000-0000-000000000003', 'B.Sc Math',  '1st', 1, '9876543212', '789 Sikandra, Agra', 'EN2024001'),
('c0000000-0000-0000-0000-000000000004', 'MBA',        '2nd', 1, '9876543213', '321 Taj Road, Agra', 'EN2024002');

-- Teacher users
INSERT INTO users (id, name, email, password_hash, role, must_change_password) VALUES
(
  'f0000000-0000-0000-0000-000000000001', 'Dr. Suresh Menon', 'teacher@library.edu', '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'teacher', FALSE
),
(
  'f0000000-0000-0000-0000-000000000002', 'Prof. Anita Desai',  'anita@library.edu',   '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy', 'teacher', FALSE
);

-- Teacher profiles
INSERT INTO teachers (user_id, employee_id, department, designation, mobile, address) VALUES
('f0000000-0000-0000-0000-000000000001', 'TCH001', 'Computer Science', 'Associate Professor', '9876543220', '10 Civil Lines, Agra'),
('f0000000-0000-0000-0000-000000000002', 'TCH002', 'Mathematics',      'Assistant Professor', '9876543221', '22 Sadar Bazaar, Agra');

-- Books
INSERT INTO books (id, title, author, isbn, category, publisher, publication_year, total_copies, available_copies, shelf_location) VALUES
('d0000000-0000-0000-0000-000000000001', 'Introduction to Algorithms',   'Thomas H. Cormen',    '9780262033848', 'Computer Science', 'MIT Press',      2009, 5, 3, 'CS-A1'),
('d0000000-0000-0000-0000-000000000002', 'Clean Code',                   'Robert C. Martin',    '9780132350884', 'Computer Science', 'Prentice Hall',  2008, 3, 2, 'CS-A2'),
('d0000000-0000-0000-0000-000000000003', 'The Pragmatic Programmer',     'Andrew Hunt',         '9780201616224', 'Computer Science', 'Addison-Wesley', 1999, 4, 4, 'CS-A3'),
('d0000000-0000-0000-0000-000000000004', 'Database System Concepts',     'Abraham Silberschatz','9780078022159', 'Database',         'McGraw Hill',    2010, 6, 5, 'DB-B1'),
('d0000000-0000-0000-0000-000000000005', 'Operating System Concepts',    'Silberschatz',        '9781118063330', 'OS',               'Wiley',          2012, 4, 4, 'OS-C1'),
('d0000000-0000-0000-0000-000000000006', 'Computer Networks',            'Andrew Tanenbaum',    '9780132126953', 'Networks',         'Prentice Hall',  2010, 3, 3, 'NW-D1'),
('d0000000-0000-0000-0000-000000000007', 'Discrete Mathematics',         'Kenneth Rosen',       '9780072899054', 'Mathematics',      'McGraw Hill',    2007, 5, 5, 'MA-E1'),
('d0000000-0000-0000-0000-000000000008', 'Engineering Mathematics',      'H.K. Dass',           '9788121903455', 'Mathematics',      'S. Chand',       2015, 8, 6, 'MA-E2'),
('d0000000-0000-0000-0000-000000000009', 'Physics for Engineers',        'M.N. Avadhanulu',     '9788121908061', 'Physics',          'S. Chand',       2014, 6, 6, 'PH-F1'),
('d0000000-0000-0000-0000-000000000010', 'Principles of Management',     'P.C. Tripathi',       '9780070620391', 'Management',       'McGraw Hill',    2012, 4, 4, 'MG-G1'),
('d0000000-0000-0000-0000-000000000011', 'Financial Accounting',         'T.S. Grewal',         '9788126914821', 'Accounting',       'Sultan Chand',   2018, 5, 5, 'AC-H1'),
('d0000000-0000-0000-0000-000000000012', 'Artificial Intelligence',      'Stuart Russell',      '9780136042594', 'Computer Science', 'Prentice Hall',  2009, 3, 2, 'CS-A4');

-- Sample issued books (for demo)
INSERT INTO issued_books (id, student_id, book_id, issued_by, issue_date, due_date, is_returned) VALUES
(
  'e0000000-0000-0000-0000-000000000001',
  (SELECT id FROM students WHERE enrollment_no='EN2021001'),
  'd0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE - INTERVAL '3 days',
  FALSE
),
(
  'e0000000-0000-0000-0000-000000000002',
  (SELECT id FROM students WHERE enrollment_no='EN2022001'),
  'd0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '2 days',
  FALSE
);

-- Sample teacher issued book
INSERT INTO issued_books (id, teacher_id, book_id, issued_by, issue_date, due_date, is_returned) VALUES
(
  'e0000000-0000-0000-0000-000000000003',
  (SELECT t.id FROM teachers t JOIN users u ON u.id=t.user_id WHERE u.email='teacher@library.edu'),
  'd0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000001',
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '11 days',
  FALSE
);

-- Update available copies for issued books
UPDATE books SET available_copies = available_copies - 1
WHERE id IN ('d0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003');

-- Sample overdue fine
INSERT INTO fines (student_id, issued_book_id, amount, days_late, status) VALUES
(
  (SELECT id FROM students WHERE enrollment_no='EN2021001'),
  'e0000000-0000-0000-0000-000000000001',
  15.00,
  3,
  'pending'
);

-- Sample book request
INSERT INTO book_requests (student_id, book_name, author, reason) VALUES
(
  (SELECT id FROM students WHERE enrollment_no='EN2024001'),
  'Design Patterns',
  'Gang of Four',
  'Required for Software Engineering course'
);
