import { describe, it, expect } from 'vitest';
import {
  initWordLettersRound,
  processLetterCardTap,
  finalizeRoundResult,
  calculateRoundScore,
} from '../shared/game-engine';
import { normalizeArabicText, splitArabicLetters, isValidArabicWord } from '../shared/arabic';
import { Word } from '../shared/types';

describe('Naqra Platform - Arabic & Game Logic Tests', () => {
  const sampleWordBab: Word = {
    id: 'w_test_bab',
    text: 'بَابٌ',
    normalized_text: 'باب',
    category: 'المنزل',
    difficulty_level: 1,
    is_imageable: true,
    status: 'approved',
    created_at: new Date().toISOString(),
  };

  const sampleWordQalam: Word = {
    id: 'w_test_qalam',
    text: 'قَلَمٌ',
    normalized_text: 'قلم',
    category: 'أدوات',
    difficulty_level: 2,
    is_imageable: true,
    status: 'approved',
    created_at: new Date().toISOString(),
  };

  describe('1. Arabic Normalization & Splitting', () => {
    it('removes tashkeel and tatweel while preserving distinct Arabic letters', () => {
      const input = 'كِتَــــابٌ';
      const normalized = normalizeArabicText(input);
      expect(normalized).toBe('كتاب');
      expect(splitArabicLetters(normalized)).toEqual(['ك', 'ت', 'ا', 'ب']);
    });

    it('validates Arabic words correctly', () => {
      expect(isValidArabicWord('قلم').valid).toBe(true);
      expect(isValidArabicWord('book').valid).toBe(false);
      expect(isValidArabicWord('كلمة123').valid).toBe(false);
      expect(isValidArabicWord('و').valid).toBe(false); // too short
    });
  });

  describe('2. Sequential Letter Selection in Word Letters Game', () => {
    it('advances expectedIndex and marks card correct upon matching letter tap', () => {
      const state = initWordLettersRound(sampleWordQalam, 1);
      expect(state.expectedIndex).toBe(0);
      expect(state.targetLetters).toEqual(['ق', 'ل', 'م']);

      // Find first target card 'ق'
      const qCard = state.cards.find(c => c.letter === 'ق' && !c.isDistractor)!;
      expect(qCard).toBeDefined();

      const res1 = processLetterCardTap(state, qCard.id, 1000);
      expect(res1.outcome).toBe('correct');
      expect(res1.state.expectedIndex).toBe(1);
      expect(res1.state.correctTaps).toBe(1);
      expect(res1.state.wrongTaps).toBe(0);
      expect(res1.state.cards.find(c => c.id === qCard.id)?.isUsed).toBe(true);
    });

    it('completes the word when all letters are tapped in correct sequence', () => {
      let state = initWordLettersRound(sampleWordQalam, 1);

      const qCard = state.cards.find(c => c.letter === 'ق' && !c.isDistractor)!;
      const lCard = state.cards.find(c => c.letter === 'ل' && !c.isDistractor)!;
      const mCard = state.cards.find(c => c.letter === 'م' && !c.isDistractor)!;

      state = processLetterCardTap(state, qCard.id, 1000).state;
      state = processLetterCardTap(state, lCard.id, 2000).state;
      const resFinal = processLetterCardTap(state, mCard.id, 3000);

      expect(resFinal.outcome).toBe('completed');
      expect(resFinal.state.isCompleted).toBe(true);
      expect(resFinal.state.expectedIndex).toBe(3);
      expect(resFinal.state.correctTaps).toBe(3);
      expect(resFinal.state.wrongTaps).toBe(0);
      expect(resFinal.state.completedAt).toBe(3000);
    });
  });

  describe('3. Repeated Letter Handling (e.g. "باب")', () => {
    it('generates distinct cards for repeated letters in the word', () => {
      const state = initWordLettersRound(sampleWordBab, 1);
      const bCards = state.cards.filter(c => c.letter === 'ب');
      // "باب" has 2 'ب' letters
      expect(bCards.length).toBeGreaterThanOrEqual(2);
    });

    it('requires both distinct letter cards to be used and does not reuse the same card', () => {
      let state = initWordLettersRound(sampleWordBab, 1);
      const bCards = state.cards.filter(c => c.letter === 'ب');
      const aCard = state.cards.find(c => c.letter === 'ا' && !c.isDistractor)!;

      const firstBCard = bCards[0];
      const secondBCard = bCards[1];

      // Tap first 'ب' -> correct
      state = processLetterCardTap(state, firstBCard.id, 1000).state;
      expect(state.expectedIndex).toBe(1);

      // Tap first 'ب' again -> IGNORED, no error!
      const ignoredRes = processLetterCardTap(state, firstBCard.id, 1100);
      expect(ignoredRes.outcome).toBe('ignored');
      expect(ignoredRes.state.wrongTaps).toBe(0);
      expect(ignoredRes.state.expectedIndex).toBe(1);

      // Tap 'ا' -> correct
      state = processLetterCardTap(state, aCard.id, 1500).state;
      expect(state.expectedIndex).toBe(2);

      // Tap second 'ب' -> completes!
      const finalRes = processLetterCardTap(state, secondBCard.id, 2000);
      expect(finalRes.outcome).toBe('completed');
      expect(finalRes.state.isCompleted).toBe(true);
    });
  });

  describe('4. Out-of-Order Taps and Distractor Handling', () => {
    it('treats tapping a future correct letter out-of-order as error without removing the card', () => {
      const state = initWordLettersRound(sampleWordQalam, 1);
      // Word is "قلم", expected is 'ق' (index 0). Child taps 'م' (index 2) prematurely.
      const mCard = state.cards.find(c => c.letter === 'م' && !c.isDistractor)!;

      const res = processLetterCardTap(state, mCard.id, 1000);
      expect(res.outcome).toBe('error');
      expect(res.state.expectedIndex).toBe(0); // expected index NOT changed!
      expect(res.state.wrongTaps).toBe(1);
      expect(res.state.consecutiveErrors).toBe(1);

      // Card remains available for later use!
      const cardInState = res.state.cards.find(c => c.id === mCard.id)!;
      expect(cardInState.isUsed).toBe(false);
      expect(cardInState.status).toBe('error');
    });

    it('treats distractor letter tap as error and preserves expectedIndex', () => {
      const state = initWordLettersRound(sampleWordQalam, 1);
      const distractor = state.cards.find(c => c.isDistractor)!;
      expect(distractor).toBeDefined();

      const res = processLetterCardTap(state, distractor.id, 1000);
      expect(res.outcome).toBe('error');
      expect(res.state.expectedIndex).toBe(0);
      expect(res.state.wrongTaps).toBe(1);
    });
  });

  describe('5. Hint System after 3 Consecutive Errors', () => {
    it('triggers hint on available matching card after 3 consecutive errors', () => {
      let state = initWordLettersRound(sampleWordQalam, 1);
      const distractor = state.cards.find(c => c.isDistractor)!;

      // Tap 1 error
      state = processLetterCardTap(state, distractor.id, 1000).state;
      expect(state.consecutiveErrors).toBe(1);
      expect(state.hintCardId).toBeNull();

      // Tap 2 error
      state = processLetterCardTap(state, distractor.id, 1200).state;
      expect(state.consecutiveErrors).toBe(2);
      expect(state.hintCardId).toBeNull();

      // Tap 3 error -> Hint triggered!
      state = processLetterCardTap(state, distractor.id, 1400).state;
      expect(state.consecutiveErrors).toBe(3);
      expect(state.hintCardId).not.toBeNull();
      expect(state.hintCount).toBe(1);

      // The hint card must be the unused 'ق' card
      const hintCard = state.cards.find(c => c.id === state.hintCardId);
      expect(hintCard?.letter).toBe('ق');
      expect(hintCard?.isUsed).toBe(false);

      // Now tap correct 'ق' -> resets consecutive errors and hint
      const correctRes = processLetterCardTap(state, hintCard!.id, 1600);
      expect(correctRes.outcome).toBe('correct');
      expect(correctRes.state.consecutiveErrors).toBe(0);
      expect(correctRes.state.hintCardId).toBeNull();
    });
  });

  describe('6. Timer Measurement starting at First Tap', () => {
    it('records firstTapAt only on actual first tap, not at wordShownAt', () => {
      const state = initWordLettersRound(sampleWordQalam, 1);
      state.wordShownAt = 4000;
      expect(state.firstTapAt).toBeNull();

      const qCard = state.cards.find(c => c.letter === 'ق')!;
      const res = processLetterCardTap(state, qCard.id, 5000);
      expect(res.state.firstTapAt).toBe(5000);
      expect(res.state.wordShownAt).toBeLessThanOrEqual(5000);
    });

    it('calculates activeSolveMs accurately from firstTapAt to completedAt', () => {
      let state = initWordLettersRound(sampleWordQalam, 1);
      state.wordShownAt = 1000;

      const qCard = state.cards.find(c => c.letter === 'ق' && !c.isDistractor)!;
      const lCard = state.cards.find(c => c.letter === 'ل' && !c.isDistractor)!;
      const mCard = state.cards.find(c => c.letter === 'م' && !c.isDistractor)!;

      state = processLetterCardTap(state, qCard.id, 4000).state; // first tap at 4000 (after 3000ms pause)
      state = processLetterCardTap(state, lCard.id, 5000).state;
      state = processLetterCardTap(state, mCard.id, 6000).state; // completed at 6000

      const result = finalizeRoundResult(state, 0);
      expect(result.firstTapAt).toBe(4000);
      expect(result.completedAt).toBe(6000);
      expect(result.activeSolveMs).toBe(2000); // 6000 - 4000
      expect(result.viewToFirstTapMs).toBe(3000); // 4000 - 1000
      expect(result.firstPass).toBe(true);
      expect(result.points).toBe(10 + (3 * 2) + 5 + 3); // 24 points!
    });
  });

  describe('7. Scoring Formula', () => {
    it('applies completion (10), letter (2*n), zero-error (5), and zero-hint (3) bonuses', () => {
      let state = initWordLettersRound(sampleWordBab, 1);
      // word is 3 letters
      const b1 = state.cards.filter(c => c.letter === 'ب')[0];
      const b2 = state.cards.filter(c => c.letter === 'ب')[1];
      const a = state.cards.find(c => c.letter === 'ا')!;

      state = processLetterCardTap(state, b1.id, 1000).state;
      state = processLetterCardTap(state, a.id, 2000).state;
      state = processLetterCardTap(state, b2.id, 3000).state;

      const score = calculateRoundScore(state);
      // 10 + (3 * 2) + 5 + 3 = 24
      expect(score).toBe(24);
    });
  });
});
