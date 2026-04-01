const express = require('express');
const prisma = require('../config/db');
const auth = require('../middleware/auth');
const { calculateCredits } = require('../utils/credits');

const router = express.Router();

// POST /api/trips — Create a new trip (driver)
router.post('/', auth, async (req, res) => {
  try {
    const { originName, originLat, originLng, destName, destLat, destLng, departureTime, totalSeats, creditsPerSeat: manualCredits, communityId } = req.body;

    if (!originName || !destName || !departureTime || !totalSeats) {
      return res.status(400).json({ error: 'Origin, destination, departure time, and seats are required.' });
    }

    // If communityId provided, verify user is an active member
    if (communityId) {
      const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: req.user.id } },
      });
      if (!membership || membership.status !== 'active') {
        return res.status(403).json({ error: 'You are not an active member of this community.' });
      }
    }

    // Calculate credits: use manual override, or calculate from coordinates, or require manual
    let creditsPerSeat;
    if (manualCredits != null && manualCredits > 0) {
      creditsPerSeat = parseFloat(manualCredits);
    } else if (originLat != null && originLng != null && destLat != null && destLng != null) {
      creditsPerSeat = calculateCredits(originLat, originLng, destLat, destLng);
    } else {
      return res.status(400).json({ error: 'Please specify price per seat, or provide coordinates for auto-calculation.' });
    }

    const trip = await prisma.trip.create({
      data: {
        driverId: req.user.id,
        originName,
        originLat: originLat != null ? parseFloat(originLat) : 0,
        originLng: originLng != null ? parseFloat(originLng) : 0,
        destName,
        destLat: destLat != null ? parseFloat(destLat) : 0,
        destLng: destLng != null ? parseFloat(destLng) : 0,
        departureTime: new Date(departureTime),
        totalSeats: parseInt(totalSeats, 10),
        availableSeats: parseInt(totalSeats, 10),
        creditsPerSeat,
        communityId: communityId || null,
      },
      include: { driver: { select: { id: true, username: true, email: true } } },
    });

    return res.status(201).json({ trip });
  } catch (err) {
    console.error('Create trip error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/trips/my/created — Trips I created as driver
router.get('/my/created', auth, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { driverId: req.user.id },
      include: {
        driver: { select: { id: true, username: true } },
        joinRequests: { include: { rider: { select: { id: true, username: true, gender: true, age: true } } } },
      },
      orderBy: { departureTime: 'desc' },
    });
    return res.json({ trips });
  } catch (err) {
    console.error('My created trips error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/trips/my/joined — Trips I joined as rider
router.get('/my/joined', auth, async (req, res) => {
  try {
    const joinRequests = await prisma.joinRequest.findMany({
      where: { riderId: req.user.id },
      include: {
        trip: {
          include: { driver: { select: { id: true, username: true, phone: true, gender: true, age: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Strip driver details for non-ACCEPTED join requests
    for (const jr of joinRequests) {
      if (jr.status !== 'ACCEPTED' && jr.trip?.driver) {
        delete jr.trip.driver.phone;
        delete jr.trip.driver.gender;
        delete jr.trip.driver.age;
      }
    }

    return res.json({ joinRequests });
  } catch (err) {
    console.error('My joined trips error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/trips — List available trips (not own, with available seats, scheduled)
router.get('/', auth, async (req, res) => {
  try {
    const { search, communityId } = req.query;
    const where = {
      status: 'SCHEDULED',
      availableSeats: { gt: 0 },
      driverId: { not: req.user.id },
      departureTime: { gte: new Date() },
    };

    if (communityId) {
      // Verify user is an active member
      const membership = await prisma.communityMember.findUnique({
        where: { communityId_userId: { communityId, userId: req.user.id } },
      });
      if (!membership || membership.status !== 'active') {
        return res.status(403).json({ error: 'You are not an active member of this community.' });
      }
      where.communityId = communityId;
    } else {
      // Show public trips (no community) + trips from user's active communities
      const memberships = await prisma.communityMember.findMany({
        where: { userId: req.user.id, status: 'active' },
        select: { communityId: true },
      });
      const myCommunityIds = memberships.map(m => m.communityId);
      where.OR = [
        { communityId: null },
        ...(myCommunityIds.length > 0 ? [{ communityId: { in: myCommunityIds } }] : []),
      ];
    }

    if (search) {
      where.AND = [
        { OR: [
          { originName: { contains: search } },
          { destName: { contains: search } },
        ] },
      ];
    }

    const trips = await prisma.trip.findMany({
      where,
      include: { driver: { select: { id: true, username: true, gender: true, age: true } } },
      orderBy: { departureTime: 'asc' },
    });

    return res.json({ trips });
  } catch (err) {
    console.error('List trips error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/trips/:id — Trip details
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        driver: { select: { id: true, username: true, email: true, phone: true, gender: true, age: true } },
        joinRequests: {
          include: { rider: { select: { id: true, username: true, phone: true, gender: true, age: true } } },
        },
      },
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const isDriver = trip.driverId === req.user.id;
    const myRequest = trip.joinRequests.find(jr => jr.riderId === req.user.id);
    const isAcceptedRider = myRequest && myRequest.status === 'ACCEPTED';

    // For non-drivers: show driver phone if ACCEPTED (any active status), hide email always
    if (!isDriver) {
      delete trip.driver.email;
      const showPhone = isAcceptedRider && (trip.status === 'SCHEDULED' || trip.status === 'IN_PROGRESS');
      if (!showPhone) {
        delete trip.driver.phone;
      }
    }

    // Only show rider phones to the driver, and only for accepted riders
    if (!isDriver) {
      trip.joinRequests.forEach(jr => { delete jr.rider.phone; });
    } else {
      // For driver: strip phone from non-accepted riders
      trip.joinRequests.forEach(jr => {
        if (jr.status !== 'ACCEPTED') {
          if (jr.rider) delete jr.rider.phone;
        }
      });
    }

    // Non-drivers only see their own join request
    if (!isDriver) {
      trip.joinRequests = trip.joinRequests.filter(jr => jr.riderId === req.user.id);
    }

    return res.json({ trip });
  } catch (err) {
    console.error('Get trip error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/trips/:id/start — Start journey (driver only)
router.patch('/:id/start', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    if (trip.driverId !== req.user.id) return res.status(403).json({ error: 'Only the driver can start this trip.' });
    if (trip.status !== 'SCHEDULED') return res.status(400).json({ error: `Cannot start a trip with status ${trip.status}.` });

    const updatedTrip = await prisma.trip.update({
      where: { id: trip.id },
      data: { status: 'IN_PROGRESS' },
      include: {
        driver: { select: { id: true, username: true, phone: true } },
        joinRequests: { include: { rider: { select: { id: true, username: true } } } },
      },
    });

    return res.json({ trip: updatedTrip, message: 'Journey started!' });
  } catch (err) {
    console.error('Start trip error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/trips/:id/complete — Complete trip & trigger credit transfers
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { joinRequests: { where: { status: 'ACCEPTED' } } },
    });

    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    if (trip.driverId !== req.user.id) return res.status(403).json({ error: 'Only the driver can complete this trip.' });
    if (trip.status !== 'SCHEDULED' && trip.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: `Cannot complete a trip with status ${trip.status}.` });
    }

    const acceptedRequests = trip.joinRequests;

    // Process credit transfers inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      for (const jr of acceptedRequests) {
        // Check rider balance
        const rider = await tx.user.findUnique({ where: { id: jr.riderId } });
        if (rider.creditBalance < trip.creditsPerSeat) {
          throw new Error(`Rider ${rider.username} has insufficient balance.`);
        }

        // Deduct from rider
        await tx.user.update({
          where: { id: jr.riderId },
          data: { creditBalance: { decrement: trip.creditsPerSeat } },
        });

        // Add to driver
        await tx.user.update({
          where: { id: trip.driverId },
          data: { creditBalance: { increment: trip.creditsPerSeat } },
        });

        // Record transaction
        await tx.transaction.create({
          data: {
            tripId: trip.id,
            fromUserId: jr.riderId,
            toUserId: trip.driverId,
            amount: trip.creditsPerSeat,
            type: 'TRIP_PAYMENT',
          },
        });
      }

      // Mark trip as completed
      const updatedTrip = await tx.trip.update({
        where: { id: trip.id },
        data: { status: 'COMPLETED' },
        include: {
          driver: { select: { id: true, username: true, creditBalance: true } },
          joinRequests: { include: { rider: { select: { id: true, username: true } } } },
        },
      });

      return updatedTrip;
    });

    return res.json({ trip: result, message: `Trip completed. ${acceptedRequests.length} rider(s) charged ₹${trip.creditsPerSeat} each.` });
  } catch (err) {
    console.error('Complete trip error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

// PATCH /api/trips/:id/cancel — Cancel trip
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });

    if (!trip) return res.status(404).json({ error: 'Trip not found.' });
    if (trip.driverId !== req.user.id) return res.status(403).json({ error: 'Only the driver can cancel this trip.' });
    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      return res.status(400).json({ error: `Cannot cancel a trip with status ${trip.status}.` });
    }

    const updatedTrip = await prisma.$transaction(async (tx) => {
      // Cancel all pending join requests
      await tx.joinRequest.updateMany({
        where: { tripId: trip.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      // Cancel accepted join requests
      await tx.joinRequest.updateMany({
        where: { tripId: trip.id, status: 'ACCEPTED' },
        data: { status: 'CANCELLED' },
      });

      return tx.trip.update({
        where: { id: trip.id },
        data: { status: 'CANCELLED' },
        include: { driver: { select: { id: true, username: true } } },
      });
    });

    return res.json({ trip: updatedTrip, message: 'Trip cancelled successfully.' });
  } catch (err) {
    console.error('Cancel trip error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
