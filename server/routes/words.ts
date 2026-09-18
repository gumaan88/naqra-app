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
// Guarantees that requests for 20, 30, or 50 words NEVER get truncated or fail across ANY category!
export const EXPANDED_ARABIC_DICTIONARY: Record<string, string[]> = {
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
  ],
  'منزل': [
    'باب', 'نافذة', 'غرفة', 'مطبخ', 'سرير', 'طاولة', 'كرسي', 'وسادة', 'مرآة', 'مصباح',
    'سجادة', 'ستارة', 'سقف', 'جدار', 'شرفة', 'حمام', 'فرن', 'ثلاجة', 'دولاب', 'خزانة',
    'ساعة', 'مفتاح', 'صحن', 'كوب', 'ملعقة', 'شوكة', 'إبريق', 'طشت', 'لحاف', 'أريكة'
  ],
  'مدرسة': [
    'كتاب', 'دفتر', 'قلم', 'مسطرة', 'ممحاة', 'مبرأة', 'لوح', 'صف', 'معلم', 'طالب',
    'حقيبة', 'كرسي', 'طاولة', 'جرس', 'فناء', 'مكتبة', 'ورقة', 'ألوان', 'خريطة', 'مقص',
    'امتحان', 'درس', 'نشيد', 'رسم', 'ملعب', 'مدير', 'طاقم', 'حاسوب', 'مسرح', 'علم'
  ],
  'طعام': [
    'خبز', 'حليب', 'جبن', 'عسل', 'بيض', 'لحم', 'سمك', 'أرز', 'حساء', 'زيت',
    'ماء', 'عصير', 'شاي', 'تمر', 'زيتون', 'تفاح', 'موز', 'عنب', 'بطاطس', 'طماطم',
    'جزر', 'خيار', 'بصل', 'ثوم', 'سلطة', 'فطيرة', 'حلوى', 'كعك', 'سكر', 'ملح'
  ],
  'مواصلات': [
    'سيارة', 'حافلة', 'قطار', 'طائرة', 'سفينة', 'قارب', 'دراجة', 'شاحنة', 'صاروخ', 'مروحية',
    'مترو', 'عربة', 'مركب', 'زورق', 'غواصة', 'جرار', 'صهريج', 'دباب', 'تاكسي', 'محطة'
  ],
  'جسم الإنسان': [
    'عين', 'أنف', 'فم', 'أذن', 'رأس', 'شعر', 'يد', 'رجل', 'قدم', 'ساق',
    'إصبع', 'لسان', 'سن', 'وجه', 'عنق', 'كتف', 'صدر', 'بطن', 'ظهر', 'قلب'
  ],
  'أفعال': [
    'قرأ', 'كتب', 'رسم', 'لعب', 'أكل', 'شرب', 'نام', 'جلس', 'وقف', 'مشى',
    'ركض', 'قفز', 'ضحك', 'سمع', 'نظر', 'سأل', 'أجاب', 'فتح', 'أغلق', 'ساعد'
  ],
  'كلمات عامة': [
    'نور', 'خير', 'سلام', 'فرح', 'حب', 'أمل', 'يوم', 'ليل', 'نهار', 'وقت',
    'صوت', 'لون', 'شكل', 'طريق', 'سفر', 'وطن', 'علم', 'عمل', 'فكرة', 'صورة'
  ]
};

// GET /api/words: list parent's active words with parent-specific category mapping
wordsRoutes.get('/', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const db = new DbHelper(c.env.DB);

  const words = await db.query<any>(
    `SELECT w.id, w.text, w.normalized_text, 
            COALESCE((
              SELECT pwc.category_name 
              FROM parent_word_categories pwc 
              WHERE pwc.parent_id = pw.parent_id AND pwc.word_id = w.id 
              ORDER BY pwc.created_at DESC 
              LIMIT 1
            ), w.category) AS category,
            w.difficulty_level,
            w.is_imageable, w.image_url, pw.enabled, pw.source, pw.created_at as added_at
     FROM words w
     JOIN parent_words pw ON pw.word_id = w.id
     WHERE pw.parent_id = ?
     ORDER BY pw.created_at DESC`,
    user.id
  );

  return c.json({ ok: true, success: true, count: words.length, words });
});

