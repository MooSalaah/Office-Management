const express = require('express');
const router = express.Router();
const Role = require('../models/Role');
const logger = require('../logger');
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

// Get all roles (public for reading)
router.get('/', async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Seed default roles (protected with manage roles permission)
router.post('/seed', authenticateToken, permissions.manageRoles, async (req, res) => {
  try {
    const defaultRoles = [
      {
        id: '1',
        name: 'admin',
        description: 'مدير النظام - صلاحيات كاملة',
        permissions: ['all'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'engineer',
        description: 'مهندس - إدارة المشاريع والمهام',
        permissions: ['projects', 'tasks', 'clients', 'view_finance'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'accountant',
        description: 'محاسب - إدارة المالية والمعاملات',
        permissions: ['finance', 'transactions', 'reports'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'hr',
        description: 'موارد بشرية - إدارة الحضور والموظفين',
        permissions: ['attendance', 'users', 'reports'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'user',
        description: 'مستخدم عادي - صلاحيات محدودة',
        permissions: ['view_projects', 'view_tasks'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const createdRoles = [];
    
    for (const roleData of defaultRoles) {
      // Check if role already exists
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = new Role(roleData);
        const savedRole = await role.save();
        createdRoles.push(savedRole);
        logger.info(`Created role: ${roleData.name}`, { roleId: savedRole._id }, 'ROLES');
      } else {
        createdRoles.push(existingRole);
        logger.info(`Role already exists: ${roleData.name}`, { roleId: existingRole._id }, 'ROLES');
      }
    }

    res.json({ 
      success: true, 
      message: `تم إنشاء/تحديث ${createdRoles.length} دور`,
      data: createdRoles 
    });
  } catch (err) {
    logger.error('Error seeding roles', { error: err.message }, 'ROLES');
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new role (protected with manage roles permission)
router.post('/', authenticateToken, permissions.manageRoles, async (req, res) => {
  try {
    console.log('=== CREATE ROLE REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, description, permissions } = req.body;
    
    // Validate required fields
    if (!name || !permissions) {
      console.log('Missing required fields:', { name, permissions });
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, permissions' 
      });
    }
    
    // Check if role with same name already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      console.log('Role already exists:', name);
      return res.status(400).json({ 
        success: false, 
        error: 'Role with this name already exists' 
      });
    }
    
    const roleData = {
      name,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    console.log('Creating role with data:', JSON.stringify(roleData, null, 2));
    
    const role = new Role(roleData);
    const newRole = await role.save();
    
    console.log('Role created successfully:', newRole._id);
    res.status(201).json({ success: true, data: newRole });
  } catch (err) {
    console.error('Error creating role:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update role (protected with manage roles permission)
router.put('/:id', authenticateToken, permissions.manageRoles, async (req, res) => {
  try {
    console.log('=== UPDATE ROLE REQUEST ===');
    console.log('Role ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, description, permissions } = req.body;
    
    // Validate required fields
    if (!name || !permissions) {
      console.log('Missing required fields:', { name, permissions });
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, permissions' 
      });
    }
    
    // Check if role exists
    const existingRole = await Role.findById(req.params.id);
    if (!existingRole) {
      console.log('Role not found:', req.params.id);
      return res.status(404).json({ success: false, error: 'Role not found' });
    }
    
    // Check if name is being changed and if new name already exists
    if (name !== existingRole.name) {
      const roleWithSameName = await Role.findOne({ name, _id: { $ne: req.params.id } });
      if (roleWithSameName) {
        console.log('Role with new name already exists:', name);
        return res.status(400).json({ 
          success: false, 
          error: 'Role with this name already exists' 
        });
      }
    }
    
    const updateData = {
      name,
      description: description || '',
      permissions: Array.isArray(permissions) ? permissions : [],
      updatedAt: new Date().toISOString()
    };
    
    console.log('Updating role with data:', JSON.stringify(updateData, null, 2));
    
    const updatedRole = await Role.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    console.log('Role updated successfully:', updatedRole._id);
    res.json({ success: true, data: updatedRole });
  } catch (err) {
    console.error('Error updating role:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete role (protected with manage roles permission)
router.delete('/:id', authenticateToken, permissions.manageRoles, async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) return res.status(404).json({ success: false, error: 'Role not found' });
    res.json({ success: true, message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 