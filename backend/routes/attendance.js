const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
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

// Get all attendance records (protected with view permission)
router.get('/', authenticateToken, permissions.viewAttendance, async (req, res) => {
  try {
    const records = await Attendance.find();
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new attendance record (protected with create permission)
router.post('/', authenticateToken, permissions.createAttendance, async (req, res) => {
  try {
    const record = new Attendance(req.body);
    const newRecord = await record.save();
    res.status(201).json({ success: true, data: newRecord });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update attendance record (protected with edit permission)
router.put('/:id', authenticateToken, permissions.editAttendance, async (req, res) => {
  try {
    const updatedRecord = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedRecord) return res.status(404).json({ success: false, error: 'Attendance record not found' });
    res.json({ success: true, data: updatedRecord });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete attendance record (protected with delete permission)
router.delete('/:id', authenticateToken, permissions.deleteAttendance, async (req, res) => {
  try {
    const deletedRecord = await Attendance.findByIdAndDelete(req.params.id);
    if (!deletedRecord) return res.status(404).json({ success: false, error: 'Attendance record not found' });
    res.json({ success: true, message: 'Attendance record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 