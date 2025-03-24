/**
 * Format a date string to a more user-friendly format
 * @param dateStr - Date string (ISO format or any valid date string)
 * @param includeTime - Whether to include time in the formatted string (default: false)
 * @returns Formatted date string
 */
export function formatDate(dateStr: string, includeTime = false): string {
  if (!dateStr) return "N/A";
  
  try {
    const date = new Date(dateStr);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    
    // Format options
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    // Add time formatting if requested
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    // Format the date
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date format";
  }
}