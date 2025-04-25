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
}