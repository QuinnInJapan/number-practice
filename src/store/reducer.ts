import type { ApplicationState, PracticeMode, Language, ValidationResult, AppError, SessionStats } from '../types';

// Action types
export type AppAction =
  | { type: 'SET_MODE'; payload: { mode: PracticeMode; questionLang: Language; answerLang: Language } }
  | { type: 'SET_LEVEL'; payload: { levelId: string } }
  | { type: 'SWITCH_MODE'; payload: { mode: PracticeMode; questionLang: Language; answerLang: Language; levelId: string } }
  | { type: 'START_QUESTION'; payload: { number: number } }
  | { type: 'AUDIO_COMPLETE' }
  | { type: 'START_RECORDING' }
  | { type: 'SET_TRANSCRIPT'; payload: string }
  | { type: 'START_VALIDATION' }
  | { type: 'SET_VALIDATION_RESULT'; payload: ValidationResult }
  | { type: 'UPDATE_SESSION_STATS'; payload: { isCorrect: boolean } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'CHANGE_MODE' }
  | { type: 'CHANGE_LEVEL' }
  | { type: 'SET_ERROR'; payload: AppError }
  | { type: 'CLEAR_ERROR' };

// Initial session stats
const initialSessionStats: SessionStats = {
  attempts: 0,
  correct: 0,
  streak: 0,
};

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Initial state
export const initialState: ApplicationState = {
  mode: null,
  currentLevelId: 'anchors', // Default to first level in new progression
  currentNumber: null,
  currentState: 'MODE_SELECTION',
  currentSessionId: null,
  questionLanguage: null,
  answerLanguage: null,
  userTranscript: null,
  validationResult: null,
  sessionStats: { ...initialSessionStats },
  error: null,
};

// Reducer function
export function appReducer(state: ApplicationState, action: AppAction): ApplicationState {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.payload.mode,
        questionLanguage: action.payload.questionLang,
        answerLanguage: action.payload.answerLang,
        currentState: 'LEVEL_SELECTION',
        error: null,
      };

    case 'SET_LEVEL':
      return {
        ...state,
        currentLevelId: action.payload.levelId,
        currentState: 'READY',
        currentSessionId: generateSessionId(),
        sessionStats: { ...initialSessionStats },
        error: null,
      };

    case 'SWITCH_MODE':
      return {
        ...state,
        mode: action.payload.mode,
        questionLanguage: action.payload.questionLang,
        answerLanguage: action.payload.answerLang,
        currentLevelId: action.payload.levelId,
        currentState: 'READY',
        currentSessionId: generateSessionId(),
        currentNumber: null,
        userTranscript: null,
        validationResult: null,
        sessionStats: { ...initialSessionStats },
        error: null,
      };

    case 'START_QUESTION':
      return {
        ...state,
        currentNumber: action.payload.number,
        currentState: 'SPEAKING',
        userTranscript: null,
        validationResult: null,
        error: null,
      };

    case 'AUDIO_COMPLETE':
      return {
        ...state,
        currentState: 'READY_TO_RECORD',
      };

    case 'START_RECORDING':
      return {
        ...state,
        currentState: 'LISTENING',
      };

    case 'SET_TRANSCRIPT':
      return {
        ...state,
        userTranscript: action.payload,
      };

    case 'START_VALIDATION':
      return {
        ...state,
        currentState: 'VALIDATING',
      };

    case 'SET_VALIDATION_RESULT':
      return {
        ...state,
        validationResult: action.payload,
        currentState: 'FEEDBACK',
      };

    case 'UPDATE_SESSION_STATS': {
      const { isCorrect } = action.payload;
      return {
        ...state,
        sessionStats: {
          attempts: state.sessionStats.attempts + 1,
          correct: state.sessionStats.correct + (isCorrect ? 1 : 0),
          streak: isCorrect ? state.sessionStats.streak + 1 : 0,
        },
      };
    }

    case 'NEXT_QUESTION':
      return {
        ...state,
        currentState: 'READY',
        userTranscript: null,
        validationResult: null,
      };

    case 'CHANGE_LEVEL':
      return {
        ...state,
        currentState: 'LEVEL_SELECTION',
        currentNumber: null,
        userTranscript: null,
        validationResult: null,
        sessionStats: { ...initialSessionStats },
      };

    case 'CHANGE_MODE':
      return {
        ...initialState,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}
