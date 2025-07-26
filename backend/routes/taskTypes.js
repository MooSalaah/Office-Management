const express = require('express');
const router = express.Router();
const TaskType = require('../models/TaskType');
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

// Get all task types (public for reading)
router.get('/', async (req, res) => {
  try {
    console.log('=== GET TASK TYPES REQUEST ===');
    const types = await TaskType.find();
    console.log(`Found ${types.length} task types`);
    res.json({ success: true, data: types });
  } catch (err) {
    console.error('Error getting task types:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new task type (protected with manage permission)
router.post('/', authenticateToken, permissions.manageTaskTypes, async (req, res) => {
  try {
    const type = new TaskType(req.body);
    const newType = await type.save();
    res.status(201).json({ success: true, data: newType });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update task type (protected with manage permission)
router.put('/:id', authenticateToken, permissions.manageTaskTypes, async (req, res) => {
  try {
    const updatedType = await TaskType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedType) return res.status(404).json({ success: false, error: 'TaskType not found' });
    res.json({ success: true, data: updatedType });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete task type (protected with manage permission)
router.delete('/:id', authenticateToken, permissions.manageTaskTypes, async (req, res) => {
  try {
    const deletedType = await TaskType.findByIdAndDelete(req.params.id);
    if (!deletedType) return res.status(404).json({ success: false, error: 'TaskType not found' });
    res.json({ success: true, message: 'TaskType deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Seed default task types (protected with manage permission)
router.post('/seed', authenticateToken, permissions.manageTaskTypes, async (req, res) => {
  try {
    const defaultTaskTypes = [
      { name: "رسم مخططات معمارية", description: "رسم المخططات المعمارية الأساسية للمشروع", isDefault: true },
      { name: "قرار مساحي", description: "إعداد القرار المساحي للمشروع", isDefault: true },
      { name: "عمل فكرة مخطط معماري", description: "تطوير الفكرة الأولية للمخطط المعماري", isDefault: true },
      { name: "مخطط سلامة", description: "إعداد مخطط السلامة للمشروع", isDefault: true },
      { name: "رفع الرخصة", description: "رفع طلب الرخصة البلدية", isDefault: true },
      { name: "مخطط انشائي", description: "إعداد المخططات الإنشائية", isDefault: true },
      { name: "منظور 3D", description: "إنشاء منظور ثلاثي الأبعاد للمشروع", isDefault: true },
      { name: "ربط الرخصة", description: "ربط الرخصة مع الجهات المختصة", isDefault: true },
      { name: "تقرير فني الكتروني", description: "إعداد تقرير فني الكتروني للمشروع", isDefault: true },
      { name: "اضافة وتعديل مكونات البناء", description: "إضافة أو تعديل مكونات البناء في المشروع", isDefault: true },
      { name: "شهادة انهاء اعمال السلامة", description: "إصدار شهادة إنهاء أعمال السلامة", isDefault: true },
      { name: "مطابقة مخططات السلامة", description: "مطابقة مخططات السلامة مع المتطلبات", isDefault: true },
      { name: "رفع تقارير الاشراف", description: "رفع تقارير الإشراف الدورية", isDefault: true },
      { name: "الاشراف على الرخصة", description: "الإشراف على الرخصة أثناء التنفيذ", isDefault: true },
      { name: "شهادة اشغال", description: "إصدار شهادة إشغال للمشروع", isDefault: true },
      { name: "فرز", description: "إجراءات فرز الوحدات أو الأراضي", isDefault: true },
      { name: "مخطط طاقة استيعابية", description: "إعداد مخطط الطاقة الاستيعابية للمشروع", isDefault: true },
      { name: "تقرير اسكان حجاج", description: "إعداد تقرير إسكان الحجاج", isDefault: true },
      { name: "تقرير سلامة فوري", description: "إعداد تقرير سلامة فوري للمشروع", isDefault: true },
      { name: "تقرير سلامة غير فوري", description: "إعداد تقرير سلامة غير فوري للمشروع", isDefault: true },
      { name: "رخصة تسوير", description: "إصدار رخصة تسوير للموقع", isDefault: true },
      { name: "رخصة بناء", description: "إصدار رخصة بناء للمشروع", isDefault: true }
    ];
    const now = new Date().toISOString();
    const withTimestamps = defaultTaskTypes.map(t => ({ ...t, createdAt: now, updatedAt: now }));
    // Clear existing default task types
    await TaskType.deleteMany({ isDefault: true });
    // Insert new default task types
    const insertedTaskTypes = await TaskType.insertMany(withTimestamps);
    res.json({ 
      success: true, 
      message: 'Default task types seeded successfully',
      data: insertedTaskTypes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router; 