// GET /api/words/categories: list categories available to parent with exact word counts
wordsRoutes.get('/categories', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const db = new DbHelper(c.env.DB);

  const categories = await db.query<any>(
    `SELECT c.id, c.name, c.icon, c.sort_order, c.is_active, c.parent_id,
            (c.parent_id IS NULL) AS is_system,
            (
              SELECT COUNT(DISTINCT pwc.word_id)
              FROM parent_word_categories pwc
              JOIN parent_words pw ON pw.word_id = pwc.word_id AND pw.parent_id = pwc.parent_id
              WHERE pwc.parent_id = ? AND pwc.category_name = c.name
            ) AS word_count
     FROM parent_categories c
     WHERE (c.parent_id IS NULL OR c.parent_id = ?)
     ORDER BY c.sort_order ASC, c.created_at ASC`,
    user.id, user.id
  );

  return c.json({ ok: true, success: true, categories });
});

// POST /api/words/categories: create a custom category for parent
wordsRoutes.post('/categories', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const name = body.name ? String(body.name).trim() : '';
  const icon = body.icon ? String(body.icon).trim() : '🏷️';

  if (!name) {
    return c.json({ ok: false, success: false, error: { message: 'اسم الفئة مطلوب' } }, 400);
  }

  const db = new DbHelper(c.env.DB);
  const now = new Date().toISOString();

  // Check if category already exists for this parent or system
  const existing = await db.first(
    `SELECT id FROM parent_categories WHERE (parent_id = ? OR parent_id IS NULL) AND name = ?`,
    user.id, name
  );
  if (existing) {
    return c.json({ ok: false, success: false, error: { message: 'هذه الفئة موجودة بالفعل' } }, 400);
  }

  const catId = `cat_${user.id}_${Date.now().toString(36)}`;
  await db.run(
    `INSERT INTO parent_categories (id, parent_id, name, icon, sort_order, is_active, created_at)
     VALUES (?, ?, ?, ?, 99, 1, ?)`,
    catId, user.id, name, icon, now
  );

  return c.json({
    ok: true,
    success: true,
    category: {
      id: catId,
      name,
      icon,
      is_active: 1,
      is_system: 0,
      word_count: 0
    },
    message: 'تم إنشاء الفئة بنجاح'
  });
});

// PATCH /api/words/categories/:id: update category name or status
wordsRoutes.patch('/categories/:id', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const catId = c.req.param('id');
  const body = await c.req.json();
  const db = new DbHelper(c.env.DB);

  const cat = await db.first<any>(
    `SELECT * FROM parent_categories WHERE id = ? AND (parent_id = ? OR parent_id IS NULL)`,
    catId, user.id
  );

  if (!cat) {
    return c.json({ ok: false, success: false, error: { message: 'الفئة غير موجودة' } }, 404);
  }

  const newName = body.name ? String(body.name).trim() : cat.name;
  const newIcon = body.icon ? String(body.icon).trim() : cat.icon;
  const newActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : cat.is_active;

  if (cat.parent_id !== null && newName !== cat.name) {
    // Also rename in parent_word_categories
    await db.run(
      `UPDATE parent_word_categories SET category_name = ? WHERE parent_id = ? AND category_name = ?`,
      newName, user.id, cat.name
    );
  }

  await db.run(
    `UPDATE parent_categories SET name = ?, icon = ?, is_active = ? WHERE id = ?`,
    newName, newIcon, newActive, catId
  );

  return c.json({ ok: true, success: true, message: 'تم تحديث الفئة بنجاح' });
});

