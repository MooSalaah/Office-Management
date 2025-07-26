const express = require('express');
const router = express.Router();
const UpcomingPayment = require('../models/UpcomingPayment');
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

// Get all upcoming payments (protected with view permission)
router.get('/', authenticateToken, permissions.viewFinance, async (req, res) => {
  try {
    const payments = await UpcomingPayment.find();
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new upcoming payment (protected with create permission)
router.post('/', authenticateToken, permissions.createTransaction, async (req, res) => {
  try {
    const payment = new UpcomingPayment(req.body);
    const newPayment = await payment.save();
    res.status(201).json({ success: true, data: newPayment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update upcoming payment (protected with edit permission)
router.put('/:id', authenticateToken, permissions.editTransaction, async (req, res) => {
  try {
    const updatedPayment = await UpcomingPayment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPayment) return res.status(404).json({ success: false, error: 'Upcoming payment not found' });
    res.json({ success: true, data: updatedPayment });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete upcoming payment (protected with delete permission)
router.delete('/:id', authenticateToken, permissions.deleteTransaction, async (req, res) => {
  try {
    const deletedPayment = await UpcomingPayment.findByIdAndDelete(req.params.id);
    if (!deletedPayment) return res.status(404).json({ success: false, error: 'Upcoming payment not found' });
    res.json({ success: true, message: 'Upcoming payment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 