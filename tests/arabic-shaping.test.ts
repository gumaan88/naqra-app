import { describe, it, expect } from 'vitest';
import { getArabicGraphemes } from '../src/client/components/ArabicWordDisplay';
import { normalizeArabicText, splitArabicLetters, getArabicPositionalLetter } from '../shared/arabic';

describe('Arabic Connected Words & Shaping Verification', () => {
  const mandatoryWords = [
    'حديقة',
    'مدرسة',
    'سيارة',
    'كتاب',
    'شجرة',
    'أحمد',
    'باب',
    'تفاحة',
    'مدينة',
    'مكتبة'
  ];

  describe('1. Grapheme Segmentation & Boundary Preservation', () => {
    it('segments each mandatory Arabic word into accurate graphemes without splitting characters', () => {
      for (const word of mandatoryWords) {
        const graphemes = getArabicGraphemes(word);
        expect(graphemes.length).toBeGreaterThanOrEqual(3);

        // Reconstructed text from graphemes must match the original word exactly
        const reconstructed = graphemes.map(g => g.grapheme).join('');
        expect(reconstructed).toBe(word);

        // Ensure indices are monotonically increasing from 0
        expect(graphemes[0].index).toBe(0);
        for (let i = 1; i < graphemes.length; i++) {
          expect(graphemes[i].index).toBe(graphemes[i - 1].index + graphemes[i - 1].length);
        }
      }
    });

    it('handles connected word "حديقة" with exact 5 graphemes and proper ranges', () => {
      const word = 'حديقة';
      const graphemes = getArabicGraphemes(word);
      expect(graphemes.length).toBe(5);
      expect(graphemes.map(g => g.grapheme)).toEqual(['ح', 'د', 'ي', 'ق', 'ة']);

      // First grapheme 'ح' at offset 0
      expect(graphemes[0].index).toBe(0);
      expect(graphemes[0].length).toBe(1);

      // Third grapheme 'ي' at offset 2
      expect(graphemes[2].index).toBe(2);
      expect(graphemes[2].length).toBe(1);

      // Last grapheme 'ة' at offset 4
      expect(graphemes[4].index).toBe(4);
      expect(graphemes[4].length).toBe(1);
    });

    it('handles repeated connected letters in "باب"', () => {
      const word = 'باب';
      const graphemes = getArabicGraphemes(word);
      expect(graphemes.length).toBe(3);
      expect(graphemes[0].grapheme).toBe('ب');
      expect(graphemes[1].grapheme).toBe('ا');
      expect(graphemes[2].grapheme).toBe('ب');
      expect(graphemes[0].index).toBe(0);
      expect(graphemes[2].index).toBe(2);
    });

    it('handles "تفاحة" with taa marbouta correctly', () => {
      const word = 'تفاحة';
      const graphemes = getArabicGraphemes(word);
      expect(graphemes.length).toBe(5);
      expect(graphemes[4].grapheme).toBe('ة');
    });
  });

  describe('2. Custom Highlight Range Calculations', () => {
    it('computes completed and current ranges without DOM text separation', () => {
      const word = 'مدرسة';
      const graphemes = getArabicGraphemes(word);

      // Suppose expectedIndex is 2 (child solved 'م' and 'د', now on 'ر')
      const expectedIndex = 2;

      // Completed range: from 0 to end of index 1
      const completedEnd = graphemes[expectedIndex - 1].index + graphemes[expectedIndex - 1].length;
      expect(completedEnd).toBe(2);

      // Current range: grapheme at index 2 ('ر')
      const currentStart = graphemes[expectedIndex].index;
      const currentEnd = currentStart + graphemes[expectedIndex].length;
      expect(currentStart).toBe(2);
      expect(currentEnd).toBe(3);
      expect(word.substring(currentStart, currentEnd)).toBe('ر');
    });
  });

  describe('3. Contextual Positional Shaping in Slots (أشكال ومدود الحروف)', () => {
    it('shapes standard dual-connecting word "كَتَبَ" correctly', () => {
      const letters = splitArabicLetters('كَتَبَ'); // ['ك', 'ت', 'ب']
      const shaped = letters.map((_, i) => getArabicPositionalLetter(letters, i));
      expect(shaped).toEqual(['كـ', 'ـتـ', 'ـب']);
    });

    it('shapes "نقرأ" correctly with medial qaaf and isolated hamza', () => {
      const letters = splitArabicLetters('نقرأ'); // ['ن', 'ق', 'ر', 'أ']
      const shaped = letters.map((_, i) => getArabicPositionalLetter(letters, i));
      expect(shaped).toEqual(['نـ', 'ـقـ', 'ـر', 'أ']);
    });

    it('shapes "باب" with isolated final baa due to preceding alif (حرف رافس)', () => {
      const letters = splitArabicLetters('باب'); // ['ب', 'ا', 'ب']
      const shaped = letters.map((_, i) => getArabicPositionalLetter(letters, i));
      expect(shaped).toEqual(['بـ', 'ـا', 'ب']);
    });

    it('shapes "أسد" with isolated alif, initial seen, and final dal', () => {
      const letters = splitArabicLetters('أسد'); // ['أ', 'س', 'د']
      const shaped = letters.map((_, i) => getArabicPositionalLetter(letters, i));
      expect(shaped).toEqual(['أ', 'سـ', 'ـد']);
    });

    it('shapes complex word "مدرسة" with sequential rafeesa letters (د, ر)', () => {
      const letters = splitArabicLetters('مدرسة'); // ['م', 'د', 'ر', 'س', 'ة']
      const shaped = letters.map((_, i) => getArabicPositionalLetter(letters, i));
      expect(shaped).toEqual(['مـ', 'ـد', 'ر', 'سـ', 'ـة']);
    });

    it('shapes fully disconnected word "وردة" as isolated letters', () => {
      const letters = splitArabicLetters('وردة'); // ['و', 'ر', 'د', 'ة']
      const shaped = letters.map((_, i) => getArabicPositionalLetter(letters, i));
      expect(shaped).toEqual(['و', 'ر', 'د', 'ة']);
    });

    it('never produces empty strings or allows letters to vanish for all mandatory words', () => {
      for (const word of mandatoryWords) {
        const letters = splitArabicLetters(word);
        letters.forEach((char, idx) => {
          const shaped = getArabicPositionalLetter(letters, idx);
          expect(shaped).toBeTruthy();
          expect(shaped.length).toBeGreaterThanOrEqual(1);
          // Shaped letter must strictly contain the root Arabic character
          expect(shaped).toContain(char);
        });
      }
    });
  });
});

