import React from 'react';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'LIGHT') setTheme('DARK');
    else if (theme === 'DARK') setTheme('SYSTEM');
    else setTheme('LIGHT');
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="p-2 rounded-xl border border-[#C5E6CC] dark:border-gray-700 bg-white dark:bg-gray-800 text-[#17201A] dark:text-gray-200 hover:bg-[#EEF8F0] dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs"
      title={`Current Theme: ${theme}. Click to change.`}
      aria-label="Toggle Theme"
    >
      {theme === 'LIGHT' && <Sun className="w-4 h-4 text-[#E65100]" />}
      {theme === 'DARK' && <Moon className="w-4 h-4 text-[#818CF8]" />}
      {theme === 'SYSTEM' && <Monitor className="w-4 h-4 text-[#2E7D32]" />}
      <span className="hidden sm:inline text-[11px] font-semibold">
        {theme === 'LIGHT' ? 'Light' : theme === 'DARK' ? 'Dark' : 'System'}
      </span>
    </button>
  );
};
