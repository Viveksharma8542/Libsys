const router = require('express').Router();
const ctrl = require('../controllers/teacherController');
const { authenticate, authorize, checkPasswordChange } = require('../middleware/auth');

router.use(authenticate, authorize('teacher'), checkPasswordChange);

// GET  /api/teacher/dashboard
router.get('/dashboard',  ctrl.getDashboard);

// GET  /api/teacher/profile
router.get('/profile',    ctrl.getMyProfile);

// GET  /api/teacher/books?search=&category=
router.get('/books',      ctrl.searchBooks);

// GET  /api/teacher/issued
router.get('/issued',     ctrl.getMyIssuedBooks);

// GET  /api/teacher/history
router.get('/history',    ctrl.getMyHistory);

module.exports = router;
