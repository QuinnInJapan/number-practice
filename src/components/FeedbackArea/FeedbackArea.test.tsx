import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useReducer, type ReactNode, createContext, useContext } from 'react';
import { FeedbackArea } from './FeedbackArea';
import { appReducer, initialState } from '../../store/reducer';
import { LanguageProvider } from '../../i18n';
import type { ApplicationState, ValidationResult } from '../../types';
import type { AppAction } from '../../store/reducer';

// Mock the hooks
vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({
    playNumber: vi.fn(() => Promise.resolve()),
    isPlaying: false
  })
}));

// Create a test context provider
interface AppContextType {
  state: ApplicationState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function TestAppProvider({ children, initialTestState }: { children: ReactNode; initialTestState?: ApplicationState }) {
  const [state, dispatch] = useReducer(appReducer, initialTestState ?? initialState);
  return (
    <LanguageProvider>
      <AppContext.Provider value={{ state, dispatch }}>
        {children}
      </AppContext.Provider>
    </LanguageProvider>
  );
}

// Override the useAppContext hook for tests
vi.mock('../../store/AppContext', () => ({
  useAppContext: () => {
    const context = useContext(AppContext);
    if (!context) {
      throw new Error('useAppContext must be used within AppProvider');
    }
    return context;
  }
}));

describe('FeedbackArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering based on state', () => {
    it('does not render when not in FEEDBACK state', () => {
      render(
        <TestAppProvider initialTestState={initialState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
      expect(screen.queryByText('Incorrect')).not.toBeInTheDocument();
    });

    it('does not render when validation result is null', () => {
      const feedbackStateNoResult: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        currentState: 'FEEDBACK',
        validationResult: null
      };

      render(
        <TestAppProvider initialTestState={feedbackStateNoResult}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
      expect(screen.queryByText('Incorrect')).not.toBeInTheDocument();
    });
  });

  describe('correct answer - Japanese to English mode', () => {
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

    const correctJaToEnState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'FEEDBACK',
      currentNumber: 2560,
      validationResult: correctResult
    };

    it('shows Correct! message', () => {
      render(
        <TestAppProvider initialTestState={correctJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('shows checkmark icon', () => {
      render(
        <TestAppProvider initialTestState={correctJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('shows the number that was asked', () => {
      render(
        <TestAppProvider initialTestState={correctJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('The number was:')).toBeInTheDocument();
    });

    it('does not show You said or Correct answer for correct responses', () => {
      render(
        <TestAppProvider initialTestState={correctJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      // For correct answers, only basic feedback is shown
      expect(screen.queryByText('Correct answer:')).not.toBeInTheDocument();
    });

    it('shows Next button', () => {
      render(
        <TestAppProvider initialTestState={correctJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('shows Replay button', () => {
      render(
        <TestAppProvider initialTestState={correctJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/Replay/)).toBeInTheDocument();
    });

  });

  describe('incorrect answer - Japanese to English mode', () => {
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

    const incorrectJaToEnState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'FEEDBACK',
      currentNumber: 2560,
      validationResult: incorrectResult
    };

    it('shows Incorrect message', () => {
      render(
        <TestAppProvider initialTestState={incorrectJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Incorrect')).toBeInTheDocument();
    });

    it('shows X icon', () => {
      render(
        <TestAppProvider initialTestState={incorrectJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('shows what user said', () => {
      render(
        <TestAppProvider initialTestState={incorrectJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('You said:')).toBeInTheDocument();
      expect(screen.getByText('2,000')).toBeInTheDocument();
    });

    it('shows correct answer', () => {
      render(
        <TestAppProvider initialTestState={incorrectJaToEnState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Correct answer:')).toBeInTheDocument();
      expect(screen.getByText('2,560')).toBeInTheDocument();
    });
  });

  describe('incorrect answer - English to Japanese mode', () => {
    const incorrectResult: ValidationResult = {
      isCorrect: false,
      confidence: 0.5,
      method: 'rejected',
      userAnswer: '100万',
      userNumber: 1000000,
      userParsed: true,
      correctAnswer: 'さんびゃくまん',
      correctNumber: 3000000
    };

    const incorrectEnToJaState: ApplicationState = {
      ...initialState,
      mode: 'en-to-ja',
      questionLanguage: 'en',
      answerLanguage: 'ja',
      currentState: 'FEEDBACK',
      currentNumber: 3000000,
      validationResult: incorrectResult
    };

    it('shows Incorrect message', () => {
      render(
        <TestAppProvider initialTestState={incorrectEnToJaState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Incorrect')).toBeInTheDocument();
    });

    it('shows user answer in Japanese numeric format', () => {
      render(
        <TestAppProvider initialTestState={incorrectEnToJaState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('100万')).toBeInTheDocument();
    });

    it('shows correct answer in Japanese numeric format', () => {
      render(
        <TestAppProvider initialTestState={incorrectEnToJaState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('300万')).toBeInTheDocument();
    });
  });

  describe('correct answer - English to Japanese mode', () => {
    const correctResult: ValidationResult = {
      isCorrect: true,
      confidence: 0.95,
      method: 'numeric',
      userAnswer: '300万',
      userNumber: 3000000,
      userParsed: true,
      correctAnswer: 'さんびゃくまん',
      correctNumber: 3000000
    };

    const correctEnToJaState: ApplicationState = {
      ...initialState,
      mode: 'en-to-ja',
      questionLanguage: 'en',
      answerLanguage: 'ja',
      currentState: 'FEEDBACK',
      currentNumber: 3000000,
      validationResult: correctResult
    };

    it('shows Correct! message', () => {
      render(
        <TestAppProvider initialTestState={correctEnToJaState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('shows the number in English format (question language)', () => {
      render(
        <TestAppProvider initialTestState={correctEnToJaState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText('3,000,000')).toBeInTheDocument();
    });
  });

  describe('unparsed user answer', () => {
    const unparsedResult: ValidationResult = {
      isCorrect: false,
      confidence: 0.2,
      method: 'rejected',
      userAnswer: 'blah blah blah',
      userNumber: null,
      userParsed: false,
      correctAnswer: 'two thousand five hundred sixty',
      correctNumber: 2560
    };

    const unparsedState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'FEEDBACK',
      currentNumber: 2560,
      validationResult: unparsedResult
    };

    it('shows the raw user answer with not recognized message', () => {
      render(
        <TestAppProvider initialTestState={unparsedState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/"blah blah blah" \(not recognized as a number\)/)).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
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

    const feedbackState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'FEEDBACK',
      currentNumber: 2560,
      validationResult: correctResult
    };

    it('Next button transitions to READY state', () => {
      render(
        <TestAppProvider initialTestState={feedbackState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);

      // After clicking, feedback should no longer be visible
      expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    });

    it('Replay button triggers audio replay', () => {
      render(
        <TestAppProvider initialTestState={feedbackState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      const hearAgainButton = screen.getByText(/Replay/);
      fireEvent.click(hearAgainButton);

      // Component should still be visible (doesn't change state)
      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });
  });

  describe('explanation messages', () => {
    it('shows close explanation for small difference', () => {
      const closeResult: ValidationResult = {
        isCorrect: false,
        confidence: 0.5,
        method: 'rejected',
        userAnswer: 'two thousand five hundred',
        userNumber: 2500,
        userParsed: true,
        correctAnswer: 'two thousand five hundred sixty',
        correctNumber: 2560
      };

      const closeState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'FEEDBACK',
        currentNumber: 2560,
        validationResult: closeResult
      };

      render(
        <TestAppProvider initialTestState={closeState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      // Should show "Very close!" message for small differences
      expect(screen.getByText(/Very close!/)).toBeInTheDocument();
    });

    it('shows digit place hint for wrong digit', () => {
      const wrongDigitResult: ValidationResult = {
        isCorrect: false,
        confidence: 0.5,
        method: 'rejected',
        userAnswer: 'three thousand five hundred sixty',
        userNumber: 3560,
        userParsed: true,
        correctAnswer: 'two thousand five hundred sixty',
        correctNumber: 2560
      };

      const wrongDigitState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'FEEDBACK',
        currentNumber: 2560,
        validationResult: wrongDigitResult
      };

      render(
        <TestAppProvider initialTestState={wrongDigitState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      // Should show hint about which digit is wrong
      expect(screen.getByText(/thousands place/)).toBeInTheDocument();
    });

    it('shows digit count hint for different lengths', () => {
      const wrongLengthResult: ValidationResult = {
        isCorrect: false,
        confidence: 0.5,
        method: 'rejected',
        userAnswer: 'two hundred fifty six',
        userNumber: 256,
        userParsed: true,
        correctAnswer: 'two thousand five hundred sixty',
        correctNumber: 2560
      };

      const wrongLengthState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'FEEDBACK',
        currentNumber: 2560,
        validationResult: wrongLengthResult
      };

      render(
        <TestAppProvider initialTestState={wrongLengthState}>
          <FeedbackArea />
        </TestAppProvider>
      );

      // Should show hint about number of digits
      expect(screen.getByText(/digits/)).toBeInTheDocument();
    });
  });

  describe('all button and answer combinations', () => {
    // Test matrix: button x correct/incorrect

    describe('Next button', () => {
      it('works after correct answer', () => {
        const correctState: ApplicationState = {
          ...initialState,
          mode: 'ja-to-en',
          questionLanguage: 'ja',
          answerLanguage: 'en',
          currentState: 'FEEDBACK',
          currentNumber: 2560,
          validationResult: {
            isCorrect: true,
            confidence: 1.0,
            method: 'exact',
            userAnswer: 'test',
            userNumber: 2560,
            userParsed: true,
            correctAnswer: 'test',
            correctNumber: 2560
          }
        };

        render(
          <TestAppProvider initialTestState={correctState}>
            <FeedbackArea />
          </TestAppProvider>
        );

        fireEvent.click(screen.getByText('Next'));
        expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
      });

      it('works after incorrect answer', () => {
        const incorrectState: ApplicationState = {
          ...initialState,
          mode: 'ja-to-en',
          questionLanguage: 'ja',
          answerLanguage: 'en',
          currentState: 'FEEDBACK',
          currentNumber: 2560,
          validationResult: {
            isCorrect: false,
            confidence: 0.5,
            method: 'rejected',
            userAnswer: 'wrong',
            userNumber: 1000,
            userParsed: true,
            correctAnswer: 'test',
            correctNumber: 2560
          }
        };

        render(
          <TestAppProvider initialTestState={incorrectState}>
            <FeedbackArea />
          </TestAppProvider>
        );

        fireEvent.click(screen.getByText('Next'));
        expect(screen.queryByText('Incorrect')).not.toBeInTheDocument();
      });
    });

    describe('Replay button', () => {
      it('works after correct answer', () => {
        const correctState: ApplicationState = {
          ...initialState,
          mode: 'ja-to-en',
          questionLanguage: 'ja',
          answerLanguage: 'en',
          currentState: 'FEEDBACK',
          currentNumber: 2560,
          validationResult: {
            isCorrect: true,
            confidence: 1.0,
            method: 'exact',
            userAnswer: 'test',
            userNumber: 2560,
            userParsed: true,
            correctAnswer: 'test',
            correctNumber: 2560
          }
        };

        render(
          <TestAppProvider initialTestState={correctState}>
            <FeedbackArea />
          </TestAppProvider>
        );

        fireEvent.click(screen.getByText(/Replay/));
        // Should stay on feedback screen
        expect(screen.getByText('Correct!')).toBeInTheDocument();
      });

      it('works after incorrect answer', () => {
        const incorrectState: ApplicationState = {
          ...initialState,
          mode: 'ja-to-en',
          questionLanguage: 'ja',
          answerLanguage: 'en',
          currentState: 'FEEDBACK',
          currentNumber: 2560,
          validationResult: {
            isCorrect: false,
            confidence: 0.5,
            method: 'rejected',
            userAnswer: 'wrong',
            userNumber: 1000,
            userParsed: true,
            correctAnswer: 'test',
            correctNumber: 2560
          }
        };

        render(
          <TestAppProvider initialTestState={incorrectState}>
            <FeedbackArea />
          </TestAppProvider>
        );

        fireEvent.click(screen.getByText(/Replay/));
        // Should stay on feedback screen
        expect(screen.getByText('Incorrect')).toBeInTheDocument();
      });
    });
  });
});
