const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

/**
 * Verify JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user from DB to ensure still active
    const { rows } = await query(
      'SELECT id, name, email, role, is_active, must_change_password FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!rows.length || !rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/**
 * Role-based access control middleware factory
 * @param  {...string} roles - allowed roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`
    });
  }
  next();
};

/**
 * Check if user must change password
 */
const checkPasswordChange = (req, res, next) => {
  if (req.user.must_change_password && req.path !== '/change-password') {
    return res.status(403).json({
      success: false,
      message: 'You must change your password before proceeding',
      code: 'MUST_CHANGE_PASSWORD'
    });
  }
  next();
};

module.exports = { authenticate, authorize, checkPasswordChange };
