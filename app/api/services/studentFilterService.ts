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
   * @param knowledgeLevel Optional knowledge level filter
   * @returns List of filtered users
   */
  async getFilteredStudents(
    courseIds?: number[],
    availability?: UserAvailability[],
    knowledgeLevel?: string
  ): Promise<UserGetDTO[]> {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add course IDs if provided
    if (courseIds && courseIds.length > 0) {
      courseIds.forEach(id => params.append('courseIds', id.toString()));
    }
    
    // Add availability if provided
    if (availability && availability.length > 0) {
      availability.forEach(avail => params.append('availability', avail.toString()));
    }
    
    // Add knowledge level if provided
    if (knowledgeLevel) {
      params.append('knowledgeLevel', knowledgeLevel);
    }
    
    // Construct URL with query parameters
    const url = `/students${params.toString() ? '?' + params.toString() : ''}`;
    
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