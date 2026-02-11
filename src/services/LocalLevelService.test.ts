import { describe, it, expect } from 'vitest';
import { LocalLevelService } from './LocalLevelService';
import type { UserProgress, LevelProgress } from '../types/levels';
import { LEVEL_CONFIGS } from '../config/levels';

describe('LocalLevelService', () => {
  const service = new LocalLevelService();

  const createProgress = (overrides: Partial<Record<string, Partial<LevelProgress>>> = {}): UserProgress => {
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
        ...overrides[level.id],
      };
    }
    return {
      levels,
      currentLevelId: 'anchors',
      totals: { attempts: 0, correct: 0, currentStreak: 0, bestStreak: 0 },
      attemptHistory: [],
      lastUpdated: new Date().toISOString(),
    };
  };

  describe('getLevels', () => {
    it('returns all levels', () => {
      const levels = service.getLevels();
      expect(levels.length).toBe(7);
      expect(levels[0].id).toBe('anchors');
      expect(levels[6].id).toBe('trillions');
    });
  });

  describe('getLevelById', () => {
    it('returns level for valid ID', () => {
      const level = service.getLevelById('multipliers');
      expect(level).toBeDefined();
      expect(level?.name).toBe('Multipliers');
    });

    it('returns undefined for invalid ID', () => {
      const level = service.getLevelById('nonexistent');
      expect(level).toBeUndefined();
    });
  });

  describe('getNextLevel', () => {
    it('returns next level for valid ID', () => {
      const next = service.getNextLevel('anchors');
      expect(next?.id).toBe('multipliers');
    });

    it('returns undefined for last level', () => {
      const next = service.getNextLevel('trillions');
      expect(next).toBeUndefined();
    });
  });

  describe('isUnlocked', () => {
    it('first level is always unlocked', () => {
      const progress = createProgress();
      expect(service.isUnlocked('anchors', progress)).toBe(true);
    });

    it('second level is locked with no progress', () => {
      const progress = createProgress();
      expect(service.isUnlocked('multipliers', progress)).toBe(false);
    });

    it('second level unlocks with 10 streak on anchors', () => {
      const progress = createProgress({
        anchors: {
          levelId: 'anchors',
          attempts: 12,
          correct: 10,
          currentStreak: 10,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      expect(service.isUnlocked('multipliers', progress)).toBe(true);
    });

    it('second level stays locked with streak below 10', () => {
      const progress = createProgress({
        anchors: {
          levelId: 'anchors',
          attempts: 20,
          correct: 18,
          currentStreak: 9,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      expect(service.isUnlocked('multipliers', progress)).toBe(false);
    });

    it('second level stays locked with zero streak despite high accuracy', () => {
      const progress = createProgress({
        anchors: {
          levelId: 'anchors',
          attempts: 100,
          correct: 95,
          currentStreak: 0,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      expect(service.isUnlocked('multipliers', progress)).toBe(false);
    });
  });

  describe('isMastered', () => {
    it('level is not mastered with no progress', () => {
      const progress = createProgress();
      expect(service.isMastered('anchors', progress)).toBe(false);
    });

    it('level is mastered when next level unlocks', () => {
      const progress = createProgress({
        anchors: {
          levelId: 'anchors',
          attempts: 10,
          correct: 10,
          currentStreak: 10,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      expect(service.isMastered('anchors', progress)).toBe(true);
    });

    it('final level needs 10+ streak to be mastered', () => {
      const progress = createProgress({
        trillions: {
          levelId: 'trillions',
          attempts: 20,
          correct: 16,
          currentStreak: 10,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      expect(service.isMastered('trillions', progress)).toBe(true);

      const progressNotEnough = createProgress({
        trillions: {
          levelId: 'trillions',
          attempts: 15,
          correct: 15,
          currentStreak: 9,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      expect(service.isMastered('trillions', progressNotEnough)).toBe(false);
    });
  });

  describe('getAccuracy', () => {
    it('returns 0 for no attempts', () => {
      const progress = createProgress();
      expect(service.getAccuracy('anchors', progress)).toBe(0);
    });

    it('calculates accuracy correctly', () => {
      const progress = createProgress({
        anchors: {
          levelId: 'anchors',
          attempts: 10,
          correct: 7,
          currentStreak: 0,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      expect(service.getAccuracy('anchors', progress)).toBe(0.7);
    });
  });

  describe('getUnlockProgress', () => {
    it('returns 0 for no progress', () => {
      const progress = createProgress();
      expect(service.getUnlockProgress('anchors', progress)).toBe(0);
    });

    it('returns 1 for last level', () => {
      const progress = createProgress();
      expect(service.getUnlockProgress('trillions', progress)).toBe(1);
    });

    it('calculates progress based on streak', () => {
      const progress = createProgress({
        anchors: {
          levelId: 'anchors',
          attempts: 15,
          correct: 12,
          currentStreak: 7,
          recentResults: [],
          unlockedAt: new Date().toISOString(),
          masteredAt: null,
        },
      });
      // 7/10 = 0.7
      expect(service.getUnlockProgress('anchors', progress)).toBe(0.7);
    });
  });
});
