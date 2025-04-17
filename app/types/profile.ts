import { User, UserAvailability, ProfileKnowledgeLevel } from './user';
import { CourseSelectionDTO } from './course';

// Matches Profile.java entity
export interface Profile {
  id?: number;
  userId: number;
  knowledgeLevel?: ProfileKnowledgeLevel;
  studyGoals?: string;
  bio?: string;
}

// Extended profile for the UI
export interface UserProfile extends User {
  goal?: string; 
  tags?: string[];
  // Legacy profile structure
  studyLevels?: {
    subject: string;
    grade: string;
    level: string;
  }[];
  // Align with server-side structure
  courseSelections?: CourseSelectionDTO[];
  profileImage?: string;
}

// Aligned with UserPutDTO
export interface ProfileUpdate {
  name?: string;
  bio?: string;
  profilePicture?: string;
  availability?: UserAvailability;
  studyLevel?: string;
  studyGoals?: string[];
  courseSelections: CourseSelectionDTO[];
}