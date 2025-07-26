const User = require('../models/User');
const Role = require('../models/Role');

// Permission checking middleware
function checkPermission(requiredPermission) {
  return (req, res, next) => {
    // Get user from JWT token (already verified by authenticateToken)
    const userId = req.user.id;
    
    // Find user and populate role
    User.findById(userId).populate('roleId')
      .then(user => {
        if (!user) {
          return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if user has role
        if (!user.roleId) {
          return res.status(403).json({ success: false, error: 'User has no role assigned' });
        }

        const role = user.roleId;
        
        // Check for admin role (has all permissions)
        if (role.permissions.includes('all')) {
          return next();
        }

        // Check for specific permission
        if (role.permissions.includes(requiredPermission)) {
          return next();
        }

        // Permission denied
        return res.status(403).json({ 
          success: false, 
          error: `Permission denied: ${requiredPermission} required` 
        });
      })
      .catch(error => {
        console.error('Permission check error:', error);
        return res.status(500).json({ success: false, error: 'Permission check failed' });
      });
  };
}

// Common permission checks
const permissions = {
  // Project permissions
  createProject: checkPermission('create_projects'),
  editProject: checkPermission('edit_projects'),
  deleteProject: checkPermission('delete_projects'),
  viewProjects: checkPermission('view_projects'),

  // Task permissions
  createTask: checkPermission('create_tasks'),
  editTask: checkPermission('edit_tasks'),
  deleteTask: checkPermission('delete_tasks'),
  viewTasks: checkPermission('view_tasks'),

  // Client permissions
  createClient: checkPermission('create_clients'),
  editClient: checkPermission('edit_clients'),
  deleteClient: checkPermission('delete_clients'),
  viewClients: checkPermission('view_clients'),

  // User permissions
  createUser: checkPermission('create_users'),
  editUser: checkPermission('edit_users'),
  deleteUser: checkPermission('delete_users'),
  viewUsers: checkPermission('view_users'),

  // Finance permissions
  createTransaction: checkPermission('create_transactions'),
  editTransaction: checkPermission('edit_transactions'),
  deleteTransaction: checkPermission('delete_transactions'),
  viewFinance: checkPermission('view_finance'),

  // Attendance permissions
  createAttendance: checkPermission('create_attendance'),
  editAttendance: checkPermission('edit_attendance'),
  deleteAttendance: checkPermission('delete_attendance'),
  viewAttendance: checkPermission('view_attendance'),

  // Settings permissions
  manageSettings: checkPermission('manage_settings'),
  manageRoles: checkPermission('manage_roles'),
  manageTaskTypes: checkPermission('manage_task_types'),

  // Admin permissions
  admin: checkPermission('all')
};

module.exports = { checkPermission, permissions }; 