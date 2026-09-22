import { en } from './en';
import { ta } from './ta';

export type LanguageCode = 'en' | 'ta';

export interface SupportedLanguage {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
];

export const dictionaries: Record<LanguageCode, typeof en> = {
  en,
  ta: ta as typeof en,
};

export const getNestedTranslation = (obj: any, path: string): string => {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return path;
    }
  }
  return typeof current === 'string' ? current : path;
};
