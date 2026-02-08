export enum QuestionType {
  MULTIPLE_CHOICE = 'Trắc nghiệm',
  TRUE_FALSE = 'Đúng/Sai',
  SHORT_ANSWER = 'Tự luận ngắn',
}

export enum Difficulty {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó',
}

export interface GeneratedQuestion {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratorConfig {
  topic: string;
  count: number;
  difficulty: Difficulty;
  type: QuestionType;
}
