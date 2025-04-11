import { ApiService } from "../apiService";
import { UserCourse } from "@/types/user";
import { CourseSelectionDTO } from "@/types";

/**
 * Service for user-course relationship API calls
 * Aligns with the UserCourseRepository.java in the backend and related controller endpoints
 */
export class UserCourseService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Get user's courses
   * @param userId User ID
   * @returns List of user courses
   */
  async getUserCourses(userId: number): Promise<UserCourse[]> {
    return this.apiService.get<UserCourse[]>(`/users/${userId}/courses`);
  }

  /**
   * Update user's courses
   * @param userId User ID
   * @param courses Course selections with knowledge levels
   */
  async updateUserCourses(userId: number, courses: CourseSelectionDTO[]): Promise<void> {
    // Make sure we're using the proper property name matching UserPutDTO
    await this.apiService.put<void>(`/users/${userId}/courses`, { courses });
  }

  /**
   * Add courses to user
   * @param userId User ID
   * @param courseSelections Course selections with knowledge levels
   */
  async addCoursesToUser(userId: number, courseSelections: CourseSelectionDTO[]): Promise<void> {
    // Make sure we're using the proper property name matching UserPostDTO
    await this.apiService.post<void>(`/users/${userId}/courses`, { courseSelections });
  }

  /**
   * Delete a user's course enrollment
   * @param userId User ID
   * @param courseId Course ID
   */
  async deleteUserCourse(userId: number, courseId: number): Promise<void> {
    await this.apiService.delete<void>(`/users/${userId}/courses/${courseId}`);
  }

  /**
   * Get users enrolled in a specific course
   * @param courseId Course ID
   * @returns List of user IDs
   */
  async getUsersByCourse(courseId: number): Promise<number[]> {
    return this.apiService.get<number[]>(`/courses/${courseId}/users`);
  }
}