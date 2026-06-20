const router = require('express').Router();
const ctrl = require('../controllers/teacherController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');

router.use(authenticate, authorize('teacher'), checkPasswordChange);

/**
 * @openapi
 * /teacher/dashboard:
 *   get:
 *     tags: [Teacher]
 *     summary: Get teacher dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', ctrl.getDashboard);

/**
 * @openapi
 * /teacher/profile:
 *   get:
 *     tags: [Teacher]
 *     summary: Get teacher's own profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Teacher profile
 */
router.get('/profile', ctrl.getMyProfile);

/**
 * @openapi
 * /teacher/books:
 *   get:
 *     tags: [Teacher]
 *     summary: Search available books
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 15 }
 *     responses:
 *       200:
 *         description: Paginated book list
 */
router.get('/books', ctrl.searchBooks);

/**
 * @openapi
 * /teacher/issued:
 *   get:
 *     tags: [Teacher]
 *     summary: Get currently issued books for the teacher
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Issued books list
 */
router.get('/issued', ctrl.getMyIssuedBooks);

/**
 * @openapi
 * /teacher/history:
 *   get:
 *     tags: [Teacher]
 *     summary: Get borrowing history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 15 }
 *     responses:
 *       200:
 *         description: Paginated history
 */
router.get('/history', ctrl.getMyHistory);

module.exports = router;
