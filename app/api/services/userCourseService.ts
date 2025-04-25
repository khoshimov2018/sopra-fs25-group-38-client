import { ApiService } from "../apiService";
import { UserCourse } from "@/types/user";
import { CourseSelectionDTO } from "@/types";

export class UserCourseService {
  private readonly apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Get user's courses
   * @param userId 
   * @returns
   */
  async getUserCourses(userId: number): Promise<UserCourse[]> {
    return this.apiService.get<UserCourse[]>(`/users/${userId}/courses`);
  }

  /**
   * Update user's courses
   * @param userId
   * @param courses
   */
  async updateUserCourses(userId: number, courses: CourseSelectionDTO[]): Promise<void> {
    await this.apiService.put<void>(`/users/${userId}/courses`, { courses });
  }

  /**
   * Add courses to user
   * @param userId
   * @param courseSelections 
   */
  async addCoursesToUser(userId: number, courseSelections: CourseSelectionDTO[]): Promise<void> {
    await this.apiService.post<void>(`/users/${userId}/courses`, { courseSelections });
  }

  /**
   * Delete a user's course enrollment
   * @param userId 
   * @param courseId
   */
  async deleteUserCourse(userId: number, courseId: number): Promise<void> {
    await this.apiService.delete<void>(`/users/${userId}/courses/${courseId}`);
  }

  /**
   * Get users enrolled in a specific course
   * @param courseId
   * @returns 
   */
  async getUsersByCourse(courseId: number): Promise<number[]> {
    return this.apiService.get<number[]>(`/courses/${courseId}/users`);
  }
}