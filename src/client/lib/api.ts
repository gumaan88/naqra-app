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

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'حدث خطأ في الاتصال بالخادم');
  }

  return data;
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
    me: () => request<{ success: boolean; user: User }>('/api/auth/me'),
    logout: () => {
      setStoredToken(null);
      return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    },
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
