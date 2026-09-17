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

// CORS middleware
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
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

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'نقرأ - Naqra Platform',
    version: '1.0.0',
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
