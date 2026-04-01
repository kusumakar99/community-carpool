const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/credits/balance — Get my credit balance
router.get('/balance', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, creditBalance: true },
    });
    return res.json({ balance: user.creditBalance, user });
  } catch (err) {
    console.error('Get balance error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/credits/transactions — Get my transaction history
router.get('/transactions', auth, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ fromUserId: req.user.id }, { toUserId: req.user.id }],
      },
      include: {
        trip: { select: { id: true, originName: true, destName: true } },
        fromUser: { select: { id: true, username: true } },
        toUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ transactions });
  } catch (err) {
    console.error('Get transactions error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
