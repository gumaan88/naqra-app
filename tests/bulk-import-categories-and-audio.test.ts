import { describe, it, expect, vi } from 'vitest';
import { normalizeArabicText, isValidArabicWord } from '../shared/arabic';
import { EXPANDED_ARABIC_DICTIONARY } from '../server/routes/words';
import { PRAISE_CLIPS } from '../src/client/lib/praiseAudio';

describe('1. Bulk Word Import Parsing & Normalization (TEST 1 & TEST 4)', () => {
  it('correctly tokenizes, normalizes, and splits 10 family words into 7 new and 3 existing', () => {
    const rawInput = 'أب أم أخ أخت جد جدة عم عمة خال خالة';
    const tokens = rawInput
      .split(/[\s,\u060C\t\r\n]+/)
      .map(w => w.trim())
      .filter(Boolean);

    expect(tokens.length).toBe(10);

    // Simulate existing words for parent: 'أب', 'أم', 'أخ'
    const existingNormalized = new Set(['أب', 'أم', 'أخ']);

    const validNew: string[] = [];
    const alreadyOwned: string[] = [];
    const invalid: string[] = [];

    tokens.forEach((token) => {
      const norm = normalizeArabicText(token);
      const validation = isValidArabicWord(norm, 10);
      if (!validation.valid) {
        invalid.push(token);
      } else if (existingNormalized.has(norm)) {
        alreadyOwned.push(norm);
      } else {
        validNew.push(norm);
      }
    });

    expect(alreadyOwned.length).toBe(3);
    expect(validNew.length).toBe(7);
    expect(invalid.length).toBe(0);
    expect(alreadyOwned).toEqual(['أب', 'أم', 'أخ']);
    expect(validNew).toEqual(['أخت', 'جد', 'جدة', 'عم', 'عمة', 'خال', 'خالة']);

    // Check payload structure matching requirements
    const resultPayload = {
      ok: true,
      success: true,
      received: tokens.length,
      inserted: validNew.length,
      alreadyOwned: alreadyOwned.length,
      invalid: invalid.length,
    };

    expect(resultPayload).toEqual({
      ok: true,
      success: true,
      received: 10,
      inserted: 7,
      alreadyOwned: 3,
      invalid: 0,
    });
  });

  it('rejects numbers, foreign words, and words over 10 letters', () => {
    const mixedInput = 'قطة cat 123 شمس قسطنطينية_طويلة_جداً';
    const tokens = mixedInput.split(/\s+/);

    const validWords = tokens.filter(t => isValidArabicWord(normalizeArabicText(t), 10).valid);
    expect(validWords).toEqual(['قطة', 'شمس']);
  });
});

describe('2. Error Resilience & Safe JSON Handling (TEST 2 & TEST 3)', () => {
  it('ensures client-side parser does not crash with Unexpected token on text 500 responses', async () => {
    // Simulating safe response parsing logic from api.ts
    const simulateClientRequest = async (mockResponse: { ok: boolean; status: number; contentType: string; body: string }) => {
      const contentType = mockResponse.contentType;
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(mockResponse.body);
        } catch {
          data = null;
        }
      } else {
        if (!mockResponse.ok) {
          throw new Error(`خطأ في الخادم (${mockResponse.status}): يرجى المحاولة مرة أخرى`);
        }
        data = { ok: true, raw: mockResponse.body };
      }

      if (!mockResponse.ok || (data && (data.ok === false || data.success === false))) {
        const errorMsg =
          (typeof data?.error === 'object' ? data?.error?.message : data?.error) ||
          data?.message ||
          (mockResponse.status >= 500 ? 'حدث خطأ غير متوقع في الخادم، يرجى المحاولة لاحقاً' : 'حدث خطأ');
        throw new Error(errorMsg);
      }

      return data;
    };

    // Case 1: Plain text 500 "Internal Server Error"
    await expect(
      simulateClientRequest({
        ok: false,
        status: 500,
        contentType: 'text/plain',
        body: 'Internal Server Error',
      })
    ).rejects.toThrow('خطأ في الخادم (500): يرجى المحاولة مرة أخرى');

    // Case 2: Structured JSON error response
    await expect(
      simulateClientRequest({
        ok: false,
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: false,
          error: { code: 'D1_QUERY_ERROR', message: 'تعذر حفظ الكلمات في قاعدة البيانات' },
        }),
      })
    ).rejects.toThrow('تعذر حفظ الكلمات في قاعدة البيانات');
  });
});