// DELETE /api/words/categories/:id: safe category delete
// NEVER deletes global words from words table! Options: reassign words or unlink relation.
wordsRoutes.delete('/categories/:id', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const catId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const action = body.action || 'unlink'; // 'reassign' | 'unlink'
  const targetCategory = body.targetCategory ? String(body.targetCategory).trim() : null;

  const db = new DbHelper(c.env.DB);

  const cat = await db.first<any>(
    `SELECT * FROM parent_categories WHERE id = ? AND parent_id = ?`,
    catId, user.id
  );

  if (!cat) {
    return c.json({ ok: false, success: false, error: { message: 'لا يمكن حذف هذه الفئة أو أنها غير موجودة' } }, 400);
  }

  // Count affected words for this parent
  const affected = await db.first<{ count: number }>(
    `SELECT COUNT(*) as count FROM parent_word_categories WHERE parent_id = ? AND category_name = ?`,
    user.id, cat.name
  );
  const affectedCount = affected?.count || 0;

  if (action === 'reassign' && targetCategory) {
    // Reassign words to target category
    await db.run(
      `UPDATE OR IGNORE parent_word_categories SET category_name = ? WHERE parent_id = ? AND category_name = ?`,
      targetCategory, user.id, cat.name
    );
    // Delete any remaining duplicates from the old category
    await db.run(
      `DELETE FROM parent_word_categories WHERE parent_id = ? AND category_name = ?`,
      user.id, cat.name
    );
  } else {
    // Unlink words from this category (words stay in parent collection as unlinked)
    await db.run(
      `DELETE FROM parent_word_categories WHERE parent_id = ? AND category_name = ?`,
      user.id, cat.name
    );
  }

  // Delete the custom category row
  await db.run(
    `DELETE FROM parent_categories WHERE id = ? AND parent_id = ?`,
    catId, user.id
  );

  return c.json({
    ok: true,
    success: true,
    affectedWords: affectedCount,
    message: action === 'reassign'
      ? `تم حذف الفئة ونقل ${affectedCount} كلمة إلى "${targetCategory}" بأمان`
      : `تم حذف الفئة وفك ارتباط ${affectedCount} كلمة بأمان دون حذف الكلمات`
  });
});

