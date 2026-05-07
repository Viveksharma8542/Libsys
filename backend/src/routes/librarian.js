const router = require('express').Router();
const { body, param } = require('express-validator');
const ctrl = require('../controllers/librarianController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');
const { auditMiddleware } = require('../middleware/audit');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('librarian', 'admin'), checkPasswordChange, auditMiddleware);

// ── Profile ─────────────────────────────────────────────────────────────────
router.get('/profile', ctrl.getMyProfile);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getDashboard);

// ── Books ─────────────────────────────────────────────────────────────────────
router.get('/books',         ctrl.getBooks);
// Accept 8-4-4-4-12 hex IDs (not enforcing UUID version) to support seeded IDs
const hexId = param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/);
router.get('/books/:id', hexId, validate, ctrl.getBookById);

router.post('/books',
  [
    body('title').trim().notEmpty(),
    body('author').trim().notEmpty(),
    body('isbn').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('publisher').trim().notEmpty(),
    body('publication_year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }),
    body('total_copies').isInt({ min: 1 }),
    body('shelf_location').trim().notEmpty(),
  ],
  validate, ctrl.addBook
);

router.put('/books/:id',
  [
    // allow hex-formatted IDs even if they are not RFC-versioned UUIDs
    param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
    body('title').trim().notEmpty(),
    body('author').trim().notEmpty(),
    body('total_copies').isInt({ min: 1 }),
  ],
  validate, ctrl.updateBook
);

router.delete('/books/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.deleteBook);

// ── Students ──────────────────────────────────────────────────────────────────
router.get('/students',         ctrl.getStudents);
router.get('/students/:id', param('id').isUUID(), validate, ctrl.getStudentProfile);

router.patch('/students/:id/block',
  [
    param('id').isUUID(),
    body('block').isBoolean(),
  ],
  validate, ctrl.blockStudent
);

// ── Teachers ──────────────────────────────────────────────────────────────────
router.get('/teachers', ctrl.getTeachers);
router.get('/teachers/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.getTeacherProfile);

// ── Issue / Return ─────────────────────────────────────────────────────────────
router.post('/issue',
  [
    body('book_id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
  ],
  validate, ctrl.issueBook
);

router.post('/return/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.returnBook);
router.post('/reissue/:id', param('id').matches(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/), validate, ctrl.reissueBook);

// ── Issued books list ─────────────────────────────────────────────────────────
router.get('/issued', ctrl.getIssuedBooks);

// ── Fines ─────────────────────────────────────────────────────────────────────
router.get('/fines',                                 ctrl.getAllFines);
router.post('/fines/:id/paid', param('id').isUUID(), validate, ctrl.markFinePaid);

module.exports = router;
