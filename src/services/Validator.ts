// Answer validation with multi-tier matching

import type { ValidationResult, Language } from '../types';
import { NumberConverter } from './NumberConverter';
import { normalizeText, levenshteinDistance } from '../utils/text';

export class Validator {
  private converter: NumberConverter;

  constructor(converter: NumberConverter) {
    this.converter = converter;
  }

  /**
   * Validate user answer against correct answer
   */
  validate(
    userAnswer: string,
    correctAnswer: string,
    language: Language,
    originalNumber: number
  ): ValidationResult {
    // Normalize both answers
    const userNorm = normalizeText(userAnswer);
    const correctNorm = normalizeText(correctAnswer);

    // Extract number from user's answer
    const userNum = this._extractNumber(userAnswer, language);
    const userParsed = userNum !== null;

    // Strategy 1: Exact text match
    if (userNorm === correctNorm) {
      return {
        isCorrect: true,
        confidence: 1.0,
        method: 'exact',
        userAnswer,
        userNumber: userNum,
        userParsed,
        correctAnswer,
        correctNumber: originalNumber
      };
    }

    // Strategy 2: Numeric match (most important!)
    if (userParsed && userNum === originalNumber) {
      return {
        isCorrect: true,
        confidence: 0.95,
        method: 'numeric',
        userAnswer,
        userNumber: userNum,
        userParsed,
        correctAnswer,
        correctNumber: originalNumber
      };
    }

    // Strategy 3: Fuzzy string matching (for pronunciation variations)
    const similarity = this._calculateSimilarity(userNorm, correctNorm);
    const threshold = 0.80;

    if (similarity >= threshold) {
      return {
        isCorrect: true,
        confidence: similarity,
        method: 'fuzzy',
        userAnswer,
        userNumber: userNum,
        userParsed,
        correctAnswer,
        correctNumber: originalNumber
      };
    }

    // Strategy 4: Japanese variations
    if (language === 'ja') {
      const variations = this._getJapaneseVariations(correctNorm);
      for (const variation of variations) {
        const varSimilarity = this._calculateSimilarity(userNorm, variation);
        if (varSimilarity >= threshold) {
          return {
            isCorrect: true,
            confidence: varSimilarity,
            method: 'variant',
            userAnswer,
            userNumber: userNum,
            userParsed,
            correctAnswer,
            correctNumber: originalNumber
          };
        }
      }
    }

    // Failed all tests
    return {
      isCorrect: false,
      confidence: similarity,
      method: 'rejected',
      userAnswer,
      userNumber: userNum,
      userParsed,
      correctAnswer,
      correctNumber: originalNumber
    };
  }

  /**
   * Extract number from text
   */
  private _extractNumber(text: string, language: Language): number | null {
    try {
      // First check if the text is just digits (e.g., "5402")
      const normalized = text.trim().replace(/[,\s]/g, '');
      if (/^\d+$/.test(normalized)) {
        return parseInt(normalized, 10);
      }

      // Try parsing as Japanese or English text
      if (language === 'ja') {
        return this.converter.japaneseToNumber(text);
      } else {
        return this.converter.englishToNumber(text);
      }
    } catch {
      return null;
    }
  }

  /**
   * Calculate similarity between two strings
   */
  private _calculateSimilarity(str1: string, str2: string): number {
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1.0;
    return 1 - (distance / maxLength);
  }

  /**
   * Get Japanese text variations
   */
  private _getJapaneseVariations(text: string): string[] {
    const variations = [
      text,
      text.replace(/\s+/g, ''),
      text.replace(/\s+/g, ' ')
    ];
    return [...new Set(variations)];
  }
}
