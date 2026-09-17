import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { ClientSyncBatch } from '../../shared/types';

export const syncRoutes = new Hono<{ Bindings: Env }>();

// Batch Synchronization Endpoint
// Rule 194-200 & Rule 260: POST /api/sync with Idempotent clientBatchId
syncRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const batches: ClientSyncBatch[] = Array.isArray(body) ? body : [body];

    if (batches.length === 0) {
      return c.json({ success: true, message: 'لا توجد دفعات للمزامنة' });
    }

    const db = new DbHelper(c.env.DB);
    const results: any[] = [];

    for (const batch of batches) {
      const {
        clientBatchId,
        childId,
        gameType,
        startedAt,
        endedAt,
        activeMs,
        points,
        appVersion,
        rounds,
      } = batch;

      if (!clientBatchId || !childId) {
        continue;
      }

      // Check Idempotency: has this batch been processed before?
      const existingBatch = await db.first(
        'SELECT id FROM sync_batches WHERE client_batch_id = ?',
        clientBatchId
      );

      if (existingBatch) {
        // Idempotent: already processed, acknowledge without re-inserting
        results.push({ clientBatchId, status: 'already_processed' });
        continue;
      }

      const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const receivedAt = new Date().toISOString();

      // Collect statements for atomic D1 execution
      const statements: D1PreparedStatement[] = [];

      // 1. Record sync batch
      statements.push(
        db.raw.prepare(
          `INSERT INTO sync_batches (id, child_id, client_batch_id, received_at, status)
           VALUES (?, ?, ?, ?, 'processed')`
        ).bind(syncId, childId, clientBatchId, receivedAt)
      );

      // 2. Insert game session
      statements.push(
        db.raw.prepare(
          `INSERT INTO game_sessions (id, child_id, game_type, started_at, ended_at, active_ms, points, app_version, sync_batch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sessionId,
          childId,
          gameType,
          startedAt || receivedAt,
          endedAt || receivedAt,
          activeMs || 0,
          points || 0,
          appVersion || '1.0.0',
          clientBatchId
        )
      );

      // 3. Insert each game round
      if (rounds && Array.isArray(rounds)) {
        for (const round of rounds) {
          const roundId = `rnd_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          statements.push(
            db.raw.prepare(
              `INSERT INTO game_rounds (
                id, session_id, word_id, round_index, word_shown_at, first_tap_at,
                completed_at, active_solve_ms, view_to_first_tap_ms, correct_taps,
                wrong_taps, hint_count, first_pass, points, event_json
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
              roundId,
              sessionId,
              round.wordId,
              round.roundIndex ?? 0,
              round.wordShownAt ?? Date.now(),
              round.firstTapAt ?? null,
              round.completedAt ?? Date.now(),
              round.activeSolveMs ?? 0,
              round.viewToFirstTapMs ?? 0,
              round.correctTaps ?? 0,
              round.wrongTaps ?? 0,
              round.hintCount ?? 0,
              round.firstPass ? 1 : 0,
              round.points ?? 0,
              JSON.stringify(round.errorLetters || [])
            )
          );

          // 4. Upsert word stats for child
          statements.push(
            db.raw.prepare(
              `INSERT INTO child_word_stats (
                child_id, word_id, exposures, completions, correct_taps, wrong_taps,
                total_hints, median_solve_ms, mastery_score, last_seen_at
              ) VALUES (?, ?, 1, 1, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(child_id, word_id) DO UPDATE SET
                exposures = exposures + 1,
                completions = completions + 1,
                correct_taps = correct_taps + excluded.correct_taps,
                wrong_taps = wrong_taps + excluded.wrong_taps,
                total_hints = total_hints + excluded.total_hints,
                median_solve_ms = (median_solve_ms + excluded.median_solve_ms) / 2,
                last_seen_at = excluded.last_seen_at`
            ).bind(
              childId,
              round.wordId,
              round.correctTaps || 0,
              round.wrongTaps || 0,
              round.hintCount || 0,
              round.activeSolveMs || 0,
              round.firstPass ? 100 : 70,
              receivedAt
            )
          );
        }
      }

      // 5. Update child total points
      statements.push(
        db.raw.prepare(
          'UPDATE children SET total_points = total_points + ?, updated_at = ? WHERE id = ?'
        ).bind(points || 0, receivedAt, childId)
      );

      // Execute atomic batch
      await db.batch(statements);

      // Check level advancement recommendation
      const child = await db.first<{ current_level: number }>('SELECT current_level FROM children WHERE id = ?', childId);
      if (child && child.current_level < 5) {
        const recentStats = await db.query<{ correct_taps: number; wrong_taps: number; count: number }>(
          `SELECT SUM(correct_taps) as correct_taps, SUM(wrong_taps) as wrong_taps, COUNT(*) as count 
           FROM game_rounds r JOIN game_sessions s ON r.session_id = s.id 
           WHERE s.child_id = ? ORDER BY r.completed_at DESC LIMIT 20`,
          childId
        );

        if (recentStats.length > 0 && (recentStats[0].count || 0) >= 15) {
          const totalCorrect = recentStats[0].correct_taps || 0;
          const totalWrong = recentStats[0].wrong_taps || 0;
          const totalTaps = totalCorrect + totalWrong;
          const accuracy = totalTaps > 0 ? (totalCorrect / totalTaps) * 100 : 0;

          if (accuracy >= 88) {
            const nextLevel = child.current_level + 1;
            await db.run('UPDATE children SET current_level = ? WHERE id = ?', nextLevel, childId);
            await db.run(
              `INSERT INTO child_level_history (id, child_id, old_level, new_level, reason, created_at)
               VALUES (?, ?, ?, ?, ?, ?)`,
              `lvl_${Date.now()}`, childId, child.current_level, nextLevel, 'ترقية تلقائية بناءً على الدقة العالية في آخر الجلسات', receivedAt
            );
          }
        }
      }

      results.push({ clientBatchId, status: 'synced', pointsEarned: points });
    }

    return c.json({ success: true, results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'فشلت المزامنة' }, 500);
  }
});
