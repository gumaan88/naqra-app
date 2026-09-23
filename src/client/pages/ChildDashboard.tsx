import React, { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Star, Play, Sparkles, BookOpen, Image as ImageIcon, LogOut } from 'lucide-react';
import { sound } from '../lib/audio';

export const ChildDashboard: React.FC = () => {
  const { activeChild, logout } = useAuth();
  const navigate = useNavigate();

  if (!activeChild) return null;

  const startGame = (gameType: 'word_letters' | 'word_image') => {
    sound.playTap();
    if (gameType === 'word_letters') {
      navigate('/game/word-letters');
    } else {
      navigate('/game/word-image');
    }
  };

  const handleLogout = async () => {
    sound.playTap();
    await logout();
    navigate('/child-login');
  };

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-4xl mx-auto px-4 py-8 flex flex-col justify-between select-none w-full max-w-full overflow-x-hidden">
      {/* Child Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-brand-turquoise/30 shadow-lg mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 text-center sm:text-right">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-yellow to-amber-300 flex items-center justify-center text-3xl font-black text-amber-950 shadow-md border-2 border-white overflow-hidden shrink-0">
            {activeChild.photo_url ? (
              <img src={activeChild.photo_url} alt={activeChild.display_name} className="w-full h-full object-cover" />
            ) : (
              activeChild.display_name[0]
            )}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-brand-turquoise font-bold text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>المستوى {activeChild.current_level}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-text">
              مَرْحَباً يَا {activeChild.display_name}! 🌟
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">أيُّ لُعْبَةٍ تُرِيدُ أَنْ تَلْعَبَهَا الْآن؟</p>
          </div>
        </div>

        {/* Total Points / Stars Counter & Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 px-5 py-2.5 rounded-2xl shadow-inner">
            <div className="w-9 h-9 rounded-full bg-brand-yellow flex items-center justify-center shadow-md">
              <Star className="w-5 h-5 fill-amber-600 text-amber-600" />
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-amber-950 leading-none">{activeChild.total_points}</div>
              <div className="text-[11px] font-bold text-amber-800">نجمة مجمعة</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="خروج"
            className="btn-child !min-h-[44px] !min-w-[44px] w-11 h-11 rounded-2xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 border border-gray-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Featured Game Card (Game 2 'Word & Image' temporarily hidden for upcoming enhancements) */}
      <div className="max-w-2xl mx-auto w-full mb-8">
        {/* Game 1: حروف الكلمة */}
        <div
          onClick={() => startGame('word_letters')}
          className="bg-white rounded-3xl p-6 sm:p-10 border-3 border-brand-turquoise shadow-xl hover:shadow-2xl hover:scale-[1.01] transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-32 h-32 bg-brand-turquoise/10 rounded-br-full -z-0" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-brand-turquoise flex items-center justify-center font-black text-3xl border border-teal-200 group-hover:bg-brand-turquoise group-hover:text-white transition-colors shadow-sm">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-xl bg-teal-50 text-brand-turquoise text-xs font-black border border-teal-200">
                  اللعبة التفاعلية
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-black border border-amber-200">
                  المستوى {activeChild.current_level}
                </span>
              </div>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-brand-text mb-3">
              حُرُوفُ الْكَلِمَة
            </h2>
            <p className="text-gray-600 font-medium text-base sm:text-lg leading-relaxed mb-8">
              اقْرَأِ الْكَلِمَةَ بِتَأَنٍّ ثُمَّ اخْتَرِ الْحُرُوفَ بِالتَّرْتِيبِ الصَّحِيحِ لِتَمْلَأَ الْخَانَات وَتَجْمَعَ النُّجُوم! 🌟
            </p>
          </div>

          <div className="btn-child w-full bg-gradient-to-r from-brand-turquoise to-[#22B8AE] hover:from-[#1E978F] hover:to-brand-turquoise text-white py-4 text-xl font-black shadow-lg shadow-brand-turquoise/25 flex items-center justify-center gap-3 rounded-2xl">
            <Play className="w-6 h-6 fill-white" />
            <span>ابْدَأِ اللَّعِبَ الْآن!</span>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 font-medium">
        منصة نقرأ — القراءة متعة وسهولة 🌟
      </div>
    </div>
  );
};
