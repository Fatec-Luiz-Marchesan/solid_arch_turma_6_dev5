const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const MessageController = require('../controllers/MessageController');
const verifyToken = require('../helpers/check-token');

const messageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/', messageLimiter, verifyToken, MessageController.create);
router.get('/', messageLimiter, verifyToken, MessageController.list);
router.get('/conversation/:userId/:petId', messageLimiter, verifyToken, MessageController.conversation);
router.get('/:id', messageLimiter, verifyToken, MessageController.getById);
router.patch('/:id/read', messageLimiter, verifyToken, MessageController.markAsRead);
router.patch('/:id', messageLimiter, verifyToken, MessageController.update);
router.delete('/:id', messageLimiter, verifyToken, MessageController.delete);

module.exports = router;