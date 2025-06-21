const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  child: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Child',
    required: true 
  },
  club: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Club',
    required: true 
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: {
    day: { type: String, required: true },
    time: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled'], 
    default: 'pending' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Enrollment', EnrollmentSchema);