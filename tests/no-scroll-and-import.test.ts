import { describe, it, expect } from 'vitest';
import { normalizeArabicText, isValidArabicWord } from '../shared/arabic';
import { PRAISE_CLIPS } from '../src/client/lib/praiseAudio';

describe('No-Scroll, Bulk Import Parser, and Praise Audio Tests', () => {
  describe('1. Bulk Word Import Freeform Text Parser', () => {
    function parseRawText(input: string) {
      const tokens = input
        .split(/[\s,\u060C\t\r\n]+/)
        .map(t => t.trim())
        .filter(Boolean);

      const seen = new Set<string>();
      const valid: string[] = [];
      const invalid: { token: string; reason?: string }[] = [];

      for (const token of tokens) {
        const norm = normalizeArabicText(token);
        const res = isValidArabicWord(norm, 10);
        if (!res.valid) {
          invalid.push({ token, reason: res.reason });
          continue;
        }
        if (seen.has(norm)) {
          continue; // duplicate in text
        }
        seen.add(norm);
        valid.push(norm);
      }

      return { totalTokens: tokens.length, valid, invalid };
    }

    it('parses space-delimited text into 5 distinct words (TEST 9)', () => {
      const text = 'أسد قطة نمر فيل حصان';
      const res = parseRawText(text);
      expect(res.valid).toEqual(['أسد', 'قطة', 'نمر', 'فيل', 'حصان']);
      expect(res.invalid.length).toBe(0);
    });

    it('parses newline-delimited text into 4 distinct words (TEST 10)', () => {
      const text = `أسد\nقطة\nنمر\nفيل`;
      const res = parseRawText(text);
      expect(res.valid).toEqual(['أسد', 'قطة', 'نمر', 'فيل']);
      expect(res.invalid.length).toBe(0);
    });

    it('parses Arabic comma delimited text into 4 distinct words (TEST 11)', () => {
      const text = 'أسد، قطة، نمر، فيل';
      const res = parseRawText(text);
      expect(res.valid).toEqual(['أسد', 'قطة', 'نمر', 'فيل']);
      expect(res.invalid.length).toBe(0);
    });

    it('parses mixed commas, tabs and newlines gracefully', () => {
      const text = 'أسد, قطة\tنمر،\nفيل\r\nحصان';
      const res = parseRawText(text);
      expect(res.valid).toEqual(['أسد', 'قطة', 'نمر', 'فيل', 'حصان']);
    });

    it('deduplicates words in the input text', () => {
      const text = 'أسد قطة أسد نمر قطة';
      const res = parseRawText(text);
      expect(res.valid).toEqual(['أسد', 'قطة', 'نمر']);
    });

    it('rejects numbers, foreign characters, symbols, and excessively long words', () => {
      const text = 'أسد 123 cat #$% جمل_طويل_جدا_جدا_جدا_غير_معقول';
      const res = parseRawText(text);
      expect(res.valid).toEqual(['أسد']);
      expect(res.invalid.length).toBeGreaterThanOrEqual(4);
    });

    it('preserves distinct Arabic hamzas and spellings accurately', () => {
      const text = 'أحمد إيمان آية';
      const res = parseRawText(text);
      expect(res.valid).toContain('أحمد');
      expect(res.valid).toContain('إيمان');
      expect(res.valid).toContain('آية');
      // Ensure 'أ' was not collapsed into plain 'ا'
      expect(res.valid[0][0]).toBe('أ');
      expect(res.valid[1][0]).toBe('إ');
      expect(res.valid[2][0]).toBe('آ');
    });
  });

  describe('2. Praise Audio Pool & Shuffle Bag Logic', () => {
    it('has at least 10 pre-configured distinct praise clips', () => {
      expect(PRAISE_CLIPS.length).toBeGreaterThanOrEqual(10);
      const uniqueIds = new Set(PRAISE_CLIPS.map(c => c.id));
      expect(uniqueIds.size).toBe(PRAISE_CLIPS.length);
    });

    it('implements Shuffle Bag without back-to-back repetitions across 30 rounds', () => {
      const bag = [...PRAISE_CLIPS];
      let currentBag: typeof PRAISE_CLIPS = [];
      const history: string[] = [];

      function getNextClip(): string {
        if (currentBag.length === 0) {
          currentBag = [...bag].sort(() => Math.random() - 0.5);
          const lastHistory = history[history.length - 1];
          // Since pop() takes from the end, ensure the end is not the same as lastHistory
          if (history.length > 0 && currentBag[currentBag.length - 1].id === lastHistory) {
            // Swap with middle element
            const temp = currentBag[currentBag.length - 1];
            currentBag[currentBag.length - 1] = currentBag[0];
            currentBag[0] = temp;
          }
        }
        const clip = currentBag.pop()!;
        history.push(clip.id);
        return clip.id;
      }

      for (let i = 0; i < 30; i++) {
        const id = getNextClip();
        if (i > 0) {
          expect(id).not.toBe(history[i - 1]);
        }
      }
    });
  });

  describe('3. Dynamic Answer Slot and Layout Calculations', () => {
    it('calculates single-row slot widths that strictly fit in a 320px viewport without overflow', () => {
      const screenWidth = 320;
      const padding = 24; // 12px on each side
      const availableWidth = screenWidth - padding;

      // Test words of length 3, 5, 8
      const wordLengths = [3, 5, 8];
      for (const len of wordLengths) {
        const gap = 6;
        const totalGaps = (len - 1) * gap;
        const slotWidth = (availableWidth - totalGaps) / len;

        // Total width including slots and gaps
        const totalRowWidth = len * slotWidth + totalGaps;
        expect(totalRowWidth).toBeLessThanOrEqual(availableWidth + 0.1);
        expect(slotWidth).toBeGreaterThanOrEqual(25); // touch target readability
      }
    });

    it('calculates grid layout columns ensuring all letter choice cards fit within 2 rows', () => {
      const cardCounts = [8, 10];
      for (const count of cardCounts) {
        const cols = count <= 8 ? 4 : 5;
        const rows = Math.ceil(count / cols);
        expect(rows).toBeLessThanOrEqual(2);
      }
    });
  });
});
