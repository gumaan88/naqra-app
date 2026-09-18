// Typed HTTP API Client for Naqra Platform

import { User, Child, ClientSyncBatch, ChildAnalytics } from '@shared/types';

const TOKEN_KEY = 'naqra_auth_token';

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      credentials: 'include',
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error('تعذر الاتصال بالخادم، يرجى التأكد من اتصال الإنترنت');
  }

  // Safe content parsing - NEVER throw Unexpected token 'I'
  const contentType = res.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (parseErr) {
      console.warn('[API] Failed to parse JSON response from', endpoint);
    }
  } else {
    const rawText = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`خطأ في الخادم (${res.status}): يرجى المحاولة مرة أخرى`);
    }
    data = { ok: true, raw: rawText };
  }

  if (!res.ok || (data && (data.ok === false || data.success === false))) {
    const errorMsg =
      (typeof data?.error === 'object' ? data?.error?.message : data?.error) ||
      data?.message ||
      (res.status === 401 ? 'يرجى تسجيل الدخول مجدداً' :
       res.status === 403 ? 'ليس لديك صلاحية لتنفيذ هذا الإجراء' :
       res.status === 404 ? 'المورد المطلوب غير موجود' :
       res.status >= 500 ? 'حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً' :
       'حدث خطأ غير متوقع أثناء معالجة الطلب');
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (details: { name: string; email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(details),
      }),
    me: () => request<any>('/api/auth/me'),
    childLogin: (login_code: string) =>
      request<{ success: boolean; token: string; role: 'child'; child: Child; message: string }>('/api/auth/child-login', {
        method: 'POST',
        body: JSON.stringify({ login_code }),
      }),
    logout: () => {
      setStoredToken(null);
      return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    },
  },

  words: {
    list: () => request<{ success: boolean; count: number; words: any[] }>('/api/words'),
    add: (data: { text: string; category?: string; difficulty_level?: number }) =>
      request<{ success: boolean; message: string; wordId: string; alreadyExists?: boolean }>('/api/words', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggle: (id: string) =>
      request<{ success: boolean; enabled: boolean; message: string }>(`/api/words/${id}/toggle`, {
        method: 'PATCH',
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/words/${id}`, {
        method: 'DELETE',
      }),
    generate: (params: { count: number; level: number; category: string }) =>
      request<{
        ok?: boolean;
        success: boolean;
        requested?: number;
        generated?: number;
        valid?: number;
        duplicates?: number;
        added: number;
        words: any[];
        message: string;
      }>('/api/words/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    bulkImport: (data: { category: string; difficultyLevel: number; rawWords: string }) =>
      request<{
        ok?: boolean;
        success: boolean;
        totalFound?: number;
        received?: number;
        addedCount?: number;
        inserted?: number;
        existingCount?: number;
        alreadyOwned?: number;
        invalidCount?: number;
        invalid?: number;
        details: { text: string; status: 'added' | 'existing' | 'invalid'; reason?: string }[];
        words: any[];
        message: string;
      }>('/api/words/bulk-import', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  categories: {
    list: () => request<{ ok: boolean; success: boolean; categories: any[] }>('/api/words/categories'),
    create: (data: { name: string; icon?: string }) =>
      request<{ ok: boolean; success: boolean; category: any; message: string }>('/api/words/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; icon?: string; is_active?: number }) =>
      request<{ ok: boolean; success: boolean; message: string }>(`/api/words/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string, data?: { action: 'reassign' | 'unlink'; targetCategory?: string }) =>
      request<{ ok: boolean; success: boolean; message: string; affectedWords?: number }>(`/api/words/categories/${id}`, {
        method: 'DELETE',
        body: JSON.stringify(data || { action: 'unlink' }),
      }),
  },

  children: {
    list: () => request<{ success: boolean; children: Child[] }>('/api/children'),
    familyProfiles: (userId?: string) =>
      request<{ success: boolean; profiles: any[] }>(`/api/children/family-profiles${userId ? `?userId=${userId}` : ''}`),
    create: (data: Partial<Child>) =>
      request<{ success: boolean; child: Child; message: string }>('/api/children', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Child>) =>
      request<{ success: boolean; message: string }>(`/api/children/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/children/${id}`, {
        method: 'DELETE',
      }),
    verifyPin: (id: string, pin: string) =>
      request<{ success: boolean; child: any }>('/api/children/' + id + '/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ pin }),
      }),
  },

  games: {
    getPack: (params: { childId?: string; gameType?: string; count?: number }) => {
      const query = new URLSearchParams();
      if (params.childId) query.set('childId', params.childId);
      if (params.gameType) query.set('gameType', params.gameType);
      if (params.count) query.set('count', String(params.count));
      return request<any>(`/api/game-pack?${query.toString()}`);
    },
  },

  sync: {
    postBatches: (batches: ClientSyncBatch[]) =>
      request<{ success: boolean; results: any[] }>('/api/sync', {
        method: 'POST',
        body: JSON.stringify(batches),
      }),
  },

  analytics: {
    getChild: (childId: string) =>
      request<{ success: boolean; analytics: ChildAnalytics }>(`/api/analytics/children/${childId}`),
  },

  admin: {
    getWords: (filters?: { status?: string; level?: number; category?: string }) => {
      const query = new URLSearchParams();
      if (filters?.status) query.set('status', filters.status);
      if (filters?.level) query.set('level', String(filters.level));
      if (filters?.category) query.set('category', filters.category);
      return request<any>(`/api/admin/words?${query.toString()}`);
    },
    updateWordStatus: (id: string, status: string) =>
      request<{ success: boolean; message: string }>(`/api/admin/words/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    addWord: (data: any) =>
      request<{ success: boolean; message: string }>('/api/admin/words', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    generateWords: (params: { level: number; category: string; count: number }) =>
      request<any>('/api/admin/words/generate', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    getStats: () => request<any>('/api/admin/stats'),
  },
};
