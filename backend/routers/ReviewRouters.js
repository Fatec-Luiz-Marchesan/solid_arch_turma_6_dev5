const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ReviewController = require('../controllers/ReviewController');
const verifyToken = require('../helpers/check-token');

const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', reviewLimiter, verifyToken, ReviewController.create);
router.get('/my-reviews', reviewLimiter, verifyToken, ReviewController.listMine);
router.get('/user/:userId/average', reviewLimiter, ReviewController.average);
router.get('/user/:userId', reviewLimiter, ReviewController.listByUser);
router.get('/:id', reviewLimiter, ReviewController.getById);
router.patch('/:id', reviewLimiter, verifyToken, ReviewController.update);
router.delete('/:id', reviewLimiter, verifyToken, ReviewController.delete);

module.exports = router;