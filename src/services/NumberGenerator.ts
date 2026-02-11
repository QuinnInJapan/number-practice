/**
 * Number Generator Service
 *
 * Picks random numbers from pre-defined problem sets for each level.
 * This ensures all generated numbers have corresponding audio files.
 */

import type { INumberGenerator } from './interfaces/INumberGenerator';
import type { GenerationPattern } from '../types/levels';
import { getProblemsForLevel } from '../config/problems';

export class NumberGenerator implements INumberGenerator {
  private recentNumbers: number[] = [];
  private readonly maxRecentSize = 20;

  /**
   * Generate a random number for a given difficulty level.
   * Picks from pre-defined problem set to ensure audio availability.
   */
  generateForLevel(levelId: string): number {
    const problems = getProblemsForLevel(levelId);
    if (problems.length === 0) {
      throw new Error(`No problems defined for level: ${levelId}`);
    }

    let number: number;
    let attempts = 0;

    // Try to pick a number not recently used
    do {
      const index = Math.floor(Math.random() * problems.length);
      number = problems[index];
      attempts++;
    } while (this.recentNumbers.includes(number) && attempts < 10);

    this.addToRecent(number);
    return number;
  }

  /**
   * Generate a number from a specific pattern.
   * Note: This bypasses the pre-defined sets and may generate numbers without audio.
   */
  generate(pattern: GenerationPattern): number {
    // For pattern-based generation (used by tests), generate dynamically
    let number: number;
    let attempts = 0;

    do {
      number = this.generateFromPattern(pattern);
      attempts++;
    } while (this.recentNumbers.includes(number) && attempts < 10);

    this.addToRecent(number);
    return number;
  }

  /**
   * Generate a batch of numbers for a level
   */
  generateBatch(levelId: string, count: number): number[] {
    const numbers: number[] = [];
    for (let i = 0; i < count; i++) {
      numbers.push(this.generateForLevel(levelId));
    }
    return numbers;
  }

  /**
   * Clear recent number history
   */
  clearHistory(): void {
    this.recentNumbers = [];
  }

  /**
   * Dispatch to pattern-specific generator (for testing/fallback)
   */
  private generateFromPattern(pattern: GenerationPattern): number {
    switch (pattern.type) {
      case 'fixed-set':
        return this.generateFixedSet(pattern.values);

      case 'single-multiplier':
        return this.generateSingleMultiplier(pattern.digitRange, pattern.bases);

      case 'significant-figures':
        return this.generateSignificantFigures(
          pattern.figureCount,
          pattern.minMagnitude,
          pattern.maxMagnitude
        );

      case 'crossing':
        return this.generateCrossing(
          pattern.okuRange,
          pattern.manRange,
          pattern.sparse
        );

      case 'full-random':
        return this.generateFullRandom(pattern.min, pattern.max);

      default:
        throw new Error(`Unknown pattern type: ${(pattern as GenerationPattern).type}`);
    }
  }

  private generateFixedSet(values: number[]): number {
    const index = Math.floor(Math.random() * values.length);
    return values[index];
  }

  private generateSingleMultiplier(
    digitRange: [number, number],
    bases: number[]
  ): number {
    const [minDigit, maxDigit] = digitRange;
    const digit = Math.floor(Math.random() * (maxDigit - minDigit + 1)) + minDigit;
    const base = bases[Math.floor(Math.random() * bases.length)];
    return digit * base;
  }

  private generateSignificantFigures(
    figureCount: number,
    minMagnitude: number,
    maxMagnitude: number
  ): number {
    const magnitude = Math.floor(Math.random() * (maxMagnitude - minMagnitude + 1)) + minMagnitude;
    const minSig = Math.pow(10, figureCount - 1);
    const maxSig = Math.pow(10, figureCount) - 1;
    const sigFigs = Math.floor(Math.random() * (maxSig - minSig + 1)) + minSig;
    const trailingZeros = magnitude - figureCount;
    if (trailingZeros < 0) {
      return sigFigs;
    }
    return sigFigs * Math.pow(10, trailingZeros);
  }

  private generateCrossing(
    okuRange: [number, number],
    manRange: [number, number],
    sparse: boolean
  ): number {
    const [minOku, maxOku] = okuRange;
    const [minMan, maxMan] = manRange;
    const okuPart = Math.floor(Math.random() * (maxOku - minOku + 1)) + minOku;

    let manPart: number;
    if (sparse) {
      const sparsity = Math.random();
      if (sparsity < 0.3) {
        manPart = Math.floor(Math.random() * 9) + 1;
      } else if (sparsity < 0.55) {
        manPart = Math.floor(Math.random() * 90) + 10;
      } else if (sparsity < 0.8) {
        manPart = Math.floor(Math.random() * 900) + 100;
      } else {
        manPart = Math.floor(Math.random() * 9000) + 1000;
      }
      manPart = Math.max(minMan, Math.min(maxMan, manPart));
    } else {
      manPart = Math.floor(Math.random() * (maxMan - minMan + 1)) + minMan;
    }

    return okuPart * 100000000 + manPart * 10000;
  }

  private generateFullRandom(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private addToRecent(number: number): void {
    this.recentNumbers.push(number);
    if (this.recentNumbers.length > this.maxRecentSize) {
      this.recentNumbers.shift();
    }
  }
}

// Singleton instance
export const numberGenerator = new NumberGenerator();
