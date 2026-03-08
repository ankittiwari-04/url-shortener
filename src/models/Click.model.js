const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  shortCode: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    type: String,
    default: 'unknown',
  },
  ip: {
    type: String,
    default: 'unknown',
  },
  referrer: {
    type: String,
    default: 'direct',
  },
});

module.exports = mongoose.model('Click', clickSchema);