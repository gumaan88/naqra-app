import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { 
  PRAISE_CLIPS, 
  SOUND_PROFILES, 
  EFFECT_FILES, 
  praiseAudio, 
  SoundProfileType 
} from '../src/client/lib/praiseAudio';
import { processLetterCardTap, WordLettersState } from '../shared/game-engine';
import { Word } from '../shared/types';

describe('Word Letters Game: Layout Balance & Visual Cohesion (TEST 1, 2, 3, 4)', () => {
  const componentPath = path.join(__dirname, '..', 'src', 'client', 'pages', 'WordLettersGame.tsx');
  const cssPath = path.join(__dirname, '..', 'src', 'client', 'index.css');

  it('eliminates justify-between on outer container to prevent huge vertical void', () => {
    const code = fs.readFileSync(componentPath, 'utf8');
    // Ensure outer container does NOT use justify-between on h-[100dvh]
    expect(code).not.toContain('flex flex-col justify-between overflow-hidden');
    expect(code).toContain('h-[100dvh] max-h-[100dvh]');
    expect(code).toContain('flex flex-col overflow-hidden');
  });

  it('unifies Word Card, Target Letter, and Letter Grid into a single centered Main Game Zone with clamp gap', () => {
    const code = fs.readFileSync(componentPath, 'utf8');
    // Main Game Zone should be a cohesive centered unit with clamp gap
    expect(code).toContain('Main Game Zone');
    expect(code).toContain('gap-[clamp(8px,1.8vh,18px)]');
    expect(code).toContain('my-auto');
    expect(code).toContain('flex-1 min-h-0');
  });

  it('defines gentle animate-wiggle and letter-card-error without layout shift in index.css', () => {
    const css = fs.readFileSync(cssPath, 'utf8');
    expect(css).toContain('@keyframes softWiggle');
    expect(css).toContain('transform: translateX(-5px)');
    expect(css).toContain('transform: translateX(5px)');
    expect(css).toContain('.animate-wiggle');
    expect(css).toContain('.letter-card-error');
    // Confirms soft child-friendly red palette
    expect(css).toContain('#ffe4e6'); // rose-100
    expect(css).toContain('#fb7185'); // rose-400
    expect(css).toContain('#9f1239'); // rose-800
  });

  it('enforces strict No-Scroll on mobile viewports', () => {
    const code = fs.readFileSync(componentPath, 'utf8');
    expect(code).toContain('h-[100dvh]');
    expect(code).toContain('max-h-[100dvh]');
    expect(code).toContain('overflow-hidden');
  });
});

describe('Word Letters Game: Wrong Letter Feedback & Gentle Tone (TEST 5, 6, 29)', () => {
  const sampleWord: Word = {
    id: 'w_test',
    text: 'حَدِيقَة',
    normalized_text: 'حديقة',
    category: 'أماكن',
    difficulty_level: 1,
    is_imageable: true,
    status: 'approved',
    created_at: new Date().toISOString()
  };

  const sampleState: WordLettersState = {
    word: sampleWord,
    targetLetters: ['ح', 'د', 'ي', 'ق', 'ة'],
    expectedIndex: 0, // expecting 'ح'
    cards: [
      { id: 'c_h', letter: 'ح', isUsed: false },
      { id: 'c_d', letter: 'د', isUsed: false },
      { id: 'c_q', letter: 'ق', isUsed: false },
      { id: 'c_b', letter: 'ب', isUsed: false }
    ],
    consecutiveErrors: 0,
    hintCount: 0,
    wrongTaps: 0,
    correctTaps: 0,
    errorLetters: [],
    isCompleted: false,
    startedAt: Date.now()
  };

  it('keeps current expected letter and does not place letter in slot when wrong tile is tapped', () => {
    // Child taps 'ق' when 'ح' is expected
    const res = processLetterCardTap(sampleState, 'c_q', Date.now());
    expect(res.outcome).toBe('error');
    expect(res.state.expectedIndex).toBe(0); // remains unchanged!
    expect(res.state.wrongTaps).toBe(1);
    expect(res.state.errorLetters).toContain('ق');
    expect(res.state.isCompleted).toBe(false);

    // Card is NOT consumed
    const tappedCard = res.state.cards.find(c => c.id === 'c_q');
    expect(tappedCard?.isUsed).toBe(false);
  });

  it('triggers hint on the correct letter card after 3 wrong attempts', () => {
    let state = sampleState;
    // Attempt 1: wrong
    state = processLetterCardTap(state, 'c_q', Date.now()).state;
    expect(state.hintCardId).toBeUndefined();

    // Attempt 2: wrong
    state = processLetterCardTap(state, 'c_b', Date.now()).state;
    expect(state.hintCardId).toBeUndefined();

    // Attempt 3: wrong
    const res3 = processLetterCardTap(state, 'c_d', Date.now());
    expect(res3.state.wrongTaps).toBe(3);
    expect(res3.state.consecutiveErrors).toBe(3);
    // Hint should now point to 'c_h' (the card for 'ح')
    expect(res3.state.hintCardId).toBe('c_h');
  });
});

