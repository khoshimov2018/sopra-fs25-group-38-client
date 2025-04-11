// Enum types to match server-side constants
export enum UserStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE"
}

export enum UserAvailability {
  MORNING = "MORNING",
  AFTERNOON = "AFTERNOON",
  EVENING = "EVENING"
}

export enum ProfileKnowledgeLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE", 
  ADVANCED = "ADVANCED"
}

export enum MatchStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED"
}

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
export { UserCourseDTO, UserLoginDTO, UserPostDTO, UserPutDTO, UserGetDTO } from './dto';