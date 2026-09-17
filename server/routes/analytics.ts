import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { authMiddleware } from '../middleware/auth';
import { User, Child, ChildAnalytics } from '../../shared/types';

export const analyticsRoutes = new Hono<{ Bindings: Env; Variables: { user: User } }>();

// Child analytics for parent dashboard
// Rule 262: GET /api/analytics/children/:id
analyticsRoutes.get('/children/:id', authMiddleware, async (c) => {
  const user = c.get('user');
  const childId = c.req.param('id');
  const db = new DbHelper(c.env.DB);

  // Verify ownership
  const child = await db.first<Child>('SELECT * FROM children WHERE id = ? AND user_id = ?', childId, user.id);
  if (!child) {
    return c.json({ success: false, error: 'غير مصرح أو الطفل غير موجود' }, 404);
  }

  // Aggregate sessions
  const sessionStats = await db.first<{
    total_sessions: number;
    total_active_ms: number;
  }>(
    `SELECT COUNT(*) as total_sessions, COALESCE(SUM(active_ms), 0) as total_active_ms 
     FROM game_sessions WHERE child_id = ?`,
    childId
  );

  // Aggregate rounds
  const roundStats = await db.first<{
    total_words: number;
    total_correct: number;
    total_wrong: number;
    total_hints: number;
    first_pass_count: number;
  }>(
    `SELECT 
      COUNT(*) as total_words,
      COALESCE(SUM(correct_taps), 0) as total_correct,
      COALESCE(SUM(wrong_taps), 0) as total_wrong,
      COALESCE(SUM(hint_count), 0) as total_hints,
      COALESCE(SUM(first_pass), 0) as first_pass_count
     FROM game_rounds r
     JOIN game_sessions s ON r.session_id = s.id
     WHERE s.child_id = ?`,
    childId
  );

  const totalTaps = (roundStats?.total_correct || 0) + (roundStats?.total_wrong || 0);
  const accuracy = totalTaps > 0 ? Math.round(((roundStats?.total_correct || 0) / totalTaps) * 100) : 0;
  const firstPassRate = (roundStats?.total_words || 0) > 0
    ? Math.round(((roundStats?.first_pass_count || 0) / (roundStats?.total_words || 1)) * 100)
    : 0;

  // Calculate median solve time from round times
  const roundTimes = await db.query<{ active_solve_ms: number }>(
    `SELECT active_solve_ms FROM game_rounds r
     JOIN game_sessions s ON r.session_id = s.id
     WHERE s.child_id = ? AND active_solve_ms > 0
     ORDER BY active_solve_ms ASC LIMIT 100`,
    childId
  );

  let medianSolveMs = 0;
  if (roundTimes.length > 0) {
    const mid = Math.floor(roundTimes.length / 2);
    medianSolveMs = roundTimes.length % 2 !== 0
      ? roundTimes[mid].active_solve_ms
      : Math.round((roundTimes[mid - 1].active_solve_ms + roundTimes[mid].active_solve_ms) / 2);
  }

  // Mastered words (exposures >= 2, correct/taps >= 85%)
  const wordStatsList = await db.query<any>(
    `SELECT s.*, w.text, w.difficulty_level 
     FROM child_word_stats s
     JOIN words w ON s.word_id = w.id
     WHERE s.child_id = ?`,
    childId
  );

  const masteredWords = wordStatsList
    .filter(ws => {
      const taps = ws.correct_taps + ws.wrong_taps;
      const acc = taps > 0 ? (ws.correct_taps / taps) * 100 : 0;
      return ws.exposures >= 2 && acc >= 85 && ws.total_hints <= 1;
    })
    .map(ws => {
      const taps = ws.correct_taps + ws.wrong_taps;
      return {
        id: ws.word_id,
        text: ws.text,
        exposures: ws.exposures,
        accuracy: taps > 0 ? Math.round((ws.correct_taps / taps) * 100) : 100,
        medianMs: ws.median_solve_ms,
      };
    });

  // Needs review words
  const needsReviewWords = wordStatsList
    .filter(ws => {
      const taps = ws.correct_taps + ws.wrong_taps;
      const acc = taps > 0 ? (ws.correct_taps / taps) * 100 : 0;
      return (ws.exposures >= 1 && acc < 75) || ws.total_hints >= 2;
    })
    .map(ws => {
      const taps = ws.correct_taps + ws.wrong_taps;
      return {
        id: ws.word_id,
        text: ws.text,
        exposures: ws.exposures,
        accuracy: taps > 0 ? Math.round((ws.correct_taps / taps) * 100) : 0,
        hints: ws.total_hints,
      };
    });

  // Frequent error letters analysis
  const errorEvents = await db.query<{ event_json: string }>(
    `SELECT event_json FROM game_rounds r
     JOIN game_sessions s ON r.session_id = s.id
     WHERE s.child_id = ? AND event_json IS NOT NULL AND event_json != '[]'`,
    childId
  );

  const letterErrorMap: Record<string, number> = {};
  for (const row of errorEvents) {
    try {
      const letters: string[] = JSON.parse(row.event_json);
      for (const char of letters) {
        letterErrorMap[char] = (letterErrorMap[char] || 0) + 1;
      }
    } catch {}
  }

  const frequentErrorLetters = Object.entries(letterErrorMap)
    .map(([letter, count]) => ({ letter, errorCount: count }))
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 5);

  // Level history
  const levelHistory = await db.query<any>(
    'SELECT new_level as level, created_at as date FROM child_level_history WHERE child_id = ? ORDER BY created_at ASC',
    childId
  );

  const analytics: ChildAnalytics = {
    child,
    totalSessions: sessionStats?.total_sessions || 0,
    totalActiveTimeMinutes: Math.round(((sessionStats?.total_active_ms || 0) / 1000 / 60) * 10) / 10,
    totalWordsCompleted: roundStats?.total_words || 0,
    totalPoints: child.total_points,
    accuracy,
    medianSolveMs,
    firstPassRate,
    totalHintsUsed: roundStats?.total_hints || 0,
    masteredWords,
    needsReviewWords,
    frequentErrorLetters,
    levelProgress: levelHistory.length > 0 ? levelHistory : [{ level: child.current_level, date: child.created_at }],
  };

  return c.json({ success: true, analytics });
});
