const express = require('express');
const router = express.Router();
const Message = require('../../models/Message');
const QueueJob = require('../../models/QueueJob');
const Account = require('../../models/Account');
const WhatsAppEngine = require('../../whatsapp/WhatsAppEngine');
const MessageQueue = require('../../queue/MessageQueue');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Send message directly
router.post('/send', async (req, res) => {
  try {
    const { accountId, to, message, type = 'text', mediaPath = '' } = req.body;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    if (account.status !== 'CONNECTED') {
      return res.status(400).json({
        success: false,
        error: 'Account not connected'
      });
    }

    // Send message
    let result;
    const fullMediaPath = mediaPath ? path.join(__dirname, '../../../uploads', path.basename(mediaPath)) : null;
    
    if (fullMediaPath && fs.existsSync(fullMediaPath)) {
      const media = MessageMedia.fromFilePath(fullMediaPath);
      result = await WhatsAppEngine.sendMessage(accountId, to, message || '', fullMediaPath);
    } else {
      result = await WhatsAppEngine.sendMessage(accountId, to, message);
    }

    // Log message
    const msgLog = await Message.create({
      accountId,
      to,
      type,
      message: message || '',
      mediaPath: mediaPath || '',
      status: 'SENT',
      sentAt: new Date()
    });

    res.json({
      success: true,
      data: {
        messageId: msgLog._id,
        whatsappId: result?.id,
        status: 'SENT'
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk send
router.post('/bulk', async (req, res) => {
  try {
    const { accountId, messages } = req.body;

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    if (account.status !== 'CONNECTED') {
      return res.status(400).json({
        success: false,
        error: 'Account not connected'
      });
    }

    // Validate messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Messages array is required'
      });
    }

    if (messages.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 1000 messages per bulk request'
      });
    }

    // Add to queue
    const jobs = await MessageQueue.addBulkJobs(accountId, messages);

    res.json({
      success: true,
      data: {
        totalJobs: jobs.length,
        queued: true,
        message: 'Bulk messages queued successfully'
      }
    });
  } catch (error) {
    console.error('Bulk send error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get messages
router.get('/', async (req, res) => {
  try {
    const { accountId, status, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (accountId) query.accountId = accountId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('accountId', 'name phone status');

    const total = await Message.countDocuments(query);

    res.json({
      success: true,
      data: messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get message by ID
router.get('/:id', async (req, res) => {
  try {
    const message = await Message.findById(req.params.id).populate('accountId', 'name phone');
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get queue stats
router.get('/queue/stats', async (req, res) => {
  try {
    const stats = await MessageQueue.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
