const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const auth = require('../middleware/auth');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/clubs/');
  },
  filename: function(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: function(req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb('Error: Images only (jpeg, jpg, png)!');
    }
  }
});




router.get('/', clubController.getAllClubs);




router.get('/search', clubController.searchClubs);




router.get('/autocomplete', clubController.autocompleteClubs);




router.get('/recommendations/:childId', auth, clubController.getRecommendations);




router.get('/:id', clubController.getClubById);




router.get('/:id/schedule', clubController.getSchedule);




router.get('/:id/stats', auth, clubController.getClubStats);




router.post(
  '/',
  [
    auth,
    upload.array('images', 3),
    [
      check('name', 'Название кружка обязательно').not().isEmpty(),
      check('description', 'Описание должно быть не менее 10 символов').isLength({ min: 10 }),
      check('category', 'Категория обязательна').not().isEmpty(),
      check('address', 'Адрес обязателен').not().isEmpty(),
      check('ageRange.min', 'Минимальный возраст обязателен').isInt({ min: 0 }),
      check('ageRange.max', 'Максимальный возраст обязателен').isInt({ min: 0 }),
      check('price', 'Цена должна быть числом').isFloat({ min: 0 })
    ]
  ],
  clubController.createClub
);




router.put(
  '/:id',
  [
    auth,
    upload.array('images', 3),
    [
      check('name', 'Название кружка обязательно').optional().not().isEmpty(),
      check('description', 'Описание должно быть не менее 10 символов').optional().isLength({ min: 10 }),
      check('category', 'Категория обязательна').optional().not().isEmpty(),
      check('address', 'Адрес обязателен').optional().not().isEmpty(),
      check('ageRange.min', 'Минимальный возраст обязателен').optional().isInt({ min: 0 }),
      check('ageRange.max', 'Максимальный возраст обязателен').optional().isInt({ min: 0 }),
      check('price', 'Цена должна быть числом').optional().isFloat({ min: 0 })
    ]
  ],
  clubController.updateClub
);




router.delete('/:id', auth, clubController.deleteClub);




router.post(
  '/:id/reviews',
  [
    auth,
    [
      check('rating', 'Рейтинг от 1 до 5 обязателен').isInt({ min: 1, max: 5 }),
      check('comment', 'Комментарий должен быть не менее 10 символов').optional().isLength({ min: 10 })
    ]
  ],
  clubController.addReview
);



router.post(
  '/:id/upload',
  auth,
  upload.array('images', 5),
  clubController.uploadImages
);

router.delete('/:id/images/:imageId', auth, clubController.deleteImage);

module.exports = router;