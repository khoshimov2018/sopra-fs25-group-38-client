import { getApiDomain } from "@/utils/domain";
import { ApplicationError } from "@/types/error";

export class ApiService {
  private readonly baseURL: string;
  private readonly defaultHeaders: HeadersInit;

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
      if (parsed && typeof parsed === 'object' && 'token' in parsed && typeof parsed.token === 'string') {
        return parsed.token;
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
      const error = await this.handleErrorResponse(res, errorMessage);
      throw error;
    }
    
    return this.parseSuccessResponse<T>(res);
  }
  
  /**
   * Handle error response from API
   * @param res Response object
   * @param errorMessage Base error message
   * @returns ApplicationError to be thrown
   */
  private async handleErrorResponse(
    res: Response, 
    errorMessage: string
  ): Promise<ApplicationError> {
    const { errorDetail, errorBody } = await this.extractErrorDetails(res);
    const detailedMessage = `${errorMessage} (${res.status}: ${errorDetail})`;
    
    this.logErrorResponse(res.status, detailedMessage);
    
    const error: ApplicationError = new Error(detailedMessage) as ApplicationError;
    error.info = JSON.stringify(
      { status: res.status, statusText: res.statusText, body: errorBody },
      null,
      2
    );
    error.status = res.status;
    
    return error;
  }
  
  /**
   * Extract error details from an error response
   * @param res Response object
   * @returns Error detail message and parsed error body
   */
  private async extractErrorDetails(res: Response): Promise<{ errorDetail: string, errorBody: any }> {
    let errorBody: any = null;
    let finalErrorDetail: string;
    
    try {
      const clonedRes = res.clone();
      const responseText = await clonedRes.text();
      console.log(`Error response body: ${responseText}`);
      
      if (responseText && responseText.trim() !== '') {
        const result = this.parseErrorResponseText(responseText);
        errorBody = result.errorBody;
        finalErrorDetail = result.errorDetail;
      } else {
        finalErrorDetail = this.getStatusCodeErrorMessage(res.status);
      }
    } catch (textError) {
      console.error("Error reading response text:", textError);
      finalErrorDetail = `Failed to read error details (${res.status})`;
    }
    
    return { errorDetail: finalErrorDetail, errorBody };
  }
  
  /**
   * Parse error response text
   * @param responseText Response text to parse
   * @returns Parsed error body and detail message
   */
  private parseErrorResponseText(responseText: string): { errorBody: any, errorDetail: string } {
    let errorBody = null;
    let parsedErrorDetail: string;
    
    try {
      errorBody = JSON.parse(responseText);
      if (errorBody?.message) {
        parsedErrorDetail = errorBody.message;
      } else {
        parsedErrorDetail = JSON.stringify(errorBody);
      }
    } catch (error) {
      console.error("Error parsing response JSON:", error);
      parsedErrorDetail = responseText;
    }
    
    return { errorBody, errorDetail: parsedErrorDetail };
  }
  
  /**
   * Get appropriate error message based on status code
   * @param statusCode HTTP status code
   * @returns Human-readable error message
   */
  private getStatusCodeErrorMessage(statusCode: number): string {
    const statusMessages: Record<number, string> = {
      400: "Bad Request - Invalid input data",
      401: "Unauthorized - Authentication required",
      403: "Forbidden - Insufficient permissions",
      404: "Not Found - Resource does not exist",
      409: "Conflict - Resource already exists",
      500: "Server Error - Please try again later"
    };
    
    return statusMessages[statusCode] || `HTTP Error ${statusCode}`;
  }
  
  /**
   * Log error response appropriately based on status code
   * @param statusCode HTTP status code
   * @param message Error message to log
   */
  private logErrorResponse(statusCode: number, message: string): void {
    if ([401, 403, 404].includes(statusCode)) {
      console.info("API Response:", message);
    } else {
      console.error("API Error:", message);
    }
  }
  
  /**
   * Parse successful response body
   * @param res Response object
   * @returns Parsed response data
   */
  private async parseSuccessResponse<T>(res: Response): Promise<T> {
    try {
      const text = await res.text();
      
      if (!text || text.trim() === '') {
        console.log("Server returned empty response body");
        return {} as T;
      }
      
      return this.parseJsonResponseText<T>(text, res.ok);
    } catch (textError) {
      console.error("Error reading response text:", textError);
      if (res.ok) {
        return {} as T;
      }
      throw new Error(`Failed to read API response: ${textError}`);
    }
  }
  
  /**
   * Parse JSON response text
   * @param text Response text to parse
   * @param isOk Whether the response status was OK
   * @returns Parsed JSON data
   */
  private parseJsonResponseText<T>(text: string, isOk: boolean): T {
    try {
      const data = JSON.parse(text);
      console.log("API response data:", data);
      return data as T;
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      console.log("Raw response text:", text);
      
      if (isOk) {
        console.log("Response was OK but couldn't parse JSON - returning empty object");
        return {} as T;
      }
      throw new Error(`Failed to parse API response: ${error}`);
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
      
      if (res.status === 204 || !res.headers.get('content-type')?.includes('application/json')) {
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
