const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/adminController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { validate } = require('../middleware/validate');

// All routes require admin role
router.use(authenticate, authorize('admin'), checkPasswordChange, auditMiddleware);

/**
 * @openapi
 * /admin/dashboard:
 *   get:
 *     tags: [Admin]
 *     summary: Get admin dashboard statistics
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', ctrl.getDashboard);

/**
 * @openapi
 * /admin/activity-feed:
 *   get:
 *     tags: [Admin]
 *     summary: Get live activity feed
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Activity feed entries
 */
router.get('/activity-feed', ctrl.getActivityFeed);

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users with filters
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: role
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get('/users', ctrl.getAllUsers);

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Register a new user
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [librarian, student, teacher] }
 *               course: { type: string }
 *               semester: { type: string }
 *               enrollment_no: { type: string }
 *               employee_id: { type: string }
 *               department: { type: string }
 *     responses:
 *       201:
 *         description: User registered
 */
router.post('/users',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('role').isIn(['librarian', 'student', 'teacher']),
  ],
  validate,
  ctrl.registerUser
);

/**
 * @openapi
 * /admin/users/bulk:
 *   post:
 *     tags: [Admin]
 *     summary: Bulk upload users via CSV
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Users imported
 */
router.post('/users/bulk', ctrl.bulkUploadUsers);

/**
 * @openapi
 * /admin/users/{id}/status:
 *   patch:
 *     tags: [Admin]
 *     summary: Toggle user active/inactive status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               is_active: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/users/:id/status', ctrl.toggleUserStatus);

/**
 * @openapi
 * /admin/fines/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Modify a fine amount
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number, minimum: 0 }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Fine updated
 */
router.patch('/fines/:id',
  [
    param('id').isUUID(),
    body('amount').isFloat({ min: 0 }),
  ],
  validate,
  ctrl.modifyFine
);

/**
 * @openapi
 * /admin/fines:
 *   get:
 *     tags: [Admin]
 *     summary: Get all fines
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fine list
 */
const librarianCtrl = require('../controllers/librarianController');
router.get('/fines', librarianCtrl.getAllFines);
router.get('/fines/overdue', librarianCtrl.getLiveOverdueFines);

/**
 * @openapi
 * /admin/book-requests:
 *   get:
 *     tags: [Admin]
 *     summary: Get all book requests
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Book request list
 */
router.get('/book-requests', ctrl.getBookRequests);

/**
 * @openapi
 * /admin/book-requests/{id}/accept:
 *   patch:
 *     tags: [Admin]
 *     summary: Accept a book request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request accepted
 */
router.patch('/book-requests/:id/accept',
  [param('id').isUUID()], validate,
  ctrl.acceptBookRequest
);

/**
 * @openapi
 * /admin/book-requests/{id}/reject:
 *   patch:
 *     tags: [Admin]
 *     summary: Reject a book request
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request rejected
 */
router.patch('/book-requests/:id/reject',
  [param('id').isUUID(), body('reason').optional().isString()], validate,
  ctrl.rejectBookRequest
);

/**
 * @openapi
 * /admin/config:
 *   get:
 *     tags: [Admin]
 *     summary: Get system configuration
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Config key-value pairs
 */
router.get('/config', ctrl.getConfig);

/**
 * @openapi
 * /admin/config:
 *   put:
 *     tags: [Admin]
 *     summary: Update a system configuration value
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key:
 *                 type: string
 *                 enum: [cooldown_days, fine_per_day, issue_duration_days, issue_duration_days_teacher, max_books_per_student]
 *               value: { type: string }
 *     responses:
 *       200:
 *         description: Config updated
 */
router.put('/config',
  [body('key').isIn(['cooldown_days','fine_per_day','issue_duration_days','issue_duration_days_teacher','max_books_per_student']),body('value').notEmpty()
      .isInt({ min: 0 }).withMessage('Value must be a non-negative integer')],
  validate,
  ctrl.updateConfig
);

/**
 * @openapi
 * /admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get paginated audit logs
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get('/audit-logs', ctrl.getAuditLogs);

module.exports = router;
