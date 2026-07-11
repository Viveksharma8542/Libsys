const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/librarianController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('librarian', 'admin'), checkPasswordChange, auditMiddleware);

/**
 * @openapi
 * /librarian/profile:
 *   get:
 *     tags: [Librarian]
 *     summary: Get librarian's own profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Profile data
 */
router.get('/profile', ctrl.getMyProfile);

/**
 * @openapi
 * /librarian/dashboard:
 *   get:
 *     tags: [Librarian]
 *     summary: Get librarian dashboard stats
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Dashboard stats
 */
router.get('/dashboard', ctrl.getDashboard);

/**
 * @openapi
 * /librarian/books:
 *   get:
 *     tags: [Librarian]
 *     summary: List/search books
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
router.get('/books', ctrl.getBooks);
const hexId = param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
router.get('/books/:id', hexId, validate, ctrl.getBookById);
router.get('/books/:id/copies', hexId, validate, ctrl.getBookCopies);

/**
 * @openapi
 * /librarian/books:
 *   post:
 *     tags: [Librarian]
 *     summary: Add a new book
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, author, isbn, book_code, category, publisher, publication_year, total_copies, shelf_location]
 *             properties:
 *               title: { type: string }
 *               author: { type: string }
 *               isbn: { type: string }
 *               book_code: { type: string }
 *               category: { type: string }
 *               publisher: { type: string }
 *               publication_year: { type: integer }
 *               total_copies: { type: integer, minimum: 1 }
 *               shelf_location: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Book created
 */
router.post('/books',
  [
    body('title').trim().notEmpty(),
    body('author').trim().notEmpty(),
    body('isbn').trim().notEmpty(),
    body('book_code').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('publisher').trim().notEmpty(),
    body('publication_year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
    body('total_copies').isInt({ min: 1 }),
    body('shelf_location').trim().notEmpty(),
  ],
  validate, ctrl.addBook
);

/**
 * @openapi
 * /librarian/books/{id}:
 *   put:
 *     tags: [Librarian]
 *     summary: Update a book
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Book updated
 */
router.put('/books/:id',
  [
    param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
    body('title').trim().notEmpty(),
    body('author').trim().notEmpty(),
    body('book_code').trim().notEmpty(),
    body('total_copies').isInt({ min: 1 }),
  ],
  validate, ctrl.updateBook
);

/**
 * @openapi
 * /librarian/books/{id}:
 *   delete:
 *     tags: [Librarian]
 *     summary: Delete a book (if no active issues)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Book deleted
 */
router.delete('/books/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.deleteBook);

/**
 * @openapi
 * /librarian/students:
 *   get:
 *     tags: [Librarian]
 *     summary: List students
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Student list
 */
router.get('/students', ctrl.getStudents);
router.get('/students/:id', param('id').isUUID(), validate, ctrl.getStudentProfile);

/**
 * @openapi
 * /librarian/students/{id}/block:
 *   patch:
 *     tags: [Librarian]
 *     summary: Block or unblock a student
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
 *             required: [block]
 *             properties:
 *               block: { type: boolean }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Student block status updated
 */
router.patch('/students/:id/block',
  [
    param('id').isUUID(),
    body('block').isBoolean(),
  ],
  validate, ctrl.blockStudent
);

/**
 * @openapi
 * /librarian/teachers:
 *   get:
 *     tags: [Librarian]
 *     summary: List teachers
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Teacher list
 */
router.get('/teachers', ctrl.getTeachers);
router.get('/teachers/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.getTeacherProfile);

/**
 * @openapi
 * /librarian/issue:
 *   post:
 *     tags: [Librarian]
 *     summary: Issue a book to student or teacher
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [book_id]
 *             properties:
 *               book_id: { type: string, format: uuid }
 *               student_id: { type: string, format: uuid }
 *               teacher_id: { type: string, format: uuid }
 *               due_days: { type: integer }
 *     responses:
 *       200:
 *         description: Book issued
 */
router.post('/issue',
  [
    body('book_id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
    body('copy_id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
  ],
  validate, ctrl.issueBook
);

/**
 * @openapi
 * /librarian/return/{id}:
 *   post:
 *     tags: [Librarian]
 *     summary: Return a book (auto-calculates fine)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Book returned
 */
router.post('/return/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.returnBook);
router.post('/reissue/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.reissueBook);

/**
 * @openapi
 * /librarian/issued:
 *   get:
 *     tags: [Librarian]
 *     summary: Get all currently issued books
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Issued books list
 */
router.get('/issued', ctrl.getIssuedBooks);

/**
 * @openapi
 * /librarian/fines:
 *   get:
 *     tags: [Librarian]
 *     summary: Get all fines
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Fine list
 */
router.get('/fines', ctrl.getAllFines);
router.get('/fines/overdue', ctrl.getLiveOverdueFines);
router.post('/fines/:id/paid', param('id').isUUID(), validate, ctrl.markFinePaid);

module.exports = router;
