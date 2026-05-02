const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const User = require('../../models/User');
const { protect, protectTemp } = require('../../utils/authMiddleware');

const generateToken = (id, isTemp = false) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: isTemp ? '5m' : '30d',
  });
};

// @desc    Setup initial admin user (Only allowed if no users exist)
// @route   POST /api/auth/setup
// @access  Public
router.post('/setup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return res.status(400).json({ success: false, error: 'Setup already completed' });
    }

    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Please provide username and password' });
    }

    const user = await User.create({
      username,
      password
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Check if setup is required
// @route   GET /api/auth/setup-status
// @access  Public
router.get('/setup-status', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ success: true, isSetupRequired: userCount === 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    if (user.isTwoFactorEnabled) {
      return res.json({
        success: true,
        requiresTwoFactor: true,
        tempToken: generateToken(user._id, true)
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        isTwoFactorEnabled: user.isTwoFactorEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Verify 2FA token during login
// @route   POST /api/auth/verify-2fa
// @access  Public (with temp token)
router.post('/verify-2fa', protectTemp, async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.userId);

    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          username: user.username,
          isTwoFactorEnabled: user.isTwoFactorEnabled
        }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid 2FA code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -twoFactorSecret');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Update password
// @route   POST /api/auth/update-password
// @access  Private
router.post('/update-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Generate 2FA secret and QR
// @route   POST /api/auth/2fa/generate
// @access  Private
router.post('/2fa/generate', protect, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: 'Nezam WhatsApp' });
    
    qrcode.toDataURL(secret.otpauth_url, async (err, data_url) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Error generating QR code' });
      }
      res.json({
        success: true,
        secret: secret.base32,
        qrCode: data_url
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Verify and enable 2FA
// @route   POST /api/auth/2fa/enable
// @access  Private
router.post('/2fa/enable', protect, async (req, res) => {
  try {
    const { secret, token } = req.body;
    const user = await User.findById(req.user._id);

    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token
    });

    if (verified) {
      user.twoFactorSecret = secret;
      user.isTwoFactorEnabled = true;
      await user.save();
      res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Disable 2FA
// @route   POST /api/auth/2fa/disable
// @access  Private
router.post('/2fa/disable', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { token } = req.body;

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });

    if (verified) {
      user.twoFactorSecret = null;
      user.isTwoFactorEnabled = false;
      await user.save();
      res.json({ success: true, message: '2FA disabled successfully' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Generate API Key
// @route   POST /api/auth/api-key/generate
// @access  Private
router.post('/api-key/generate', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const newApiKey = uuidv4();
    
    user.apiKey = newApiKey;
    user.apiKeyCreatedAt = new Date();
    await user.save();

    res.json({ success: true, apiKey: newApiKey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// @desc    Revoke API Key
// @route   DELETE /api/auth/api-key
// @access  Private
router.delete('/api-key', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.apiKey = null;
    user.apiKeyCreatedAt = null;
    await user.save();

    res.json({ success: true, message: 'API Key revoked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
