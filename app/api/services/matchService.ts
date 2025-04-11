import { ApiService } from "../apiService";
import { MatchStatus } from "@/types/user";
import { MatchGetDTO, MatchPostDTO } from "@/types/dto";

/**
 * Service for match-related API calls
 * Aligns with the MatchService.java and MatchController.java in the backend
 */
export class MatchService {
  private apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Process a like between users
   * @param matchData Match data with userId and targetUserId
   * @returns Match result
   * @aligns with MatchService.processLike()
   */
  async processLike(matchData: MatchPostDTO): Promise<MatchGetDTO> {
    return this.apiService.post<MatchGetDTO>("/matches/like", matchData);
  }

  /**
   * Process a dislike between users
   * @param matchData Match data with userId and targetUserId
   * @aligns with MatchService.processDislike()
   */
  async processDislike(matchData: MatchPostDTO): Promise<void> {
    await this.apiService.post<void>("/matches/dislike", matchData);
  }

  /**
   * Find match between two users
   * @param userId First user ID
   * @param targetUserId Second user ID
   * @returns Match or null if not found
   */
  async findMatchByUsers(userId: number, targetUserId: number): Promise<MatchGetDTO | null> {
    try {
      return await this.apiService.get<MatchGetDTO>(`/matches/find?userId=${userId}&targetUserId=${targetUserId}`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all accepted matches for a user
   * @param userId User ID
   * @returns List of matches
   */
  async getAcceptedMatchesByUserId(userId: number): Promise<MatchGetDTO[]> {
    return this.getMatchesByUserIdAndStatus(userId, MatchStatus.ACCEPTED);
  }

  /**
   * Get all pending matches for a user
   * @param userId User ID
   * @returns List of matches
   */
  async getPendingMatchesByUserId(userId: number): Promise<MatchGetDTO[]> {
    return this.getMatchesByUserIdAndStatus(userId, MatchStatus.PENDING);
  }

  /**
   * Get matches with specified status for a user
   * @param userId User ID
   * @param status Match status (PENDING, ACCEPTED, REJECTED)
   * @returns List of matches
   */
  async getMatchesByUserIdAndStatus(userId: number, status: MatchStatus | string): Promise<MatchGetDTO[]> {
    return this.apiService.get<MatchGetDTO[]>(`/matches/filter?userId=${userId}&status=${status}`);
  }

  /**
   * Get all matches for a user (any status)
   * @param userId User ID
   * @returns List of matches
   */
  async getAllMatchesByUserId(userId: number): Promise<MatchGetDTO[]> {
    return this.apiService.get<MatchGetDTO[]>(`/matches/user/${userId}`);
  }

  /**
   * Update the status of a match
   * @param matchId Match ID
   * @param status New status (ACCEPTED, REJECTED)
   */
  async updateMatchStatus(matchId: number, status: MatchStatus): Promise<MatchGetDTO> {
    return this.apiService.put<MatchGetDTO>(`/matches/${matchId}/status`, { status });
  }
}