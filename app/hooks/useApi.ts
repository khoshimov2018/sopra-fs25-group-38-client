import { ApiService } from "@/api/apiService";
import { useMemo } from "react";

// Create a single instance of ApiService to be reused
let apiServiceInstance: ApiService | null = null;

export const useApi = () => {
  return useMemo(() => {
    // Initialize the shared instance if it doesn't exist
    if (!apiServiceInstance) {
      console.log("Creating new ApiService instance");
      apiServiceInstance = new ApiService();
    } else {
      console.log("Reusing existing ApiService instance");
    }
    
    return apiServiceInstance;
  }, []); 
};
