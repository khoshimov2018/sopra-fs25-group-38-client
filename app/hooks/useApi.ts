import { ApiService } from "@/api/apiService";
import { createServices, Services } from "@/api/services";
import { useMemo } from "react";

// Create a single instance of ApiService to be reused
let apiServiceInstance: ApiService | null = null;
let servicesInstance: Services | null = null;

/**
 * Custom hook that provides access to the API service and specialized service classes
 * @returns ApiService instance and specialized service objects
 */
export const useApi = () => {
  return useMemo(() => {
    try {
      // Initialize the shared instance if it doesn't exist
      if (!apiServiceInstance) {
        console.log("Creating new ApiService instance");
        apiServiceInstance = new ApiService();
        
        if (!apiServiceInstance) {
          throw new Error("Failed to create ApiService instance");
        }
        
        servicesInstance = createServices(apiServiceInstance);
        
        if (!servicesInstance) {
          throw new Error("Failed to create service instances");
        }
      } else {
        console.log("Reusing existing ApiService instance");
      }
      
      // Return both the base service and specialized services
      return {
        // Return the base API service
        apiService: apiServiceInstance,
        // Return all specialized services
        ...servicesInstance
      };
    } catch (error) {
      console.error("Error in useApi hook:", error);
      
      // Return empty objects to prevent null reference errors
      return {
        apiService: new ApiService(),
        userService: null,
        courseService: null,
        matchService: null,
        userCourseService: null,
        studentFilterService: null
      };
    }
  }, []); 
};
