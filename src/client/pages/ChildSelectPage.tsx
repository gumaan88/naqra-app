import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { Child } from '@shared/types';
import { Star, Lock, UserPlus, Sparkles, Delete, Check } from 'lucide-react';
import { sound } from '../lib/audio';

export const ChildSelectPage: React.FC = () => {
  const { user, setActiveChild } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChildForPin, setSelectedChildForPin] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadProfiles();
  }, [user]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const res = await api.children.familyProfiles(user?.id);
      if (res.success) {
        setProfiles(res.profiles || []);
      }
    } catch {
      // Fallback local demo profile if brand new device and not logged in yet
      setProfiles([
        {
          id: 'demo_child_1',
          display_name: 'سارة',
          current_level: 1,
          total_points: 30,
          has_pin: false,
        },
        {
          id: 'demo_child_2',
          display_name: 'عمر',
          current_level: 2,
          total_points: 65,
          has_pin: false,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChild = (profile: any) => {
    sound.playTap();
    if (profile.has_pin) {
      setSelectedChildForPin(profile);
      setPinInput('');
      setPinError(null);
    } else {
      // Direct access
      const childData: Child = {
        id: profile.id,
        user_id: user?.id || 'demo_user',
        display_name: profile.display_name,
        photo_url: profile.photo_url,
        current_level: profile.current_level || 1,
        total_points: profile.total_points || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setActiveChild(childData);
      navigate('/child-home');
    }
  };

  const handlePinKey = (digit: string) => {
    sound.playTap();
    if (pinInput.length < 4) {
      setPinInput(prev => prev + digit);
      setPinError(null);
    }
  };

  const handlePinDelete = () => {
    sound.playTap();
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleVerifyPin = async () => {
    if (!selectedChildForPin || pinInput.length === 0) return;
    setVerifying(true);
    setPinError(null);

    try {
      const res = await api.children.verifyPin(selectedChildForPin.id, pinInput);
      if (res.success && res.child) {
        sound.playSuccess();
        setActiveChild(res.child);
        setSelectedChildForPin(null);
        navigate('/child-home');
      } else {
        sound.playError();
        setPinError('الرمز السري غير صحيح');
        setPinInput('');
      }
    } catch {
      sound.playError();
      setPinError('الرمز السري غير صحيح');
      setPinInput('');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-4xl mx-auto px-4 py-10 flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-brand-yellow/30 text-amber-900 font-bold text-sm mb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>مرحباً يا بطل القراءة!</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-brand-text mb-2">
          مَنْ سَيَلْعَبُ مَعَنَا الْيَوْم؟
        </h1>
        <p className="text-gray-600 text-base font-medium">اضغط على صورتك واسمك للبدء</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-gray-500">جاري تحميل أبطال نقرأ...</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
            {profiles.map((child, idx) => {
              const bgColors = ['bg-teal-50 border-teal-300', 'bg-amber-50 border-amber-300', 'bg-purple-50 border-purple-300', 'bg-pink-50 border-pink-300'];
              const color = bgColors[idx % bgColors.length];

              return (
                <button
                  key={child.id}
                  onClick={() => handleSelectChild(child)}
                  className={`btn-child !h-auto flex-col p-6 rounded-3xl border-2 ${color} bg-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all group`}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-brand-yellow to-amber-300 flex items-center justify-center text-3xl sm:text-4xl font-black text-amber-950 shadow-md mb-4 overflow-hidden border-2 border-white group-hover:scale-110 transition-transform">
                    {child.photo_url ? (
                      <img src={child.photo_url} alt={child.display_name} className="w-full h-full object-cover" />
                    ) : (
                      child.display_name[0]
                    )}
                  </div>

                  <span className="text-xl sm:text-2xl font-black text-brand-text mb-1">
                    {child.display_name}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{child.total_points || 0} نجمة</span>
                  </div>

                  {child.has_pin && (
                    <div className="mt-2 text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>رمز سري</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="text-center">
            {user ? (
              <Link
                to="/parent"
                className="btn-child inline-flex px-6 py-3 bg-purple-50 hover:bg-purple-100 text-brand-purple rounded-2xl border border-brand-purple/30 text-sm font-bold shadow-sm"
              >
                <UserPlus className="w-4 h-4 ml-1.5" />
                <span>إضافة طفل جديد من لوحة ولي الأمر</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn-child inline-flex px-6 py-3 bg-purple-50 hover:bg-purple-100 text-brand-purple rounded-2xl border border-brand-purple/30 text-sm font-bold shadow-sm"
              >
                <UserPlus className="w-4 h-4 ml-1.5" />
                <span>تسجيل ولي الأمر لإضافة أطفال وتخصيص مستوياتهم</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Cute PIN Pad Modal */}
      {selectedChildForPin && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl border-2 border-brand-turquoise text-center">
            <h3 className="text-xl font-black text-brand-text mb-1">
              رمز {selectedChildForPin.display_name} السري
            </h3>
            <p className="text-xs text-gray-500 mb-4">أدخل الرمز المكون من أرقام للمتابعة</p>

            {/* PIN Dots display */}
            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                    i < pinInput.length
                      ? 'bg-brand-turquoise border-brand-turquoise scale-110'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <div className="text-xs font-bold text-red-600 mb-3 animate-shake">
                {pinError}
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinKey(num)}
                  className="btn-child !min-h-[48px] bg-gray-50 hover:bg-brand-turquoise/20 hover:text-brand-turquoise border border-gray-200 text-xl font-black text-brand-text"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handlePinDelete}
                className="btn-child !min-h-[48px] bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => handlePinKey('0')}
                className="btn-child !min-h-[48px] bg-gray-50 hover:bg-brand-turquoise/20 text-xl font-black text-brand-text border border-gray-200"
              >
                0
              </button>
              <button
                type="button"
                disabled={pinInput.length === 0 || verifying}
                onClick={handleVerifyPin}
                className="btn-child !min-h-[48px] bg-brand-success hover:bg-green-600 text-white font-bold border border-green-600 disabled:opacity-40"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedChildForPin(null)}
              className="text-xs text-gray-500 font-bold hover:underline"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
