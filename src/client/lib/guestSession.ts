import { Child, GameRoundResult } from '@shared/types';

export interface WordDetailAnalysis {
  word: string;
  solveTimeSec: number;
  mistakes: number;
  firstPass: boolean;
  audioHelpUsed: boolean;
}

export interface GuestSessionAnalysis {
  sessionId: string;
  timestamp: number;
  level: number;
  childName: string;
  wordsCount: number;
  totalPoints: number;
  starsEarned: number;
  accuracyPercentage: number;
  totalCorrectTaps: number;
  totalWrongTaps: number;
  avgSolveTimeSec: number;
  maxStreak: number;
  wordsDetail: WordDetailAnalysis[];
  pedagogicalFeedback: string;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

const GUEST_CHILD_KEY = 'naqra_guest_child';
const GUEST_HISTORY_KEY = 'naqra_guest_history';

/**
 * Retrieves the currently active guest child record from localStorage if one exists.
 */
export function getGuestChild(): (Child & { is_guest?: boolean }) | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(GUEST_CHILD_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Initializes a new guest child profile with the selected level and optional name.
 */
export function startGuestSession(level: number, name?: string): Child & { is_guest: boolean } {
  const cleanLevel = Math.max(1, Math.min(5, Math.floor(level) || 1));
  const displayName = (name && name.trim().length > 0) ? name.trim() : 'بَطَلُ القِرَاءَة';

  // Check if we have an existing guest to preserve accumulated points
  const existing = getGuestChild();
  const guestChild: Child & { is_guest: boolean } = {
    id: existing?.id || `guest_${Date.now()}`,
    user_id: 'guest_user',
    display_name: displayName,
    current_level: cleanLevel,
    total_points: existing?.total_points || 0,
    created_at: existing?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_guest: true,
  };

  const storage = getStorage();
  if (storage) {
    storage.setItem(GUEST_CHILD_KEY, JSON.stringify(guestChild));
  }

  return guestChild;
}

/**
 * Updates guest child level or name.
 */
export function updateGuestLevel(newLevel: number): Child & { is_guest: boolean } {
  const current = getGuestChild() || startGuestSession(newLevel);
  current.current_level = Math.max(1, Math.min(5, Math.floor(newLevel) || 1));
  current.updated_at = new Date().toISOString();

  const storage = getStorage();
  if (storage) {
    storage.setItem(GUEST_CHILD_KEY, JSON.stringify(current));
  }

  return current;
}

/**
 * Computes deep pedagogical gameplay analysis from completed round results.
 */
export function computeGameplayAnalysis(
  rounds: GameRoundResult[],
  childName: string,
  level: number
): GuestSessionAnalysis {
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalSolveMs = 0;
  let maxStreak = 0;
  let currentStreak = 0;
  let totalPoints = 0;

  const wordsDetail: WordDetailAnalysis[] = rounds.map(r => {
    totalCorrect += (r.correctTaps || 0);
    totalWrong += (r.wrongTaps || 0);
    totalSolveMs += (r.activeSolveMs || 0);
    totalPoints += (r.points || 0);

    if (r.wrongTaps === 0) {
      currentStreak += 1;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }

    let wordText = 'كلمة';
    let audioHelpUsed = false;
    if (r.eventJson) {
      try {
        const parsed = JSON.parse(r.eventJson);
        if (parsed.wordText) wordText = parsed.wordText;
        if (parsed.previewHelpUsed) audioHelpUsed = true;
      } catch {}
    }

    return {
      word: wordText,
      solveTimeSec: Number(((r.activeSolveMs || 0) / 1000).toFixed(1)),
      mistakes: r.wrongTaps || 0,
      firstPass: r.firstPass === 1,
      audioHelpUsed,
    };
  });

  const totalTaps = totalCorrect + totalWrong;
  const accuracyPercentage = totalTaps > 0
    ? Math.round((totalCorrect / totalTaps) * 100)
    : 100;

  const avgSolveTimeSec = rounds.length > 0
    ? Number((totalSolveMs / rounds.length / 1000).toFixed(1))
    : 0;

  // Star calculation: 3 stars for >= 90%, 2 stars for >= 75%, 1 star otherwise
  let starsEarned = 1;
  if (accuracyPercentage >= 90) starsEarned = 3;
  else if (accuracyPercentage >= 75) starsEarned = 2;

  // Pedagogical feedback generation
  let pedagogicalFeedback = 'رائع جداً! استمر في القراءة والتهجي يا بطل!';
  if (accuracyPercentage === 100) {
    pedagogicalFeedback = `ما شاء الله يا ${childName}! دقة مذهلة 100% بدون أي أخطاء، وتركيزك في ترتيب الحروف ممتاز جداً! 🌟`;
  } else if (accuracyPercentage >= 90) {
    pedagogicalFeedback = `أداء استثنائي يا ${childName}! أتقنت قراءة الكلمات بثقة عالية وسرعة بديهة رائعة! 👏`;
  } else if (accuracyPercentage >= 75) {
    pedagogicalFeedback = `محاولة ممتازة يا ${childName}! انتباهك للحروف يزداد جولة بعد جولة، ومع التكرار ستصل لعلامة كاملة! ✨`;
  } else {
    pedagogicalFeedback = `أحسنت المحاولة يا ${childName}! تمييز الحروف يحتاج تأني وهدوء، والخطأ هو أول خطوات التعلم! 💪`;
  }

  const analysis: GuestSessionAnalysis = {
    sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    level,
    childName,
    wordsCount: rounds.length,
    totalPoints,
    starsEarned,
    accuracyPercentage,
    totalCorrectTaps: totalCorrect,
    totalWrongTaps: totalWrong,
    avgSolveTimeSec,
    maxStreak,
    wordsDetail,
    pedagogicalFeedback,
  };

  return analysis;
}

/**
 * Saves completed session analysis into the temporary guest session history.
 * Also accumulates stars & points into the guest child profile.
 */
export function saveGuestGameResults(analysis: GuestSessionAnalysis): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    // 1. Update guest child points
    const current = getGuestChild();
    if (current) {
      current.total_points = (current.total_points || 0) + analysis.totalPoints;
      current.updated_at = new Date().toISOString();
      storage.setItem(GUEST_CHILD_KEY, JSON.stringify(current));
    }

    // 2. Append to history list (keep up to 20 recent sessions)
    const history = getGuestHistory();
    history.unshift(analysis);
    const trimmed = history.slice(0, 20);
    storage.setItem(GUEST_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save guest game results to localStorage:', err);
  }
}

/**
 * Retrieves the temporary guest session history.
 */
export function getGuestHistory(): GuestSessionAnalysis[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(GUEST_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Clears guest session and local history.
 */
export function clearGuestData(): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(GUEST_CHILD_KEY);
  storage.removeItem(GUEST_HISTORY_KEY);
}