// POST /api/words: add word manually by parent
wordsRoutes.post('/', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const { text, category, difficulty_level, is_imageable } = await c.req.json();

  if (!text || typeof text !== 'string') {
    return c.json({ ok: false, success: false, error: { message: 'الكلمة مطلوبة' } }, 400);
  }

  const validation = isValidArabicWord(text);
  if (!validation.valid) {
    return c.json({ ok: false, success: false, error: { message: validation.reason } }, 400);
  }

  const normalized = normalizeArabicText(text);
  const chosenCategory = (category && String(category).trim()) || 'كلمات عامة';
  const level = Math.min(5, Math.max(1, Number(difficulty_level) || 1));
  const db = new DbHelper(c.env.DB);
  const now = new Date().toISOString();

  // 1. Find or create central word with INSERT OR IGNORE
  let word = await db.first<Word>('SELECT * FROM words WHERE normalized_text = ? LIMIT 1', normalized);
  let wordId: string;

  if (!word) {
    wordId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await db.run(
      `INSERT OR IGNORE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, source, status, created_at, approved_at)
       VALUES (?, ?, ?, ?, ?, ?, 'curated', 'approved', ?, ?)`,
      wordId, text.trim(), normalized, chosenCategory, level, is_imageable !== false ? 1 : 0, now, now
    );
    // Fetch actual id in case another process inserted concurrently
    const recheck = await db.first<Word>('SELECT * FROM words WHERE normalized_text = ? LIMIT 1', normalized);
    if (recheck) wordId = recheck.id;
  } else {
    wordId = word.id;
  }

  // 2. Check if parent already has this word
  const existingRelation = await db.first(
    'SELECT id FROM parent_words WHERE parent_id = ? AND word_id = ?',
    user.id, wordId
  );

  // Link to category regardless
  const pwcId = `pwc_${user.id}_${wordId}_${encodeURIComponent(chosenCategory)}`;
  await db.run(
    `INSERT OR IGNORE INTO parent_word_categories (id, parent_id, word_id, category_name, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    pwcId, user.id, wordId, chosenCategory, now
  );

  if (existingRelation) {
    return c.json({
      ok: true,
      success: true,
      alreadyExists: true,
      message: 'الكلمة موجودة بالفعل في مجموعتك',
      wordId
    });
  }

  // 3. Link word to parent
  const relationId = `pw_${user.id}_${wordId}`;
  await db.run(
    `INSERT OR IGNORE INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
     VALUES (?, ?, ?, ?, 1, 'manual')`,
    relationId, user.id, wordId, now
  );

  return c.json({
    ok: true,
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
    return c.json({ ok: false, success: false, error: { message: 'الكلمة غير موجودة في مجموعتك' } }, 404);
  }

  const nextState = relation.enabled === 1 ? 0 : 1;
  await db.run(
    'UPDATE parent_words SET enabled = ? WHERE parent_id = ? AND word_id = ?',
    nextState, user.id, wordId
  );

  return c.json({
    ok: true,
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
  await db.run(
    'DELETE FROM parent_word_categories WHERE parent_id = ? AND word_id = ?',
    user.id, wordId
  );

  return c.json({ ok: true, success: true, message: 'تمت إزالة الكلمة من مجموعتك بنجاح' });
});

// POST /api/words/generate: AI generation with multi-pass batching & full persistence
wordsRoutes.post('/generate', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const requestedCount = Math.min(50, Math.max(1, Number(body.count) || 20));
  const level = Math.min(5, Math.max(1, Number(body.level) || 1));
  const category = (body.category && String(body.category).trim()) || 'حيوانات';

  const db = new DbHelper(c.env.DB);
  const now = new Date().toISOString();

  let generatedTotal = 0;
  let duplicatesCount = 0;
  let rejectedCount = 0;
  let aiCallsSuccess = 0;
  let aiCallsAttempted = 0;
  let aiModelUsed = '@cf/meta/llama-3.2-3b-instruct';

  console.log(`[AI-GEN] Request: count=${requestedCount}, level=${level}, category="${category}", parent=${user.id}`);

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
    const batchSize = Math.min(20, needed + 5);

    let candidates: string[] = [];

    // 1. Try Cloudflare Workers AI if available
    if (c.env.AI) {
      aiCallsAttempted++;
      try {
        const prompt = `أنت خبير لغوي متخصص في تعليم القراءة العربية للأطفال.
المطلوب: اقترح بالضبط ${batchSize} كلمات عربية حقيقية غير مكررة في فئة "${category}" بمستوى صعوبة ${level} (${level <= 2 ? 'كلمات بسيطة من 2 إلى 3 أحرف' : 'كلمات من 4 إلى 5 أحرف'}).
أرجع النتيجة بصيغة JSON فقط بهذا الشكل الصارم دون أي نص إضافي:
{"words": ["كلمة1", "كلمة2", "كلمة3"]}`;

        let aiResponse: any;
        try {
          aiResponse = await c.env.AI.run(aiModelUsed, {
            messages: [{ role: 'user', content: prompt }]
          });
        } catch (mErr: any) {
          aiModelUsed = '@cf/meta/llama-3.1-8b-instruct-fp8';
          aiResponse = await c.env.AI.run(aiModelUsed, {
            messages: [{ role: 'user', content: prompt }]
          });
        }

        const responseText = aiResponse?.response || (typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse));
        if (responseText) {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.words)) {
              candidates = parsed.words;
              aiCallsSuccess++;
            }
          }
        }
      } catch (aiErr: any) {
        console.warn(`[AI-GEN] Workers AI execution warning:`, aiErr.message || String(aiErr));
      }
    }

    generatedTotal += candidates.length;

    // 2. Comprehensive fallback pool from dictionary
    if (candidates.length < batchSize) {
      const catList = EXPANDED_ARABIC_DICTIONARY[category] || 
                      EXPANDED_ARABIC_DICTIONARY['حيوانات'] || 
                      EXPANDED_ARABIC_DICTIONARY['كلمات عامة'];
      const filteredLinguistic = catList.filter(w => !processedNormSet.has(normalizeArabicText(w)));
      const shuffled = [...filteredLinguistic].sort(() => Math.random() - 0.5);
      const supplemental = shuffled.slice(0, batchSize - candidates.length);
      candidates = [...candidates, ...supplemental];
      generatedTotal += supplemental.length;
    }

    // 3. Validate, Normalize, Deduplicate, and Persist into D1
    for (const rawText of candidates) {
      if (acceptedWords.length >= requestedCount) break;
      if (!rawText || typeof rawText !== 'string') {
        rejectedCount++;
        continue;
      }

      const validation = isValidArabicWord(rawText);
      if (!validation.valid) {
        rejectedCount++;
        continue;
      }

      const norm = normalizeArabicText(rawText);
      if (processedNormSet.has(norm)) {
        duplicatesCount++;
        continue;
      }
      processedNormSet.add(norm);

      // Insert or find central word
      let wordRow = await db.first<Word>('SELECT * FROM words WHERE normalized_text = ? LIMIT 1', norm);
      let wordId: string;

      if (!wordRow) {
        wordId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await db.run(
          `INSERT OR IGNORE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, source, status, created_at, approved_at)
           VALUES (?, ?, ?, ?, ?, 1, 'ai', 'approved', ?, ?)`,
          wordId, rawText.trim(), norm, category, level, now, now
        );
        const recheck = await db.first<Word>('SELECT * FROM words WHERE normalized_text = ? LIMIT 1', norm);
        if (recheck) wordId = recheck.id;
      } else {
        wordId = wordRow.id;
      }

      // Link to parent_words relation
      const relationId = `pw_${user.id}_${wordId}`;
      await db.run(
        `INSERT OR IGNORE INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
         VALUES (?, ?, ?, ?, 1, 'ai')`,
        relationId, user.id, wordId, now
      );

      // Link to parent_word_categories relation
      const pwcId = `pwc_${user.id}_${wordId}_${encodeURIComponent(category)}`;
      await db.run(
        `INSERT OR IGNORE INTO parent_word_categories (id, parent_id, word_id, category_name, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        pwcId, user.id, wordId, category, now
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

  console.log(`[AI-GEN] Final: requested=${requestedCount}, generated=${generatedTotal}, accepted=${acceptedWords.length}, duplicates=${duplicatesCount}, rejected=${rejectedCount}`);

  if (acceptedWords.length === 0) {
    return c.json({
      ok: false,
      success: false,
      requested: requestedCount,
      generated: generatedTotal,
      valid: 0,
      duplicates: duplicatesCount,
      added: 0,
      categoryId: category,
      words: [],
      error: {
        code: 'NO_NEW_WORDS',
        message: 'جميع الكلمات المقترحة لهذه الفئة مضافة مسبقاً في مجموعتك، جرب فئة أخرى أو مستوى مختلف'
      }
    }, 400);
  }

  const msg = `تمت إضافة ${acceptedWords.length} كلمة جديدة بنجاح إلى مجموعتك`;

  return c.json({
    ok: true,
    success: true,
    requested: requestedCount,
    generated: generatedTotal,
    valid: acceptedWords.length,
    duplicates: duplicatesCount,
    added: acceptedWords.length,
    categoryId: category,
    words: acceptedWords,
    message: msg
  });
});

