const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

module.exports = mongoose.model('Note', noteSchema);