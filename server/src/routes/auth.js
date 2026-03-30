const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const { generateOTP, sendOTPEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');

const router = express.Router();

// POST /api/auth/register — Step 1: Validate, send OTP
router.post('/register', async (req, res) => {
  try {
    const { email: rawEmail, phone, username, password } = req.body;

    if (!rawEmail || !phone || !username || !password) {
      return res.status(400).json({ error: 'Email, phone, username, and password are required.' });
    }

    // Validate phone format (starts with + or digits, at least 10 chars)
    const phoneTrimmed = phone.trim();
    if (!/^[+\d][\d\s\-()]{9,}$/.test(phoneTrimmed)) {
      return res.status(400).json({ error: 'Please enter a valid phone number (10+ digits, optionally starting with +).' });
    }

    const email = rawEmail.trim().toLowerCase();

    // Check if email already registered
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'This email is already registered. Please login instead.' });
    }

    // Check if phone already registered
    const existingPhone = await prisma.user.findUnique({ where: { phone: phoneTrimmed } });
    if (existingPhone) {
      return res.status(409).json({ error: 'This phone number is already registered. Please login instead.' });
    }

    // Check if username already taken
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert pending OTP (replace if user re-requests)
    await prisma.otpVerification.upsert({
      where: { email },
      update: { phone: phoneTrimmed, username, password: hashedPassword, otp, expiresAt },
      create: { email, phone: phoneTrimmed, username, password: hashedPassword, otp, expiresAt },
    });

    // Send same OTP to both email and phone
    const [emailResult] = await Promise.all([
      sendOTPEmail(email, otp),
      sendSMS(phoneTrimmed, `Your Community CarPool verification code is: ${otp}`),
    ]);

    return res.status(200).json({
      message: 'OTP sent to your email and phone. Please verify to complete registration.',
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/verify-otp — Step 2: Verify OTP, create user
router.post('/verify-otp', async (req, res) => {
  try {
    const { email: rawEmail, otp } = req.body;

    if (!rawEmail || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const email = rawEmail.trim().toLowerCase();

    const pending = await prisma.otpVerification.findUnique({ where: { email } });

    if (!pending) {
      return res.status(404).json({ error: 'No pending registration found. Please register again.' });
    }

    if (new Date() > pending.expiresAt) {
      await prisma.otpVerification.delete({ where: { email } });
      return res.status(410).json({ error: 'OTP has expired. Please register again.' });
    }

    if (pending.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }

    // Double-check email/username not taken (race condition guard)
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: pending.username }] },
    });
    if (existingUser) {
      await prisma.otpVerification.delete({ where: { email } });
      return res.status(409).json({ error: 'Email or username already in use.' });
    }

    // Create the user and clean up OTP in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: pending.email,
          phone: pending.phone,
          username: pending.username,
          password: pending.password,
        },
      });
      await tx.otpVerification.delete({ where: { email } });
      return newUser;
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, phone: user.phone, username: user.username, creditBalance: user.creditBalance, role: user.role },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/resend-otp — Resend OTP for pending registration
router.post('/resend-otp', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;

    if (!rawEmail) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const email = rawEmail.trim().toLowerCase();

    const pending = await prisma.otpVerification.findUnique({ where: { email } });
    if (!pending) {
      return res.status(404).json({ error: 'No pending registration found. Please register again.' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpVerification.update({
      where: { email },
      data: { otp, expiresAt },
    });

    // Send new OTP to both email and phone
    const [emailResult] = await Promise.all([
      sendOTPEmail(email, otp),
      sendSMS(pending.phone, `Your Community CarPool verification code is: ${otp}`),
    ]);

    return res.json({
      message: 'New OTP sent to your email and phone.',
      previewUrl: emailResult.previewUrl || null,
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;

    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const email = rawEmail.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: { id: user.id, email: user.email, phone: user.phone, username: user.username, creditBalance: user.creditBalance, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const { id, email, phone, username, creditBalance, role, createdAt } = req.user;
    return res.json({ user: { id, email, phone, username, creditBalance, role, createdAt } });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
