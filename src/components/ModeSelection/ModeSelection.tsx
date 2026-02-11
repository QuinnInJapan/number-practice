import { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { useTranslation } from '../../i18n';
import './ModeSelection.css';

export function ModeSelection() {
  const { state, dispatch } = useAppContext();
  const { t } = useTranslation();
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('onboarding-dismissed')
  );

  if (state.currentState !== 'MODE_SELECTION') {
    return null;
  }

  const handleModeSelect = (mode: 'ja-to-en' | 'en-to-ja') => {
    const questionLang = mode === 'ja-to-en' ? 'ja' : 'en';
    const answerLang = mode === 'ja-to-en' ? 'en' : 'ja';

    dispatch({
      type: 'SET_MODE',
      payload: { mode, questionLang, answerLang }
    });
  };

  const dismissOnboarding = () => {
    localStorage.setItem('onboarding-dismissed', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="mode-selection">
      <h2>{t('mode.chooseTitle')}</h2>
      <p className="mode-subtitle">{t('mode.chooseSubtitle')}</p>

      {showOnboarding && (
        <div className="onboarding-hint">
          <p>{t('onboarding.instruction')}</p>
          <button className="onboarding-dismiss" onClick={dismissOnboarding}>
            {t('onboarding.gotIt')}
          </button>
        </div>
      )}

      <div className="mode-buttons">
        <button className="mode-button" onClick={() => handleModeSelect('ja-to-en')}>
          <div className="mode-icons">🇯🇵 → 🇺🇸</div>
          <div className="mode-title">{t('mode.jaToEn.title')}</div>
          <div className="mode-description">{t('mode.jaToEn.description')}</div>
        </button>
        <button className="mode-button" onClick={() => handleModeSelect('en-to-ja')}>
          <div className="mode-icons">🇺🇸 → 🇯🇵</div>
          <div className="mode-title">{t('mode.enToJa.title')}</div>
          <div className="mode-description">{t('mode.enToJa.description')}</div>
        </button>
      </div>
    </div>
  );
}
