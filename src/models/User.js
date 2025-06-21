const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { type: String, default: 'parent' },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }]
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);