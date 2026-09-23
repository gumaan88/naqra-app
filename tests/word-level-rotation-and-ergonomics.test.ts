import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { api } from '../src/client/lib/api';
import { Word } from '../shared/types';

describe('Word Selection by Child Level & Fresh Rotation', () => {
  const gamesRoutePath = path.join(__dirname, '..', 'server', 'routes', 'games.ts');
  const wordLettersPath = path.join(__dirname, '..', 'src', 'client', 'pages', 'WordLettersGame.tsx');
  const apiPath = path.join(__dirname, '..', 'src', 'client', 'lib', 'api.ts');

  it('server route /api/game-pack extracts level and childId query params with clamping', () => {
    const code = fs.readFileSync(gamesRoutePath, 'utf8');
    expect(code).toContain("c.req.query('level')");
    expect(code).toContain("c.req.query('childId')");
    expect(code).toContain('Math.min(5, Math.max(1');
    expect(code).toContain('w.difficulty_level = ?');
  });

  it('api.games.getPack passes level in query params', () => {
    const code = fs.readFileSync(apiPath, 'utf8');
    expect(code).toContain("if (params.level) query.set('level', String(params.level))");
  });

  it('WordLettersGame passes child current_level and randomizes word order on each session', () => {
    const code = fs.readFileSync(wordLettersPath, 'utf8');
    expect(code).toContain('targetLevel = activeChild?.current_level || 1');
    expect(code).toContain('level: targetLevel');
    expect(code).toContain('Math.random() - 0.5'); // shuffles word order
  });

  it('provides comprehensive offline fallback words for all 5 difficulty levels', () => {
    const code = fs.readFileSync(wordLettersPath, 'utf8');
    expect(code).toContain('OFFLINE_WORDS_BY_LEVEL');
    // Level 1 simple words
    expect(code).toContain("'أب'");
    expect(code).toContain("'أم'");
    // Level 2 3-letter words
    expect(code).toContain("'قلم'");
    expect(code).toContain("'شمس'");
    // Level 3 4-letter words
    expect(code).toContain("'كتاب'");
    expect(code).toContain("'تفاح'");
    // Level 4 4-5 letter words
    expect(code).toContain("'سيارة'");
    // Level 5 5-6 letter words
    expect(code).toContain("'برتقال'");
  });
});

describe('Phase 1 Reading Window: Timed Reveal of "قرأتها"', () => {
  const wordLettersPath = path.join(__dirname, '..', 'src', 'client', 'pages', 'WordLettersGame.tsx');

  it('delays button visibility with a calm reading prompt', () => {
    const code = fs.readFileSync(wordLettersPath, 'utf8');
    expect(code).toContain('canProceedToPlay');
    expect(code).toContain('تَهَجَّ الكَلِمَةَ بِتَأَنٍّ... ⏳');
    expect(code).toContain('setTimeout');
    expect(code).toContain('2500'); // 2.5s calm reading time
    expect(code).toContain('!canProceedToPlay');
  });
});

describe('Ergonomic Letter Keypad Tray: Within Child Hand Reach', () => {
  const wordLettersPath = path.join(__dirname, '..', 'src', 'client', 'pages', 'WordLettersGame.tsx');

  it('clusters letter cards in a compact child keypad tray constrained to thumb reach zone', () => {
    const code = fs.readFileSync(wordLettersPath, 'utf8');
    expect(code).toContain('Ergonomic Clustered Letter Keypad Tray');
    expect(code).toContain('max-w-[320px]'); // thumb reachability zone
    expect(code).toContain('rounded-3xl');
    expect(code).toContain('shadow-md');
  });
});
