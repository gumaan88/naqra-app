import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { authMiddleware, hashPassword, signToken } from '../middleware/auth';
import { User } from '../../shared/types';

export const authRoutes = new Hono<{ Bindings: Env; Variables: { user: User } }>();

// Register new parent account
authRoutes.post('/register', async (c) => {
  try {
    const { name, email, password } = await c.req.json();
    if (!name || !email || !password) {
      return c.json({ success: false, error: 'جميع الحقول مطلوبة: الاسم، البريد، كلمة المرور' }, 400);
    }

    if (password.length < 6) {
      return c.json({ success: false, error: 'يجب ألا تقل كلمة المرور عن 6 أحرف' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = new DbHelper(c.env.DB);

    const existing = await db.first('SELECT id FROM users WHERE email = ?', cleanEmail);
    if (existing) {
      return c.json({ success: false, error: 'هذا البريد الإلكتروني مسجل مسبقاً' }, 409);
    }

    const userId = `u_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    // Check if first user -> can be admin, otherwise parent
    const totalUsers = await db.first<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const role = (totalUsers?.count === 0 || cleanEmail === 'eng.gumaan@gmail.com') ? 'admin' : 'parent';

    await db.run(
      'INSERT INTO users (id, name, email, password_hash, role, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      userId, name.trim(), cleanEmail, passwordHash, role, now, now
    );

    const token = await signToken({ sub: userId, role }, c.env.JWT_SECRET);
    const user: User = { id: userId, name: name.trim(), email: cleanEmail, role, created_at: now };

    return c.json({
      success: true,
      token,
      user,
      message: 'تم إنشاء الحساب بنجاح'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'حدث خطأ أثناء التسجيل' }, 500);
  }
});

// Login parent or admin
authRoutes.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) {
      return c.json({ success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' }, 400);
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = new DbHelper(c.env.DB);

    const userRow = await db.first<any>('SELECT * FROM users WHERE email = ?', cleanEmail);
    if (!userRow) {
      return c.json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
    }

    const inputHash = await hashPassword(password);
    if (inputHash !== userRow.password_hash) {
      return c.json({ success: false, error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, 401);
    }

    const now = new Date().toISOString();
    await db.run('UPDATE users SET last_login_at = ? WHERE id = ?', now, userRow.id);

    const token = await signToken({ sub: userRow.id, role: userRow.role }, c.env.JWT_SECRET);
    const user: User = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
      created_at: userRow.created_at,
      last_login_at: now
    };

    return c.json({
      success: true,
      token,
      user,
      message: 'تم تسجيل الدخول بنجاح'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'حدث خطأ أثناء تسجيل الدخول' }, 500);
  }
});

// Current authenticated user
authRoutes.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  return c.json({ success: true, user });
});

// Logout
authRoutes.post('/logout', async (c) => {
  return c.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});
