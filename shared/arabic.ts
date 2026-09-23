// Arabic text utilities for Naqra Platform

// All Arabic tashkeel marks + shadda
export const TASHKEEL_REGEX = /[\u064B-\u0652\u0653-\u065F\u0670]/g;
export const TATWEEL_REGEX = /\u0640/g;

/**
 * Remove tashkeel and tatweel while strictly preserving distinct Arabic letter identities:
 * أ, إ, آ, ؤ, ئ, ة, ى, etc. are preserved.
 */
export function normalizeArabicText(text: string): string {
  if (!text) return '';
  return text
    .replace(TASHKEEL_REGEX, '')
    .replace(TATWEEL_REGEX, '')
    .trim();
}

/**
 * Split a normalized Arabic word into individual character units
 */
export function splitArabicLetters(word: string): string[] {
  const clean = normalizeArabicText(word);
  // Array.from splits UTF-16 surrogate pairs safely
  return Array.from(clean);
}

/**
 * Validate Arabic word according to spec:
 * - Only Arabic letters
 * - No numbers, symbols, spaces, dashes
 * - Appropriate length (2 to 7 letters)
 */
export function isValidArabicWord(text: string, maxLen: number = 10): { valid: boolean; reason?: string } {
  const normalized = normalizeArabicText(text);
  if (!normalized) {
    return { valid: false, reason: 'الكلمة فارغة' };
  }
  if (normalized.length < 2 || normalized.length > maxLen) {
    return { valid: false, reason: `طول الكلمة يجب أن يكون بين حرفين و ${maxLen} حروف` };
  }
  // Arabic Unicode range \u0621-\u064A and \u0671 (alif wasla)
  const arabicOnlyRegex = /^[\u0621-\u064A\u0671]+$/;
  if (!arabicOnlyRegex.test(normalized)) {
    return { valid: false, reason: 'تحتوي الكلمة على رموز أو أرقام أو حروف غير عربية' };
  }
  return { valid: true };
}

/**
 * Arabic non-connecting letters (الحروف الرافسة / حروف الانفصال):
 * Letters that cannot join to a following letter (they only connect from the right / before).
 * Plus standalone Hamza (ء) which never connects in either direction.
 */
export const NON_CONNECTING_AFTER = new Set([
  'ا', 'أ', 'إ', 'آ', 'ٱ',
  'د', 'ذ',
  'ر', 'ز',
  'و', 'ؤ',
  'ة', 'ى',
  'ء',
]);

/**
 * Returns the contextual positional form of an Arabic letter in a word
 * using standard Arabic Tatweel / Kashida (\u0640 / 'ـ') extensions.
 *
 * Rules:
 * - canConnectBefore: True if preceded by a letter that connects forward (not rafeesa / not hamza).
 * - canConnectAfter: True if followed by a letter, current letter is not rafeesa, and next is not hamza.
 *
 * Shapes:
 * - Medial (ـبـ): Connected before and after
 * - Initial (بـ): Connected after only
 * - Final (ـب): Connected before only
 * - Isolated (ب): Neither connects
 */
export function getArabicPositionalLetter(
  wordOrLetters: string | string[],
  index: number
): string {
  const letters = Array.isArray(wordOrLetters)
    ? wordOrLetters
    : splitArabicLetters(wordOrLetters);

  if (index < 0 || index >= letters.length) {
    return '';
  }

  const char = letters[index];
  if (!char) return '';

  // Standalone Hamza never joins in either direction
  if (char === 'ء') {
    return 'ء';
  }

  const prevChar = index > 0 ? letters[index - 1] : null;
  const nextChar = index < letters.length - 1 ? letters[index + 1] : null;

  const canConnectBefore = Boolean(
    prevChar &&
    prevChar !== 'ء' &&
    !NON_CONNECTING_AFTER.has(prevChar)
  );

  const canConnectAfter = Boolean(
    nextChar &&
    nextChar !== 'ء' &&
    !NON_CONNECTING_AFTER.has(char)
  );

  if (canConnectBefore && canConnectAfter) {
    return `ـ${char}ـ`;
  }
  if (canConnectBefore) {
    return `ـ${char}`;
  }
  if (canConnectAfter) {
    return `${char}ـ`;
  }
  return char;
}


