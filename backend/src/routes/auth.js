const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// POST /api/auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

// POST /api/auth/refresh
router.post('/refresh',
  body('refreshToken').notEmpty(),
  validate,
  ctrl.refreshToken
);

// POST /api/auth/logout
router.post('/logout', authenticate, ctrl.logout);

// GET /api/auth/me
router.get('/me', authenticate, ctrl.getMe);

// PUT /api/auth/change-password
router.put('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword')
      .isLength({ min: 8 })
      .matches(/^(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be 8+ chars with uppercase and number'),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
