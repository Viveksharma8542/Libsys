const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/studentController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authenticate, authorize('student'), checkPasswordChange);

// GET  /api/student/dashboard
router.get('/dashboard',  ctrl.getDashboard);

// GET  /api/student/profile
router.get('/profile',    ctrl.getMyProfile);

// GET  /api/student/books?search=&category=
router.get('/books',      ctrl.searchBooks);

// GET  /api/student/issued
router.get('/issued',     ctrl.getMyIssuedBooks);

// GET  /api/student/history
router.get('/history',    ctrl.getMyHistory);

// GET  /api/student/fines
router.get('/fines',      ctrl.getMyFines);

// POST /api/student/request-book
router.post('/request-book',
  [body('book_name').trim().notEmpty()],
  validate,
  ctrl.requestBook
);

module.exports = router;
