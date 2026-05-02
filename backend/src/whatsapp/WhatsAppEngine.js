const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Account = require('../models/Account');
const Message = require('../models/Message');
const QueueJob = require('../models/QueueJob');
const AutomationRule = require('../models/AutomationRule');
const EventEmitter = require('events');
const path = require('path');
const fs = require('fs');

class WhatsAppEngine extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // accountId -> Client
    this.qrCodes = new Map(); // accountId -> QR string
    this.statuses = new Map(); // accountId -> status
  }

  async initializeAccount(accountId) {
    if (this.clients.has(accountId.toString())) {
      console.log(`Account ${accountId} already initialized`);
      return;
    }

    const sessionDir = path.join(__dirname, '../../.wwebjs_auth', accountId.toString());
    
    const client = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionDir,
        clientId: accountId.toString()
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      },
      takeoverOnConflict: true
    });

    this.clients.set(accountId.toString(), client);
    this.statuses.set(accountId.toString(), 'INITIALIZING');

    // QR Code event
    client.on('qr', async (qr) => {
      console.log(`QR received for account ${accountId}`);
      this.qrCodes.set(accountId.toString(), qr);
      this.statuses.set(accountId.toString(), 'QR_READY');
      
      await Account.findByIdAndUpdate(accountId, {
        status: 'QR_READY',
        qrCode: qr,
        updatedAt: new Date()
      });

      this.emit('qr', { accountId, qr });
    });

    // Authenticated event
    client.on('authenticated', async (session) => {
      console.log(`Account ${accountId} authenticated`);
      this.statuses.set(accountId.toString(), 'SCANNED');
      
      await Account.findByIdAndUpdate(accountId, {
        status: 'SCANNED',
        sessionData: session,
        updatedAt: new Date()
      });

      this.emit('authenticated', { accountId });
    });

    // Ready event
    client.on('ready', async () => {
      console.log(`Account ${accountId} is ready!`);
      this.statuses.set(accountId.toString(), 'CONNECTED');
      
      const info = client.info;
      await Account.findByIdAndUpdate(accountId, {
        status: 'CONNECTED',
        phone: info?.wid?.user || '',
        info: {
          wid: info?.wid?.user,
          pushname: info?.pushname,
          platform: info?.platform
        },
        updatedAt: new Date()
      });

      this.emit('ready', { accountId, info });
    });

    // Disconnected event
    client.on('disconnected', async (reason) => {
      console.log(`Account ${accountId} disconnected:`, reason);
      this.statuses.set(accountId.toString(), 'DISCONNECTED');
      
      await Account.findByIdAndUpdate(accountId, {
        status: 'DISCONNECTED',
        updatedAt: new Date()
      });

      this.clients.delete(accountId.toString());
      this.qrCodes.delete(accountId.toString());
      
      this.emit('disconnected', { accountId, reason });
    });

    // Message received (for automation)
    client.on('message_create', async (msg) => {
      if (msg.fromMe) return; // Skip own messages
      
      this.emit('message_received', {
        accountId,
        from: msg.from,
        body: msg.body,
        timestamp: msg.timestamp
      });

      // Process automation rules
      await this.processAutomationRules(accountId, msg);
    });

    // Auth failure
    client.on('auth_failure', async (msg) => {
      console.error(`Auth failure for account ${accountId}:`, msg);
      this.statuses.set(accountId.toString(), 'DISCONNECTED');
      
      await Account.findByIdAndUpdate(accountId, {
        status: 'DISCONNECTED',
        updatedAt: new Date()
      });
      
      this.emit('auth_failure', { accountId, error: msg });
    });

    // Initialize client
    try {
      await client.initialize();
    } catch (error) {
      console.error(`Failed to initialize client for account ${accountId}:`, error);
      this.emit('error', { accountId, error: error.message });
    }
  }

  async processAutomationRules(accountId, msg) {
    try {
      const rules = await AutomationRule.find({ isActive: true });
      const messageBody = msg.body.toLowerCase();

      for (const rule of rules) {
        const keyword = rule.keyword.toLowerCase();
        const shouldReply = rule.matchType === 'exact' 
          ? messageBody === keyword 
          : messageBody.includes(keyword);

        if (shouldReply) {
          await msg.reply(rule.reply);
          
          // Log the automated reply
          await Message.create({
            accountId,
            to: msg.from,
            type: 'text',
            message: rule.reply,
            status: 'SENT',
            sentAt: new Date()
          });
          
          break; // First match only
        }
      }
    } catch (error) {
      console.error('Automation rule error:', error);
    }
  }

  async sendMessage(accountId, to, message, mediaPath = null) {
    const client = this.clients.get(accountId.toString());
    if (!client) {
      throw new Error('Account not connected');
    }

    if (this.statuses.get(accountId.toString()) !== 'CONNECTED') {
      throw new Error('Account not ready');
    }

    // Format phone number
    let chatId = to;
    if (!chatId.includes('@')) {
      chatId = `${chatId.replace(/[^0-9]/g, '')}@c.us`;
    }

    let result;
    if (mediaPath && fs.existsSync(mediaPath)) {
      const media = MessageMedia.fromFilePath(mediaPath);
      result = await client.sendMessage(chatId, media, { caption: message || '' });
    } else {
      result = await client.sendMessage(chatId, message);
    }

    return result;
  }

  getQRCode(accountId) {
    return this.qrCodes.get(accountId.toString()) || null;
  }

  getStatus(accountId) {
    return this.statuses.get(accountId.toString()) || 'DISCONNECTED';
  }

  async disconnectAccount(accountId) {
    const client = this.clients.get(accountId.toString());
    if (client) {
      await client.destroy();
      this.clients.delete(accountId.toString());
    }
    this.qrCodes.delete(accountId.toString());
    this.statuses.delete(accountId.toString());

    await Account.findByIdAndUpdate(accountId, {
      status: 'DISCONNECTED',
      updatedAt: new Date()
    });
  }

  async restartAccount(accountId) {
    await this.disconnectAccount(accountId);
    await this.initializeAccount(accountId);
  }

  async destroy() {
    for (const [accountId, client] of this.clients) {
      try {
        await client.destroy();
      } catch (e) {
        console.error(`Error destroying client ${accountId}:`, e);
      }
    }
    this.clients.clear();
    this.qrCodes.clear();
    this.statuses.clear();
  }
}

module.exports = new WhatsAppEngine();
