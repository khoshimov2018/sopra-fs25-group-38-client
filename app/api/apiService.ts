import { getApiDomain } from "@/utils/domain";
import { ApplicationError } from "@/types/error";

export class ApiService {
  private readonly baseURL: string;
  private readonly defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = getApiDomain();
  
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    this.defaultHeaders = headers;
  }
  
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = { ...this.defaultHeaders as Record<string, string> };

  
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
   * @param res 
   * @param errorMessage
   * @returns 
   * @throws 
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
   * @param res 
   * @param errorMessage 
   * @returns
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
   * @param res 
   * @returns
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
   * @param responseText 
   * @returns 
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
   * @param statusCode 
   * @returns
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
   * @param statusCode 
   * @param message 
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
   * @param res 
   * @returns 
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
   * @param text 
   * @param isOk
   * @returns
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
   * @param endpoint
   * @returns 
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
   * @param endpoint
   * @param data
   * @returns
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
   * @param endpoint 
   * @param data 
   * @returns 
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
   * @param endpoint 
   * @returns 
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
