import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from './store/AppContext';
import { useTranslation } from './i18n';
import { checkSpeechSupport } from './hooks/useSpeechRecognition';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ModeSelection } from './components/ModeSelection/ModeSelection';
import { LevelSelection } from './components/LevelSelection';
import { PracticeArea } from './components/PracticeArea/PracticeArea';
import { FeedbackArea } from './components/FeedbackArea/FeedbackArea';
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
  const { t, uiLanguage, toggleLanguage } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

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
          <button className="lang-toggle" onClick={toggleLanguage} aria-label="Toggle UI language">
            {uiLanguage === 'en' ? '日本語' : 'EN'}
          </button>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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

        <ErrorBoundary name="FeedbackArea">
          <FeedbackArea />
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
