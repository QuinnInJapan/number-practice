/**
 * Level Configuration
 *
 * Pure data configuration for difficulty levels.
 * No business logic - easily modifiable, could load from backend.
 */

import type { LevelConfig } from '../types/levels';

/**
 * All difficulty levels in order.
 *
 * Based on "anchor numbers" pedagogy:
 * 1. Start with powers of 10 (anchors)
 * 2. Add single-digit multipliers
 * 3. Build to 2, then 3 significant figures
 * 4. Practice crossing unit boundaries (億 + 万)
 * 5. Any number (full complexity)
 * 6. Trillions for advanced users
 */
export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    id: 'anchors',
    order: 1,
    name: 'Anchors',
    nameJa: '基準',
    description: 'Powers of 10: 1,000 to 1 billion',
    descriptionJa: '10の累乗: 千〜10億',
    concepts: ['千', '万', '億'],
    exampleNumbers: ['1,000', '100,000', '1,000,000'],
    unlock: {
      requiredLevel: null,
      requiredStreak: 0,
    },
    generationPattern: {
      type: 'fixed-set',
      values: [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000],
    },
  },
  {
    id: 'multipliers',
    order: 2,
    name: 'Multipliers',
    nameJa: '倍数',
    description: 'Single digit × power of 10',
    descriptionJa: '一桁 × 10の累乗',
    concepts: ['3万', '600万', '4億'],
    exampleNumbers: ['3,000', '50,000', '4,000,000'],
    unlock: {
      requiredLevel: 'anchors',
      requiredStreak: 10,
    },
    generationPattern: {
      type: 'single-multiplier',
      digitRange: [2, 9],
      bases: [1000, 10000, 100000, 1000000, 10000000, 100000000],
    },
  },
  {
    id: 'two-figures',
    order: 3,
    name: 'Two Figures',
    nameJa: '二桁',
    description: 'Two significant digits, trailing zeros',
    descriptionJa: '有効数字2桁、末尾にゼロ',
    concepts: ['12万', '35万'],
    exampleNumbers: ['12,000', '350,000', '67,000,000'],
    unlock: {
      requiredLevel: 'multipliers',
      requiredStreak: 10,
    },
    generationPattern: {
      type: 'significant-figures',
      figureCount: 2,
      minMagnitude: 3,
      maxMagnitude: 9,
    },
  },
  {
    id: 'three-figures',
    order: 4,
    name: 'Three Figures',
    nameJa: '三桁',
    description: 'Three significant digits, trailing zeros',
    descriptionJa: '有効数字3桁、末尾にゼロ',
    concepts: ['123万', '456万'],
    exampleNumbers: ['123,000', '456,000,000'],
    unlock: {
      requiredLevel: 'two-figures',
      requiredStreak: 10,
    },
    generationPattern: {
      type: 'significant-figures',
      figureCount: 3,
      minMagnitude: 3,
      maxMagnitude: 9,
    },
  },
  {
    id: 'crossing',
    order: 5,
    name: 'Mixed Units',
    nameJa: '単位跨ぎ',
    description: 'Numbers spanning 億 and 万 with gaps',
    descriptionJa: '億と万をまたぐ数字',
    concepts: ['1億50万', '2億300万'],
    exampleNumbers: ['1億50万', '3億200万'],
    unlock: {
      requiredLevel: 'three-figures',
      requiredStreak: 10,
    },
    generationPattern: {
      type: 'crossing',
      okuRange: [1, 9],
      manRange: [1, 9999],
      sparse: true,
    },
  },
  {
    id: 'full',
    order: 6,
    name: 'Any Number',
    nameJa: '自由',
    description: 'Any number up to billions',
    descriptionJa: '10億までのランダムな数字',
    concepts: ['All digits', 'No patterns'],
    exampleNumbers: ['1,234,567', '8,765,432,100'],
    unlock: {
      requiredLevel: 'crossing',
      requiredStreak: 10,
    },
    generationPattern: {
      type: 'full-random',
      min: 1000,
      max: 9999999999,
    },
  },
  {
    id: 'trillions',
    order: 7,
    name: 'Trillions',
    nameJa: '兆',
    description: 'Numbers with 兆 (trillions)',
    descriptionJa: '兆を含む数字',
    concepts: ['兆', 'Full range'],
    exampleNumbers: ['1兆', '5兆3000億'],
    unlock: {
      requiredLevel: 'full',
      requiredStreak: 10,
    },
    generationPattern: {
      type: 'full-random',
      min: 1000000000000,
      max: 999999999999999,
    },
  },
];

/**
 * Recording timeout per level (in milliseconds).
 * After this duration, speech recognition auto-stops.
 */
export const LEVEL_RECORDING_TIMEOUTS: Record<string, number> = {
  'anchors': 10_000,
  'multipliers': 10_000,
  'two-figures': 10_000,
  'three-figures': 10_000,
  'crossing': 15_000,
  'full': 15_000,
  'trillions': 15_000,
};
export const DEFAULT_RECORDING_TIMEOUT = 10_000;

/**
 * Default level ID for new users
 */
export const DEFAULT_LEVEL_ID = 'anchors';

/**
 * Get level config by ID (utility for quick lookups)
 */
export function getLevelConfigById(id: string): LevelConfig | undefined {
  return LEVEL_CONFIGS.find(level => level.id === id);
}

/**
 * Get the next level after a given level
 */
export function getNextLevelConfig(currentId: string): LevelConfig | undefined {
  const current = getLevelConfigById(currentId);
  if (!current) return undefined;
  return LEVEL_CONFIGS.find(level => level.order === current.order + 1);
}
