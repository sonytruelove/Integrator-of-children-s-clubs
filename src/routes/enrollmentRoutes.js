const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

// @route   POST /api/enrollments
// @desc    Записать ребенка в кружок
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('childId', 'ID ребенка обязателен').not().isEmpty(),
      check('clubId', 'ID кружка обязателен').not().isEmpty(),
      check('schedule.day', 'День обязателен').not().isEmpty(),
      check('schedule.time', 'Время обязательно').not().isEmpty()
    ]
  ],
  enrollmentController.enrollChild
);

// @route   GET /api/enrollments
// @desc    Получить все записи пользователя
// @access  Private
router.get('/', auth, enrollmentController.getEnrollments);

// @route   GET /api/enrollments/:id
// @desc    Получить запись по ID
// @access  Private
router.get('/:id', auth, enrollmentController.getEnrollmentById);

// @route   PUT /api/enrollments/:id/cancel
// @desc    Отменить запись
// @access  Private
router.put('/:id/cancel', auth, enrollmentController.cancelEnrollment);
router.put('/:id/confirm', auth, enrollmentController.confirmEnrollment);
module.exports = router;