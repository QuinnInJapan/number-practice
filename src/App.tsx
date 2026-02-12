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
  const { state, dispatch } = useAppContext();
  const { t, uiLanguage, setLanguage } = useTranslation();
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Dynamic page title based on mode + UI language
  useEffect(() => {
    const titles = {
      en: {
        default: 'Number Practice — JP/EN Interpretation',
        'ja-to-en': 'JP → EN — Number Practice',
        'en-to-ja': 'EN → JP — Number Practice',
      },
      ja: {
        default: '数字練習 — 日英通訳',
        'ja-to-en': '日→英 — 数字練習',
        'en-to-ja': '英→日 — 数字練習',
      },
    };
    document.title = titles[uiLanguage][state.mode ?? 'default'];
  }, [uiLanguage, state.mode]);

  // Dynamic favicon based on mode
  useEffect(() => {
    const char = state.mode === 'ja-to-en' ? '日' : state.mode === 'en-to-ja' ? '英' : '数';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#d48a18"/><text x="16" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="20" fill="#fff">${char}</text></svg>`;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }, [state.mode]);

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
        <div className="header-controls">
          <button
            className={`toggle-switch ${uiLanguage === 'ja' ? 'toggled' : ''}`}
            onClick={() => setLanguage(uiLanguage === 'en' ? 'ja' : 'en')}
            role="switch"
            aria-checked={uiLanguage === 'ja'}
            aria-label="UI language"
          >
            <span className={`toggle-label ${uiLanguage === 'en' ? 'active' : ''}`}>EN</span>
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            <span className={`toggle-label ${uiLanguage === 'ja' ? 'active' : ''}`}>JA</span>
          </button>

          <button
            className={`toggle-switch ${theme === 'dark' ? 'toggled' : ''}`}
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            role="switch"
            aria-checked={theme === 'dark'}
            aria-label="Theme"
          >
            <span className="toggle-track toggle-track-theme">
              <span className="toggle-thumb">
                {theme === 'light' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
              </span>
            </span>
          </button>
        </div>
        <h1>{t('app.title')}</h1>
        <p className="subtitle">{t('app.subtitle')}</p>
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
