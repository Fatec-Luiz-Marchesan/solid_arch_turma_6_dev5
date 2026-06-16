const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const UserController = require('../controllers/UserController')

// limiter para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 tentativas por IP
  message: 'Muitas tentativas de login, tente novamente mais tarde.'
})

// rotas
router.post('/register', UserController.register)
router.post('/login', loginLimiter, UserController.login) // aplica limiter aqui
router.get('/user/:id', UserController.getUserById)
router.patch('/user/edit', UserController.editUser)

module.exports = router
