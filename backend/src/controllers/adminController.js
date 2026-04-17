const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { getPagination, paginationMeta } = require('../middleware/validate');

// ── Register new user (librarian or student) ──────────────────────────────────
exports.registerUser = async (req, res) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { name, email, role, password, ...extra } = req.body;

    if (!['librarian', 'student'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be librarian or student' });
    }

    // Check duplicate
    const dup = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (dup.rows.length) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password || 'Password@123', parseInt(process.env.BCRYPT_ROUNDS) || 10);
    const { rows } = await client.query(
      `INSERT INTO users (name, email, password_hash, role, must_change_password)
       VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
      [name, email.toLowerCase(), hash, role]
    );
    const userId = rows[0].id;

    if (role === 'student') {
      const { course, semester, year, mobile, address, enrollment_no } = extra;
      // Convert empty strings to null to avoid UNIQUE '' conflicts
      const enrollment = enrollment_no && enrollment_no.trim() !== '' ? enrollment_no.trim() : null;
      const courseVal = course && course.trim() !== '' ? course.trim() : null;
      const semesterVal = semester && semester.trim() !== '' ? semester.trim() : null;
      const yearVal = year ? (Number.isInteger(Number(year)) ? Number(year) : null) : null;
      const mobileVal = mobile && mobile.trim() !== '' ? mobile.trim() : null;
      const addressVal = address && address.trim() !== '' ? address.trim() : null;

      await client.query(
        `INSERT INTO students (user_id, course, semester, year, mobile, address, enrollment_no)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [userId, courseVal, semesterVal, yearVal, mobileVal, addressVal, enrollment]
      );
    } else {
      const { employee_id, department } = extra;
      const employeeIdVal = employee_id && employee_id.trim() !== '' ? employee_id.trim() : null;
      const departmentVal = department && department.trim() !== '' ? department.trim() : null;
      await client.query(
        `INSERT INTO librarians (user_id, employee_id, department) VALUES ($1,$2,$3)`,
        [userId, employeeIdVal, departmentVal]
      );
    }

    // Audit the registration
    if (req.audit) req.audit('REGISTER_USER', 'users', userId, { name, email, role });

    await client.query('COMMIT');
    return res.status(201).json({ success: true, message: `${role} registered successfully`, data: { id: userId } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// ── Get all users ─────────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { role, search } = req.query;

    let where = ['u.role != $1'];
    let params = ['admin'];
    let idx = 2;

    if (role) { where.push(`u.role = $${idx++}`); params.push(role); }
    if (search) {
      where.push(`(u.name ILIKE $${idx} OR u.email ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const whereStr = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const countRes = await query(`SELECT COUNT(*) FROM users u ${whereStr}`, params);
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await query(
      `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
              s.enrollment_no, s.course, s.is_blocked,
              l.employee_id, l.department
       FROM users u
       LEFT JOIN students s  ON s.user_id = u.id
       LEFT JOIN librarians l ON l.user_id = u.id
       ${whereStr}
       ORDER BY u.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );

    return res.json({
      success: true,
      data: dataRes.rows,
      meta: paginationMeta(total, page, limit),
    });
  } catch (err) {
    console.error('getAllUsers error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Toggle user active status ─────────────────────────────────────────────────
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 AND role != $2 RETURNING id, is_active',
      [id, 'admin']
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'User not found or cannot modify admin' });

    req.audit('TOGGLE_USER_STATUS', 'users', id, { is_active: rows[0].is_active });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('toggleUserStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// ── Bulk upload users ─────────────────────────────────────────────────────────
exports.bulkUploadUsers = async (req, res) => {
  const client = await require('../config/db').getClient();
  try {
    const { users: userRows } = req.body;
    
    if (!Array.isArray(userRows) || userRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No users provided' });
    }

    if (userRows.length > 100) {
      return res.status(400).json({ success: false, message: 'Maximum 100 users allowed per upload' });
    }

    const results = { success: [], failed: [] };
    const defaultPassword = await bcrypt.hash('Password@123', parseInt(process.env.BCRYPT_ROUNDS) || 10);

    await client.query('BEGIN');

    for (const row of userRows) {
      try {
        const { name, email, role, password, course, semester, year, mobile, address, enrollment_no, employee_id, department } = row;

        if (!name || !email || !role) {
          results.failed.push({ email: email || 'N/A', reason: 'Missing required fields (name, email, role)' });
          continue;
        }

        if (!['librarian', 'student'].includes(role.toLowerCase())) {
          results.failed.push({ email, reason: 'Invalid role. Must be student or librarian' });
          continue;
        }

        const normalizedEmail = email.toLowerCase().trim();
        const dup = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
        if (dup.rows.length) {
          results.failed.push({ email, reason: 'Email already exists' });
          continue;
        }

        const hash = password ? await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10) : defaultPassword;
        const normalizedRole = role.toLowerCase();

        const { rows } = await client.query(
          `INSERT INTO users (name, email, password_hash, role, must_change_password)
           VALUES ($1, $2, $3, $4, TRUE) RETURNING id`,
          [name.trim(), normalizedEmail, hash, normalizedRole]
        );
        const userId = rows[0].id;

        if (normalizedRole === 'student') {
          await client.query(
            `INSERT INTO students (user_id, course, semester, year, mobile, address, enrollment_no)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [
              userId,
              course?.trim() || null,
              semester?.trim() || null,
              year ? Number(year) : null,
              mobile?.trim() || null,
              address?.trim() || null,
              enrollment_no?.trim() || null
            ]
          );
        } else {
          await client.query(
            `INSERT INTO librarians (user_id, employee_id, department) VALUES ($1,$2,$3)`,
            [userId, employee_id?.trim() || null, department?.trim() || null]
          );
        }

        if (req.audit) req.audit('REGISTER_USER', 'users', userId, { name, email, role: normalizedRole, bulk: true });
        results.success.push({ name, email, role: normalizedRole });
      } catch (rowErr) {
        results.failed.push({ email: row.email || 'N/A', reason: rowErr.message });
      }
    }

    await client.query('COMMIT');
    return res.json({
      success: true,
      message: `Bulk upload completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      data: results
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk upload error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// ── Modify fine (admin only) ──────────────────────────────────────────────────
exports.modifyFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;

    const { rows } = await query(
      `UPDATE fines SET amount = $1, modified_by = $2, modified_at = NOW(), notes = COALESCE($3, notes)
       WHERE id = $4 RETURNING *`,
      [amount, req.user.id, notes, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Fine not found' });

    req.audit('MODIFY_FINE', 'fines', id, { amount, notes });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Get dashboard analytics ───────────────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  try {
    const [books, issued, fines, users, requests, overdueCount] = await Promise.all([
      query('SELECT COUNT(*) as total, SUM(available_copies) as available FROM books'),
      query(`SELECT COUNT(*) as total FROM issued_books WHERE is_returned = FALSE`),
      query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM fines WHERE status='pending'`),
      query(`SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role`),
      query(`SELECT COUNT(*) as total FROM book_requests WHERE status='pending'`),
      query(`SELECT COUNT(*) as total FROM issued_books WHERE is_returned=FALSE AND due_date < CURRENT_DATE`),
    ]);

    const userMap = {};
    users.rows.forEach(r => { userMap[r.role] = parseInt(r.count); });

    return res.json({
      success: true,
      data: {
        books: {
          total: parseInt(books.rows[0].total),
          available: parseInt(books.rows[0].available) || 0,
        },
        issued:       parseInt(issued.rows[0].total),
        overdue:      parseInt(overdueCount.rows[0].total),
        pendingFines: { total: parseFloat(fines.rows[0].total), count: parseInt(fines.rows[0].count) },
        users:        userMap,
        bookRequests: parseInt(requests.rows[0].total),
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Get book requests (demand list) ──────────────────────────────────────────
exports.getBookRequests = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const countRes = await query(`SELECT COUNT(*) FROM book_requests`);
    const { rows } = await query(
      `SELECT br.*, u.name as student_name, u.email as student_email, s.enrollment_no
       FROM book_requests br
       JOIN students s ON s.id = br.student_id
       JOIN users u ON u.id = s.user_id
       ORDER BY br.created_at DESC LIMIT $1 OFFSET $2`,
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

// ── Accept a book request (admin) ───────────────────────────────────────────
exports.acceptBookRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await query(
      `UPDATE book_requests SET status='approved', admin_notes = COALESCE(admin_notes, $1), updated_at=NOW()
       WHERE id=$2 AND status='pending' RETURNING *`,
      [null, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found or not pending' });
    req.audit('ACCEPT_BOOK_REQUEST', 'book_requests', id, {});
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('acceptBookRequest error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Reject a book request (admin) ───────────────────────────────────────────
exports.rejectBookRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { rows } = await query(
      `UPDATE book_requests SET status='rejected', admin_notes = COALESCE($1, admin_notes), updated_at=NOW()
       WHERE id=$2 AND status='pending' RETURNING *`,
      [reason || null, id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Request not found or not pending' });
    req.audit('REJECT_BOOK_REQUEST', 'book_requests', id, { reason: reason || null });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('rejectBookRequest error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Get system config ─────────────────────────────────────────────────────────
exports.getConfig = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM system_config ORDER BY key');
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { key, value } = req.body;
    const { rows } = await query(
      `INSERT INTO system_config (key, value) VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW() RETURNING *`,
      [key, value]
    );
    req.audit('UPDATE_CONFIG', 'system_config', null, { key, value });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Audit logs ────────────────────────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const countRes = await query('SELECT COUNT(*) FROM audit_logs');
    const { rows } = await query(
      `SELECT al.*, u.name as user_name FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`,
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
