import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type UILanguage, type TranslationKey } from './translations';

interface LanguageContextType {
  uiLanguage: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): UILanguage {
  const saved = localStorage.getItem('ui-language');
  if (saved === 'en' || saved === 'ja') return saved;
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>(getInitialLanguage);

  const setLanguage = useCallback((lang: UILanguage) => {
    localStorage.setItem('ui-language', lang);
    setUiLanguage(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setUiLanguage(prev => {
      const next = prev === 'en' ? 'ja' : 'en';
      localStorage.setItem('ui-language', next);
      return next;
    });
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[uiLanguage][key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [paramKey, value] of Object.entries(params)) {
        text = text.replaceAll(`{${paramKey}}`, String(value));
      }
    }
    return text;
  }, [uiLanguage]);

  return (
    <LanguageContext.Provider value={{ uiLanguage, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
}
