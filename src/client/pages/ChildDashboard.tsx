import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { Star, Play, Award, Sparkles, BookOpen, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { sound } from '../lib/audio';

export const ChildDashboard: React.FC = () => {
  const { activeChild } = useAuth();
  const navigate = useNavigate();

  if (!activeChild) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-black mb-4">يرجى اختيار طفل للبدء</h2>
        <Link to="/child-select" className="btn-child px-6 py-3 bg-brand-turquoise text-white">
          اختيار طفل
        </Link>
      </div>
    );
  }

  const startGame = (gameType: 'word_letters' | 'word_image') => {
    sound.playTap();
    if (gameType === 'word_letters') {
      navigate('/game/word-letters');
    } else {
      navigate('/game/word-image');
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-4xl mx-auto px-4 py-8 flex flex-col justify-between">
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

        {/* Total Points / Stars Counter */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 px-6 py-3 rounded-2xl shadow-inner">
          <div className="w-10 h-10 rounded-full bg-brand-yellow flex items-center justify-center shadow-md">
            <Star className="w-6 h-6 fill-amber-600 text-amber-600" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-amber-950 leading-none">{activeChild.total_points}</div>
            <div className="text-xs font-bold text-amber-800">نجمة مجمعة</div>
          </div>
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Game 1: حروف الكلمة */}
        <div
          onClick={() => startGame('word_letters')}
          className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-brand-turquoise shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 text-brand-turquoise flex items-center justify-center font-black text-2xl border border-teal-200 group-hover:bg-brand-turquoise group-hover:text-white transition-colors">
                <BookOpen className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-xl bg-teal-50 text-brand-turquoise text-xs font-black">
                اللعبة الأولى
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-brand-text mb-2">
              حُرُوفُ الْكَلِمَة
            </h2>
            <p className="text-gray-600 font-medium text-sm sm:text-base leading-relaxed mb-6">
              اقْرَأِ الْكَلِمَةَ ثُمَّ اخْتَرِ الْحُرُوفَ بِالتَّرْتِيبِ الصَّحِيحِ لِتَمْلَأَ الْخَانَات.
            </p>
          </div>

          <div className="btn-child w-full bg-brand-turquoise hover:bg-[#1E978F] text-white py-3.5 text-lg font-black shadow-md flex items-center justify-center gap-2">
            <Play className="w-5 h-5 fill-white" />
            <span>ابْدَأِ اللُّعْبَة</span>
          </div>
        </div>

        {/* Game 2: الكلمة والصورة */}
        <div
          onClick={() => startGame('word_image')}
          className="bg-white rounded-3xl p-6 sm:p-8 border-3 border-brand-coral shadow-lg hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-brand-coral flex items-center justify-center font-black text-2xl border border-rose-200 group-hover:bg-brand-coral group-hover:text-white transition-colors">
                <ImageIcon className="w-7 h-7" />
              </div>
              <span className="px-3 py-1 rounded-xl bg-rose-50 text-brand-coral text-xs font-black">
                اللعبة الثانية
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-brand-text mb-2">
              الْكَلِمَةُ وَالصُّورَة
            </h2>
            <p className="text-gray-600 font-medium text-sm sm:text-base leading-relaxed mb-6">
              اقْرَأِ الْكَلِمَةَ فِي الْأَعْلَى ثُمَّ اخْتَرِ الصُّورَةَ الْمُطَابِقَةَ لَهَا بِسُرْعَةٍ وَذَكَاء.
            </p>
          </div>

          <div className="btn-child w-full bg-brand-coral hover:bg-[#F26B5C] text-white py-3.5 text-lg font-black shadow-md flex items-center justify-center gap-2">
            <Play className="w-5 h-5 fill-white" />
            <span>ابْدَأِ اللُّعْبَة</span>
          </div>
        </div>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <Link
          to="/child-select"
          className="text-xs font-bold text-gray-500 hover:text-brand-turquoise hover:underline inline-flex items-center gap-1"
        >
          <span>← تبديل بطل القراءة</span>
        </Link>
      </div>
    </div>
  );
};
