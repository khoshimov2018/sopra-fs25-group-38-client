import { ApiService } from "../apiService";
import { MatchGetDTO, MatchPostDTO } from "@/types";

export class MatchService {
  private readonly apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Process a like action between users.
   * @param matchData
   * @returns
   * @aligns
   */
  async processLike(matchData: MatchPostDTO): Promise<MatchGetDTO> {
    return this.apiService.post<MatchGetDTO>("/matches/like", matchData);
  }

  /**
   * Process a dislike action between users.
   * @param matchData
   * @returns 
   * @aligns
   */
  async processDislike(matchData: MatchPostDTO): Promise<void> {
    await this.apiService.post<void>("/matches/dislike", matchData);
  }

  /**
   * Get all user IDs that the current user has interacted with (liked, matched, or blocked)
   * @param userId 
   * @returns 
   */
  async getInteractedUserIds(userId: number): Promise<{ 
    likedIds: number[], 
    matchedIds: number[],
    blockedIds: number[] 
  }> {
    try {
      return await this.apiService.get<{
        likedIds: number[],
        matchedIds: number[],
        blockedIds: number[]
      }>(`/matches/user/${userId}/interacted`);
    } catch (error) {
      console.error("Error fetching interacted users:", error);
      return { likedIds: [], matchedIds: [], blockedIds: [] };
    }
  }
}