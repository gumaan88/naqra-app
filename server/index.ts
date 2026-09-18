import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './db';
import { authRoutes } from './routes/auth';
import { childrenRoutes } from './routes/children';
import { gamesRoutes } from './routes/games';
import { syncRoutes } from './routes/sync';
import { analyticsRoutes } from './routes/analytics';
import { adminRoutes } from './routes/admin';
import { wordsRoutes } from './routes/words';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware with credentials support
app.use('/api/*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Mount API routes
app.route('/api/auth', authRoutes);
app.route('/api/children', childrenRoutes);
app.route('/api/words', wordsRoutes);
app.route('/api', gamesRoutes);
app.route('/api/sync', syncRoutes);
app.route('/api/game-events', syncRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/admin', adminRoutes);

// Global Error Handler - NEVER return raw text 500
app.onError((err, c) => {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  console.error(`[API-ERROR ${reqId}] ${c.req.method} ${c.req.url}:`, err);
  
  return c.json({
    ok: false,
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً',
      details: err?.message || String(err),
      requestId: reqId
    }
  }, 500);
});

// Global 404 Handler
app.notFound((c) => {
  return c.json({
    ok: false,
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'المسار المطلوب غير موجود'
    }
  }, 404);
});

// Health check
app.get('/api/health', (c) => {
  return c.json({
    ok: true,
    status: 'ok',
    app: 'نقرأ - Naqra Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// AI Diagnostic Health Check
app.get('/api/health-ai', async (c) => {
  const bindingAvailable = !!c.env.AI;
  const candidateModels = [
    '@cf/meta/llama-3.2-3b-instruct',
    '@cf/meta/llama-3.2-1b-instruct',
    '@cf/meta/llama-3.1-8b-instruct-awq',
    '@cf/meta/llama-3.1-8b-instruct-fp8',
    '@cf/qwen/qwen1.5-7b-chat-awq',
    '@cf/google/gemma-7b-it',
    '@cf/mistral/mistral-7b-instruct-v0.2',
  ];

  const results: any[] = [];
  let successfulModel = null;
  let sampleOutput = null;

  if (bindingAvailable) {
    for (const model of candidateModels) {
      try {
        const res: any = await c.env.AI.run(model, {
          messages: [{ role: 'user', content: 'Say "مرحبا" only.' }]
        });
        const out = res?.response || res;
        results.push({ model, status: 'success', output: out });
        if (!successfulModel) {
          successfulModel = model;
          sampleOutput = out;
        }
      } catch (err: any) {
        results.push({ model, status: 'error', error: err.message || String(err) });
      }
    }
  }

  return c.json({
    aiBindingAvailable: bindingAvailable,
    successfulModel,
    sampleOutput,
    results,
    timestamp: new Date().toISOString()
  });
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    // 1. If it's an API request, route directly to Hono
    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }

    // 2. Cloudflare Static Assets with SPA fallback
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // SPA Fallback: Return index.html on 404
      const indexRequest = new Request(new URL('/index.html', request.url), request);
      return await env.ASSETS.fetch(indexRequest);
    }

    return app.fetch(request, env, ctx);
  },
};
