import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import {
  hashPassword,
  signToken,
  setSessionCookie,
  clearSessionCookie,
  anyAuthMiddleware,
  parentAuthMiddleware,
} from '../middleware/auth';
import { User, Child } from '../../shared/types';

export const authRoutes = new Hono<{
  Bindings: Env;
  Variables: {
    user?: User;
    child?: Child;
    sessionRole?: 'parent' | 'admin' | 'child';
    parentId?: string;
  };
}>();

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

    const totalUsers = await db.first<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const role = (totalUsers?.count === 0 || cleanEmail === 'eng.gumaan@gmail.com') ? 'admin' : 'parent';

    // Insert user
    await db.run(
      'INSERT INTO users (id, name, email, password_hash, role, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      userId, name.trim(), cleanEmail, passwordHash, role, now, now
    );

    // Populate initial parent_words relation with default approved words
    await db.run(
      `INSERT OR IGNORE INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
       SELECT 'pw_' || ? || '_' || id, ?, id, ?, 1, 'curated'
       FROM words WHERE status = 'approved'`,
      userId, userId, now
    );

    const token = await signToken({ sub: userId, role }, c.env.JWT_SECRET);
    setSessionCookie(c, token);

    const user: User = { id: userId, name: name.trim(), email: cleanEmail, role, created_at: now };

    return c.json({
      success: true,
      token,
      role,
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
    setSessionCookie(c, token);

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
      role: userRow.role,
      user,
      message: 'تم تسجيل الدخول بنجاح'
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'حدث خطأ أثناء تسجيل الدخول' }, 500);
  }
});

// Child Login via simple numeric code (4 digits)
// Section 3: Unique numeric login code, Rate limiting on IP, creates child session
authRoutes.post('/child-login', async (c) => {
  try {
    const { login_code } = await c.req.json();
    if (!login_code || typeof login_code !== 'string') {
      return c.json({ success: false, error: 'يرجى إدخال رمز الدخول الرقمي' }, 400);
    }

    const cleanCode = login_code.trim();
    const clientIp = c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown-ip';
    const now = Date.now();
    const db = new DbHelper(c.env.DB);

    // 1. Rate Limiting Check
    const rateLimit = await db.first<any>('SELECT * FROM login_rate_limits WHERE ip = ?', clientIp);
    if (rateLimit && rateLimit.locked_until > now) {
      const waitSeconds = Math.ceil((rateLimit.locked_until - now) / 1000);
      return c.json({
        success: false,
        error: `محاولات دخول خاطئة متكررة. يرجى الانتظار لمدة ${waitSeconds} ثانية`
      }, 429);
    }

    // 2. Query child by unique local_code (matching direct, padded to 4 digits, or unpadded)
    const unpaddedCode = cleanCode.replace(/^0+/, '');
    const paddedCode = cleanCode.padStart(4, '0');
    const child = await db.first<Child>(
      'SELECT * FROM children WHERE local_code = ? OR local_code = ? OR local_code = ?',
      cleanCode, paddedCode, unpaddedCode
    );

    if (!child) {
      // Record failed attempt
      const attempts = (rateLimit?.attempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? now + (15 * 60 * 1000) : 0; // Lock 15 mins after 5 failed attempts
      await db.run(
        `INSERT INTO login_rate_limits (ip, attempts, locked_until, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(ip) DO UPDATE SET attempts = ?, locked_until = ?, updated_at = ?`,
        clientIp, attempts, lockedUntil, now, attempts, lockedUntil, now
      );

      return c.json({ success: false, error: 'الرمز غير صحيح، تأكد من إدخال الأرقام الصحيحة' }, 401);
    }

    // 3. Reset rate limit on success
    if (rateLimit) {
      await db.run('DELETE FROM login_rate_limits WHERE ip = ?', clientIp);
    }

    // 4. Update child last login / updated_at
    await db.run('UPDATE children SET updated_at = ? WHERE id = ?', new Date().toISOString(), child.id);

    // 5. Generate child JWT session
    const token = await signToken(
      {
        sub: child.id,
        role: 'child',
        parentId: child.user_id,
      },
      c.env.JWT_SECRET
    );

    // 6. Set HttpOnly Cookie
    setSessionCookie(c, token);

    return c.json({
      success: true,
      token,
      role: 'child',
      child: {
        id: child.id,
        display_name: child.display_name,
        photo_url: child.photo_url,
        current_level: child.current_level,
        total_points: child.total_points,
      },
      message: `أهلاً بك يا ${child.display_name}!`
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'فشل تسجيل دخول الطفل' }, 500);
  }
});

// GET /api/auth/me: identifies session on refresh and returns role and data
authRoutes.get('/me', anyAuthMiddleware, async (c) => {
  const role = c.get('sessionRole');

  if (role === 'child') {
    const child = c.get('child');
    return c.json({
      success: true,
      authenticated: true,
      role: 'child',
      child: {
        id: child!.id,
        display_name: child!.display_name,
        photo_url: child!.photo_url,
        current_level: child!.current_level,
        total_points: child!.total_points,
      },
    });
  }

  if (role === 'parent' || role === 'admin') {
    const user = c.get('user');
    return c.json({
      success: true,
      authenticated: true,
      role: 'parent',
      user,
    });
  }

  return c.json({
    success: false,
    authenticated: false,
    role: null,
  }, 401);
});

// Logout: clears session cookie
authRoutes.post('/logout', async (c) => {
  clearSessionCookie(c);
  return c.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
});
