import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { authMiddleware } from '../middleware/auth';
import { User, Word } from '../../shared/types';
import { normalizeArabicText, isValidArabicWord } from '../../shared/arabic';
import { EXPANDED_ARABIC_DICTIONARY } from './words';

export const adminRoutes = new Hono<{ Bindings: Env; Variables: { user: User } }>();

// Middleware: ensure admin role
adminRoutes.use('*', authMiddleware, async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'غير مصرح: صلاحية مدير النظام مطلوبة' }, 403);
  }
  await next();
});

// List words with filters
adminRoutes.get('/words', async (c) => {
  const status = c.req.query('status');
  const level = c.req.query('level');
  const category = c.req.query('category');
  const db = new DbHelper(c.env.DB);

  let query = 'SELECT * FROM words WHERE 1=1';
  const params: any[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (level) {
    query += ' AND difficulty_level = ?';
    params.push(Number(level));
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC LIMIT 100';
  const words = await db.query<Word>(query, ...params);
  return c.json({ success: true, words });
});

// Update word status (approve, reject, archive)
adminRoutes.patch('/words/:id/status', async (c) => {
  const wordId = c.req.param('id');
  const { status } = await c.req.json();
  if (!['approved', 'rejected', 'archived', 'pending'].includes(status)) {
    return c.json({ success: false, error: 'حالة غير صالحة' }, 400);
  }

  const db = new DbHelper(c.env.DB);
  const now = new Date().toISOString();
  await db.run(
    `UPDATE words SET status = ?, approved_at = CASE WHEN ? = 'approved' THEN ? ELSE approved_at END WHERE id = ?`,
    status, status, now, wordId
  );

  return c.json({ success: true, message: `تم تحديث حالة الكلمة إلى ${status}` });
});

// Manually add new word
adminRoutes.post('/words', async (c) => {
  const { text, category, difficulty_level, is_imageable, image_url } = await c.req.json();
  const validation = isValidArabicWord(text);
  if (!validation.valid) {
    return c.json({ success: false, error: validation.reason }, 400);
  }

  const normalized = normalizeArabicText(text);
  const db = new DbHelper(c.env.DB);

  const existing = await db.first('SELECT id FROM words WHERE normalized_text = ?', normalized);
  if (existing) {
    return c.json({ success: false, error: 'هذه الكلمة موجودة مسبقاً في بنك الكلمات' }, 409);
  }

  const wordId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await db.run(
    `INSERT INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, image_url, source, status, created_at, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'curated', 'approved', ?, ?)`,
    wordId, text.trim(), normalized, category || 'عام', Number(difficulty_level) || 1, is_imageable ? 1 : 0, image_url || null, now, now
  );

  return c.json({ success: true, message: 'تمت إضافة الكلمة واعتمادها بنجاح' });
});

// Generate words batch using AI or Curated linguistic template generator
// Rule 157-167: Workers AI -> clean -> validate -> save as 'pending'
adminRoutes.post('/words/generate', async (c) => {
  try {
    const { level = 1, category = 'حيوانات', count = 5 } = await c.req.json();
    const db = new DbHelper(c.env.DB);

    const generatedCandidates: { text: string; category: string; level: number; is_imageable: boolean }[] = [];

    // Check if Cloudflare Workers AI is available in env
    if (c.env.AI) {
      try {
        const prompt = `أنت خبير لغوي للأطفال. اقترح قائمة من ${count} كلمات عربية ملموسة وبسيطة للأطفال في فئة "${category}" بمستوى صعوبة ${level} (طول الكلمة ${level <= 2 ? '2 إلى 3 أحرف' : '4 إلى 5 أحرف'}). أرجع النتيجة على شكل JSON فقط: [{"word": "قط", "category": "${category}", "level": ${level}, "is_imageable": true}]`;
        const aiResponse: any = await c.env.AI.run('@cf/meta/llama-3.2-3b-instruct', {
          messages: [{ role: 'user', content: prompt }]
        });
        if (aiResponse && aiResponse.response) {
          const jsonMatch = aiResponse.response.match(/\[.*\]/s);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            for (const item of parsed) {
              if (item.word) {
                generatedCandidates.push({
                  text: item.word,
                  category: item.category || category,
                  level: Number(item.level) || level,
                  is_imageable: item.is_imageable !== false,
                });
              }
            }
          }
        }
      } catch (aiErr) {
        console.warn('Workers AI call fallback:', aiErr);
      }
    }

    // Fallback linguistic templates if AI returned nothing or insufficient candidates
    if (generatedCandidates.length < count) {
      const wordsForCat = EXPANDED_ARABIC_DICTIONARY[category] || EXPANDED_ARABIC_DICTIONARY['حيوانات'];
      const needed = count - generatedCandidates.length;
      const shuffled = [...wordsForCat].sort(() => Math.random() - 0.5);
      for (const w of shuffled.slice(0, needed)) {
        generatedCandidates.push({
          text: w,
          category,
          level,
          is_imageable: true,
        });
      }
    }

    const insertedWords: Word[] = [];
    const now = new Date().toISOString();

    for (const item of generatedCandidates) {
      const validation = isValidArabicWord(item.text);
      if (!validation.valid) continue;

      const normalized = normalizeArabicText(item.text);
      const existing = await db.first('SELECT id FROM words WHERE normalized_text = ?', normalized);
      if (existing) continue;

      const wordId = `ai_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.run(
        `INSERT INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, source, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'ai', 'pending', ?)`,
        wordId, item.text, normalized, item.category, item.level, item.is_imageable ? 1 : 0, now
      );

      insertedWords.push({
        id: wordId,
        text: item.text,
        normalized_text: normalized,
        category: item.category,
        difficulty_level: item.level,
        is_imageable: item.is_imageable,
        source: 'ai',
        status: 'pending',
        created_at: now,
      });
    }

    return c.json({
      success: true,
      message: `تم توليد ${insertedWords.length} كلمة جديدة بنجاح في حالة الانتظار (pending)`,
      words: insertedWords,
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'فشل توليد الكلمات' }, 500);
  }
});

// Admin overview stats
adminRoutes.get('/stats', async (c) => {
  const db = new DbHelper(c.env.DB);
  const wordsStats = await db.query<any>(
    `SELECT status, COUNT(*) as count FROM words GROUP BY status`
  );
  const totalChildren = await db.first<{ count: number }>('SELECT COUNT(*) as count FROM children');
  const totalSessions = await db.first<{ count: number }>('SELECT COUNT(*) as count FROM game_sessions');

  return c.json({
    success: true,
    wordsStats: wordsStats.reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {}),
    totalChildren: totalChildren?.count || 0,
    totalSessions: totalSessions?.count || 0,
  });
});

// Admin-only AI Diagnostic Test endpoint
adminRoutes.all('/ai/test', async (c) => {
  const bindingPresent = !!c.env.AI;
  if (!bindingPresent) {
    return c.json({
      ok: false,
      bindingPresent: false,
      error: 'Workers AI binding (c.env.AI) is undefined in Worker environment',
    }, 500);
  }

  let model = '@cf/meta/llama-3.2-3b-instruct';
  try {
    const aiRes: any = await c.env.AI.run(model, {
      messages: [{ role: 'user', content: 'Give 3 Arabic words for animals as JSON: {"words": ["قط", "كلب", "أسد"]}' }]
    });

    return c.json({
      ok: true,
      bindingPresent: true,
      model,
      responseReceived: true,
      rawOutput: aiRes?.response || aiRes,
    });
  } catch (err: any) {
    // Try fallback model
    try {
      model = '@cf/meta/llama-3.1-8b-instruct-fp8';
      const aiRes2: any = await c.env.AI.run(model, {
        messages: [{ role: 'user', content: 'Give 3 Arabic words for animals as JSON: {"words": ["قط", "كلب", "أسد"]}' }]
      });

      return c.json({
        ok: true,
        bindingPresent: true,
        model,
        responseReceived: true,
        rawOutput: aiRes2?.response || aiRes2,
        primaryModelError: err.message || String(err),
      });
    } catch (fallbackErr: any) {
      return c.json({
        ok: false,
        bindingPresent: true,
        model,
        responseReceived: false,
        error: `Primary failed: ${err.message || String(err)} | Fallback failed: ${fallbackErr.message || String(fallbackErr)}`,
      }, 500);
    }
  }
});
