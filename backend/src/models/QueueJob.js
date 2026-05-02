const mongoose = require('mongoose');

const queueJobSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  type: { type: String, enum: ['text', 'image', 'document', 'audio'], default: 'text' },
  to: { type: String, required: true },
  message: { type: String, default: '' },
  mediaPath: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  scheduledAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  errorMessage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QueueJob', queueJobSchema);
