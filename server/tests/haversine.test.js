const { haversine } = require('../utils/haversine');

describe('haversine()', () => {
  // ---------- Known city-to-city distances ----------
  describe('known intercity distances', () => {
    it('New York to Los Angeles ≈ 3944 km', () => {
      const d = haversine(40.7128, -74.006, 34.0522, -118.2437);
      expect(d).toBeCloseTo(3944, -2); // within ±50 km
    });

    it('London to Paris ≈ 344 km', () => {
      const d = haversine(51.5074, -0.1278, 48.8566, 2.3522);
      expect(d).toBeCloseTo(344, -1); // within ±5 km
    });

    it('Tokyo to Sydney ≈ 7823 km', () => {
      const d = haversine(35.6762, 139.6503, -33.8688, 151.2093);
      expect(d).toBeCloseTo(7823, -2);
    });
  });

  // ---------- Zero / identical points ----------
  describe('zero distance (same point)', () => {
    it('returns 0 when both points are identical', () => {
      expect(haversine(40.7128, -74.006, 40.7128, -74.006)).toBe(0);
    });

    it('returns 0 for the origin (0, 0) to (0, 0)', () => {
      expect(haversine(0, 0, 0, 0)).toBe(0);
    });
  });

  // ---------- Short distances (within a city) ----------
  describe('short distances', () => {
    it('Times Square to Central Park ≈ 2 km', () => {
      const d = haversine(40.758, -73.9855, 40.7829, -73.9654);
      expect(d).toBeGreaterThan(1);
      expect(d).toBeLessThan(5);
    });
  });

  // ---------- One degree along the equator ----------
  describe('equatorial distances', () => {
    it('(0,0) to (0,1) ≈ 111 km (one degree of longitude at equator)', () => {
      const d = haversine(0, 0, 0, 1);
      expect(d).toBeCloseTo(111.19, 0); // within ±0.5 km
    });

    it('(0,0) to (1,0) ≈ 111 km (one degree of latitude)', () => {
      const d = haversine(0, 0, 1, 0);
      expect(d).toBeCloseTo(111.19, 0);
    });
  });

  // ---------- Antipodal points ----------
  describe('antipodal points (maximum distance)', () => {
    it('North Pole to South Pole ≈ 20015 km', () => {
      const d = haversine(90, 0, -90, 0);
      expect(d).toBeCloseTo(20015, -2);
    });

    it('(0,0) to (0,180) ≈ 20015 km (half circumference)', () => {
      const d = haversine(0, 0, 0, 180);
      expect(d).toBeCloseTo(20015, -2);
    });
  });

  // ---------- Symmetry ----------
  describe('symmetry', () => {
    it('distance A→B equals distance B→A', () => {
      const ab = haversine(40.7128, -74.006, 34.0522, -118.2437);
      const ba = haversine(34.0522, -118.2437, 40.7128, -74.006);
      expect(ab).toBeCloseTo(ba, 10);
    });
  });

  // ---------- Negative / southern-hemisphere coordinates ----------
  describe('coordinates across hemispheres', () => {
    it('handles negative latitudes (Buenos Aires to Cape Town)', () => {
      const d = haversine(-34.6037, -58.3816, -33.9249, 18.4241);
      expect(d).toBeGreaterThan(6500);
      expect(d).toBeLessThan(7500);
    });
  });

  // ---------- Return type ----------
  describe('return type', () => {
    it('always returns a number', () => {
      expect(typeof haversine(0, 0, 1, 1)).toBe('number');
    });

    it('never returns NaN for valid inputs', () => {
      expect(haversine(0, 0, 90, 180)).not.toBeNaN();
    });
  });
});
