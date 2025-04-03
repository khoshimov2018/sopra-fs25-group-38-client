import { User } from './user';

export interface UserProfile extends User {
  studyStyle?: string;
  goal?: string;
  tags?: string[];
  studyLevels?: {
    subject: string;
    grade: string;
    level: string;
  }[];
  profileImage?: string;
  bio?: string;
}