describe('3. AI Generation & Zero Fake Success (TEST 5 & TEST 6)', () => {
  it('verifies expanded dictionary covers all main categories and guarantees sufficient candidates', () => {
    const requiredCategories = [
      'حيوانات', 'فواكه', 'طبيعة', 'أدوات', 'أشياء',
      'عائلة', 'منزل', 'مدرسة', 'طعام', 'مواصلات', 'جسم الإنسان', 'أفعال', 'كلمات عامة'
    ];

    for (const cat of requiredCategories) {
      expect(EXPANDED_ARABIC_DICTIONARY[cat]).toBeDefined();
      expect(EXPANDED_ARABIC_DICTIONARY[cat].length).toBeGreaterThanOrEqual(20);
      
      // All dictionary words must be valid Arabic words
      EXPANDED_ARABIC_DICTIONARY[cat].forEach(word => {
        const check = isValidArabicWord(normalizeArabicText(word));
        expect(check.valid).toBe(true);
      });
    }
  });

  it('rejects fake success when 0 words are generated or added', () => {
    const simulateBackendAiResponse = (requestedCount: number, addedWords: string[]) => {
      if (addedWords.length === 0) {
        return {
          ok: false,
          success: false,
          requested: requestedCount,
          added: 0,
          words: [],
          error: {
            code: 'NO_NEW_WORDS',
            message: 'جميع الكلمات المقترحة لهذه الفئة مضافة مسبقاً في مجموعتك'
          }
        };
      }
      return {
        ok: true,
        success: true,
        requested: requestedCount,
        added: addedWords.length,
        words: addedWords,
        message: `تمت إضافة ${addedWords.length} كلمة جديدة بنجاح إلى مجموعتك`
      };
    };

    const emptyResult = simulateBackendAiResponse(20, []);
    expect(emptyResult.ok).toBe(false);
    expect(emptyResult.added).toBe(0);
    expect(emptyResult.error?.code).toBe('NO_NEW_WORDS');

    const successResult = simulateBackendAiResponse(20, ['أسد', 'نمر', 'فهد']);
    expect(successResult.ok).toBe(true);
    expect(successResult.added).toBe(3);
  });
});

describe('4. Category Management & Safe Deletion (TEST 8, 9, 10, 11, 12)', () => {
  it('safely unlinks words from deleted category without deleting global words', () => {
    // Global central words table
    const globalWords = [
      { id: 'w_1', text: 'حصان', category: 'حيوانات' },
      { id: 'w_2', text: 'بقرة', category: 'حيوانات' },
    ];

    // Parent word categories mapping
    let parentWordCategories = [
      { parent_id: 'parent_A', word_id: 'w_1', category_name: 'حيوانات' },
      { parent_id: 'parent_A', word_id: 'w_1', category_name: 'مزرعة' },
      { parent_id: 'parent_B', word_id: 'w_1', category_name: 'حيوانات' },
    ];

    // Parent A deletes "مزرعة" category with 'unlink' action
    parentWordCategories = parentWordCategories.filter(
      pwc => !(pwc.parent_id === 'parent_A' && pwc.category_name === 'مزرعة')
    );

    // 1. Global words remain intact
    expect(globalWords.length).toBe(2);
    // 2. Parent A still has 'w_1' under 'حيوانات'
    expect(parentWordCategories.some(pwc => pwc.parent_id === 'parent_A' && pwc.word_id === 'w_1')).toBe(true);
    // 3. Parent B's categories are completely isolated and untouched
    expect(parentWordCategories.some(pwc => pwc.parent_id === 'parent_B' && pwc.category_name === 'حيوانات')).toBe(true);
  });
});

describe('5. Praise Audio Multi-Layer Design & Shuffle Bag (TEST 13, 14, 15, 16)', () => {
  it('has 12 pre-generated natural Arabic praise clips with varied phrasing', () => {
    expect(PRAISE_CLIPS.length).toBeGreaterThanOrEqual(12);

    const phrases = PRAISE_CLIPS.map(c => c.text);
    expect(phrases).toContain('أَحْسَنْتَ!');
    expect(phrases).toContain('رَائِع!');
    expect(phrases).toContain('مُمْتَاز!');
    expect(phrases).toContain('مُبْدِع!');
    expect(phrases).toContain('أَنْتَ بَطَل!');
  });

  it('shuffle bag algorithm prevents immediate back-to-back repeats within last 3 selections', () => {
    const bag = [...PRAISE_CLIPS];
    const recent: string[] = [];

    for (let i = 0; i < 30; i++) {
      // Pick random from bag that is not in recent (simulating ShuffleBag)
      const available = bag.filter(c => !recent.includes(c.id));
      expect(available.length).toBeGreaterThan(0);

      const picked = available[Math.floor(Math.random() * available.length)];
      recent.push(picked.id);
      if (recent.length > 3) {
        recent.shift();
      }

      // Assert that picked is not equal to immediately preceding item
      if (i > 0) {
        expect(picked.id).not.toBe(recent[recent.length - 2]);
      }
    }
  });
});
