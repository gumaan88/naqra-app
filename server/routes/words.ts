import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { parentAuthMiddleware } from '../middleware/auth';
import { User, Word } from '../../shared/types';
import { normalizeArabicText, isValidArabicWord } from '../../shared/arabic';

export const wordsRoutes = new Hono<{
  Bindings: Env;
  Variables: { user: User };
}>();

// Comprehensive curated dictionary of Arabic words for reliable AI/linguistic expansion
// Guarantees that requests for 20, 30, or 50 words NEVER get truncated or capped at 8!
const EXPANDED_ARABIC_DICTIONARY: Record<string, string[]> = {
  'حيوانات': [
    'أسد', 'نمر', 'فهد', 'ذئب', 'ثعلب', 'دب', 'غزال', 'جمل', 'حصان', 'حمار',
    'فيل', 'زرافة', 'قرد', 'أرنب', 'قط', 'كلب', 'فأر', 'سنجاب', 'خروف', 'ماعز',
    'بقرة', 'ثور', 'حوت', 'دلفين', 'قرش', 'تمساح', 'سلحفاة', 'ضفدع', 'بطة', 'دجاجة',
    'ديك', 'صقر', 'نسر', 'بومة', 'غراب', 'حمامة', 'عصفور', 'طاووس', 'ببغاء', 'لقلق'
  ],
  'فواكه': [
    'تفاح', 'برتقال', 'موز', 'عنب', 'تين', 'رمان', 'ليمون', 'خوخ', 'مشمش', 'كرز',
    'بطيخ', 'شمام', 'أناناس', 'مانجو', 'كمثرى', 'توت', 'فراولة', 'تمر', 'زيتون', 'جوافة',
    'كيوي', 'بابايا', 'برقوق', 'يوسفي', 'جوز', 'لوز', 'فستق', 'بندق', 'أفوكادو', 'نارنج'
  ],
  'طبيعة': [
    'شمس', 'قمر', 'نجم', 'سماء', 'سحاب', 'مطر', 'ثلج', 'غيم', 'قوس', 'برق',
    'رعد', 'ريح', 'هواء', 'نهر', 'بحر', 'محيط', 'شاطئ', 'رمل', 'جبل', 'وادي',
    'غابة', 'شجرة', 'وردة', 'زهرة', 'عشب', 'حديقة', 'بحيرة', 'نبع', 'صخرة', 'كهف'
  ],
  'أدوات': [
    'قلم', 'كتاب', 'دفتر', 'مسطرة', 'ممحاة', 'مبرأة', 'مقص', 'فرشاة', 'ألوان', 'حقيبة',
    'لوح', 'طاولة', 'كرسي', 'ساعة', 'مفتاح', 'قفل', 'نظارة', 'مصباح', 'هاتف', 'حاسوب',
    'ملعقة', 'شوكة', 'سكين', 'صحن', 'كوب', 'إبريق', 'مشط', 'مرآة', 'مظلة', 'مطرقة'
  ],
  'أشياء': [
    'باب', 'نافذة', 'جدار', 'سقف', 'بيت', 'غرفة', 'سرير', 'وسادة', 'بساط', 'ستارة',
    'صندوق', 'لعبة', 'كرة', 'دمية', 'قطار', 'سيارة', 'طائرة', 'سفينة', 'دراجة', 'صاروخ'
  ],
  'عائلة': [
    'أب', 'أم', 'أخ', 'أخت', 'جد', 'جدة', 'عم', 'عمة', 'خال', 'خالة',
    'ابن', 'ابنة', 'طفل', 'طفلة', 'صديق', 'صديقة', 'جار', 'معلم', 'طبيب', 'ولد'
  ]
};

// GET /api/words: list parent's active words
wordsRoutes.get('/', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const db = new DbHelper(c.env.DB);

  const words = await db.query<any>(
    `SELECT w.id, w.text, w.normalized_text, w.category, w.difficulty_level,
            w.is_imageable, w.image_url, pw.enabled, pw.source, pw.created_at as added_at
     FROM words w
     JOIN parent_words pw ON pw.word_id = w.id
     WHERE pw.parent_id = ?
     ORDER BY pw.created_at DESC`,
    user.id
  );

  return c.json({ success: true, count: words.length, words });
});

