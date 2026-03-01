/**
 * Check if the current date is before the course start date
 * Uploads are only allowed before the course starts
 * @param {string|Date} startDate - The course start date
 * @returns {boolean} - True if uploads are allowed (before start date)
 */
export const canUploadContent = (startDate) => {
  if (!startDate) return false;
  
  const courseStartDate = new Date(startDate);
  const today = new Date();
  
  // Reset time to compare dates only
  today.setHours(0, 0, 0, 0);
  courseStartDate.setHours(0, 0, 0, 0);
  
  return today < courseStartDate;
};

/**
 * Get a message explaining why uploads are disabled
 * @param {string|Date} startDate - The course start date
 * @returns {string} - Message explaining the restriction
 */
export const getUploadRestrictionMessage = (startDate) => {
  if (!startDate) return 'Course start date not set.';
  
  const courseStartDate = new Date(startDate);
  return `Uploads are disabled. The course started on ${courseStartDate.toLocaleDateString()}. Content can only be uploaded before the course start date.`;
};
