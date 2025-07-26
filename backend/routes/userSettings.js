const express = require('express');
const router = express.Router();
const UserSettings = require('../models/UserSettings');
const jwt = require('jsonwebtoken');
const { permissions } = require('../middleware/permissions');

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// Get user settings by userId (protected with view permission)
router.get('/:userId', authenticateToken, permissions.viewUsers, async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.params.userId });
    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create or update user settings (protected with edit permission)
router.post('/', authenticateToken, permissions.editUser, async (req, res) => {
  try {
    let settings = await UserSettings.findOne({ userId: req.body.userId });
    if (settings) {
      Object.assign(settings, req.body);
      await settings.save();
    } else {
      settings = new UserSettings(req.body);
      await settings.save();
    }
    res.status(201).json({ success: true, data: settings });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router; 