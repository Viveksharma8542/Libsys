const router = require('express').Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: admin@library.com }
 *               password: { type: string, example: Admin@123 }
 *     responses:
 *       200:
 *         description: Login successful, returns tokens and user
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  ctrl.login
);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh',
  body('refreshToken').notEmpty(),
  validate,
  ctrl.refreshToken
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout and revoke refresh token
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticate, ctrl.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, ctrl.getMe);

/**
 * @openapi
 * /auth/change-password:
 *   put:
 *     tags: [Authentication]
 *     summary: Change password for authenticated user
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:
 *                 type: string
 *                 description: Min 8 chars, must contain uppercase and digit
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 */
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
