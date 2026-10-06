const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt    = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { OAuth2Client } = require('google-auth-library');
const { query } = require('../config/db');
const { auditLog } = require('../middleware/audit');
const { sendMail, otpEmail, passwordChangedEmail } = require('../utils/mailer');

// ── helpers ──────────────────────────────────────────────────────────────────
const signAccess = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

const signRefresh = (userId) =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

// Create access + refresh tokens and persist the refresh token
const createSession = async (user) => {
  const accessToken  = signAccess(user.id, user.role);
  const refreshToken = signRefresh(user.id);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.id, refreshToken, expiresAt]
  );
  return { accessToken, refreshToken };
};

const publicUser = (user) => ({
  id:   user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  mustChangePassword: user.must_change_password,
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
    const { accessToken, refreshToken } = await createSession(user);

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
        user: publicUser(user),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── login with Google (matches an existing library account by email) ────────
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ success: false, message: 'Google token missing' });
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ success: false, message: 'Google login is not configured on the server' });
    }

    let payload;
    try {
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ success: false, message: 'Google sign-in failed. Please try again.' });
    }
    if (!payload.email_verified) {
      return res.status(401).json({ success: false, message: 'Your Google email is not verified.' });
    }

    const { rows } = await query(
      'SELECT id, name, email, role, is_active, must_change_password FROM users WHERE email = $1',
      [payload.email.toLowerCase().trim()]
    );
    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'No library account found for this Google account. Please contact the librarian.',
      });
    }
    const user = rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is disabled. Contact admin.' });
    }

    const { accessToken, refreshToken } = await createSession(user);
    await auditLog({
      userId: user.id, userRole: user.role, action: 'LOGIN',
      entity: 'users', entityId: user.id, details: { reason: 'google' }, ip: req.ip || null,
    });
    return res.json({ success: true, data: { accessToken, refreshToken, user: publicUser(user) } });
  } catch (err) {
    console.error('Google login error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── email diagnostics: which channel (if any) can the server use? (safe)
exports.emailStatus = async (req, res) => {
  const brevo = !!process.env.BREVO_API_KEY;
  const smtp = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  return res.json({
    success: true,
    data: { configured: brevo || smtp, via: brevo ? 'brevo' : (smtp ? 'smtp' : 'none') },
  });
};

// ── forgot password: email a 6-digit OTP (valid 10 minutes) ──────────────────
const OTP_TTL_MIN = 10;
const OTP_MAX_ATTEMPTS = 5;

exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const { rows } = await query('SELECT id, name, email, is_active FROM users WHERE email = $1', [email]);
    if (!rows.length || !rows[0].is_active) {
      return res.status(404).json({ success: false, message: 'No library account found with this email.' });
    }
    const user = rows[0];

    // Invalidate any previous live OTPs for this email
    await query(
      `UPDATE otp_codes SET consumed = TRUE WHERE email = $1 AND purpose = 'password_reset' AND consumed = FALSE`,
      [email]
    );

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
    await query(`INSERT INTO otp_codes (email, otp_hash, expires_at) VALUES ($1, $2, $3)`,
      [email, otpHash, expiresAt]);

    const { subject, html } = otpEmail(user.name, otp);
    const result = await sendMail(email, subject, html, user.name);
    if (!result.sent) {
      const notConfigured = result.reason === 'smtp_not_configured';
      return res.status(500).json({
        success: false,
        message: notConfigured
          ? 'Email service is not set up on the server yet. Please contact the librarian.'
          : 'Could not send the OTP email. Please try again later.',
      });
    }
    await auditLog({
      userId: user.id, userRole: null, action: 'FORGOT_PASSWORD',
      entity: 'users', entityId: user.id, details: {}, ip: req.ip || null,
    });
    return res.json({ success: true, message: `A 6-digit code was sent to ${email}. It expires in ${OTP_TTL_MIN} minutes.` });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── verify OTP → returns a short-lived reset token ──────────────────────────
exports.verifyOtp = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const otp = String(req.body.otp || '').trim();
    const { rows } = await query(
      `SELECT * FROM otp_codes WHERE email = $1 AND purpose = 'password_reset' AND consumed = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'No active code found. Please request a new one.' });
    }
    const record = rows[0];
    if (parseInt(record.attempts) >= OTP_MAX_ATTEMPTS) {
      return res.status(400).json({ success: false, message: 'Too many wrong attempts. Please request a new code.' });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Code expired. Please request a new one.' });
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== record.otp_hash) {
      const left = OTP_MAX_ATTEMPTS - (parseInt(record.attempts) + 1);
      await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [record.id]);
      return res.status(400).json({
        success: false,
        message: left > 0 ? `Incorrect code. ${left} attempt${left !== 1 ? 's' : ''} left.` : 'Incorrect code. Please request a new one.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await query(
      `UPDATE otp_codes SET verified_at = NOW(), reset_token = $1, reset_expires_at = $2 WHERE id = $3`,
      [resetToken, resetExpiresAt, record.id]
    );
    return res.json({ success: true, data: { resetToken } });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── reset password with a verified reset token ──────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase().trim();
    const { resetToken, newPassword } = req.body;
    const { rows } = await query(
      `SELECT * FROM otp_codes WHERE email = $1 AND purpose = 'password_reset'
       AND consumed = FALSE AND reset_token = $2 AND reset_expires_at > NOW()`,
      [email, resetToken]
    );
    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Reset session expired. Please start again.' });
    }
    const record = rows[0];

    const userRes = await query('SELECT id, name, email FROM users WHERE email = $1', [email]);
    if (!userRes.rows.length) {
      return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    const user = userRes.rows[0];

    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(newPassword, rounds);
    await query(
      `UPDATE users SET password_hash = $1, must_change_password = FALSE, updated_at = NOW() WHERE id = $2`,
      [passwordHash, user.id]
    );
    await query(`UPDATE otp_codes SET consumed = TRUE WHERE id = $1`, [record.id]);
    // Force re-login everywhere: revoke all sessions
    await query(`DELETE FROM refresh_tokens WHERE user_id = $1`, [user.id]);

    // Confirmation email (best effort — password is already changed)
    try {
      const { subject, html } = passwordChangedEmail(user.name);
      await sendMail(user.email, subject, html, user.name);
    } catch (e) { console.error('Password-changed email failed:', e.message); }

    await auditLog({
      userId: user.id, userRole: null, action: 'RESET_PASSWORD',
      entity: 'users', entityId: user.id, details: {}, ip: req.ip || null,
    });
    return res.json({ success: true, message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
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
