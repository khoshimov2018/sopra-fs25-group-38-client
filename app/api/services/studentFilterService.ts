import { ApiService } from "../apiService";
import { UserAvailability } from "@/types/dto";
import { UserGetDTO } from "@/types";

/**
 * Service for student filtering API calls
 * Aligns with the StudentFilterController.java in the backend
 */
export class StudentFilterService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Get filtered students based on course IDs and availability
   * @param courseIds Optional list of course IDs
   * @param availability Optional list of availability options
   * @returns List of filtered users
   */
  async getFilteredStudents(
    courseIds?: number[],
    availability?: UserAvailability[]
  ): Promise<UserGetDTO[]> {
    // Build query parameters
    const params = new URLSearchParams();
    
    const hasCourses = courseIds && courseIds.length > 0;
    const hasAvailability = availability && availability.length > 0;

    // Add course IDs if provided
    if (hasCourses) {
      courseIds!.forEach(id => params.append("courseIds", id.toString()));

      // Automatically use matchAny if filtering ONLY by courses (and multiple selected)
      if (!hasAvailability && courseIds!.length > 1) {
        params.append("matchAny", "true");
      }
    }

    // Add availability if provided
    if (availability && availability.length > 0) {
      // Server expects each value as a separate parameter with the same name
      // e.g., availability=MORNING&availability=EVENING
      availability.forEach(avail => params.append('availability', avail.toString()));

    }

    // // Add course IDs if provided
    // if (courseIds && courseIds.length > 0) {
    //   courseIds.forEach(id => params.append('courseIds', id.toString()));
    // }
    
    // // Add availability if provided
    // if (availability && availability.length > 0) {
    //   availability.forEach(avail => params.append('availability', avail.toString()));
    // }

    // params.append('requireCourses', 'true');
    
    // Construct URL with query parameters
    const url = `/students${params.toString() ? '?' + params.toString() : ''}`;
    // No need to log the URL for every request
    return this.apiService.get<UserGetDTO[]>(url);
  }

  /**
   * Get students filtered by course IDs
   * @param courseIds List of course IDs
   * @returns List of filtered users
   */
  async getStudentsByCourses(courseIds: number[]): Promise<UserGetDTO[]> {
    if (!courseIds || courseIds.length === 0) {
      return [];
    }

    const params = new URLSearchParams();
    courseIds.forEach(id => params.append('courseIds', id.toString()));

    if (courseIds.length > 1) {
      params.append("matchAny", "true");
    }

    return this.apiService.get<UserGetDTO[]>(`/students?${params.toString()}`);
  }

  /**
   * Get students filtered by availability
   * @param availability List of availability options
   * @returns List of filtered users
   */
  async getStudentsByAvailability(availability: UserAvailability[]): Promise<UserGetDTO[]> {
    if (!availability || availability.length === 0) {
      return [];
    }

    const params = new URLSearchParams();
    availability.forEach(avail => params.append('availability', avail.toString()));
    return this.apiService.get<UserGetDTO[]>(`/students?${params.toString()}`);
  }
}