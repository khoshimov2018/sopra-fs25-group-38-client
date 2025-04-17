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
   * Aligns with the security setup in the server (JWT token in Authorization header)
   */
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = { ...this.defaultHeaders as Record<string, string> };

    // Only browser can access localStorage
    if (typeof window === 'undefined') {
      return headers;
    }

    const tokenStr = localStorage.getItem('token');
    if (!tokenStr) {
      this.logNoToken();
      return headers;
    }

    const auth = this.buildAuthHeader(tokenStr);
    if (auth) {
      headers['Authorization'] = auth;
    }

    return headers;
  }

  private buildAuthHeader(tokenStr: string): string | null {
    try {
      const raw = this.extractRawToken(tokenStr);
      const bearer = raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
      this.logToken(bearer);
      return bearer;
    } catch (err) {
      // fallback to prefixing the original string
      const fallback = tokenStr.startsWith('Bearer ') ? tokenStr : `Bearer ${tokenStr}`;
      console.error('Error processing token, using fallback format:', err);
      this.logToken(fallback, true);
      return fallback;
    }
  }

  private extractRawToken(tokenStr: string): string {
    try {
      const parsed = JSON.parse(tokenStr);
      if (typeof parsed === 'string') {
        return parsed;
      }
      if (parsed && typeof (parsed as any).token === 'string') {
        return (parsed as any).token;
      }
    } catch {
      // not JSON, use as-is
    }
    return tokenStr;
  }

  private logToken(token: string, isFallback = false): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    const display = token.substring(0, 20) + '...';
    const prefix = isFallback ? 'Using fallback token format:' : 'Using token for API request:';
    console.log(prefix, display);
  }

  private logNoToken(): void {
    console.log('No token found in localStorage');
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
      let errorBody: any = null;
      
      try {
        // Clone the response before parsing to avoid consuming it
        const clonedRes = res.clone();
        const responseText = await clonedRes.text();
        console.log(`Error response body: ${responseText}`);
        
        try {
          // Only try to parse if there's actual content
          if (responseText && responseText.trim() !== '') {
            errorBody = JSON.parse(responseText);
            if (errorBody?.message) {
              errorDetail = errorBody.message;
            } else {
              errorDetail = JSON.stringify(errorBody);
            }
          } else {
            // Handle empty response with better error message
            console.log("Empty error response body");
            // Use status code to provide more informative messages
            switch (res.status) {
              case 400:
                errorDetail = "Bad Request - Invalid input data";
                break;
              case 401:
                errorDetail = "Unauthorized - Authentication required";
                break;
              case 403:
                errorDetail = "Forbidden - Insufficient permissions";
                break;
              case 404:
                errorDetail = "Not Found - Resource does not exist";
                break;
              case 409:
                errorDetail = "Conflict - Resource already exists";
                break;
              case 500:
                errorDetail = "Server Error - Please try again later";
                break;
              default:
                errorDetail = res.statusText || `HTTP Error ${res.status}`;
            }
          }
        } catch (error) {
          console.error("Error parsing response JSON:", error);
          errorDetail = responseText || res.statusText || "Unknown error";
        }
      } catch (textError) {
        console.error("Error reading response text:", textError);
        // If reading text fails, provide meaningful fallback message
        errorDetail = `Failed to read error details (${res.status})`;
      }
      
      const detailedMessage = `${errorMessage} (${res.status}: ${errorDetail})`;
      
      // Only log unexpected errors as errors, log expected errors as info
      if ([401, 403, 404].includes(res.status)) {
        console.info("API Response:", detailedMessage);
      } else {
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
          console.log("Response was OK but couldn't parse JSON - returning empty object");
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
        headers,
        mode: 'cors',
        credentials: 'omit',
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
    
    console.log("Request headers:", JSON.stringify(headers, null, 2));
    console.log("Request payload:", JSON.stringify(data, null, 2));
    
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit',
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
    
    console.log("PUT request payload:", JSON.stringify(data, null, 2));
    
    try {
      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-cache',
        redirect: 'follow',
      });
      
      const contentType = res.headers.get('content-type');
      if (res.status === 204 || !contentType || !contentType.includes('application/json')) {
        console.log("Server returned no content or non-JSON response:", res.status);
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
        headers,
        mode: 'cors',
        credentials: 'omit',
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
