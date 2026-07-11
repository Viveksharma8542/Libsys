const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/studentController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('student'), checkPasswordChange);

/**
 * @openapi
 * /student/dashboard:
 *   get:
 *     tags: [Student]
 *     summary: Get student dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard stats (issued, overdue, fines, block status)
 */
router.get('/dashboard', ctrl.getDashboard);

/**
 * @openapi
 * /student/profile:
 *   get:
 *     tags: [Student]
 *     summary: Get student's own profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Student profile
 */
router.get('/profile', ctrl.getMyProfile);

/**
 * @openapi
 * /student/books:
 *   get:
 *     tags: [Student]
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
 * /student/issued:
 *   get:
 *     tags: [Student]
 *     summary: Get currently issued books for the student
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Issued books list
 */
router.get('/issued', ctrl.getMyIssuedBooks);

/**
 * @openapi
 * /student/history:
 *   get:
 *     tags: [Student]
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

/**
 * @openapi
 * /student/fines:
 *   get:
 *     tags: [Student]
 *     summary: Get student's fines
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Fine list with total pending
 */
router.get('/fines', ctrl.getMyFines);

/**
 * @openapi
 * /student/request-book:
 *   post:
 *     tags: [Student]
 *     summary: Submit a book purchase request
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [book_name, author, isbn, reason]
 *             properties:
 *               book_name: { type: string }
 *               author: { type: string }
 *               isbn: { type: string }
 *               reason: { type: string }
 *     responses:
 *       201:
 *         description: Request submitted
 */
router.post('/request-book',
  [
    body('book_name').trim().notEmpty().withMessage('Book name is required'),
    body('author').trim().notEmpty().withMessage('Author is required'),
    body('isbn').trim().notEmpty().withMessage('ISBN is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
  ],
  validate,
  ctrl.requestBook
);

module.exports = router;
