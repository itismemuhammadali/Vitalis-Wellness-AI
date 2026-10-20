/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth in string format (YYYY-MM-DD or ISO format)
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // If birthday hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format date of birth to display format
 * @param dateOfBirth - Date of birth in string format
 * @returns Formatted date string (e.g., "January 15, 2000")
 */
export const formatDateOfBirth = (dateOfBirth: string): string => {
  const date = new Date(dateOfBirth);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Validate date of birth format
 * @param dateOfBirth - Date of birth string to validate
 * @returns true if valid YYYY-MM-DD format, false otherwise
 */
export const isValidDateOfBirth = (dateOfBirth: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateOfBirth)) {
    return false;
  }
  
  const date = new Date(dateOfBirth);
  return date instanceof Date && !isNaN(date.getTime());
};
