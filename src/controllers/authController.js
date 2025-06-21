const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'Пользователь уже существует' });

    user = new User({ name, email, password });
    
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ token });
    });
  } catch (err) {
    res.status(500).json({ 
    message: 'Ошибка сервера',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Неверные учетные данные' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Неверные учетные данные' });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
      res.status(500).json({ 
    message: 'Ошибка сервера',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  }
};

exports.getUser = async (req, res) => {
  try {
    // Пользователь уже добавлен в запрос в auth middleware
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
      res.status(500).json({ 
    message: 'Ошибка сервера',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
  }
};