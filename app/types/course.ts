// Interfaces for Course-related entities
import { UserCourse } from './user';

// Matches Course.java entity
export interface Course {
  id: number;
  courseName: string;
  userCourses?: UserCourse[];
}

// Re-export DTOs for backward compatibility
export { CourseGetDTO, CoursePostDTO, CourseSelectionDTO } from './dto';