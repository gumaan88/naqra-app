import { Hono } from 'hono';
import { Env, DbHelper } from '../db';
import { anyAuthMiddleware } from '../middleware/auth';
import { ClientSyncBatch, Child, User } from '../../shared/types';

export const syncRoutes = new Hono<{
  Bindings: Env;
  Variables: {
    user?: User;
    child?: Child;
    sessionRole?: 'parent' | 'admin' | 'child';
    parentId?: string;
  };
}>();

syncRoutes.use('*', anyAuthMiddleware);

// Handler for batch sync
const handleBatchSync = async (c: any) => {
  try {
    const body = await c.req.json();
    let batches: ClientSyncBatch[] = [];

    // Support both formats: { events: [...] } or { clientBatchId, rounds: [...] } or array of batches
    if (Array.isArray(body)) {
      batches = body;
    } else if (body.events && Array.isArray(body.events)) {
      batches = [{
        clientBatchId: body.clientBatchId || `batch_${Date.now()}`,
        childId: body.childId || (c.get('child')?.id) || '',
        gameType: body.gameType || 'word_letters',
        startedAt: body.startedAt || new Date().toISOString(),
        endedAt: body.endedAt || new Date().toISOString(),
        activeMs: body.activeMs || 0,
        points: body.points || 0,
        appVersion: '1.0.0',
        rounds: body.events,
      }];
    } else if (body.rounds) {
      batches = [body];
    }

    if (batches.length === 0) {
      return c.json({ success: true, message: 'لا توجد دفعات للمزامنة' });
    }

    const db = new DbHelper(c.env.DB);
    const results: any[] = [];
    const authChild = c.get('child');

    for (const batch of batches) {
      const effectiveChildId = authChild?.id || batch.childId;
      const {
        clientBatchId,
        gameType,
        startedAt,
        endedAt,
        activeMs,
        points,
        appVersion,
        rounds,
      } = batch;

      if (!clientBatchId || !effectiveChildId) {
        continue;
      }

      // Idempotency check: has this batch been processed?
      const existingBatch = await db.first(
        'SELECT id FROM sync_batches WHERE client_batch_id = ?',
        clientBatchId
      );

      if (existingBatch) {
        results.push({ clientBatchId, status: 'already_processed' });
        continue;
      }

      const syncId = `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const receivedAt = new Date().toISOString();

      const statements: D1PreparedStatement[] = [];

      // 1. Record sync batch for idempotency
      statements.push(
        db.raw.prepare(
          `INSERT INTO sync_batches (id, child_id, client_batch_id, received_at, status)
           VALUES (?, ?, ?, ?, 'processed')`
        ).bind(syncId, effectiveChildId, clientBatchId, receivedAt)
      );

      // 2. Insert game session
      statements.push(
        db.raw.prepare(
          `INSERT INTO game_sessions (id, child_id, game_type, started_at, ended_at, active_ms, points, app_version, sync_batch_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          sessionId,
          effectiveChildId,
          gameType || 'word_letters',
          startedAt || receivedAt,
          endedAt || receivedAt,
          activeMs || 0,
          points || 0,
          appVersion || '1.0.0',
          clientBatchId
        )
      );

      // 3. Insert each game round / event
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
              round.wordId || 'unknown_word',
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
          if (round.wordId) {
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
                effectiveChildId,
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
      }

      // 5. Update child total points
      statements.push(
        db.raw.prepare(
          'UPDATE children SET total_points = total_points + ?, updated_at = ? WHERE id = ?'
        ).bind(points || 0, receivedAt, effectiveChildId)
      );

      // Atomic execution in D1
      await db.batch(statements);

      results.push({ clientBatchId, status: 'synced', pointsEarned: points });
    }

    return c.json({ success: true, results });
  } catch (err: any) {
    return c.json({ success: false, error: err.message || 'فشلت المزامنة' }, 500);
  }
};

// Mount both POST / and POST /batch for compatibility with Section 19
syncRoutes.post('/', handleBatchSync);
syncRoutes.post('/batch', handleBatchSync);
