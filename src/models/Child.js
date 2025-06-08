const mongoose = require('mongoose');

const ChildSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  interests: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Child', ChildSchema);