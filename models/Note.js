const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: '',
  },
  body: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#eada76',
  },
  date: {
    type: String,
    default: '',
  },
  time: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Number,
    default: Date.now,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: { createdAt: 'timestamp', updatedAt: false } });

noteSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);