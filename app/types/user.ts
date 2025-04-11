// Import enums from dto to avoid circular dependency
import { UserStatus, UserAvailability, ProfileKnowledgeLevel, MatchStatus } from './dto';

// Re-export enums for backward compatibility
export { UserStatus, UserAvailability, ProfileKnowledgeLevel, MatchStatus };

// Internal User model (client-side representation)
export interface User {
  id: number | null;
  name: string | null;
  email: string | null;
  password?: string;
  token: string | null;
  chatToken?: string | null;
  status: UserStatus | null;
  creationDate?: string | null;
  studyLevel?: string | null;
  studyGoals?: string | null;
  knowledgeLevel?: ProfileKnowledgeLevel | null;
  availability?: UserAvailability | null;
  bio?: string | null;
  profilePicture?: string | null;
  userCourses?: UserCourse[]; 
  matchIds?: number[];
}

// Type for UserCourse in client model
export interface UserCourse {
  courseId: number;
  courseName: string;
  knowledgeLevel: ProfileKnowledgeLevel;
}

// Re-export from DTOs for backward compatibility
export type { UserCourseDTO, UserLoginDTO, UserPostDTO, UserPutDTO, UserGetDTO } from './dto';