describe('Word Letters Game: Human Voices & Layered Celebration Audio (TEST 7, 8, 9, 11)', () => {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  beforeEach(() => {
    (globalThis as any).localStorage = mockLocalStorage;
    (globalThis as any).window = globalThis;
    mockLocalStorage.clear();
  });

  it('contains verified static audio assets on disk for all voices, effects, and soft error', () => {
    const publicDir = path.join(__dirname, '..', 'public');
    
    // Check all voice files exist and have non-zero size
    PRAISE_CLIPS.forEach(clip => {
      const filePath = path.join(publicDir, clip.url);
      expect(fs.existsSync(filePath), `Missing voice asset: ${filePath}`).toBe(true);
      expect(fs.statSync(filePath).size).toBeGreaterThan(1000);
    });

    // Check all celebration effect files exist and have non-zero size
    Object.values(EFFECT_FILES).forEach(relUrl => {
      const filePath = path.join(publicDir, relUrl);
      expect(fs.existsSync(filePath), `Missing effect asset: ${filePath}`).toBe(true);
      expect(fs.statSync(filePath).size).toBeGreaterThan(1000);
    });
  });

  it('configures 6 distinct Success Profiles with human voice and supportive effects', () => {
    expect(SOUND_PROFILES.length).toBe(6);
    const profileIds = SOUND_PROFILES.map(p => p.id);
    expect(profileIds).toContain('sparkle');
    expect(profileIds).toContain('soft_claps');
    expect(profileIds).toContain('mini_cheer');
    expect(profileIds).toContain('chime');
    expect(profileIds).toContain('applause');
    expect(profileIds).toContain('sparkle_clap');
  });

  it('shuffle bag algorithm ensures varied celebration experience over 10 consecutive wins', () => {
    const voiceResults: string[] = [];
    const profileResults: SoundProfileType[] = [];

    for (let i = 0; i < 10; i++) {
      const res = praiseAudio.playCelebrationSuccess(0);
      expect(res).not.toBeNull();
      if (res) {
        voiceResults.push(res.text);
        profileResults.push(res.profile);

        // Check no identical profile repeated back to back
        if (i > 0) {
          expect(res.profile).not.toBe(profileResults[i - 1]);
        }
      }
    }

    // Over 10 wins, multiple distinct voices and profiles must be used
    const uniqueVoices = new Set(voiceResults);
    const uniqueProfiles = new Set(profileResults);
    expect(uniqueVoices.size).toBeGreaterThanOrEqual(4);
    expect(uniqueProfiles.size).toBeGreaterThanOrEqual(4);
  });

  it('triggers milestone celebrations on 3 and 5 correct word streaks', () => {
    // 3 in a row
    const res3 = praiseAudio.playCelebrationSuccess(3);
    expect(res3).not.toBeNull();
    expect(res3?.profile).toBe('chime');

    // 5 in a row
    const res5 = praiseAudio.playCelebrationSuccess(5);
    expect(res5).not.toBeNull();
    expect(res5?.profile).toBe('mini_cheer');
    expect(res5?.text).toBe('أَنْتَ بَطَل!');
  });

  it('returns null and completely silences playback when sound is muted (TEST 9)', () => {
    localStorage.setItem('naqra_sound_muted', 'true');
    const res = praiseAudio.playCelebrationSuccess(0);
    expect(res).toBeNull();
  });
});
