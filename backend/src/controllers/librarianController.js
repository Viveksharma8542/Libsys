const { query, getClient } = require('../config/db');
const { getPagination, paginationMeta } = require('../middleware/validate');

// ── helper: get config value ──────────────────────────────────────────────────
const getConfigValue = async (key) => {
  const { rows } = await query('SELECT value FROM system_config WHERE key = $1', [key]);
  return rows.length ? rows[0].value : null;
};

// ── helper: calculate fine ─────────────────────────────────────────────────────
const calcFine = async (dueDate) => {
  const finePerDay = parseFloat(await getConfigValue('fine_per_day')) || 5;
  const today = new Date();
  const due   = new Date(dueDate);
  const days  = Math.max(0, Math.floor((today - due) / 86400000));
  return { days, amount: days * finePerDay };
};

// ════════════════════════════════════════════════════════════════════════════════
//  BOOK MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

exports.addBook = async (req, res) => {
  try {
    const { title, author, isbn, category, publisher, publication_year,
            total_copies, shelf_location, description } = req.body;

    const { rows } = await query(
      `INSERT INTO books (title, author, isbn, category, publisher, publication_year,
                          total_copies, available_copies, shelf_location, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9) RETURNING *`,
      [title, author, isbn, category, publisher, publication_year,
       total_copies || 1, shelf_location, description]
    );
    req.audit('ADD_BOOK', 'books', rows[0].id, { title, isbn });
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'ISBN already exists' });
    console.error('addBook error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, isbn, category, publisher, publication_year,
            total_copies, shelf_location, description } = req.body;

    // Recalculate available_copies if total changes
    const current = await query('SELECT * FROM books WHERE id = $1', [id]);
    if (!current.rows.length) return res.status(404).json({ success: false, message: 'Book not found' });

    const issued = current.rows[0].total_copies - current.rows[0].available_copies;
    const newAvailable = Math.max(0, (total_copies || current.rows[0].total_copies) - issued);

    const { rows } = await query(
      `UPDATE books SET title=$1, author=$2, isbn=$3, category=$4, publisher=$5,
       publication_year=$6, total_copies=$7, available_copies=$8,
       shelf_location=$9, description=$10
       WHERE id=$11 RETURNING *`,
      [title, author, isbn, category, publisher, publication_year,
       total_copies, newAvailable, shelf_location, description, id]
    );
    req.audit('UPDATE_BOOK', 'books', id, { title });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const { id } = req.params;
    const active = await query(
      'SELECT COUNT(*) FROM issued_books WHERE book_id=$1 AND is_returned=FALSE', [id]
    );
    if (parseInt(active.rows[0].count) > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete: book has active issues' });
    }
    await query('DELETE FROM books WHERE id=$1', [id]);
    req.audit('DELETE_BOOK', 'books', id, {});
    return res.json({ success: true, message: 'Book deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBooks = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, category } = req.query;

    let where = [];
    let params = [];
    let idx = 1;

    if (search) {
      where.push(`(title ILIKE $${idx} OR author ILIKE $${idx} OR isbn ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (category) { where.push(`category = $${idx++}`); params.push(category); }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await query(`SELECT COUNT(*) FROM books ${whereStr}`, params);
    const { rows } = await query(
      `SELECT * FROM books ${whereStr} ORDER BY title LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    return res.json({
      success: true,
      data: rows,
      meta: paginationMeta(parseInt(countRes.rows[0].count), page, limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM books WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Book not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  STUDENT MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

exports.getStudents = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search } = req.query;
    let where = [];
    let params = [];
    let idx = 1;

    if (search) {
      where.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR s.enrollment_no ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await query(
      `SELECT COUNT(*) FROM students s JOIN users u ON u.id=s.user_id ${whereStr}`, params
    );
    const { rows } = await query(
      `SELECT s.*, u.name, u.email, u.is_active, u.created_at,
              (SELECT COUNT(*) FROM issued_books ib WHERE ib.student_id=s.id AND ib.is_returned=FALSE) as active_issues,
              (SELECT COALESCE(SUM(f.amount),0) FROM fines f WHERE f.student_id=s.id AND f.status='pending') as pending_fines
       FROM students s JOIN users u ON u.id=s.user_id
       ${whereStr}
       ORDER BY u.name LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    return res.json({
      success: true,
      data: rows,
      meta: paginationMeta(parseInt(countRes.rows[0].count), page, limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params; // student.id (not user_id)

    const [profile, issued, fines, history] = await Promise.all([
      query(
        `SELECT s.*, u.name, u.email, u.is_active, u.created_at
         FROM students s JOIN users u ON u.id=s.user_id WHERE s.id=$1`, [id]
      ),
      query(
        `SELECT ib.*, b.title, b.author, b.isbn
         FROM issued_books ib JOIN books b ON b.id=ib.book_id
         WHERE ib.student_id=$1 AND ib.is_returned=FALSE ORDER BY ib.issue_date DESC`, [id]
      ),
      query(
        `SELECT f.*, b.title as book_title FROM fines f
         JOIN issued_books ib ON ib.id=f.issued_book_id
         JOIN books b ON b.id=ib.book_id
         WHERE f.student_id=$1 ORDER BY f.created_at DESC`, [id]
      ),
      query(
        `SELECT ib.*, b.title, b.author FROM issued_books ib JOIN books b ON b.id=ib.book_id
         WHERE ib.student_id=$1 ORDER BY ib.issue_date DESC LIMIT 20`, [id]
      ),
    ]);

    if (!profile.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    return res.json({
      success: true,
      data: { ...profile.rows[0], currentIssues: issued.rows, fines: fines.rows, history: history.rows }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.blockStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { block, reason } = req.body;
    const { rows } = await query(
      `UPDATE students SET is_blocked=$1, block_reason=$2 WHERE id=$3 RETURNING id, is_blocked`,
      [block, block ? reason : null, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    req.audit(block ? 'BLOCK_STUDENT' : 'UNBLOCK_STUDENT', 'students', id, { reason });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Get all teachers (for issue book dropdown) ─────────────────────────────────
exports.getTeachers = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search } = req.query;

    let where = ['u.is_active = TRUE'];
    let params = [];
    let idx = 1;

    if (search) {
      where.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx} OR t.employee_id ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const whereStr = 'WHERE ' + where.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(*) FROM teachers t JOIN users u ON u.id=t.user_id ${whereStr}`,
      params
    );

    const { rows } = await query(
      `SELECT t.*, u.name, u.email,
              (SELECT COUNT(*) FROM issued_books ib WHERE ib.teacher_id=t.id AND ib.is_returned=FALSE) as active_issues
       FROM teachers t JOIN users u ON u.id=t.user_id
       ${whereStr}
       ORDER BY u.name LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );

    return res.json({ success: true, data: rows, meta: paginationMeta(parseInt(countRes.rows[0].count), page, limit) });
  } catch (err) {
    return res.json({ success: true, data: [], meta: { total: 0, page: 1, limit: 15 } });
  }
};

// ── Get teacher profile ────────────────────────────────────────────────────────
exports.getTeacherProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const [profile, currentIssues] = await Promise.all([
      query(
        `SELECT t.*, u.name, u.email, u.is_active, u.created_at
         FROM teachers t JOIN users u ON u.id=t.user_id WHERE t.id=$1`,
        [id]
      ),
      query(
        `SELECT ib.*, b.title, b.author, b.isbn
         FROM issued_books ib JOIN books b ON b.id=ib.book_id
         WHERE ib.teacher_id=$1 AND ib.is_returned=FALSE ORDER BY ib.issue_date DESC`,
        [id]
      ),
    ]);

    if (!profile.rows.length) return res.status(404).json({ success: false, message: 'Teacher not found' });

    return res.json({
      success: true,
      data: { ...profile.rows[0], currentIssues: currentIssues.rows }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  ISSUE / RETURN BOOKS
// ════════════════════════════════════════════════════════════════════════════════

exports.issueBook = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { student_id, book_id, due_days, teacher_id } = req.body;

    let borrowerType = 'student';
    let borrowerId = student_id;

    // Check if issuing to a teacher
    if (teacher_id) {
      borrowerType = 'teacher';
      borrowerId = teacher_id;
      const teacherRes = await client.query('SELECT * FROM teachers WHERE id=$1', [teacher_id]);
      if (!teacherRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Teacher not found' });
      }
    } else if (student_id) {
      // Check student
      const studentRes = await client.query('SELECT * FROM students WHERE id=$1', [student_id]);
      if (!studentRes.rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Student not found' });
      }
      const student = studentRes.rows[0];
      if (student.is_blocked) {
        await client.query('ROLLBACK');
        return res.status(403).json({ success: false, message: 'Student is blocked' });
      }

      // Check max books limit for students
      const maxBooks = parseInt(await getConfigValue('max_books_per_student')) || 3;
      const activeCount = await client.query(
        'SELECT COUNT(*) FROM issued_books WHERE student_id=$1 AND is_returned=FALSE', [student_id]
      );
      if (parseInt(activeCount.rows[0].count) >= maxBooks) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Max ${maxBooks} books allowed at once` });
      }

      // Check cooldown for students
      const cooldown = parseInt(await getConfigValue('cooldown_days')) || 1;
      const recentReturn = await client.query(
        `SELECT id FROM issued_books
         WHERE student_id=$1 AND book_id=$2 AND is_returned=TRUE
           AND return_date > CURRENT_DATE - INTERVAL '${cooldown} day'`,
        [student_id, book_id]
      );
      if (recentReturn.rows.length) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Book cannot be reissued within ${cooldown} day(s) cooldown`
        });
      }
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Student or Teacher ID required' });
    }

    // Check availability
    const bookRes = await client.query('SELECT * FROM books WHERE id=$1 FOR UPDATE', [book_id]);
    if (!bookRes.rows.length) return res.status(404).json({ success: false, message: 'Book not found' });
    if (bookRes.rows[0].available_copies < 1) {
      return res.status(400).json({ success: false, message: 'No copies available' });
    }

    // Teachers have no time limit - set due_date far in the future (10 years)
    let dueDate;
    if (borrowerType === 'teacher') {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 10);
      dueDate = futureDate.toISOString().split('T')[0];
    } else {
      const issueDuration = parseInt(due_days) || parseInt(await getConfigValue('issue_duration_days')) || 7;
      const due = new Date();
      due.setDate(due.getDate() + issueDuration);
      dueDate = due.toISOString().split('T')[0];
    }

    // Build insert query based on borrower type
    let issued;
    if (borrowerType === 'teacher') {
      issued = await client.query(
        `INSERT INTO issued_books (teacher_id, book_id, issued_by, due_date)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [teacher_id, book_id, req.user.id, dueDate]
      );
    } else {
      issued = await client.query(
        `INSERT INTO issued_books (student_id, book_id, issued_by, due_date)
         VALUES ($1,$2,$3,$4) RETURNING *`,
        [student_id, book_id, req.user.id, dueDate]
      );
    }

    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id=$1', [book_id]
    );

    await client.query('COMMIT');
    req.audit('ISSUE_BOOK', 'issued_books', issued.rows[0].id, { borrowerType, borrowerId, book_id });
    return res.status(201).json({ success: true, data: issued.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('issueBook error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
};

exports.returnBook = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { id } = req.params; // issued_book id

    const issueRes = await client.query(
      'SELECT * FROM issued_books WHERE id=$1 AND is_returned=FALSE', [id]
    );
    if (!issueRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Issue record not found or already returned' });
    }
    const issue = issueRes.rows[0];

    // Mark returned
    await client.query(
      `UPDATE issued_books SET is_returned=TRUE, return_date=CURRENT_DATE WHERE id=$1`, [id]
    );

    // Increment available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id=$1', [issue.book_id]
    );

    // Teachers have no fines - only calculate fine for students
    let days = 0;
    let amount = 0;
    if (issue.student_id) {
      const { days: lateDays, amount: fineAmount } = await calcFine(issue.due_date);
      days = lateDays;
      amount = fineAmount;
      if (days > 0) {
        const existingFine = await client.query(
          'SELECT id FROM fines WHERE issued_book_id=$1', [id]
        );
        if (existingFine.rows.length) {
          await client.query(
            'UPDATE fines SET amount=$1, days_late=$2 WHERE issued_book_id=$3',
            [amount, days, id]
          );
        } else {
          await client.query(
            'INSERT INTO fines (student_id, issued_book_id, amount, days_late) VALUES ($1,$2,$3,$4)',
            [issue.student_id, id, amount, days]
          );
        }
      }
    }

    await client.query('COMMIT');
    req.audit('RETURN_BOOK', 'issued_books', id, { days_late: days, fine: amount });
    return res.json({ success: true, data: { daysLate: days, fine: amount } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('returnBook error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

exports.reissueBook = async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: curr } = await query(
      'SELECT * FROM issued_books WHERE id=$1 AND is_returned=FALSE', [id]
    );
    if (!curr.length) return res.status(404).json({ success: false, message: 'Active issue not found' });

    // Teachers don't have due dates - can't reissue
    if (curr[0].teacher_id) {
      return res.status(400).json({ success: false, message: 'Teachers can keep books indefinitely' });
    }

    const issueDuration = parseInt(await getConfigValue('issue_duration_days')) || 7;
    const newDue = new Date();
    newDue.setDate(newDue.getDate() + issueDuration);

    const { rows } = await query(
      `UPDATE issued_books SET due_date=$1, reissue_count=reissue_count+1, last_reissue_at=CURRENT_DATE
       WHERE id=$2 RETURNING *`,
      [newDue.toISOString().split('T')[0], id]
    );
    req.audit('REISSUE_BOOK', 'issued_books', id, { new_due: newDue });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  FINE MANAGEMENT
// ════════════════════════════════════════════════════════════════════════════════

exports.markFinePaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE fines SET status='paid', paid_at=NOW(), paid_by=$1
       WHERE id=$2 AND status='pending' RETURNING *`,
      [req.user.id, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Fine not found or already paid' });
    req.audit('MARK_FINE_PAID', 'fines', id, {});
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllFines = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;
    let where = status ? `WHERE f.status='${status}'` : '';

    const countRes = await query(`SELECT COUNT(*) FROM fines f ${where}`);
    const { rows } = await query(
      `SELECT f.*, u.name as student_name, b.title as book_title
       FROM fines f
       JOIN students s ON s.id=f.student_id
       JOIN users u ON u.id=s.user_id
       JOIN issued_books ib ON ib.id=f.issued_book_id
       JOIN books b ON b.id=ib.book_id
       ${where}
       ORDER BY f.created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.json({
      success: true,
      data: rows,
      meta: paginationMeta(parseInt(countRes.rows[0].count), page, limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Inventory / issued books overview ────────────────────────────────────────
exports.getIssuedBooks = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const countRes = await query(`SELECT COUNT(*) FROM issued_books WHERE is_returned=FALSE`);
    
    // Get students data
    const studentData = await query(
      `SELECT ib.id, ib.issue_date, ib.due_date, ib.reissue_count, b.title, b.isbn, 
              u.name as borrower_name, s.enrollment_no as borrower_id, 'student' as borrower_type,
              CASE WHEN ib.due_date < CURRENT_DATE THEN TRUE ELSE FALSE END as is_overdue
       FROM issued_books ib
       JOIN books b ON b.id=ib.book_id
       JOIN students s ON s.id=ib.student_id
       JOIN users u ON u.id=s.user_id
       WHERE ib.is_returned=FALSE AND ib.student_id IS NOT NULL`,
      []
    );
    
    // Get teachers data if table exists
    let teacherData = { rows: [] };
    try {
      teacherData = await query(
        `SELECT ib.id, ib.issue_date, ib.due_date, ib.reissue_count, b.title, b.isbn, 
                u.name as borrower_name, t.employee_id as borrower_id, 'teacher' as borrower_type,
                FALSE as is_overdue
         FROM issued_books ib
         JOIN books b ON b.id=ib.book_id
         JOIN teachers t ON t.id=ib.teacher_id
         JOIN users u ON u.id=t.user_id
         WHERE ib.is_returned=FALSE AND ib.teacher_id IS NOT NULL`,
        []
      );
    } catch (e) {
      // teachers table doesn't exist yet
    }
    
    const allRows = [...studentData.rows, ...teacherData.rows].sort((a, b) => 
      new Date(a.issue_date) - new Date(b.issue_date)
    );
    
    const paginatedRows = allRows.slice(offset, offset + limit);
    
    return res.json({
      success: true,
      data: paginatedRows,
      meta: paginationMeta(parseInt(countRes.rows[0].count), page, limit),
    });
  } catch (err) {
    console.error('getIssuedBooks error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Librarian dashboard ───────────────────────────────────────────────────────
// ── Get my profile ─────────────────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT l.*, u.name, u.email, u.created_at
       FROM librarians l JOIN users u ON u.id=l.user_id WHERE l.user_id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const [books, issued, overdue, fines] = await Promise.all([
      query('SELECT COUNT(*) as total, SUM(available_copies) as available FROM books'),
      query('SELECT COUNT(*) as total FROM issued_books WHERE is_returned=FALSE'),
      query('SELECT COUNT(*) as total FROM issued_books WHERE is_returned=FALSE AND due_date < CURRENT_DATE'),
      query(`SELECT COALESCE(SUM(amount),0) as total FROM fines WHERE status='pending'`),
    ]);

    return res.json({
      success: true,
      data: {
        totalBooks: parseInt(books.rows[0].total),
        availableBooks: parseInt(books.rows[0].available) || 0,
        issuedBooks: parseInt(issued.rows[0].total),
        overdueBooks: parseInt(overdue.rows[0].total),
        pendingFines: parseFloat(fines.rows[0].total),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
