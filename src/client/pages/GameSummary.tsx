import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Star, Award, RotateCcw, Home, Sparkles } from 'lucide-react';
import { fireCelebrationConfetti } from '../components/Confetti';
import { sound } from '../lib/audio';

export const GameSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state || {
    gameType: 'word_letters',
    wordsCount: 5,
    points: 85,
    childName: 'بطل القراءة',
  };

  useEffect(() => {
    sound.playCelebration();
    fireCelebrationConfetti();
  }, []);

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-md mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
      {/* Trophy Badge */}
      <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-brand-yellow to-amber-300 flex items-center justify-center text-amber-950 shadow-2xl mb-6 animate-bounce-short border-4 border-white">
        <Award className="w-16 h-16 text-amber-900" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs mb-3">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span>إِنْجَازٌ رَائِع!</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-brand-text mb-2">
        أَحْسَنْتَ يَا {state.childName || 'بَطَل'}! 🌟
      </h1>
      <p className="text-gray-600 font-medium text-sm mb-8">
        لَقَدْ أَكْمَلْتَ مَجْمُوعَةَ الْكَلِمَاتِ بِنَجَاحٍ وَتَفَوُّق!
      </p>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-4 w-full mb-8">
        <div className="bg-white rounded-3xl p-5 border-2 border-teal-200 shadow-md">
          <div className="text-3xl font-black text-brand-turquoise mb-1">
            {state.wordsCount || 0}
          </div>
          <div className="text-xs font-bold text-gray-500">كَلِمَات مُكْتَمِلَة</div>
        </div>

        <div className="bg-white rounded-3xl p-5 border-2 border-amber-200 shadow-md">
          <div className="text-3xl font-black text-amber-600 mb-1 flex items-center justify-center gap-1">
            <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            <span>+{state.points || 0}</span>
          </div>
          <div className="text-xs font-bold text-gray-500">نِقَاط وَنُجُوم</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full">
        <button
          onClick={() => {
            sound.playTap();
            if (state.gameType === 'word_letters') {
              navigate('/game/word-letters');
            } else {
              navigate('/game/word-image');
            }
          }}
          className="btn-child w-full bg-brand-turquoise hover:bg-[#1D9991] text-white py-4 text-lg font-black shadow-lg shadow-brand-turquoise/20 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          <span>الْعَبْ مَرَّةً أُخْرَى</span>
        </button>

        <button
          onClick={() => {
            sound.playTap();
            navigate('/child-home');
          }}
          className="btn-child w-full bg-white hover:bg-gray-50 border-2 border-gray-200 text-brand-text py-3 text-base font-bold shadow-sm flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5 text-gray-500" />
          <span>الْعَوْدَةُ لِلرَّئِيسِيَّة</span>
        </button>
      </div>
    </div>
  );
};
