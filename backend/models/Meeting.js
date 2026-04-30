const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  details: { type: String },
  date: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Meeting', MeetingSchema);