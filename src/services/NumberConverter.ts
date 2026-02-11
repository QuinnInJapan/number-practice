// Number conversion between numbers and text (Japanese and English)

// Japanese digit names (hiragana)
const JAPANESE_DIGITS = ['ぜろ', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

// Japanese units
const JAPANESE_UNITS: Record<number, string> = {
  10: 'じゅう',
  100: 'ひゃく',
  1000: 'せん',
  10000: 'まん',
  100000000: 'おく',
  1000000000000: 'ちょう'
};

// English digit names
const ENGLISH_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const ENGLISH_TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const ENGLISH_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ENGLISH_GROUPS = ['', 'thousand', 'million', 'billion', 'trillion'];

export class NumberConverter {
  /**
   * Convert a number to Japanese text (hiragana)
   */
  toJapanese(num: number): string {
    if (num === 0) return JAPANESE_DIGITS[0];

    const parts: string[] = [];

    // Extract 兆 (trillions: 10^12)
    const cho = Math.floor(num / 1_000_000_000_000);
    if (cho > 0) {
      parts.push(this._convertJapaneseGroup(cho) + JAPANESE_UNITS[1000000000000]);
    }
    num %= 1_000_000_000_000;

    // Extract 億 (hundred millions: 10^8)
    const oku = Math.floor(num / 100_000_000);
    if (oku > 0) {
      parts.push(this._convertJapaneseGroup(oku) + JAPANESE_UNITS[100000000]);
    }
    num %= 100_000_000;

    // Extract 万 (ten thousands: 10^4)
    const man = Math.floor(num / 10_000);
    if (man > 0) {
      parts.push(this._convertJapaneseGroup(man) + JAPANESE_UNITS[10000]);
    }
    num %= 10_000;

    // Remaining (1-9999)
    if (num > 0) {
      parts.push(this._convertJapaneseGroup(num));
    }

    // Join with commas for natural pauses between major units
    return parts.join('、');
  }

  /**
   * Convert a group of 1-9999 to Japanese
   */
  private _convertJapaneseGroup(num: number): string {
    const parts: string[] = [];

    // Thousands (1000-9000)
    const thousands = Math.floor(num / 1000);
    if (thousands > 0) {
      if (thousands === 1) {
        parts.push(this._applyEuphony(JAPANESE_UNITS[1000], 1));
      } else {
        parts.push(JAPANESE_DIGITS[thousands] + this._applyEuphony(JAPANESE_UNITS[1000], thousands));
      }
    }
    num %= 1000;

    // Hundreds (100-900)
    const hundreds = Math.floor(num / 100);
    if (hundreds > 0) {
      if (hundreds === 1) {
        parts.push(this._applyEuphony(JAPANESE_UNITS[100], 1));
      } else {
        parts.push(JAPANESE_DIGITS[hundreds] + this._applyEuphony(JAPANESE_UNITS[100], hundreds));
      }
    }
    num %= 100;

    // Tens (10-90)
    const tens = Math.floor(num / 10);
    if (tens > 0) {
      if (tens === 1) {
        parts.push(JAPANESE_UNITS[10]);
      } else {
        parts.push(JAPANESE_DIGITS[tens] + JAPANESE_UNITS[10]);
      }
    }
    num %= 10;

    // Ones (1-9)
    if (num > 0) {
      parts.push(JAPANESE_DIGITS[num]);
    }

    return parts.join('');
  }

  /**
   * Apply euphonic changes to Japanese units
   */
  private _applyEuphony(unit: string, digit: number): string {
    if (unit === 'ひゃく') {
      if (digit === 3) return 'びゃく';
      if (digit === 6) return 'ぴゃく';
      if (digit === 8) return 'ぴゃく';
    }
    if (unit === 'せん') {
      if (digit === 3) return 'ぜん';
      if (digit === 8) return 'せん';
    }
    return unit;
  }

  /**
   * Convert a number to English text
   */
  toEnglish(num: number): string {
    if (num === 0) return 'zero';

    const parts: string[] = [];
    let groupIndex = 0;

    while (num > 0) {
      const group = num % 1000;
      if (group > 0) {
        const groupText = this._convertEnglishGroup(group);
        if (ENGLISH_GROUPS[groupIndex]) {
          parts.unshift(groupText + ' ' + ENGLISH_GROUPS[groupIndex]);
        } else {
          parts.unshift(groupText);
        }
      }
      num = Math.floor(num / 1000);
      groupIndex++;
    }

    return parts.join(' ');
  }

  /**
   * Convert a group of 1-999 to English
   */
  private _convertEnglishGroup(num: number): string {
    const parts: string[] = [];

    // Hundreds
    const hundreds = Math.floor(num / 100);
    if (hundreds > 0) {
      parts.push(ENGLISH_ONES[hundreds] + ' hundred');
    }
    num %= 100;

    // Tens and ones
    if (num >= 20) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      if (ones > 0) {
        parts.push(ENGLISH_TENS[tens] + '-' + ENGLISH_ONES[ones]);
      } else {
        parts.push(ENGLISH_TENS[tens]);
      }
    } else if (num >= 10) {
      parts.push(ENGLISH_TEENS[num - 10]);
    } else if (num > 0) {
      parts.push(ENGLISH_ONES[num]);
    }

    return parts.join(' ');
  }

  /**
   * Format number with Japanese grouping (万, 億, 兆)
   */
  formatJapaneseNumeric(num: number): string {
    const parts: string[] = [];

    const cho = Math.floor(num / 1_000_000_000_000);
    if (cho > 0) parts.push(cho + '兆');
    num %= 1_000_000_000_000;

    const oku = Math.floor(num / 100_000_000);
    if (oku > 0) parts.push(oku + '億');
    num %= 100_000_000;

    const man = Math.floor(num / 10_000);
    if (man > 0) parts.push(man + '万');
    num %= 10_000;

    if (num > 0 || parts.length === 0) {
      parts.push(num.toString());
    }

    return parts.join('');
  }

  /**
   * Format number with Western grouping (commas)
   */
  formatEnglishNumeric(num: number): string {
    return num.toLocaleString('en-US');
  }

  /**
   * Parse Japanese text to number
   * Handles: hiragana (さんびゃくまん), kanji units (300万), mixed formats
   */
  japaneseToNumber(text: string): number | null {
    try {
      // Remove commas and spaces
      text = text.replace(/、/g, '').replace(/\s/g, '').trim();

      // First, try to parse mixed format like "300万" or "3億5000万"
      const mixedResult = this._parseMixedJapanese(text);
      if (mixedResult !== null) {
        return mixedResult;
      }

      // Parse pure hiragana using state machine
      return this._parseHiraganaNumber(text);
    } catch {
      return null;
    }
  }

  /**
   * Parse pure hiragana number text
   * Uses a state machine: pendingDigit waits for a unit, groupValue accumulates within 万/億/兆
   */
  private _parseHiraganaNumber(text: string): number | null {
    // Build digit lookup
    const digitMap: Record<string, number> = {};
    JAPANESE_DIGITS.forEach((d, i) => { digitMap[d] = i; });
    digitMap['し'] = 4;
    digitMap['しち'] = 7;
    digitMap['く'] = 9;

    // Sort by length descending to match longer readings first (e.g., 'しち' before 'し')
    const sortedDigits = Object.entries(digitMap).sort((a, b) => b[0].length - a[0].length);

    let result = 0;       // Final result (accumulates after 万/億/兆)
    let groupValue = 0;   // Value within current group (below 万)
    let pendingDigit = 0; // Digit waiting for a unit

    let i = 0;
    while (i < text.length) {
      let matched = false;

      // Check for major units (兆, 億, 万) - these finalize the current group
      if (text.substring(i, i + 3) === 'ちょう') {
        groupValue += pendingDigit;
        result += (groupValue || 1) * 1_000_000_000_000;
        groupValue = 0;
        pendingDigit = 0;
        i += 3;
        matched = true;
      }
      else if (text.substring(i, i + 2) === 'おく') {
        groupValue += pendingDigit;
        result += (groupValue || 1) * 100_000_000;
        groupValue = 0;
        pendingDigit = 0;
        i += 2;
        matched = true;
      }
      else if (text.substring(i, i + 2) === 'まん') {
        groupValue += pendingDigit;
        result += (groupValue || 1) * 10_000;
        groupValue = 0;
        pendingDigit = 0;
        i += 2;
        matched = true;
      }
      // Check for minor units (千, 百, 十) - these multiply the pending digit
      else if (text.substring(i, i + 2) === 'せん' || text.substring(i, i + 2) === 'ぜん') {
        groupValue += (pendingDigit || 1) * 1000;
        pendingDigit = 0;
        i += 2;
        matched = true;
      }
      else if (text.substring(i, i + 3) === 'ひゃく' ||
               text.substring(i, i + 3) === 'びゃく' ||
               text.substring(i, i + 3) === 'ぴゃく') {
        groupValue += (pendingDigit || 1) * 100;
        pendingDigit = 0;
        i += 3;
        matched = true;
      }
      else if (text.substring(i, i + 3) === 'じゅう') {
        groupValue += (pendingDigit || 1) * 10;
        pendingDigit = 0;
        i += 3;
        matched = true;
      }

      if (!matched) {
        // Check for digits
        for (const [reading, value] of sortedDigits) {
          if (text.substring(i, i + reading.length) === reading) {
            // Add any pending digit that wasn't followed by a unit
            groupValue += pendingDigit;
            pendingDigit = value;
            i += reading.length;
            matched = true;
            break;
          }
        }
      }

      if (!matched) {
        i++;
      }
    }

    // Add remaining values
    groupValue += pendingDigit;
    result += groupValue;

    return result > 0 ? result : null;
  }

  /**
   * Parse mixed Japanese format like "300万", "3億5000万", "1兆2000億"
   */
  private _parseMixedJapanese(text: string): number | null {
    // Check if text contains any kanji units or Arabic digits
    if (!/[0-9万億兆]/.test(text)) {
      return null;
    }

    let result = 0;
    let remaining = text;

    // Parse 兆 (trillion)
    const choMatch = remaining.match(/(\d+)兆/);
    if (choMatch) {
      result += parseInt(choMatch[1], 10) * 1_000_000_000_000;
      remaining = remaining.replace(/\d+兆/, '');
    }

    // Parse 億 (hundred million)
    const okuMatch = remaining.match(/(\d+)億/);
    if (okuMatch) {
      result += parseInt(okuMatch[1], 10) * 100_000_000;
      remaining = remaining.replace(/\d+億/, '');
    }

    // Parse 万 (ten thousand)
    const manMatch = remaining.match(/(\d+)万/);
    if (manMatch) {
      result += parseInt(manMatch[1], 10) * 10_000;
      remaining = remaining.replace(/\d+万/, '');
    }

    // Parse remaining digits (thousands and below)
    const digitMatch = remaining.match(/(\d+)/);
    if (digitMatch) {
      result += parseInt(digitMatch[1], 10);
    }

    return result > 0 ? result : null;
  }

  /**
   * Parse English text to number
   */
  englishToNumber(text: string): number | null {
    try {
      text = text.toLowerCase().trim();
      if (text === 'zero') return 0;

      const words = text.split(/[\s-]+/);
      let result = 0;
      let current = 0;

      const ones: Record<string, number> = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9
      };

      const teens: Record<string, number> = {
        'ten': 10, 'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14,
        'fifteen': 15, 'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19
      };

      const tens: Record<string, number> = {
        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
      };

      for (const word of words) {
        // Handle numeric tokens like "100" from speech recognition
        if (/^\d+$/.test(word)) {
          current += parseInt(word, 10);
        } else if (ones[word]) {
          current += ones[word];
        } else if (teens[word]) {
          current += teens[word];
        } else if (tens[word]) {
          current += tens[word];
        } else if (word === 'hundred') {
          current = (current || 1) * 100;
        } else if (word === 'thousand') {
          current = (current || 1) * 1000;
          result += current;
          current = 0;
        } else if (word === 'million') {
          current = (current || 1) * 1000000;
          result += current;
          current = 0;
        } else if (word === 'billion') {
          current = (current || 1) * 1000000000;
          result += current;
          current = 0;
        } else if (word === 'trillion') {
          current = (current || 1) * 1000000000000;
          result += current;
          current = 0;
        }
      }

      result += current;
      return result > 0 ? result : null;
    } catch {
      return null;
    }
  }
}
