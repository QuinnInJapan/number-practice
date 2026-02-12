import { useEffect, useState } from 'react';
import { useAppContext } from './store/AppContext';
import { useTranslation } from './i18n';
import { checkSpeechSupport } from './hooks/useSpeechRecognition';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ModeSelection } from './components/ModeSelection/ModeSelection';
import { LevelSelection } from './components/LevelSelection';
import { PracticeArea } from './components/PracticeArea/PracticeArea';
import { ErrorDisplay } from './components/ErrorDisplay/ErrorDisplay';
import './styles/App.css';

function getInitialTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

function AppContent() {
  const { dispatch } = useAppContext();
  const { t, uiLanguage, setLanguage } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!checkSpeechSupport()) {
      dispatch({
        type: 'SET_ERROR',
        payload: {
          message: t('error.speechNotSupported'),
          isFatal: true
        }
      });
    }
  }, [dispatch]);

  return (
    <div className="container">
      <header className="app-header">
        <h1>{t('app.title')}</h1>
        <p className="subtitle">{t('app.subtitle')}</p>
        <div className="header-controls">
          <div className="header-segmented" role="group" aria-label="UI language">
            <button className={uiLanguage === 'en' ? 'active' : ''} onClick={() => setLanguage('en')}>EN</button>
            <button className={uiLanguage === 'ja' ? 'active' : ''} onClick={() => setLanguage('ja')}>JA</button>
          </div>
          <div className="header-segmented" role="group" aria-label="Theme">
            <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>☀️</button>
            <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>🌙</button>
          </div>
        </div>
      </header>

      <main>
        <ErrorBoundary name="ModeSelection">
          <ModeSelection />
        </ErrorBoundary>

        <ErrorBoundary name="LevelSelection">
          <LevelSelection />
        </ErrorBoundary>

        <ErrorBoundary name="PracticeArea">
          <PracticeArea />
        </ErrorBoundary>

        <ErrorDisplay />
      </main>

      <footer>
        <p>{t('footer.browserRecommendation')}</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary name="App">
      <AppContent />
    </ErrorBoundary>
  );
}
