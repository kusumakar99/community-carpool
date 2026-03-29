const haversine = require('./haversine');

const CREDIT_RATE = 0.5; // credits per km

/**
 * Calculate credits per seat for a trip based on origin/destination coordinates.
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @returns {number} credits per seat (rounded to 2 decimal places)
 */
function calculateCredits(originLat, originLng, destLat, destLng) {
  const distanceKm = haversine(originLat, originLng, destLat, destLng);
  return Math.round(distanceKm * CREDIT_RATE * 100) / 100;
}

module.exports = { calculateCredits, CREDIT_RATE };
