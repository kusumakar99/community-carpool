const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function uniqueInviteCode() {
  let code, exists;
  do {
    code = generateInviteCode();
    exists = await prisma.community.findUnique({ where: { inviteCode: code } });
  } while (exists);
  return code;
}

// POST /api/communities — Create a new community
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Community name is required.' });
    }

    const inviteCode = await uniqueInviteCode();

    const community = await prisma.community.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        inviteCode,
        createdBy: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'admin',
          },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, username: true } } } },
        creator: { select: { id: true, username: true } },
      },
    });

    return res.status(201).json({ community });
  } catch (err) {
    console.error('Create community error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/communities — List my communities
router.get('/', auth, async (req, res) => {
  try {
    const memberships = await prisma.communityMember.findMany({
      where: { userId: req.user.id },
      include: {
        community: {
          include: {
            _count: { select: { members: true } },
            creator: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const communities = memberships.map(m => ({
      ...m.community,
      myRole: m.role,
      memberCount: m.community._count.members,
    }));

    return res.json({ communities });
  } catch (err) {
    console.error('List communities error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/communities/join — Join a community using invite code
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    if (!inviteCode || !inviteCode.trim()) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const community = await prisma.community.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() },
      include: { _count: { select: { members: true } } },
    });

    if (!community) {
      return res.status(404).json({ error: 'Invalid invite code.' });
    }
    if (!community.isActive) {
      return res.status(400).json({ error: 'This community is no longer active.' });
    }

    const existing = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: community.id, userId: req.user.id } },
    });
    if (existing) {
      return res.json({ community, message: 'You are already a member of this community.' });
    }

    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: req.user.id,
        role: 'member',
      },
    });

    return res.json({ community, message: `Successfully joined ${community.name}!` });
  } catch (err) {
    console.error('Join community error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/communities/preview/:inviteCode — Public preview (no auth required)
router.get('/preview/:inviteCode', async (req, res) => {
  try {
    const community = await prisma.community.findUnique({
      where: { inviteCode: req.params.inviteCode.toUpperCase() },
      select: { id: true, name: true, description: true, isActive: true, _count: { select: { members: true } } },
    });

    if (!community) {
      return res.status(404).json({ error: 'Invalid invite code.' });
    }

    return res.json({ community: { ...community, memberCount: community._count.members } });
  } catch (err) {
    console.error('Preview community error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/communities/:id — Get community details (members only)
router.get('/:id', auth, async (req, res) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: req.params.id, userId: req.user.id } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this community.' });
    }

    const community = await prisma.community.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, username: true } },
        members: {
          include: { user: { select: { id: true, username: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true, trips: true } },
      },
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found.' });
    }

    return res.json({
      community: {
        ...community,
        memberCount: community._count.members,
        tripCount: community._count.trips,
        myRole: membership.role,
      },
    });
  } catch (err) {
    console.error('Get community error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/communities/:id/trips — List trips in a community (members only)
router.get('/:id/trips', auth, async (req, res) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: req.params.id, userId: req.user.id } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this community.' });
    }

    const trips = await prisma.trip.findMany({
      where: { communityId: req.params.id },
      include: {
        driver: { select: { id: true, username: true, gender: true, age: true } },
      },
      orderBy: { departureTime: 'desc' },
    });

    return res.json({ trips });
  } catch (err) {
    console.error('List community trips error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/communities/:id — Update community (admin only)
router.patch('/:id', auth, async (req, res) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: req.params.id, userId: req.user.id } },
    });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only community admins can update the community.' });
    }

    const { name, description, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const community = await prisma.community.update({
      where: { id: req.params.id },
      data,
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { members: true } },
      },
    });

    return res.json({ community: { ...community, memberCount: community._count.members } });
  } catch (err) {
    console.error('Update community error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/communities/:id/regenerate-code — Generate new invite code (admin only)
router.post('/:id/regenerate-code', auth, async (req, res) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: req.params.id, userId: req.user.id } },
    });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ error: 'Only community admins can regenerate the invite code.' });
    }

    const inviteCode = await uniqueInviteCode();
    const community = await prisma.community.update({
      where: { id: req.params.id },
      data: { inviteCode },
    });

    return res.json({ community, message: 'Invite code regenerated.' });
  } catch (err) {
    console.error('Regenerate code error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
