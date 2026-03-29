const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/trips/:id/join — Request to join a trip
router.post('/trips/:id/join', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });

    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    if (trip.driverId === req.user.id) return res.status(400).json({ error: 'You cannot join your own trip.' });
    if (trip.status !== 'SCHEDULED') return res.status(400).json({ error: 'This trip is no longer accepting requests.' });
    if (trip.availableSeats <= 0) return res.status(400).json({ error: 'No available seats on this trip.' });

    // Check for insufficient credits
    if (req.user.creditBalance < trip.creditsPerSeat) {
      return res.status(400).json({ error: 'Insufficient credits to join this trip.' });
    }

    // Check for existing request
    const existing = await prisma.joinRequest.findUnique({
      where: { tripId_riderId: { tripId: trip.id, riderId: req.user.id } },
    });
    if (existing) {
      return res.status(409).json({ error: 'You have already requested to join this trip.', joinRequest: existing });
    }

    const joinRequest = await prisma.joinRequest.create({
      data: { tripId: trip.id, riderId: req.user.id },
      include: {
        trip: { select: { id: true, originName: true, destName: true, creditsPerSeat: true } },
        rider: { select: { id: true, username: true } },
      },
    });

    return res.status(201).json({ joinRequest });
  } catch (err) {
    console.error('Join trip error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/join-requests/:id/accept — Accept a join request (driver only)
router.patch('/join-requests/:id/accept', auth, async (req, res) => {
  try {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: req.params.id },
      include: { trip: true },
    });

    if (!joinRequest) return res.status(404).json({ error: 'Join request not found.' });
    if (joinRequest.trip.driverId !== req.user.id) return res.status(403).json({ error: 'Only the driver can accept requests.' });
    if (joinRequest.status !== 'PENDING') return res.status(400).json({ error: `Cannot accept a request with status ${joinRequest.status}.` });
    if (joinRequest.trip.availableSeats <= 0) return res.status(400).json({ error: 'No available seats remaining.' });

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.joinRequest.update({
        where: { id: joinRequest.id },
        data: { status: 'ACCEPTED' },
        include: { rider: { select: { id: true, username: true } } },
      });

      await tx.trip.update({
        where: { id: joinRequest.tripId },
        data: { availableSeats: { decrement: 1 } },
      });

      return updated;
    });

    return res.json({ joinRequest: result, message: 'Request accepted.' });
  } catch (err) {
    console.error('Accept request error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/join-requests/:id/reject — Reject a join request (driver only)
router.patch('/join-requests/:id/reject', auth, async (req, res) => {
  try {
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: req.params.id },
      include: { trip: true },
    });

    if (!joinRequest) return res.status(404).json({ error: 'Join request not found.' });
    if (joinRequest.trip.driverId !== req.user.id) return res.status(403).json({ error: 'Only the driver can reject requests.' });
    if (joinRequest.status !== 'PENDING') return res.status(400).json({ error: `Cannot reject a request with status ${joinRequest.status}.` });

    const updated = await prisma.joinRequest.update({
      where: { id: joinRequest.id },
      data: { status: 'REJECTED' },
      include: { rider: { select: { id: true, username: true } } },
    });

    return res.json({ joinRequest: updated, message: 'Request rejected.' });
  } catch (err) {
    console.error('Reject request error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
