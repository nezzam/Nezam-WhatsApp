const express = require('express');
const router = express.Router();
const QueueJob = require('../../models/QueueJob');
const MessageQueue = require('../../queue/MessageQueue');

// Get queue jobs
router.get('/jobs', async (req, res) => {
  try {
    const { accountId, status, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (accountId) query.accountId = accountId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const jobs = await QueueJob.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .populate('accountId', 'name phone status');

    const total = await QueueJob.countDocuments(query);

    res.json({
      success: true,
      data: jobs,
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

// Get queue stats
router.get('/stats', async (req, res) => {
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

// Retry failed job
router.post('/jobs/:id/retry', async (req, res) => {
  try {
    const job = await QueueJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    job.status = 'PENDING';
    job.errorMessage = '';
    job.scheduledAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: 'Job queued for retry'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel pending job
router.delete('/jobs/:id', async (req, res) => {
  try {
    const job = await QueueJob.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      message: 'Job cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
