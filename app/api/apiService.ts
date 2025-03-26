import { getApiDomain } from "@/utils/domain";
import { ApplicationError } from "@/types/error";

export class ApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = getApiDomain();
    
    // Initialize default headers - client should not set CORS headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    this.defaultHeaders = headers;
  }
  
  /**
   * Get the current headers, including any auth token
   * This ensures we always use the latest token from localStorage
   */
  private getHeaders(): HeadersInit {
    // Create a new headers object starting with the default headers
    const headers: Record<string, string> = { ...this.defaultHeaders as Record<string, string> };
    
    // Add auth token if available - gets fresh token each time
    if (typeof window !== 'undefined') {
      const tokenStr = localStorage.getItem("token");
      if (tokenStr) {
        try {
          // First try to parse it in case it's JSON (older storage format)
          let token = tokenStr;
          try {
            const parsed = JSON.parse(tokenStr);
            if (typeof parsed === 'string') {
              token = parsed;
            }
          } catch {
            // Not JSON, use as is
          }
          
          // Don't log the full token for security reasons
          const displayToken = token.substring(0, 8) + '...';
          console.log("Using token for API request:", displayToken);
          headers["Authorization"] = `Bearer ${token}`;
        } catch (error) {
          console.error("Error processing token:", error);
          // Fallback to using token directly
          headers["Authorization"] = `Bearer ${tokenStr}`;
        }
      } else {
        console.log("No token found in localStorage");
      }
    }
    
    return headers;
  }

  /**
   * Helper function to check the response, parse JSON,
   * and throw an error if the response is not OK.
   *
   * @param res - The response from fetch.
   * @param errorMessage - A descriptive error message for this call.
   * @returns Parsed JSON data.
   * @throws ApplicationError if res.ok is false.
   */
  private async processResponse<T>(
    res: Response,
    errorMessage: string,
  ): Promise<T> {
    console.log(`Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      let errorDetail = res.statusText;
      let errorBody = null;
      
      try {
        // Clone the response before parsing to avoid consuming it
        const clonedRes = res.clone();
        const responseText = await clonedRes.text();
        console.log(`Error response body: ${responseText}`);
        
        try {
          errorBody = JSON.parse(responseText);
          if (errorBody?.message) {
            errorDetail = errorBody.message;
          } else {
            errorDetail = JSON.stringify(errorBody);
          }
        } catch (error) {
          console.error("Error parsing response JSON:", error);
          errorDetail = responseText || res.statusText;
        }
      } catch (textError) {
        console.error("Error reading response text:", textError);
        // If reading text fails, keep using res.statusText
      }
      
      const detailedMessage = `${errorMessage} (${res.status}: ${errorDetail})`;
      
      // Only log unexpected errors as errors, log expected errors as info
      if (res.status === 404 || res.status === 401 || res.status === 403) {
        // These are expected errors in normal app flow
        console.info("API Response:", detailedMessage);
      } else {
        // Unexpected errors should still be logged as errors
        console.error("API Error:", detailedMessage);
      }
      
      const error: ApplicationError = new Error(
        detailedMessage,
      ) as ApplicationError;
      error.info = JSON.stringify(
        { status: res.status, statusText: res.statusText, body: errorBody },
        null,
        2,
      );
      error.status = res.status;
      throw error;
    }
    
    try {
      // Check if response is empty
      const text = await res.text();
      if (!text || text.trim() === '') {
        console.log("Server returned empty response body");
        return {} as T;
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(text);
        console.log("API response data:", data);
        return data as T;
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        console.log("Raw response text:", text);
        // Return empty object instead of throwing if we got a successful response
        // but couldn't parse the JSON (may be empty or non-JSON)
        if (res.ok) {
          return {} as T;
        }
        throw new Error(`Failed to parse API response: ${error}`);
      }
    } catch (textError) {
      console.error("Error reading response text:", textError);
      if (res.ok) {
        // If response is OK but we couldn't read the text, return empty object
        return {} as T;
      }
      throw new Error(`Failed to read API response: ${textError}`);
    }
  }

  /**
   * GET request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @returns JSON data of type T.
   */
  public async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making GET request to: ${url}`);
    const headers = this.getHeaders();
    
    try {
      const res = await fetch(url, {
        method: "GET",
        headers: headers,
        // Properly configured fetch options
        mode: 'cors',
        credentials: 'omit', // Don't send or receive cookies
        cache: 'no-cache',
        redirect: 'follow',
      });
      
      return this.processResponse<T>(
        res,
        "An error occurred while fetching the data.\n",
      );
    } catch (error) {
      console.error(`Network error when fetching from ${url}:`, error);
      throw new Error(`Network error: Unable to connect to server at ${url}. Please check your connection.`);
    }
  }

  /**
   * POST request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param data - The payload to post.
   * @returns JSON data of type T.
   */
  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making POST request to: ${url}`);
    const headers = this.getHeaders();
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data),
        // Properly configured fetch options
        mode: 'cors',
        credentials: 'omit', // Don't send or receive cookies
        cache: 'no-cache',
        redirect: 'follow',
      });
      
      return this.processResponse<T>(
        res,
        "An error occurred while posting the data.\n",
      );
    } catch (error) {
      console.error(`Network error when posting to ${url}:`, error);
      throw new Error(`Network error: Unable to connect to server at ${url}. Please check your connection.`);
    }
  }

  /**
   * PUT request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param data - The payload to update.
   * @returns JSON data of type T.
   */
  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making PUT request to: ${url}`);
    const headers = this.getHeaders();
    
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(data),
        // Properly configured fetch options
        mode: 'cors',
        credentials: 'omit', // Don't send or receive cookies
        cache: 'no-cache',
        redirect: 'follow',
      });
      
      // Check if the response is empty
      const contentType = res.headers.get('content-type');
      if (res.status === 204 || !contentType || !contentType.includes('application/json')) {
        console.log("Server returned no content or non-JSON response:", res.status);
        // For 204 No Content responses, just return an empty success object
        return {} as T;
      }
      
      return this.processResponse<T>(
        res,
        "An error occurred while updating the data.\n",
      );
    } catch (error) {
      console.error(`Network error when updating ${url}:`, error);
      throw new Error(`Network error: Unable to connect to server at ${url}. Please check your connection.`);
    }
  }

  /**
   * DELETE request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @returns JSON data of type T.
   */
  public async delete<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log(`Making DELETE request to: ${url}`);
    const headers = this.getHeaders();
    
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: headers,
        // Properly configured fetch options
        mode: 'cors',
        credentials: 'omit', // Don't send or receive cookies
        cache: 'no-cache',
        redirect: 'follow',
      });
      
      return this.processResponse<T>(
        res,
        "An error occurred while deleting the data.\n",
      );
    } catch (error) {
      console.error(`Network error when deleting from ${url}:`, error);
      throw new Error(`Network error: Unable to connect to server at ${url}. Please check your connection.`);
    }
  }
}