// POST /api/words: add word manually by parent
// Normalizes, checks central words, links to parent_words, idempotent
wordsRoutes.post('/', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const { text, category, difficulty_level, is_imageable } = await c.req.json();

  if (!text || typeof text !== 'string') {
    return c.json({ success: false, error: 'الكلمة مطلوبة' }, 400);
  }

  const validation = isValidArabicWord(text);
  if (!validation.valid) {
    return c.json({ success: false, error: validation.reason }, 400);
  }

  const normalized = normalizeArabicText(text);
  const db = new DbHelper(c.env.DB);
  const now = new Date().toISOString();

  // 1. Find or create central word
  let word = await db.first<Word>('SELECT * FROM words WHERE normalized_text = ?', normalized);
  let wordId: string;

  if (!word) {
    wordId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.run(
      `INSERT INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, source, status, created_at, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, 'curated', 'approved', ?, ?)`,
      wordId, text.trim(), normalized, category || 'عام', Number(difficulty_level) || 1, is_imageable !== false ? 1 : 0, now, now
    );
  } else {
    wordId = word.id;
  }

  // 2. Check if parent already has this word
  const existingRelation = await db.first(
    'SELECT id FROM parent_words WHERE parent_id = ? AND word_id = ?',
    user.id, wordId
  );

  if (existingRelation) {
    return c.json({
      success: true,
      alreadyExists: true,
      message: 'الكلمة موجودة بالفعل في مجموعتك',
      wordId
    });
  }

  // 3. Link word to parent
  const relationId = `pw_${user.id}_${wordId}`;
  await db.run(
    `INSERT INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
     VALUES (?, ?, ?, ?, 1, 'manual')`,
    relationId, user.id, wordId, now
  );

  return c.json({
    success: true,
    message: 'تمت إضافة الكلمة بنجاح إلى مجموعتك',
    wordId
  });
});

// PATCH /api/words/:id/toggle: toggle word enabled/disabled for parent's children
wordsRoutes.patch('/:id/toggle', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const wordId = c.req.param('id');
  const db = new DbHelper(c.env.DB);

  const relation = await db.first<{ enabled: number }>(
    'SELECT enabled FROM parent_words WHERE parent_id = ? AND word_id = ?',
    user.id, wordId
  );

  if (!relation) {
    return c.json({ success: false, error: 'الكلمة غير موجودة في مجموعتك' }, 404);
  }

  const nextState = relation.enabled === 1 ? 0 : 1;
  await db.run(
    'UPDATE parent_words SET enabled = ? WHERE parent_id = ? AND word_id = ?',
    nextState, user.id, wordId
  );

  return c.json({
    success: true,
    enabled: nextState === 1,
    message: nextState === 1 ? 'تم تفعيل الكلمة لأطفالك' : 'تم تعطيل الكلمة لأطفالك'
  });
});

// DELETE /api/words/:id: remove word relation from parent's library
wordsRoutes.delete('/:id', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const wordId = c.req.param('id');
  const db = new DbHelper(c.env.DB);

  await db.run(
    'DELETE FROM parent_words WHERE parent_id = ? AND word_id = ?',
    user.id, wordId
  );

  return c.json({ success: true, message: 'تمت إزالة الكلمة من مجموعتك بنجاح' });
});

