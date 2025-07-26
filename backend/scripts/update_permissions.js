const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/office-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Updated permissions for each role
const updatedRoles = [
  {
    name: 'admin',
    description: 'مدير النظام - صلاحيات كاملة',
    permissions: ['all'],
  },
  {
    name: 'engineer',
    description: 'مهندس - إدارة المشاريع والمهام',
    permissions: [
      'view_projects', 'create_projects', 'edit_projects', 'delete_projects',
      'view_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks',
      'view_clients', 'create_clients', 'edit_clients', 'delete_clients',
      'view_finance', 'view_attendance'
    ],
  },
  {
    name: 'accountant',
    description: 'محاسب - إدارة المالية والمعاملات',
    permissions: [
      'view_finance', 'create_transactions', 'edit_transactions', 'delete_transactions',
      'view_projects', 'view_tasks', 'view_clients'
    ],
  },
  {
    name: 'hr',
    description: 'موارد بشرية - إدارة الحضور والموظفين',
    permissions: [
      'view_attendance', 'create_attendance', 'edit_attendance', 'delete_attendance',
      'view_users', 'create_users', 'edit_users', 'delete_users',
      'view_projects', 'view_tasks'
    ],
  },
  {
    name: 'user',
    description: 'مستخدم عادي - صلاحيات محدودة',
    permissions: [
      'view_projects', 'view_tasks', 'view_clients'
    ],
  }
];

async function updatePermissions() {
  try {
    console.log('=== UPDATING ROLE PERMISSIONS ===');
    
    for (const roleData of updatedRoles) {
      console.log(`Updating role: ${roleData.name}`);
      
      // Find existing role
      const existingRole = await Role.findOne({ name: roleData.name });
      
      if (existingRole) {
        // Update existing role
        existingRole.permissions = roleData.permissions;
        existingRole.description = roleData.description;
        existingRole.updatedAt = new Date().toISOString();
        
        await existingRole.save();
        console.log(`✅ Updated role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      } else {
        // Create new role
        const newRole = new Role({
          ...roleData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        await newRole.save();
        console.log(`✅ Created new role: ${roleData.name} with ${roleData.permissions.length} permissions`);
      }
    }
    
    console.log('=== PERMISSIONS UPDATE COMPLETED ===');
    
    // Display all roles
    const allRoles = await Role.find();
    console.log('\nCurrent roles in database:');
    allRoles.forEach(role => {
      console.log(`- ${role.name}: ${role.permissions.join(', ')}`);
    });
    
  } catch (error) {
    console.error('Error updating permissions:', error);
  } finally {
    mongoose.connection.close();
  }
}

updatePermissions(); 