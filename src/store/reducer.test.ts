import { describe, it, expect } from 'vitest';
import { appReducer, initialState } from './reducer';
import type { ApplicationState, ValidationResult } from '../types';

describe('appReducer', () => {
  describe('initial state', () => {
    it('starts with MODE_SELECTION state', () => {
      expect(initialState.currentState).toBe('MODE_SELECTION');
    });

    it('starts with null values', () => {
      expect(initialState.mode).toBe(null);
      expect(initialState.currentNumber).toBe(null);
      expect(initialState.questionLanguage).toBe(null);
      expect(initialState.answerLanguage).toBe(null);
      expect(initialState.userTranscript).toBe(null);
      expect(initialState.validationResult).toBe(null);
      expect(initialState.error).toBe(null);
    });
  });

  describe('SET_MODE action', () => {
    it('sets Japanese to English mode correctly', () => {
      const result = appReducer(initialState, {
        type: 'SET_MODE',
        payload: { mode: 'ja-to-en', questionLang: 'ja', answerLang: 'en' }
      });

      expect(result.mode).toBe('ja-to-en');
      expect(result.questionLanguage).toBe('ja');
      expect(result.answerLanguage).toBe('en');
      expect(result.currentState).toBe('LEVEL_SELECTION');
      expect(result.error).toBe(null);
    });

    it('sets English to Japanese mode correctly', () => {
      const result = appReducer(initialState, {
        type: 'SET_MODE',
        payload: { mode: 'en-to-ja', questionLang: 'en', answerLang: 'ja' }
      });

      expect(result.mode).toBe('en-to-ja');
      expect(result.questionLanguage).toBe('en');
      expect(result.answerLanguage).toBe('ja');
      expect(result.currentState).toBe('LEVEL_SELECTION');
    });

    it('clears any existing error', () => {
      const stateWithError: ApplicationState = {
        ...initialState,
        error: { message: 'Some error', isFatal: false }
      };

      const result = appReducer(stateWithError, {
        type: 'SET_MODE',
        payload: { mode: 'ja-to-en', questionLang: 'ja', answerLang: 'en' }
      });

      expect(result.error).toBe(null);
    });
  });

  describe('SET_LEVEL action', () => {
    const levelSelectionState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'LEVEL_SELECTION'
    };

    it('sets the level and transitions to READY', () => {
      const result = appReducer(levelSelectionState, {
        type: 'SET_LEVEL',
        payload: { levelId: 'hyaku' }
      });

      expect(result.currentLevelId).toBe('hyaku');
      expect(result.currentState).toBe('READY');
    });

    it('resets session stats', () => {
      const stateWithStats: ApplicationState = {
        ...levelSelectionState,
        sessionStats: { attempts: 5, correct: 3, streak: 2 }
      };

      const result = appReducer(stateWithStats, {
        type: 'SET_LEVEL',
        payload: { levelId: 'sen' }
      });

      expect(result.sessionStats).toEqual({ attempts: 0, correct: 0, streak: 0, bestStreak: 0, previousStreak: 0 });
    });
  });

  describe('START_QUESTION action', () => {
    const readyState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'READY'
    };

    it('sets the current number', () => {
      const result = appReducer(readyState, {
        type: 'START_QUESTION',
        payload: { number: 2560 }
      });

      expect(result.currentNumber).toBe(2560);
    });

    it('transitions to SPEAKING state', () => {
      const result = appReducer(readyState, {
        type: 'START_QUESTION',
        payload: { number: 2560 }
      });

      expect(result.currentState).toBe('SPEAKING');
    });

    it('clears previous transcript and validation', () => {
      const stateWithPreviousData: ApplicationState = {
        ...readyState,
        userTranscript: 'previous answer',
        validationResult: {
          isCorrect: true,
          confidence: 1.0,
          method: 'exact',
          userAnswer: 'previous',
          userNumber: 100,
          userParsed: true,
          correctAnswer: 'previous',
          correctNumber: 100
        }
      };

      const result = appReducer(stateWithPreviousData, {
        type: 'START_QUESTION',
        payload: { number: 2560 }
      });

      expect(result.userTranscript).toBe(null);
      expect(result.validationResult).toBe(null);
    });

    it('clears any error', () => {
      const stateWithError: ApplicationState = {
        ...readyState,
        error: { message: 'Some error', isFatal: false }
      };

      const result = appReducer(stateWithError, {
        type: 'START_QUESTION',
        payload: { number: 2560 }
      });

      expect(result.error).toBe(null);
    });
  });

  describe('AUDIO_COMPLETE action', () => {
    it('transitions from SPEAKING to READY_TO_RECORD', () => {
      const speakingState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        currentNumber: 2560,
        currentState: 'SPEAKING'
      };

      const result = appReducer(speakingState, { type: 'AUDIO_COMPLETE' });

      expect(result.currentState).toBe('READY_TO_RECORD');
    });
  });

  describe('START_RECORDING action', () => {
    it('transitions from READY_TO_RECORD to LISTENING', () => {
      const readyToRecordState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        currentNumber: 2560,
        currentState: 'READY_TO_RECORD'
      };

      const result = appReducer(readyToRecordState, { type: 'START_RECORDING' });

      expect(result.currentState).toBe('LISTENING');
    });
  });

  describe('SET_TRANSCRIPT action', () => {
    it('sets the user transcript', () => {
      const listeningState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        currentNumber: 2560,
        currentState: 'LISTENING'
      };

      const result = appReducer(listeningState, {
        type: 'SET_TRANSCRIPT',
        payload: 'two thousand five hundred sixty'
      });

      expect(result.userTranscript).toBe('two thousand five hundred sixty');
    });
  });

  describe('START_VALIDATION action', () => {
    it('transitions to VALIDATING state', () => {
      const listeningState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        currentNumber: 2560,
        currentState: 'LISTENING',
        userTranscript: 'some answer'
      };

      const result = appReducer(listeningState, { type: 'START_VALIDATION' });

      expect(result.currentState).toBe('VALIDATING');
    });
  });

  describe('SET_VALIDATION_RESULT action', () => {
    const validatingState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      currentNumber: 2560,
      currentState: 'VALIDATING',
      userTranscript: 'two thousand five hundred sixty'
    };

    it('sets correct validation result', () => {
      const correctResult: ValidationResult = {
        isCorrect: true,
        confidence: 1.0,
        method: 'exact',
        userAnswer: 'two thousand five hundred sixty',
        userNumber: 2560,
        userParsed: true,
        correctAnswer: 'two thousand five hundred sixty',
        correctNumber: 2560
      };

      const result = appReducer(validatingState, {
        type: 'SET_VALIDATION_RESULT',
        payload: correctResult
      });

      expect(result.validationResult).toEqual(correctResult);
      expect(result.validationResult?.isCorrect).toBe(true);
    });

    it('sets incorrect validation result', () => {
      const incorrectResult: ValidationResult = {
        isCorrect: false,
        confidence: 0.5,
        method: 'rejected',
        userAnswer: 'two thousand',
        userNumber: 2000,
        userParsed: true,
        correctAnswer: 'two thousand five hundred sixty',
        correctNumber: 2560
      };

      const result = appReducer(validatingState, {
        type: 'SET_VALIDATION_RESULT',
        payload: incorrectResult
      });

      expect(result.validationResult).toEqual(incorrectResult);
      expect(result.validationResult?.isCorrect).toBe(false);
    });

    it('transitions to FEEDBACK state', () => {
      const correctResult: ValidationResult = {
        isCorrect: true,
        confidence: 1.0,
        method: 'exact',
        userAnswer: 'answer',
        userNumber: 2560,
        userParsed: true,
        correctAnswer: 'answer',
        correctNumber: 2560
      };

      const result = appReducer(validatingState, {
        type: 'SET_VALIDATION_RESULT',
        payload: correctResult
      });

      expect(result.currentState).toBe('FEEDBACK');
    });
  });

  describe('NEXT_QUESTION action', () => {
    const feedbackState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentNumber: 2560,
      currentState: 'FEEDBACK',
      userTranscript: 'some answer',
      validationResult: {
        isCorrect: true,
        confidence: 1.0,
        method: 'exact',
        userAnswer: 'answer',
        userNumber: 2560,
        userParsed: true,
        correctAnswer: 'answer',
        correctNumber: 2560
      }
    };

    it('transitions to READY state', () => {
      const result = appReducer(feedbackState, { type: 'NEXT_QUESTION' });

      expect(result.currentState).toBe('READY');
    });

    it('clears transcript and validation result', () => {
      const result = appReducer(feedbackState, { type: 'NEXT_QUESTION' });

      expect(result.userTranscript).toBe(null);
      expect(result.validationResult).toBe(null);
    });

    it('preserves mode and language settings', () => {
      const result = appReducer(feedbackState, { type: 'NEXT_QUESTION' });

      expect(result.mode).toBe('ja-to-en');
      expect(result.questionLanguage).toBe('ja');
      expect(result.answerLanguage).toBe('en');
    });
  });

  describe('CHANGE_MODE action', () => {
    const feedbackState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentNumber: 2560,
      currentState: 'FEEDBACK',
      userTranscript: 'some answer',
      validationResult: {
        isCorrect: true,
        confidence: 1.0,
        method: 'exact',
        userAnswer: 'answer',
        userNumber: 2560,
        userParsed: true,
        correctAnswer: 'answer',
        correctNumber: 2560
      }
    };

    it('resets to initial state', () => {
      const result = appReducer(feedbackState, { type: 'CHANGE_MODE' });

      expect(result).toEqual(initialState);
    });

    it('returns to MODE_SELECTION state', () => {
      const result = appReducer(feedbackState, { type: 'CHANGE_MODE' });

      expect(result.currentState).toBe('MODE_SELECTION');
    });
  });

  describe('SET_ERROR action', () => {
    it('sets non-fatal error', () => {
      const result = appReducer(initialState, {
        type: 'SET_ERROR',
        payload: { message: 'Microphone not found', isFatal: false }
      });

      expect(result.error).toEqual({ message: 'Microphone not found', isFatal: false });
    });

    it('sets fatal error', () => {
      const result = appReducer(initialState, {
        type: 'SET_ERROR',
        payload: { message: 'Browser not supported', isFatal: true }
      });

      expect(result.error).toEqual({ message: 'Browser not supported', isFatal: true });
    });
  });

  describe('CLEAR_ERROR action', () => {
    it('clears the error', () => {
      const stateWithError: ApplicationState = {
        ...initialState,
        error: { message: 'Some error', isFatal: false }
      };

      const result = appReducer(stateWithError, { type: 'CLEAR_ERROR' });

      expect(result.error).toBe(null);
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged for unknown action', () => {
      const result = appReducer(initialState, { type: 'UNKNOWN' } as never);

      expect(result).toEqual(initialState);
    });
  });

  describe('state flow: complete practice cycle', () => {
    it('follows correct state transitions for a complete cycle', () => {
      // 1. Start: MODE_SELECTION
      let state = initialState;
      expect(state.currentState).toBe('MODE_SELECTION');

      // 2. Select mode -> LEVEL_SELECTION
      state = appReducer(state, {
        type: 'SET_MODE',
        payload: { mode: 'ja-to-en', questionLang: 'ja', answerLang: 'en' }
      });
      expect(state.currentState).toBe('LEVEL_SELECTION');

      // 3. Select level -> READY
      state = appReducer(state, {
        type: 'SET_LEVEL',
        payload: { levelId: 'anchors' }
      });
      expect(state.currentState).toBe('READY');

      // 4. Start question -> SPEAKING
      state = appReducer(state, {
        type: 'START_QUESTION',
        payload: { number: 2560 }
      });
      expect(state.currentState).toBe('SPEAKING');

      // 5. Audio complete -> READY_TO_RECORD
      state = appReducer(state, { type: 'AUDIO_COMPLETE' });
      expect(state.currentState).toBe('READY_TO_RECORD');

      // 6. Start recording -> LISTENING
      state = appReducer(state, { type: 'START_RECORDING' });
      expect(state.currentState).toBe('LISTENING');

      // 7. Set transcript
      state = appReducer(state, {
        type: 'SET_TRANSCRIPT',
        payload: 'two thousand five hundred sixty'
      });
      expect(state.userTranscript).toBe('two thousand five hundred sixty');

      // 8. Start validation -> VALIDATING
      state = appReducer(state, { type: 'START_VALIDATION' });
      expect(state.currentState).toBe('VALIDATING');

      // 9. Set validation result -> FEEDBACK
      state = appReducer(state, {
        type: 'SET_VALIDATION_RESULT',
        payload: {
          isCorrect: true,
          confidence: 1.0,
          method: 'exact',
          userAnswer: 'two thousand five hundred sixty',
          userNumber: 2560,
          userParsed: true,
          correctAnswer: 'two thousand five hundred sixty',
          correctNumber: 2560
        }
      });
      expect(state.currentState).toBe('FEEDBACK');
      expect(state.validationResult?.isCorrect).toBe(true);

      // 10. Next question -> READY
      state = appReducer(state, { type: 'NEXT_QUESTION' });
      expect(state.currentState).toBe('READY');
      expect(state.userTranscript).toBe(null);
      expect(state.validationResult).toBe(null);

      // 11. Change level -> LEVEL_SELECTION
      state = appReducer(state, { type: 'CHANGE_LEVEL' });
      expect(state.currentState).toBe('LEVEL_SELECTION');

      // 12. Change mode -> MODE_SELECTION
      state = appReducer(state, { type: 'CHANGE_MODE' });
      expect(state.currentState).toBe('MODE_SELECTION');
    });
  });
});
