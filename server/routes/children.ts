import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { parentAuthMiddleware, childAuthMiddleware } from '../middleware/auth';
import { User, Child } from '../../shared/types';

export const childrenRoutes = new Hono<{
  Bindings: Env;
  Variables: { user?: User; child?: Child; parentId?: string };
}>();

// Helper to generate a unique 4-digit login code
async function generateUniqueLoginCode(db: DbHelper): Promise<string> {
  let attempts = 0;
  while (attempts < 30) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const existing = await db.first('SELECT id FROM children WHERE local_code = ?', code);
    if (!existing) {
      return code;
    }
    attempts++;
  }
  // Fallback to 5-digit if 4-digit space has collision
  return Math.floor(10000 + Math.random() * 90000).toString();
}

// Get children for parent dashboard (Parent only)
// Strictly filtered by authenticated parent session ID
childrenRoutes.get('/', parentAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const db = new DbHelper(c.env.DB);

  const rawChildren = await db.query<Child>(
    'SELECT id, user_id, display_name, age_or_birth_year, gender_optional, photo_url, local_code, current_level, total_points, created_at, updated_at FROM children WHERE user_id = ? ORDER BY created_at ASC',
    user.id
  );

  const children = rawChildren.map(ch => ({
    ...ch,
    local_code: ch.local_code ? ch.local_code.padStart(4, '0') : ch.local_code,
  }));

  return c.json({ success: true, children });
});

// Current authenticated child info (Child only)
childrenRoutes.get('/current', childAuthMiddleware, async (c) => {
  const child = c.get('child')!;
  return c.json({
    success: true,
    child: {
      id: child.id,
      display_name: child.display_name,
      photo_url: child.photo_url,
      current_level: child.current_level,
      total_points: child.total_points,
    }
  });
});

// Create child (Parent only)
childrenRoutes.post('/', parentAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json();
  const { display_name, age_or_birth_year, gender_optional, photo_url, local_code, current_level } = body;

  if (!display_name || !display_name.trim()) {
    return c.json({ success: false, error: 'اسم الطفل مطلوب' }, 400);
  }

  const db = new DbHelper(c.env.DB);
  let finalCode = (local_code && String(local_code).trim()) || '';

  // Check custom code uniqueness if provided, or generate a random unique 4-digit code
  if (finalCode) {
    const existingCode = await db.first('SELECT id FROM children WHERE local_code = ?', finalCode);
    if (existingCode) {
      return c.json({ success: false, error: 'هذا الرمز مستخدم لطفل آخر، اختر رمزاً مختلفاً' }, 409);
    }
  } else {
    finalCode = await generateUniqueLoginCode(db);
  }

  const childId = `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const level = Number(current_level) || 1;

  try {
    await db.run(
      `INSERT INTO children (id, user_id, display_name, age_or_birth_year, gender_optional, photo_url, local_code, current_level, total_points, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      childId, user.id, display_name.trim(), age_or_birth_year || null, gender_optional || null, photo_url || null, finalCode, level, now, now
    );
  } catch (err: any) {
    // If unique constraint collision occurred, retry with newly generated code
    finalCode = await generateUniqueLoginCode(db);
    await db.run(
      `INSERT INTO children (id, user_id, display_name, age_or_birth_year, gender_optional, photo_url, local_code, current_level, total_points, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      childId, user.id, display_name.trim(), age_or_birth_year || null, gender_optional || null, photo_url || null, finalCode, level, now, now
    );
  }

  const child: Child = {
    id: childId,
    user_id: user.id,
    display_name: display_name.trim(),
    age_or_birth_year: age_or_birth_year || undefined,
    gender_optional: gender_optional || undefined,
    photo_url: photo_url || undefined,
    local_code: finalCode,
    current_level: level,
    total_points: 0,
    created_at: now,
    updated_at: now,
  };

  return c.json({ success: true, child, message: 'تمت إضافة الطفل بنجاح' });
});

// Update child (Parent only)
childrenRoutes.patch('/:id', parentAuthMiddleware, async (c) => {
  const user = c.get('user')!;
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
  const level = body.current_level !== undefined ? Number(body.current_level) : existing.current_level;
  let code = existing.local_code;

  if (body.local_code !== undefined && body.local_code !== existing.local_code) {
    const newCode = String(body.local_code).trim();
    if (newCode) {
      const existingCode = await db.first('SELECT id FROM children WHERE local_code = ? AND id != ?', newCode, childId);
      if (existingCode) {
        return c.json({ success: false, error: 'رمز الدخول هذا مستخدم بالفعل لطفل آخر' }, 409);
      }
      code = newCode;
    }
  }

  const now = new Date().toISOString();

  await db.run(
    `UPDATE children SET display_name = ?, age_or_birth_year = ?, gender_optional = ?, photo_url = ?, local_code = ?, current_level = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    displayName, age, gender, photo, code, level, now, childId, user.id
  );

  return c.json({ success: true, message: 'تم تحديث بيانات الطفل بنجاح', local_code: code });
});

// Delete child (Parent only)
childrenRoutes.delete('/:id', parentAuthMiddleware, async (c) => {
  const user = c.get('user')!;
  const childId = c.req.param('id');
  const db = new DbHelper(c.env.DB);

  const existing = await db.first('SELECT id FROM children WHERE id = ? AND user_id = ?', childId, user.id);
  if (!existing) {
    return c.json({ success: false, error: 'غير مصرح أو الملف غير موجود' }, 404);
  }

  await db.run('DELETE FROM children WHERE id = ? AND user_id = ?', childId, user.id);
  return c.json({ success: true, message: 'تم حذف ملف الطفل بنجاح' });
});
