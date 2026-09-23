import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { sound } from '../lib/audio';
import { Sparkles, Delete, UserCheck, AlertCircle } from 'lucide-react';

export const ChildLoginPage: React.FC = () => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [shaking, setShaking] = useState<boolean>(false);

  const { loginChild, activeChild } = useAuth();
  const navigate = useNavigate();

  // Input refs for physical typing or keyboard
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (activeChild) {
      navigate('/child-home');
    }
  }, [activeChild]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);
    setError(null);

    if (clean && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit if all 4 digits entered
    if (clean && index === 3 && newDigits.every(d => d !== '')) {
      submitCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleKeypadPress = (num: string) => {
    sound.playTap();
    const firstEmptyIdx = digits.findIndex(d => d === '');
    if (firstEmptyIdx !== -1) {
      handleDigitChange(firstEmptyIdx, num);
    }
  };

  const handleKeypadDelete = () => {
    sound.playTap();
    const lastFilledIdx = [...digits].reverse().findIndex(d => d !== '');
    if (lastFilledIdx !== -1) {
      const idx = 3 - lastFilledIdx;
      const newDigits = [...digits];
      newDigits[idx] = '';
      setDigits(newDigits);
      inputRefs[idx].current?.focus();
    }
  };

  const submitCode = async (code: string) => {
    if (code.length < 3 || code.length > 4) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.auth.childLogin(code);
      if (res.success && res.child) {
        sound.playSuccess();
        loginChild(res.token, res.child);
        navigate('/child-home');
      }
    } catch (err: any) {
      sound.playError();
      setError(err.message || 'الرمز غير صحيح، حاول مرة أخرى');
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setDigits(['', '', '', '']);
        inputRefs[0].current?.focus();
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-sm mx-auto px-4 py-8 flex flex-col items-center justify-between select-none w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="text-center mt-2">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-yellow/30 text-amber-900 font-bold text-xs mb-3">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>مرحباً يا بطل القراءة!</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-brand-text mb-2">
          أَدْخِلْ رَقَمَكَ
        </h1>
        <p className="text-gray-500 font-medium text-xs sm:text-sm">
          أدخل الرمز المكون من 4 أرقام للدخول إلى ألعابك
        </p>
      </div>

      {/* 4 Large Digit Input Boxes */}
      <div className={`my-6 flex flex-col items-center w-full ${shaking ? 'animate-shake' : ''}`}>
        <div className="flex items-center justify-center gap-3 dir-ltr mb-4">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-14 h-16 sm:w-16 sm:h-20 text-center text-3xl sm:text-4xl font-black rounded-2xl border-2 transition-all outline-none ${
                digit
                  ? 'border-brand-turquoise bg-teal-50/50 text-brand-turquoise shadow-md scale-105'
                  : 'border-gray-300 bg-white focus:border-brand-turquoise focus:ring-4 focus:ring-brand-turquoise/20'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 text-brand-error text-xs font-bold flex items-center gap-1.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="text-xs font-bold text-brand-turquoise animate-pulse mt-2">
            جاري التحقق والدخول...
          </div>
        )}
      </div>

      {/* On-screen Large Tactile Keypad (Mobile friendly) */}
      <div className="w-full max-w-xs mb-4">
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeypadPress(num)}
              className="btn-child !min-h-[52px] bg-white border border-gray-200 text-2xl font-black text-brand-text hover:bg-teal-50/40 hover:border-brand-turquoise shadow-sm active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleKeypadDelete}
            className="btn-child !min-h-[52px] bg-red-50 text-brand-error border border-red-200 hover:bg-red-100"
            title="مسح"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleKeypadPress('0')}
            className="btn-child !min-h-[52px] bg-white border border-gray-200 text-2xl font-black text-brand-text hover:bg-teal-50/40 shadow-sm active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            disabled={digits.filter(d => d !== '').length < 3 || loading}
            onClick={() => submitCode(digits.filter(d => d !== '').join(''))}
            className="btn-child !min-h-[52px] bg-brand-turquoise hover:bg-[#1E9A92] text-white text-base font-bold shadow-md disabled:opacity-40"
          >
            دخول
          </button>
        </div>
      </div>

      {/* Footer Link to Parent Portal */}
      <div className="mt-2 text-center">
        <Link
          to="/login"
          className="text-xs font-bold text-brand-purple hover:underline inline-flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-full border border-purple-200"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>دخول ولي الأمر</span>
        </Link>
      </div>
    </div>
  );
};
