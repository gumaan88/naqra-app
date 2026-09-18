import React, { useState } from 'react';
import { api } from '../lib/api';
import { sound } from '../lib/audio';
import { normalizeArabicText, isValidArabicWord } from '@shared/arabic';
import { X, FileText, CheckCircle2, AlertTriangle, XCircle, Sparkles, Loader2, ArrowRight } from 'lucide-react';

interface BulkWordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addedWords?: any[]) => void;
  existingParentWords: { normalized_text: string }[];
  availableCategories?: string[];
}

interface ParsedWordItem {
  raw: string;
  normalized: string;
  status: 'valid' | 'existing' | 'invalid';
  reason?: string;
}

const DEFAULT_CATEGORIES = [
  'حيوانات',
  'عائلة',
  'منزل',
  'مدرسة',
  'طبيعة',
  'طعام',
  'مواصلات',
  'أدوات',
  'جسم الإنسان',
  'أفعال',
  'كلمات عامة'
];

export const BulkWordImportModal: React.FC<BulkWordImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  existingParentWords,
  availableCategories = DEFAULT_CATEGORIES
}) => {
  const categoryOptions = availableCategories.length > 0 ? availableCategories : DEFAULT_CATEGORIES;
  const [category, setCategory] = useState<string>(categoryOptions[0] || 'حيوانات');
  const [level, setLevel] = useState<number>(1);
  const [rawText, setRawText] = useState<string>('');
  
  // Step 1 = Input, Step 2 = Preview & Confirmation
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [parsedItems, setParsedItems] = useState<ParsedWordItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Client-side parser for preview
  const handleProcessText = () => {
    sound.playTap();
    if (!rawText.trim()) return;

    const existingNormSet = new Set(existingParentWords.map(w => w.normalized_text));
    const tokens = rawText
      .split(/[\s,\u060C\t\r\n]+/)
      .map(t => t.trim())
      .filter(Boolean);

    const seenInText = new Set<string>();
    const items: ParsedWordItem[] = [];

    for (const token of tokens) {
      const norm = normalizeArabicText(token);
      const validation = isValidArabicWord(norm, 10);

      if (!validation.valid) {
        items.push({
          raw: token,
          normalized: norm,
          status: 'invalid',
          reason: validation.reason || 'غير صالحة'
        });
        continue;
      }

      if (seenInText.has(norm)) {
        continue; // deduplicate within batch
      }
      seenInText.add(norm);

      if (existingNormSet.has(norm)) {
        items.push({
          raw: token,
          normalized: norm,
          status: 'existing',
          reason: 'موجودة مسبقاً في مجموعتك'
        });
      } else {
        items.push({
          raw: token,
          normalized: norm,
          status: 'valid'
        });
      }
    }

    setParsedItems(items);
    setStep('preview');
  };

  const handleImportSubmit = async () => {
    sound.playTap();
    setIsSubmitting(true);
    setResultMessage(null);

    try {
      const res = await api.words.bulkImport({
        category,
        difficultyLevel: level,
        rawWords: rawText
      });

      if (res.ok || res.success) {
        sound.playSuccess();
        setResultMessage(res.message);
        setTimeout(() => {
          onSuccess(res.words);
          handleReset();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      sound.playError();
      setResultMessage(err.message || 'حدث خطأ أثناء استيراد الكلمات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setRawText('');
    setParsedItems([]);
    setStep('input');
    setResultMessage(null);
  };

  const validCount = parsedItems.filter(i => i.status === 'valid').length;
  const existingCount = parsedItems.filter(i => i.status === 'existing').length;
  const invalidCount = parsedItems.filter(i => i.status === 'invalid').length;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-brand-turquoise flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-text">استيراد كلمات دفعة واحدة</h3>
              <p className="text-xs text-gray-500 font-medium">ألصق قائمة الكلمات وسيتعرف عليها النظام تلقائياً</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          {step === 'input' ? (
            <>
              {/* Category & Level Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">اختر الصنف / الفئة:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-2xl border border-gray-300 text-sm font-bold bg-white focus:border-brand-turquoise outline-none"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">مستوى الصعوبة:</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(Number(e.target.value))}
                    className="w-full h-11 px-3.5 rounded-2xl border border-gray-300 text-sm font-bold bg-white focus:border-brand-turquoise outline-none"
                  >
                    <option value={1}>المستوى 1 (كلمات بسيطة 2-3 حروف)</option>
                    <option value={2}>المستوى 2 (كلمات 3-4 حروف)</option>
                    <option value={3}>المستوى 3 (كلمات 4-5 حروف)</option>
                    <option value={4}>المستوى 4 (كلمات متقدمة)</option>
                    <option value={5}>المستوى 5 (كلمات طويلة)</option>
                  </select>
                </div>
              </div>

              {/* Textarea */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  الصق الكلمات هنا، وسيتم التعرف عليها تلقائيًا:
                </label>
                <textarea
                  rows={7}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`مثال:\nأسد قطة نمر فيل حصان غزال أرنب\nأو:\nأسد، قطة، نمر، فيل\nأو كل كلمة في سطر مستقل`}
                  className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-brand-turquoise outline-none text-sm font-arabic font-bold text-gray-800 leading-relaxed resize-none"
                  dir="rtl"
                />
                <p className="text-[11px] text-gray-400 mt-1 font-medium">
                  يدعم المسافات، الأسطر، الفاصلة العربية (،)، الفاصلة الإنجليزية (,) والمسافات البادئة (Tabs).
                </p>
              </div>
            </>
          ) : (
            /* Preview Step */
            <div className="space-y-4">
              {/* Stats overview banner */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <div className="text-xl font-black text-emerald-700">{validCount}</div>
                  <div className="text-xs font-bold text-emerald-800">جديدة صالحة ✓</div>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                  <div className="text-xl font-black text-amber-700">{existingCount}</div>
                  <div className="text-xs font-bold text-amber-800">موجودة مسبقاً ⚠</div>
                </div>

                <div className="p-3 rounded-2xl bg-red-50 border border-red-200">
                  <div className="text-xl font-black text-red-700">{invalidCount}</div>
                  <div className="text-xs font-bold text-red-800">غير صالحة ✕</div>
                </div>
              </div>

              {/* Chips container */}
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2">معاينة الكلمات المستخرجة:</div>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 rounded-2xl bg-gray-50 border border-gray-200">
                  {parsedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm ${
                        item.status === 'valid'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : item.status === 'existing'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-red-100 text-red-900 border border-red-300'
                      }`}
                      title={item.reason}
                    >
                      <span>{item.raw}</span>
                      {item.status === 'valid' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {item.status === 'existing' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                      {item.status === 'invalid' && <XCircle className="w-3.5 h-3.5 text-red-600" />}
                    </div>
                  ))}
                </div>
              </div>

              {resultMessage && (
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-brand-turquoise text-xs font-bold text-center">
                  {resultMessage}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="btn-child !min-h-[44px] px-5 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={!rawText.trim()}
                onClick={handleProcessText}
                className="btn-child !min-h-[44px] px-6 bg-brand-turquoise text-white text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                <span>معالجة الكلمات</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="btn-child !min-h-[44px] px-4 bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5"
              >
                <ArrowRight className="w-4 h-4" />
                <span>تعديل النص</span>
              </button>

              <button
                type="button"
                disabled={validCount === 0 || isSubmitting}
                onClick={handleImportSubmit}
                className="btn-child !min-h-[44px] px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md flex items-center gap-2 disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري الحفظ...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>إضافة الكلمات ({validCount})</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
