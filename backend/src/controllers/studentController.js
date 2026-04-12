const { query } = require('../config/db');
const { getPagination, paginationMeta } = require('../middleware/validate');

// ── Get my profile ─────────────────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, u.name, u.email, u.created_at
       FROM students s JOIN users u ON u.id=s.user_id WHERE s.user_id=$1`,
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Profile not found' });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Search books ───────────────────────────────────────────────────────────────
exports.searchBooks = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { search, category } = req.query;

    let where = [];
    let params = [];
    let idx = 1;

    if (search) {
      where.push(`(title ILIKE $${idx} OR author ILIKE $${idx} OR isbn = $${idx+1})`);
      params.push(`%${search}%`, search); idx += 2;
    }
    if (category) { where.push(`category = $${idx++}`); params.push(category); }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const countRes = await query(`SELECT COUNT(*) FROM books ${whereStr}`, params);
    const { rows } = await query(
      `SELECT id, title, author, isbn, category, publisher, publication_year,
              total_copies, available_copies, shelf_location
       FROM books ${whereStr}
       ORDER BY title LIMIT $${idx} OFFSET $${idx+1}`,
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

// ── View my issued books (current) ────────────────────────────────────────────
exports.getMyIssuedBooks = async (req, res) => {
  try {
    const studentRes = await query('SELECT id FROM students WHERE user_id=$1', [req.user.id]);
    if (!studentRes.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    const studentId = studentRes.rows[0].id;

    const { rows } = await query(
      `SELECT ib.*, b.title, b.author, b.isbn, b.category,
              CASE WHEN ib.due_date < CURRENT_DATE AND NOT ib.is_returned THEN TRUE ELSE FALSE END as is_overdue,
              GREATEST(0, CURRENT_DATE - ib.due_date) as days_overdue
       FROM issued_books ib JOIN books b ON b.id=ib.book_id
       WHERE ib.student_id=$1 AND ib.is_returned=FALSE
       ORDER BY ib.due_date ASC`,
      [studentId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── View my book history ───────────────────────────────────────────────────────
exports.getMyHistory = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const studentRes = await query('SELECT id FROM students WHERE user_id=$1', [req.user.id]);
    if (!studentRes.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    const studentId = studentRes.rows[0].id;

    const countRes = await query('SELECT COUNT(*) FROM issued_books WHERE student_id=$1', [studentId]);
    const { rows } = await query(
      `SELECT ib.*, b.title, b.author, b.isbn
       FROM issued_books ib JOIN books b ON b.id=ib.book_id
       WHERE ib.student_id=$1
       ORDER BY ib.issue_date DESC LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
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

// ── View my fines ──────────────────────────────────────────────────────────────
exports.getMyFines = async (req, res) => {
  try {
    const studentRes = await query('SELECT id FROM students WHERE user_id=$1', [req.user.id]);
    if (!studentRes.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    const studentId = studentRes.rows[0].id;

    const { rows } = await query(
      `SELECT f.*, b.title as book_title, ib.issue_date, ib.due_date, ib.return_date
       FROM fines f
       JOIN issued_books ib ON ib.id=f.issued_book_id
       JOIN books b ON b.id=ib.book_id
       WHERE f.student_id=$1
       ORDER BY f.created_at DESC`,
      [studentId]
    );
    const totalPending = rows.filter(r => r.status === 'pending').reduce((sum, r) => sum + parseFloat(r.amount), 0);
    return res.json({ success: true, data: rows, totalPending });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Request a book ─────────────────────────────────────────────────────────────
exports.requestBook = async (req, res) => {
  try {
    const { book_name, author, isbn, reason } = req.body;
    const studentRes = await query('SELECT id FROM students WHERE user_id=$1', [req.user.id]);
    if (!studentRes.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });

    const { rows } = await query(
      `INSERT INTO book_requests (student_id, book_name, author, isbn, reason) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [studentRes.rows[0].id, book_name, author, isbn, reason]
    );
    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Student dashboard summary ─────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const studentRes = await query('SELECT id, is_blocked FROM students WHERE user_id=$1', [req.user.id]);
    if (!studentRes.rows.length) return res.status(404).json({ success: false, message: 'Student not found' });
    const studentId = studentRes.rows[0].id;

    const [issued, fines, overdue] = await Promise.all([
      query('SELECT COUNT(*) FROM issued_books WHERE student_id=$1 AND is_returned=FALSE', [studentId]),
      query(`SELECT COALESCE(SUM(amount),0) as total FROM fines WHERE student_id=$1 AND status='pending'`, [studentId]),
      query('SELECT COUNT(*) FROM issued_books WHERE student_id=$1 AND is_returned=FALSE AND due_date < CURRENT_DATE', [studentId]),
    ]);

    return res.json({
      success: true,
      data: {
        issuedBooks: parseInt(issued.rows[0].count),
        pendingFine: parseFloat(fines.rows[0].total),
        overdueBooks: parseInt(overdue.rows[0].count),
        isBlocked: studentRes.rows[0].is_blocked,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
