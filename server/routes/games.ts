import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { Word, WordImageOption } from '../../shared/types';

export const gamesRoutes = new Hono<{ Bindings: Env }>();

// Get a content game pack suitable for child level
// Rule 258: GET /api/game-pack?childId=&gameType=&count=
gamesRoutes.get('/game-pack', async (c) => {
  const childId = c.req.query('childId');
  const gameType = c.req.query('gameType') || 'word_letters';
  const requestedCount = Math.min(20, Math.max(5, Number(c.req.query('count')) || 10));

  const db = new DbHelper(c.env.DB);

  let targetLevel = 1;
  if (childId) {
    const child = await db.first<{ current_level: number }>('SELECT current_level FROM children WHERE id = ?', childId);
    if (child && child.current_level) {
      targetLevel = child.current_level;
    }
  }

  // Fetch words matching the child's level and status 'approved'
  let words = await db.query<Word>(
    `SELECT * FROM words 
     WHERE difficulty_level = ? AND status = 'approved'
     ORDER BY RANDOM() LIMIT ?`,
    targetLevel, requestedCount
  );

  // Fallback if not enough words at this exact level
  if (words.length < requestedCount) {
    const additional = await db.query<Word>(
      `SELECT * FROM words 
       WHERE status = 'approved' AND id NOT IN (${words.length > 0 ? words.map(w => `'${w.id}'`).join(',') : "''"})
       ORDER BY RANDOM() LIMIT ?`,
      requestedCount - words.length
    );
    words = [...words, ...additional];
  }

  // If gameType is word_image, assemble 3 image options for each word
  if (gameType === 'word_image') {
    // Only imageable words
    const imageableWords = words.filter(w => w.is_imageable && w.image_url);
    const poolOfAllImages = await db.query<Word>(
      `SELECT id, text, image_url FROM words WHERE is_imageable = 1 AND image_url IS NOT NULL AND status = 'approved' ORDER BY RANDOM() LIMIT 50`
    );

    const questions = imageableWords.map((targetWord) => {
      // Pick 2 distractors
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
          status: 'idle',
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
