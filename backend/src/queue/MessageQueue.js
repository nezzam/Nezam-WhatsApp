const WhatsAppEngine = require('../whatsapp/WhatsAppEngine');
const QueueJob = require('../models/QueueJob');
const Message = require('../models/Message');
const Account = require('../models/Account');
const EventEmitter = require('events');
const fs = require('fs');

class MessageQueue extends EventEmitter {
  constructor() {
    super();
    this.isProcessing = false;
    this.currentJob = null;
    this.processInterval = null;
    this.messageCount = 0;
    this.bulkStartTime = null;
  }

  start() {
    if (this.processInterval) return;
    // ensure MongoDB is connected before starting processing to avoid buffering errors
    try {
      const mongoose = require('mongoose');
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        console.log('MessageQueue: waiting for MongoDB connection before starting');
        mongoose.connection.once('open', () => {
          // small delay to let models settle
          setTimeout(() => this.start(), 500);
        });
        return;
      }
    } catch (e) {
      // if mongoose not available for some reason, still proceed but warn
      console.warn('MessageQueue start: mongoose not available, proceeding anyway');
    }

    console.log('Message queue started');
    this.processInterval = setInterval(() => this.processQueue(), 5000);
  }

  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('Message queue stopped');
    }
  }

  async addJob(data) {
    const { accountId, to, message, type = 'text', mediaPath = '' } = data;
    
    const job = await QueueJob.create({
      accountId,
      to,
      message,
      type,
      mediaPath,
      status: 'PENDING',
      scheduledAt: new Date()
    });

    this.emit('job_added', job);
    return job;
  }

  async addBulkJobs(accountId, messages) {
    const jobs = [];
    let scheduledTime = Date.now();

    for (const msg of messages) {
      // Random delay between 5-20 seconds
      const delay = Math.floor(Math.random() * 15000) + 5000;
      scheduledTime += delay;

      const job = await QueueJob.create({
        accountId,
        to: msg.to,
        message: msg.message,
        type: msg.type || 'text',
        mediaPath: msg.mediaPath || '',
        status: 'PENDING',
        scheduledAt: new Date(scheduledTime)
      });

      jobs.push(job);
    }

    this.emit('bulk_added', { count: jobs.length, accountId });
    return jobs;
  }

  async processQueue() {
    if (this.isProcessing) return;
    
    try {
      this.isProcessing = true;
      
      const pendingJobs = await QueueJob.find({ 
        status: 'PENDING',
        scheduledAt: { $lte: new Date() }
      })
      .sort({ createdAt: 1 })
      .limit(1)
      .populate('accountId');

      if (pendingJobs.length === 0) {
        this.isProcessing = false;
        return;
      }

      const job = pendingJobs[0];
      
      // Check if account is connected
      const account = await Account.findById(job.accountId);
      if (!account || account.status !== 'CONNECTED') {
        await QueueJob.findByIdAndUpdate(job._id, {
          status: 'FAILED',
          errorMessage: 'Account not connected',
          processedAt: new Date()
        });
        this.isProcessing = false;
        return;
      }

      // Update job status
      await QueueJob.findByIdAndUpdate(job._id, {
        status: 'PROCESSING'
      });

      // After every 10 messages, add extra delay
      if (this.messageCount > 0 && this.messageCount % 10 === 0) {
        const extraDelay = Math.floor(Math.random() * 60000) + 60000; // 60-120 seconds
        console.log(`Bulk delay: sleeping ${extraDelay}ms after 10 messages`);
        await this.sleep(extraDelay);
      }

      try {
        // Send message
        await WhatsAppEngine.sendMessage(
          account._id.toString(),
          job.to,
          job.message,
          job.mediaPath
        );

        // Update job as completed
        await QueueJob.findByIdAndUpdate(job._id, {
          status: 'COMPLETED',
          processedAt: new Date()
        });

        // Create message log
        await Message.create({
          accountId: account._id,
          to: job.to,
          type: job.type,
          message: job.message,
          mediaPath: job.mediaPath,
          status: 'SENT',
          sentAt: new Date()
        });

        this.messageCount++;
        this.emit('job_completed', { jobId: job._id, accountId: account._id });

        // Random delay between messages (5-20 seconds)
        const delay = Math.floor(Math.random() * 15000) + 5000;
        await this.sleep(delay);

      } catch (error) {
        console.error('Send error:', error);
        
        await QueueJob.findByIdAndUpdate(job._id, {
          status: 'FAILED',
          errorMessage: error.message,
          processedAt: new Date()
        });

        await Message.create({
          accountId: account._id,
          to: job.to,
          type: job.type,
          message: job.message,
          mediaPath: job.mediaPath,
          status: 'FAILED',
          errorMessage: error.message
        });

        this.emit('job_failed', { jobId: job._id, error: error.message });
      }

    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getStats() {
    const pending = await QueueJob.countDocuments({ status: 'PENDING' });
    const processing = await QueueJob.countDocuments({ status: 'PROCESSING' });
    const completed = await QueueJob.countDocuments({ status: 'COMPLETED' });
    const failed = await QueueJob.countDocuments({ status: 'FAILED' });
    
    return { pending, processing, completed, failed };
  }
}

module.exports = new MessageQueue();
