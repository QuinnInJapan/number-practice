/**
 * Progress Service Interface
 *
 * Abstracts progress persistence operations.
 * Currently implemented with localStorage, can be swapped for API.
 */

import type { PracticeMode } from '../../types';
import type { UserProgress, ModeProgress } from '../../types/levels';

export interface IProgressService {
  /**
   * Get progress for a specific mode
   */
  getProgress(mode: PracticeMode): UserProgress;

  /**
   * Get progress for all modes
   */
  getAllProgress(): ModeProgress;

  /**
   * Save progress for a specific mode
   */
  saveProgress(mode: PracticeMode, progress: UserProgress): void;

  /**
   * Record an attempt result for a level
   */
  recordAttempt(mode: PracticeMode, levelId: string, correct: boolean, sessionId?: string): UserProgress;

  /**
   * Set the current level for a mode
   */
  setCurrentLevel(mode: PracticeMode, levelId: string): void;

  /**
   * Reset progress for a specific mode
   */
  resetProgress(mode: PracticeMode): void;

  /**
   * Reset all progress
   */
  resetAllProgress(): void;
}
