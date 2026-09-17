import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';
import { User, Child } from '../../shared/types';

export const childrenRoutes = new Hono<{ Bindings: Env; Variables: { user: User } }>();

// Get children for parent dashboard (requires auth)
childrenRoutes.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const db = new DbHelper(c.env.DB);

  const children = await db.query<Child>(
    'SELECT * FROM children WHERE user_id = ? ORDER BY created_at ASC',
    user.id
  );

  return c.json({ success: true, children });
});

// Public / Trusted device list: get children for child selection screen
// Allowed by specifying userId via query or session, or returning available profiles for local household
childrenRoutes.get('/family-profiles', optionalAuthMiddleware, async (c) => {
  const db = new DbHelper(c.env.DB);
  const user = c.get('user');
  const userId = user?.id || c.req.query('userId');

  let query = 'SELECT id, display_name, photo_url, current_level, total_points, (local_code IS NOT NULL AND local_code != "") as has_pin FROM children';
  let params: any[] = [];

  if (userId) {
    query += ' WHERE user_id = ?';
    params.push(userId);
  }
  query += ' ORDER BY created_at ASC';

  const profiles = await db.query<any>(query, ...params);
  return c.json({ success: true, profiles });
});

// Verify child local PIN
childrenRoutes.post('/:id/verify-pin', async (c) => {
  const childId = c.req.param('id');
  const { pin } = await c.req.json();
  const db = new DbHelper(c.env.DB);

  const child = await db.first<any>('SELECT * FROM children WHERE id = ?', childId);
  if (!child) {
    return c.json({ success: false, error: 'لم يتم العثور على الملف الشخصي للطفل' }, 404);
  }

  if (!child.local_code || child.local_code === '' || child.local_code === pin) {
    return c.json({
      success: true,
      child: {
        id: child.id,
        user_id: child.user_id,
        display_name: child.display_name,
        photo_url: child.photo_url,
        current_level: child.current_level,
        total_points: child.total_points,
      }
    });
  }

  return c.json({ success: false, error: 'الرمز غير صحيح' }, 401);
});

// Create child (Parent only)
childrenRoutes.post('/', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { display_name, age_or_birth_year, gender_optional, photo_url, local_code, current_level } = body;

  if (!display_name || !display_name.trim()) {
    return c.json({ success: false, error: 'اسم الطفل مطلوب' }, 400);
  }

  const childId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const level = Number(current_level) || 1;

  const db = new DbHelper(c.env.DB);
  await db.run(
    `INSERT INTO children (id, user_id, display_name, age_or_birth_year, gender_optional, photo_url, local_code, current_level, total_points, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    childId, user.id, display_name.trim(), age_or_birth_year || null, gender_optional || null, photo_url || null, local_code || null, level, now, now
  );

  const child: Child = {
    id: childId,
    user_id: user.id,
    display_name: display_name.trim(),
    age_or_birth_year: age_or_birth_year || undefined,
    gender_optional: gender_optional || undefined,
    photo_url: photo_url || undefined,
    local_code: local_code || undefined,
    current_level: level,
    total_points: 0,
    created_at: now,
    updated_at: now,
  };

  return c.json({ success: true, child, message: 'تمت إضافة الطفل بنجاح' });
});

// Update child (Parent only)
childrenRoutes.patch('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const childId = c.req.param('id');
  const body = await c.req.json();
  const db = new DbHelper(c.env.DB);

  const existing = await db.first<Child>('SELECT * FROM children WHERE id = ? AND user_id = ?', childId, user.id);
  if (!existing) {
    return c.json({ success: false, error: 'غير مصرح أو الملف غير موجود' }, 404);
  }

  const displayName = body.display_name !== undefined ? body.display_name.trim() : existing.display_name;
  const age = body.age_or_birth_year !== undefined ? body.age_or_birth_year : existing.age_or_birth_year;
  const gender = body.gender_optional !== undefined ? body.gender_optional : existing.gender_optional;
  const photo = body.photo_url !== undefined ? body.photo_url : existing.photo_url;
  const code = body.local_code !== undefined ? body.local_code : existing.local_code;
  const level = body.current_level !== undefined ? Number(body.current_level) : existing.current_level;
  const now = new Date().toISOString();

  await db.run(
    `UPDATE children SET display_name = ?, age_or_birth_year = ?, gender_optional = ?, photo_url = ?, local_code = ?, current_level = ?, updated_at = ?
     WHERE id = ?`,
    displayName, age, gender, photo, code, level, now, childId
  );

  return c.json({ success: true, message: 'تم تحديث بيانات الطفل بنجاح' });
});

// Delete child (Parent only)
childrenRoutes.delete('/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const childId = c.req.param('id');
  const db = new DbHelper(c.env.DB);

  const existing = await db.first('SELECT id FROM children WHERE id = ? AND user_id = ?', childId, user.id);
  if (!existing) {
    return c.json({ success: false, error: 'غير مصرح أو الملف غير موجود' }, 404);
  }

  await db.run('DELETE FROM children WHERE id = ?', childId);
  return c.json({ success: true, message: 'تم حذف ملف الطفل بنجاح' });
});
