import { ApiService } from "../apiService";
import { UserService } from "./userService";
import { CourseService } from "./courseService";
import { MatchService } from "./matchService";
import { UserCourseService } from "./userCourseService";
import { StudentFilterService } from "./studentFilterService";

/**
 * Creates service instances with the provided API service
 * @param apiService 
 * @returns 
 */
export const createServices = (apiService: ApiService) => {
  return {
    userService: new UserService(apiService),
    courseService: new CourseService(apiService),
    matchService: new MatchService(apiService),
    userCourseService: new UserCourseService(apiService),
    studentFilterService: new StudentFilterService(apiService)
  };
};

export type Services = ReturnType<typeof createServices>;
export { UserService } from "./userService";
export { CourseService } from "./courseService";
export { MatchService } from "./matchService";
export { UserCourseService } from "./userCourseService";
export { StudentFilterService } from "./studentFilterService";