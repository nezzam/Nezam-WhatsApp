require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./src/config/db');
const WhatsAppEngine = require('./src/whatsapp/WhatsAppEngine');
const MessageQueue = require('./src/queue/MessageQueue');
const { apiLimiter, errorHandler } = require('./src/utils/middleware');

// Import routes
const accountRoutes = require('./src/api/routes/accounts');
const messageRoutes = require('./src/api/routes/messages');
const automationRoutes = require('./src/api/routes/automation');
const queueRoutes = require('./src/api/routes/queue');
const uploadRoutes = require('./src/api/routes/uploads');
const authRoutes = require('./src/api/routes/auth');
const { protect } = require('./src/utils/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (non-blocking) with retry behaviour
connectDB().catch(err => {
  console.error('Initial MongoDB connection failed (after retries):', err.message || err);
  // don't exit here; routes will handle DB errors and reconnect attempts continue in background
});

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Nezam WhatsApp Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', protect, accountRoutes);
app.use('/api/messages', protect, messageRoutes);
app.use('/api/automation', protect, automationRoutes);
app.use('/api/queue', protect, queueRoutes);
app.use('/api/uploads', protect, uploadRoutes);

// Dashboard stats
app.get('/api/dashboard/stats', protect, async (req, res) => {
  try {
    const Account = require('./src/models/Account');
    const Message = require('./src/models/Message');
    const QueueJob = require('./src/models/QueueJob');
    const AutomationRule = require('./src/models/AutomationRule');

    const [totalAccounts, connectedAccounts, totalMessages, queueStats, totalRules] = await Promise.all([
      Account.countDocuments(),
      Account.countDocuments({ status: 'CONNECTED' }),
      Message.countDocuments(),
      MessageQueue.getStats(),
      AutomationRule.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        accounts: {
          total: totalAccounts,
          connected: connectedAccounts
        },
        messages: {
          total: totalMessages
        },
        queue: queueStats,
        automation: {
          totalRules: totalRules
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler
app.use(errorHandler);

// API 404 handler - must be before SPA catch-all
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found'
  });
});

// SPA catch-all - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Nezam WhatsApp Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  
  // MessageQueue will start once DB connection is available
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  MessageQueue.stop();
  await WhatsAppEngine.destroy();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  MessageQueue.stop();
  await WhatsAppEngine.destroy();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Reconnect accounts on DB open
const reconnectAccounts = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for DB connection
    const Account = require('./src/models/Account');
    const accounts = await Account.find({ status: { $ne: 'DISCONNECTED' } });
    
    console.log(`Reconnecting ${accounts.length} accounts...`);
    
    for (const account of accounts) {
      try {
        await Account.findByIdAndUpdate(account._id, { status: 'INITIALIZING' });
        await WhatsAppEngine.initializeAccount(account._id.toString());
        console.log(`Account ${account._id} reconnected`);
      } catch (error) {
        console.error(`Failed to reconnect account ${account._id}:`, error);
        await Account.findByIdAndUpdate(account._id, { status: 'DISCONNECTED' });
      }
    }
  } catch (error) {
    console.error('Reconnect error:', error);
  }
};

// Only run reconnectAccounts once mongoose reports an open connection
try {
  const mongoose = require('mongoose');
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    reconnectAccounts().catch(err => console.error('Reconnect accounts error:', err));
  } else {
    mongoose.connection.once('open', () => {
      console.log('Mongoose connection opened, running reconnectAccounts');
      reconnectAccounts().catch(err => console.error('Reconnect accounts error:', err));
      try {
        MessageQueue.start();
        console.log('MessageQueue started after DB open');
      } catch (e) {
        console.error('Failed to start MessageQueue after DB open:', e);
      }
    });
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose disconnected');
  });
} catch (e) {
  console.warn('Mongoose not available to attach events yet');
}

// Global error handlers to log unhandled errors (prevents silent crashes)
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

module.exports = app;
