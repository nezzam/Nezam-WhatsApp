const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password -twoFactorSecret');

      if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  } else if (req.headers['x-api-key']) {
    // API Key Authentication for external integrations
    try {
      const apiKey = req.headers['x-api-key'];
      const user = await User.findOne({ apiKey });

      if (!user) {
        return res.status(401).json({ success: false, error: 'Not authorized, invalid API Key' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, error: 'Not authorized, API Key verification failed' });
    }
  } else {
    res.status(401).json({ success: false, error: 'Not authorized, no token or API key' });
  }
};

// Protect for 2FA setup (temporary token)
const protectTemp = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      req.userId = decoded.id; // temporary token might only have id, not full auth
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ success: false, error: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, error: 'Not authorized, no token' });
  }
};

module.exports = { protect, protectTemp };
