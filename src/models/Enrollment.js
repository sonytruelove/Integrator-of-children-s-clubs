const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
  schedule: {
    day: String,
    time: String
  },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);