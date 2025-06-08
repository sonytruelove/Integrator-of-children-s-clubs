const mongoose = require('mongoose');

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  address: { type: String, required: true },
  schedule: [{
    day: { type: String, enum: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] },
    startTime: String,
    endTime: String
  }],
  ageRange: { min: Number, max: Number },
  price: { type: Number, required: true },
  contact: {
    phone: String,
    email: String
  },
  rating: { type: Number, default: 0 }
}, { timestamps: true });

// Индекс для геопоиска
ClubSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Club', ClubSchema);