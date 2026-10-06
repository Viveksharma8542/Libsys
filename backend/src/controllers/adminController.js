const bcrypt = require('bcrypt');
const { query } = require('../config/db');
const { getPagination, paginationMeta } = require('../middleware/validate');

// ── Register new user (librarian, student, or teacher) ─────────────────────────
exports.registerUser = async (req, res) => {
  const client = await require('../config/db').getClient();
  try {
    await client.query('BEGIN');
    const { name, email, role, password, ...extra } = req.body;

    if (!['librarian', 'student', 'teacher'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be librarian, student, or teacher' });
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
      const { course, department, semester, year, mobile, address, enrollment_no } = extra;
      const enrollment = enrollment_no && enrollment_no.trim() !== '' ? enrollment_no.trim() : null;
      const courseVal = course && course.trim() !== '' ? course.trim() : null;
      const departmentVal = department && department.trim() !== '' ? department.trim() : null;
      const semesterVal = semester && semester.trim() !== '' ? semester.trim() : null;
      const yearVal = year ? (Number.isInteger(Number(year)) ? Number(year) : null) : null;
      const mobileVal = mobile && mobile.trim() !== '' ? mobile.trim() : null;
      const addressVal = address && address.trim() !== '' ? address.trim() : null;
      if (mobileVal && !/^\d{10}$/.test(mobileVal)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Mobile must be a valid 10-digit number' });
      }

      await client.query(
        `INSERT INTO students (user_id, course, department, semester, year, mobile, address, enrollment_no)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [userId, courseVal, departmentVal, semesterVal, yearVal, mobileVal, addressVal, enrollment]
      );
    } else if (role === 'teacher') {
      const { employee_id, department, designation, mobile, address } = extra;
      const employeeIdVal = employee_id && employee_id.trim() !== '' ? employee_id.trim() : null;
      const departmentVal = department && department.trim() !== '' ? department.trim() : null;
      const designationVal = designation && designation.trim() !== '' ? designation.trim() : null;
      const mobileVal = mobile && mobile.trim() !== '' ? mobile.trim() : null;
      const addressVal = address && address.trim() !== '' ? address.trim() : null;
      if (mobileVal && !/^\d{10}$/.test(mobileVal)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Mobile must be a valid 10-digit number' });
      }

      await client.query(
        `INSERT INTO teachers (user_id, employee_id, department, designation, mobile, address)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [userId, employeeIdVal, departmentVal, designationVal, mobileVal, addressVal]
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

    // Add teacher info if table exists (will fail silently if not)
    const usersWithTeacher = await Promise.all(dataRes.rows.map(async (user) => {
      if (user.role === 'teacher') {
        try {
          const teacherRes = await query(
            'SELECT employee_id, department FROM teachers WHERE user_id = $1',
            [user.id]
          );
          if (teacherRes.rows.length) {
            user.teacher_employee_id = teacherRes.rows[0].employee_id;
            user.teacher_department = teacherRes.rows[0].department;
          }
        } catch (e) {
          // teachers table doesn't exist yet
        }
      }
      return user;
    }));

    return res.json({
      success: true,
      data: usersWithTeacher,
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

        if (!['librarian', 'student', 'teacher'].includes(role.toLowerCase())) {
          results.failed.push({ email, reason: 'Invalid role. Must be student, teacher, or librarian' });
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
          const bulkMobile = mobile?.trim() || null;
          if (bulkMobile && !/^\d{10}$/.test(bulkMobile)) {
            results.failed.push({ email, reason: 'Mobile must be a valid 10-digit number' });
            continue;
          }
          await client.query(
            `INSERT INTO students (user_id, course, department, semester, year, mobile, address, enrollment_no)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [
              userId,
              course?.trim() || null,
              department?.trim() || null,
              semester?.trim() || null,
              year ? Number(year) : null,
              mobile?.trim() || null,
              address?.trim() || null,
              enrollment_no?.trim() || null
            ]
          );
        } else if (normalizedRole === 'teacher') {
          const bulkMobile = mobile?.trim() || null;
          if (bulkMobile && !/^\d{10}$/.test(bulkMobile)) {
            results.failed.push({ email, reason: 'Mobile must be a valid 10-digit number' });
            continue;
          }
          await client.query(
            `INSERT INTO teachers (user_id, employee_id, department, designation, mobile, address)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [
              userId,
              employee_id?.trim() || null,
              department?.trim() || null,
              designation?.trim() || null,
              mobile?.trim() || null,
              address?.trim() || null
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
    const [books, issued, fines, users, overdueCount] = await Promise.all([
      query('SELECT COUNT(*) as total, SUM(available_copies) as available FROM books'),
      query(`SELECT COUNT(*) as total FROM issued_books WHERE is_returned = FALSE`),
      query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM fines WHERE status='pending'`),
      query(`SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role`),
      query(`SELECT COUNT(*) as total FROM issued_books WHERE is_returned=FALSE AND due_date < CURRENT_DATE`),
    ]);

    // Get teacher count separately (may fail if table doesn't exist)
    let teacherCount = 0;
    try {
      const teacherRes = await query(`SELECT COUNT(*) as count FROM teachers`);
      teacherCount = parseInt(teacherRes.rows[0].count);
    } catch (e) {
      // teachers table doesn't exist yet
    }

    const userMap = {};
    users.rows.forEach(r => { userMap[r.role] = parseInt(r.count); });

    // Pending fines = recorded fines only (calculated once, at return time)
    const totalPendingFines = parseFloat(fines.rows[0].total);

    return res.json({
      success: true,
      data: {
        books: {
          total: parseInt(books.rows[0].total),
          available: parseInt(books.rows[0].available) || 0,
        },
        issued:       parseInt(issued.rows[0].total),
        overdue:      parseInt(overdueCount.rows[0].total),
        pendingFines: { total: totalPendingFines, count: parseInt(fines.rows[0].count) + parseInt(overdueCount.rows[0].total) },
        users:        { ...userMap, teacher: teacherCount },
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── Get system config ─────────────────────────────────────────────────────────
// Self-healing: any known key missing from the table is created with its
// default, so Library Settings always shows every setting (no migration
// needed when new settings are added).
const CONFIG_DEFAULTS = {
  cooldown_days: '1',
  fine_per_day: '5',
  issue_duration_days: '7',
  issue_duration_days_teacher: '0',
  max_books_per_student: '3',
  hold_expiry_days: '3',
};

exports.getConfig = async (req, res) => {
  try {
    let { rows } = await query('SELECT * FROM system_config ORDER BY key');
    const missing = Object.keys(CONFIG_RULES).filter(k => !rows.some(r => r.key === k));
    if (missing.length) {
      for (const k of missing) {
        await query(
          `INSERT INTO system_config (key, value) VALUES ($1,$2) ON CONFLICT (key) DO NOTHING`,
          [k, CONFIG_DEFAULTS[k] ?? '0']
        );
      }
      ({ rows } = await query('SELECT * FROM system_config ORDER BY key'));
    }
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Allowed config keys and their validation rules
const CONFIG_RULES = {
  cooldown_days:               { min: 0,  max: 7,    label: 'Reissue Cooldown' },
  fine_per_day:                { min: 1,  max: 10,   label: 'Fine Per Day' },
  issue_duration_days:         { min: 1,  max: 7,    label: 'Student Loan Period' },
  issue_duration_days_teacher: { min: 0,  max: 9999, label: 'Teacher Loan Period' },
  max_books_per_student:       { min: 1,  max: 3,    label: 'Max Books Per Student' },
  hold_expiry_days:            { min: 1,  max: 7,    label: 'Hold Pickup Window' },
};

exports.updateConfig = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!CONFIG_RULES[key]) {
      return res.status(400).json({
        success: false,
        message: `Unknown configuration key: "${key}". Allowed keys: ${Object.keys(CONFIG_RULES).join(', ')}`,
      });
    }

    const rule = CONFIG_RULES[key];
    const parsed = parseInt(value, 10);

    if (isNaN(parsed) || !Number.isInteger(parsed)) {
      return res.status(400).json({ success: false, message: `${rule.label} must be a whole number.` });
    }
    if (parsed < rule.min || parsed > rule.max) {
      const rangeMsg = `between ${rule.min} and ${rule.max}`;
      return res.status(400).json({
        success: false,
        message: `${rule.label} must be ${rangeMsg}. Received: ${parsed}.`,
      });
    }

    const { rows } = await query(
      `INSERT INTO system_config (key, value) VALUES ($1,$2)
       ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW() RETURNING *`,
      [key, String(parsed)]
    );
    req.audit('UPDATE_CONFIG', 'system_config', null, { key, value: parsed });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('updateConfig error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};




// ── Activity Feed ─────────────────────────────────────────────────────────────
exports.getActivityFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const issues = await query(`
      SELECT ib.id, ib.created_at AS time, 'ISSUE_BOOK' AS action,
        b.title AS book_title,
        COALESCE(s.name, t.name) AS borrower_name,
        COALESCE(su.role, 'teacher') AS borrower_role,
        ib.due_date, u.name AS staff_name
      FROM issued_books ib
      JOIN books b ON b.id = ib.book_id
      LEFT JOIN students st ON st.id = ib.student_id
      LEFT JOIN users su ON su.id = st.user_id
      LEFT JOIN users s  ON s.id  = su.id
      LEFT JOIN users t  ON t.id  = ib.teacher_id
      JOIN users u ON u.id = ib.issued_by
      ORDER BY ib.created_at DESC LIMIT $1`, [limit]);

    const returns = await query(`
      SELECT ib.id, ib.updated_at AS time, 'RETURN_BOOK' AS action,
        b.title AS book_title,
        COALESCE(s.name, t.name) AS borrower_name,
        COALESCE(su.role, 'teacher') AS borrower_role,
        ib.return_date
      FROM issued_books ib
      JOIN books b ON b.id = ib.book_id
      LEFT JOIN students st ON st.id = ib.student_id
      LEFT JOIN users su ON su.id = st.user_id
      LEFT JOIN users s  ON s.id  = su.id
      LEFT JOIN users t  ON t.id  = ib.teacher_id
      WHERE ib.is_returned = TRUE
      ORDER BY ib.updated_at DESC LIMIT $1`, [limit]);

    const fines = await query(`
      SELECT f.id, f.paid_at AS time, 'FINE_PAID' AS action,
        b.title AS book_title,
        u.name AS borrower_name, 'student' AS borrower_role,
        f.amount, f.days_late, p.name AS staff_name
      FROM fines f
      JOIN issued_books ib ON ib.id = f.issued_book_id
      JOIN books b ON b.id = ib.book_id
      JOIN students st ON st.id = f.student_id
      JOIN users u ON u.id = st.user_id
      LEFT JOIN users p ON p.id = f.paid_by
      WHERE f.status = 'paid' AND f.paid_at IS NOT NULL
      ORDER BY f.paid_at DESC LIMIT $1`, [limit]);

    const overdue = await query(`
      SELECT ib.id, ib.due_date::timestamptz AS time, 'OVERDUE' AS action,
        b.title AS book_title,
        COALESCE(u.name, t.name) AS borrower_name,
        COALESCE(su.role, 'teacher') AS borrower_role,
        (CURRENT_DATE - ib.due_date) AS days_overdue
      FROM issued_books ib
      JOIN books b ON b.id = ib.book_id
      LEFT JOIN students st ON st.id = ib.student_id
      LEFT JOIN users su ON su.id = st.user_id
      LEFT JOIN users u  ON u.id  = su.id
      LEFT JOIN users t  ON t.id  = ib.teacher_id
      WHERE ib.is_returned = FALSE AND ib.due_date < CURRENT_DATE
      ORDER BY ib.due_date ASC LIMIT $1`, [limit]);

    const all = [
      ...issues.rows.map(r => ({ ...r, action: 'ISSUE_BOOK' })),
      ...returns.rows.map(r => ({ ...r, action: 'RETURN_BOOK' })),
      ...fines.rows.map(r => ({ ...r, action: 'FINE_PAID' })),
      ...overdue.rows.map(r => ({ ...r, action: 'OVERDUE' })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);

    return res.json({ success: true, data: all });
  } catch (err) {
    console.error('getActivityFeed error:', err);
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
