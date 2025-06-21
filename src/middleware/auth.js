const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function(req, res, next) {
  // Получаем токен из заголовка
  const token = req.header('x-auth-token');
  
  // Проверяем наличие токена
  if (!token) {
    return res.status(401).json({ message: 'Нет токена, авторизация отклонена' });
  }

  try {
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Находим пользователя и добавляем его в запрос
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Токен недействителен - пользователь не найден' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ 
      message: 'Ошибка сервера',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    console.error('Ошибка аутентификации:', err.message);
    res.status(401).json({ message: 'Токен недействителен' });
  }
};