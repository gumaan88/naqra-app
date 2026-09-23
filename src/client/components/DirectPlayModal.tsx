import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { sound } from '../lib/audio';
import { Sparkles, Play, X, Star, User, CheckCircle2 } from 'lucide-react';
import { getGuestChild } from '../lib/guestSession';

interface DirectPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVELS = [
  {
    level: 1,
    title: 'المستوى 1: كلمات ثنائية',
    desc: 'كلمات سهلة من حرفين فقط (أب، يد، فم، أم)',
    color: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-300',
    bgActive: 'bg-emerald-50',
    tag: 'سهل جداً',
  },
  {
    level: 2,
    title: 'المستوى 2: كلمات ثلاثية',
    desc: 'كلمات مألوفة من 3 أحرف (قمر، قلم، جمل، شمس)',
    color: 'from-amber-500 to-yellow-500',
    border: 'border-amber-300',
    bgActive: 'bg-amber-50',
    tag: 'مناسب للبداية',
  },
  {
    level: 3,
    title: 'المستوى 3: كلمات رباعية',
    desc: 'كلمات متصلة من 4 أحرف (كتاب، قطار، مسجد، شجرة)',
    color: 'from-blue-500 to-cyan-500',
    border: 'border-blue-300',
    bgActive: 'bg-blue-50',
    tag: 'مستوى متقدم',
  },
  {
    level: 4,
    title: 'المستوى 4: كلمات متوسطة',
    desc: 'كلمات من 4 إلى 5 أحرف (مدرسة، حديقة، تفاحة)',
    color: 'from-purple-500 to-indigo-500',
    border: 'border-purple-300',
    bgActive: 'bg-purple-50',
    tag: 'تحدي القراءة',
  },
  {
    level: 5,
    title: 'المستوى 5: تراكيب طويلة',
    desc: 'كلمات من 5 إلى 6 أحرف (مستشفى، طائرة، كمبيوتر)',
    color: 'from-rose-500 to-pink-500',
    border: 'border-rose-300',
    bgActive: 'bg-rose-50',
    tag: 'أبطال القراءة',
  },
];

export const DirectPlayModal: React.FC<DirectPlayModalProps> = ({ isOpen, onClose }) => {
  const { startGuestPlay } = useAuth();
  const navigate = useNavigate();
  const existingGuest = getGuestChild();

  const [selectedLevel, setSelectedLevel] = useState<number>(existingGuest?.current_level || 1);
  const [childName, setChildName] = useState<string>(existingGuest?.display_name || '');

  if (!isOpen) return null;

  const handleStart = () => {
    sound.playTap();
    const finalName = childName.trim().length > 0 ? childName.trim() : 'بَطَلُ القِرَاءَة';
    startGuestPlay(selectedLevel, finalName);
    onClose();
    navigate('/game/word-letters');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none w-full max-w-full overflow-x-hidden">
      <div
        className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl border-2 border-brand-turquoise/30 flex flex-col max-h-[92dvh] overflow-y-auto overflow-x-hidden"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-turquoise to-[#22B8AE] flex items-center justify-center text-white shadow-md shadow-brand-turquoise/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-brand-text leading-tight">
                لَعِبٌ مُبَاشِرٌ (دُونَ تَسْجِيلٍ) 🚀
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                اخْتَرْ مُسْتَوَاكَ وَانْطَلِقْ لِلَّعِبِ فَوْرًا
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Guest Badge if available */}
        {existingGuest && existingGuest.total_points > 0 && (
          <div className="mt-4 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs font-bold text-amber-900">
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>رصيدك السابق في هذا الجهاز:</span>
            </div>
            <span className="text-sm font-black text-amber-950">{existingGuest.total_points} نجمة 🌟</span>
          </div>
        )}

        {/* Name input */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-brand-turquoise" />
            <span>اسم البطل الصغير (اختياري):</span>
          </label>
          <input
            type="text"
            value={childName}
            onChange={e => setChildName(e.target.value)}
            placeholder="بَطَلُ القِرَاءَة"
            maxLength={25}
            className="w-full px-4 py-2.5 rounded-2xl border-2 border-gray-200 focus:border-brand-turquoise focus:outline-none text-base font-bold text-brand-text placeholder-gray-400 bg-gray-50/50"
          />
        </div>

        {/* Level Selection Cards */}
        <div className="mt-4">
          <label className="block text-xs font-bold text-gray-700 mb-2">
            اخْتَرِ الْمُسْتَوَى المُنَاسِبَ:
          </label>
          <div className="space-y-2">
            {LEVELS.map(lvl => {
              const isSelected = selectedLevel === lvl.level;
              return (
                <div
                  key={lvl.level}
                  onClick={() => {
                    sound.playTap();
                    setSelectedLevel(lvl.level);
                  }}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? `${lvl.border} ${lvl.bgActive} shadow-md scale-[1.01]`
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm bg-gradient-to-tr ${lvl.color}`}
                    >
                      {lvl.level}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-brand-text flex items-center gap-2">
                        <span>{lvl.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 font-bold">
                          {lvl.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium">{lvl.desc}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <CheckCircle2 className="w-5 h-5 text-brand-turquoise" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center gap-3">
          <button
            onClick={handleStart}
            className="btn-child flex-1 py-3.5 bg-gradient-to-r from-brand-turquoise to-[#22B8AE] hover:from-[#1E978F] hover:to-brand-turquoise text-white text-lg font-black shadow-lg shadow-brand-turquoise/25 flex items-center justify-center gap-2 rounded-2xl"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>ابْدَأِ اللَّعِبَ الْآن!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
