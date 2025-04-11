// Interfaces for Match-related entities
import { MatchStatus } from './user';

// Matches Match.java entity
export interface Match {
  id?: number;
  userId1: number;
  userId2: number;
  status: MatchStatus;
  likedByUser1: boolean;
  likedByUser2: boolean;
}

// Re-export DTOs for backward compatibility
export { MatchGetDTO, MatchPostDTO } from './dto';

// Aliases for backward compatibility
export type MatchPost = MatchPostDTO;
export type MatchGet = MatchGetDTO;