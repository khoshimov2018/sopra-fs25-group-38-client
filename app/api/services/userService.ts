import { ApiService } from "../apiService";
import { User } from "@/types/user";
import { UserGetDTO, UserLoginDTO, UserPostDTO, UserPutDTO, CourseSelectionDTO } from "@/types";

/**
 * Service for user-related API calls
 * Aligns with the UserService.java in the backend
 */
export class UserService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }
  
  /**
   * Delete user account (self-deletion)
   * @returns void
   * @aligns with UserService.deleteUserByToken()
   */
  async deleteAccount(): Promise<void> {
    await this.apiService.delete<void>('/users/me');
  }

  /**
   * Get all users
   * @returns List of users
   * @aligns with UserService.getUsers()
   */
  async getUsers(): Promise<UserGetDTO[]> {
    return this.apiService.get<UserGetDTO[]>("/users");
  }

  /**
   * Get user by ID
   * @param userId User ID
   * @returns User data
   * @aligns with UserService.getUserById()
   */
  async getUserById(userId: number): Promise<UserGetDTO> {
    return this.apiService.get<UserGetDTO>(`/users/${userId}`);
  }

  /**
   * Login user
   * @param credentials Login credentials
   * @returns Logged in user with token
   * @aligns with UserService.loginUser()
   */
  async loginUser(credentials: UserLoginDTO): Promise<UserGetDTO> {
    return this.apiService.post<UserGetDTO>("/login", credentials);
  }

  /**
   * Logout user
   * @param userId User ID
   * @aligns with UserService.logoutUser()
   */
  async logoutUser(userId: number): Promise<void> {
    // Call the correct endpoint (/users/logout) which uses the token in the header
    await this.apiService.post<void>(`/users/logout`, {});
  }

  /**
   * Logout user using token
   * @aligns with UserService.logoutUserByToken()
   */
  async logoutUserByToken(): Promise<void> {
    await this.apiService.post<void>(`/users/logout`, {});
  }

  /**
   * Register new user
   * @param userData User registration data with course selections
   * @returns Created user
   * @aligns with UserService.createUser()
   */
  async createUser(userData: UserPostDTO): Promise<UserGetDTO> {
    return this.apiService.post<UserGetDTO>("/users/register", userData);
  }

  /**
   * Register new user (alias for backward compatibility)
   * @param userData User registration data
   * @returns Created user
   */
  async registerUser(userData: UserPostDTO): Promise<UserGetDTO> {
    return this.createUser(userData);
  }

  /**
   * Update user profile
   * @param userId User ID
   * @param userData Updated user data
   * @aligns with UserService.updateUser()
   */
  async updateUser(userId: number, userData: UserPutDTO): Promise<void> {
    await this.apiService.put<void>(`/users/${userId}`, userData);
  }

  /**
   * Get IDs of users that have matched with the specified user
   * @param userId User ID
   * @returns List of partner user IDs
   * @aligns with UserService.getAcceptedMatchPartnerIds()
   */
  async getAcceptedMatchPartnerIds(userId: number): Promise<number[]> {
    return this.apiService.get<number[]>(`/users/${userId}/accepted-matches`);
  }

  /**
   * Get accepted matches for a user (alias for backward compatibility)
   * @param userId User ID
   * @returns List of partner user IDs
   */
  async getAcceptedMatches(userId: number): Promise<number[]> {
    return this.getAcceptedMatchPartnerIds(userId);
  }

  /**
   * Get all match IDs for a user
   * @param userId User ID
   * @returns List of match IDs
   * @aligns with UserService.getMatchIdsForUser()
   */
  async getMatchIdsForUser(userId: number): Promise<number[]> {
    return this.apiService.get<number[]>(`/users/${userId}/matches`);
  }

  /**
   * Verify a user's authentication token
   * @param token Authentication token (raw token without Bearer prefix)
   * @returns User or null if not found
   * @aligns with UserService.authenticateByToken()
   */
  async authenticateByToken(token: string): Promise<UserGetDTO | null> {
    try {
      // Print token length and first few characters for debugging (not full token for security)
      const tokenPreview = token.substring(0, 10) + '...';
      const tokenLength = token.length;
      console.log(`Attempting to authenticate with token: ${tokenPreview} (length: ${tokenLength})`);
      
      // Try to get user info via /users/me endpoint
      // The token will be sent in the Authorization header by the apiService
      return await this.apiService.get<UserGetDTO>(`/users/me`);
    } catch (error) {
      console.error("Error authenticating token:", error);
      
      // Try an alternative approach if the /users/me endpoint fails
      try {
        // Make sure we have a token to work with
        if (!token || token.length < 10) {
          console.error("Invalid token format - too short or missing");
          return null;
        }
        
        // Strip 'Bearer ' prefix if it's still there
        const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
        
        // Try to decode the JWT token to extract the user ID
        const tokenParts = cleanToken.split('.');
        if (tokenParts.length === 3) {
          try {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log("Successfully decoded token payload:", payload);
            
            if (payload.sub || payload.id) {
              const userId = payload.sub || payload.id;
              console.log("Extracted user ID from token:", userId);
              
              // Try to get user by ID
              return await this.getUserById(Number(userId));
            } else {
              console.error("Token payload doesn't contain user ID (sub or id fields)");
            }
          } catch (parseError) {
            console.error("Failed to parse token payload:", parseError);
          }
        } else {
          console.error("Invalid JWT token format - doesn't have 3 parts separated by dots");
        }
      } catch (decodeError) {
        console.error("Failed to decode token:", decodeError);
      }
      
      return null;
    }
  }

  /**
   * Find user by token (alias for backward compatibility)
   * @param token Authentication token
   * @returns User or null if not found
   */
  async getUserByToken(token: string): Promise<UserGetDTO | null> {
    return this.authenticateByToken(token);
  }

  /**
   * Assign courses with knowledge levels to a user
   * @param userId User ID
   * @param courseSelections List of course selections with knowledge levels
   * @aligns with UserService.assignCoursesWithKnowledgeLevels()
   */
  async assignCoursesWithKnowledgeLevels(userId: number, courseSelections: CourseSelectionDTO[]): Promise<void> {
    await this.apiService.post<void>(`/users/${userId}/courses`, { courseSelections });
  }

  /**
   * Check if a token owner is authorized to modify a user
   * @param userId User ID to check authorization for
   * @returns True if authorized, throws error otherwise
   * @aligns with UserService.checkAuthorizationById()
   */
  async checkAuthorizationById(userId: number): Promise<boolean> {
    try {
      await this.apiService.get<void>(`/users/${userId}/authorize`);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if email exists
   * @param email Email to check
   * @returns True if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      await this.apiService.get<UserGetDTO>(`/users/check-email?email=${encodeURIComponent(email)}`);
      return true;
    } catch (error: any) {
      // Accept both 404 (Not Found) and 400 (Bad Request) as indications that the email doesn't exist
      if (error.status === 404 || error.status === 400) {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * Get the current authenticated user using the token from storage
   * @returns The current user or null if not authenticated
   */
  async getCurrentUser(): Promise<UserGetDTO | null> {
    try {
      // Get the current user using the /users/me endpoint
      // The token will be automatically included in headers by apiService
      return await this.apiService.get<UserGetDTO>('/users/me');
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
}