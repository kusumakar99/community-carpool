const { calculateCredits } = require('../utils/credits');

describe('calculateCredits()', () => {
  // ---------- Basic formula: distance * 0.5 ----------
  describe('standard credit calculation (distance × 0.5)', () => {
    it('10 km → 5 credits', () => {
      expect(calculateCredits(10)).toBe(5);
    });

    it('100 km → 50 credits', () => {
      expect(calculateCredits(100)).toBe(50);
    });

    it('1 km → 0.5 credits', () => {
      expect(calculateCredits(1)).toBe(0.5);
    });

    it('7.4 km → 3.7 credits', () => {
      expect(calculateCredits(7.4)).toBe(3.7);
    });
  });

  // ---------- Zero distance ----------
  describe('zero distance', () => {
    it('0 km → 0 credits', () => {
      expect(calculateCredits(0)).toBe(0);
    });
  });

  // ---------- Rounding behaviour ----------
  describe('rounding to 2 decimal places', () => {
    it('0.333 km → 0.17 credits (rounds to 2dp)', () => {
      expect(calculateCredits(0.333)).toBeCloseTo(0.17, 2);
    });

    it('0.001 km → 0 credits (rounds down)', () => {
      expect(calculateCredits(0.001)).toBeCloseTo(0, 2);
    });

    it('99.999 km → 50 credits (rounds correctly)', () => {
      expect(calculateCredits(99.999)).toBeCloseTo(50, 0);
    });
  });

  // ---------- Large distances ----------
  describe('large distances', () => {
    it('10000 km → 5000 credits', () => {
      expect(calculateCredits(10000)).toBe(5000);
    });

    it('20000 km (half circumference) → 10000 credits', () => {
      expect(calculateCredits(20000)).toBe(10000);
    });
  });

  // ---------- Fractional distances ----------
  describe('fractional distances', () => {
    it('0.5 km → 0.25 credits', () => {
      expect(calculateCredits(0.5)).toBe(0.25);
    });

    it('2.75 km → 1.38 credits', () => {
      expect(calculateCredits(2.75)).toBeCloseTo(1.38, 2);
    });
  });

  // ---------- Edge / invalid inputs ----------
  describe('invalid inputs', () => {
    it('negative distance returns 0 credits', () => {
      expect(calculateCredits(-5)).toBe(0);
    });

    it('NaN returns 0 credits', () => {
      expect(calculateCredits(NaN)).toBe(0);
    });

    it('undefined returns 0 credits', () => {
      expect(calculateCredits(undefined)).toBe(0);
    });

    it('string returns 0 credits', () => {
      expect(calculateCredits('abc')).toBe(0);
    });

    it('null returns 0 credits', () => {
      expect(calculateCredits(null)).toBe(0);
    });
  });

  // ---------- Return type ----------
  describe('return type', () => {
    it('always returns a number', () => {
      expect(typeof calculateCredits(42)).toBe('number');
    });
  });
});
