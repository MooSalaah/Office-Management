const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
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

// Get all notifications (protected with view permission)
router.get('/', authenticateToken, permissions.viewUsers, async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new notification (protected with create permission)
router.post('/', authenticateToken, permissions.createUser, async (req, res) => {
  try {
    const notification = new Notification(req.body);
    const newNotification = await notification.save();
    res.status(201).json({ success: true, data: newNotification });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update notification (protected with edit permission)
router.put('/:id', authenticateToken, permissions.editUser, async (req, res) => {
  try {
    const updatedNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedNotification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, data: updatedNotification });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete notification (protected with delete permission)
router.delete('/:id', authenticateToken, permissions.deleteUser, async (req, res) => {
  try {
    const deletedNotification = await Notification.findByIdAndDelete(req.params.id);
    if (!deletedNotification) return res.status(404).json({ success: false, error: 'Notification not found' });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 