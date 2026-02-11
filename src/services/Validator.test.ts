import { describe, it, expect } from 'vitest';
import { Validator } from './Validator';
import { NumberConverter } from './NumberConverter';

describe('Validator', () => {
  const converter = new NumberConverter();
  const validator = new Validator(converter);

  describe('English answers (Japanese to English mode)', () => {
    describe('correct answers', () => {
      it('accepts exact match', () => {
        const result = validator.validate(
          'two thousand five hundred sixty',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(true);
        expect(result.method).toBe('exact');
        expect(result.confidence).toBe(1.0);
      });

      it('accepts numeric match with digits', () => {
        const result = validator.validate(
          '2560',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(true);
        expect(result.method).toBe('numeric');
      });

      it('accepts numeric match with different wording', () => {
        const result = validator.validate(
          'twenty-five hundred sixty',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        // This should still match numerically if parsed correctly
        // or fuzzy match if similar enough
        expect(result.isCorrect).toBe(true);
      });

      it('accepts fuzzy match for slight variations', () => {
        const result = validator.validate(
          'two thousand five hundred and sixty',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(true);
      });

      it('accepts case-insensitive matches', () => {
        const result = validator.validate(
          'TWO THOUSAND FIVE HUNDRED SIXTY',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(true);
      });
    });

    describe('incorrect answers', () => {
      it('rejects wrong number', () => {
        const result = validator.validate(
          'two thousand',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(false);
        expect(result.method).toBe('rejected');
      });

      it('rejects completely different answer', () => {
        const result = validator.validate(
          'one hundred',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(false);
        expect(result.userNumber).toBe(100);
        expect(result.correctNumber).toBe(2560);
      });

      it('provides parsed user number when wrong', () => {
        const result = validator.validate(
          'five thousand',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(false);
        expect(result.userParsed).toBe(true);
        expect(result.userNumber).toBe(5000);
      });

      it('handles unparseable answers', () => {
        const result = validator.validate(
          'blah blah blah',
          'two thousand five hundred sixty',
          'en',
          2560
        );
        expect(result.isCorrect).toBe(false);
        expect(result.userParsed).toBe(false);
        expect(result.userNumber).toBe(null);
      });
    });
  });

  describe('Japanese answers (English to Japanese mode)', () => {
    describe('correct answers', () => {
      it('accepts exact hiragana match', () => {
        const result = validator.validate(
          'にせんごひゃくろくじゅう',
          'にせんごひゃくろくじゅう',
          'ja',
          2560
        );
        expect(result.isCorrect).toBe(true);
        expect(result.method).toBe('exact');
      });

      it('accepts mixed format (digits + kanji)', () => {
        const result = validator.validate(
          '300万',
          'さんびゃくまん',
          'ja',
          3000000
        );
        expect(result.isCorrect).toBe(true);
        expect(result.method).toBe('numeric');
        expect(result.userNumber).toBe(3000000);
      });

      it('accepts digits only', () => {
        const result = validator.validate(
          '2560',
          'にせんごひゃくろくじゅう',
          'ja',
          2560
        );
        expect(result.isCorrect).toBe(true);
        expect(result.method).toBe('numeric');
      });

      it('accepts complex mixed format', () => {
        const result = validator.validate(
          '1億2345万6789',
          'いちおく、にせんさんびゃくよんじゅうごまん、ろくせんななひゃくはちじゅうきゅう',
          'ja',
          123456789
        );
        expect(result.isCorrect).toBe(true);
        expect(result.userNumber).toBe(123456789);
      });
    });

    describe('incorrect answers', () => {
      it('rejects wrong number', () => {
        const result = validator.validate(
          '100万',
          'さんびゃくまん',
          'ja',
          3000000
        );
        expect(result.isCorrect).toBe(false);
        expect(result.userNumber).toBe(1000000);
        expect(result.correctNumber).toBe(3000000);
      });

      it('rejects gibberish', () => {
        const result = validator.validate(
          'あいうえお',
          'にせんごひゃくろくじゅう',
          'ja',
          2560
        );
        expect(result.isCorrect).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    it('handles empty strings', () => {
      const result = validator.validate(
        '',
        'one thousand',
        'en',
        1000
      );
      expect(result.isCorrect).toBe(false);
    });

    it('handles whitespace-only input', () => {
      const result = validator.validate(
        '   ',
        'one thousand',
        'en',
        1000
      );
      expect(result.isCorrect).toBe(false);
    });

    it('handles numbers with commas in input', () => {
      const result = validator.validate(
        '2,560',
        'two thousand five hundred sixty',
        'en',
        2560
      );
      expect(result.isCorrect).toBe(true);
    });

    it('handles small numbers', () => {
      const result = validator.validate(
        'five',
        'five',
        'en',
        5
      );
      expect(result.isCorrect).toBe(true);
    });

    it('handles large numbers', () => {
      const result = validator.validate(
        '1000000000000',
        'one trillion',
        'en',
        1000000000000
      );
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('validation result structure', () => {
    it('returns all required fields', () => {
      const result = validator.validate(
        'one hundred',
        'two hundred',
        'en',
        200
      );

      expect(result).toHaveProperty('isCorrect');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('method');
      expect(result).toHaveProperty('userAnswer');
      expect(result).toHaveProperty('userNumber');
      expect(result).toHaveProperty('userParsed');
      expect(result).toHaveProperty('correctAnswer');
      expect(result).toHaveProperty('correctNumber');
    });

    it('includes original user answer', () => {
      const result = validator.validate(
        'ONE HUNDRED',
        'two hundred',
        'en',
        200
      );
      expect(result.userAnswer).toBe('ONE HUNDRED');
    });

    it('includes correct number', () => {
      const result = validator.validate(
        'anything',
        'two hundred',
        'en',
        200
      );
      expect(result.correctNumber).toBe(200);
    });
  });
});
