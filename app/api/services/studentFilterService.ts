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
   * @param courseIds
   * @param availability
   * @returns
   */
  async getFilteredStudents(
    courseIds?: number[],
    availability?: UserAvailability[]
  ): Promise<UserGetDTO[]> {
    try {
      console.log("Fetching all students and filtering client-side");
      const allStudents = await this.apiService.get<UserGetDTO[]>("/students");
      
      if ((!courseIds || courseIds.length === 0) && (!availability || availability.length === 0)) {
        return allStudents;
      }
      
      return allStudents.filter(student => {
        let passesCoursesFilter = true;
        if (courseIds && courseIds.length > 0) {
          const studentCourseIds = student.userCourses?.map(c => c.courseId) || [];
          passesCoursesFilter = courseIds.some(id => studentCourseIds.includes(id));
        }
        
        let passesAvailabilityFilter = true;
        if (availability && availability.length > 0) {
          passesAvailabilityFilter = !student.availability || 
            availability.includes(student.availability);
        }
        
        return passesCoursesFilter && passesAvailabilityFilter;
      });
    } catch (error) {
      console.error("Error in getFilteredStudents:", error);
      return []; // Return empty array on error
    }
  }

  /**
   * Get students filtered by course IDs
   * @param courseIds
   * @returns 
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
   * @param availability 
   * @returns
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