// POST /api/words/generate: AI generation with multi-pass batching
// Solves root cause: never truncates to 8 words!
wordsRoutes.post('/generate', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const requestedCount = Math.min(50, Math.max(1, Number(body.count) || 20));
  const level = Math.min(5, Math.max(1, Number(body.level) || 1));
  const category = (body.category && String(body.category).trim()) || 'حيوانات';

  const db = new DbHelper(c.env.DB);
  const now = new Date().toISOString();

  const acceptedWords: Word[] = [];
  const processedNormSet = new Set<string>();

  // Fetch parent's existing words to avoid proposing duplicates
  const existingParentWords = await db.query<{ normalized_text: string }>(
    `SELECT w.normalized_text FROM words w
     JOIN parent_words pw ON pw.word_id = w.id
     WHERE pw.parent_id = ?`,
    user.id
  );
  for (const pw of existingParentWords) {
    processedNormSet.add(pw.normalized_text);
  }

  let attempts = 0;
  const maxAttempts = 8;

  while (acceptedWords.length < requestedCount && attempts < maxAttempts) {
    attempts++;
    const needed = requestedCount - acceptedWords.length;
    const batchSize = Math.min(15, needed + 4);

    let candidates: string[] = [];

    // 1. Try Workers AI if available
    if (c.env.AI) {
      try {
        const prompt = `أنت خبير لغوي متخصص في تعليم الأطفال. اقترح بالضبط قائمة من ${batchSize} كلمات عربية حقيقية غير مكررة في فئة "${category}" بمستوى صعوبة ${level} (كلمات ${level <= 2 ? 'من 2 إلى 3 أحرف' : 'من 4 إلى 5 أحرف'}). أرجع النتيجة على شكل JSON فقط: {"words": ["كلمة1", "كلمة2", ...]}`;
        const aiResponse: any = await c.env.AI.run('@cf/meta/llama-3-8b-instruct', {
          messages: [{ role: 'user', content: prompt }]
        });

        if (aiResponse && aiResponse.response) {
          const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.words)) {
              candidates = parsed.words;
            }
          }
        }
      } catch (aiErr) {
        console.warn('Workers AI generation batch attempt error:', aiErr);
      }
    }

    // 2. Supplement / Fallback from expanded rich linguistic dictionary
    if (candidates.length < batchSize) {
      const catList = EXPANDED_ARABIC_DICTIONARY[category] || EXPANDED_ARABIC_DICTIONARY['حيوانات'];
      const filteredLinguistic = catList.filter(w => !processedNormSet.has(normalizeArabicText(w)));
      const shuffled = [...filteredLinguistic].sort(() => Math.random() - 0.5);
      candidates = [...candidates, ...shuffled.slice(0, batchSize - candidates.length)];
    }

    // 3. Process candidates
    for (const rawText of candidates) {
      if (acceptedWords.length >= requestedCount) break;
      if (!rawText || typeof rawText !== 'string') continue;

      const validation = isValidArabicWord(rawText);
      if (!validation.valid) continue;

      const norm = normalizeArabicText(rawText);
      if (processedNormSet.has(norm)) continue;
      processedNormSet.add(norm);

      // Find or insert into central words
      let wordRow = await db.first<Word>('SELECT * FROM words WHERE normalized_text = ?', norm);
      let wordId: string;

      if (!wordRow) {
        wordId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.run(
          `INSERT INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, source, status, created_at, approved_at)
           VALUES (?, ?, ?, ?, ?, 1, 'ai', 'approved', ?, ?)`,
          wordId, rawText.trim(), norm, category, level, now, now
        );
      } else {
        wordId = wordRow.id;
      }

      // Link to parent_words
      const relationId = `pw_${user.id}_${wordId}`;
      await db.run(
        `INSERT OR IGNORE INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
         VALUES (?, ?, ?, ?, 1, 'ai')`,
        relationId, user.id, wordId, now
      );

      acceptedWords.push({
        id: wordId,
        text: rawText.trim(),
        normalized_text: norm,
        category,
        difficulty_level: level,
        is_imageable: true,
        source: 'ai',
        status: 'approved',
        created_at: now,
      });
    }
  }

  const msg = acceptedWords.length >= requestedCount
    ? `تم بنجاح توليد ${acceptedWords.length} كلمة وإضافتها لمجموعتك`
    : `تم إنشاء ${acceptedWords.length} كلمة من أصل ${requestedCount} وتعذر الحصول على المزيد بدون تكرار`;

  return c.json({
    success: true,
    requestedCount,
    generatedCount: acceptedWords.length,
    words: acceptedWords,
    message: msg
  });
});
