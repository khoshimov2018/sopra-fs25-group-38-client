import { ApiService } from "../apiService";
import { UserAvailability } from "@/types/dto";
import { UserGetDTO } from "@/types";

/**
 * Service for student filtering API calls
 * Aligns with the StudentFilterController.java in the backend
 */
export class StudentFilterService {
  private readonly apiService: ApiService;

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
    try {
      // For simplicity, just fetch all students first to avoid server errors
      console.log("Fetching all students and filtering client-side");
      const allStudents = await this.apiService.get<UserGetDTO[]>("/students");
      
      // If no filters, return all students
      if ((!courseIds || courseIds.length === 0) && (!availability || availability.length === 0)) {
        return allStudents;
      }
      
      // Otherwise, filter client-side
      return allStudents.filter(student => {
        // Course filter
        let passesCoursesFilter = true;
        if (courseIds && courseIds.length > 0) {
          // Check if student is enrolled in at least one of the courses
          const studentCourseIds = student.userCourses?.map(c => c.courseId) || [];
          passesCoursesFilter = courseIds.some(id => studentCourseIds.includes(id));
        }
        
        // Availability filter
        let passesAvailabilityFilter = true;
        if (availability && availability.length > 0) {
          // Check if student's availability matches any in the filter
          passesAvailabilityFilter = !student.availability || 
            availability.includes(student.availability);
        }
        
        // Return true if student passes both filters
        return passesCoursesFilter && passesAvailabilityFilter;
      });
    } catch (error) {
      console.error("Error in getFilteredStudents:", error);
      return []; // Return empty array on error
    }
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