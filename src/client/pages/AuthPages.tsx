import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { UserCheck, UserPlus, Lock, Mail, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    if (!isLogin) {
      if (!name) {
        setError('يرجى إدخال اسمك');
        return;
      }
      if (password !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.auth.login({ email, password });
        if (res.success) {
          login(res.token, res.user);
          navigate('/parent');
        }
      } else {
        const res = await api.auth.register({ name, email, password });
        if (res.success) {
          login(res.token, res.user);
          navigate('/parent');
        }
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] flex items-center justify-center p-4 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-purple/20 shadow-xl">
        {/* Toggle Header */}
        <div className="flex rounded-2xl bg-purple-50 p-1.5 mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              isLogin ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-600 hover:text-brand-purple'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1.5 ${
              !isLogin ? 'bg-white text-brand-purple shadow-sm' : 'text-gray-600 hover:text-brand-purple'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>ولي أمر جديد</span>
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-brand-text mb-1">
            {isLogin ? 'مرحباً بك مجدداً!' : 'إنشاء حساب ولي أمر'}
          </h2>
          <p className="text-sm text-gray-500">
            {isLogin ? 'سجل دخولك لمتابعة إنجازات أطفالك وتقاريرهم' : 'أضف أطفالك وتابع رحلتهم في القراءة بأمان'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الاسم الكامل</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: أحمد عبد الله"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 pl-10 rounded-xl border border-gray-300 focus:border-brand-purple focus:ring-2 focus:ring-purple-200 outline-none font-medium text-sm text-right"
                />
                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="parent@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 pl-10 rounded-xl border border-gray-300 focus:border-brand-purple focus:ring-2 focus:ring-purple-200 outline-none font-medium text-sm text-right dir-ltr"
              />
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 pl-10 rounded-xl border border-gray-300 focus:border-brand-purple focus:ring-2 focus:ring-purple-200 outline-none font-medium text-sm text-right dir-ltr"
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
            </div>
          </div>

          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">تأكيد كلمة المرور</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 pl-10 rounded-xl border border-gray-300 focus:border-brand-purple focus:ring-2 focus:ring-purple-200 outline-none font-medium text-sm text-right dir-ltr"
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-child w-full bg-brand-purple hover:bg-[#6247B6] text-white py-3 text-base shadow-md disabled:opacity-50 mt-4"
          >
            {loading ? (
              <span>جاري التحميل...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>{isLogin ? 'دخول' : 'تسجيل الحساب'}</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-bold text-brand-purple hover:underline">
            ← العودة للصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
};
