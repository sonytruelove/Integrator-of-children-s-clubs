const Child = require('../models/Child');
const User = require('../models/User');

exports.addChild = async (req, res) => {
  try {
    const { name, age, interests } = req.body;
    if (typeof age !== 'number' || age <= 0 || age > 18) 
      return res.status(400).json({ 
        message: 'Возраст должен быть положительным числом не больше 18 лет' 
      });
    const child = new Child({
      parent: req.user.id,
      name,
      age,
      interests: interests || []
    });

    await child.save();
    
    // Добавляем ребенка к пользователю
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { children: child._id } },
      { new: true }
    );

    res.status(201).json(child);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка добавления ребенка', error: err.message });
  }
};

exports.getChildren = async (req, res) => {
  try {
    const children = await Child.find({ parent: req.user.id });
    res.json(children);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения детей', error: err.message });
  }
};

exports.getChildById = async (req, res) => {
  try {
    const child = await Child.findOne({
      _id: req.params.id,
      parent: req.user.id
    });

    if (!child) {
      return res.status(404).json({ message: 'Ребенок не найден' });
    }

    res.json(child);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения ребенка', error: err.message });
  }
};

exports.updateChild = async (req, res) => {
  try {
     if (req.body.age !== undefined && (typeof req.body.age !== 'number' || req.body.age <= 0 || req.body.age > 18)) {
      return res.status(400).json({ 
        message: 'Возраст должен быть положительным числом не больше 18 лет' 
      });
    }
    const child = await Child.findOneAndUpdate(
      { _id: req.params.id, parent: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!child) {
      return res.status(404).json({ message: 'Ребенок не найден' });
    }

    res.json(child);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка обновления ребенка', error: err.message });
  }
};

exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findOneAndDelete({
      _id: req.params.id,
      parent: req.user.id
    });

    if (!child) {
      return res.status(404).json({ message: 'Ребенок не найден' });
    }

    // Удаляем ребенка из списка пользователя
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { children: child._id } }
    );

    res.json({ message: 'Ребенок успешно удален' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка удаления ребенка', error: err.message });
  }
};