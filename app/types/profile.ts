import { User, UserCourse } from './user';

/**
 * UserProfile interface represents the client-side model of a user profile
 * Extends the base User interface with profile-specific fields
 * Aligns with backend User entity structure and handles data format differences between client/server
 */
export interface UserProfile extends User {
  // Study-related fields
  studyLevel?: string;
  /** 
   * Server stores study goals as a comma-separated string
   * But client uses array representation for UI components
   */
  studyGoals?: string; 
  knowledgeLevel?: string;
  userCourses?: UserCourse[];
  
  // Added study style field
  studyStyle?: string;

  // Profile fields
  bio?: string;
  profilePicture?: string;
  availability?: string;
  /** 
   * Birthday in ISO format (YYYY-MM-DD) 
   */
  birthday?: string;

  /**
   * Client-side representation of studyGoals as string array
   * Used for UI components (Select with multiple mode)
   * When sending to server, we join this array with commas
   */
  formattedStudyGoals?: string[];
}