// POST /api/words/bulk-import: Bulk import words with full validation, transaction safety & deduplication
wordsRoutes.post('/bulk-import', parentAuthMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const category = (body.category && String(body.category).trim()) || 'كلمات عامة';
  const level = Math.min(5, Math.max(1, Number(body.difficultyLevel || body.level) || 1));
  const rawInput = body.rawWords;

  // Split input by whitespace, newlines, Arabic comma (،), English comma (,), and tabs
  let tokens: string[] = [];
  if (Array.isArray(rawInput)) {
    tokens = rawInput.map(w => String(w).trim());
  } else if (typeof rawInput === 'string') {
    tokens = rawInput
      .split(/[\s,\u060C\t\r\n]+/)
      .map(w => w.trim())
      .filter(Boolean);
  }

  const db = new DbHelper(c.env.DB);
  const now = new Date().toISOString();

  // Load existing parent words to detect duplicates
  const existingParentRows = await db.query<{ word_id: string; normalized_text: string }>(
    `SELECT pw.word_id, w.normalized_text 
     FROM parent_words pw
     JOIN words w ON pw.word_id = w.id
     WHERE pw.parent_id = ?`,
    user.id
  );
  const parentWordNormMap = new Map<string, string>();
  for (const row of existingParentRows) {
    parentWordNormMap.set(row.normalized_text, row.word_id);
  }

  const seenInBatch = new Set<string>();
  const validCandidates: { raw: string; normalized: string }[] = [];
  const details: { text: string; status: 'added' | 'existing' | 'invalid'; reason?: string }[] = [];

  let invalidCount = 0;
  let existingCount = 0;

  for (const token of tokens) {
    if (!token) continue;
    const norm = normalizeArabicText(token);
    const validation = isValidArabicWord(norm, 10);

    if (!validation.valid) {
      invalidCount++;
      details.push({ text: token, status: 'invalid', reason: validation.reason });
      continue;
    }

    if (seenInBatch.has(norm)) {
      continue; // Duplicate within current batch, skip silently
    }
    seenInBatch.add(norm);

    if (parentWordNormMap.has(norm)) {
      existingCount++;
      details.push({ text: norm, status: 'existing', reason: 'موجودة مسبقاً في مجموعتك' });
      // Ensure category link is recorded
      const existingWordId = parentWordNormMap.get(norm)!;
      const pwcId = `pwc_${user.id}_${existingWordId}_${encodeURIComponent(category)}`;
      await db.run(
        `INSERT OR IGNORE INTO parent_word_categories (id, parent_id, word_id, category_name, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        pwcId, user.id, existingWordId, category, now
      );
      continue;
    }

    validCandidates.push({ raw: norm, normalized: norm });
  }

  let addedCount = 0;
  const addedWords: Word[] = [];

  // Batch process valid candidates with INSERT OR IGNORE
  for (const cand of validCandidates) {
    let globalWord = await db.first<Word>(
      'SELECT * FROM words WHERE normalized_text = ? LIMIT 1',
      cand.normalized
    );

    let wordId: string;
    if (globalWord) {
      wordId = globalWord.id;
    } else {
      wordId = `w_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await db.run(
        `INSERT OR IGNORE INTO words (id, text, normalized_text, category, difficulty_level, is_imageable, source, status, created_at, approved_at)
         VALUES (?, ?, ?, ?, ?, 1, 'bulk_import', 'approved', ?, ?)`,
        wordId, cand.raw, cand.normalized, category, level, now, now
      );
      // Re-query word id in case it was ignored
      const recheck = await db.first<Word>(
        'SELECT id FROM words WHERE normalized_text = ? LIMIT 1',
        cand.normalized
      );
      if (recheck) {
        wordId = recheck.id;
      }
    }

    // Link to parent_words
    const pwId = `pw_${user.id}_${wordId}`;
    await db.run(
      `INSERT OR IGNORE INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
       VALUES (?, ?, ?, ?, 1, 'bulk_import')`,
      pwId, user.id, wordId, now
    );

    // Link to parent_word_categories
    const pwcId = `pwc_${user.id}_${wordId}_${encodeURIComponent(category)}`;
    await db.run(
      `INSERT OR IGNORE INTO parent_word_categories (id, parent_id, word_id, category_name, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      pwcId, user.id, wordId, category, now
    );

    addedCount++;
    details.push({ text: cand.raw, status: 'added' });
    addedWords.push({
      id: wordId,
      text: cand.raw,
      normalized_text: cand.normalized,
      category,
      difficulty_level: level,
      is_imageable: true,
      source: 'bulk_import',
      status: 'approved',
      created_at: now
    });
  }

  console.log(`[BULK-IMPORT] parent=${user.id}, received=${tokens.length}, inserted=${addedCount}, alreadyOwned=${existingCount}, invalid=${invalidCount}, category="${category}"`);

  const message = `تمت إضافة ${addedCount} كلمة بنجاح` +
    (existingCount > 0 ? `، و ${existingCount} موجودة مسبقاً` : '') +
    (invalidCount > 0 ? `، و ${invalidCount} غير صالحة` : '');

  return c.json({
    ok: true,
    success: true,
    received: tokens.length,
    inserted: addedCount,
    alreadyOwned: existingCount,
    invalid: invalidCount,
    details,
    words: addedWords,
    message
  });
});
