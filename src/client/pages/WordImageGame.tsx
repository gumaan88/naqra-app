import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { localDb } from '../lib/db';
import { syncManager } from '../lib/sync';
import { sound } from '../lib/audio';
import { praiseAudio } from '../lib/praiseAudio';
import { fireCelebrationConfetti } from '../components/Confetti';
import { Word, WordImageOption, GameRoundResult, ClientSyncBatch } from '@shared/types';
import { Home, Volume2, VolumeX, Sparkles, Star } from 'lucide-react';

interface Question {
  word: Word;
  options: WordImageOption[];
}

export const WordImageGame: React.FC = () => {
  const { activeChild, isLoading, isMuted, toggleSound } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [shakingOptionId, setShakingOptionId] = useState<string | null>(null);
  const [hintOptionId, setHintOptionId] = useState<string | null>(null);
  const [completedRounds, setCompletedRounds] = useState<GameRoundResult[]>([]);
  const [sessionStart, setSessionStart] = useState<number>(Date.now());
  const [roundStartTime, setRoundStartTime] = useState<number>(Date.now());
  const [firstTapAt, setFirstTapAt] = useState<number | null>(null);
  const [correctTaps, setCorrectTaps] = useState<number>(0);
  const [wrongTaps, setWrongTaps] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const cacheKey = `pack_images_lvl_${activeChild?.current_level || 1}`;

    try {
      let cached = await localDb.getGamePack(cacheKey);
      if (!cached || cached.length === 0) {
        const res = await api.games.getPack({
          childId: activeChild?.id,
          gameType: 'word_image',
          count: 5,
        });
        if (res.success && res.questions?.length > 0) {
          cached = res.questions;
          await localDb.saveGamePack(cacheKey, cached);
        }
      }

      if (cached && cached.length > 0) {
        setQuestions(cached);
      }
    } catch {
      // Fallback offline questions
      const fallbackQuestions: Question[] = [
        {
          word: { id: 'w_08', text: 'أسد', normalized_text: 'أسد', category: 'حيوانات', difficulty_level: 1, is_imageable: true, image_url: '/assets/images/words/lion.svg', status: 'approved', created_at: '' },
          options: [
            { id: 'opt_1', wordId: 'w_08', wordText: 'أسد', imageUrl: '/assets/images/words/lion.svg', isCorrect: true, status: 'idle' as const },
            { id: 'opt_2', wordId: 'w_09', wordText: 'قط', imageUrl: '/assets/images/words/cat.svg', isCorrect: false, status: 'idle' as const },
            { id: 'opt_3', wordId: 'w_10', wordText: 'بط', imageUrl: '/assets/images/words/duck.svg', isCorrect: false, status: 'idle' as const },
          ].sort(() => Math.random() - 0.5),
        },
        {
          word: { id: 'w_04', text: 'باب', normalized_text: 'باب', category: 'المنزل', difficulty_level: 1, is_imageable: true, image_url: '/assets/images/words/door.svg', status: 'approved', created_at: '' },
          options: [
            { id: 'opt_4', wordId: 'w_04', wordText: 'باب', imageUrl: '/assets/images/words/door.svg', isCorrect: true, status: 'idle' as const },
            { id: 'opt_5', wordId: 'w_05', wordText: 'دب', imageUrl: '/assets/images/words/bear.svg', isCorrect: false, status: 'idle' as const },
            { id: 'opt_6', wordId: 'w_07', wordText: 'يد', imageUrl: '/assets/images/words/hand.svg', isCorrect: false, status: 'idle' as const },
          ].sort(() => Math.random() - 0.5),
        }
      ];
      setQuestions(fallbackQuestions);
    } finally {
      setLoading(false);
      setSessionStart(Date.now());
      setRoundStartTime(Date.now());
    }
  };

  const handleOptionClick = (option: WordImageOption) => {
    const now = Date.now();
    const tapAt = firstTapAt ?? now;
    if (!firstTapAt) setFirstTapAt(now);

    if (option.isCorrect) {
      sound.playSuccess();
      const currentQ = questions[currentIdx];
      const activeSolveMs = Math.max(0, now - tapAt);
      const viewToFirstTapMs = Math.max(0, tapAt - roundStartTime);

      // Points: 10 + 5 (if zero errors)
      const points = 10 + (wrongTaps === 0 ? 5 : 0) + (hintOptionId ? 0 : 3);

      const roundResult: GameRoundResult = {
        roundIndex: currentIdx,
        wordId: currentQ.word.id,
        wordText: currentQ.word.text,
        wordShownAt: roundStartTime,
        firstTapAt: tapAt,
        completedAt: now,
        activeSolveMs,
        viewToFirstTapMs,
        correctTaps: correctTaps + 1,
        wrongTaps,
        hintCount: hintOptionId ? 1 : 0,
        firstPass: wrongTaps === 0 && !hintOptionId,
        points,
      };

      const updatedRounds = [...completedRounds, roundResult];
      setCompletedRounds(updatedRounds);

      const nextStreak = wrongTaps === 0 ? streakCount + 1 : 0;
      setStreakCount(nextStreak);

      if (currentIdx + 1 < questions.length) {
        setTimeout(() => {
          praiseAudio.playCelebrationSuccess(nextStreak);
        }, 120);
        setTimeout(() => {
          setCurrentIdx(prev => prev + 1);
          setErrorCount(0);
          setHintOptionId(null);
          setShakingOptionId(null);
          setFirstTapAt(null);
          setRoundStartTime(Date.now());
          setCorrectTaps(0);
          setWrongTaps(0);
        }, 800);
      } else {
        // Finished group
        setTimeout(() => {
          praiseAudio.playCelebrationSuccess(nextStreak);
        }, 120);
        fireCelebrationConfetti();
        setTimeout(() => {
          finishSession(updatedRounds);
        }, 1400);
      }
    } else {
      sound.playError();
      setStreakCount(0);
      const nextErrors = errorCount + 1;
      setErrorCount(nextErrors);
      setWrongTaps(prev => prev + 1);
      setShakingOptionId(option.id);

      // Rule 137: after 3 errors on the same question, gentle highlight on correct option
      if (nextErrors >= 3) {
        const correctOpt = questions[currentIdx].options.find(o => o.isCorrect);
        if (correctOpt) {
          setHintOptionId(correctOpt.id);
        }
      }

      setTimeout(() => {
        setShakingOptionId(null);
      }, 400);
    }
  };

  const finishSession = async (results: GameRoundResult[]) => {
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
    const activeMs = results.reduce((sum, r) => sum + r.activeSolveMs, 0);
    const clientBatchId = `batch_img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const batch: ClientSyncBatch = {
      clientBatchId,
      childId: activeChild!.id,
      gameType: 'word_image',
      startedAt: new Date(sessionStart).toISOString(),
      endedAt: new Date().toISOString(),
      activeMs,
      points: totalPoints,
      appVersion: '1.0.0',
      rounds: results,
    };

    syncManager.recordAndSyncBatch(batch);

    navigate('/summary', {
      state: {
        gameType: 'word_image',
        wordsCount: results.length,
        points: totalPoints,
        childName: activeChild?.display_name,
      }
    });
  };

  if (loading || questions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center">
        <div className="w-14 h-14 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-lg text-gray-600">نُجَهِّزُ الصُّوَرَ الرَّائِعَة...</p>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header: Compact integrated bar */}
      <div className="flex items-center justify-between gap-2 flex-shrink-0 mb-1 sm:mb-2">
        <button
          onClick={() => navigate('/child-home')}
          className="btn-child !min-h-[40px] !min-w-[40px] w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm"
          title="الرئيسية"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Child Profile & Points */}
        <div className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-xl border border-rose-200 shadow-sm text-xs font-bold text-gray-700">
          <span className="truncate max-w-[80px]">{activeChild?.display_name || 'بطل نقرأ'}</span>
          <span className="flex items-center gap-0.5 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-lg font-black">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {activeChild?.total_points || 0}
          </span>
        </div>

        {/* Progress pills */}
        <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1.5 rounded-xl border border-rose-200 shadow-sm">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < currentIdx
                  ? 'w-4 sm:w-5 bg-brand-success'
                  : i === currentIdx
                  ? 'w-6 sm:w-7 bg-brand-coral animate-pulse'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={toggleSound}
          className="btn-child !min-h-[40px] !min-w-[40px] w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm"
          title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
        </button>
      </div>

      {/* Target Word */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-2 text-center">
        <div className="text-xs sm:text-sm font-bold text-gray-400 mb-1 sm:mb-2">اخْتَرِ الصُّورَةَ الْمُطَابِقَةَ لِلْكَلِمَة:</div>
        <div
          className="font-black text-brand-text py-1"
          style={{
            fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif',
            fontSize: 'clamp(2.5rem, 10vw, 4.6rem)',
            lineHeight: 1.25,
          }}
        >
          {currentQ.word.normalized_text || currentQ.word.text}
        </div>
      </div>

      {/* 3 Large Image Cards */}
      <div className="flex-shrink-0 pb-2 sm:pb-4">
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-lg mx-auto">
          {currentQ.options.map((opt) => {
            const isShaking = shakingOptionId === opt.id;
            const isHint = hintOptionId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className={`aspect-square rounded-2xl sm:rounded-3xl p-2.5 bg-white border-2 transition-all flex items-center justify-center shadow-md active:scale-95 group ${
                  isShaking
                    ? 'border-brand-error bg-red-50 animate-shake'
                    : isHint
                    ? 'animate-hint'
                    : 'border-brand-coral/30 hover:border-brand-coral hover:shadow-lg'
                }`}
              >
                <img
                  src={opt.imageUrl}
                  alt={opt.wordText}
                  className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
