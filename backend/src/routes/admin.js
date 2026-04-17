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
    body('role').isIn(['librarian', 'student', 'teacher']),
  ],
  validate,
  ctrl.registerUser
);

// POST /api/admin/users/bulk
router.post('/users/bulk', ctrl.bulkUploadUsers);

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status',
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

// PATCH /api/admin/book-requests/:id/accept
router.patch('/book-requests/:id/accept',
  [param('id').isUUID()], validate,
  ctrl.acceptBookRequest
);

// PATCH /api/admin/book-requests/:id/reject
router.patch('/book-requests/:id/reject',
  [param('id').isUUID(), body('reason').optional().isString()], validate,
  ctrl.rejectBookRequest
);

// GET /api/admin/fines (admin view of fines)
const librarianCtrl = require('../controllers/librarianController');
router.get('/fines', librarianCtrl.getAllFines);

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
