const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['INITIALIZING', 'QR_READY', 'SCANNED', 'CONNECTED', 'DISCONNECTED'],
    default: 'INITIALIZING'
  },
  qrCode: { type: String, default: '' },
  sessionData: { type: Object, default: null },
  info: { type: Object, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', accountSchema);
