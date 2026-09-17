import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { Child, ChildAnalytics } from '@shared/types';
import {
  Users, UserPlus, Clock, Target, Award, Star,
  TrendingUp, AlertTriangle, CheckCircle, Play,
  Trash2, Edit, X, Save, Shield
} from 'lucide-react';
import { sound } from '../lib/audio';

export const ParentDashboard: React.FC = () => {
  const { user, setActiveChild } = useAuth();
  const navigate = useNavigate();

  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ChildAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);

  // Add / Edit Modal state
  const [showChildModal, setShowChildModal] = useState<boolean>(false);
  const [editingChild, setEditingChild] = useState<Partial<Child> | null>(null);
  const [modalDisplayName, setModalDisplayName] = useState<string>('');
  const [modalLevel, setModalLevel] = useState<number>(1);
  const [modalAge, setModalAge] = useState<string>('');
  const [modalPin, setModalPin] = useState<string>('');
  const [modalGender, setModalGender] = useState<string>('other');
  const [savingChild, setSavingChild] = useState<boolean>(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadChildren();
  }, [user]);

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

  const handleSelectChildTab = (childId: string) => {
    sound.playTap();
    setSelectedChildId(childId);
    loadChildAnalytics(childId);
  };

  const handleOpenAddChild = () => {
    setEditingChild(null);
    setModalDisplayName('');
    setModalLevel(1);
    setModalAge('');
    setModalPin('');
    setModalGender('other');
    setShowChildModal(true);
  };

  const handleOpenEditChild = (child: Child) => {
    setEditingChild(child);
    setModalDisplayName(child.display_name);
    setModalLevel(child.current_level);
    setModalAge(child.age_or_birth_year ? String(child.age_or_birth_year) : '');
    setModalPin(child.local_code || '');
    setModalGender(child.gender_optional || 'other');
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
          local_code: modalPin.trim() || undefined,
          gender_optional: modalGender as any,
        });
      } else {
        await api.children.create({
          display_name: modalDisplayName.trim(),
          current_level: modalLevel,
          age_or_birth_year: modalAge ? Number(modalAge) : undefined,
          local_code: modalPin.trim() || undefined,
          gender_optional: modalGender as any,
        });
      }
      setShowChildModal(false);
      await loadChildren();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingChild(false);
    }
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطفل؟ سيتم حذف تاريخ اللعب الخاص به.')) return;
    try {
      await api.children.delete(childId);
      await loadChildren();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSwitchToChildMode = (child: Child) => {
    setActiveChild(child);
    navigate('/child-home');
  };

  const selectedChild = childrenList.find(c => c.id === selectedChildId);

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-brand-text flex items-center gap-2">
            <span>لوحة ولي الأمر</span>
            <span className="text-xs px-2.5 py-1 bg-purple-100 text-brand-purple rounded-full font-bold">
              {user?.name}
            </span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            متابعة تقدم الأطفال والتحليلات التعليمية بدقة وبدون مقارنات سلبية
          </p>
        </div>

        <button
          onClick={handleOpenAddChild}
          className="btn-child px-4 py-2.5 bg-brand-purple hover:bg-[#6246B5] text-white text-sm font-bold shadow-md flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة طفل جديد</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-gray-500">جاري تحميل البيانات...</p>
        </div>
      ) : childrenList.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-300 max-w-lg mx-auto">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-black text-gray-700 mb-2">لم تقم بإضافة أطفال بعد</h3>
          <p className="text-sm text-gray-500 mb-6">أضف طفلك الأول للبدء في رحلة القراءة وتتبع تطوره</p>
          <button
            onClick={handleOpenAddChild}
            className="btn-child px-6 py-3 bg-brand-purple text-white text-sm font-bold mx-auto"
          >
            إضافة طفل الآن
          </button>
        </div>
      ) : (
        <div>
          {/* Children Tabs */}
          <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-6 scrollbar-none">
            {childrenList.map((child) => {
              const isSelected = child.id === selectedChildId;
              return (
                <button
                  key={child.id}
                  onClick={() => handleSelectChildTab(child.id)}
                  className={`btn-child !min-h-[48px] px-4 rounded-2xl flex items-center gap-3 transition-all border-2 shrink-0 ${
                    isSelected
                      ? 'bg-brand-purple text-white border-brand-purple shadow-md scale-105'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand-purple/40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
                    isSelected ? 'bg-white text-brand-purple' : 'bg-purple-100 text-brand-purple'
                  }`}>
                    {child.display_name[0]}
                  </div>
                  <span className="font-bold text-sm">{child.display_name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-purple-800 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    مستوى {child.current_level}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedChild && (
            <div className="space-y-6">
              {/* Child Profile Bar */}
              <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-yellow flex items-center justify-center text-2xl font-black text-amber-950">
                    {selectedChild.display_name[0]}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-brand-text">{selectedChild.display_name}</h2>
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-bold mt-1">
                      <span>المستوى الحالي: {selectedChild.current_level}</span>
                      <span>•</span>
                      <span>الرمز السري: {selectedChild.local_code || 'غير مفعل'}</span>
                      {selectedChild.age_or_birth_year && (
                        <>
                          <span>•</span>
                          <span>العمر: {selectedChild.age_or_birth_year} سنوات</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSwitchToChildMode(selectedChild)}
                    className="btn-child px-4 py-2 bg-brand-turquoise hover:bg-[#1E9A92] text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>الدخول بصفة {selectedChild.display_name}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditChild(selectedChild)}
                    className="btn-child !min-h-[38px] !min-w-[38px] w-9 h-9 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl"
                    title="تعديل بيانات الطفل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteChild(selectedChild.id)}
                    className="btn-child !min-h-[38px] !min-w-[38px] w-9 h-9 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl"
                    title="حذف الملف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Analytics Metric Cards */}
              {loadingAnalytics || !analytics ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-3 border-brand-purple border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-gray-500 font-bold">جاري استخراج المؤشرات...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold">الجلسات المكتملة</span>
                        <Target className="w-5 h-5 text-brand-purple" />
                      </div>
                      <div className="text-2xl font-black text-brand-text">{analytics.totalSessions}</div>
                      <div className="text-xs text-gray-500 mt-1">{analytics.totalWordsCompleted} كلمة تم التدرب عليها</div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold">وقت اللعب الفعلي</span>
                        <Clock className="w-5 h-5 text-brand-turquoise" />
                      </div>
                      <div className="text-2xl font-black text-brand-turquoise">{analytics.totalActiveTimeMinutes} دقيقة</div>
                      <div className="text-xs text-gray-500 mt-1">وقت التفاعل النشط</div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold">الدقة الإجمالية</span>
                        <Award className="w-5 h-5 text-brand-success" />
                      </div>
                      <div className="text-2xl font-black text-brand-success">{analytics.accuracy}%</div>
                      <div className="text-xs text-gray-500 mt-1">نسبة النقرات الصحيحة</div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between text-gray-400 mb-2">
                        <span className="text-xs font-bold">الزمن الوسيط للحل</span>
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="text-2xl font-black text-amber-700">
                        {analytics.medianSolveMs ? `${(analytics.medianSolveMs / 1000).toFixed(1)} ث` : '—'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">إكمال الكلمة دون احتساب التأمل</div>
                    </div>
                  </div>

                  {/* Words Mastery & Review Badges */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Mastered Words */}
                    <div className="bg-white rounded-3xl p-6 border border-teal-200 shadow-sm">
                      <div className="flex items-center gap-2 text-brand-success font-black text-lg mb-4">
                        <CheckCircle className="w-5 h-5" />
                        <span>كلمات أتقنها الطفل ({analytics.masteredWords.length})</span>
                      </div>
                      {analytics.masteredWords.length === 0 ? (
                        <p className="text-xs text-gray-400 font-medium">
                          تظهر هنا الكلمات بعد تكرارها بدقة عالية (≥ 90%) ومساعدات قليلة.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {analytics.masteredWords.map(w => (
                            <span
                              key={w.id}
                              className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-sm font-black flex items-center gap-1.5"
                            >
                              <span>{w.text}</span>
                              <span className="text-xs text-teal-600 font-normal">({w.accuracy}%)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Needs Review Words */}
                    <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-sm">
                      <div className="flex items-center gap-2 text-brand-error font-black text-lg mb-4">
                        <AlertTriangle className="w-5 h-5" />
                        <span>كلمات تحتاج تدريباً إضافياً ({analytics.needsReviewWords.length})</span>
                      </div>
                      {analytics.needsReviewWords.length === 0 ? (
                        <p className="text-xs text-gray-400 font-medium">
                          ممتاز! لا توجد كلمات تواجه صعوبة متكررة حالياً.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {analytics.needsReviewWords.map(w => (
                            <span
                              key={w.id}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-black flex items-center gap-1.5"
                            >
                              <span>{w.text}</span>
                              <span className="text-xs text-rose-600 font-normal">({w.accuracy}%)</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Frequent Error Letters & Level Progress */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Error Letters */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="font-black text-brand-text text-base mb-3">الحروف الأكثر خطأً عند انتظارها</h3>
                      {analytics.frequentErrorLetters.length === 0 ? (
                        <p className="text-xs text-gray-400">لا توجد أخطاء كافية لتحليل الحروف.</p>
                      ) : (
                        <div className="flex items-center gap-3">
                          {analytics.frequentErrorLetters.map(item => (
                            <div key={item.letter} className="text-center">
                              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 text-brand-purple text-2xl font-black flex items-center justify-center mb-1">
                                {item.letter}
                              </div>
                              <span className="text-xs font-bold text-gray-400">{item.errorCount} أخطاء</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Level History */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="font-black text-brand-text text-base mb-3">سجل الانتقال بين المستويات</h3>
                      <div className="space-y-2 text-xs">
                        {analytics.levelProgress.map((lp, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="font-bold text-gray-700">المستوى {lp.level}</span>
                            <span className="text-gray-400">{new Date(lp.date).toLocaleDateString('ar-SA')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Child Modal */}
      {showChildModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-brand-purple">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-brand-text">
                {editingChild ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد'}
              </h3>
              <button
                onClick={() => setShowChildModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChild} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">اسم الطفل المعروض *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف"
                  value={modalDisplayName}
                  onChange={(e) => setModalDisplayName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:border-brand-purple focus:ring-2 focus:ring-purple-200 outline-none text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">المستوى الابتدائي</label>
                  <select
                    value={modalLevel}
                    onChange={(e) => setModalLevel(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 focus:border-brand-purple outline-none text-sm font-bold bg-white"
                  >
                    <option value={1}>المستوى 1 (2-3 أحرف)</option>
                    <option value={2}>المستوى 2 (3 أحرف)</option>
                    <option value={3}>المستوى 3 (4 أحرف)</option>
                    <option value={4}>المستوى 4 (4-5 أحرف)</option>
                    <option value={5}>المستوى 5 (5-6 أحرف)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">العمر (اختياري)</label>
                  <input
                    type="number"
                    min={3}
                    max={12}
                    placeholder="مثال: 5"
                    value={modalAge}
                    onChange={(e) => setModalAge(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-gray-300 focus:border-brand-purple outline-none text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">رمز الدخول القصير (PIN اختياري)</label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="مثال: 1234 (اتركه فارغاً للدخول بضغطة واحدة)"
                  value={modalPin}
                  onChange={(e) => setModalPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 focus:border-brand-purple outline-none text-sm font-mono dir-ltr text-right"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={savingChild}
                  className="btn-child flex-1 bg-brand-purple hover:bg-[#6246B5] text-white py-3 text-sm font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingChild ? 'جاري الحفظ...' : 'حفظ البيانات'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowChildModal(false)}
                  className="btn-child px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-bold"
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
