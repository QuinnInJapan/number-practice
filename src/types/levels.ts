/**
 * Level System Types
 *
 * Pure data types for the difficulty level system.
 * No business logic - easily serializable for future backend.
 */

/**
 * Unlock criteria for a level
 */
export interface UnlockCriteria {
  /** Previous level ID that must be completed (null for first level) */
  requiredLevel: string | null;
  /** Consecutive correct answers needed on required level */
  requiredStreak: number;
}

/**
 * Number generation patterns - declarative configuration
 */
export type GenerationPattern =
  | { type: 'fixed-set'; values: number[] }
  | { type: 'single-multiplier'; digitRange: [number, number]; bases: number[] }
  | { type: 'significant-figures'; figureCount: number; minMagnitude: number; maxMagnitude: number }
  | { type: 'crossing'; okuRange: [number, number]; manRange: [number, number]; sparse: boolean }
  | { type: 'full-random'; min: number; max: number };

/**
 * Level configuration - pure data, no logic
 */
export interface LevelConfig {
  id: string;
  order: number;
  name: string;
  nameJa: string;
  description: string;
  descriptionJa: string;
  concepts: string[];
  exampleNumbers: string[];
  unlock: UnlockCriteria;
  generationPattern: GenerationPattern;
}

/**
 * Progress for a single level
 */
export interface LevelProgress {
  levelId: string;
  attempts: number;
  correct: number;
  /** Current consecutive correct answers on this level */
  currentStreak: number;
  /** Rolling window of last N attempts for recent accuracy */
  recentResults: boolean[];
  /** When the level was first unlocked */
  unlockedAt: string | null;
  /** When the level was mastered (met unlock criteria for next) */
  masteredAt: string | null;
}

/**
 * Individual attempt record for history heatmap
 */
export interface AttemptRecord {
  timestamp: string;
  levelId: string;
  isCorrect: boolean;
  sessionId: string;
}

/**
 * User progress for a single mode
 */
export interface UserProgress {
  /** Progress for each level */
  levels: Record<string, LevelProgress>;
  /** Currently selected level */
  currentLevelId: string;
  /** Total stats across all levels */
  totals: {
    attempts: number;
    correct: number;
    currentStreak: number;
    bestStreak: number;
  };
  /** Individual attempt history for heatmap visualization */
  attemptHistory: AttemptRecord[];
  /** When progress was last updated */
  lastUpdated: string;
}

/**
 * Progress tracked per mode (JP→EN and EN→JP)
 */
export interface ModeProgress {
  'ja-to-en': UserProgress;
  'en-to-ja': UserProgress;
}

/** Size of rolling window for recent accuracy */
export const RECENT_WINDOW_SIZE = 10;
