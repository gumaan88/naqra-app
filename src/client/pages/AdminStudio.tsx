import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { Word } from '@shared/types';
import {
  ShieldCheck, Sparkles, Plus, Check, X, Archive,
  Filter, Database, Cpu, Search, AlertCircle
} from 'lucide-react';
import { sound } from '../lib/audio';

export const AdminStudio: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [words, setWords] = useState<Word[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // AI Generator state
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiLevel, setAiLevel] = useState<number>(1);
  const [aiCategory, setAiCategory] = useState<string>('حيوانات');
  const [aiCount, setAiCount] = useState<number>(5);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generateMsg, setGenerateMsg] = useState<string | null>(null);

  // Manual Add state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newWordText, setNewWordText] = useState<string>('');
  const [newWordCategory, setNewWordCategory] = useState<string>('عام');
  const [newWordLevel, setNewWordLevel] = useState<number>(1);
  const [addingWord, setAddingWord] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterLevel, filterCategory]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wordsRes, statsRes] = await Promise.all([
        api.admin.getWords({
          status: filterStatus || undefined,
          level: filterLevel ? Number(filterLevel) : undefined,
          category: filterCategory || undefined,
        }),
        api.admin.getStats(),
      ]);

      if (wordsRes.success) setWords(wordsRes.words || []);
      if (statsRes.success) setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (wordId: string, status: string) => {
    sound.playTap();
    try {
      await api.admin.updateWordStatus(wordId, status);
      setWords(prev => prev.map(w => w.id === wordId ? { ...w, status: status as any } : w));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenerateMsg(null);

    try {
      const res = await api.admin.generateWords({
        level: aiLevel,
        category: aiCategory,
        count: aiCount,
      });

      if (res.success) {
        sound.playSuccess();
        setGenerateMsg(res.message);
        setShowAiModal(false);
        loadData();
      }
    } catch (err: any) {
      setGenerateMsg(err.message || 'فشل التوليد');
    } finally {
      setGenerating(false);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordText.trim()) return;
    setAddingWord(true);
    setAddError(null);

    try {
      const res = await api.admin.addWord({
        text: newWordText.trim(),
        category: newWordCategory,
        difficulty_level: newWordLevel,
        is_imageable: true,
      });

      if (res.success) {
        sound.playSuccess();
        setNewWordText('');
        setShowAddModal(false);
        loadData();
      }
    } catch (err: any) {
      setAddError(err.message || 'فشلت إضافة الكلمة');
    } finally {
      setAddingWord(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-6xl mx-auto px-4 py-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-brand-text flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-600" />
            <span>استوديو إدارة المحتوى والذكاء الاصطناعي</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            إدارة بنك الكلمات، توليد الدفعات، واعتماد المحتوى قبل وصوله للأطفال
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAiModal(true)}
            className="btn-child px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md flex items-center gap-1.5"
          >
            <Cpu className="w-4 h-4" />
            <span>توليد بالذكاء الاصطناعي</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-child px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كلمة يدوياً</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-sm">
            <div className="text-xs font-bold text-gray-400 mb-1">كلمات معتمدة (Approved)</div>
            <div className="text-3xl font-black text-emerald-700">{stats.wordsStats?.approved || 0}</div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-sm">
            <div className="text-xs font-bold text-gray-400 mb-1">بانتظار المراجعة (Pending)</div>
            <div className="text-3xl font-black text-amber-600">{stats.wordsStats?.pending || 0}</div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-purple-200 shadow-sm">
            <div className="text-xs font-bold text-gray-400 mb-1">إجمالي الأطفال</div>
            <div className="text-3xl font-black text-brand-purple">{stats.totalChildren || 0}</div>
          </div>
          <div className="bg-white rounded-3xl p-5 border border-teal-200 shadow-sm">
            <div className="text-xs font-bold text-gray-400 mb-1">إجمالي الجلسات</div>
            <div className="text-3xl font-black text-brand-turquoise">{stats.totalSessions || 0}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm mb-6 flex flex-wrap items-center gap-3 text-xs font-bold">
        <div className="flex items-center gap-1.5 text-gray-500">
          <Filter className="w-4 h-4" />
          <span>تصفية:</span>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-9 px-3 rounded-xl border border-gray-300 outline-none bg-white text-gray-700"
        >
          <option value="">جميع الحالات</option>
          <option value="approved">معتمدة (Approved)</option>
          <option value="pending">بانتظار الاعتماد (Pending)</option>
          <option value="rejected">مرفوضة (Rejected)</option>
          <option value="archived">مؤرشفة (Archived)</option>
        </select>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="h-9 px-3 rounded-xl border border-gray-300 outline-none bg-white text-gray-700"
        >
          <option value="">جميع المستويات</option>
          <option value="1">المستوى 1</option>
          <option value="2">المستوى 2</option>
          <option value="3">المستوى 3</option>
          <option value="4">المستوى 4</option>
          <option value="5">المستوى 5</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="h-9 px-3 rounded-xl border border-gray-300 outline-none bg-white text-gray-700"
        >
          <option value="">جميع الفئات</option>
          <option value="حيوانات">حيوانات</option>
          <option value="فواكه">فواكه</option>
          <option value="طبيعة">طبيعة</option>
          <option value="أدوات">أدوات</option>
          <option value="عائلة">عائلة</option>
          <option value="مركبات">مركبات</option>
        </select>

        <div className="mr-auto text-gray-400 font-normal">
          عرض {words.length} كلمة
        </div>
      </div>

      {/* Words Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-500">جاري تحميل بنك الكلمات...</p>
        </div>
      ) : words.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-600">لا توجد كلمات مطابقة لمعايير البحث</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {words.map((word) => (
            <div
              key={word.id}
              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                {word.image_url ? (
                  <img src={word.image_url} alt={word.text} className="w-12 h-12 rounded-xl object-contain bg-gray-50 p-1 border border-gray-100" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-brand-turquoise font-black flex items-center justify-center text-lg">
                    {word.text[0]}
                  </div>
                )}
                <div>
                  <div className="text-xl font-black text-brand-text">{word.text}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mt-0.5">
                    <span>مستوى {word.difficulty_level}</span>
                    <span>•</span>
                    <span>{word.category}</span>
                    {word.source === 'ai' && (
                      <span className="text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded text-[10px]">AI</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-1.5">
                {word.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus(word.id, 'approved')}
                    className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors"
                    title="اعتماد"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}

                {word.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(word.id, 'rejected')}
                    className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors"
                    title="رفض"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {word.status !== 'archived' && (
                  <button
                    onClick={() => handleUpdateStatus(word.id, 'archived')}
                    className="w-8 h-8 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-300 flex items-center justify-center transition-colors"
                    title="أرشفة"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Generate Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-emerald-600">
            <h3 className="text-xl font-black text-brand-text mb-1">
              توليد كلمات بالذكاء الاصطناعي (Workers AI)
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              يتم تنظيف الكلمات وفحصها لغوياً وإضافتها في حالة "بانتظار الاعتماد" (Pending) تلقائياً.
            </p>

            <form onSubmit={handleGenerateAi} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">المستوى التعليمي المستهدف</label>
                <select
                  value={aiLevel}
                  onChange={(e) => setAiLevel(Number(e.target.value))}
                  className="w-full h-11 px-3 rounded-xl border border-gray-300 outline-none text-sm font-bold bg-white"
                >
                  <option value={1}>المستوى 1 (2-3 حروف)</option>
                  <option value={2}>المستوى 2 (3 حروف)</option>
                  <option value={3}>المستوى 3 (4 حروف)</option>
                  <option value={4}>المستوى 4 (4-5 حروف)</option>
                  <option value={5}>المستوى 5 (5-6 حروف)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الفئة الدلالية</label>
                <select
                  value={aiCategory}
                  onChange={(e) => setAiCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-gray-300 outline-none text-sm font-bold bg-white"
                >
                  <option value="حيوانات">حيوانات</option>
                  <option value="فواكه">فواكه</option>
                  <option value="طبيعة">طبيعة</option>
                  <option value="أدوات">أدوات</option>
                  <option value="أشياء">أشياء</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عدد الكلمات المطلوب</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 outline-none text-sm font-bold"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={generating}
                  className="btn-child flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {generating ? 'جاري التوليد والتحقق...' : 'بدء التوليد'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="btn-child px-4 bg-gray-100 text-gray-600 text-sm font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-brand-turquoise">
            <h3 className="text-xl font-black text-brand-text mb-4">إضافة كلمة يدوياً</h3>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddWord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الكلمة العربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: قمر"
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 outline-none text-base font-bold text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المستوى</label>
                  <select
                    value={newWordLevel}
                    onChange={(e) => setNewWordLevel(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 outline-none text-sm font-bold bg-white"
                  >
                    <option value={1}>المستوى 1</option>
                    <option value={2}>المستوى 2</option>
                    <option value={3}>المستوى 3</option>
                    <option value={4}>المستوى 4</option>
                    <option value={5}>المستوى 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الفئة</label>
                  <input
                    type="text"
                    value={newWordCategory}
                    onChange={(e) => setNewWordCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={addingWord}
                  className="btn-child flex-1 bg-brand-turquoise hover:bg-[#1C968E] text-white py-3 text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {addingWord ? 'جاري الإضافة...' : 'حفظ واعتماد'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-child px-4 bg-gray-100 text-gray-600 text-sm font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
