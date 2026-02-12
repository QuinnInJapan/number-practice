import { useAppContext } from '../../store/AppContext';
import { useLevelService, useProgressService } from '../../contexts/ServiceContext';
import { useTranslation } from '../../i18n';
import type { PracticeMode } from '../../types';
import './PracticeNav.css';

export function PracticeNav() {
  const { state, dispatch } = useAppContext();
  const levelService = useLevelService();
  const progressService = useProgressService();
  const { t, uiLanguage } = useTranslation();

  const levels = levelService.getLevels();

  const handleModeSwitch = (mode: PracticeMode) => {
    if (mode === state.mode) return;

    const questionLang = mode === 'ja-to-en' ? 'ja' : 'en';
    const answerLang = mode === 'ja-to-en' ? 'en' : 'ja';

    // Try to keep the same level; if locked in new mode, fall back to first level
    const newProgress = progressService.getProgress(mode);
    const targetLevelId = levelService.isUnlocked(state.currentLevelId, newProgress)
      ? state.currentLevelId
      : 'anchors';

    progressService.setCurrentLevel(mode, targetLevelId);
    dispatch({
      type: 'SWITCH_MODE',
      payload: { mode, questionLang, answerLang, levelId: targetLevelId },
    });
  };

  const handleLevelSwitch = (levelId: string) => {
    if (levelId === state.currentLevelId) return;
    if (!state.mode) return;

    const progress = progressService.getProgress(state.mode);
    if (!levelService.isUnlocked(levelId, progress)) return;

    progressService.setCurrentLevel(state.mode, levelId);
    dispatch({ type: 'SET_LEVEL', payload: { levelId } });
  };

  const progress = state.mode ? progressService.getProgress(state.mode) : null;

  // Progress toward next level
  const unlockDetail = state.mode && progress
    ? levelService.getDetailedUnlockProgress(state.currentLevelId, progress)
    : null;
  const unlockProgress = state.mode && progress
    ? levelService.getUnlockProgress(state.currentLevelId, progress)
    : 0;

  return (
    <div className="practice-nav">
      <div className="nav-section">
        <div className="nav-section-label">{t('nav.mode')}</div>
        <div className="mode-toggle">
          <button
            className={`mode-pill ${state.mode === 'ja-to-en' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('ja-to-en')}
          >
            {t('mode.jaToEn.short')}
          </button>
          <button
            className={`mode-pill ${state.mode === 'en-to-ja' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('en-to-ja')}
          >
            {t('mode.enToJa.short')}
          </button>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-section-label">{t('nav.level')}</div>
        <div className="level-list">
          {levels.map(level => {
            const unlocked = progress ? levelService.isUnlocked(level.id, progress) : false;
            const mastered = progress ? levelService.isMastered(level.id, progress) : false;
            const isActive = level.id === state.currentLevelId;
            const levelDisplayName = uiLanguage === 'ja' ? level.nameJa : level.name;

            const classes = [
              'level-chip',
              isActive && 'active',
              mastered && 'mastered',
              !unlocked && 'locked',
            ].filter(Boolean).join(' ');

            const description = uiLanguage === 'ja' ? level.descriptionJa : level.description;
            const tooltip = unlocked
              ? `${description}\ne.g. ${level.exampleNumbers.join(', ')}`
              : undefined;

            return (
              <button
                key={level.id}
                className={classes}
                onClick={() => handleLevelSwitch(level.id)}
                data-tooltip={tooltip}
                disabled={!unlocked}
              >
                {!unlocked && '🔒 '}
                {mastered && !isActive && '✓ '}
                {isActive ? `${level.order}. ${levelDisplayName}` : `Lv.${level.order}`}
              </button>
            );
          })}
        </div>

        {unlockDetail && !unlockDetail.streak.met && state.currentState !== 'FEEDBACK' && (
          <div className="nav-progress">
            <div className="nav-progress-bar-container">
              <div
                className="nav-progress-bar"
                style={{ width: `${unlockProgress * 100}%` }}
              />
            </div>
            <span className="nav-progress-label">
              {t('practice.unlockPending', {
                current: unlockDetail.streak.current,
                required: unlockDetail.streak.required,
                levelName: (() => {
                  const nextLevel = levelService.getLevelById(unlockDetail.nextLevelId);
                  const name = uiLanguage === 'ja'
                    ? nextLevel?.nameJa ?? unlockDetail.nextLevelName
                    : unlockDetail.nextLevelName;
                  return nextLevel ? `Lv.${nextLevel.order} ${name}` : name;
                })(),
              })}
            </span>
          </div>
        )}
      </div>

      {state.sessionStats.attempts > 0 && (
        <div className="nav-stats">
          <span className="nav-stat-item">
            {t('practice.correct', {
              correct: state.sessionStats.correct,
              total: state.sessionStats.attempts,
              accuracy: Math.round((state.sessionStats.correct / state.sessionStats.attempts) * 100),
            })}
          </span>
          {state.sessionStats.streak > 1 && (
            <span className="nav-stat-item streak">
              {t('practice.streak', { count: state.sessionStats.streak })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
