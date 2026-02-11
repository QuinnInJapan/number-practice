/**
 * Local Level Service
 *
 * Implements ILevelService using local configuration.
 * Can be replaced with an API-based implementation later.
 */

import type { ILevelService, UnlockProgressDetail } from './interfaces/ILevelService';
import type { LevelConfig, UserProgress } from '../types/levels';
import { LEVEL_CONFIGS, getLevelConfigById, getNextLevelConfig } from '../config/levels';

export class LocalLevelService implements ILevelService {
  getLevels(): LevelConfig[] {
    return LEVEL_CONFIGS;
  }

  getLevelById(id: string): LevelConfig | undefined {
    return getLevelConfigById(id);
  }

  getNextLevel(currentId: string): LevelConfig | undefined {
    return getNextLevelConfig(currentId);
  }

  isUnlocked(levelId: string, progress: UserProgress): boolean {
    const level = this.getLevelById(levelId);
    if (!level) return false;

    // First level is always unlocked
    if (!level.unlock.requiredLevel) return true;

    // Check if required level has met the streak criteria
    const requiredProgress = progress.levels[level.unlock.requiredLevel];
    if (!requiredProgress) return false;

    return requiredProgress.currentStreak >= level.unlock.requiredStreak;
  }

  isMastered(levelId: string, progress: UserProgress): boolean {
    const nextLevel = this.getNextLevel(levelId);

    if (!nextLevel) {
      // Final level is "mastered" if 10+ streak achieved
      const levelProgress = progress.levels[levelId];
      if (!levelProgress) return false;
      return levelProgress.currentStreak >= 10;
    }

    return this.isUnlocked(nextLevel.id, progress);
  }

  getUnlockProgress(levelId: string, progress: UserProgress): number {
    const nextLevel = this.getNextLevel(levelId);
    if (!nextLevel) return 1;

    const levelProgress = progress.levels[levelId];
    if (!levelProgress || nextLevel.unlock.requiredStreak === 0) return 0;

    return Math.min(levelProgress.currentStreak / nextLevel.unlock.requiredStreak, 1);
  }

  getAccuracy(levelId: string, progress: UserProgress): number {
    const levelProgress = progress.levels[levelId];
    if (!levelProgress || levelProgress.attempts === 0) return 0;
    return levelProgress.correct / levelProgress.attempts;
  }

  getDetailedUnlockProgress(levelId: string, progress: UserProgress): UnlockProgressDetail | null {
    const nextLevel = this.getNextLevel(levelId);
    if (!nextLevel) return null;

    const levelProgress = progress.levels[levelId];
    const currentStreak = levelProgress?.currentStreak ?? 0;

    return {
      nextLevelId: nextLevel.id,
      nextLevelName: nextLevel.name,
      streak: {
        current: currentStreak,
        required: nextLevel.unlock.requiredStreak,
        met: currentStreak >= nextLevel.unlock.requiredStreak,
      },
    };
  }
}

// Singleton instance for convenience
export const localLevelService = new LocalLevelService();
