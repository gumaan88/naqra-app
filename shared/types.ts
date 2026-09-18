export type UserRole = 'parent' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
  last_login_at?: string;
}

export interface Child {
  id: string;
  user_id: string;
  display_name: string;
  age_or_birth_year?: number;
  gender_optional?: 'male' | 'female' | 'other';
  photo_url?: string;
  local_code?: string; // Short 2-4 digit pin for quick login
  current_level: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

export interface Word {
  id: string;
  text: string;              // e.g. "أب", "كتاب", "شمس"
  normalized_text: string;   // without tashkeel or tatweel
  category: string;          // e.g. "animals", "fruits", "objects", "family", "nature"
  difficulty_level: number;  // 1 to 5
  is_imageable: boolean;
  image_url?: string;        // Selected image vector or URL
  source?: 'curated' | 'ai' | 'manual' | 'bulk_import';
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  created_at: string;
  approved_at?: string;
}

export interface WordImage {
  id: string;
  word_id: string;
  image_data_or_url: string;
  variant_no: number;
  status: 'pending' | 'approved' | 'rejected';
  selected: boolean;
  created_at: string;
}

export type GameType = 'word_letters' | 'word_image';

export interface LetterCard {
  id: string;
  letter: string;
  originalIndex?: number; // if belongs to word, its index in word
  isDistractor: boolean;
  isUsed: boolean;
  status: 'idle' | 'correct' | 'error' | 'hint';
}

export interface WordImageOption {
  id: string;
  wordId: string;
  wordText: string;
  imageUrl: string;
  isCorrect: boolean;
  status: 'idle' | 'correct' | 'error' | 'hint';
}

export interface GameRoundResult {
  roundIndex: number;
  wordId: string;
  wordText: string;
  wordShownAt: number;
  firstTapAt: number | null;
  completedAt: number;
  activeSolveMs: number;
  viewToFirstTapMs: number;
  correctTaps: number;
  wrongTaps: number;
  hintCount: number;
  firstPass: boolean;
  points: number;
  errorLetters?: string[];
  eventJson?: string;
}

export interface ClientSyncBatch {
  clientBatchId: string;
  childId: string;
  gameType: GameType;
  startedAt: string;
  endedAt: string;
  activeMs: number;
  points: number;
  appVersion: string;
  rounds: GameRoundResult[];
}

export interface ChildAnalytics {
  child: Child;
  totalSessions: number;
  totalActiveTimeMinutes: number;
  totalWordsCompleted: number;
  totalPoints: number;
  accuracy: number;
  medianSolveMs: number;
  firstPassRate: number;
  totalHintsUsed: number;
  masteredWords: { id: string; text: string; exposures: number; accuracy: number; medianMs: number }[];
  needsReviewWords: { id: string; text: string; exposures: number; accuracy: number; hints: number }[];
  frequentErrorLetters: { letter: string; errorCount: number }[];
  levelProgress: { level: number; date: string }[];
}
