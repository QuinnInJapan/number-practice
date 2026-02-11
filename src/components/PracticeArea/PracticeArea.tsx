import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useMicrophone } from '../../hooks/useMicrophoneVolume';
import { useNumberGenerator, useProgressService, useLevelService } from '../../contexts/ServiceContext';
import { useTranslation } from '../../i18n';
import { NumberConverter } from '../../services/NumberConverter';
import { Validator } from '../../services/Validator';
import { LEVEL_RECORDING_TIMEOUTS, DEFAULT_RECORDING_TIMEOUT } from '../../config/levels';
import { AttemptHeatmap } from '../AttemptHeatmap/AttemptHeatmap';
import { PracticeNav } from '../PracticeNav/PracticeNav';
import { Waveform } from '../Waveform/Waveform';
import './PracticeArea.css';

const converter = new NumberConverter();
const validator = new Validator(converter);

const AUTO_ADVANCE_CORRECT_MS = 1000;
const AUTO_ADVANCE_INCORRECT_MS = 2500;

export function PracticeArea() {
  const { state, dispatch } = useAppContext();
  const { playNumber, stop: stopAudio } = useAudioPlayer();
  const { listen, stop, restart, isListening } = useSpeechRecognition();
  const numberGenerator = useNumberGenerator();
  const progressService = useProgressService();
  const levelService = useLevelService();
  const { t, uiLanguage } = useTranslation();
  const isRecording = state.currentState === 'LISTENING';
  const { analyserRef } = useMicrophone(isRecording);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [noSpeechFlash, setNoSpeechFlash] = useState(false);
  const abortRef = useRef(false);

  // Auto-advance state (for FEEDBACK)
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = useState(false);

  // Compute unlock progress (needed by hooks, must be above early-return guard)
  const unlockDetail = state.mode
    ? levelService.getDetailedUnlockProgress(
        state.currentLevelId,
        progressService.getProgress(state.mode)
      )
    : null;

  const currentLevel = levelService.getLevelById(state.currentLevelId);

  const isCorrect = state.validationResult?.isCorrect ?? false;
  const justUnlocked = isCorrect
    && unlockDetail !== null
    && unlockDetail.streak.current === unlockDetail.streak.required;

  const autoAdvanceMs = isCorrect ? AUTO_ADVANCE_CORRECT_MS : AUTO_ADVANCE_INCORRECT_MS;

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setAutoAdvanceCancelled(true);
  }, []);

  const doRecordAndValidate = useCallback(async (number: number) => {
    dispatch({ type: 'START_RECORDING' });

    try {
      const transcript = await listen(state.answerLanguage!);

      // If aborted (level/mode switch mid-recording), silently discard
      if (abortRef.current) return;

      // If empty transcript (user stopped early or no speech detected), flash a message
      if (!transcript.trim()) {
        setNoSpeechFlash(true);
        setTimeout(() => setNoSpeechFlash(false), 2000);
        dispatch({ type: 'NEXT_QUESTION' });
        return;
      }

      dispatch({ type: 'SET_TRANSCRIPT', payload: transcript });
      dispatch({ type: 'START_VALIDATION' });

      const correctAnswer = state.answerLanguage === 'ja'
        ? converter.toJapanese(number)
        : converter.toEnglish(number);

      const result = validator.validate(
        transcript,
        correctAnswer,
        state.answerLanguage!,
        number
      );

      if (state.mode) {
        progressService.recordAttempt(state.mode, state.currentLevelId, result.isCorrect, state.currentSessionId ?? undefined);
      }
      dispatch({ type: 'UPDATE_SESSION_STATS', payload: { isCorrect: result.isCorrect } });

      await new Promise(resolve => setTimeout(resolve, 150));

      dispatch({ type: 'SET_VALIDATION_RESULT', payload: result });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: { message: (error as Error).message, isFatal: false }
      });
      dispatch({ type: 'NEXT_QUESTION' });
    }
  }, [state.answerLanguage, state.currentLevelId, state.mode, dispatch, listen, progressService]);

  const startQuestion = useCallback(async () => {
    abortRef.current = false;
    try {
      const number = numberGenerator.generateForLevel(state.currentLevelId);

      dispatch({ type: 'START_QUESTION', payload: { number } });

      // Play audio
      await playNumber(number, state.questionLanguage!);

      // If aborted during audio playback (level/mode switch), bail out
      if (abortRef.current) return;

      // Auto-start recording after audio finishes
      await doRecordAndValidate(number);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: { message: (error as Error).message, isFatal: false }
      });
      dispatch({ type: 'NEXT_QUESTION' });
    }
  }, [state.questionLanguage, state.currentLevelId, dispatch, playNumber, numberGenerator, doRecordAndValidate]);

  const stopRecording = useCallback(() => {
    stop();
  }, [stop]);

  const handleRetry = useCallback(() => {
    restart();
    setRetryCount(c => c + 1);
  }, [restart]);

  const replayAudio = useCallback(async () => {
    if (!state.currentNumber || !state.questionLanguage) return;
    try {
      // Stop mic so it doesn't pick up the playback audio
      stop();
      await playNumber(state.currentNumber, state.questionLanguage);
      // Restart recording after playback
      restart();
      setRetryCount(c => c + 1);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: { message: (error as Error).message, isFatal: false }
      });
    }
  }, [state.currentNumber, state.questionLanguage, playNumber, dispatch, stop, restart]);

  // Feedback handlers
  const handleNext = useCallback(() => {
    cancelAutoAdvance();
    dispatch({ type: 'NEXT_QUESTION' });
  }, [cancelAutoAdvance, dispatch]);

  const handleFeedbackReplay = useCallback(async () => {
    cancelAutoAdvance();
    if (!state.currentNumber || !state.questionLanguage) return;
    try {
      await playNumber(state.currentNumber, state.questionLanguage);
    } catch (error) {
      console.error('Failed to replay audio:', error);
    }
  }, [state.currentNumber, state.questionLanguage, playNumber, cancelAutoAdvance]);

  const handleTryNewLevel = useCallback(() => {
    cancelAutoAdvance();
    if (unlockDetail && state.mode) {
      progressService.setCurrentLevel(state.mode, unlockDetail.nextLevelId);
      dispatch({ type: 'SET_LEVEL', payload: { levelId: unlockDetail.nextLevelId } });
    }
  }, [cancelAutoAdvance, unlockDetail, state.mode, progressService, dispatch]);

  // Auto-start next question after feedback auto-advance, and clean up on level/mode switch
  const prevStateRef = useRef(state.currentState);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state.currentState;

    if (state.currentState === 'READY' && prev === 'FEEDBACK') {
      startQuestion();
    }

    // Clean up if level/mode switch happened mid-recording or mid-playback
    if (state.currentState === 'READY' && (prev === 'LISTENING' || prev === 'SPEAKING')) {
      abortRef.current = true;
      stop();
      stopAudio();
    }
  }, [state.currentState, startQuestion, stop, stopAudio]);

  // Auto-advance timer for FEEDBACK state
  useEffect(() => {
    if (state.currentState !== 'FEEDBACK') return;
    if (justUnlocked) {
      setAutoAdvanceCancelled(true);
      return;
    }

    setAutoAdvanceCancelled(false);
    autoAdvanceRef.current = setTimeout(() => {
      dispatch({ type: 'NEXT_QUESTION' });
    }, autoAdvanceMs);

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
        autoAdvanceRef.current = null;
      }
    };
  }, [state.currentState, dispatch, justUnlocked, autoAdvanceMs]);

  // Auto-cutoff: stop recording after timeout expires
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimeoutMs = LEVEL_RECORDING_TIMEOUTS[state.currentLevelId] ?? DEFAULT_RECORDING_TIMEOUT;

  useEffect(() => {
    if (state.currentState === 'LISTENING') {
      timeoutRef.current = setTimeout(() => {
        stop();
      }, recordingTimeoutMs);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [state.currentState, recordingTimeoutMs, stop, retryCount]);

  // Don't render if not in practice states
  if (
    state.currentState === 'MODE_SELECTION' ||
    state.currentState === 'LEVEL_SELECTION'
  ) {
    return null;
  }

  // --- Derived values for rendering ---

  const getNextLevelDisplayName = () => {
    if (!unlockDetail) return '';
    if (uiLanguage === 'ja') {
      return levelService.getLevelById(unlockDetail.nextLevelId)?.nameJa ?? unlockDetail.nextLevelName;
    }
    return unlockDetail.nextLevelName;
  };

  const getCurrentLevelDisplayName = () => {
    if (!currentLevel) return '';
    return uiLanguage === 'ja' ? currentLevel.nameJa : currentLevel.name;
  };

  const isFeedback = state.currentState === 'FEEDBACK';
  const feedbackResult = state.validationResult;

  const getStatusContent = () => {
    switch (state.currentState) {
      case 'READY':
        return { icon: '🎯', text: t('practice.ready') };
      case 'SPEAKING':
        return { icon: '🔊', text: t('practice.listen') };
      case 'LISTENING':
        return { icon: '🎤', text: t('practice.yourTurn'), pulse: true };
      case 'VALIDATING':
        return { icon: '⏳', text: t('practice.checking') };
      case 'FEEDBACK':
        if (isCorrect) {
          return { icon: '✓', text: t('feedback.correct'), feedbackClass: 'correct' as const };
        }
        return { icon: '✗', text: t('feedback.incorrect'), feedbackClass: 'incorrect' as const };
      default:
        return { icon: '🎯', text: t('practice.ready') };
    }
  };

  const status = getStatusContent();

  // Feedback formatting helpers (only used when in FEEDBACK state with a valid number)
  const formatNumber = (num: number, lang: 'ja' | 'en') =>
    lang === 'ja' ? converter.formatJapaneseNumeric(num) : converter.formatEnglishNumeric(num);

  const formatUserAnswer = (): string => {
    if (!feedbackResult || !feedbackResult.userParsed || feedbackResult.userNumber === null) {
      return t('feedback.notRecognized', { answer: feedbackResult?.userAnswer ?? '' });
    }
    if (state.answerLanguage === 'ja') {
      return converter.formatJapaneseNumeric(feedbackResult.userNumber);
    }
    return feedbackResult.userNumber.toLocaleString();
  };

  const explainDifference = (userNum: number, correctNum: number): string => {
    const userStr = userNum.toString();
    const correctStr = correctNum.toString();
    if (userStr.length !== correctStr.length) {
      if (userStr.length < correctStr.length) {
        return t('feedback.fewerDigits', { userDigits: userStr.length, correctDigits: correctStr.length });
      }
      return t('feedback.moreDigits', { userDigits: userStr.length, correctDigits: correctStr.length });
    }
    for (let i = 0; i < userStr.length; i++) {
      if (userStr[i] !== correctStr[i]) {
        const placeKeys = ['place.ones', 'place.tens', 'place.hundreds', 'place.thousands'] as const;
        const place = userStr.length - 1 - i;
        const placeName = place < placeKeys.length ? t(placeKeys[place]) : t('place.digit', { position: place + 1 });
        return t('feedback.checkPlace', { place: placeName });
      }
    }
    return t('feedback.tryAgain');
  };

  const getExplanation = (): string => {
    if (!feedbackResult || feedbackResult.isCorrect) return '';
    if (feedbackResult.userParsed && feedbackResult.userNumber !== null) {
      const diff = Math.abs(feedbackResult.userNumber - feedbackResult.correctNumber);
      const percentDiff = (diff / feedbackResult.correctNumber) * 100;
      if (percentDiff < 10) {
        return t('feedback.veryClose', { diff: diff.toLocaleString() });
      }
      return explainDifference(feedbackResult.userNumber, feedbackResult.correctNumber);
    }
    return t('feedback.trySayingComplete');
  };

  // Determine question-container classes
  const containerClasses = [
    'question-container',
    isFeedback && isCorrect && 'feedback-correct',
    isFeedback && !isCorrect && 'feedback-incorrect',
  ].filter(Boolean).join(' ');

  return (
    <div className="practice-area">
      <PracticeNav />

      {noSpeechFlash && (
        <div className="no-speech-flash">{t('feedback.noSpeechDetected')}</div>
      )}

      <div className={containerClasses}>
        <div className="status-area">
          <div className={`status-icon${status.pulse ? ' pulse' : ''}${'feedbackClass' in status ? ` feedback-icon-${status.feedbackClass}` : ''}`}>
            {status.icon}
          </div>
          <div className={`status-text${'feedbackClass' in status ? ` feedback-text-${status.feedbackClass}` : ''}`}>
            {status.text}
          </div>
          {isRecording && (
            <Waveform key={retryCount} analyserRef={analyserRef} active={isRecording} />
          )}
        </div>

        {state.currentState === 'LISTENING' && (
          <div className="recording-timer-container">
            <div
              className="recording-timer-bar"
              key={`${state.currentNumber}-${retryCount}`}
              style={{ '--timer-duration': `${recordingTimeoutMs / 1000}s` } as React.CSSProperties}
            />
          </div>
        )}

        {/* Transcript during VALIDATING only */}
        {state.userTranscript && !isFeedback && (
          <div className="transcript-area">
            <div className="label">{t('practice.youSaid')}</div>
            <div className="transcript-text">"{state.userTranscript}"</div>
          </div>
        )}

        {/* Feedback details for incorrect answers */}
        {isFeedback && feedbackResult && !isCorrect && state.currentNumber != null && (
          <div className="feedback-details">
            <div className="feedback-row">
              <div className="label">{t('feedback.theNumberWas')}</div>
              <div className="value number-display">{formatNumber(state.currentNumber, state.questionLanguage!)}</div>
            </div>
            <div className="feedback-row">
              <div className="label">{t('feedback.youSaid')}</div>
              <div className="value user-answer">{formatUserAnswer()}</div>
            </div>
            <div className="feedback-row">
              <div className="label">{t('feedback.correctAnswer')}</div>
              <div className="value correct-answer">{formatNumber(state.currentNumber, state.answerLanguage!)}</div>
            </div>
            <div className="feedback-explanation">
              {getExplanation()}
            </div>
          </div>
        )}

        {/* Auto-advance bar */}
        {isFeedback && !autoAdvanceCancelled && (
          <div className="auto-advance-container">
            <div
              className="auto-advance-bar"
              key={state.currentNumber}
              style={{ '--auto-advance-duration': `${autoAdvanceMs / 1000}s` } as React.CSSProperties}
            />
          </div>
        )}

        {/* Streak/unlock progress during feedback */}
        {isFeedback && unlockDetail && !justUnlocked && (
          <div className="feedback-progress-section">
            <div className={`feedback-req ${isCorrect ? 'met' : 'bottleneck'}`}>
              <span className="req-icon">{isCorrect ? '🔥' : '○'}</span>
              {isCorrect
                ? t('feedback.streakProgress', { current: unlockDetail.streak.current, required: unlockDetail.streak.required, levelName: getNextLevelDisplayName() })
                : state.sessionStats.previousStreak >= 3
                  ? t('feedback.streakLost', { lost: state.sessionStats.previousStreak, required: unlockDetail.streak.required, levelName: getNextLevelDisplayName() })
                  : t('feedback.streakReset', { required: unlockDetail.streak.required, levelName: getNextLevelDisplayName() })
              }
            </div>
          </div>
        )}

        {isFeedback && justUnlocked && unlockDetail && (
          <div className="feedback-progress-section">
            <div className="feedback-unlock-message">
              {t('feedback.levelUnlocked', { levelName: getNextLevelDisplayName() })}
            </div>
          </div>
        )}
      </div>

      <div className="button-container">
        {state.currentState === 'READY' && (
          <button className="primary-button" onClick={startQuestion}>
            {t('practice.go')}
          </button>
        )}

        {(state.currentState === 'SPEAKING' || state.currentState === 'LISTENING') && (
          <>
            {isListening && (
              <>
                <button className="stop-button" onClick={stopRecording}>
                  {t('practice.stopRecording')}
                </button>
                <button className="secondary-button" onClick={handleRetry}>
                  {t('practice.retry')}
                </button>
              </>
            )}
            <button className="secondary-button" onClick={replayAudio}>
              {t('practice.hearAgain')}
            </button>
          </>
        )}

        {isFeedback && !justUnlocked && (
          <>
            <button className="primary-button" onClick={handleNext}>
              {t('feedback.next')}
            </button>
            <button className="secondary-button" onClick={handleFeedbackReplay}>
              🔊 {t('feedback.replay')}
            </button>
          </>
        )}

        {isFeedback && justUnlocked && (
          <>
            <button className="primary-button unlock-try-button" onClick={handleTryNewLevel}>
              {t('feedback.tryNewLevel', { levelName: getNextLevelDisplayName() })}
            </button>
            <button className="secondary-button" onClick={handleNext}>
              {t('feedback.stayOn', { levelName: getCurrentLevelDisplayName() })}
            </button>
          </>
        )}
      </div>

      {state.currentState === 'READY' && (
        <div className="heatmap-section">
          <button
            className="heatmap-toggle"
            onClick={() => setShowHeatmap(prev => !prev)}
          >
            {showHeatmap ? t('practice.hideStats') : t('practice.stats')}
          </button>
          {showHeatmap && <AttemptHeatmap />}
        </div>
      )}
    </div>
  );
}
