const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const logger = require('../logger');
const jwt = require('jsonwebtoken');
const { permissions } = require('../middleware/permissions');
require('dotenv').config();
const fetch = require('node-fetch');

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

// Get all tasks (protected with view permission)
router.get('/', authenticateToken, permissions.viewTasks, async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get task by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task (protected with create permission)
router.post('/', authenticateToken, permissions.createTask, async (req, res) => {
  try {
    const task = new Task(req.body);
    const newTask = await task.save();
    
    // Create notification for task assignment
    if (newTask.assigneeId && newTask.assigneeId !== newTask.createdBy) {
      try {
        const Notification = require('../models/Notification');
        const notification = new Notification({
          userId: newTask.assigneeId,
          title: "مهمة جديدة مسندة إليك",
          message: `تم إسناد مهمة جديدة إليك: "${newTask.title}"`,
          type: "task",
          isRead: false,
          actionUrl: `/tasks`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await notification.save();
        logger.info('Notification created for task assignment', { 
          taskId: newTask.id, 
          assigneeId: newTask.assigneeId,
          notificationId: notification._id 
        }, 'TASKS');
      } catch (notificationError) {
        logger.error('Failed to create notification for task assignment', { 
          error: notificationError.message,
          taskId: newTask.id 
        }, 'TASKS');
      }
    }
    
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'create',
          data: newTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'TASKS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'TASKS');
    }
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update task (protected with edit permission)
router.put('/:id', authenticateToken, permissions.editTask, async (req, res) => {
  try {
    // Get the original task to compare assignee
    const originalTask = await Task.findById(req.params.id);
    if (!originalTask) return res.status(404).json({ success: false, error: 'Task not found' });
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    // Create notification if assignee changed
    if (originalTask.assigneeId !== updatedTask.assigneeId && updatedTask.assigneeId) {
      try {
        const Notification = require('../models/Notification');
        const notification = new Notification({
          userId: updatedTask.assigneeId,
          title: "مهمة مسندة إليك",
          message: `تم إسناد مهمة إليك: "${updatedTask.title}"`,
          type: "task",
          isRead: false,
          actionUrl: `/tasks`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await notification.save();
        logger.info('Notification created for task reassignment', { 
          taskId: updatedTask.id, 
          assigneeId: updatedTask.assigneeId,
          notificationId: notification._id 
        }, 'TASKS');
      } catch (notificationError) {
        logger.error('Failed to create notification for task reassignment', { 
          error: notificationError.message,
          taskId: updatedTask.id 
        }, 'TASKS');
      }
    }
    
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'update',
          data: updatedTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'TASKS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'TASKS');
    }
    res.json({ success: true, data: updatedTask });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete task (protected with delete permission)
router.delete('/:id', authenticateToken, permissions.deleteTask, async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ success: false, error: 'Task not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          action: 'delete',
          data: deletedTask,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      console.log('Broadcast response:', await broadcastResponse.json());
    } catch (broadcastError) {
      console.error('Broadcast error:', broadcastError);
    }
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 