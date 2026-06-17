const jwt = require('jsonwebtoken');
const User = require('../models/User');

const checkAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado!' });
  }

  try {
    const decoded = jwt.verify(token, 'nossosecret');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado!' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso restrito a administradores!' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expirado! Faça login novamente.' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Token inválido!' });
    }
    return res.status(500).json({ message: 'Erro interno do servidor!' });
  }
};

module.exports = checkAdmin;