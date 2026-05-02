const express = require('express');
const router = express.Router();
const Account = require('../../models/Account');
const WhatsAppEngine = require('../../whatsapp/WhatsAppEngine');

// Create account
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    const account = await Account.create({
      name: name || 'New Account',
      status: 'INITIALIZING'
    });

    // Initialize WhatsApp client
    await WhatsAppEngine.initializeAccount(account._id.toString());

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all accounts
router.get('/', async (req, res) => {
  try {
    const accounts = await Account.find().sort({ createdAt: -1 });
    
    // Enrich with real-time status
    const enrichedAccounts = accounts.map(acc => {
      const realtimeStatus = WhatsAppEngine.getStatus(acc._id.toString());
      return {
        ...acc.toObject(),
        realtimeStatus: realtimeStatus || acc.status
      };
    });

    res.json({
      success: true,
      data: enrichedAccounts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get account by ID
router.get('/:id', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const realtimeStatus = WhatsAppEngine.getStatus(account._id.toString());
    
    res.json({
      success: true,
      data: {
        ...account.toObject(),
        realtimeStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get QR code
router.get('/:id/qr', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const qr = WhatsAppEngine.getQRCode(req.params.id);
    const status = WhatsAppEngine.getStatus(req.params.id);

    res.json({
      success: true,
      data: {
        qrCode: qr,
        status: status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get status
router.get('/:id/status', async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found'
      });
    }

    const status = WhatsAppEngine.getStatus(req.params.id);

    res.json({
      success: true,
      data: {
        accountId: req.params.id,
        status: status,
        dbStatus: account.status
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Disconnect account
router.post('/:id/disconnect', async (req, res) => {
  try {
    await WhatsAppEngine.disconnectAccount(req.params.id);
    
    res.json({
      success: true,
      message: 'Account disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restart account
router.post('/:id/restart', async (req, res) => {
  try {
    await WhatsAppEngine.restartAccount(req.params.id);
    
    res.json({
      success: true,
      message: 'Account restarted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete account
router.delete('/:id', async (req, res) => {
  try {
    await WhatsAppEngine.disconnectAccount(req.params.id);
    await Account.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Account deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
