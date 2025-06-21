const Enrollment = require('../models/Enrollment');
const Club = require('../models/Club');
const Child = require('../models/Child');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// Запись ребенка в кружок
exports.enrollChild = async (req, res) => {
  try {
    const { childId, clubId, schedule } = req.body;
    
    // Проверяем, принадлежит ли ребенок пользователю
    const child = await Child.findOne({ _id: childId, parent: req.user.id });
    if (!child) {
      return res.status(404).json({ message: 'Ребенок не найден или не принадлежит вам' });
    }

    // Проверяем существование кружка
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Кружок не найден' });
    }

    // Создаем запись
    const enrollment = new Enrollment({
      child: childId,
      club: clubId,
      schedule,
      parent: req.user.id
    });

    await enrollment.save();

    // Отправляем уведомление
    await sendEmail(
      req.user.email,
      'Подтверждение записи в кружок',
      `Вы записали ${child.name} в кружок "${club.name}"`
    );

    res.status(201).json(enrollment);
  } catch (err) {
    res.status(500).json({ 
      message: 'Ошибка при записи в кружок', 
      error: err.message 
    });
  }
};

// Получение всех записей пользователя
exports.getEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ parent: req.user.id })
      .populate('child', 'name age')
      .populate('club', 'name category schedule price');
      
    res.json(enrollments);
  } catch (err) {
    res.status(500).json({ 
      message: 'Ошибка получения записей', 
      error: err.message 
    });
  }
};

// Получение конкретной записи
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id: req.params.id,
      parent: req.user.id
    }).populate('child club');
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Запись не найдена' });
    }
    
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ 
      message: 'Ошибка получения записи', 
      error: err.message 
    });
  }
};
exports.confirmEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { 
        _id: req.params.id,
        status: "pending"
      },
      { status: "confirmed" },
      { new: true }
    );
    
    if (!enrollment) {
      return res.status(404).json({ message: "Запись не найдена или уже подтверждена" });
    }
    
    res.json(enrollment);
  } catch (err) {
    res.status(500).json({ message: "Ошибка подтверждения записи", error: err.message });
  }
};
// Отмена записи
exports.cancelEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOneAndUpdate(
      { 
        _id: req.params.id, 
        parent: req.user.id,
        status: { $ne: 'cancelled' }
      },
      { status: 'cancelled' },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({ 
        message: 'Запись не найдена или уже отменена' 
      });
    }

    // Отправляем уведомление
    const child = await Child.findById(enrollment.child);
    const club = await Club.findById(enrollment.club);
    
    await sendEmail(
      req.user.email,
      'Отмена записи в кружок',
      `Вы отменили запись ${child.name} в кружок "${club.name}"`
    );

    res.json({ 
      message: 'Запись успешно отменена', 
      enrollment 
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Ошибка при отмене записи', 
      error: err.message 
    });
  }
};