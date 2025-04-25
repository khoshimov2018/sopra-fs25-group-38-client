import { ApiService } from "@/api/apiService";

export interface ReportedUser {
  reportedId: number;
  reporterId: number;
  reason: string;
}

export interface BlockedUser {
  blockerId: number;
  blockedUserId: number;
}

export interface UserInfo {
  id: number;
  name: string;
}

export class AdminService {
  private api: ApiService;

  constructor(api: ApiService) {
    this.api = api;
  }

  /**
   * Get user by id
   */
  async getUserById(userId: number): Promise<UserInfo> {
    return this.api.get<UserInfo>(`/users/${userId}`);
  }

  /**
   * Get all reported users
   */
  async getReportedUsers(): Promise<ReportedUser[]> {
    return this.api.get<ReportedUser[]>("/reports");
  }

  /**
   * Get all blocked user relationships
   */
  async getBlockedUsers(): Promise<BlockedUser[]> {
    return this.api.get<BlockedUser[]>("/blocks");
  }

  /**
   * Admin deletes a user by ID
   */
  async deleteUser(userId: number): Promise<void> {
    await this.api.delete<void>(`/admin/delete/${userId}`);
  }
}
