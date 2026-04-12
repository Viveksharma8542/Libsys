const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/adminController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { validate } = require('../middleware/validate');

// All routes require admin role
router.use(authenticate, authorize('admin'), checkPasswordChange, auditMiddleware);

// GET  /api/admin/dashboard
router.get('/dashboard', ctrl.getDashboard);

// ── Users ───────────────────────────────────────────────────────────────────
// GET  /api/admin/users
router.get('/users', ctrl.getAllUsers);

// POST /api/admin/users
router.post('/users',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['librarian', 'student']),
  ],
  validate,
  ctrl.registerUser
);

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status',
  param('id').isUUID(), validate,
  ctrl.toggleUserStatus
);

// ── Fines ───────────────────────────────────────────────────────────────────
// PATCH /api/admin/fines/:id
router.patch('/fines/:id',
  [
    param('id').isUUID(),
    body('amount').isFloat({ min: 0 }),
  ],
  validate,
  ctrl.modifyFine
);

// ── Book requests ────────────────────────────────────────────────────────────
// GET /api/admin/book-requests
router.get('/book-requests', ctrl.getBookRequests);

// ── System config ────────────────────────────────────────────────────────────
// GET  /api/admin/config
router.get('/config', ctrl.getConfig);

// PUT  /api/admin/config
router.put('/config',
  [body('key').notEmpty(), body('value').notEmpty()],
  validate,
  ctrl.updateConfig
);

// ── Audit logs ────────────────────────────────────────────────────────────────
// GET /api/admin/audit-logs
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
