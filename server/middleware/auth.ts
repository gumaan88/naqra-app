import { MiddlewareHandler, Context } from 'hono';
import { Env, DbHelper } from '../db';
import { User, Child } from '../../shared/types';

const DEFAULT_SECRET = 'naqra-platform-production-secret-key-2026';

// Sign token using Web Crypto HMAC-SHA256
export async function signToken(payload: any, secret: string = DEFAULT_SECRET): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encHeader = btoa(JSON.stringify(header));
  const encPayload = btoa(JSON.stringify({ ...payload, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 })); // 30 days
  const data = `${encHeader}.${encPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  const encSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${data}.${encSig}`;
}

// Verify token using Web Crypto HMAC-SHA256
export async function verifyToken(token: string, secret: string = DEFAULT_SECRET): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encHeader, encPayload, sig] = parts;
    const data = `${encHeader}.${encPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let base64 = sig.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const sigBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
    if (!valid) return null;

    const payload = JSON.parse(atob(encPayload));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = 'naqra_salt_';
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to extract session token from Cookie or Authorization header
export function extractToken(c: Context): string | null {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/naqra_session=([^;]+)/);
  if (match) return match[1];
  return null;
}

// Helper to set HttpOnly session cookie
export function setSessionCookie(c: Context, token: string) {
  // Max-Age = 30 days = 2592000s
  c.header('Set-Cookie', `naqra_session=${token}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`);
}

// Helper to clear session cookie
export function clearSessionCookie(c: Context) {
  c.header('Set-Cookie', 'naqra_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax');
}

// Middleware: strictly requires Parent or Admin session
export const parentAuthMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { user: User } }> = async (c, next) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ success: false, error: 'غير مصرح: يرجى تسجيل الدخول كولي أمر' }, 401);
  }

  const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
  const payload = await verifyToken(token, secret);
  if (!payload || !payload.sub || (payload.role !== 'parent' && payload.role !== 'admin')) {
    return c.json({ success: false, error: 'جلسة ولي الأمر غير صالحة أو منتهية' }, 401);
  }

  const db = new DbHelper(c.env.DB);
  const user = await db.first<User>('SELECT id, name, email, role, created_at FROM users WHERE id = ?', payload.sub);
  if (!user) {
    return c.json({ success: false, error: 'المستخدم غير موجود' }, 401);
  }

  c.set('user', user);
  await next();
};

// Middleware: strictly requires Child session
export const childAuthMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { child: Child; parentId: string } }> = async (c, next) => {
  const token = extractToken(c);
  if (!token) {
    return c.json({ success: false, error: 'غير مصرح: يرجى تسجيل دخول الطفل بالرمز' }, 401);
  }

  const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
  const payload = await verifyToken(token, secret);
  if (!payload || !payload.sub || payload.role !== 'child') {
    return c.json({ success: false, error: 'جلسة الطفل غير صالحة أو منتهية' }, 401);
  }

  const db = new DbHelper(c.env.DB);
  const child = await db.first<Child>('SELECT * FROM children WHERE id = ?', payload.sub);
  if (!child) {
    return c.json({ success: false, error: 'الملف الشخصي للطفل غير موجود' }, 401);
  }

  c.set('child', child);
  c.set('parentId', child.user_id);
  await next();
};

// Middleware: accepts either Parent or Child session
export const anyAuthMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: { sessionRole?: 'parent' | 'admin' | 'child'; user?: User; child?: Child; parentId?: string };
}> = async (c, next) => {
  const token = extractToken(c);
  if (token) {
    const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
    const payload = await verifyToken(token, secret);
    if (payload && payload.sub) {
      const db = new DbHelper(c.env.DB);
      if (payload.role === 'child') {
        const child = await db.first<Child>('SELECT * FROM children WHERE id = ?', payload.sub);
        if (child) {
          c.set('sessionRole', 'child');
          c.set('child', child);
          c.set('parentId', child.user_id);
        }
      } else if (payload.role === 'parent' || payload.role === 'admin') {
        const user = await db.first<User>('SELECT id, name, email, role, created_at FROM users WHERE id = ?', payload.sub);
        if (user) {
          c.set('sessionRole', user.role as any);
          c.set('user', user);
          c.set('parentId', user.id);
        }
      }
    }
  }
  await next();
};

// Backward-compat alias for parent routes
export const authMiddleware = parentAuthMiddleware;
