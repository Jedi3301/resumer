export interface GoalProfile {
  targetRole: string;
  seniority: string;
  workPreference: string;
  relocation: boolean;
  timeline: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  timestamp: string;
}
