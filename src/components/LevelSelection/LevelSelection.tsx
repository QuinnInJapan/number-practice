import { useAppContext } from '../../store/AppContext';
import { useLevelService, useProgressService } from '../../contexts/ServiceContext';
import { useTranslation } from '../../i18n';
import { getLevelConfigById } from '../../config/levels';
import './LevelSelection.css';

export function LevelSelection() {
  const { state, dispatch } = useAppContext();
  const levelService = useLevelService();
  const progressService = useProgressService();
  const { t, uiLanguage } = useTranslation();

  if (state.currentState !== 'LEVEL_SELECTION' || !state.mode) {
    return null;
  }

  const progress = progressService.getProgress(state.mode);
  const levels = levelService.getLevels();

  const handleLevelSelect = (levelId: string) => {
    if (!levelService.isUnlocked(levelId, progress)) {
      return;
    }

    progressService.setCurrentLevel(state.mode!, levelId);
    dispatch({ type: 'SET_LEVEL', payload: { levelId } });
  };

  const handleBackToMode = () => {
    dispatch({ type: 'CHANGE_MODE' });
  };

  const modeLabel = state.mode === 'ja-to-en'
    ? t('mode.jaToEn.title')
    : t('mode.enToJa.title');

  return (
    <div className="level-selection">
      <div className="level-header">
        <button className="back-button" onClick={handleBackToMode}>
          {t('level.back')}
        </button>
        <h2>{t('level.selectTitle')}</h2>
        <p className="mode-indicator">{t('level.modeIndicator', { mode: modeLabel })}</p>
      </div>

      <div className="levels-grid">
        {levels.map((level) => {
          const isUnlocked = levelService.isUnlocked(level.id, progress);
          const isMastered = levelService.isMastered(level.id, progress);
          const levelProgress = progress.levels[level.id];
          const accuracy = levelService.getAccuracy(level.id, progress);
          const progressToNext = levelService.getUnlockProgress(level.id, progress);
          const unlockDetail = levelService.getDetailedUnlockProgress(level.id, progress);

          const levelName = uiLanguage === 'ja' ? level.nameJa : level.name;
          const levelDesc = uiLanguage === 'ja' && level.descriptionJa ? level.descriptionJa : level.description;
          const requiredLevelConfig = level.unlock.requiredLevel ? getLevelConfigById(level.unlock.requiredLevel) : null;
          const requiredLevelName = requiredLevelConfig
            ? (uiLanguage === 'ja' ? requiredLevelConfig.nameJa : requiredLevelConfig.name)
            : '';

          return (
            <button
              key={level.id}
              className={`level-card ${isUnlocked ? 'unlocked' : 'locked'} ${isMastered ? 'mastered' : ''}`}
              onClick={() => handleLevelSelect(level.id)}
              disabled={!isUnlocked}
            >
              <div className="level-badge">
                {isMastered ? '★' : isUnlocked ? level.order : '🔒'}
              </div>

              <div className="level-info">
                <h3 className="level-name">
                  {levelName}
                  {uiLanguage !== 'ja' && <span className="level-name-ja">{level.nameJa}</span>}
                </h3>
                <p className="level-description">{levelDesc}</p>

                {level.exampleNumbers && (
                  <div className="level-examples">
                    {level.exampleNumbers.map((ex, i) => (
                      <span key={i} className="example-number">{ex}</span>
                    ))}
                  </div>
                )}

                {isUnlocked && levelProgress && levelProgress.attempts > 0 && (
                  <div className="level-stats">
                    <span className="stat">
                      {t('level.attempts', { count: levelProgress.attempts })}
                    </span>
                    <span className="stat">
                      {t('level.accuracy', { percent: Math.round(accuracy * 100) })}
                    </span>
                  </div>
                )}

                {isUnlocked && !isMastered && unlockDetail && (
                  <>
                    <div className={`requirement-row ${unlockDetail.streak.met ? 'met' : 'unmet'}`}>
                      {t('level.streakToward', {
                        current: unlockDetail.streak.current,
                        required: unlockDetail.streak.required,
                        nextLevel: uiLanguage === 'ja'
                          ? levelService.getLevelById(unlockDetail.nextLevelId)?.nameJa ?? unlockDetail.nextLevelName
                          : unlockDetail.nextLevelName,
                      })}
                    </div>
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${progressToNext * 100}%` }}
                      />
                    </div>
                  </>
                )}

                {!isUnlocked && level.unlock.requiredLevel && (
                  <div className="unlock-hint">
                    {t('level.unlockHint', {
                      count: level.unlock.requiredStreak,
                      levelName: requiredLevelName,
                    })}
                  </div>
                )}
              </div>

              <div className="level-concepts">
                {level.concepts.slice(0, 2).map((concept, i) => (
                  <span key={i} className="concept-tag">{concept}</span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="level-footer">
        <p className="total-stats">
          {t('level.totalStats', {
            attempts: progress.totals.attempts,
            correct: progress.totals.correct,
            bestStreak: progress.totals.bestStreak,
          })}
        </p>
      </div>
    </div>
  );
}
