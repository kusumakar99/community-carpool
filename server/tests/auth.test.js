const {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
  JWT_SECRET,
} = require('../utils/auth');
const jwt = require('jsonwebtoken');

describe('Auth utilities', () => {
  // ===================== JWT =====================
  describe('generateToken()', () => {
    it('returns a non-empty string', () => {
      const token = generateToken({ id: '1', email: 'a@b.com' });
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('embeds the payload (id, email) in the token', () => {
      const token = generateToken({ id: '42', email: 'user@example.com' });
      const decoded = jwt.decode(token);
      expect(decoded.id).toBe('42');
      expect(decoded.email).toBe('user@example.com');
    });

    it('sets an expiration claim (exp)', () => {
      const token = generateToken({ id: '1', email: 'a@b.com' });
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('produces different tokens for different payloads', () => {
      const t1 = generateToken({ id: '1', email: 'a@b.com' });
      const t2 = generateToken({ id: '2', email: 'c@d.com' });
      expect(t1).not.toBe(t2);
    });
  });

  describe('verifyToken()', () => {
    it('returns the original payload for a valid token', () => {
      const token = generateToken({ id: '7', email: 'test@test.com' });
      const decoded = verifyToken(token);
      expect(decoded.id).toBe('7');
      expect(decoded.email).toBe('test@test.com');
    });

    it('throws for an invalid / tampered token', () => {
      expect(() => verifyToken('not.a.token')).toThrow();
    });

    it('throws for a token signed with a different secret', () => {
      const bad = jwt.sign({ id: '1' }, 'wrong-secret', { expiresIn: '1h' });
      expect(() => verifyToken(bad)).toThrow();
    });

    it('throws for an expired token', () => {
      const expired = jwt.sign({ id: '1' }, JWT_SECRET, { expiresIn: '0s' });
      // Small delay to let the token expire
      expect(() => verifyToken(expired)).toThrow();
    });

    it('throws for an empty string', () => {
      expect(() => verifyToken('')).toThrow();
    });
  });

  // ===================== Password hashing =====================
  describe('hashPassword()', () => {
    it('returns a string that differs from the plaintext', async () => {
      const hash = await hashPassword('mySecret123');
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe('mySecret123');
    });

    it('produces a bcrypt-formatted hash (starts with $2a$ or $2b$)', async () => {
      const hash = await hashPassword('password');
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('generates different hashes for the same password (unique salts)', async () => {
      const h1 = await hashPassword('samePassword');
      const h2 = await hashPassword('samePassword');
      expect(h1).not.toBe(h2);
    });
  });

  describe('comparePassword()', () => {
    it('returns true for a matching password', async () => {
      const hash = await hashPassword('correct-password');
      const result = await comparePassword('correct-password', hash);
      expect(result).toBe(true);
    });

    it('returns false for a wrong password', async () => {
      const hash = await hashPassword('correct-password');
      const result = await comparePassword('wrong-password', hash);
      expect(result).toBe(false);
    });

    it('returns false for an empty password against a valid hash', async () => {
      const hash = await hashPassword('something');
      const result = await comparePassword('', hash);
      expect(result).toBe(false);
    });
  });

  // ===================== Round-trip =====================
  describe('end-to-end: hash → compare → token → verify', () => {
    it('full auth flow works', async () => {
      const password = 'SuperSecret!1';
      const hash = await hashPassword(password);
      const match = await comparePassword(password, hash);
      expect(match).toBe(true);

      const token = generateToken({ id: 'u123', email: 'user@carpool.io' });
      const decoded = verifyToken(token);
      expect(decoded.id).toBe('u123');
      expect(decoded.email).toBe('user@carpool.io');
    });
  });
});
