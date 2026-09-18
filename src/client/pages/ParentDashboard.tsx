import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { Child, ChildAnalytics } from '@shared/types';
import {
  Users, UserPlus, Clock, Target, Award, Star,
  TrendingUp, AlertTriangle, CheckCircle, BookOpen,
  Trash2, Edit, X, Save, Plus, Cpu, ToggleLeft, ToggleRight,
  Copy, Check, Search, ShieldCheck, FileText
} from 'lucide-react';
import { sound } from '../lib/audio';
import { BulkWordImportModal } from '../components/BulkWordImportModal';

export const ParentDashboard: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'children' | 'words'>('children');

  // Children State
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ChildAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  // Add / Edit Child Modal state
  const [showChildModal, setShowChildModal] = useState<boolean>(false);
  const [editingChild, setEditingChild] = useState<Partial<Child> | null>(null);
  const [modalDisplayName, setModalDisplayName] = useState<string>('');
  const [modalLevel, setModalLevel] = useState<number>(1);
  const [modalAge, setModalAge] = useState<string>('');
  const [modalPin, setModalPin] = useState<string>('');
  const [savingChild, setSavingChild] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Parent Words State
  const [parentWords, setParentWords] = useState<any[]>([]);
  const [loadingWords, setLoadingWords] = useState<boolean>(false);
  const [wordSearch, setWordSearch] = useState<string>('');
  const [showAddWordModal, setShowAddWordModal] = useState<boolean>(false);
  const [newWordText, setNewWordText] = useState<string>('');
  const [newWordCategory, setNewWordCategory] = useState<string>('حيوانات');
  const [newWordLevel, setNewWordLevel] = useState<number>(1);
  const [addingWord, setAddingWord] = useState<boolean>(false);
  const [wordError, setWordError] = useState<string | null>(null);

  // AI Generation Modal
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [aiCount, setAiCount] = useState<number>(20);
  const [aiLevel, setAiLevel] = useState<number>(1);
  const [aiCategory, setAiCategory] = useState<string>('حيوانات');
  const [generatingAi, setGeneratingAi] = useState<boolean>(false);
  const [aiResultMsg, setAiResultMsg] = useState<string | null>(null);

  useEffect(() => {
    loadChildren();
    loadParentWords();
  }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const res = await api.children.list();
      if (res.success && res.children) {
        setChildrenList(res.children);
        if (res.children.length > 0) {
          const initialId = selectedChildId || res.children[0].id;
          setSelectedChildId(initialId);
          loadChildAnalytics(initialId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChildAnalytics = async (childId: string) => {
    setLoadingAnalytics(true);
    try {
      const res = await api.analytics.getChild(childId);
      if (res.success && res.analytics) {
        setAnalytics(res.analytics);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadParentWords = async () => {
    setLoadingWords(true);
    try {
      const res = await api.words.list();
      if (res.success && res.words) {
        setParentWords(res.words);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWords(false);
    }
  };

  const handleOpenAddChild = () => {
    sound.playTap();
    setEditingChild(null);
    setModalDisplayName('');
    setModalLevel(1);
    setModalAge('');
    // Auto-generate a random 4-digit code
    setModalPin(Math.floor(1000 + Math.random() * 9000).toString());
    setShowChildModal(true);
  };

  const handleOpenEditChild = (child: Child) => {
    sound.playTap();
    setEditingChild(child);
    setModalDisplayName(child.display_name);
    setModalLevel(child.current_level);
    setModalAge(child.age_or_birth_year ? String(child.age_or_birth_year) : '');
    setModalPin(child.local_code || Math.floor(1000 + Math.random() * 9000).toString());
    setShowChildModal(true);
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDisplayName.trim()) return;
    setSavingChild(true);

    try {
      if (editingChild && editingChild.id) {
        await api.children.update(editingChild.id, {
          display_name: modalDisplayName.trim(),
          current_level: modalLevel,
          age_or_birth_year: modalAge ? Number(modalAge) : undefined,
          local_code: modalPin.trim(),
        });
      } else {
        await api.children.create({
          display_name: modalDisplayName.trim(),
          current_level: modalLevel,
          age_or_birth_year: modalAge ? Number(modalAge) : undefined,
          local_code: modalPin.trim(),
        });
      }
      setShowChildModal(false);
      await loadChildren();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء حفظ بيانات الطفل');
    } finally {
      setSavingChild(false);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطفل؟ سيتم حذف تاريخ اللعب الخاص به نهائياً.')) return;
    try {
      await api.children.delete(childId);
      await loadChildren();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    sound.playTap();
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Words Handlers
  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWordText.trim()) return;
    setAddingWord(true);
    setWordError(null);

    try {
      const res = await api.words.add({
        text: newWordText.trim(),
        category: newWordCategory,
        difficulty_level: newWordLevel,
      });

      sound.playSuccess();
      setNewWordText('');
      setShowAddWordModal(false);
      await loadParentWords();
      if (res.alreadyExists) {
        alert(res.message);
      }
    } catch (err: any) {
      sound.playError();
      setWordError(err.message || 'فشلت إضافة الكلمة');
    } finally {
      setAddingWord(false);
    }
  };

  const handleToggleWord = async (wordId: string) => {
    sound.playTap();
    try {
      const res = await api.words.toggle(wordId);
      if (res.success) {
        setParentWords(prev => prev.map(w => w.id === wordId ? { ...w, enabled: res.enabled ? 1 : 0 } : w));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    sound.playTap();
    if (!confirm('هل تريد إزالة هذه الكلمة من مجموعة أطفالك؟')) return;
    try {
      await api.words.delete(wordId);
      setParentWords(prev => prev.filter(w => w.id !== wordId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAiWords = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneratingAi(true);
    setAiResultMsg(null);

    try {
      const res = await api.words.generate({
        count: aiCount,
        level: aiLevel,
        category: aiCategory,
      });

      if (res.success) {
        sound.playCelebration();
        setAiResultMsg(res.message);
        await loadParentWords();
        setTimeout(() => {
          setShowAiModal(false);
          setAiResultMsg(null);
        }, 1800);
      }
    } catch (err: any) {
      sound.playError();
      setAiResultMsg(err.message || 'فشل التوليد، حاول مرة أخرى');
    } finally {
      setGeneratingAi(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-gray-500">جاري تحميل لوحة ولي الأمر...</p>
      </div>
    );
  }

  const selectedChild = childrenList.find(c => c.id === selectedChildId);
  const filteredWords = parentWords.filter(w => !wordSearch || w.text.includes(wordSearch) || w.category.includes(wordSearch));

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-brand-text flex items-center gap-2">
            <span>لوحة ولي الأمر</span>
            <span className="text-xs px-2.5 py-1 bg-purple-100 text-brand-purple rounded-full font-bold">
              {user.name}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
            إدارة حسابات أطفالك ورموز دخولهم ومكتبة الكلمات التعليمية
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-2xl bg-purple-50 p-1.5 border border-purple-200 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveTab('children')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'children'
                ? 'bg-white text-brand-purple shadow-sm'
                : 'text-gray-600 hover:text-brand-purple'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>الأطفال والتحليلات</span>
          </button>
          <button
            onClick={() => setActiveTab('words')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'words'
                ? 'bg-white text-brand-purple shadow-sm'
                : 'text-gray-600 hover:text-brand-purple'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>مكتبة كلماتي ({parentWords.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'children' ? (
        /* Children & Analytics Section */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black text-brand-text">أطفالي المسجلون</h2>
            <button
              onClick={handleOpenAddChild}
              className="btn-child px-4 py-2 bg-brand-purple hover:bg-[#6246B5] text-white text-xs font-bold shadow-md flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة طفل</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bold">جاري تحميل بيانات أطفالك...</p>
            </div>
          ) : childrenList.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-300 max-w-md mx-auto">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-black text-gray-700 mb-1">لم تقم بإضافة أطفال بعد</h3>
              <p className="text-xs text-gray-500 mb-5">أضف طفلك وسينشئ النظام رمز دخول رقمي له تلقائياً</p>
              <button
                onClick={handleOpenAddChild}
                className="btn-child px-5 py-2.5 bg-brand-purple text-white text-xs font-bold mx-auto"
              >
                إضافة طفل الآن
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Children Cards with Login Codes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {childrenList.map((child) => {
                  const isSelected = child.id === selectedChildId;
                  return (
                    <div
                      key={child.id}
                      onClick={() => {
                        setSelectedChildId(child.id);
                        loadChildAnalytics(child.id);
                      }}
                      className={`p-5 rounded-3xl border-2 transition-all cursor-pointer bg-white shadow-sm flex flex-col justify-between ${
                        isSelected
                          ? 'border-brand-purple ring-2 ring-brand-purple/20 shadow-md'
                          : 'border-gray-200 hover:border-brand-purple/40'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-brand-yellow flex items-center justify-center text-xl font-black text-amber-950">
                            {child.display_name[0]}
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-brand-text">{child.display_name}</h3>
                            <div className="text-xs text-gray-400 font-bold">المستوى {child.current_level}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditChild(child);
                            }}
                            className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
                            title="تعديل"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChild(child.id);
                            }}
                            className="w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Prominent Login Code Display */}
                      <div className="bg-purple-50/80 border border-purple-200/80 p-2.5 rounded-2xl flex items-center justify-between mt-2">
                        <div>
                          <div className="text-[10px] font-bold text-purple-600">رمز الدخول للطفل:</div>
                          <div className="text-2xl font-black font-mono tracking-widest text-brand-purple dir-ltr text-right">
                            {child.local_code || '—'}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (child.local_code) handleCopyCode(child.local_code);
                          }}
                          className="px-2.5 py-1.5 bg-white text-brand-purple rounded-xl border border-purple-200 text-xs font-bold hover:bg-purple-100 flex items-center gap-1"
                        >
                          {copiedCode === child.local_code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCode === child.local_code ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Analytics Section for Selected Child */}
              {selectedChild && analytics && (
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-black text-brand-text flex items-center gap-2">
                      <Target className="w-5 h-5 text-brand-purple" />
                      <span>إحصاءات وتطور {selectedChild.display_name}</span>
                    </h3>
                    <div className="text-xs font-bold text-gray-500">
                      إجمالي النجوم: <span className="text-amber-600 font-black">{selectedChild.total_points}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100">
                      <div className="text-xs font-bold text-gray-500 mb-1">الجلسات المكتملة</div>
                      <div className="text-2xl font-black text-brand-purple">{analytics.totalSessions}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{analytics.totalWordsCompleted} كلمة تم التدرب عليها</div>
                    </div>

                    <div className="bg-teal-50/60 rounded-2xl p-4 border border-teal-100">
                      <div className="text-xs font-bold text-gray-500 mb-1">وقت اللعب الفعلي</div>
                      <div className="text-2xl font-black text-brand-turquoise">{analytics.totalActiveTimeMinutes} دقيقة</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">وقت نشط بدون فترات التوقف</div>
                    </div>

                    <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
                      <div className="text-xs font-bold text-gray-500 mb-1">الدقة الإجمالية</div>
                      <div className="text-2xl font-black text-brand-success">{analytics.accuracy}%</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">النقرات الصحيحة من أول مرة</div>
                    </div>

                    <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-100">
                      <div className="text-xs font-bold text-gray-500 mb-1">الزمن الوسيط للحل</div>
                      <div className="text-2xl font-black text-amber-700">
                        {analytics.medianSolveMs ? `${(analytics.medianSolveMs / 1000).toFixed(1)} ث` : '—'}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">زمن حل الكلمة الفعلي</div>
                    </div>
                  </div>

                  {/* Words Mastery Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200">
                      <div className="text-xs font-black text-teal-800 mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-brand-success" />
                        <span>كلمات أتقنها ({analytics.masteredWords.length})</span>
                      </div>
                      {analytics.masteredWords.length === 0 ? (
                        <p className="text-xs text-gray-400">تظهر هنا الكلمات بعد تكرارها بدقة عالية.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {analytics.masteredWords.map(w => (
                            <span key={w.id} className="px-2.5 py-1 rounded-xl bg-white border border-teal-200 text-teal-900 text-xs font-black">
                              {w.text} ({w.accuracy}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
                      <div className="text-xs font-black text-rose-800 mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-brand-error" />
                        <span>كلمات تحتاج مراجعة ({analytics.needsReviewWords.length})</span>
                      </div>
                      {analytics.needsReviewWords.length === 0 ? (
                        <p className="text-xs text-gray-400">رائع! لا توجد كلمات تواجه صعوبة متكررة.</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {analytics.needsReviewWords.map(w => (
                            <span key={w.id} className="px-2.5 py-1 rounded-xl bg-white border border-rose-200 text-rose-900 text-xs font-black">
                              {w.text} ({w.accuracy}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Parent Words Management Section */
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-brand-text">مكتبة الكلمات الخاصة بأطفالي</h2>
              <p className="text-xs text-gray-500 font-medium">الكلمات التي تضيفها أو تولدها تظهر لأطفالك فقط دون غيرهم</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  sound.playTap();
                  setShowBulkModal(true);
                }}
                className="btn-child px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>إضافة كلمات دفعة واحدة</span>
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setShowAiModal(true);
                }}
                className="btn-child px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <Cpu className="w-4 h-4" />
                <span>توليد بالذكاء الاصطناعي</span>
              </button>

              <button
                onClick={() => {
                  sound.playTap();
                  setShowAddWordModal(true);
                }}
                className="btn-child px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة كلمة يدوياً</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="ابحث في كلماتك..."
              value={wordSearch}
              onChange={(e) => setWordSearch(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-2xl border border-gray-300 text-sm font-bold outline-none focus:border-brand-purple"
            />
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3.5" />
          </div>

          {loadingWords ? (
            <div className="text-center py-12">
              <div className="w-10 h-10 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bold">جاري تحميل الكلمات...</p>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-gray-300 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-600 mb-3">لا توجد كلمات مطابقة</p>
              <button
                onClick={() => setShowAiModal(true)}
                className="btn-child px-5 py-2.5 bg-brand-purple text-white text-xs font-bold mx-auto"
              >
                توليد كلمات لأطفالك
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {filteredWords.map((word) => (
                <div
                  key={word.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all bg-white shadow-sm flex items-center justify-between gap-2 ${
                    word.enabled === 1 ? 'border-gray-200' : 'border-gray-200 opacity-50 bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="text-xl font-black text-brand-text">{word.text}</div>
                    <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <span>مستوى {word.difficulty_level}</span>
                      <span>•</span>
                      <span>{word.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleWord(word.id)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        word.enabled === 1 ? 'text-brand-success hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-200'
                      }`}
                      title={word.enabled === 1 ? 'مفعلة (اضغط للتعطيل)' : 'معطلة (اضغط للتفعيل)'}
                    >
                      {word.enabled === 1 ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteWord(word.id)}
                      className="w-7 h-7 rounded-lg text-red-500 hover:bg-red-50 flex items-center justify-center"
                      title="إزالة من مجموعتي"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Child Modal */}
      {showChildModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-brand-purple">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-brand-text">
                {editingChild ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد'}
              </h3>
              <button onClick={() => setShowChildModal(false)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSaveChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم الطفل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كنان"
                  value={modalDisplayName}
                  onChange={(e) => setModalDisplayName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-bold outline-none focus:border-brand-purple"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المستوى</label>
                  <select
                    value={modalLevel}
                    onChange={(e) => setModalLevel(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm font-bold outline-none bg-white"
                  >
                    <option value={1}>المستوى 1</option>
                    <option value={2}>المستوى 2</option>
                    <option value={3}>المستوى 3</option>
                    <option value={4}>المستوى 4</option>
                    <option value={5}>المستوى 5</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">العمر</label>
                  <input
                    type="number"
                    min={3}
                    max={12}
                    placeholder="مثال: 5"
                    value={modalAge}
                    onChange={(e) => setModalAge(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رمز الدخول للطفل (4 أرقام) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="4827"
                    value={modalPin}
                    onChange={(e) => setModalPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full h-11 px-4 rounded-xl border border-gray-300 text-center font-mono text-xl font-bold tracking-widest text-brand-purple outline-none focus:border-brand-purple dir-ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setModalPin(Math.floor(1000 + Math.random() * 9000).toString())}
                    className="btn-child px-3 py-2 bg-purple-50 text-brand-purple border border-purple-200 text-xs font-bold whitespace-nowrap"
                  >
                    رمز جديد
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">يستخدمه الطفل لتسجيل الدخول مباشرة دون بريد أو كلمة مرور.</p>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={savingChild}
                  className="btn-child flex-1 bg-brand-purple text-white py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {savingChild ? 'جاري الحفظ...' : 'حفظ البيانات'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowChildModal(false)}
                  className="btn-child px-4 bg-gray-100 text-gray-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Word Modal */}
      {showAddWordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-brand-turquoise">
            <h3 className="text-lg font-black text-brand-text mb-4">إضافة كلمة إلى مجموعتك</h3>

            {wordError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-bold">
                {wordError}
              </div>
            )}

            <form onSubmit={handleAddWord} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">الكلمة العربية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شمس"
                  value={newWordText}
                  onChange={(e) => setNewWordText(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-bold outline-none text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المستوى</label>
                  <select
                    value={newWordLevel}
                    onChange={(e) => setNewWordLevel(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm font-bold outline-none bg-white"
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
                  <select
                    value={newWordCategory}
                    onChange={(e) => setNewWordCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm font-bold outline-none bg-white"
                  >
                    <option value="حيوانات">حيوانات</option>
                    <option value="فواكه">فواكه</option>
                    <option value="طبيعة">طبيعة</option>
                    <option value="أدوات">أدوات</option>
                    <option value="أشياء">أشياء</option>
                    <option value="عائلة">عائلة</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={addingWord}
                  className="btn-child flex-1 bg-brand-turquoise text-white py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {addingWord ? 'جاري الإضافة...' : 'إضافة الكلمة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddWordModal(false)}
                  className="btn-child px-4 bg-gray-100 text-gray-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generate Words Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border-2 border-emerald-600">
            <h3 className="text-lg font-black text-brand-text mb-1">
              توليد كلمات بالذكاء الاصطناعي
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              حدد العدد المطلوب وسيتم توليد كلمات صالحة وغير مكررة وإضافتها فوراً لأطفالك.
            </p>

            {aiResultMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                {aiResultMsg}
              </div>
            )}

            <form onSubmit={handleGenerateAiWords} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">عدد الكلمات المطلوب (حتى 50) *</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  required
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 text-sm font-bold outline-none text-center font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المستوى</label>
                  <select
                    value={aiLevel}
                    onChange={(e) => setAiLevel(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm font-bold outline-none bg-white"
                  >
                    <option value={1}>المستوى 1 (2-3 حروف)</option>
                    <option value={2}>المستوى 2 (3 حروف)</option>
                    <option value={3}>المستوى 3 (4 حروف)</option>
                    <option value={4}>المستوى 4 (4-5 حروف)</option>
                    <option value={5}>المستوى 5 (5-6 حروف)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">الفئة</label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 text-sm font-bold outline-none bg-white"
                  >
                    <option value="حيوانات">حيوانات</option>
                    <option value="فواكه">فواكه</option>
                    <option value="طبيعة">طبيعة</option>
                    <option value="أدوات">أدوات</option>
                    <option value="أشياء">أشياء</option>
                    <option value="عائلة">عائلة</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="submit"
                  disabled={generatingAi}
                  className="btn-child flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {generatingAi ? 'جاري التوليد على دفعات...' : `توليد ${aiCount} كلمة`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="btn-child px-4 bg-gray-100 text-gray-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Words Import Modal */}
      <BulkWordImportModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={loadParentWords}
        existingParentWords={parentWords}
      />
    </div>
  );
};
