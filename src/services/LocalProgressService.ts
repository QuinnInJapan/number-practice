/**
 * Local Progress Service
 *
 * Implements IProgressService using localStorage.
 * Tracks progress separately for each practice mode (JP→EN and EN→JP).
 * Can be replaced with an API-based implementation later.
 */

import type { IProgressService } from './interfaces/IProgressService';
import type { PracticeMode } from '../types';
import type { UserProgress, ModeProgress, LevelProgress } from '../types/levels';
import { LEVEL_CONFIGS, DEFAULT_LEVEL_ID } from '../config/levels';
import { RECENT_WINDOW_SIZE } from '../types/levels';
import { localLevelService } from './LocalLevelService';

const STORAGE_KEY = 'number-practice-progress-v2';

/**
 * Create initial progress for a new mode
 */
function createInitialProgress(): UserProgress {
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
 * Create initial mode progress for both modes
 */
function createInitialModeProgress(): ModeProgress {
  return {
    'ja-to-en': createInitialProgress(),
    'en-to-ja': createInitialProgress(),
  };
}

export class LocalProgressService implements IProgressService {
  private modeProgress: ModeProgress;

  constructor() {
    this.modeProgress = this.loadProgress();
  }

  /**
   * Load progress from localStorage or create initial progress
   */
  private loadProgress(): ModeProgress {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ModeProgress;
        return this.migrateProgress(parsed);
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
    return createInitialModeProgress();
  }

  /**
   * Migrate progress to include any new levels added after initial creation
   */
  private migrateProgress(progress: ModeProgress): ModeProgress {
    const modes: PracticeMode[] = ['ja-to-en', 'en-to-ja'];

    for (const mode of modes) {
      if (!progress[mode]) {
        progress[mode] = createInitialProgress();
        continue;
      }

      // Add any missing levels
      for (const level of LEVEL_CONFIGS) {
        if (!progress[mode].levels[level.id]) {
          progress[mode].levels[level.id] = {
            levelId: level.id,
            attempts: 0,
            correct: 0,
            currentStreak: 0,
            recentResults: [],
            unlockedAt: null,
            masteredAt: null,
          };
        }
        // Migrate: add currentStreak if missing from old data
        if (progress[mode].levels[level.id].currentStreak === undefined) {
          progress[mode].levels[level.id].currentStreak = 0;
        }
      }

      // Remove any levels that no longer exist
      const validLevelIds = new Set(LEVEL_CONFIGS.map(l => l.id));
      for (const levelId of Object.keys(progress[mode].levels)) {
        if (!validLevelIds.has(levelId)) {
          delete progress[mode].levels[levelId];
        }
      }

      // Ensure currentLevelId is valid
      if (!validLevelIds.has(progress[mode].currentLevelId)) {
        progress[mode].currentLevelId = DEFAULT_LEVEL_ID;
      }

      // Migrate: add attemptHistory if missing
      if (!progress[mode].attemptHistory) {
        progress[mode].attemptHistory = [];
      }

      // Migrate: add sessionId to old attempt records
      for (const attempt of progress[mode].attemptHistory) {
        if (!attempt.sessionId) {
          const date = attempt.timestamp.slice(0, 10); // YYYY-MM-DD
          attempt.sessionId = `migrated-${date}`;
        }
      }
    }

    return progress;
  }

  /**
   * Save progress to localStorage
   */
  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.modeProgress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  getProgress(mode: PracticeMode): UserProgress {
    return this.modeProgress[mode];
  }

  getAllProgress(): ModeProgress {
    return this.modeProgress;
  }

  saveProgress(mode: PracticeMode, progress: UserProgress): void {
    progress.lastUpdated = new Date().toISOString();
    this.modeProgress[mode] = progress;
    this.save();
  }

  recordAttempt(mode: PracticeMode, levelId: string, correct: boolean, sessionId?: string): UserProgress {
    const progress = this.modeProgress[mode];
    const levelProgress = progress.levels[levelId];

    if (!levelProgress) {
      console.error(`Level ${levelId} not found in progress`);
      return progress;
    }

    // Update level progress
    levelProgress.attempts++;
    if (correct) {
      levelProgress.correct++;
      levelProgress.currentStreak++;
    } else {
      levelProgress.currentStreak = 0;
    }

    // Update recent results (rolling window)
    levelProgress.recentResults.push(correct);
    if (levelProgress.recentResults.length > RECENT_WINDOW_SIZE) {
      levelProgress.recentResults.shift();
    }

    // Check if level is now mastered
    if (!levelProgress.masteredAt && localLevelService.isMastered(levelId, progress)) {
      levelProgress.masteredAt = new Date().toISOString();

      // Unlock next level
      const nextLevel = localLevelService.getNextLevel(levelId);
      if (nextLevel) {
        const nextProgress = progress.levels[nextLevel.id];
        if (nextProgress && !nextProgress.unlockedAt) {
          nextProgress.unlockedAt = new Date().toISOString();
        }
      }
    }

    // Record individual attempt for heatmap
    progress.attemptHistory.push({
      timestamp: new Date().toISOString(),
      levelId,
      isCorrect: correct,
      sessionId: sessionId ?? `legacy-${Date.now()}`,
    });
    if (progress.attemptHistory.length > 365) {
      progress.attemptHistory.shift();
    }

    // Update totals
    progress.totals.attempts++;
    if (correct) {
      progress.totals.correct++;
      progress.totals.currentStreak++;
      if (progress.totals.currentStreak > progress.totals.bestStreak) {
        progress.totals.bestStreak = progress.totals.currentStreak;
      }
    } else {
      progress.totals.currentStreak = 0;
    }

    progress.lastUpdated = new Date().toISOString();
    this.save();

    return progress;
  }

  setCurrentLevel(mode: PracticeMode, levelId: string): void {
    const progress = this.modeProgress[mode];

    // Check if level is unlocked
    if (!localLevelService.isUnlocked(levelId, progress)) {
      console.warn(`Cannot set current level to locked level: ${levelId}`);
      return;
    }

    progress.currentLevelId = levelId;
    progress.lastUpdated = new Date().toISOString();
    this.save();
  }

  resetProgress(mode: PracticeMode): void {
    this.modeProgress[mode] = createInitialProgress();
    this.save();
  }

  resetAllProgress(): void {
    this.modeProgress = createInitialModeProgress();
    this.save();
  }
}

// Singleton instance for convenience
export const localProgressService = new LocalProgressService();
