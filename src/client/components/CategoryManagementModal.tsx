import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { sound } from '../lib/audio';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Folder,
  BookOpen,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Loader2
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: number;
  is_system: number | boolean;
  word_count: number;
}

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

const PRESET_EMOJIS = ['🦁', '👨‍👩‍👧', '🏠', '🏫', '🍎', '🌳', '🚗', '✏️', '🖐️', '🏃', '📚', '🧸', '🎨', '⭐', '🚀', '⚽', '👑', '🌈'];

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged
}) => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add category state
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatIcon, setNewCatIcon] = useState<string>('🏷️');
  const [savingNew, setSavingNew] = useState<boolean>(false);

  // Edit category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editIcon, setEditIcon] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Safe delete dialog state
  const [deletingCat, setDeletingCat] = useState<CategoryItem | null>(null);
  const [deleteAction, setDeleteAction] = useState<'unlink' | 'reassign'>('unlink');
  const [reassignTarget, setReassignTarget] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.categories.list();
      if (res.ok && Array.isArray(res.categories)) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSavingNew(true);
    setErrorMsg(null);

    try {
      const res = await api.categories.create({
        name: newCatName.trim(),
        icon: newCatIcon || '🏷️'
      });
      if (res.ok) {
        sound.playSuccess();
        setSuccessMsg(`تم إنشاء فئة "${newCatName.trim()}" بنجاح`);
        setNewCatName('');
        setNewCatIcon('🏷️');
        setIsAdding(false);
        await loadCategories();
        onCategoriesChanged();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      sound.playError();
      setErrorMsg(err.message || 'فشل إنشاء الفئة');
    } finally {
      setSavingNew(false);
    }
  };

  const handleStartEdit = (cat: CategoryItem) => {
    sound.playTap();
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditIcon(cat.icon || '🏷️');
  };

  const handleSaveEdit = async (catId: string) => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    setErrorMsg(null);

    try {
      const res = await api.categories.update(catId, {
        name: editName.trim(),
        icon: editIcon
      });
      if (res.ok) {
        sound.playSuccess();
        setEditingCatId(null);
        await loadCategories();
        onCategoriesChanged();
      }
    } catch (err: any) {
      sound.playError();
      setErrorMsg(err.message || 'فشل تعديل الفئة');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleActive = async (cat: CategoryItem) => {
    sound.playTap();
    try {
      const nextState = cat.is_active === 1 ? 0 : 1;
      const res = await api.categories.update(cat.id, { is_active: nextState });
      if (res.ok) {
        setCategories(prev =>
          prev.map(c => (c.id === cat.id ? { ...c, is_active: nextState } : c))
        );
        onCategoriesChanged();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تغيير حالة الفئة');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCat) return;
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await api.categories.delete(deletingCat.id, {
        action: deleteAction,
        targetCategory: deleteAction === 'reassign' ? reassignTarget : undefined
      });
      if (res.ok) {
        sound.playSuccess();
        setSuccessMsg(res.message);
        setDeletingCat(null);
        await loadCategories();
        onCategoriesChanged();
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      sound.playError();
      setErrorMsg(err.message || 'فشل حذف الفئة');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  const otherCategories = categories.filter(c => deletingCat && c.id !== deletingCat.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 w-full max-w-full overflow-x-hidden">
      <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-sm">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-brand-text">إدارة الفئات والتصنيفات</h3>
              <p className="text-xs text-gray-500 font-medium">
                خصص فئات كلماتك ونظم مكتبة طفلك بسهولة وأمان
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Content Area */}
        <div className="py-4 overflow-y-auto flex-1 space-y-4">
          {/* Top action bar: Add Category Toggle */}
          {!isAdding && (
            <button
              onClick={() => {
                sound.playTap();
                setIsAdding(true);
              }}
              className="btn-child w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-2 border-dashed border-indigo-200 text-xs font-black flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء فئة مخصصة جديدة</span>
            </button>
          )}

          {/* Add Category Form */}
          {isAdding && (
            <form onSubmit={handleCreateCategory} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  إنشاء فئة جديدة
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    required
                    placeholder="مثال: المزرعة، الفضاء، الألوان..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl border border-gray-300 text-sm font-bold outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={newCatIcon}
                    onChange={(e) => setNewCatIcon(e.target.value)}
                    className="w-12 h-10 rounded-xl border border-gray-300 text-center text-lg outline-none focus:border-indigo-500 bg-white"
                    title="الرمز أو الإيموجي"
                  />
                  <button
                    type="submit"
                    disabled={savingNew || !newCatName.trim()}
                    className="btn-child flex-1 h-10 bg-indigo-600 text-white text-xs font-black shadow-sm disabled:opacity-50"
                  >
                    {savingNew ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'حفظ'}
                  </button>
                </div>
              </div>

              {/* Emoji quick presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400 font-bold self-center ml-1">رموز سريعة:</span>
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setNewCatIcon(emoji)}
                    className="w-7 h-7 rounded-lg hover:bg-white flex items-center justify-center text-sm border border-transparent hover:border-gray-300"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </form>
          )}

          {/* Categories List */}
          {loading ? (
            <div className="text-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400 font-bold">جاري تحميل الفئات...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs text-gray-500 font-bold">لا توجد فئات حالياً</p>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => {
                const isEditing = editingCatId === cat.id;
                const isSystem = Boolean(cat.is_system);

                return (
                  <div
                    key={cat.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      cat.is_active === 1
                        ? 'bg-white border-gray-200 shadow-sm'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    {isEditing ? (
                      /* Inline Edit */
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="w-10 h-9 rounded-xl border border-gray-300 text-center text-base outline-none bg-white"
                        />
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-9 px-3 rounded-xl border border-gray-300 text-xs font-bold outline-none bg-white"
                        />
                        <button
                          type="button"
                          disabled={savingEdit || !editName.trim()}
                          onClick={() => handleSaveEdit(cat.id)}
                          className="btn-child px-3 h-9 bg-emerald-600 text-white text-xs font-bold"
                        >
                          {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="btn-child px-2.5 h-9 bg-gray-100 text-gray-600 text-xs font-bold"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Standard Row */
                      <>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{cat.icon || '🏷️'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-brand-text">{cat.name}</span>
                              {isSystem ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-black">
                                  نظام
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-brand-purple border border-purple-200 text-[10px] font-black">
                                  مخصص
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-bold flex items-center gap-1.5 mt-0.5">
                              <BookOpen className="w-3 h-3 text-gray-400" />
                              <span>{cat.word_count} كلمة</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleActive(cat)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              cat.is_active === 1 ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={cat.is_active === 1 ? 'مفعلة (اضغط للتعطيل)' : 'معطلة (اضغط للتفعيل)'}
                          >
                            {cat.is_active === 1 ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>

                          {!isSystem && (
                            <>
                              <button
                                onClick={() => handleStartEdit(cat)}
                                className="w-8 h-8 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center justify-center"
                                title="تعديل اسم الفئة"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  sound.playTap();
                                  setDeletingCat(cat);
                                  setDeleteAction('unlink');
                                  setReassignTarget(otherCategories[0]?.name || '');
                                }}
                                className="w-8 h-8 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center"
                                title="حذف الفئة بأمان"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Safe Deletion Confirmation Dialog */}
        {deletingCat && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-2 border-red-200 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-brand-text">حذف الفئة: {deletingCat.name}</h4>
                  <p className="text-xs text-gray-500 font-medium">لن يتم حذف الكلمات المركزية مطلقاً</p>
                </div>
              </div>

              {deletingCat.word_count > 0 ? (
                <div className="space-y-3 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs">
                  <p className="font-bold text-amber-900">
                    تحتوي هذه الفئة على <span className="font-black text-amber-950">{deletingCat.word_count} كلمة</span>.
                    كيف ترغب بالتعامل مع هذه الكلمات؟
                  </p>

                  <div className="space-y-2">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="del_action"
                        checked={deleteAction === 'unlink'}
                        onChange={() => setDeleteAction('unlink')}
                        className="mt-0.5"
                      />
                      <span className="text-gray-700 font-bold">
                        إبقاء الكلمات في مجموعتي كـ "بدون فئة" (إزالة تصنيفها فقط)
                      </span>
                    </label>

                    {otherCategories.length > 0 && (
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="del_action"
                          checked={deleteAction === 'reassign'}
                          onChange={() => setDeleteAction('reassign')}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <span className="text-gray-700 font-bold">نقل الكلمات إلى فئة أخرى:</span>
                          {deleteAction === 'reassign' && (
                            <select
                              value={reassignTarget}
                              onChange={(e) => setReassignTarget(e.target.value)}
                              className="mt-1.5 w-full h-9 px-3 rounded-xl border border-gray-300 text-xs font-bold outline-none bg-white"
                            >
                              {otherCategories.map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.icon} {c.name} ({c.word_count} كلمة)
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-600 font-medium">
                  هذه الفئة فارغة ولا تحتوي أي كلمات، سيتم حذفها مباشرة بأمان.
                </p>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="btn-child flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تأكيد الحذف الآمن'}
                </button>
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  className="btn-child px-4 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn-child px-6 py-2.5 bg-gray-100 text-gray-700 text-xs font-bold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
