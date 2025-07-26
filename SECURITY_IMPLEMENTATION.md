# نظام الأمان والصلاحيات - Security & Permissions System

## نظرة عامة
تم تطبيق نظام أمان شامل على التطبيق يتضمن:
1. **JWT Authentication** - التحقق من الهوية
2. **Role-Based Access Control (RBAC)** - التحكم في الصلاحيات حسب الدور
3. **Permission Middleware** - ميدلوير للتحقق من الصلاحيات

## الأدوار والصلاحيات

### 1. مدير النظام (Admin)
- **الصلاحيات**: `all` (جميع الصلاحيات)
- **الوصف**: صلاحيات كاملة على جميع أجزاء النظام

### 2. مهندس (Engineer)
- **الصلاحيات**:
  - `view_projects`, `create_projects`, `edit_projects`, `delete_projects`
  - `view_tasks`, `create_tasks`, `edit_tasks`, `delete_tasks`
  - `view_clients`, `create_clients`, `edit_clients`, `delete_clients`
  - `view_finance`, `view_attendance`
- **الوصف**: إدارة المشاريع والمهام والعملاء

### 3. محاسب (Accountant)
- **الصلاحيات**:
  - `view_finance`, `create_transactions`, `edit_transactions`, `delete_transactions`
  - `view_projects`, `view_tasks`, `view_clients`
- **الوصف**: إدارة المالية والمعاملات

### 4. موارد بشرية (HR)
- **الصلاحيات**:
  - `view_attendance`, `create_attendance`, `edit_attendance`, `delete_attendance`
  - `view_users`, `create_users`, `edit_users`, `delete_users`
  - `view_projects`, `view_tasks`
- **الوصف**: إدارة الحضور والموظفين

### 5. مستخدم عادي (User)
- **الصلاحيات**:
  - `view_projects`, `view_tasks`, `view_clients`
- **الوصف**: صلاحيات محدودة للقراءة فقط

## الملفات المحدثة

### Backend Routes (الراوتات المحمية)
- ✅ `backend/routes/projects.js` - المشاريع
- ✅ `backend/routes/tasks.js` - المهام
- ✅ `backend/routes/clients.js` - العملاء
- ✅ `backend/routes/users.js` - المستخدمين
- ✅ `backend/routes/transactions.js` - المعاملات المالية
- ✅ `backend/routes/upcomingPayments.js` - الدفعات القادمة
- ✅ `backend/routes/attendance.js` - الحضور
- ✅ `backend/routes/notifications.js` - الإشعارات
- ✅ `backend/routes/companySettings.js` - إعدادات الشركة
- ✅ `backend/routes/userSettings.js` - إعدادات المستخدم
- ✅ `backend/routes/taskTypes.js` - أنواع المهام
- ✅ `backend/routes/roles.js` - الأدوار
- ✅ `backend/routes/realtime.js` - الوقت الحقيقي

### Middleware (الميدلوير)
- ✅ `backend/middleware/permissions.js` - نظام الصلاحيات

### Frontend (الواجهة الأمامية)
- ✅ `lib/api.ts` - إضافة التوكن للطلبات

## كيفية الاستخدام

### 1. تسجيل الدخول والحصول على التوكن
```typescript
const response = await api.login({ email, password });
const token = response.data.token;
localStorage.setItem('token', token);
```

### 2. إرسال الطلبات مع التوكن
```typescript
// يتم إرسال التوكن تلقائياً مع كل طلب
const projects = await api.getProjects();
```

### 3. التحقق من الصلاحيات في Backend
```javascript
// في الراوتات
router.post('/', authenticateToken, permissions.createProject, async (req, res) => {
  // الكود هنا
});
```

## الأمان المطبق

### 1. JWT Authentication
- التحقق من صحة التوكن في كل طلب
- رفض الطلبات بدون توكن
- رفض التوكنات المنتهية الصلاحية

### 2. Permission Checking
- التحقق من دور المستخدم
- التحقق من الصلاحيات المطلوبة
- رفض العمليات غير المصرح بها

### 3. CORS Protection
- تكوين CORS محدد للمصادر المسموحة
- حماية من الطلبات غير المصرح بها

## تحديث الصلاحيات

لتحديث صلاحيات الأدوار، قم بتشغيل:
```bash
cd backend
node scripts/update_permissions.js
```

## ملاحظات مهمة

1. **جميع العمليات الحساسة محمية الآن**
2. **المستخدمون الجدد يحتاجون دور مخصص**
3. **التوكن يجب أن يكون صالحاً لكل طلب**
4. **الصلاحيات تتحقق في Backend وليس Frontend فقط**

## اختبار النظام

1. جرب تسجيل الدخول بحساب مختلف
2. تأكد من أن الصلاحيات تعمل بشكل صحيح
3. جرب عمليات غير مصرح بها للتأكد من الحماية 