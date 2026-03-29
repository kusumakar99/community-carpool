/**
 * Calculate ride credits from distance.
 * Formula: credits = distance_km * 0.5
 *
 * @param {number} distanceKm - Distance in kilometres
 * @returns {number} Credits earned (rounded to 2 decimal places)
 */
function calculateCredits(distanceKm) {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm < 0) {
    return 0;
  }
  return Math.round(distanceKm * 0.5 * 100) / 100;
}

module.exports = { calculateCredits };
