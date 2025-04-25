import { ApiService } from "../apiService";
import { User } from "@/types/user";
import { UserGetDTO, UserLoginDTO, UserPostDTO, UserPutDTO, CourseSelectionDTO } from "@/types";
export class UserService {
  private readonly apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }
  
  /**
   * Delete user account (self-deletion)
   * @returns
   * @aligns
   */
  async deleteAccount(): Promise<void> {
    await this.apiService.delete<void>('/users/me');
  }

  /**
   * Get all users
   * @returns
   * @aligns 
   */
  async getUsers(): Promise<UserGetDTO[]> {
    return this.apiService.get<UserGetDTO[]>("/users");
  }

  /**
   * Get user by ID
   * @param userId
   * @returns 
   * @aligns
   */
  async getUserById(userId: number): Promise<UserGetDTO> {
    return this.apiService.get<UserGetDTO>(`/users/${userId}`);
  }

  /**
   * Login user
   * @param credentials 
   * @returns 
   * @aligns 
   */
  async loginUser(credentials: UserLoginDTO): Promise<UserGetDTO> {
    return this.apiService.post<UserGetDTO>("/login", credentials);
  }

  /**
   * Logout user
   * @param userId
   * @aligns
   */
  async logoutUser(userId: number): Promise<void> {
    await this.apiService.post<void>(`/users/logout`, {});
  }

  /**
   * Logout user using token
   * @aligns
   */
  async logoutUserByToken(): Promise<void> {
    await this.apiService.post<void>(`/users/logout`, {});
  }

  /**
   * Register new user
   * @param userData 
   * @returns 
   * @aligns 
   */
  async createUser(userData: UserPostDTO): Promise<UserGetDTO> {
    return this.apiService.post<UserGetDTO>("/users/register", userData);
  }

  /**
   * Register new user (alias for backward compatibility)
   * @param userData 
   * @returns 
   */
  async registerUser(userData: UserPostDTO): Promise<UserGetDTO> {
    return this.createUser(userData);
  }

  /**
   * Update user profile
   * @param userId 
   * @param userData 
   * @aligns 
   */
  async updateUser(userId: number, userData: UserPutDTO): Promise<void> {
    await this.apiService.put<void>(`/users/${userId}`, userData);
  }

  /**
   * Get IDs of users that have matched with the specified user
   * @param userId 
   * @returns 
   * @aligns 
   */
  async getAcceptedMatchPartnerIds(userId: number): Promise<number[]> {
    return this.apiService.get<number[]>(`/users/${userId}/accepted-matches`);
  }

  /**
   * Get accepted matches for a user (alias for backward compatibility)
   * @param userId 
   * @returns 
   */
  async getAcceptedMatches(userId: number): Promise<number[]> {
    return this.getAcceptedMatchPartnerIds(userId);
  }

  /**
   * Get all match IDs for a user
   * @param userId 
   * @returns 
   * @aligns 
   */
  async getMatchIdsForUser(userId: number): Promise<number[]> {
    return this.apiService.get<number[]>(`/users/${userId}/matches`);
  }

  /**
   * Verify a user's authentication token
   * @param token 
   * @returns 
   * @aligns
   */
  async authenticateByToken(token: string): Promise<UserGetDTO | null> {
    try {
      return await this.authenticateWithEndpoint(token);
    } catch (error) {
      console.error("Error authenticating token:", error);
      return this.authenticateWithTokenDecode(token);
    }
  }

  /**
   * Helper method to authenticate using the /users/me endpoint
   * @param token
   * @returns 
   * @private
   */
  private async authenticateWithEndpoint(token: string): Promise<UserGetDTO> {
   
    const tokenPreview = token.substring(0, 10) + '...';
    const tokenLength = token.length;
    console.log(`Attempting to authenticate with token: ${tokenPreview} (length: ${tokenLength})`);
    return await this.apiService.get<UserGetDTO>(`/users/me`);
  }

  /**
   * Helper method to authenticate by decoding the JWT token
   * @param token 
   * @returns 
   * @private
   */
  private async authenticateWithTokenDecode(token: string): Promise<UserGetDTO | null> {
    if (!this.isValidTokenFormat(token)) {
      return null;
    }
    
    const cleanToken = this.cleanTokenString(token);
    const userId = this.extractUserIdFromToken(cleanToken);
    
    if (!userId) {
      return null;
    }
    
    try {
      return await this.getUserById(Number(userId));
    } catch (error) {
      console.error("Failed to get user by ID extracted from token:", error);
      return null;
    }
  }

  /**
   * Check if token has valid format
   * @param token 
   * @returns 
   * @private
   */
  private isValidTokenFormat(token: string): boolean {
    if (!token || token.length < 10) {
      console.error("Invalid token format - too short or missing");
      return false;
    }
    return true;
  }

  /**
   * Remove Bearer prefix from token if present
   * @param token 
   * @returns 
   * @private
   */
  private cleanTokenString(token: string): string {
    return token.startsWith('Bearer ') ? token.substring(7) : token;
  }

  /**
   * Extract user ID from JWT token
   * @param token 
   * @returns 
   * @private
   */
  private extractUserIdFromToken(token: string): string | null {
    const tokenParts = token.split('.');
    
    if (tokenParts.length !== 3) {
      console.error("Invalid JWT token format - doesn't have 3 parts separated by dots");
      return null;
    }
    
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      console.log("Successfully decoded token payload:", payload);
      
      if (payload.sub ?? payload.id) {
        const userId = payload.sub ?? payload.id;
        console.log("Extracted user ID from token:", userId);
        return userId;
      } 
      
      console.error("Token payload doesn't contain user ID (sub or id fields)");
      return null;
    } catch (parseError) {
      console.error("Failed to parse token payload:", parseError);
      return null;
    }
  }

  /**
   * Find user by token (alias for backward compatibility)
   * @param token
   * @returns 
   */
  async getUserByToken(token: string): Promise<UserGetDTO | null> {
    return this.authenticateByToken(token);
  }

  /**
   * Assign courses with knowledge levels to a user
   * @param userId 
   * @param courseSelections 
   * @aligns 
   */
  async assignCoursesWithKnowledgeLevels(userId: number, courseSelections: CourseSelectionDTO[]): Promise<void> {
    await this.apiService.post<void>(`/users/${userId}/courses`, { courseSelections });
  }

  /**
   * Check if a token owner is authorized to modify a user
   * @param userId 
   * @returns 
   * @aligns 
   */
  async checkAuthorizationById(userId: number): Promise<boolean> {
    try {
      await this.apiService.get<void>(`/users/${userId}/authorize`);
      return true;
    } catch (error) {
      console.error(`Authorization check failed for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Check if email exists
   * @param email
   * @returns 
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      await this.apiService.get<UserGetDTO>(`/users/check-email?email=${encodeURIComponent(email)}`);
      return true;
    } catch (error: any) {
      if (error.status === 404 || error.status === 400) {
        return false;
      }
      throw error;
    }
  }
  
  /**
   * Get the current authenticated user using the token from storage
   * @returns 
   */
  async getCurrentUser(): Promise<UserGetDTO | null> {
    try {
      return await this.apiService.get<UserGetDTO>('/users/me');
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  }
}