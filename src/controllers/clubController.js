const Club = require('../models/Club');
const Enrollment = require('../models/Enrollment');
const { sendEmail } = require('../utils/emailService');
const mongoose = require('mongoose');
const Child = require('../models/Child'); // Добавьте эту строку
// Получение всех кружков (с пагинацией)
exports.getAllClubs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const clubs = await Club.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Club.countDocuments();

    res.json({
      clubs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalClubs: total
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

// Получение кружка по ID
exports.getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate({
        path: 'reviews',
        populate: { path: 'user', select: 'name' }
      });

    if (!club) {
      return res.status(404).json({ message: 'Кружок не найден' });
    }

    // Получаем количество записавшихся детей
    const enrolledCount = await Enrollment.countDocuments({ 
      club: club._id, 
      status: { $in: ['pending', 'confirmed'] } 
    });

    res.json({ ...club.toObject(), enrolledCount });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера', error: err.message });
  }
};

// Создание нового кружка
exports.createClub = async (req, res) => {
  try {
    const { name, description, category, address, schedule, ageRange, price, contact, interests } = req.body;

    // Преобразуем координаты
    const coordinates = req.body.coordinates || [0, 0];
    
    const newClub = new Club({
      name,
      description,
      category,
      location: {
        type: 'Point',
        coordinates
      },
      address,
      schedule,
      ageRange: {
        min: ageRange.min,
        max: ageRange.max
      },
      price,
      contact,
      interests: interests || [],
      createdBy: req.user.id
    });

    await newClub.save();
    res.status(201).json(newClub);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка создания кружка', error: err.message });
  }
};

// Обновление кружка
exports.updateClub = async (req, res) => {
  try {
    const { coordinates, ...updateData } = req.body;
    
    const update = { ...updateData };
    if (coordinates) {
      update.location = {
        type: 'Point',
        coordinates
      };
    }

    const updatedClub = await Club.findByIdAndUpdate(
      req.params.id, 
      update, 
      { new: true, runValidators: true }
    );

    if (!updatedClub) {
      return res.status(404).json({ message: 'Кружок не найден' });
    }

    res.json(updatedClub);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка обновления', error: err.message });
  }
};

// Удаление кружка
exports.deleteClub = async (req, res) => {
  try {
    const club = await Club.findByIdAndDelete(req.params.id);
    
    if (!club) {
      return res.status(404).json({ message: 'Кружок не найден' });
    }

    // Удаляем все связанные записи
    await Enrollment.deleteMany({ club: req.params.id });
    
    res.json({ message: 'Кружок успешно удален' });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка удаления', error: err.message });
  }
};

// Поиск кружков с фильтрами
exports.searchClubs = async (req, res) => {
  try {
    const { 
      category, 
      age, 
      interests, 
      longitude, 
      latitude, 
      maxDistance = 5000,
      minPrice,
      maxPrice,
      searchText,
      sortBy = 'rating',
      sortOrder = -1
    } = req.query;
    
    const query = {};
    
    // Текстовый поиск
    if (searchText) {
      query.$text = { $search: searchText };
    }
    
    // Фильтр по категории
    if (category) {
      query.category = category;
    }
    
    // Фильтр по возрасту
    if (age) {
      const ageNum = parseInt(age);
      query['ageRange.min'] = { $lte: ageNum };
      query['ageRange.max'] = { $gte: ageNum };
    }
    
    // Фильтр по интересам
    if (interests) {
      query.interests = { $in: interests.split(',') };
    }
    
    // Фильтр по цене
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Сортировка
    const sortOptions = {};
    sortOptions[sortBy] = parseInt(sortOrder);

    let clubs;
    
    // Геопоиск
    if (longitude && latitude) {
      clubs = await Club.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      }).sort(sortOptions);
    } else {
      clubs = await Club.find(query).sort(sortOptions);
    }
    
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка поиска', error: err.message });
  }
};

