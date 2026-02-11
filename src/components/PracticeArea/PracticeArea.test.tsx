import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useReducer, type ReactNode } from 'react';
import { PracticeArea } from './PracticeArea';
import { appReducer, initialState } from '../../store/reducer';
import { LanguageProvider } from '../../i18n';
import type { ApplicationState, ValidationResult } from '../../types';

// Mock the hooks
vi.mock('../../hooks/useProblems', () => ({
  useProblems: () => ({
    getRandomProblem: vi.fn(() => ({ id: 1, number: 2560, difficulty: 'medium' })),
    problems: [{ id: 1, number: 2560, difficulty: 'medium' }]
  })
}));

vi.mock('../../hooks/useAudioPlayer', () => ({
  useAudioPlayer: () => ({
    playNumber: vi.fn(() => Promise.resolve()),
    stop: vi.fn(),
    isPlaying: false
  })
}));

const mockStop = vi.fn();
let mockIsListening = false;

vi.mock('../../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    listen: vi.fn(() => Promise.resolve('two thousand five hundred sixty')),
    stop: mockStop,
    restart: vi.fn(),
    isListening: mockIsListening
  }),
  checkSpeechSupport: vi.fn(() => true)
}));

// Create a test context provider
import { createContext, useContext } from 'react';
import type { AppAction } from '../../store/reducer';

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

