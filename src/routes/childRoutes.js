const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');

// @route   POST /api/children
// @desc    Добавить ребенка
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Имя ребенка обязательно').not().isEmpty(),
      check('age', 'Возраст обязателен').isInt({ min: 0, max: 18 })
    ]
  ],
  childController.addChild
);

// @route   GET /api/children
// @desc    Получить всех детей пользователя
// @access  Private
router.get('/', auth, childController.getChildren);

// @route   GET /api/children/:id
// @desc    Получить ребенка по ID
// @access  Private
router.get('/:id', auth, childController.getChildById);

// @route   PUT /api/children/:id
// @desc    Обновить данные ребенка
// @access  Private
router.put(
  '/:id',
  [
    auth,
    [
      check('name', 'Имя ребенка обязательно').optional().not().isEmpty(),
      check('age', 'Возраст обязателен').optional().isInt({ min: 0, max: 18 })
    ]
  ],
  childController.updateChild
);

// @route   DELETE /api/children/:id
// @desc    Удалить ребенка
// @access  Private
router.delete('/:id', auth, childController.deleteChild);

module.exports = router;