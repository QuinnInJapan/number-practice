import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { useLevelService, useProgressService } from '../../contexts/ServiceContext';
import { useTranslation } from '../../i18n';
import { NumberConverter } from '../../services/NumberConverter';
import { PracticeNav } from '../PracticeNav/PracticeNav';
import './FeedbackArea.css';

const converter = new NumberConverter();
const AUTO_ADVANCE_CORRECT_MS = 1000;
const AUTO_ADVANCE_INCORRECT_MS = 2500;

export function FeedbackArea() {
  const { state, dispatch } = useAppContext();
  const { playNumber } = useAudioPlayer();
  const levelService = useLevelService();
  const progressService = useProgressService();
  const { t, uiLanguage } = useTranslation();

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoAdvanceCancelled, setAutoAdvanceCancelled] = useState(false);

  // Compute unlock progress early so we can use it in the auto-advance effect
  const unlockDetail = state.mode
    ? levelService.getDetailedUnlockProgress(
        state.currentLevelId,
        progressService.getProgress(state.mode)
      )
    : null;

  const currentLevel = levelService.getLevelById(state.currentLevelId);
  const justUnlocked = unlockDetail?.streak.met ?? false;

  const cancelAutoAdvance = useCallback(() => {
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    setAutoAdvanceCancelled(true);
  }, []);

  const isCorrect = state.validationResult?.isCorrect ?? false;
  const autoAdvanceMs = isCorrect ? AUTO_ADVANCE_CORRECT_MS : AUTO_ADVANCE_INCORRECT_MS;

  // Auto-advance to next question (skip when a level was just unlocked)
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

  // All hooks must be called before any conditional returns
  const handleReplay = useCallback(async () => {
    cancelAutoAdvance();
    if (!state.currentNumber || !state.questionLanguage) return;
    try {
      await playNumber(state.currentNumber, state.questionLanguage);
    } catch (error) {
      console.error('Failed to replay audio:', error);
    }
  }, [state.currentNumber, state.questionLanguage, playNumber, cancelAutoAdvance]);

  if (state.currentState !== 'FEEDBACK' || !state.validationResult) {
    return null;
  }

  const result = state.validationResult;

  const handleNext = () => {
    cancelAutoAdvance();
    dispatch({ type: 'NEXT_QUESTION' });
  };

  const handleTryNewLevel = () => {
    cancelAutoAdvance();
    if (unlockDetail && state.mode) {
      progressService.setCurrentLevel(state.mode, unlockDetail.nextLevelId);
      dispatch({ type: 'SET_LEVEL', payload: { levelId: unlockDetail.nextLevelId } });
    }
  };

  // Format number for display (question language format)
  const formattedNumber = state.questionLanguage === 'ja'
    ? converter.formatJapaneseNumeric(state.currentNumber!)
    : converter.formatEnglishNumeric(state.currentNumber!);

  // Format correct answer in answer language's numeric format
  const correctAnswerDisplay = state.answerLanguage === 'ja'
    ? converter.formatJapaneseNumeric(state.currentNumber!)
    : converter.formatEnglishNumeric(state.currentNumber!);

  // Format user's answer if parsed - use answer language format
  const formatUserAnswer = (): string => {
    if (!result.userParsed || result.userNumber === null) {
      return t('feedback.notRecognized', { answer: result.userAnswer });
    }
    // Format in the answer language
    if (state.answerLanguage === 'ja') {
      return converter.formatJapaneseNumeric(result.userNumber);
    }
    return result.userNumber.toLocaleString();
  };

  // Explain difference for wrong numbers
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

  // Generate feedback explanation
  const getExplanation = (): string => {
    if (result.isCorrect) return '';

    if (result.userParsed && result.userNumber !== null) {
      const diff = Math.abs(result.userNumber - result.correctNumber);
      const percentDiff = (diff / result.correctNumber) * 100;

      if (percentDiff < 10) {
        return t('feedback.veryClose', { diff: diff.toLocaleString() });
      }
      return explainDifference(result.userNumber, result.correctNumber);
    }

    return t('feedback.trySayingComplete');
  };

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

  return (
    <div className={`feedback-area ${result.isCorrect ? 'correct' : 'incorrect'}`}>
      <PracticeNav />

      <div className="feedback-header">
        <div className={`feedback-icon ${result.isCorrect ? 'correct' : 'incorrect'}`}>
          {result.isCorrect ? '✓' : '✗'}
        </div>
        <div className={`feedback-message ${result.isCorrect ? 'correct' : 'incorrect'}`}>
          {result.isCorrect ? t('feedback.correct') : t('feedback.incorrect')}
        </div>
      </div>

      <div className="feedback-details">
        <div className="feedback-row">
          <div className="label">{t('feedback.theNumberWas')}</div>
          <div className="value number-display">{formattedNumber}</div>
        </div>

        {!result.isCorrect && (
          <>
            <div className="feedback-row">
              <div className="label">{t('feedback.youSaid')}</div>
              <div className="value user-answer">
                {formatUserAnswer()}
              </div>
            </div>

            <div className="feedback-row">
              <div className="label">{t('feedback.correctAnswer')}</div>
              <div className="value correct-answer">
                {correctAnswerDisplay}
              </div>
            </div>

            <div className="feedback-explanation">
              {getExplanation()}
            </div>
          </>
        )}
      </div>

      {unlockDetail && (
        <div className="feedback-progress-section">
          {unlockDetail.streak.met ? (
            <>
              <div className="feedback-unlock-message">
                {t('feedback.levelUnlocked', { levelName: getNextLevelDisplayName() })}
              </div>
              <div className="unlock-actions">
                <button className="primary-button unlock-try-button" onClick={handleTryNewLevel}>
                  {t('feedback.tryNewLevel', { levelName: getNextLevelDisplayName() })}
                </button>
                <button className="secondary-button" onClick={handleNext}>
                  {t('feedback.stayOn', { levelName: getCurrentLevelDisplayName() })}
                </button>
              </div>
            </>
          ) : (
            <div className={`feedback-req ${result.isCorrect ? 'met' : 'bottleneck'}`}>
              <span className="req-icon">{result.isCorrect ? '🔥' : '○'}</span>
              {result.isCorrect
                ? t('feedback.streakProgress', { current: unlockDetail.streak.current, required: unlockDetail.streak.required, levelName: getNextLevelDisplayName() })
                : t('feedback.streakReset', { required: unlockDetail.streak.required, levelName: getNextLevelDisplayName() })
              }
            </div>
          )}
        </div>
      )}

      <div className="button-container">
        <button className="primary-button" onClick={handleNext}>
          {t('feedback.next')}
        </button>
        <button className="secondary-button" onClick={handleReplay}>
          🔊 {t('feedback.replay')}
        </button>
      </div>

      {!autoAdvanceCancelled && (
        <div className="auto-advance-container">
          <div
            className="auto-advance-bar"
            key={state.currentNumber}
            style={{ '--auto-advance-duration': `${autoAdvanceMs / 1000}s` } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  );
}