// Arabic alphabet pool
export const ARABIC_ALPHABET = [
  'ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش',
  'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي', 'ة'
];

// Visually similar Arabic letter groups for advanced level distractors
export const SIMILAR_LETTER_GROUPS: Record<string, string[]> = {
  'ب': ['ت', 'ث', 'ن', 'ي'],
  'ت': ['ب', 'ث', 'ن', 'ة'],
  'ث': ['ب', 'ت', 'ش'],
  'ج': ['ح', 'خ'],
  'ح': ['ج', 'خ'],
  'خ': ['ج', 'ح'],
  'د': ['ذ', 'ر'],
  'ذ': ['د', 'ز'],
  'ر': ['ز', 'د', 'و'],
  'ز': ['ر', 'ذ'],
  'س': ['ش', 'ص'],
  'ش': ['س', 'ث'],
  'ص': ['ض', 'س', 'ط'],
  'ض': ['ص', 'ظ'],
  'ط': ['ظ', 'ص'],
  'ظ': ['ط', 'ض'],
  'ع': ['غ'],
  'غ': ['ع', 'ف'],
  'ف': ['ق', 'غ'],
  'ق': ['ف'],
  'ك': ['ل'],
  'ل': ['ك', 'ا'],
  'م': ['ن', 'و'],
  'ن': ['ب', 'ت', 'ث', 'ي'],
  'ه': ['ة', 'و'],
  'ة': ['ه', 'ت'],
  'و': ['ر', 'د'],
  'ي': ['ب', 'ت', 'ى'],
  'ى': ['ي', 'ا'],
  'أ': ['إ', 'آ', 'ا'],
  'ا': ['أ', 'ل'],
};

/**
 * Generate distractor letters for a word according to difficulty level:
 * - Each letter in the word gets its own card (e.g. "باب" -> ['ب', 'ا', 'ب'])
 * - Distractors are chosen avoiding false duplicates
 * - At higher levels, visually similar distractors are preferred
 */
export function generateLetterCards(word: string, level: number = 1): {
  id: string;
  letter: string;
  originalIndex?: number;
  isDistractor: boolean;
}[] {
  const letters = splitArabicLetters(word);
  const wordLength = letters.length;
  
  // Total cards target based on spec:
  // 2-3 letters = 5-6 cards (2-3 distractors)
  // 4 letters = 6-7 cards (2-3 distractors)
  // 5-6 letters = 8-9 cards (3 distractors)
  let targetTotalCards = wordLength <= 3 ? 6 : (wordLength === 4 ? 7 : 8);
  const distractorsNeeded = Math.max(2, targetTotalCards - wordLength);

  const wordLetterSet = new Set(letters);
  const distractors: string[] = [];

  // Attempt to pick similar letters if level >= 3
  if (level >= 3) {
    for (const char of letters) {
      if (distractors.length >= distractorsNeeded) break;
      const similars = SIMILAR_LETTER_GROUPS[char] || [];
      for (const sim of similars) {
        if (!wordLetterSet.has(sim) && !distractors.includes(sim)) {
          distractors.push(sim);
          if (distractors.length >= distractorsNeeded) break;
        }
      }
    }
  }

  // Fill remaining distractors from general alphabet
  const shuffledAlphabet = [...ARABIC_ALPHABET].sort(() => Math.random() - 0.5);
  for (const char of shuffledAlphabet) {
    if (distractors.length >= distractorsNeeded) break;
    if (!wordLetterSet.has(char) && !distractors.includes(char)) {
      distractors.push(char);
    }
  }

  // Build target letter cards (each occurrence has a separate card with originalIndex)
  const cards: { id: string; letter: string; originalIndex?: number; isDistractor: boolean }[] = [];
  letters.forEach((char, index) => {
    cards.push({
      id: `target-${index}-${char}-${Math.random().toString(36).substring(2, 6)}`,
      letter: char,
      originalIndex: index,
      isDistractor: false,
    });
  });

  // Add distractor cards
  distractors.forEach((char, idx) => {
    cards.push({
      id: `distractor-${idx}-${char}-${Math.random().toString(36).substring(2, 6)}`,
      letter: char,
      isDistractor: true,
    });
  });

  // Shuffle locally
  return cards.sort(() => Math.random() - 0.5);
}