describe('PracticeArea', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsListening = false;
  });

  describe('rendering based on state', () => {
    it('does not render in MODE_SELECTION state', () => {
      render(
        <TestAppProvider initialTestState={initialState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.queryByText('Go!')).not.toBeInTheDocument();
    });
  });

  describe('READY state', () => {
    const readyState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'READY'
    };

    it('shows Go! button', () => {
      render(
        <TestAppProvider initialTestState={readyState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Go!')).toBeInTheDocument();
    });

    it('shows ready status', () => {
      render(
        <TestAppProvider initialTestState={readyState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('shows mode display for ja-to-en', () => {
      render(
        <TestAppProvider initialTestState={readyState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('JP → EN')).toBeInTheDocument();
    });

    it('shows mode display for en-to-ja', () => {
      const enToJaState: ApplicationState = {
        ...readyState,
        mode: 'en-to-ja',
        questionLanguage: 'en',
        answerLanguage: 'ja'
      };

      render(
        <TestAppProvider initialTestState={enToJaState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('EN → JP')).toBeInTheDocument();
    });
  });

  describe('SPEAKING state', () => {
    const speakingState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'SPEAKING',
      currentNumber: 2560
    };

    it('shows listening status', () => {
      render(
        <TestAppProvider initialTestState={speakingState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Listen...')).toBeInTheDocument();
    });

    it('shows Hear Again button during playback', () => {
      render(
        <TestAppProvider initialTestState={speakingState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/Hear Again/)).toBeInTheDocument();
    });
  });

  describe('LISTENING state', () => {
    const listeningState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'LISTENING',
      currentNumber: 2560
    };

    it('shows Stop Recording button when isListening is true', () => {
      mockIsListening = true;
      render(
        <TestAppProvider initialTestState={listeningState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/Stop Recording/)).toBeInTheDocument();
    });

    it('does not show Stop Recording button when isListening is false', () => {
      mockIsListening = false;
      render(
        <TestAppProvider initialTestState={listeningState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.queryByText(/Stop Recording/)).not.toBeInTheDocument();
    });

    it('shows listening status', () => {
      render(
        <TestAppProvider initialTestState={listeningState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/Your turn!/)).toBeInTheDocument();
    });

    it('shows Hear Again button', () => {
      render(
        <TestAppProvider initialTestState={listeningState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/Hear Again/)).toBeInTheDocument();
    });
  });

  describe('VALIDATING state', () => {
    const validatingState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'VALIDATING',
      currentNumber: 2560,
      userTranscript: 'two thousand five hundred sixty'
    };

    it('shows checking status', () => {
      render(
        <TestAppProvider initialTestState={validatingState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Checking...')).toBeInTheDocument();
    });

    it('shows user transcript', () => {
      render(
        <TestAppProvider initialTestState={validatingState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('"two thousand five hundred sixty"')).toBeInTheDocument();
    });
  });

  describe('transcript display', () => {
    it('shows transcript when available', () => {
      const stateWithTranscript: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'VALIDATING',
        currentNumber: 2560,
        userTranscript: 'my answer'
      };

      render(
        <TestAppProvider initialTestState={stateWithTranscript}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('You said:')).toBeInTheDocument();
      expect(screen.getByText('"my answer"')).toBeInTheDocument();
    });

    it('does not show transcript when null', () => {
      const readyState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'READY',
        userTranscript: null
      };

      render(
        <TestAppProvider initialTestState={readyState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.queryByText('You said:')).not.toBeInTheDocument();
    });
  });

  describe('button flow combinations', () => {
    it('Go! button flow: READY -> clicking starts question', async () => {
      const readyState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'READY'
      };

      render(
        <TestAppProvider initialTestState={readyState}>
          <PracticeArea />
        </TestAppProvider>
      );

      const startButton = screen.getByText('Go!');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.queryByText('Go!')).not.toBeInTheDocument();
      });
    });

    it('Stop Recording button calls stop', async () => {
      mockIsListening = true;
      const listeningState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'LISTENING',
        currentNumber: 2560
      };

      render(
        <TestAppProvider initialTestState={listeningState}>
          <PracticeArea />
        </TestAppProvider>
      );

      const stopButton = screen.getByText(/Stop Recording/);
      fireEvent.click(stopButton);
      expect(mockStop).toHaveBeenCalled();
    });

    it('Hear Again button during LISTENING state', async () => {
      const listeningState: ApplicationState = {
        ...initialState,
        mode: 'ja-to-en',
        questionLanguage: 'ja',
        answerLanguage: 'en',
        currentState: 'LISTENING',
        currentNumber: 2560
      };

      render(
        <TestAppProvider initialTestState={listeningState}>
          <PracticeArea />
        </TestAppProvider>
      );

      const hearAgainButton = screen.getByText(/Hear Again/);
      expect(hearAgainButton).toBeInTheDocument();
    });
  });

  // === FEEDBACK STATE (inline) ===

  describe('FEEDBACK state - correct answer', () => {
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

    const correctState: ApplicationState = {
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
        <TestAppProvider initialTestState={correctState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('shows checkmark icon', () => {
      render(
        <TestAppProvider initialTestState={correctState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('does not show feedback details for correct answers', () => {
      render(
        <TestAppProvider initialTestState={correctState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.queryByText('Correct answer:')).not.toBeInTheDocument();
      expect(screen.queryByText('The number was:')).not.toBeInTheDocument();
    });

    it('shows Next button', () => {
      render(
        <TestAppProvider initialTestState={correctState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('shows Replay button', () => {
      render(
        <TestAppProvider initialTestState={correctState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/Replay/)).toBeInTheDocument();
    });
  });

  describe('FEEDBACK state - incorrect answer', () => {
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

    const incorrectState: ApplicationState = {
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
        <TestAppProvider initialTestState={incorrectState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Incorrect')).toBeInTheDocument();
    });

    it('shows X icon', () => {
      render(
        <TestAppProvider initialTestState={incorrectState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('✗')).toBeInTheDocument();
    });

    it('shows what user said', () => {
      render(
        <TestAppProvider initialTestState={incorrectState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('You said:')).toBeInTheDocument();
      expect(screen.getByText('2,000')).toBeInTheDocument();
    });

    it('shows correct answer', () => {
      render(
        <TestAppProvider initialTestState={incorrectState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('Correct answer:')).toBeInTheDocument();
      expect(screen.getByText('2,560')).toBeInTheDocument();
    });
  });

  describe('FEEDBACK state - English to Japanese mode', () => {
    const incorrectEnToJaState: ApplicationState = {
      ...initialState,
      mode: 'en-to-ja',
      questionLanguage: 'en',
      answerLanguage: 'ja',
      currentState: 'FEEDBACK',
      currentNumber: 3000000,
      validationResult: {
        isCorrect: false,
        confidence: 0.5,
        method: 'rejected',
        userAnswer: '100万',
        userNumber: 1000000,
        userParsed: true,
        correctAnswer: 'さんびゃくまん',
        correctNumber: 3000000
      }
    };

    it('shows user answer in Japanese numeric format', () => {
      render(
        <TestAppProvider initialTestState={incorrectEnToJaState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('100万')).toBeInTheDocument();
    });

    it('shows correct answer in Japanese numeric format', () => {
      render(
        <TestAppProvider initialTestState={incorrectEnToJaState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText('300万')).toBeInTheDocument();
    });
  });

  describe('FEEDBACK state - unparsed answer', () => {
    const unparsedState: ApplicationState = {
      ...initialState,
      mode: 'ja-to-en',
      questionLanguage: 'ja',
      answerLanguage: 'en',
      currentState: 'FEEDBACK',
      currentNumber: 2560,
      validationResult: {
        isCorrect: false,
        confidence: 0.2,
        method: 'rejected',
        userAnswer: 'blah blah blah',
        userNumber: null,
        userParsed: false,
        correctAnswer: 'two thousand five hundred sixty',
        correctNumber: 2560
      }
    };

    it('shows the raw user answer with not recognized message', () => {
      render(
        <TestAppProvider initialTestState={unparsedState}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/"blah blah blah" \(not recognized as a number\)/)).toBeInTheDocument();
    });
  });

  describe('FEEDBACK state - button interactions', () => {
    const feedbackState: ApplicationState = {
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

    it('Next button transitions away from feedback', () => {
      render(
        <TestAppProvider initialTestState={feedbackState}>
          <PracticeArea />
        </TestAppProvider>
      );

      fireEvent.click(screen.getByText('Next'));
      expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    });

    it('Replay button stays on feedback', () => {
      render(
        <TestAppProvider initialTestState={feedbackState}>
          <PracticeArea />
        </TestAppProvider>
      );

      fireEvent.click(screen.getByText(/Replay/));
      expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    it('Next button works after incorrect answer', () => {
      const incorrectState: ApplicationState = {
        ...feedbackState,
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
          <PracticeArea />
        </TestAppProvider>
      );

      fireEvent.click(screen.getByText('Next'));
      expect(screen.queryByText('Incorrect')).not.toBeInTheDocument();
    });
  });

  describe('FEEDBACK state - explanation messages', () => {
    it('shows close explanation for small difference', () => {
      render(
        <TestAppProvider initialTestState={{
          ...initialState,
          mode: 'ja-to-en',
          questionLanguage: 'ja',
          answerLanguage: 'en',
          currentState: 'FEEDBACK',
          currentNumber: 2560,
          validationResult: {
            isCorrect: false, confidence: 0.5, method: 'rejected',
            userAnswer: 'two thousand five hundred', userNumber: 2500, userParsed: true,
            correctAnswer: 'two thousand five hundred sixty', correctNumber: 2560
          }
        }}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/Very close!/)).toBeInTheDocument();
    });

    it('shows digit place hint for wrong digit', () => {
      render(
        <TestAppProvider initialTestState={{
          ...initialState,
          mode: 'ja-to-en',
          questionLanguage: 'ja',
          answerLanguage: 'en',
          currentState: 'FEEDBACK',
          currentNumber: 2560,
          validationResult: {
            isCorrect: false, confidence: 0.5, method: 'rejected',
            userAnswer: 'three thousand five hundred sixty', userNumber: 3560, userParsed: true,
            correctAnswer: 'two thousand five hundred sixty', correctNumber: 2560
          }
        }}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/thousands place/)).toBeInTheDocument();
    });

    it('shows digit count hint for different lengths', () => {
      render(
        <TestAppProvider initialTestState={{
          ...initialState,
          mode: 'ja-to-en',
          questionLanguage: 'ja',
          answerLanguage: 'en',
          currentState: 'FEEDBACK',
          currentNumber: 2560,
          validationResult: {
            isCorrect: false, confidence: 0.5, method: 'rejected',
            userAnswer: 'two hundred fifty six', userNumber: 256, userParsed: true,
            correctAnswer: 'two thousand five hundred sixty', correctNumber: 2560
          }
        }}>
          <PracticeArea />
        </TestAppProvider>
      );

      expect(screen.getByText(/digits/)).toBeInTheDocument();
    });
  });
});
