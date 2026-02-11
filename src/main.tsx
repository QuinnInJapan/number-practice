import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './i18n';
import { AppProvider } from './store/AppContext';
import { ServiceProvider } from './contexts/ServiceContext';
import App from './App';
import './styles/reset.css';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ServiceProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ServiceProvider>
    </LanguageProvider>
  </StrictMode>,
);
