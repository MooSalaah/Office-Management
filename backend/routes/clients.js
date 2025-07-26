const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const jwt = require('jsonwebtoken');
const { permissions } = require('../middleware/permissions');
const logger = require('../logger');
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

// Get all clients (protected with view permission)
router.get('/', authenticateToken, permissions.viewClients, async (req, res) => {
  try {
    const clients = await Client.find();
    res.json({ success: true, data: clients });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get client by ID (public for testing)
router.get('/:id', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: client });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new client (protected with create permission)
router.post('/', authenticateToken, permissions.createClient, async (req, res) => {
  try {
    const client = new Client(req.body);
    const newClient = await client.save();
    
    // Create notification for new client (notify admin and sales team)
    try {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      
      // Get admin and sales users
      const adminUsers = await User.find({ role: 'admin' });
      const salesUsers = await User.find({ role: 'engineer' }); // Engineers might handle client relations
      
      const usersToNotify = [...adminUsers, ...salesUsers];
      
      for (const user of usersToNotify) {
        const notification = new Notification({
          userId: user.id,
          title: "عميل جديد",
          message: `تم إضافة عميل جديد: "${newClient.name}"`,
          type: "system",
          isRead: false,
          actionUrl: `/clients`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await notification.save();
      }
      
      logger.info('Notifications created for new client', { 
        clientId: newClient.id, 
        notificationsCount: usersToNotify.length 
      }, 'CLIENTS');
    } catch (notificationError) {
      logger.error('Failed to create notifications for new client', { 
        error: notificationError.message,
        clientId: newClient.id 
      }, 'CLIENTS');
    }
    
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          action: 'create',
          data: newClient,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'CLIENTS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }
    res.status(201).json({ success: true, data: newClient });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update client (protected with edit permission)
router.put('/:id', authenticateToken, permissions.editClient, async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedClient) return res.status(404).json({ success: false, error: 'Client not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          action: 'update',
          data: updatedClient,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'CLIENTS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }
    res.json({ success: true, data: updatedClient });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete client (protected with delete permission)
router.delete('/:id', authenticateToken, permissions.deleteClient, async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ success: false, error: 'Client not found' });
    // Broadcast update to all clients
    try {
      const broadcastResponse = await fetch(`${req.protocol}://${req.get('host')}/api/realtime/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'client',
          action: 'delete',
          data: deletedClient,
          userId: req.user ? req.user.id : 'system',
          timestamp: Date.now()
        })
      });
      logger.info('Broadcast response', { response: await broadcastResponse.json() }, 'CLIENTS');
    } catch (broadcastError) {
      logger.error('Broadcast error', { error: broadcastError.message }, 'CLIENTS');
    }
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 