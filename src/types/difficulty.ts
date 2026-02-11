/**
 * Difficulty Level System - Backwards Compatibility Layer
 *
 * This file re-exports types from the new levels.ts for backwards compatibility.
 * New code should import directly from './levels' and '../config/levels'.
 *
 * @deprecated Use types/levels.ts and config/levels.ts instead
 */

// Re-export new types for backwards compatibility
export type {
  LevelConfig as DifficultyLevel,
  LevelProgress,
  UserProgress,
  UnlockCriteria,
  GenerationPattern,
} from './levels';

export { RECENT_WINDOW_SIZE } from './levels';

// Re-export level configs
export { LEVEL_CONFIGS as DIFFICULTY_LEVELS, getLevelConfigById as getLevelById, getNextLevelConfig as getNextLevel } from '../config/levels';

// Re-export utility functions from LocalLevelService for backwards compatibility
import { localLevelService } from '../services/LocalLevelService';
import { LEVEL_CONFIGS, DEFAULT_LEVEL_ID } from '../config/levels';
import type { UserProgress, LevelProgress } from './levels';

/**
 * @deprecated Use localLevelService.isUnlocked() instead
 */
export function isLevelUnlocked(levelId: string, progress: UserProgress): boolean {
  return localLevelService.isUnlocked(levelId, progress);
}

/**
 * @deprecated Use localLevelService.isMastered() instead
 */
export function isLevelMastered(levelId: string, progress: UserProgress): boolean {
  return localLevelService.isMastered(levelId, progress);
}

/**
 * @deprecated Use localLevelService.getAccuracy() instead
 */
export function getLevelAccuracy(levelId: string, progress: UserProgress): number {
  return localLevelService.getAccuracy(levelId, progress);
}

/**
 * @deprecated Use localLevelService.getUnlockProgress() instead
 */
export function getUnlockProgress(levelId: string, progress: UserProgress): number {
  return localLevelService.getUnlockProgress(levelId, progress);
}

/**
 * @deprecated Use localProgressService.getProgress() with createInitialProgress
 */
export function createInitialProgress(): UserProgress {
  const levels: Record<string, LevelProgress> = {};

  for (const level of LEVEL_CONFIGS) {
    levels[level.id] = {
      levelId: level.id,
      attempts: 0,
      correct: 0,
      currentStreak: 0,
      recentResults: [],
      unlockedAt: level.unlock.requiredLevel === null ? new Date().toISOString() : null,
      masteredAt: null,
    };
  }

  return {
    levels,
    currentLevelId: DEFAULT_LEVEL_ID,
    totals: {
      attempts: 0,
      correct: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
    attemptHistory: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * @deprecated Not used in new level system
 */
export function getRecentAccuracy(levelId: string, progress: UserProgress): number {
  const levelProgress = progress.levels[levelId];
  if (!levelProgress || levelProgress.recentResults.length === 0) return 0;
  const correct = levelProgress.recentResults.filter(r => r).length;
  return correct / levelProgress.recentResults.length;
}

// Legacy SessionStats type (different from new UserProgress)
export interface SessionStats {
  levelId: string;
  attempts: number;
  correct: number;
  accuracy: number;
  streak: number;
}
