import { ApiService } from "../apiService";
import { CourseGetDTO, CoursePostDTO, CourseSelectionDTO } from "@/types/dto";
import { UserAvailability } from "@/types/user";

/**
 * Service for course-related API calls
 * Aligns with the CourseService.java and CourseController.java in the backend
 */
export class CourseService {
  private readonly apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Get all courses
   * @returns List of courses
   * @aligns with CourseService.getAllCourses()
   */
  async getAllCourses(): Promise<CourseGetDTO[]> {
    return this.apiService.get<CourseGetDTO[]>("/courses");
  }

  /**
   * Get all courses (alias for backward compatibility)
   * @returns List of courses
   */
  async getCourses(): Promise<CourseGetDTO[]> {
    return this.getAllCourses();
  }

  /**
   * Get course by ID
   * @param courseId Course ID
   * @returns Course data
   */
  async getCourseById(courseId: number): Promise<CourseGetDTO> {
    return this.apiService.get<CourseGetDTO>(`/courses/${courseId}`);
  }

  /**
   * Get course by name
   * @param courseName Course name
   * @returns Course data or null if not found
   */
  async getCourseByName(courseName: string): Promise<CourseGetDTO | null> {
    try {
      return await this.apiService.get<CourseGetDTO>(`/courses/by-name?name=${encodeURIComponent(courseName)}`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Find user IDs enrolled in all of the specified courses
   * @param courseIds List of course IDs
   * @returns List of user IDs
   * @aligns with CourseService.findUserIdsEnrolledInAllCourses()
   */
  async findUserIdsEnrolledInAllCourses(courseIds: number[]): Promise<number[]> {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }
    
    const queryParams = courseIds.map(id => `courseIds=${id}`).join('&');
    return this.apiService.get<number[]>(`/courses/filter/users?${queryParams}`);
  }

  /**
   * Get user IDs enrolled in specific courses (alias for backward compatibility)
   * @param courseIds List of course IDs
   * @returns List of user IDs
   */
  async getUsersEnrolledInCourses(courseIds: number[]): Promise<number[]> {
    return this.findUserIdsEnrolledInAllCourses(courseIds);
  }

  /**
   * Find user IDs with the specified availability preferences
   * @param availability List of availability options
   * @returns List of user IDs
   * @aligns with CourseService.findUserIdsEnrolledInAllAvailability()
   */
  async findUserIdsWithAvailability(availability: UserAvailability[]): Promise<number[]> {
    if (!availability || availability.length === 0) {
      return [];
    }
    
    const queryParams = availability.map(a => `availability=${a}`).join('&');
    return this.apiService.get<number[]>(`/courses/filter/availability?${queryParams}`);
  }

  /**
   * Get user IDs with specific availability (alias for backward compatibility)
   * @param availability List of availability options
   * @returns List of user IDs
   */
  async getUsersByAvailability(availability: UserAvailability[]): Promise<number[]> {
    return this.findUserIdsWithAvailability(availability);
  }

  /**
   * Add courses to user
   * @param userId User ID
   * @param courseIds List of course IDs
   */
  async addCoursesToUser(userId: number, courseIds: number[]): Promise<void> {
    const coursePostDTO: CoursePostDTO = { courseIds };
    await this.apiService.post<void>(`/users/${userId}/courses/batch`, coursePostDTO);
  }

  /**
   * Add courses with knowledge levels to user
   * @param userId User ID
   * @param courseSelections List of course selections with knowledge levels
   */
  async addCoursesWithKnowledgeLevels(userId: number, courseSelections: CourseSelectionDTO[]): Promise<void> {
    await this.apiService.post<void>(`/users/${userId}/courses`, { courseSelections });
  }
}