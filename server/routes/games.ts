import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { anyAuthMiddleware } from '../middleware/auth';
import { Word, WordImageOption, Child, User } from '../../shared/types';

export const gamesRoutes = new Hono<{
  Bindings: Env;
  Variables: {
    user?: User;
    child?: Child;
    sessionRole?: 'parent' | 'admin' | 'child';
    parentId?: string;
  };
}>();

// Get content game pack strictly isolated by authenticated parent / child
// Rule 258 & Section 1 & 5: Child -> Parent -> Parent Words -> Words
gamesRoutes.get('/game-pack', anyAuthMiddleware, async (c) => {
  const gameType = c.req.query('gameType') || 'word_letters';
  const requestedCount = Math.min(20, Math.max(3, Number(c.req.query('count')) || 6));
  const db = new DbHelper(c.env.DB);

  let parentId = c.get('parentId');
  let targetLevel = 1;

  const queryLevel = c.req.query('level');
  const queryChildId = c.req.query('childId');

  // If childId query param is provided, fetch child to get accurate level & parentId
  if (queryChildId) {
    const childRecord = await db.first<Child>('SELECT * FROM children WHERE id = ?', queryChildId);
    if (childRecord) {
      targetLevel = childRecord.current_level || 1;
      if (!parentId) {
        parentId = childRecord.user_id;
      }
    }
  }

  // If session is child role, read child profile
  if (c.get('sessionRole') === 'child') {
    const child = c.get('child');
    if (child) {
      targetLevel = child.current_level || 1;
      parentId = child.user_id;
    }
  }

  // If explicit level was passed in query, it takes highest precedence
  if (queryLevel) {
    const parsedLevel = Number(queryLevel);
    if (!isNaN(parsedLevel) && parsedLevel >= 1) {
      targetLevel = parsedLevel;
    }
  }

  // Clamp targetLevel to valid range [1, 5]
  targetLevel = Math.min(5, Math.max(1, Math.floor(targetLevel) || 1));

  let words: Word[] = [];

  // 1. Fetch from parent_words if parentId is known
  if (parentId) {
    words = await db.query<Word>(
      `SELECT w.* FROM words w
       JOIN parent_words pw ON pw.word_id = w.id
       WHERE pw.parent_id = ? AND pw.enabled = 1 AND w.difficulty_level = ? AND w.status = 'approved'
       ORDER BY RANDOM() LIMIT ?`,
      parentId, targetLevel, requestedCount
    );

    // If parent has fewer words than requested count for this level, seed parent_words from approved curated words
    if (words.length < requestedCount) {
      await db.run(
        `INSERT OR IGNORE INTO parent_words (id, parent_id, word_id, created_at, enabled, source)
         SELECT 'pw_' || ? || '_' || id, ?, id, datetime('now'), 1, 'curated'
         FROM words WHERE difficulty_level = ? AND status = 'approved'`,
        parentId, parentId, targetLevel
      );

      // Re-query
      words = await db.query<Word>(
        `SELECT w.* FROM words w
         JOIN parent_words pw ON pw.word_id = w.id
         WHERE pw.parent_id = ? AND pw.enabled = 1 AND w.difficulty_level = ? AND w.status = 'approved'
         ORDER BY RANDOM() LIMIT ?`,
        parentId, targetLevel, requestedCount
      );
    }
  }

  // 2. Fallback if no parent session or no words
  if (words.length === 0) {
    words = await db.query<Word>(
      `SELECT * FROM words 
       WHERE difficulty_level = ? AND status = 'approved'
       ORDER BY RANDOM() LIMIT ?`,
      targetLevel, requestedCount
    );
  }

  // If gameType is word_image, construct 3 image options per question
  if (gameType === 'word_image') {
    const imageableWords = words.filter(w => w.is_imageable && w.image_url);
    const poolOfAllImages = await db.query<Word>(
      `SELECT id, text, image_url FROM words WHERE is_imageable = 1 AND image_url IS NOT NULL AND status = 'approved' ORDER BY RANDOM() LIMIT 40`
    );

    const questions = imageableWords.map((targetWord) => {
      const distractors = poolOfAllImages
        .filter(w => w.id !== targetWord.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      const options: WordImageOption[] = [
        {
          id: `opt-target-${targetWord.id}`,
          wordId: targetWord.id,
          wordText: targetWord.text,
          imageUrl: targetWord.image_url!,
          isCorrect: true,
          status: 'idle' as const,
        },
        ...distractors.map(d => ({
          id: `opt-distractor-${d.id}-${Math.random().toString(36).substring(2, 6)}`,
          wordId: d.id,
          wordText: d.text,
          imageUrl: d.image_url!,
          isCorrect: false,
          status: 'idle' as const,
        }))
      ].sort(() => Math.random() - 0.5);

      return {
        word: targetWord,
        options,
      };
    });

    return c.json({
      success: true,
      gameType,
      targetLevel,
      count: questions.length,
      questions,
    });
  }

  // Default: word_letters
  return c.json({
    success: true,
    gameType,
    targetLevel,
    count: words.length,
    words,
  });
});
