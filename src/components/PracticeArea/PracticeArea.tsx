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

export function PracticeArea() {
  const { state, dispatch } = useAppContext();
  const { playNumber } = useAudioPlayer();
  const { listen, stop, restart, isListening } = useSpeechRecognition();
  const numberGenerator = useNumberGenerator();
  const progressService = useProgressService();
  const levelService = useLevelService();
  const { t, uiLanguage } = useTranslation();
  const isRecording = state.currentState === 'LISTENING';
  const { analyserRef } = useMicrophone(isRecording);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const doRecordAndValidate = useCallback(async (number: number) => {
    dispatch({ type: 'START_RECORDING' });

    try {
      const transcript = await listen(state.answerLanguage!);

      // If empty transcript (user stopped early or no speech detected), go back to ready
      if (!transcript.trim()) {
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
    try {
      const number = numberGenerator.generateForLevel(state.currentLevelId);

      dispatch({ type: 'START_QUESTION', payload: { number } });

      // Play audio
      await playNumber(number, state.questionLanguage!);

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
      await playNumber(state.currentNumber, state.questionLanguage);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: { message: (error as Error).message, isFatal: false }
      });
    }
  }, [state.currentNumber, state.questionLanguage, playNumber, dispatch]);

  // Auto-start next question after feedback auto-advance
  const prevStateRef = useRef(state.currentState);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state.currentState;

    if (state.currentState === 'READY' && prev === 'FEEDBACK') {
      startQuestion();
    }
  }, [state.currentState, startQuestion]);

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
    state.currentState === 'LEVEL_SELECTION' ||
    state.currentState === 'FEEDBACK'
  ) {
    return null;
  }

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
      default:
        return { icon: '🎯', text: t('practice.ready') };
    }
  };

  const status = getStatusContent();
  const { sessionStats } = state;
  const accuracy = sessionStats.attempts > 0
    ? Math.round((sessionStats.correct / sessionStats.attempts) * 100)
    : 0;

  // Compute unlock progress toward next level
  const unlockDetail = state.mode
    ? levelService.getDetailedUnlockProgress(
        state.currentLevelId,
        progressService.getProgress(state.mode)
      )
    : null;

  const getNextLevelDisplayName = () => {
    if (!unlockDetail) return '';
    if (uiLanguage === 'ja') {
      return levelService.getLevelById(unlockDetail.nextLevelId)?.nameJa ?? unlockDetail.nextLevelName;
    }
    return unlockDetail.nextLevelName;
  };

  return (
    <div className="practice-area">
      <PracticeNav />

      {sessionStats.attempts > 0 && (
        <div className="session-stats">
          <span className="stat-item">
            {t('practice.correct', { correct: sessionStats.correct, total: sessionStats.attempts, accuracy })}
          </span>
          {sessionStats.streak > 1 && (
            <span className="stat-item streak">
              {t('practice.streak', { count: sessionStats.streak })}
            </span>
          )}
        </div>
      )}

      <div className="unlock-progress">
        {unlockDetail ? (
          unlockDetail.streak.met
            ? <span className="unlock-done">{t('practice.unlockDone', { levelName: getNextLevelDisplayName() })}</span>
            : <span className="unlock-pending">{t('practice.unlockPending', { current: unlockDetail.streak.current, required: unlockDetail.streak.required, levelName: getNextLevelDisplayName() })}</span>
        ) : (
          <span className="unlock-final">{t('practice.finalLevel')}</span>
        )}
      </div>

      <div className="question-container">
        <div className="status-area">
          <div className={`status-icon ${status.pulse ? 'pulse' : ''}`}>{status.icon}</div>
          <div className="status-text">{status.text}</div>
          {isRecording && (
            <Waveform analyserRef={analyserRef} active={isRecording} />
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

        {state.userTranscript && (
          <div className="transcript-area">
            <div className="label">{t('practice.youSaid')}</div>
            <div className="transcript-text">"{state.userTranscript}"</div>
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
