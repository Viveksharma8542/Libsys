UPDATE users SET password_hash = '$2b$10$YKGYxpEhWv5eGghScSuIwuVRC70ErweUwUsfURgPpY8K3vXAfgszy' 
WHERE email IN ('admin@library.edu', 'librarian@library.edu', 'amit@student.edu', 'sunita@library.edu', 'priya@student.edu', 'rahul@student.edu', 'neha@student.edu');
