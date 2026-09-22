import React, { createContext, useContext, useState, useEffect } from 'react';
import { LanguageCode, SUPPORTED_LANGUAGES, SupportedLanguage, dictionaries, getNestedTranslation } from '../i18n';
import { en } from '../i18n/en';

interface LanguageContextType {
  language: LanguageCode;
  supportedLanguages: SupportedLanguage[];
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, fallback?: string) => string;
  dict: typeof en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('AGRIGRADE_LANGUAGE') as LanguageCode;
    if (saved && (saved === 'en' || saved === 'ta')) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: LanguageCode) => {
    if (lang === 'en' || lang === 'ta') {
      setLanguageState(lang);
      localStorage.setItem('AGRIGRADE_LANGUAGE', lang);
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const dict = dictionaries[language] || dictionaries.en;

  const t = (path: string, fallback?: string): string => {
    const trans = getNestedTranslation(dict, path);
    if (trans !== path) {
      return trans;
    }
    const fallbackTrans = getNestedTranslation(dictionaries.en, path);
    if (fallbackTrans !== path) {
      return fallbackTrans;
    }
    if (fallback) return fallback;
    if (path.includes('.')) {
      const lastPart = path.split('.').pop() || path;
      return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
    }
    return path;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        supportedLanguages: SUPPORTED_LANGUAGES,
        setLanguage,
        t,
        dict,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { t, language, dict } = useLanguage();
  return { t, language, dict };
};
