const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check } = require('express-validator');
const auth = require('../middleware/auth'); // Добавлен импорт auth middleware

// @route   POST /api/auth/register
// @desc    Регистрация пользователя
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Имя обязательно').not().isEmpty(),
    check('email', 'Пожалуйста, введите корректный email').isEmail(),
    check('password', 'Пароль должен быть не менее 6 символов').isLength({ min: 6 })
  ],
  authController.register
);

// @route   POST /api/auth/login
// @desc    Авторизация пользователя
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Пожалуйста, введите корректный email').isEmail(),
    check('password', 'Пароль обязателен').exists()
  ],
  authController.login
);

// @route   GET /api/auth/user
// @desc    Получение данных пользователя
// @access  Private
router.get('/user', auth, authController.getUser);

module.exports = router;