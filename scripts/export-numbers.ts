/**
 * Export all numbers that need audio files.
 *
 * Usage: npx tsx scripts/export-numbers.ts
 *
 * Outputs:
 *   - scripts/numbers.json: All unique numbers with their levels
 *   - scripts/missing-audio.json: Numbers without audio files
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { LEVEL_PROBLEMS } from '../src/config/problems';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.join(__dirname, '../public/audio');
const OUTPUT_DIR = __dirname;

interface NumberInfo {
  number: number;
  levels: string[];
  hasEnglishAudio: boolean;
  hasJapaneseAudio: boolean;
}

function checkAudioExists(num: number, lang: 'en' | 'ja'): boolean {
  const ext = lang === 'ja' ? 'wav' : 'mp3';
  const filename = `${num}_${lang}.${ext}`;
  return fs.existsSync(path.join(AUDIO_DIR, filename));
}

function main() {
  console.log('Analyzing audio file requirements...\n');

  // Get all numbers and their levels
  const numberToLevels: Map<number, string[]> = new Map();

  for (const [levelId, numbers] of Object.entries(LEVEL_PROBLEMS)) {
    for (const num of numbers) {
      const existing = numberToLevels.get(num) || [];
      existing.push(levelId);
      numberToLevels.set(num, existing);
    }
  }

  // Build full info for each number
  const allInfo: NumberInfo[] = [];
  const missingEn: number[] = [];
  const missingJa: number[] = [];

  for (const [num, levels] of numberToLevels) {
    const hasEn = checkAudioExists(num, 'en');
    const hasJa = checkAudioExists(num, 'ja');

    allInfo.push({
      number: num,
      levels,
      hasEnglishAudio: hasEn,
      hasJapaneseAudio: hasJa,
    });

    if (!hasEn) missingEn.push(num);
    if (!hasJa) missingJa.push(num);
  }

  // Sort by number
  allInfo.sort((a, b) => a.number - b.number);
  missingEn.sort((a, b) => a - b);
  missingJa.sort((a, b) => a - b);

  // Summary per level
  console.log('Numbers per level:');
  for (const [levelId, numbers] of Object.entries(LEVEL_PROBLEMS)) {
    const missing = numbers.filter(n => !checkAudioExists(n, 'en') || !checkAudioExists(n, 'ja'));
    console.log(`  ${levelId}: ${numbers.length} total, ${missing.length} missing audio`);
  }

  console.log(`\nTotal unique numbers: ${allInfo.length}`);
  console.log(`Missing English audio: ${missingEn.length}`);
  console.log(`Missing Japanese audio: ${missingJa.length}`);

  // Write outputs
  const numbersOutput = {
    generatedAt: new Date().toISOString(),
    totalNumbers: allInfo.length,
    numbers: allInfo,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'numbers.json'),
    JSON.stringify(numbersOutput, null, 2)
  );

  const missingOutput = {
    generatedAt: new Date().toISOString(),
    missingEnglish: missingEn,
    missingJapanese: missingJa,
    missingBoth: missingEn.filter(n => missingJa.includes(n)),
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'missing-audio.json'),
    JSON.stringify(missingOutput, null, 2)
  );

  console.log(`\nOutputs written to:`);
  console.log(`  ${path.join(OUTPUT_DIR, 'numbers.json')}`);
  console.log(`  ${path.join(OUTPUT_DIR, 'missing-audio.json')}`);
}

main();
