/**
 * Level Service Interface
 *
 * Abstracts level-related operations.
 * Currently implemented with local config, can be swapped for API.
 */

import type { LevelConfig, UserProgress } from '../../types/levels';

export interface UnlockProgressDetail {
  nextLevelId: string;
  nextLevelName: string;
  streak: { current: number; required: number; met: boolean };
}

export interface ILevelService {
  /**
   * Get all available levels
   */
  getLevels(): LevelConfig[];

  /**
   * Get a level by ID
   */
  getLevelById(id: string): LevelConfig | undefined;

  /**
   * Get the next level after a given level
   */
  getNextLevel(currentId: string): LevelConfig | undefined;

  /**
   * Check if a level is unlocked based on user progress
   */
  isUnlocked(levelId: string, progress: UserProgress): boolean;

  /**
   * Check if a level is mastered (met unlock criteria for next level)
   */
  isMastered(levelId: string, progress: UserProgress): boolean;

  /**
   * Get progress towards unlocking the next level (0-1)
   */
  getUnlockProgress(levelId: string, progress: UserProgress): number;

  /**
   * Get accuracy for a level (0-1)
   */
  getAccuracy(levelId: string, progress: UserProgress): number;

  /**
   * Get detailed progress toward unlocking the next level.
   * Returns null if there's no next level (final level).
   */
  getDetailedUnlockProgress(levelId: string, progress: UserProgress): UnlockProgressDetail | null;
}
