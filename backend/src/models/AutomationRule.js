const mongoose = require('mongoose');

const automationRuleSchema = new mongoose.Schema({
  keyword: { type: String, required: true, lowercase: true },
  reply: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  matchType: { type: String, enum: ['contains', 'exact'], default: 'contains' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AutomationRule', automationRuleSchema);
