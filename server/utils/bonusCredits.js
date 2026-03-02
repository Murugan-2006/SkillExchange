/**
 * Bonus Credits Calculator for Course Uploaders
 * 
 * Formula: Bonus Credits = Base × (Average Rating Score) × (Effective Volume Factor)
 * 
 * Where:
 * - Base = 50 credits
 * - Rating Score = Average Stars / 5
 * - Effective Volume Factor = min(numberOfRatings / 50, 3)
 * 
 * Examples:
 * - New course (12 ratings, 4.5★): 50 × 0.90 × 0.24 ≈ 10.8 credits
 * - Good course (80 ratings, 4.3★): 50 × 0.86 × 1.6 ≈ 68.8 credits
 * - Popular excellent (300 ratings, 4.7★): 50 × 0.94 × 3.0 ≈ 141 credits
 * - Poor rating (100 ratings, 2.8★): 50 × 0.56 × 2.0 ≈ 56 credits
 */

const BASE_CREDITS = 50;
const MAX_VOLUME_FACTOR = 3;
const VOLUME_DIVISOR = 50;

/**
 * Calculate bonus credits for a course uploader
 * @param {number} numberOfRatings - Total number of ratings received
 * @param {number} averageRating - Average star rating (1-5)
 * @returns {object} - Calculation details and final bonus credits
 */
export const calculateBonusCredits = (numberOfRatings, averageRating) => {
  // Handle edge cases
  if (numberOfRatings <= 0 || !averageRating || averageRating <= 0) {
    return {
      bonusCredits: 0,
      ratingScore: 0,
      effectiveVolumeFactor: 0,
      base: BASE_CREDITS,
      formula: 'No ratings available',
    };
  }

  // Rating Score: normalize to 0-1 scale (avgRating / 5)
  const ratingScore = averageRating / 5;

  // Effective Volume Factor: min(numberOfRatings / 50, 3)
  const effectiveVolumeFactor = Math.min(numberOfRatings / VOLUME_DIVISOR, MAX_VOLUME_FACTOR);

  // Calculate bonus credits: Base × Rating Score × Volume Factor
  const bonusCredits = BASE_CREDITS * ratingScore * effectiveVolumeFactor;

  // Round to 2 decimal places
  const roundedBonus = Math.round(bonusCredits * 100) / 100;

  return {
    bonusCredits: roundedBonus,
    ratingScore: Math.round(ratingScore * 100) / 100,
    effectiveVolumeFactor: Math.round(effectiveVolumeFactor * 100) / 100,
    base: BASE_CREDITS,
    numberOfRatings,
    averageRating,
    formula: `${BASE_CREDITS} × ${ratingScore.toFixed(2)} × ${effectiveVolumeFactor.toFixed(2)} = ${roundedBonus}`,
  };
};

/**
 * Check if a course has ended and is eligible for bonus credit calculation
 * @param {Date} endDate - Course end date
 * @param {boolean} bonusCreditsPaid - Whether bonus has already been paid
 * @returns {boolean} - Whether course is eligible for bonus credits
 */
export const isCourseEligibleForBonus = (endDate, bonusCreditsPaid) => {
  if (bonusCreditsPaid) {
    return false; // Already paid
  }

  if (!endDate) {
    return false; // No end date set
  }

  const now = new Date();
  const courseEndDate = new Date(endDate);

  return courseEndDate < now; // Course has ended
};

export default {
  calculateBonusCredits,
  isCourseEligibleForBonus,
  BASE_CREDITS,
  MAX_VOLUME_FACTOR,
  VOLUME_DIVISOR,
};
