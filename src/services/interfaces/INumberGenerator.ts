/**
 * Number Generator Interface
 *
 * Abstracts number generation for practice levels.
 * Uses declarative patterns from level config.
 */

import type { GenerationPattern } from '../../types/levels';

export interface INumberGenerator {
  /**
   * Generate a number for a specific level
   */
  generateForLevel(levelId: string): number;

  /**
   * Generate a number from a specific pattern
   */
  generate(pattern: GenerationPattern): number;

  /**
   * Generate a batch of numbers for a level
   */
  generateBatch(levelId: string, count: number): number[];

  /**
   * Clear recent number history (call when changing levels)
   */
  clearHistory(): void;
}
