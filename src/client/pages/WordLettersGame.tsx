import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/authContext';
import { api } from '../lib/api';
import { localDb } from '../lib/db';
import { syncManager } from '../lib/sync';
import { sound } from '../lib/audio';
import { fireCelebrationConfetti } from '../components/Confetti';
import {
  Word,
  WordLettersState,
  initWordLettersRound,
  processLetterCardTap,
  finalizeRoundResult,
} from '@shared/game-engine';
import { GameRoundResult, ClientSyncBatch } from '@shared/types';
import { Star, Sparkles, Home, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

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

  // Load words pack (Local-first from IndexedDB or API)
  useEffect(() => {
    if (!activeChild) {
      navigate('/child-select');
      return;
    }
    loadPack();
  }, [activeChild]);

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
  };

  const handleCardClick = (cardId: string) => {
    if (!roundState || roundState.isCompleted) return;

    const res = processLetterCardTap(roundState, cardId, Date.now());

    if (res.outcome === 'ignored') {
      // Rule 88 & 327: Do nothing
      return;
    }

    if (res.outcome === 'correct') {
      sound.playSuccess();
      setRoundState(res.state);
    } else if (res.outcome === 'completed') {
      sound.playSuccess();
      sound.playCelebration();
      fireCelebrationConfetti();
      setRoundState(res.state);

      // Record finished round
      const result = finalizeRoundResult(res.state, currentWordIndex);
      const updatedResults = [...completedRounds, result];
      setCompletedRounds(updatedResults);

      // Brief celebration pause before moving to next word or ending session
      setTimeout(() => {
        if (currentWordIndex + 1 < words.length) {
          setCurrentWordIndex(prev => prev + 1);
          startWordRound(words[currentWordIndex + 1]);
        } else {
          // Session Finished: Build batch and sync
          finishSession(updatedResults);
        }
      }, 1400);
    } else if (res.outcome === 'error') {
      sound.playError();
      setShakingCardId(cardId);
      setRoundState(res.state);
      setTimeout(() => {
        setShakingCardId(null);
      }, 400);
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

    // Background resilient sync (IndexedDB + Worker batch sync)
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
      <div className="min-h-[calc(100vh-68px)] flex flex-col items-center justify-center">
        <div className="w-14 h-14 border-4 border-brand-turquoise border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-lg text-gray-600">نُجَهِّزُ حُرُوفَ الْكَلِمَاتِ يَا بَطَل...</p>
      </div>
    );
  }

  const currentWord = roundState.word;
  const targetWordClean = roundState.word.normalized_text || roundState.word.text;

  return (
    <div className="min-h-[calc(100vh-68px)] max-w-2xl mx-auto px-4 py-6 flex flex-col justify-between select-none">
      {/* Top Bar: Progress and Actions */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate('/child-home')}
          className="btn-child !min-h-[44px] !min-w-[44px] w-11 h-11 bg-white border border-gray-200 text-gray-600 rounded-2xl"
          title="الرئيسية"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Progress pills */}
        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-2xl border border-teal-200 shadow-sm">
          {words.map((_, i) => (
            <div
              key={i}
              className={`h-2.5 rounded-full transition-all ${
                i < currentWordIndex
                  ? 'w-6 bg-brand-success'
                  : i === currentWordIndex
                  ? 'w-8 bg-brand-turquoise animate-pulse'
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

      {/* Upper Half: Large Arabic Target Word Without Tashkeel */}
      <div className="flex flex-col items-center justify-center my-auto py-6">
        <div className="bg-white/90 backdrop-blur rounded-3xl p-6 sm:p-8 border-2 border-brand-turquoise/40 shadow-xl w-full text-center relative overflow-hidden">
          <div className="text-xs font-bold text-gray-400 mb-2">اقْرَأِ الْكَلِمَةَ ثُمَّ اخْتَرِ حُرُوفَهَا:</div>
          <div
            className="text-6xl sm:text-7xl md:text-8xl font-black text-brand-text tracking-wider leading-none py-2"
            style={{ fontFamily: 'Noto Sans Arabic, Tajawal, sans-serif' }}
          >
            {targetWordClean}
          </div>

          {/* Progress slots: slot for each letter of the target word */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6">
            {roundState.targetLetters.map((char, index) => {
              const isFilled = index < roundState.expectedIndex;
              return (
                <div
                  key={index}
                  className={`letter-slot ${
                    isFilled
                      ? 'bg-brand-success text-white border-brand-success scale-105 shadow-md'
                      : index === roundState.expectedIndex
                      ? 'border-brand-turquoise bg-teal-50/50'
                      : ''
                  }`}
                >
                  {isFilled ? char : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lower Half: Shuffled Letter Cards */}
      <div className="pb-8">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto">
          {roundState.cards.map((card) => {
            const isUsed = card.isUsed;
            const isShaking = shakingCardId === card.id;
            const isHint = roundState.hintCardId === card.id && !isUsed;

            return (
              <button
                key={card.id}
                type="button"
                disabled={isUsed}
                onClick={() => handleCardClick(card.id)}
                className={`letter-card ${
                  isUsed
                    ? 'bg-gray-100 text-gray-300 border-gray-200 shadow-none cursor-default opacity-40 scale-90'
                    : isShaking
                    ? 'bg-red-100 text-brand-error border-brand-error animate-shake'
                    : isHint
                    ? 'animate-hint'
                    : 'bg-white text-brand-text border-brand-turquoise/30 hover:border-brand-turquoise hover:bg-teal-50/30'
                }`}
              >
                {card.letter}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
