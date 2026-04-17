const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/db');
const { auditLog } = require('../middleware/audit');

// ── helpers ──────────────────────────────────────────────────────────────────
const signAccess = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefresh = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

// ── login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query(
      'SELECT id, name, email, role, password_hash, is_active, must_change_password FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is disabled. Contact admin.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken  = signAccess(user.id, user.role);
    const refreshToken = signRefresh(user.id);

    // Store refresh token in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Audit (include optional reason from client)
    const getClientIp = (r) => {
      const forwarded = r.headers && (r.headers['x-forwarded-for'] || r.headers['X-Forwarded-For']);
      if (forwarded) return forwarded.split(',')[0].trim();
      return (r.connection && r.connection.remoteAddress) || (r.socket && r.socket.remoteAddress) || r.ip || null;
    };
    await auditLog({
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN',
      entity: 'users',
      entityId: user.id,
      details: { reason: req.body.reason || 'web' },
      ip: getClientIp(req),
    });

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id:   user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          mustChangePassword: user.must_change_password,
        },
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── refresh token ─────────────────────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    // Check DB
    const { rows } = await query(
      `SELECT rt.id, rt.user_id, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
      [refreshToken]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Token revoked or user inactive' });
    }

    const { user_id, role } = rows[0];
    const newAccessToken    = signAccess(user_id, role);
    const newRefreshToken   = signRefresh(user_id);

    // Rotate refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [refreshToken]);
    await query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user_id, newRefreshToken, expiresAt]
    );

    return res.json({ success: true, data: { accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── logout ────────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1', [refreshToken]);
    }
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── change password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    const match = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const hash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
    await query(
      'UPDATE users SET password_hash = $1, must_change_password = FALSE WHERE id = $2',
      [hash, userId]
    );

    await auditLog({
      userId,
      userRole: req.user.role,
      action: 'CHANGE_PASSWORD',
      entity: 'users',
      entityId: userId,
      details: null,
      ip: (req.connection && req.connection.remoteAddress) || req.ip,
    });

    return res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── get current user profile ─────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.user;

    let extra = {};
    if (role === 'student') {
      const { rows } = await query(
        `SELECT s.*, u.name, u.email FROM students s JOIN users u ON u.id = s.user_id WHERE s.user_id = $1`,
        [userId]
      );
      extra = rows[0] || {};
    } else if (role === 'librarian') {
      const { rows } = await query(
        `SELECT l.*, u.name, u.email FROM librarians l JOIN users u ON u.id = l.user_id WHERE l.user_id = $1`,
        [userId]
      );
      extra = rows[0] || {};
    } else if (role === 'teacher') {
      const { rows } = await query(
        `SELECT t.*, u.name, u.email FROM teachers t JOIN users u ON u.id = t.user_id WHERE t.user_id = $1`,
        [userId]
      );
      extra = rows[0] || {};
    }

    return res.json({
      success: true,
      data: {
        id:   req.user.id,
        name: req.user.name,
        email: req.user.email,
        role,
        ...extra,
      },
    });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
