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

async function isCommunityAdmin(communityId, userId) {
  const member = await prisma.communityMember.findUnique({
    where: { communityId_userId: { communityId, userId } },
  });
  return member && member.role === 'admin' && member.status === 'active';
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
            status: 'active',
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
      myStatus: m.status,
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
      if (existing.status === 'pending') {
        return res.json({ community, message: 'Your request to join is still pending admin approval.', status: 'pending' });
      }
      if (existing.status === 'rejected') {
        return res.status(403).json({ error: 'Your request to join this community was rejected.' });
      }
      return res.json({ community, message: 'You are already a member of this community.', status: 'active' });
    }

    // Check if phone is pre-approved
    const userRecord = await prisma.user.findUnique({ where: { id: req.user.id }, select: { phone: true } });
    const userPhone = userRecord?.phone?.trim();

    const isApproved = userPhone ? await prisma.approvedPhone.findUnique({
      where: { communityId_phone: { communityId: community.id, phone: userPhone } },
    }) : null;

    const member = await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: req.user.id,
        role: 'member',
        status: isApproved ? 'active' : 'pending',
      },
    });

    if (isApproved) {
      return res.json({ community, message: 'Welcome! You have been auto-approved.', status: 'active' });
    } else {
      return res.json({ community, message: 'Your request to join has been submitted. The community admin will review it.', status: 'pending' });
    }
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

// GET /api/communities/:id — Get community details (active members only)
router.get('/:id', auth, async (req, res) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: req.params.id, userId: req.user.id } },
    });
    if (!membership) {
      return res.status(403).json({ error: 'You are not a member of this community.' });
    }
    if (membership.status === 'pending') {
      return res.status(403).json({ error: 'Your membership is pending admin approval.' });
    }
    if (membership.status === 'rejected') {
      return res.status(403).json({ error: 'Your membership request was rejected.' });
    }

    const community = await prisma.community.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, username: true } },
        members: {
          where: { status: 'active' },
          include: { user: { select: { id: true, username: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: { where: { status: 'active' } }, trips: true } },
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

// GET /api/communities/:id/trips — List trips in a community (active members only)
router.get('/:id/trips', auth, async (req, res) => {
  try {
    const membership = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: req.params.id, userId: req.user.id } },
    });
    if (!membership || membership.status !== 'active') {
      return res.status(403).json({ error: 'You are not an active member of this community.' });
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
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
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
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
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

// POST /api/communities/:id/approved-phones — Add phone(s) to approved list (admin only)
router.post('/:id/approved-phones', auth, async (req, res) => {
  try {
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only community admins can manage approved phones.' });
    }

    const { phones } = req.body;
    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return res.status(400).json({ error: 'Provide an array of phone numbers.' });
    }

    const normalizedPhones = phones.map(p => p.trim()).filter(p => p.length > 0);
    if (normalizedPhones.length === 0) {
      return res.status(400).json({ error: 'No valid phone numbers provided.' });
    }

    const results = [];
    for (const phone of normalizedPhones) {
      try {
        const created = await prisma.approvedPhone.create({
          data: {
            communityId: req.params.id,
            phone,
            addedBy: req.user.id,
          },
        });
        results.push({ phone, status: 'added', id: created.id });
      } catch (e) {
        // Skip duplicates (unique constraint violation)
        if (e.code === 'P2002') {
          results.push({ phone, status: 'already_exists' });
        } else {
          throw e;
        }
      }
    }

    return res.json({ results, message: `Processed ${results.length} phone number(s).` });
  } catch (err) {
    console.error('Add approved phones error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/communities/:id/approved-phones — List approved phones (admin only)
router.get('/:id/approved-phones', auth, async (req, res) => {
  try {
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only community admins can view approved phones.' });
    }

    const phones = await prisma.approvedPhone.findMany({
      where: { communityId: req.params.id },
      orderBy: { addedAt: 'desc' },
    });

    return res.json({ phones });
  } catch (err) {
    console.error('List approved phones error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/communities/:id/approved-phones/:phoneId — Remove from approved list (admin only)
router.delete('/:id/approved-phones/:phoneId', auth, async (req, res) => {
  try {
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only community admins can manage approved phones.' });
    }

    await prisma.approvedPhone.delete({
      where: { id: req.params.phoneId },
    });

    return res.json({ message: 'Phone number removed from approved list.' });
  } catch (err) {
    console.error('Delete approved phone error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/communities/:id/pending-members — List pending members (admin only)
router.get('/:id/pending-members', auth, async (req, res) => {
  try {
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only community admins can view pending members.' });
    }

    const pendingMembers = await prisma.communityMember.findMany({
      where: { communityId: req.params.id, status: 'pending' },
      include: {
        user: { select: { id: true, username: true, phone: true, gender: true, age: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return res.json({ pendingMembers });
  } catch (err) {
    console.error('List pending members error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/communities/:id/members/:memberId/approve — Approve a pending member (admin only)
router.patch('/:id/members/:memberId/approve', auth, async (req, res) => {
  try {
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only community admins can approve members.' });
    }

    const member = await prisma.communityMember.findFirst({
      where: { id: req.params.memberId, communityId: req.params.id },
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    if (member.status !== 'pending') {
      return res.status(400).json({ error: 'Member is not in pending status.' });
    }

    const updated = await prisma.communityMember.update({
      where: { id: req.params.memberId },
      data: { status: 'active' },
      include: { user: { select: { id: true, username: true } } },
    });

    return res.json({ member: updated, message: 'Member approved.' });
  } catch (err) {
    console.error('Approve member error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/communities/:id/members/:memberId/reject — Reject a pending member (admin only)
router.patch('/:id/members/:memberId/reject', auth, async (req, res) => {
  try {
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only community admins can reject members.' });
    }

    const member = await prisma.communityMember.findFirst({
      where: { id: req.params.memberId, communityId: req.params.id },
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    if (member.status !== 'pending') {
      return res.status(400).json({ error: 'Member is not in pending status.' });
    }

    await prisma.communityMember.delete({
      where: { id: req.params.memberId },
    });

    return res.json({ message: 'Member rejected and removed.' });
  } catch (err) {
    console.error('Reject member error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/communities/:id/members/:memberId — Remove a member (admin only)
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    if (!(await isCommunityAdmin(req.params.id, req.user.id))) {
      return res.status(403).json({ error: 'Only community admins can remove members.' });
    }

    const member = await prisma.communityMember.findFirst({
      where: { id: req.params.memberId, communityId: req.params.id },
    });
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }
    if (member.role === 'admin') {
      return res.status(400).json({ error: 'Cannot remove a community admin.' });
    }

    await prisma.communityMember.delete({
      where: { id: req.params.memberId },
    });

    return res.json({ message: 'Member removed from the community.' });
  } catch (err) {
    console.error('Remove member error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
