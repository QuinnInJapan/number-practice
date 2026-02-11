/**
 * Progress Tracker Service
 *
 * Manages user progress across difficulty levels with localStorage persistence.
 * Handles recording results, checking unlock status, and tracking streaks.
 */

import {
  type UserProgress,
  type LevelProgress,
  type SessionStats,
  createInitialProgress,
  isLevelUnlocked,
  isLevelMastered,
  getNextLevel,
  RECENT_WINDOW_SIZE,
  DIFFICULTY_LEVELS,
} from '../types/difficulty';

const STORAGE_KEY = 'number-practice-progress';

export class ProgressTracker {
  private progress: UserProgress;
  private sessionStats: SessionStats;

  constructor() {
    this.progress = this.loadProgress();
    this.sessionStats = this.createSessionStats(this.progress.currentLevelId);
  }

  /**
   * Load progress from localStorage or create initial progress
   */
  private loadProgress(): UserProgress {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProgress;
        // Migrate if needed (add any new levels)
        return this.migrateProgress(parsed);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return createInitialProgress();
  }

  /**
   * Migrate progress to include any new levels added after initial creation
   */
  private migrateProgress(progress: UserProgress): UserProgress {
    for (const level of DIFFICULTY_LEVELS) {
      if (!progress.levels[level.id]) {
        progress.levels[level.id] = {
          levelId: level.id,
          attempts: 0,
          correct: 0,
          currentStreak: 0,
          recentResults: [],
          unlockedAt: null,
          masteredAt: null,
        };
      }
    }
    return progress;
  }

  /**
   * Save progress to localStorage
   */
  private saveProgress(): void {
    try {
      this.progress.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  /**
   * Create session stats for a level
   */
  private createSessionStats(levelId: string): SessionStats {
    return {
      levelId,
      attempts: 0,
      correct: 0,
      accuracy: 0,
      streak: 0,
    };
  }

  /**
   * Record the result of a practice attempt
   */
  recordResult(levelId: string, isCorrect: boolean): void {
    // Update level progress
    const levelProgress = this.progress.levels[levelId];
    if (!levelProgress) return;

    levelProgress.attempts++;
    if (isCorrect) {
      levelProgress.correct++;
    }

    // Update recent results (rolling window)
    levelProgress.recentResults.push(isCorrect);
    if (levelProgress.recentResults.length > RECENT_WINDOW_SIZE) {
      levelProgress.recentResults.shift();
    }

    // Check if level is now mastered
    if (!levelProgress.masteredAt && isLevelMastered(levelId, this.progress)) {
      levelProgress.masteredAt = new Date().toISOString();

      // Unlock next level
      const nextLevel = getNextLevel(levelId);
      if (nextLevel) {
        const nextProgress = this.progress.levels[nextLevel.id];
        if (nextProgress && !nextProgress.unlockedAt) {
          nextProgress.unlockedAt = new Date().toISOString();
        }
      }
    }

    // Update totals
    this.progress.totals.attempts++;
    if (isCorrect) {
      this.progress.totals.correct++;
      this.progress.totals.currentStreak++;
      if (this.progress.totals.currentStreak > this.progress.totals.bestStreak) {
        this.progress.totals.bestStreak = this.progress.totals.currentStreak;
      }
    } else {
      this.progress.totals.currentStreak = 0;
    }

    // Update session stats
    this.sessionStats.attempts++;
    if (isCorrect) {
      this.sessionStats.correct++;
      this.sessionStats.streak++;
    } else {
      this.sessionStats.streak = 0;
    }
    this.sessionStats.accuracy = this.sessionStats.attempts > 0
      ? this.sessionStats.correct / this.sessionStats.attempts
      : 0;

    this.saveProgress();
  }

  /**
   * Get current user progress
   */
  getProgress(): UserProgress {
    return this.progress;
  }

  /**
   * Get progress for a specific level
   */
  getLevelProgress(levelId: string): LevelProgress | undefined {
    return this.progress.levels[levelId];
  }

  /**
   * Get current session stats
   */
  getSessionStats(): SessionStats {
    return this.sessionStats;
  }

  /**
   * Check if a level is unlocked
   */
  isUnlocked(levelId: string): boolean {
    return isLevelUnlocked(levelId, this.progress);
  }

  /**
   * Check if a level is mastered
   */
  isMastered(levelId: string): boolean {
    return isLevelMastered(levelId, this.progress);
  }

  /**
   * Get the current level ID
   */
  getCurrentLevelId(): string {
    return this.progress.currentLevelId;
  }

  /**
   * Set the current level (must be unlocked)
   */
  setCurrentLevel(levelId: string): boolean {
    if (!this.isUnlocked(levelId)) {
      return false;
    }

    this.progress.currentLevelId = levelId;
    this.sessionStats = this.createSessionStats(levelId);
    this.saveProgress();
    return true;
  }

  /**
   * Get all unlocked levels
   */
  getUnlockedLevels(): string[] {
    return DIFFICULTY_LEVELS
      .filter(level => this.isUnlocked(level.id))
      .map(level => level.id);
  }

  /**
   * Get the highest unlocked level
   */
  getHighestUnlockedLevel(): string {
    const unlocked = this.getUnlockedLevels();
    return unlocked[unlocked.length - 1] || 'foundation';
  }

  /**
   * Reset session stats (e.g., when starting a new session)
   */
  resetSessionStats(): void {
    this.sessionStats = this.createSessionStats(this.progress.currentLevelId);
  }

  /**
   * Reset all progress (for testing or user request)
   */
  resetAllProgress(): void {
    this.progress = createInitialProgress();
    this.sessionStats = this.createSessionStats('foundation');
    this.saveProgress();
  }

  /**
   * Get accuracy for a level
   */
  getLevelAccuracy(levelId: string): number {
    const levelProgress = this.progress.levels[levelId];
    if (!levelProgress || levelProgress.attempts === 0) return 0;
    return levelProgress.correct / levelProgress.attempts;
  }

  /**
   * Get progress towards unlocking the next level (0-1)
   */
  getProgressToNextLevel(levelId: string): { attempts: number; accuracy: number; overall: number } {
    const nextLevel = getNextLevel(levelId);
    if (!nextLevel) {
      return { attempts: 1, accuracy: 1, overall: 1 };
    }

    const levelProgress = this.progress.levels[levelId];
    if (!levelProgress) {
      return { attempts: 0, accuracy: 0, overall: 0 };
    }

    const attemptProgress = Math.min(
      levelProgress.attempts / (nextLevel.unlock.requiredStreak || 10),
      1
    );

    const accuracy = this.getLevelAccuracy(levelId);
    const accuracyProgress = Math.min(
      accuracy / 0.8,
      1
    );

    return {
      attempts: attemptProgress,
      accuracy: accuracyProgress,
      overall: Math.min(attemptProgress, accuracyProgress),
    };
  }

  /**
   * Export progress as JSON string (for backup)
   */
  exportProgress(): string {
    return JSON.stringify(this.progress, null, 2);
  }

  /**
   * Import progress from JSON string (for restore)
   */
  importProgress(json: string): boolean {
    try {
      const imported = JSON.parse(json) as UserProgress;
      this.progress = this.migrateProgress(imported);
      this.sessionStats = this.createSessionStats(this.progress.currentLevelId);
      this.saveProgress();
      return true;
    } catch (error) {
      console.error('Failed to import progress:', error);
      return false;
    }
  }
}

// Singleton instance
export const progressTracker = new ProgressTracker();
