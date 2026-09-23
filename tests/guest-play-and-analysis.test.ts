import { describe, it, expect, beforeEach } from 'vitest';
import {
  startGuestSession,
  getGuestChild,
  computeGameplayAnalysis,
  saveGuestGameResults,
  getGuestHistory,
  clearGuestData,
} from '../src/client/lib/guestSession';
import { GameRoundResult } from '../shared/types';
import fs from 'fs';
import path from 'path';

// Mock localStorage for Vitest node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Guest Mode & Direct Play System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Initializes guest child with selected level (1-5) and default name', () => {
    const guest = startGuestSession(3);
    expect(guest.is_guest).toBe(true);
    expect(guest.current_level).toBe(3);
    expect(guest.display_name).toBe('بَطَلُ القِرَاءَة');
    expect(guest.total_points).toBe(0);

    // Clamps invalid levels
    const guestHigh = startGuestSession(10, 'سارة');
    expect(guestHigh.current_level).toBe(5);
    expect(guestHigh.display_name).toBe('سارة');

    const guestLow = startGuestSession(-2);
    expect(guestLow.current_level).toBe(1);
  });

  it('2. Persists and retrieves guest child from localStorage', () => {
    startGuestSession(2, 'عمر');
    const retrieved = getGuestChild();
    expect(retrieved).not.toBeNull();
    expect(retrieved?.display_name).toBe('عمر');
    expect(retrieved?.current_level).toBe(2);
    expect(retrieved?.is_guest).toBe(true);
  });

  it('3. Computes 100% accuracy, 3 stars, and streak for flawless play', () => {
    const mockRounds: GameRoundResult[] = [
      {
        wordId: 'w_1',
        roundIndex: 0,
        wordShownAt: 1000,
        completedAt: 3000,
        activeSolveMs: 2000,
        viewToFirstTapMs: 500,
        correctTaps: 3,
        wrongTaps: 0,
        hintCount: 0,
        firstPass: 1,
        points: 20,
        eventJson: JSON.stringify({ wordText: 'قَمَر', previewHelpUsed: false }),
      },
      {
        wordId: 'w_2',
        roundIndex: 1,
        wordShownAt: 3500,
        completedAt: 6000,
        activeSolveMs: 2500,
        viewToFirstTapMs: 400,
        correctTaps: 3,
        wrongTaps: 0,
        hintCount: 0,
        firstPass: 1,
        points: 20,
        eventJson: JSON.stringify({ wordText: 'شَمْس', previewHelpUsed: false }),
      },
    ];

    const analysis = computeGameplayAnalysis(mockRounds, 'بطل القراءة', 2);
    expect(analysis.accuracyPercentage).toBe(100);
    expect(analysis.starsEarned).toBe(3);
    expect(analysis.maxStreak).toBe(2);
    expect(analysis.totalPoints).toBe(40);
    expect(analysis.wordsDetail.length).toBe(2);
    expect(analysis.wordsDetail[0].word).toBe('قَمَر');
    expect(analysis.wordsDetail[0].mistakes).toBe(0);
    expect(analysis.pedagogicalFeedback).toContain('100%');
  });

  it('4. Computes calibrated accuracy and stars when mistakes occur', () => {
    const mockRounds: GameRoundResult[] = [
      {
        wordId: 'w_1',
        roundIndex: 0,
        wordShownAt: 1000,
        completedAt: 5000,
        activeSolveMs: 4000,
        viewToFirstTapMs: 800,
        correctTaps: 3,
        wrongTaps: 1, // 3 correct out of 4 taps = 75%
        hintCount: 0,
        firstPass: 0,
        points: 15,
        eventJson: JSON.stringify({ wordText: 'كِتَاب', previewHelpUsed: true }),
      },
    ];

    const analysis = computeGameplayAnalysis(mockRounds, 'أحمد', 3);
    expect(analysis.accuracyPercentage).toBe(75);
    expect(analysis.starsEarned).toBe(2);
    expect(analysis.wordsDetail[0].audioHelpUsed).toBe(true);
    expect(analysis.wordsDetail[0].mistakes).toBe(1);
  });

  it('5. Accumulates points and stores temporary session history for guest', () => {
    startGuestSession(2, 'بطل');

    const analysis1 = computeGameplayAnalysis(
      [{
        wordId: 'w_1',
        roundIndex: 0,
        wordShownAt: 1000,
        completedAt: 3000,
        activeSolveMs: 2000,
        viewToFirstTapMs: 500,
        correctTaps: 3,
        wrongTaps: 0,
        hintCount: 0,
        firstPass: 1,
        points: 30,
      }],
      'بطل',
      2
    );

    saveGuestGameResults(analysis1);
    let guest = getGuestChild();
    expect(guest?.total_points).toBe(30);

    const history1 = getGuestHistory();
    expect(history1.length).toBe(1);
    expect(history1[0].totalPoints).toBe(30);

    // Second game adds to accumulated points
    const analysis2 = computeGameplayAnalysis(
      [{
        wordId: 'w_2',
        roundIndex: 0,
        wordShownAt: 4000,
        completedAt: 6000,
        activeSolveMs: 2000,
        viewToFirstTapMs: 500,
        correctTaps: 3,
        wrongTaps: 0,
        hintCount: 0,
        firstPass: 1,
        points: 25,
      }],
      'بطل',
      2
    );

    saveGuestGameResults(analysis2);
    guest = getGuestChild();
    expect(guest?.total_points).toBe(55);

    const history2 = getGuestHistory();
    expect(history2.length).toBe(2);
  });

  it('6. Clears guest data properly', () => {
    startGuestSession(1);
    expect(getGuestChild()).not.toBeNull();
    clearGuestData();
    expect(getGuestChild()).toBeNull();
    expect(getGuestHistory().length).toBe(0);
  });

  it('7. Verifies Game 2 (الكلمة والصورة) is hidden from ChildDashboard and LandingPage, and redirected in App.tsx', () => {
    const childDashboardSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/client/pages/ChildDashboard.tsx'),
      'utf-8'
    );
    // Should NOT have active startGame('word_image') button in dashboard
    expect(childDashboardSrc).not.toContain("onClick={() => startGame('word_image')}");

    const landingPageSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/client/pages/LandingPage.tsx'),
      'utf-8'
    );
    // Should feature direct play and not have word-image preview
    expect(landingPageSrc).toContain('لَعِبٌ مُبَاشِرٌ (دُونَ تَسْجِيلٍ)');
    expect(landingPageSrc).not.toContain('الكلمة والصورة');

    const appSrc = fs.readFileSync(
      path.resolve(__dirname, '../src/client/App.tsx'),
      'utf-8'
    );
    // Route /game/word-image should redirect
    expect(appSrc).toContain('<Navigate to="/game/word-letters" replace />');
  });
});
