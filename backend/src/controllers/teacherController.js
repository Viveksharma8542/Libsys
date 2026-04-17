const { query } = require('../config/db');
const { getPagination, paginationMeta } = require('../middleware/validate');

// ── Get my profile ─────────────────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*, u.name, u.email, u.created_at
       FROM teachers t JOIN users u ON u.id=t.user_id WHERE t.user_id=$1`,
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
    const teacherRes = await query('SELECT id FROM teachers WHERE user_id=$1', [req.user.id]);
    if (!teacherRes.rows.length) return res.status(404).json({ success: false, message: 'Teacher not found' });
    const teacherId = teacherRes.rows[0].id;

    const { rows } = await query(
      `SELECT ib.*, b.title, b.author, b.isbn, b.category
       FROM issued_books ib JOIN books b ON b.id=ib.book_id
       WHERE ib.teacher_id=$1 AND ib.is_returned=FALSE
       ORDER BY ib.issue_date DESC`,
      [teacherId]
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
    const teacherRes = await query('SELECT id FROM teachers WHERE user_id=$1', [req.user.id]);
    if (!teacherRes.rows.length) return res.status(404).json({ success: false, message: 'Teacher not found' });
    const teacherId = teacherRes.rows[0].id;

    const countRes = await query('SELECT COUNT(*) FROM issued_books WHERE teacher_id=$1', [teacherId]);
    const { rows } = await query(
      `SELECT ib.*, b.title, b.author, b.isbn
       FROM issued_books ib JOIN books b ON b.id=ib.book_id
       WHERE ib.teacher_id=$1
       ORDER BY ib.issue_date DESC LIMIT $2 OFFSET $3`,
      [teacherId, limit, offset]
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

// ── Teacher dashboard summary ─────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const teacherRes = await query('SELECT id FROM teachers WHERE user_id=$1', [req.user.id]);
    if (!teacherRes.rows.length) return res.status(404).json({ success: false, message: 'Teacher not found' });
    const teacherId = teacherRes.rows[0].id;

    const [issued] = await Promise.all([
      query('SELECT COUNT(*) FROM issued_books WHERE teacher_id=$1 AND is_returned=FALSE', [teacherId]),
    ]);

    return res.json({
      success: true,
      data: {
        issuedBooks: parseInt(issued.rows[0].count),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
