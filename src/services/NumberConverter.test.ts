import { describe, it, expect } from 'vitest';
import { NumberConverter } from './NumberConverter';

describe('NumberConverter', () => {
  const converter = new NumberConverter();

  describe('toJapanese', () => {
    it('converts zero', () => {
      expect(converter.toJapanese(0)).toBe('ぜろ');
    });

    it('converts single digits', () => {
      expect(converter.toJapanese(1)).toBe('いち');
      expect(converter.toJapanese(5)).toBe('ご');
      expect(converter.toJapanese(9)).toBe('きゅう');
    });

    it('converts tens with euphony', () => {
      expect(converter.toJapanese(10)).toBe('じゅう');
      expect(converter.toJapanese(20)).toBe('にじゅう');
      expect(converter.toJapanese(99)).toBe('きゅうじゅうきゅう');
    });

    it('converts hundreds with euphonic changes', () => {
      expect(converter.toJapanese(100)).toBe('ひゃく');
      expect(converter.toJapanese(300)).toBe('さんびゃく');
      expect(converter.toJapanese(600)).toBe('ろくぴゃく');
      expect(converter.toJapanese(800)).toBe('はちぴゃく');
    });

    it('converts thousands with euphonic changes', () => {
      expect(converter.toJapanese(1000)).toBe('せん');
      expect(converter.toJapanese(3000)).toBe('さんぜん');
      expect(converter.toJapanese(8000)).toBe('はちせん');
    });

    it('converts 万 (ten thousands)', () => {
      expect(converter.toJapanese(10000)).toBe('いちまん');
      expect(converter.toJapanese(30000)).toBe('さんまん');
      expect(converter.toJapanese(100000)).toBe('じゅうまん');
    });

    it('converts 億 (hundred millions)', () => {
      expect(converter.toJapanese(100000000)).toBe('いちおく');
      expect(converter.toJapanese(500000000)).toBe('ごおく');
    });

    it('converts 兆 (trillions)', () => {
      expect(converter.toJapanese(1000000000000)).toBe('いちちょう');
    });

    it('converts complex numbers', () => {
      expect(converter.toJapanese(2560)).toBe('にせんごひゃくろくじゅう');
      expect(converter.toJapanese(12345)).toBe('いちまん、にせんさんびゃくよんじゅうご');
    });
  });

  describe('toEnglish', () => {
    it('converts zero', () => {
      expect(converter.toEnglish(0)).toBe('zero');
    });

    it('converts single digits', () => {
      expect(converter.toEnglish(1)).toBe('one');
      expect(converter.toEnglish(5)).toBe('five');
      expect(converter.toEnglish(9)).toBe('nine');
    });

    it('converts teens', () => {
      expect(converter.toEnglish(10)).toBe('ten');
      expect(converter.toEnglish(11)).toBe('eleven');
      expect(converter.toEnglish(15)).toBe('fifteen');
      expect(converter.toEnglish(19)).toBe('nineteen');
    });

    it('converts tens', () => {
      expect(converter.toEnglish(20)).toBe('twenty');
      expect(converter.toEnglish(21)).toBe('twenty-one');
      expect(converter.toEnglish(99)).toBe('ninety-nine');
    });

    it('converts hundreds', () => {
      expect(converter.toEnglish(100)).toBe('one hundred');
      expect(converter.toEnglish(123)).toBe('one hundred twenty-three');
      expect(converter.toEnglish(500)).toBe('five hundred');
    });

    it('converts thousands', () => {
      expect(converter.toEnglish(1000)).toBe('one thousand');
      expect(converter.toEnglish(2560)).toBe('two thousand five hundred sixty');
      expect(converter.toEnglish(12345)).toBe('twelve thousand three hundred forty-five');
    });

    it('converts millions', () => {
      expect(converter.toEnglish(1000000)).toBe('one million');
      expect(converter.toEnglish(3000000)).toBe('three million');
    });

    it('converts billions', () => {
      expect(converter.toEnglish(1000000000)).toBe('one billion');
    });

    it('converts complex numbers', () => {
      expect(converter.toEnglish(1234567)).toBe('one million two hundred thirty-four thousand five hundred sixty-seven');
    });
  });

  describe('formatJapaneseNumeric', () => {
    it('formats small numbers without units', () => {
      expect(converter.formatJapaneseNumeric(0)).toBe('0');
      expect(converter.formatJapaneseNumeric(999)).toBe('999');
      expect(converter.formatJapaneseNumeric(9999)).toBe('9999');
    });

    it('formats with 万', () => {
      expect(converter.formatJapaneseNumeric(10000)).toBe('1万');
      expect(converter.formatJapaneseNumeric(30000)).toBe('3万');
      expect(converter.formatJapaneseNumeric(12345)).toBe('1万2345');
      expect(converter.formatJapaneseNumeric(3000000)).toBe('300万');
    });

    it('formats with 億', () => {
      expect(converter.formatJapaneseNumeric(100000000)).toBe('1億');
      expect(converter.formatJapaneseNumeric(500000000)).toBe('5億');
      expect(converter.formatJapaneseNumeric(123456789)).toBe('1億2345万6789');
    });

    it('formats with 兆', () => {
      expect(converter.formatJapaneseNumeric(1000000000000)).toBe('1兆');
      expect(converter.formatJapaneseNumeric(5000000000000)).toBe('5兆');
    });
  });

  describe('formatEnglishNumeric', () => {
    it('formats numbers with commas', () => {
      expect(converter.formatEnglishNumeric(0)).toBe('0');
      expect(converter.formatEnglishNumeric(999)).toBe('999');
      expect(converter.formatEnglishNumeric(1000)).toBe('1,000');
      expect(converter.formatEnglishNumeric(1234567)).toBe('1,234,567');
    });
  });

  describe('japaneseToNumber', () => {
    it('parses hiragana numbers', () => {
      expect(converter.japaneseToNumber('ぜろ')).toBe(null); // zero returns null (no result > 0)
      expect(converter.japaneseToNumber('いち')).toBe(1);
      expect(converter.japaneseToNumber('じゅう')).toBe(10);
      expect(converter.japaneseToNumber('ひゃく')).toBe(100);
      expect(converter.japaneseToNumber('せん')).toBe(1000);
    });

    it('parses numbers with euphonic changes', () => {
      expect(converter.japaneseToNumber('さんびゃく')).toBe(300);
      expect(converter.japaneseToNumber('ろくぴゃく')).toBe(600);
      expect(converter.japaneseToNumber('さんぜん')).toBe(3000);
      expect(converter.japaneseToNumber('はちせん')).toBe(8000);
    });

    it('parses mixed format with Arabic digits and kanji', () => {
      expect(converter.japaneseToNumber('300万')).toBe(3000000);
      expect(converter.japaneseToNumber('1億')).toBe(100000000);
      expect(converter.japaneseToNumber('5兆')).toBe(5000000000000);
      expect(converter.japaneseToNumber('1億2345万6789')).toBe(123456789);
    });

    it('parses complex hiragana numbers', () => {
      expect(converter.japaneseToNumber('にせんごひゃくろくじゅう')).toBe(2560);
      expect(converter.japaneseToNumber('いちまんにせんさんびゃくよんじゅうご')).toBe(12345);
      expect(converter.japaneseToNumber('ごじゅうろく')).toBe(56);
      expect(converter.japaneseToNumber('ひゃくにじゅうさん')).toBe(123);
    });
  });

  describe('englishToNumber', () => {
    it('parses basic numbers', () => {
      expect(converter.englishToNumber('zero')).toBe(0);
      expect(converter.englishToNumber('one')).toBe(1);
      expect(converter.englishToNumber('ten')).toBe(10);
      expect(converter.englishToNumber('fifteen')).toBe(15);
    });

    it('parses compound numbers', () => {
      expect(converter.englishToNumber('twenty-one')).toBe(21);
      expect(converter.englishToNumber('ninety-nine')).toBe(99);
    });

    it('parses hundreds', () => {
      expect(converter.englishToNumber('one hundred')).toBe(100);
      expect(converter.englishToNumber('five hundred twenty-three')).toBe(523);
    });

    it('parses thousands', () => {
      expect(converter.englishToNumber('one thousand')).toBe(1000);
      expect(converter.englishToNumber('two thousand five hundred sixty')).toBe(2560);
    });

    it('parses millions and billions', () => {
      expect(converter.englishToNumber('one million')).toBe(1000000);
      expect(converter.englishToNumber('three million')).toBe(3000000);
      expect(converter.englishToNumber('one billion')).toBe(1000000000);
    });

    it('handles case insensitivity', () => {
      expect(converter.englishToNumber('ONE THOUSAND')).toBe(1000);
      expect(converter.englishToNumber('Two Hundred')).toBe(200);
    });

    it('handles mixed numeric and word tokens from speech recognition', () => {
      expect(converter.englishToNumber('100 million')).toBe(100000000);
      expect(converter.englishToNumber('50 thousand')).toBe(50000);
      expect(converter.englishToNumber('200 billion')).toBe(200000000000);
      expect(converter.englishToNumber('5 million')).toBe(5000000);
      expect(converter.englishToNumber('1 billion 200 million')).toBe(1200000000);
      expect(converter.englishToNumber('42 thousand')).toBe(42000);
    });
  });
});
