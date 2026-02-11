/**
 * Pre-defined problem sets for each level.
 *
 * IMPORTANT: All numbers must be deterministic (no Math.random at load time)
 * so that audio files can be reliably matched.
 */

// Seeded random number generator for deterministic sampling
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

// Level 1: Anchors - all 7 powers of 10
const ANCHORS_NUMBERS = [
  1000,
  10000,
  100000,
  1000000,
  10000000,
  100000000,
  1000000000,
];

// Level 2: Multipliers - digits 2-9 × each base (48 total)
const MULTIPLIERS_NUMBERS: number[] = [];
const MULTIPLIER_BASES = [1000, 10000, 100000, 1000000, 10000000, 100000000];
for (let digit = 2; digit <= 9; digit++) {
  for (const base of MULTIPLIER_BASES) {
    MULTIPLIERS_NUMBERS.push(digit * base);
  }
}

// Level 3: Two Figures - ALL 630 numbers (10-99 × 7 magnitudes)
// No sampling needed - 630 is reasonable
const TWO_FIGURES_NUMBERS: number[] = [];
for (let magnitude = 3; magnitude <= 9; magnitude++) {
  const trailingZeros = magnitude - 2;
  const multiplier = Math.pow(10, trailingZeros);
  for (let sigFigs = 10; sigFigs <= 99; sigFigs++) {
    TWO_FIGURES_NUMBERS.push(sigFigs * multiplier);
  }
}

// Level 4: Three Figures - sample 400 with seeded RNG
const THREE_FIGURES_NUMBERS: number[] = [];
{
  const rng = seededRandom(42); // Fixed seed
  const candidates: number[] = [];
  for (let magnitude = 4; magnitude <= 9; magnitude++) {
    const trailingZeros = magnitude - 3;
    const multiplier = Math.pow(10, trailingZeros);
    for (let sigFigs = 100; sigFigs <= 999; sigFigs++) {
      candidates.push(sigFigs * multiplier);
    }
  }
  // Shuffle with seeded RNG
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  THREE_FIGURES_NUMBERS.push(...candidates.slice(0, 400));
}

// Level 5: Crossing Boundaries - 億 + 万 with gaps (all combinations)
const CROSSING_NUMBERS: number[] = [];
const OKU = 100000000; // 億
const MAN = 10000; // 万
for (let okuPart = 1; okuPart <= 9; okuPart++) {
  const manValues = [1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
  for (const manPart of manValues) {
    CROSSING_NUMBERS.push(okuPart * OKU + manPart * MAN);
  }
}
// Add some with larger 億 multipliers
for (let okuPart = 10; okuPart <= 99; okuPart += 10) {
  for (const manPart of [1, 10, 100, 1000]) {
    CROSSING_NUMBERS.push(okuPart * OKU + manPart * MAN);
  }
}

// Level 6: Full Complexity - sample 400 with seeded RNG
const FULL_NUMBERS: number[] = [];
{
  const rng = seededRandom(123); // Fixed seed
  const used = new Set<number>();
  while (FULL_NUMBERS.length < 400) {
    const digitCount = Math.floor(rng() * 7) + 4; // 4-10 digits
    const min = Math.pow(10, digitCount - 1);
    const max = Math.pow(10, digitCount) - 1;
    const num = Math.floor(rng() * (max - min + 1)) + min;
    if (!used.has(num) && num <= 9999999999) {
      used.add(num);
      FULL_NUMBERS.push(num);
    }
  }
}

// Level 7: Trillions - structured + seeded random fill
const CHO = 1000000000000; // 兆
const TRILLIONS_NUMBERS: number[] = [];
{
  // Anchor
  TRILLIONS_NUMBERS.push(CHO);
  // Single digit trillions
  for (let i = 2; i <= 9; i++) {
    TRILLIONS_NUMBERS.push(i * CHO);
  }
  // Two digit trillions
  for (let i = 10; i <= 99; i += 5) {
    TRILLIONS_NUMBERS.push(i * CHO);
  }
  // Trillions with billions
  for (let cho = 1; cho <= 5; cho++) {
    for (let oku = 1; oku <= 9; oku++) {
      TRILLIONS_NUMBERS.push(cho * CHO + oku * OKU);
    }
  }
  // Fill remaining with seeded random
  const rng = seededRandom(456); // Fixed seed
  const used = new Set(TRILLIONS_NUMBERS);
  while (TRILLIONS_NUMBERS.length < 400) {
    const num = Math.floor(rng() * (999 * CHO - CHO)) + CHO;
    if (!used.has(num)) {
      used.add(num);
      TRILLIONS_NUMBERS.push(num);
    }
  }
}

/**
 * All problem sets by level ID
 */
export const LEVEL_PROBLEMS: Record<string, number[]> = {
  'anchors': ANCHORS_NUMBERS,
  'multipliers': MULTIPLIERS_NUMBERS,
  'two-figures': TWO_FIGURES_NUMBERS,
  'three-figures': THREE_FIGURES_NUMBERS,
  'crossing': CROSSING_NUMBERS,
  'full': FULL_NUMBERS,
  'trillions': TRILLIONS_NUMBERS,
};

/**
 * Get all unique numbers across all levels (for audio generation)
 */
export function getAllNumbers(): number[] {
  const all = new Set<number>();
  for (const numbers of Object.values(LEVEL_PROBLEMS)) {
    for (const num of numbers) {
      all.add(num);
    }
  }
  return Array.from(all).sort((a, b) => a - b);
}

/**
 * Get problems for a specific level
 */
export function getProblemsForLevel(levelId: string): number[] {
  return LEVEL_PROBLEMS[levelId] || [];
}
