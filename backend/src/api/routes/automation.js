const express = require('express');
const router = express.Router();
const AutomationRule = require('../../models/AutomationRule');

// Add rule
router.post('/', async (req, res) => {
  try {
    const { keyword, reply, matchType = 'contains', isActive = true } = req.body;

    if (!keyword || !reply) {
      return res.status(400).json({
        success: false,
        error: 'Keyword and reply are required'
      });
    }

    const rule = await AutomationRule.create({
      keyword: keyword.toLowerCase(),
      reply,
      matchType,
      isActive
    });

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all rules
router.get('/', async (req, res) => {
  try {
    const rules = await AutomationRule.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get rule by ID
router.get('/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update rule
router.put('/:id', async (req, res) => {
  try {
    const { keyword, reply, matchType, isActive } = req.body;
    
    const update = {};
    if (keyword) update.keyword = keyword.toLowerCase();
    if (reply) update.reply = reply;
    if (matchType) update.matchType = matchType;
    if (typeof isActive === 'boolean') update.isActive = isActive;
    update.updatedAt = new Date();

    const rule = await AutomationRule.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete rule
router.delete('/:id', async (req, res) => {
  try {
    const rule = await AutomationRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    res.json({
      success: true,
      message: 'Rule deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Toggle rule status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const rule = await AutomationRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({
        success: false,
        error: 'Rule not found'
      });
    }

    rule.isActive = !rule.isActive;
    rule.updatedAt = new Date();
    await rule.save();

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
