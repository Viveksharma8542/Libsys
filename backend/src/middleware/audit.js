const { query } = require('../config/db');

const getClientIp = (req) => {
  const forwarded = req.headers && (req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For']);
  if (forwarded) return forwarded.split(',')[0].trim();
  return (req.connection && req.connection.remoteAddress) || (req.socket && req.socket.remoteAddress) || req.ip || null;
};

/**
 * Log an action to the audit_logs table
 */
const auditLog = async ({ userId, userRole, action, entity, entityId, details, ip }) => {
  try {
    await query(
      `INSERT INTO audit_logs (user_id, user_role, action, entity, entity_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, userRole, action, entity, entityId, details ? JSON.stringify(details) : null, ip]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

/**
 * Express middleware that attaches auditLog helper to req
 */
const auditMiddleware = (req, res, next) => {
  req.audit = (action, entity, entityId, details) => {
    if (req.user) {
      auditLog({
        userId: req.user.id,
        userRole: req.user.role,
        action,
        entity,
        entityId,
        details,
        ip: getClientIp(req),
      });
    }
  };
  next();
};

module.exports = { auditLog, auditMiddleware };
