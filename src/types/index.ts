// Practice mode and language types
export type PracticeMode = 'ja-to-en' | 'en-to-ja';
export type Language = 'ja' | 'en';

// Application state machine
export type AppState =
  | 'MODE_SELECTION'
  | 'LEVEL_SELECTION'
  | 'READY'
  | 'SPEAKING'
  | 'READY_TO_RECORD'
  | 'LISTENING'
  | 'VALIDATING'
  | 'FEEDBACK';

// Validation result from checking user's answer
export interface ValidationResult {
  isCorrect: boolean;
  confidence: number;
  method: 'exact' | 'numeric' | 'fuzzy' | 'variant' | 'rejected';
  userAnswer: string;
  userNumber: number | null;
  userParsed: boolean;
  correctAnswer: string;
  correctNumber: number;
}

// Problem from problems.json (legacy)
export interface Problem {
  id: number;
  number: number;
  difficulty: 'simple' | 'medium' | 'hard' | 'expert';
}

export interface ProblemsData {
  metadata: {
    generated: string;
    version: string;
    description: string;
    stats: {
      total: number;
      byDifficulty: Record<string, number>;
      byMagnitude: Record<string, number>;
    };
  };
  problems: Problem[];
}

// Application error
export interface AppError {
  message: string;
  isFatal: boolean;
}

// Session statistics shown during practice
export interface SessionStats {
  attempts: number;
  correct: number;
  streak: number;
}

// Full application state
export interface ApplicationState {
  mode: PracticeMode | null;
  currentLevelId: string;
  currentNumber: number | null;
  currentState: AppState;
  currentSessionId: string | null;
  questionLanguage: Language | null;
  answerLanguage: Language | null;
  userTranscript: string | null;
  validationResult: ValidationResult | null;
  sessionStats: SessionStats;
  error: AppError | null;
}

// Re-export difficulty types for convenience
export * from './difficulty';
