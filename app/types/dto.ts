// Define enums here instead of importing to avoid circular dependency
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

/**
 * DTO types that align with server-side DTOs
 */

// UserGetDTO
export interface UserGetDTO {
  id: number;
  name: string;
  email: string;
  status: UserStatus;
  token: string | null;
  creationDate: string;
  availability: UserAvailability | null;
  studyLevel: string | null;
  studyGoals: string | null;
  bio: string | null;
  profilePicture: string | null;
  knowledgeLevel: ProfileKnowledgeLevel | null;
  userCourses: UserCourseDTO[];
}

// Nested UserCourseDTO from UserGetDTO
export interface UserCourseDTO {
  courseId: number;
  courseName: string;
  knowledgeLevel: ProfileKnowledgeLevel;
}

// UserLoginDTO
export interface UserLoginDTO {
  email: string;
  password: string;
}

// UserPostDTO
export interface UserPostDTO {
  name: string;
  email: string;
  password: string;
  studyLevel: string | null;
  studyGoals: string[];
  profilePicture: string | null;
  bio: string | null;
  availability: UserAvailability | null;
  knowledgeLevel: ProfileKnowledgeLevel | null;
  courseSelections: CourseSelectionDTO[];
}

// UserPutDTO
export interface UserPutDTO {
  name?: string;
  bio?: string;
  profilePicture?: string;
  availability?: UserAvailability;
  studyLevel?: string;
  studyGoals?: string[]; 
  courseSelections?: CourseSelectionDTO[]; 
}

// CourseGetDTO
export interface CourseGetDTO {
  id: number;
  courseName: string;
}

// CoursePostDTO
export interface CoursePostDTO {
  courseIds: number[];
}

// CourseSelectionDTO
export interface CourseSelectionDTO {
  courseId: number;
  knowledgeLevel: ProfileKnowledgeLevel;
}

// MatchGetDTO
export interface MatchGetDTO {
  id: number;
  userId1: number;
  userId2: number;
  status: MatchStatus;
  likedByUser1: boolean;
  likedByUser2: boolean;
}

// MatchPostDTO
export interface MatchPostDTO {
  userId: number;
  targetUserId: number;
}