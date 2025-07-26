const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
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

// Get all transactions (protected with view permission)
router.get('/', authenticateToken, permissions.viewFinance, async (req, res) => {
  try {
    const transactions = await Transaction.find();
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new transaction (protected with create permission)
router.post('/', authenticateToken, permissions.createTransaction, async (req, res) => {
  try {
    const transaction = new Transaction(req.body);
    const newTransaction = await transaction.save();
    res.status(201).json({ success: true, data: newTransaction });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update transaction (protected with edit permission)
router.put('/:id', authenticateToken, permissions.editTransaction, async (req, res) => {
  try {
    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedTransaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, data: updatedTransaction });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete transaction (protected with delete permission)
router.delete('/:id', authenticateToken, permissions.deleteTransaction, async (req, res) => {
  try {
    const deletedTransaction = await Transaction.findByIdAndDelete(req.params.id);
    if (!deletedTransaction) return res.status(404).json({ success: false, error: 'Transaction not found' });
    res.json({ success: true, message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 