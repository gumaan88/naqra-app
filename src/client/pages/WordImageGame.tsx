import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { localDb } from '../lib/db';
import { syncManager } from '../lib/sync';
import { sound } from '../lib/audio';
import { fireCelebrationConfetti } from '../components/Confetti';
import { Word, WordImageOption, GameRoundResult, ClientSyncBatch } from '@shared/types';
import { Home, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface Question {
  word: Word;
  options: WordImageOption[];
}

export const WordImageGame: React.FC = () => {
  const { activeChild, isMuted, toggleSound } = useAuth();
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!activeChild) {
      navigate('/child-select');
      return;
    }
    loadQuestions();
  }, [activeChild]);

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
            { id: 'opt_1', wordId: 'w_08', wordText: 'أسد', imageUrl: '/assets/images/words/lion.svg', isCorrect: true, status: 'idle' },
            { id: 'opt_2', wordId: 'w_09', wordText: 'قط', imageUrl: '/assets/images/words/cat.svg', isCorrect: false, status: 'idle' },
            { id: 'opt_3', wordId: 'w_10', wordText: 'بط', imageUrl: '/assets/images/words/duck.svg', isCorrect: false, status: 'idle' },
          ].sort(() => Math.random() - 0.5),
        },
        {
          word: { id: 'w_04', text: 'باب', normalized_text: 'باب', category: 'المنزل', difficulty_level: 1, is_imageable: true, image_url: '/assets/images/words/door.svg', status: 'approved', created_at: '' },
          options: [
            { id: 'opt_4', wordId: 'w_04', wordText: 'باب', imageUrl: '/assets/images/words/door.svg', isCorrect: true, status: 'idle' },
            { id: 'opt_5', wordId: 'w_05', wordText: 'دب', imageUrl: '/assets/images/words/bear.svg', isCorrect: false, status: 'idle' },
            { id: 'opt_6', wordId: 'w_07', wordText: 'يد', imageUrl: '/assets/images/words/hand.svg', isCorrect: false, status: 'idle' },
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

      if (currentIdx + 1 < questions.length) {
        setTimeout(() => {
          setCurrentIdx(prev => prev + 1);
          setErrorCount(0);
          setHintOptionId(null);
          setShakingOptionId(null);
          setFirstTapAt(null);
          setRoundStartTime(Date.now());
          setCorrectTaps(0);
          setWrongTaps(0);
        }, 600);
      } else {
        // Finished group
        sound.playCelebration();
        fireCelebrationConfetti();
        setTimeout(() => {
          finishSession(updatedRounds);
        }, 1200);
      }
    } else {
      sound.playError();
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
    <div className="min-h-[calc(100vh-68px)] max-w-2xl mx-auto px-4 py-6 flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/child-home')}
          className="btn-child !min-h-[44px] !min-w-[44px] w-11 h-11 bg-white border border-gray-200 text-gray-600 rounded-2xl"
          title="الرئيسية"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Progress pills */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-rose-200 shadow-sm">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full transition-all ${
                i < currentIdx
                  ? 'w-6 bg-brand-success'
                  : i === currentIdx
                  ? 'w-8 bg-brand-coral animate-pulse'
                  : 'w-2.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        <button
          onClick={toggleSound}
          className="btn-child !min-h-[44px] !min-w-[44px] w-11 h-11 bg-white border border-gray-200 text-gray-600 rounded-2xl"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-gray-400" /> : <Volume2 className="w-5 h-5 text-amber-600" />}
        </button>
      </div>

      {/* Target Word */}
      <div className="my-auto text-center py-6">
        <div className="text-sm font-bold text-gray-500 mb-2">اخْتَرِ الصُّورَةَ الْمُطَابِقَةَ لِلْكَلِمَة:</div>
        <div
          className="text-6xl sm:text-7xl md:text-8xl font-black text-brand-text py-2"
          style={{ fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif' }}
        >
          {currentQ.word.normalized_text || currentQ.word.text}
        </div>
      </div>

      {/* 3 Large Image Cards */}
      <div className="pb-8">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-lg mx-auto">
          {currentQ.options.map((opt) => {
            const isShaking = shakingOptionId === opt.id;
            const isHint = hintOptionId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleOptionClick(opt)}
                className={`aspect-square rounded-3xl p-3 bg-white border-3 transition-all flex items-center justify-center shadow-lg active:scale-95 group ${
                  isShaking
                    ? 'border-brand-error bg-red-50 animate-shake'
                    : isHint
                    ? 'animate-hint'
                    : 'border-brand-coral/30 hover:border-brand-coral hover:shadow-xl'
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
