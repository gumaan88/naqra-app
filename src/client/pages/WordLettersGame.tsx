import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { localDb } from '../lib/db';
import { syncManager } from '../lib/sync';
import { sound } from '../lib/audio';
import { praiseAudio } from '../lib/praiseAudio';
import { fireCelebrationConfetti } from '../components/Confetti';
import {
  WordLettersState,
  initWordLettersRound,
  processLetterCardTap,
  finalizeRoundResult,
} from '@shared/game-engine';
import { Word, GameRoundResult, ClientSyncBatch } from '@shared/types';
import { Star, Sparkles, Home, Volume2, VolumeX } from 'lucide-react';
import { ArabicWordDisplay } from '../components/ArabicWordDisplay';

export const WordLettersGame: React.FC = () => {
  const { activeChild, isMuted, toggleSound } = useAuth();
  const navigate = useNavigate();

  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [roundState, setRoundState] = useState<WordLettersState | null>(null);
  const [completedRounds, setCompletedRounds] = useState<GameRoundResult[]>([]);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [loading, setLoading] = useState<boolean>(true);

  // 2-Phase Flow: 'preview' -> 'playing' -> 'success'
  const [gamePhase, setGamePhase] = useState<'preview' | 'playing' | 'success'>('preview');
  const [previewStartedAt, setPreviewStartedAt] = useState<number>(Date.now());
  const [previewDurationMs, setPreviewDurationMs] = useState<number>(0);
  const [previewHelpUsed, setPreviewHelpUsed] = useState<boolean>(false);
  const [challengeStartedAt, setChallengeStartedAt] = useState<number>(0);
  const [streakCount, setStreakCount] = useState<number>(0);

  // Load words pack (Local-first from IndexedDB or API)
  useEffect(() => {
    loadPack();
  }, []);

  const loadPack = async () => {
    setLoading(true);
    const cacheKey = `pack_letters_lvl_${activeChild?.current_level || 1}`;

    try {
      // Check local cache first
      let cached = await localDb.getGamePack(cacheKey);
      if (!cached || cached.length === 0) {
        const res = await api.games.getPack({
          childId: activeChild?.id,
          gameType: 'word_letters',
          count: 6,
        });
        if (res.success && res.words?.length > 0) {
          cached = res.words;
          await localDb.saveGamePack(cacheKey, cached);
        }
      }

      if (cached && cached.length > 0) {
        setWords(cached);
        startWordRound(cached[0]);
      }
    } catch {
      // Fallback curated words if completely offline and cache empty
      const offlineWords: Word[] = [
        { id: 'w_01', text: 'أب', normalized_text: 'أب', category: 'عائلة', difficulty_level: 1, is_imageable: true, status: 'approved', created_at: '' },
        { id: 'w_02', text: 'أم', normalized_text: 'أم', category: 'عائلة', difficulty_level: 1, is_imageable: true, status: 'approved', created_at: '' },
        { id: 'w_04', text: 'باب', normalized_text: 'باب', category: 'المنزل', difficulty_level: 1, is_imageable: true, status: 'approved', created_at: '' },
        { id: 'w_08', text: 'أسد', normalized_text: 'أسد', category: 'حيوانات', difficulty_level: 1, is_imageable: true, status: 'approved', created_at: '' },
        { id: 'w_09', text: 'قط', normalized_text: 'قط', category: 'حيوانات', difficulty_level: 1, is_imageable: true, status: 'approved', created_at: '' },
      ];
      setWords(offlineWords);
      startWordRound(offlineWords[0]);
    } finally {
      setLoading(false);
      setSessionStartTime(Date.now());
    }
  };

  const startWordRound = (word: Word) => {
    const state = initWordLettersRound(word, activeChild?.current_level || 1);
    setRoundState(state);
    setShakingCardId(null);
    setGamePhase('preview');
    setPreviewStartedAt(Date.now());
    setPreviewDurationMs(0);
    setPreviewHelpUsed(false);
  };

  const handleReadyToPlay = () => {
    sound.playTap();
    const duration = Math.max(100, Date.now() - previewStartedAt);
    setPreviewDurationMs(duration);
    setGamePhase('playing');
    setChallengeStartedAt(Date.now());
  };

  const handlePreviewHelp = () => {
    sound.playTap();
    setPreviewHelpUsed(true);
    if (roundState) {
      const cleanWord = roundState.word.normalized_text || roundState.word.text;
      praiseAudio.speakWord(cleanWord);
    }
  };

  const handleCardClick = (cardId: string) => {
    if (!roundState || roundState.isCompleted || gamePhase !== 'playing') return;

    const res = processLetterCardTap(roundState, cardId, Date.now());

    if (res.outcome === 'ignored') {
      return;
    }

    if (res.outcome === 'correct') {
      sound.playSuccess();
      setRoundState(res.state);
    } else if (res.outcome === 'error') {
      // Gentle child-friendly wrong letter feedback:
      // 1. Soft error tone (warm non-punitive "بوب" / "تن")
      praiseAudio.playSoftError();
      // 2. Tile turns soft red with subtle wiggle animation (strictly no layout shift)
      setShakingCardId(cardId);
      // 3. Reset streak count
      setStreakCount(0);
      // 4. Update state (does not advance expectedIndex; triggers gentle hint on 3rd error)
      setRoundState(res.state);
      // 5. Automatically revert tile to normal appearance after 380ms
      setTimeout(() => {
        setShakingCardId(null);
      }, 380);
    } else if (res.outcome === 'completed') {
      const nextStreak = res.state.wrongTaps === 0 ? streakCount + 1 : 0;
      setStreakCount(nextStreak);
      setGamePhase('success');
      const challengeDuration = Math.max(100, Date.now() - challengeStartedAt);

      // Play natural human Arabic praise + layered profile from Shuffle Bag
      setTimeout(() => {
        praiseAudio.playCelebrationSuccess(nextStreak);
      }, 120);

      fireCelebrationConfetti();
      setRoundState(res.state);

      // Record finished round with distinct preview and challenge timings
      const result = finalizeRoundResult(res.state, currentWordIndex);
      result.activeSolveMs = challengeDuration;
      result.eventJson = JSON.stringify({
        previewDurationMs,
        challengeDurationMs: challengeDuration,
        previewHelpUsed,
        wordText: roundState.word.normalized_text || roundState.word.text,
      });

      const updatedResults = [...completedRounds, result];
      setCompletedRounds(updatedResults);

      // Transition to next word (Phase 1 preview) after celebration
      setTimeout(() => {
        if (currentWordIndex + 1 < words.length) {
          setCurrentWordIndex(prev => prev + 1);
          startWordRound(words[currentWordIndex + 1]);
        } else {
          finishSession(updatedResults);
        }
      }, 1500);
    }
  };

  const finishSession = async (results: GameRoundResult[]) => {
    const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
    const activeMs = results.reduce((sum, r) => sum + r.activeSolveMs, 0);
    const clientBatchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const batch: ClientSyncBatch = {
      clientBatchId,
      childId: activeChild!.id,
      gameType: 'word_letters',
      startedAt: new Date(sessionStartTime).toISOString(),
      endedAt: new Date().toISOString(),
      activeMs,
      points: totalPoints,
      appVersion: '1.0.0',
      rounds: results,
    };

    // Background resilient sync
    syncManager.recordAndSyncBatch(batch);

    // Navigate to summary screen
    navigate('/summary', {
      state: {
        gameType: 'word_letters',
        wordsCount: results.length,
        points: totalPoints,
        childName: activeChild?.display_name,
      }
    });
  };

  if (loading || !roundState) {
    return (
      <div className="h-[100dvh] max-h-[100dvh] flex flex-col items-center justify-center select-none overflow-hidden">
        <div className="w-12 h-12 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin mb-3" />
        <p className="font-bold text-base text-gray-600">نُجَهِّزُ حُرُوفَ الْكَلِمَاتِ يَا بَطَل...</p>
      </div>
    );
  }

  const targetWordClean = roundState.word.normalized_text || roundState.word.text;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-col overflow-hidden select-none">
      {/* Top Header: Compact integrated bar */}
      <div className="flex items-center justify-between gap-2 flex-shrink-0 h-10 sm:h-12 mb-1 sm:mb-2">
        <button
          onClick={() => navigate('/child-home')}
          className="btn-child !min-h-[40px] !min-w-[40px] w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm"
          title="الرئيسية"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Child Profile & Points */}
        <div className="flex items-center gap-1.5 bg-white/90 px-2.5 py-1 rounded-xl border border-teal-200 shadow-sm text-xs font-bold text-gray-700">
          <span className="truncate max-w-[80px]">{activeChild?.display_name || 'بطل نقرأ'}</span>
          <span className="flex items-center gap-0.5 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-lg font-black">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            {activeChild?.total_points || 0}
          </span>
        </div>

        {/* Progress Pills */}
        <div className="flex items-center gap-1 bg-white/90 px-2.5 py-1.5 rounded-xl border border-teal-200 shadow-sm">
          {words.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < currentWordIndex
                  ? 'w-3.5 sm:w-5 bg-brand-success'
                  : i === currentWordIndex
                  ? 'w-5 sm:w-7 bg-brand-turquoise animate-pulse'
                  : 'w-2 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className="btn-child !min-h-[40px] !min-w-[40px] w-10 h-10 bg-white border border-gray-200 text-gray-600 rounded-xl shadow-sm"
          title={isMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-gray-400" /> : <Volume2 className="w-4 h-4 text-amber-600" />}
        </button>
      </div>

      {/* PHASE 1 — Reading Preview */}
      {gamePhase === 'preview' ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3 sm:gap-4 py-2 my-auto max-w-md mx-auto w-full">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border-2 border-brand-turquoise/40 shadow-xl w-full text-center relative overflow-hidden flex flex-col items-center justify-center">
            <div className="text-xs sm:text-sm font-bold text-gray-400 mb-2 sm:mb-4">
              اقْرَأِ الْكَلِمَةَ بِهُدُوء:
            </div>

            {/* Word Display (Unbroken, connected, cleanly sized) */}
            <div className="py-2 sm:py-4 max-w-full overflow-visible">
              <ArabicWordDisplay
                word={targetWordClean}
                expectedIndex={0}
                sizeVariant="preview"
              />
            </div>

            <p className="text-xs text-teal-800 font-bold mt-2 bg-teal-50/80 px-3.5 py-1 rounded-full border border-teal-100 shadow-sm">
              تأمّل شكل الكلمة وحاول تهجئتها في ذهنك ✨
            </p>
          </div>

          {/* Action Area */}
          <div className="flex flex-col items-center gap-2.5 w-full max-w-xs px-4">
            <button
              type="button"
              onClick={handleReadyToPlay}
              className="btn-child w-full !min-h-[50px] sm:!min-h-[56px] bg-gradient-to-r from-brand-turquoise to-[#22B8AE] text-white text-base sm:text-lg font-black shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>قَرَأْتُهَا ✨</span>
            </button>

            <button
              type="button"
              onClick={handlePreviewHelp}
              className="btn-child !min-h-[38px] px-4 py-1 bg-amber-50/90 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Volume2 className="w-4 h-4 text-amber-600" />
              <span>سَاعِدْنِي (استمع لنطق الكلمة)</span>
            </button>
          </div>
        </div>
      ) : (
        /* PHASE 2 — Main Game Zone: A unified, cohesive educational unit centered vertically */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center my-auto w-full max-w-md mx-auto gap-[clamp(8px,1.8vh,18px)]">
          {/* 1. Word Card & Dynamic Single-Row Answer Slots */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-5 border-2 border-brand-turquoise/40 shadow-lg w-full text-center relative overflow-hidden flex flex-col justify-center items-center flex-shrink-0">
            <ArabicWordDisplay
              word={targetWordClean}
              expectedIndex={roundState.expectedIndex}
              sizeVariant="challenge"
            />

            {/* Dynamic Single-Row Answer Slots */}
            <div
              dir="rtl"
              className="flex items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 w-full max-w-full overflow-hidden"
            >
              {roundState.targetLetters.map((char, index) => {
                const isFilled = index < roundState.expectedIndex;
                const isActive = index === roundState.expectedIndex;
                const wordLen = roundState.targetLetters.length;

                return (
                  <div
                    key={index}
                    style={{
                      maxWidth: `calc((100% - ${(wordLen - 1) * 6}px) / ${wordLen})`,
                      flex: `1 1 calc((100% - ${(wordLen - 1) * 6}px) / ${wordLen})`,
                    }}
                    className={`letter-slot ${
                      isFilled
                        ? 'bg-brand-success text-white border-brand-success scale-105 shadow-md'
                        : isActive
                        ? 'border-2 border-brand-turquoise bg-teal-50/90 shadow-md scale-105 ring-2 ring-brand-turquoise/30'
                        : 'border-2 border-dashed border-gray-300 bg-white/70 opacity-60'
                    }`}
                  >
                    {isFilled ? char : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Target Letter Prompt Badge */}
          {roundState.expectedIndex < roundState.targetLetters.length && (
            <div className="flex items-center justify-center flex-shrink-0">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1 rounded-xl bg-white/95 border border-brand-turquoise/40 shadow-sm text-xs sm:text-sm font-bold text-teal-900">
                <span className="text-gray-500">الحَرْفُ المَطْلُوب:</span>
                <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-turquoise text-white font-black text-base sm:text-lg shadow-sm">
                  {roundState.targetLetters[roundState.expectedIndex]}
                </span>
              </div>
            </div>
          )}

          {/* 3. Shuffled Letter Choice Cards Grid */}
          <div className="flex-shrink-0 w-full">
            <div
              className={`grid gap-2 sm:gap-2.5 justify-center items-center ${
                roundState.cards.length <= 8 ? 'grid-cols-4' : 'grid-cols-5'
              }`}
            >
              {roundState.cards.map((card) => {
                const isUsed = card.isUsed;
                const isWrong = shakingCardId === card.id;
                const isHint = roundState.hintCardId === card.id && !isUsed;

                return (
                  <button
                    key={card.id}
                    type="button"
                    disabled={isUsed}
                    onClick={() => handleCardClick(card.id)}
                    className={`letter-card mx-auto ${
                      isUsed
                        ? 'bg-gray-100 text-gray-300 border-gray-200 shadow-none cursor-default opacity-30 scale-90'
                        : isWrong
                        ? 'letter-card-error animate-wiggle'
                        : isHint
                        ? 'animate-hint'
                        : 'bg-white text-brand-text border-brand-turquoise/30 hover:border-brand-turquoise hover:bg-teal-50/40'
                    }`}
                  >
                    {card.letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