// Рекомендации кружков
exports.getRecommendations = async (req, res) => {
  const { childId } = req.params;
  
  try {
    const child = await Child.findById(childId).populate('interests');
    if (!child) {
      return res.status(404).json({ message: 'Ребенок не найден' });
    }
    
    // Базовые рекомендации по интересам и возрасту
    let recommendedClubs = await Club.find({
      interests: { $in: child.interests },
      'ageRange.min': { $lte: child.age },
      'ageRange.max': { $gte: child.age }
    }).limit(20);
    
    // Если недостаточно рекомендаций, добавляем по популярности
    if (recommendedClubs.length < 5) {
      const popularClubs = await Club.find({
        'ageRange.min': { $lte: child.age },
        'ageRange.max': { $gte: child.age }
      })
      .sort({ rating: -1 })
      .limit(5);
      
      recommendedClubs = [...recommendedClubs, ...popularClubs];
    }
    
    // Убираем дубликаты
    const uniqueClubs = recommendedClubs.filter(
      (club, index, self) => index === self.findIndex(c => c.id === club.id)
    );
    
    res.json(uniqueClubs.slice(0, 10));
  } catch (err) {
    res.status(500).json({ message: 'Ошибка рекомендаций', error: err.message });
  }
};

// Добавление отзыва
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const clubId = req.params.id;
    
    // Проверяем записан ли пользователь в этот кружок
    const enrollment = await Enrollment.findOne({
      club: clubId,
      child: { $in: req.user.children }, // предполагаем, что у пользователя есть поле children
      status: 'confirmed'
    });
    
    if (!enrollment) {
      return res.status(403).json({ message: 'Вы не посещали этот кружок' });
    }
    
    const newReview = {
      user: req.user.id,
      rating,
      comment,
      createdAt: new Date()
    };
    
    const club = await Club.findByIdAndUpdate(
      clubId,
      { 
        $push: { reviews: newReview },
        $inc: { totalRatings: rating, reviewCount: 1 }
      },
      { new: true }
    );
    
    // Пересчитываем средний рейтинг
    club.rating = club.totalRatings / club.reviewCount;
    await club.save();
    
    res.status(201).json(club.reviews.slice(-1)[0]);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка добавления отзыва', error: err.message });
  }
};

// Получение расписания кружка
exports.getSchedule = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).select('schedule');
    
    if (!club) {
      return res.status(404).json({ message: 'Кружок не найден' });
    }
    
    res.json(club.schedule);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения расписания', error: err.message });
  }
};

// Статистика по кружку
exports.getClubStats = async (req, res) => {
  try {
    const clubId = new mongoose.Types.ObjectId(req.params.id);
    
    const stats = await Enrollment.aggregate([
      { $match: { club: clubId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          statuses: { $push: { status: '$_id', count: '$count' } },
          total: { $sum: '$count' }
        }
      },
      {
        $lookup: {
          from: 'clubs',
          localField: '_id',
          foreignField: '_id',
          as: 'clubDetails'
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.json({
        statuses: [],
        total: 0,
        ageDistribution: [],
        popularTimes: []
      });
    }
    
    // Распределение по возрастам
    const ageDistribution = await Enrollment.aggregate([
      { $match: { club: clubId } },
      { $lookup: { from: 'children', localField: 'child', foreignField: '_id', as: 'child' } },
      { $unwind: '$child' },
      {
        $group: {
          _id: '$child.age',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Популярные дни и время
    const popularTimes = await Enrollment.aggregate([
      { $match: { club: clubId } },
      {
        $group: {
          _id: { day: '$schedule.day', time: '$schedule.time' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.json({
      ...stats[0],
      ageDistribution,
      popularTimes
    });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка получения статистики', error: err.message });
  }
};

// Поиск кружков по названию (автодополнение)
exports.autocompleteClubs = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const clubs = await Club.find(
      { name: { $regex: query, $options: 'i' } },
      { _id: 1, name: 1, category: 1 }
    ).limit(10);
    
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка поиска', error: err.message });
  }
};

// Загрузка изображений
exports.uploadImages = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Кружок не найден' });
    }

    const images = req.files.map(file => ({
      url: `/uploads/clubs/${file.filename}`,
      filename: file.filename
    }));

    club.images = [...club.images, ...images];
    await club.save();

    res.status(201).json(club.images);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка загрузки изображений', error: err.message });
  }
};

// Удаление изображения
exports.deleteImage = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) {
      return res.status(404).json({ message: 'Кружок не найден' });
    }

    club.images = club.images.filter(
      img => img._id.toString() !== req.params.imageId
    );
    
    await club.save();
    
    // Здесь можно добавить удаление файла с диска
    // fs.unlinkSync(path.join(__dirname, '..', 'uploads', 'clubs', filename));
    
    res.json({ message: 'Изображение удалено', images: club.images });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка удаления изображения', error: err.message });
  }
};