import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Star,
  Award,
  RotateCcw,
  Home,
  Sparkles,
  BarChart3,
  Clock,
  Target,
  Flame,
  ChevronDown,
  ChevronUp,
  Sliders,
  History,
  CheckCircle2,
  Volume2,
  ShieldCheck,
} from 'lucide-react';
import { fireCelebrationConfetti } from '../components/Confetti';
import { sound } from '../lib/audio';
import { useAuth } from '../lib/authContext';
import {
  getGuestHistory,
  getGuestChild,
  GuestSessionAnalysis,
  computeGameplayAnalysis,
} from '../lib/guestSession';
import { DirectPlayModal } from '../components/DirectPlayModal';

export const GameSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { activeChild, isGuest } = useAuth();

  const [showDetails, setShowDetails] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isDirectPlayOpen, setIsDirectPlayOpen] = useState<boolean>(false);

  const state = location.state || {};
  const isGuestActive = state.isGuest || isGuest || (activeChild as any)?.is_guest;
  const childName = state.childName || activeChild?.display_name || 'بَطَلُ القِرَاءَة';
  const level = state.level || activeChild?.current_level || 1;

  // Analysis object (either passed directly or computed on the fly from rounds)
  const analysis: GuestSessionAnalysis = state.analysis || (
    state.rounds
      ? computeGameplayAnalysis(state.rounds, childName, level)
      : {
          sessionId: 'default',
          timestamp: Date.now(),
          level,
          childName,
          wordsCount: state.wordsCount || 6,
          totalPoints: state.points || 60,
          starsEarned: 3,
          accuracyPercentage: 100,
          totalCorrectTaps: 18,
          totalWrongTaps: 0,
          avgSolveTimeSec: 2.8,
          maxStreak: 6,
          wordsDetail: [],
          pedagogicalFeedback: `أداء استثنائي يا ${childName}! أتقنت قراءة الكلمات بثقة وذكاء! 🌟`,
        }
  );

  const guestHistory = isGuestActive ? getGuestHistory() : [];
  const guestChild = isGuestActive ? getGuestChild() : null;

  useEffect(() => {
    sound.playCelebration();
    fireCelebrationConfetti();
  }, []);

  return (
    <>
      <DirectPlayModal isOpen={isDirectPlayOpen} onClose={() => setIsDirectPlayOpen(false)} />

      <div className="min-h-[calc(100vh-68px)] max-w-lg mx-auto px-3 sm:px-4 py-6 sm:py-8 flex flex-col items-center select-none w-full max-w-full overflow-x-hidden" dir="rtl">
        {/* Animated Trophy Header */}
        <div className="relative mb-4">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-brand-yellow to-amber-300 flex items-center justify-center text-amber-950 shadow-2xl animate-bounce-short border-4 border-white">
            <Award className="w-14 h-14 sm:w-16 sm:h-16 text-amber-900" />
          </div>
          {/* Level indicator pill */}
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand-turquoise text-white font-black text-xs shadow-md whitespace-nowrap">
            المستوى {level}
          </div>
        </div>

        {/* Stars Display (1, 2, or 3 based on accuracy) */}
        <div className="flex items-center gap-2 my-2">
          {[1, 2, 3].map(starNum => {
            const isFilled = starNum <= analysis.starsEarned;
            return (
              <div
                key={starNum}
                className={`transition-all transform ${
                  isFilled ? 'scale-110' : 'scale-90 opacity-40'
                }`}
              >
                <Star
                  className={`w-9 h-9 sm:w-10 sm:h-10 ${
                    isFilled ? 'fill-amber-400 text-amber-500 drop-shadow-md' : 'text-gray-300'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Main Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-brand-text mb-1 text-center">
          أَحْسَنْتَ يَا {childName}! 🌟
        </h1>
        <p className="text-gray-500 font-bold text-xs sm:text-sm mb-5 text-center">
          لَقَدْ أَكْمَلْتَ مَجْمُوعَةَ الْكَلِمَاتِ بِنَجَاحٍ وَتَفَوُّق!
        </p>

        {/* Pedagogical Feedback Banner */}
        <div className="w-full bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-2 border-teal-200 rounded-2xl p-3.5 mb-5 shadow-sm text-right">
          <div className="flex items-center gap-1.5 text-xs font-black text-teal-800 mb-1">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>التَّقْيِيمُ التَّرْبَوِيُّ الذَّكِيّ:</span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-teal-950 leading-relaxed">
            {analysis.pedagogicalFeedback}
          </p>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full mb-5">
          {/* Accuracy */}
          <div className="bg-white rounded-2xl p-2 sm:p-3 border-2 border-emerald-100 shadow-sm text-center min-w-0">
            <div className="flex items-center justify-center text-emerald-600 mb-1">
              <Target className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-xl font-black text-emerald-700 leading-none">
              %{analysis.accuracyPercentage}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 mt-1 truncate">الدِّقَّة</div>
          </div>

          {/* Points */}
          <div className="bg-white rounded-2xl p-2 sm:p-3 border-2 border-amber-100 shadow-sm text-center min-w-0">
            <div className="flex items-center justify-center text-amber-500 mb-1">
              <Star className="w-4 h-4 fill-amber-500" />
            </div>
            <div className="text-base sm:text-xl font-black text-amber-600 leading-none">
              +{analysis.totalPoints}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 mt-1 truncate">النُّقَاط</div>
          </div>

          {/* Average Speed */}
          <div className="bg-white rounded-2xl p-2 sm:p-3 border-2 border-blue-100 shadow-sm text-center min-w-0">
            <div className="flex items-center justify-center text-blue-500 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-xl font-black text-blue-600 leading-none">
              {analysis.avgSolveTimeSec}ث
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 mt-1 truncate">السُرْعَة</div>
          </div>

          {/* Max Streak */}
          <div className="bg-white rounded-2xl p-2 sm:p-3 border-2 border-rose-100 shadow-sm text-center min-w-0">
            <div className="flex items-center justify-center text-rose-500 mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-base sm:text-xl font-black text-rose-600 leading-none">
              {analysis.maxStreak}
            </div>
            <div className="text-[9px] sm:text-[10px] font-bold text-gray-500 mt-1 truncate">السِّلْسِلَة</div>
          </div>
        </div>

        {/* Detailed Word-by-Word Analysis (Collapsible Accordion) */}
        {analysis.wordsDetail && analysis.wordsDetail.length > 0 && (
          <div className="w-full bg-white rounded-2xl border-2 border-gray-100 shadow-sm mb-4 overflow-hidden">
            <button
              onClick={() => {
                sound.playTap();
                setShowDetails(!showDetails);
              }}
              className="w-full px-4 py-3 bg-gray-50/70 hover:bg-gray-100 flex items-center justify-between text-xs font-black text-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-brand-turquoise" />
                <span>تَحْلِيلُ كَلِمَاتِ الْجَوْلَة ({analysis.wordsDetail.length} كلمات)</span>
              </div>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="p-3 space-y-2 border-t border-gray-100 text-right">
                {analysis.wordsDetail.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center font-black text-[10px] text-gray-600">
                        {idx + 1}
                      </span>
                      <span className="font-black text-sm text-brand-text">{w.word}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {w.audioHelpUsed && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-200">
                          <Volume2 className="w-3 h-3" />
                          <span>استماع</span>
                        </span>
                      )}

                      <span className="text-[11px] font-bold text-gray-500">
                        {w.solveTimeSec}ث
                      </span>

                      {w.mistakes === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>دقيق 100%</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <span>{w.mistakes} أخطاء</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Temporary Guest Session History (If playing as guest) */}
        {isGuestActive && (
          <div className="w-full bg-amber-50/60 rounded-2xl border-2 border-amber-200/80 p-3.5 mb-5 shadow-sm text-right">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                <History className="w-4 h-4 text-amber-600" />
                <span>سِجِلُّكَ الْمُؤَقَّتُ فِي هَذَا الْجِهَاز:</span>
              </div>
              <span className="text-xs font-black text-amber-950 bg-amber-200/70 px-2 py-0.5 rounded-lg">
                ⭐ {guestChild?.total_points || analysis.totalPoints} نقطة
              </span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium mb-3 leading-relaxed">
              يتم حفظ نجومك وجولاتك تلقائياً في هذا الجهاز حتى تتمكن من إكمال التحدي متى أردت.
            </p>

            {guestHistory.length > 1 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="text-[11px] font-black text-amber-900 hover:text-amber-950 underline flex items-center gap-1 mb-2"
              >
                <span>{showHistory ? 'إخفاء الجلسات السابقة' : `عرض الجلسات السابقة (${guestHistory.length} جولات)`}</span>
                {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}

            {showHistory && guestHistory.length > 1 && (
              <div className="space-y-1.5 pt-2 border-t border-amber-200/60 max-h-36 overflow-y-auto">
                {guestHistory.slice(1, 6).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-bold text-amber-950 bg-white/70 p-2 rounded-xl border border-amber-200/50">
                    <span>مستوى {h.level} ({h.wordsCount} كلمات)</span>
                    <span className="text-emerald-700">دقة %{h.accuracyPercentage}</span>
                    <span className="text-amber-700">+{h.totalPoints} نقطة</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {/* Replay Same Level */}
          <button
            onClick={() => {
              sound.playTap();
              navigate('/game/word-letters');
            }}
            className="btn-child w-full bg-brand-turquoise hover:bg-[#1D9991] text-white py-3.5 text-base font-black shadow-lg shadow-brand-turquoise/20 flex items-center justify-center gap-2 rounded-2xl"
          >
            <RotateCcw className="w-5 h-5" />
            <span>الْعَبْ مَرَّةً أُخْرَى (نَفْسُ الْمُسْتَوَى)</span>
          </button>

          {/* Change Level */}
          <button
            onClick={() => {
              sound.playTap();
              setIsDirectPlayOpen(true);
            }}
            className="btn-child w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 py-3.5 text-base font-black shadow-md flex items-center justify-center gap-2 rounded-2xl border border-amber-300"
          >
            <Sliders className="w-5 h-5" />
            <span>تَغْيِيرُ الْمُسْتَوَى</span>
          </button>

          {/* Return to Home */}
          <button
            onClick={() => {
              sound.playTap();
              navigate(isGuestActive ? '/' : '/child-home');
            }}
            className="btn-child w-full bg-white hover:bg-gray-50 border-2 border-gray-200 text-brand-text py-3 text-sm font-bold shadow-sm flex items-center justify-center gap-2 rounded-2xl"
          >
            <Home className="w-4 h-4 text-gray-500" />
            <span>الْعَوْدَةُ لِلرَّئِيسِيَّة</span>
          </button>
        </div>
      </div>
    </>
  );
};
