const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  to: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'document', 'audio'], default: 'text' },
  message: { type: String, default: '' },
  mediaPath: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['PENDING', 'SENT', 'FAILED', 'DELIVERED'],
    default: 'PENDING'
  },
  errorMessage: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  sentAt: { type: Date, default: null }
});

module.exports = mongoose.model('Message', messageSchema);
