const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const { adminAuth } = require('../middleware/admin');
const { sendOTPEmail } = require('../utils/email');
const nodemailer = require('nodemailer');

const router = express.Router();

// POST /api/admin/setup — Promote a user to admin using a secret key
// Use this once to create the first admin account
router.post('/setup', auth, async (req, res) => {
  try {
    const { adminSecret } = req.body;
    const expectedSecret = process.env.ADMIN_SECRET || 'carpool-admin-setup';

    if (adminSecret !== expectedSecret) {
      return res.status(403).json({ error: 'Invalid admin secret.' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'admin' },
    });

    return res.json({
      message: `User ${user.username} promoted to admin.`,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    });
  } catch (err) {
    console.error('Admin setup error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/users — List all registered users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { search, role } = req.query;
    const where = {};

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { username: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        creditBalance: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ users, total: users.length });
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/admin/users/:id/role — Update user role
router.patch('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be "user" or "admin".' });
    }

    if (req.params.id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot demote yourself.' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, username: true, role: true },
    });

    return res.json({ message: `User ${user.username} is now ${role}.`, user });
  } catch (err) {
    console.error('Update role error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/send-email — Send email to users
router.post('/send-email', adminAuth, async (req, res) => {
  try {
    const { subject, body, userIds } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required.' });
    }

    // Get target users
    let users;
    let audience = 'all';
    if (userIds && userIds.length > 0) {
      users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true },
      });
      audience = userIds.join(',');
    } else {
      users = await prisma.user.findMany({
        select: { id: true, email: true, username: true },
      });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users found to email.' });
    }

    // Send emails (get transporter from email utility)
    const { getTransporter } = require('../utils/email');
    const transporter = await getTransporter();

    const results = { sent: 0, failed: 0, errors: [] };

    for (const user of users) {
      try {
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || '"Community CarPool" <noreply@carpool.community>',
          to: user.email,
          subject: subject,
          text: body,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
              <h2 style="color: #0d9488;">🚗 Community CarPool</h2>
              <h3>${subject}</h3>
              <div style="padding: 16px 0; line-height: 1.6;">${body.replace(/\n/g, '<br>')}</div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #999; font-size: 12px;">
                You received this because you're a member of Community CarPool.
              </p>
            </div>
          `,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          console.log(`📧 Email to ${user.email}:`, previewUrl);
        }
        results.sent++;
      } catch (emailErr) {
        results.failed++;
        results.errors.push({ email: user.email, error: emailErr.message });
      }
    }

    // Record the announcement
    await prisma.announcement.create({
      data: {
        subject,
        body,
        sentBy: req.user.id,
        audience,
        userCount: results.sent,
      },
    });

    return res.json({
      message: `Email sent to ${results.sent} user(s).${results.failed ? ` ${results.failed} failed.` : ''}`,
      results,
    });
  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/announcements — List sent announcements
router.get('/announcements', adminAuth, async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      include: { sender: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json({ announcements });
  } catch (err) {
    console.error('List announcements error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/admin/stats — Dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [userCount, tripCount, activeTrips, announcementCount] = await Promise.all([
      prisma.user.count(),
      prisma.trip.count(),
      prisma.trip.count({ where: { status: 'SCHEDULED' } }),
      prisma.announcement.count(),
    ]);
    return res.json({ userCount, tripCount, activeTrips, announcementCount });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
