import { Word, LetterCard, GameRoundResult, WordImageOption } from './types';
import { splitArabicLetters, generateLetterCards } from './arabic';

export interface WordLettersState {
  word: Word;
  targetLetters: string[];
  cards: LetterCard[];
  expectedIndex: number;
  consecutiveErrors: number;
  wordShownAt: number;
  firstTapAt: number | null;
  completedAt: number | null;
  correctTaps: number;
  wrongTaps: number;
  hintCount: number;
  hintCardId: string | null;
  isCompleted: boolean;
  errorLetters: string[];
}

export function initWordLettersRound(word: Word, level: number = 1): WordLettersState {
  const targetLetters = splitArabicLetters(word.normalized_text || word.text);
  const rawCards = generateLetterCards(word.normalized_text || word.text, level);
  const cards: LetterCard[] = rawCards.map(c => ({
    ...c,
    isUsed: false,
    status: 'idle',
  }));

  return {
    word,
    targetLetters,
    cards,
    expectedIndex: 0,
    consecutiveErrors: 0,
    wordShownAt: Date.now(),
    firstTapAt: null,
    completedAt: null,
    correctTaps: 0,
    wrongTaps: 0,
    hintCount: 0,
    hintCardId: null,
    isCompleted: false,
    errorLetters: [],
  };
}

export interface TapResult {
  state: WordLettersState;
  outcome: 'ignored' | 'correct' | 'error' | 'completed';
  message?: string;
}

export function processLetterCardTap(
  currentState: WordLettersState,
  cardId: string,
  now: number = Date.now()
): TapResult {
  if (currentState.isCompleted) {
    return { state: currentState, outcome: 'ignored' };
  }

  const cardIndex = currentState.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) {
    return { state: currentState, outcome: 'ignored' };
  }

  const card = currentState.cards[cardIndex];

  // Rule 88 / 327: If card is already used, IGNORE without recording an error
  if (card.isUsed) {
    return { state: currentState, outcome: 'ignored' };
  }

  // Record first tap timestamp if not already set (Rule 108 / 378)
  const firstTapAt = currentState.firstTapAt ?? now;

  const expectedLetter = currentState.targetLetters[currentState.expectedIndex];

  // Clone state for immutable update
  const newCards = currentState.cards.map(c => ({ ...c }));
  const targetCard = newCards[cardIndex];

  // Correct Tap (Rule 89)
  if (targetCard.letter === expectedLetter) {
    targetCard.isUsed = true;
    targetCard.status = 'correct';

    const newExpectedIndex = currentState.expectedIndex + 1;
    const isCompleted = newExpectedIndex >= currentState.targetLetters.length;
    const completedAt = isCompleted ? now : null;

    const updatedState: WordLettersState = {
      ...currentState,
      cards: newCards,
      expectedIndex: newExpectedIndex,
      consecutiveErrors: 0,
      firstTapAt,
      completedAt,
      correctTaps: currentState.correctTaps + 1,
      hintCardId: null,
      isCompleted,
    };

    return {
      state: updatedState,
      outcome: isCompleted ? 'completed' : 'correct',
    };
  }

  // Error Tap: letter is wrong or out of order (Rule 90 & 91)
  targetCard.status = 'error';
  const newConsecutiveErrors = currentState.consecutiveErrors + 1;
  const newWrongTaps = currentState.wrongTaps + 1;
  const newErrorLetters = [...currentState.errorLetters, targetCard.letter];

  let hintCardId = currentState.hintCardId;
  let newHintCount = currentState.hintCount;

  // Hint logic: after 3 consecutive errors for current letter position (Rule 95 & 96)
  if (newConsecutiveErrors >= 3) {
    const matchingCard = newCards.find(
      c => !c.isUsed && c.letter === expectedLetter
    );
    if (matchingCard) {
      hintCardId = matchingCard.id;
      newHintCount++;
    }
  }

  const updatedState: WordLettersState = {
    ...currentState,
    cards: newCards,
    firstTapAt,
    consecutiveErrors: newConsecutiveErrors,
    wrongTaps: newWrongTaps,
    hintCardId,
    hintCount: newHintCount,
    errorLetters: newErrorLetters,
  };

  return {
    state: updatedState,
    outcome: 'error',
    message: 'الحرف غير صحيح أو خارج الترتيب',
  };
}

export function calculateRoundScore(state: WordLettersState): number {
  if (!state.isCompleted) return 0;
  // Formula from spec Rule 121:
  // - 10 points for completion
  // - +2 points per correct letter
  // - +5 points if 0 wrong taps
  // - +3 points if 0 hints used
  let points = 10;
  points += state.targetLetters.length * 2;
  if (state.wrongTaps === 0) points += 5;
  if (state.hintCount === 0) points += 3;
  return points;
}

export function finalizeRoundResult(state: WordLettersState, roundIndex: number): GameRoundResult {
  const completedAt = state.completedAt || Date.now();
  const firstTap = state.firstTapAt || state.wordShownAt;
  const activeSolveMs = Math.max(0, completedAt - firstTap);
  const viewToFirstTapMs = Math.max(0, firstTap - state.wordShownAt);

  return {
    roundIndex,
    wordId: state.word.id,
    wordText: state.word.text,
    wordShownAt: state.wordShownAt,
    firstTapAt: state.firstTapAt,
    completedAt,
    activeSolveMs,
    viewToFirstTapMs,
    correctTaps: state.correctTaps,
    wrongTaps: state.wrongTaps,
    hintCount: state.hintCount,
    firstPass: state.wrongTaps === 0 && state.hintCount === 0,
    points: calculateRoundScore(state),
    errorLetters: state.errorLetters,
  };
}
