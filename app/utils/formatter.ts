/**
 * Utility functions for formatting data between client and server
 */

/**
 * Parses a comma-separated string of study goals into an array
 * Aligns with the DTOMapper.java implementation (String.join(",", goals))
 * 
 * @param goalsString Comma-separated string of study goals
 * @returns Array of study goals
 */
export function parseStudyGoals(goalsString: string | null): string[] {
  if (!goalsString) {
    return [];
  }
  
  return goalsString.split(',').map(goal => goal.trim()).filter(Boolean);
}

/**
 * Joins an array of study goals into a comma-separated string
 * Aligns with the DTOMapper.java implementation
 * 
 * @param goals Array of study goals
 * @returns Comma-separated string of study goals
 */
export function formatStudyGoals(goals: string[]): string {
  if (!goals || goals.length === 0) {
    return '';
  }
  
  return goals.join(',');
}