import { MiddlewareHandler } from 'hono';
import { Env, DbHelper } from '../db';
import { User } from '../../shared/types';

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

    // restore base64 padding
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

// Hash password using Web Crypto SHA-256 with salt
export async function hashPassword(password: string): Promise<string> {
  const salt = 'naqra_salt_';
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { user: User } }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    // Check cookies
    const cookie = c.req.header('Cookie') || '';
    const match = cookie.match(/naqra_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return c.json({ success: false, error: 'غير مصرح: يرجى تسجيل الدخول' }, 401);
  }

  const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
  const payload = await verifyToken(token, secret);
  if (!payload || !payload.sub) {
    return c.json({ success: false, error: 'جلسة الدخول غير صالحة أو منتهية' }, 401);
  }

  const db = new DbHelper(c.env.DB);
  const user = await db.first<User>('SELECT id, name, email, role, created_at FROM users WHERE id = ?', payload.sub);
  if (!user) {
    return c.json({ success: false, error: 'المستخدم غير موجود' }, 401);
  }

  c.set('user', user);
  await next();
};

export const optionalAuthMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { user?: User } }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    const cookie = c.req.header('Cookie') || '';
    const match = cookie.match(/naqra_session=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    const secret = c.env.JWT_SECRET || DEFAULT_SECRET;
    const payload = await verifyToken(token, secret);
    if (payload && payload.sub) {
      const db = new DbHelper(c.env.DB);
      const user = await db.first<User>('SELECT id, name, email, role, created_at FROM users WHERE id = ?', payload.sub);
      if (user) c.set('user', user);
    }
  }

  await next();
};
