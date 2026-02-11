import { describe, it, expect, beforeEach } from 'vitest';
import { NumberGenerator } from './NumberGenerator';
import { LEVEL_CONFIGS } from '../config/levels';

describe('NumberGenerator', () => {
  let generator: NumberGenerator;

  beforeEach(() => {
    generator = new NumberGenerator();
    generator.clearHistory();
  });

  describe('generateForLevel', () => {
    it('throws error for unknown level', () => {
      expect(() => generator.generateForLevel('unknown')).toThrow('No problems defined for level');
    });

    it('generates valid numbers for each level', () => {
      for (const level of LEVEL_CONFIGS) {
        const number = generator.generateForLevel(level.id);
        expect(typeof number).toBe('number');
        expect(number).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('anchors level (fixed-set pattern)', () => {
    const anchors = [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];

    it('generates only anchor values', () => {
      for (let i = 0; i < 50; i++) {
        const number = generator.generateForLevel('anchors');
        expect(anchors).toContain(number);
      }
    });

    it('generates variety of anchors', () => {
      const seen = new Set<number>();
      for (let i = 0; i < 100; i++) {
        seen.add(generator.generateForLevel('anchors'));
      }
      // Should see at least 4 different anchors in 100 tries
      expect(seen.size).toBeGreaterThanOrEqual(4);
    });
  });

  describe('multipliers level (single-multiplier pattern)', () => {
    const bases = [1000, 10000, 100000, 1000000, 10000000, 100000000];

    it('generates single-digit multiplied anchors', () => {
      for (let i = 0; i < 50; i++) {
        const number = generator.generateForLevel('multipliers');
        // Should be divisible by one of the bases
        const isValid = bases.some(base => number % base === 0 && number / base >= 2 && number / base <= 9);
        expect(isValid).toBe(true);
      }
    });
  });

  describe('two-figures level (significant-figures pattern)', () => {
    it('generates numbers in valid range with trailing zeros', () => {
      for (let i = 0; i < 50; i++) {
        const number = generator.generateForLevel('two-figures');
        // Config: figureCount=2, minMagnitude=3, maxMagnitude=9
        // So: 3-9 digit numbers with 2 significant figures
        // Min: 100 (10 * 10^1), Max: 9.9 billion
        expect(number).toBeGreaterThanOrEqual(100);
        expect(number).toBeLessThanOrEqual(9900000000);
        // Should end in at least one zero (trailing zeros from magnitude > figureCount)
        // Note: when sigFigs=10,20,etc the number could end with more zeros
        const numStr = number.toString();
        expect(numStr.endsWith('0')).toBe(true);
      }
    });
  });

  describe('crossing level (crossing pattern)', () => {
    it('generates numbers with 億 and 万 components', () => {
      for (let i = 0; i < 50; i++) {
        const number = generator.generateForLevel('crossing');
        // Should have an 億 component (>= 100,000,000)
        expect(number).toBeGreaterThanOrEqual(100000000);
        // Should have a 万 component (remainder when dividing by 100M should be divisible by 10K)
        const okuPart = Math.floor(number / 100000000);
        const remainder = number % 100000000;
        expect(okuPart).toBeGreaterThanOrEqual(1);
        expect(okuPart).toBeLessThanOrEqual(99); // Can be 1-9 or 10-99
        expect(remainder % 10000).toBe(0);
      }
    });
  });

  describe('full level (full-random pattern)', () => {
    it('generates numbers in valid range', () => {
      for (let i = 0; i < 50; i++) {
        const number = generator.generateForLevel('full');
        expect(number).toBeGreaterThanOrEqual(1000);
        expect(number).toBeLessThanOrEqual(9999999999);
      }
    });
  });

  describe('trillions level', () => {
    it('generates trillion-scale numbers', () => {
      for (let i = 0; i < 20; i++) {
        const number = generator.generateForLevel('trillions');
        expect(number).toBeGreaterThanOrEqual(1000000000000);
        expect(number).toBeLessThanOrEqual(999999999999999);
      }
    });
  });

  describe('history tracking', () => {
    it('avoids recent numbers', () => {
      const numbers: number[] = [];
      // Generate 20 numbers for a small fixed set - should get some variety
      for (let i = 0; i < 20; i++) {
        numbers.push(generator.generateForLevel('anchors'));
      }
      // With 7 possible values and 20 attempts, we should see repeats but
      // consecutive duplicates should be less common due to history avoidance
      let consecutiveDupes = 0;
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] === numbers[i - 1]) {
          consecutiveDupes++;
        }
      }
      // Allow some consecutive duplicates (can happen after history fills up)
      // but shouldn't be more than a few
      expect(consecutiveDupes).toBeLessThan(5);
    });

    it('clears history', () => {
      // Generate a number
      generator.generateForLevel('anchors');
      // Clear history
      generator.clearHistory();
      // Should be able to generate again without issue
      const number = generator.generateForLevel('anchors');
      expect(typeof number).toBe('number');
    });
  });

  describe('generateBatch', () => {
    it('generates the requested number of items', () => {
      const batch = generator.generateBatch('anchors', 5);
      expect(batch.length).toBe(5);
      for (const num of batch) {
        expect(typeof num).toBe('number');
      }
    });
  });
});
