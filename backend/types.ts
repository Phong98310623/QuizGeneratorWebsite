
export type ObjectId = string;

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED'
}

export interface User {
  _id: ObjectId;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  total_score: number;
  created_at: string;
}

export interface QuestionOption {
  text: string;
  is_correct: boolean;
}

export interface Question {
  _id: ObjectId;
  creator_id: ObjectId;
  question: string;
  correct_answer: string;
  explanation: string;
  options: QuestionOption[];
  created_at: string;
}

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED'
}

export interface Report {
  _id: ObjectId;
  reporter_id: ObjectId;
  target_user_id?: ObjectId;
  question_id?: ObjectId;
  reason: string;
  status: ReportStatus;
  resolved_by?: ObjectId;
  created_at: string;
  resolved_at?: string;
  // Join fields for UI
  reporter_name?: string;
  target_name?: string;
}

export interface QuestionSet {
  _id: ObjectId;
  title: string;
  description: string;
  creator_id: ObjectId;
  is_public: boolean;
  total_questions: number;
  total_score: number;
  time_limit: number;
  created_at: string;
}

export interface Stats {
  totalUsers: number;
  activeQuestions: number;
  pendingReports: number;
  completedAttempts: number;
}
