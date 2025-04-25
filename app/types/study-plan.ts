// Interfaces for StudyPlan-related entities

// Matches StudyPlan.java entity
export interface StudyPlan {
  id?: number;
  userId: number;
  generatedDate: string; 
  planContent: string;
}