import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Globe } from 'lucide-react';
import { LanguageCode } from '../../i18n';

interface LanguageSelectorProps {
  variant?: 'header' | 'dropdown' | 'pill' | 'compact';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'header', className = '' }) => {
  const { language, supportedLanguages, setLanguage } = useLanguage();

  if (variant === 'pill') {
    return (
      <div className={`inline-flex p-1 bg-[#EEF8F0] rounded-2xl border border-[#C5E6CC] ${className}`}>
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              language === lang.code
                ? 'bg-[#2E7D32] text-white shadow-sm'
                : 'text-[#17201A] hover:text-[#2E7D32] hover:bg-[#F4FAF4]'
            }`}
          >
            {lang.nativeLabel} ({lang.label})
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      <Globe className="w-4 h-4 text-[#2E7D32] pointer-events-none" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        aria-label="Select Application Language"
        className="bg-transparent hover:bg-[#EEF8F0] text-xs font-bold text-[#17201A] py-1.5 px-2.5 rounded-xl border border-[#C5E6CC] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2E7D32] transition-colors"
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-white text-[#17201A]">
            {lang.nativeLabel} ({lang.label})
          </option>
        ))}
      </select>
    </div>
  );
};
