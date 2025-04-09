export interface User {
  id: string | null;
  name: string | null;
  email: string | null;
  token: string | null;
  status: string | null;
  creationDate?: string | null;
  birthday?: string | null;
  studyLevel?: string | null;
  studyGoals?: string | null;
  knowledgeLevel?: string | null;
  availability?: string | null;
  bio?: string | null;
  profilePicture?: string | null;
  userCourses?: UserCourse[];
}

export interface UserCourse {
  id?: number;
  courseId?: number;
  courseName?: string;
  knowledgeLevel?: string;
}

export interface CourseSelection {
  courseId: number;
  knowledgeLevel: string;
}