import { ApiService } from "../apiService";
import { MatchGetDTO, MatchPostDTO } from "@/types";

/**
 * Service for match-related API calls.
 * Aligns with the MatchService.java and MatchController.java in the backend.
 */
export class MatchService {
  private readonly apiService: ApiService;

  constructor(apiService: ApiService) {
    this.apiService = apiService;
  }

  /**
   * Process a like action between users.
   * @param matchData - Contains the userId and targetUserId.
   * @returns The match result, which may include the accepted match data if both users liked each other.
   * @aligns with backend MatchService.processLike() at POST /matches/like.
   */
  async processLike(matchData: MatchPostDTO): Promise<MatchGetDTO> {
    return this.apiService.post<MatchGetDTO>("/matches/like", matchData);
  }

  /**
   * Process a dislike action between users.
   * @param matchData - Contains the userId and targetUserId.
   * @returns Void.
   * @aligns with backend MatchService.processDislike() at POST /matches/dislike.
   */
  async processDislike(matchData: MatchPostDTO): Promise<void> {
    await this.apiService.post<void>("/matches/dislike", matchData);
  }
}