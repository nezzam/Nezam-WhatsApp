const rateLimit = require('express-rate-limit');

// API Key middleware
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  const validKey = process.env.API_KEY || 'wa_dev_key_2024';
  
  // Skip auth for development (when no API_KEY is set)
  if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
    return next();
  }
  
  if (!apiKey || apiKey !== validKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid API Key'
    });
  }
  
  next();
};

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  }
});

// Error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large (max 16MB)'
      });
    }
  }
  
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

module.exports = {
  apiKeyAuth,
  apiLimiter,
  errorHandler
};
