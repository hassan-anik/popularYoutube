import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Check } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../../i18n';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('toptube_language', langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1 bg-[var(--border)] hover:bg-[var(--border-hover)] rounded-lg text-sm transition-colors"
        title="Change Language"
      >
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden md:inline text-[var(--text-secondary)]">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 w-40 bg-[var(--bg-card)] border border-[var(--border-hover)] rounded-lg shadow-xl z-50 overflow-hidden">
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-[var(--border)] transition-colors ${
                  currentLanguage.code === lang.code ? 'bg-[var(--border)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.name}</span>
                {currentLanguage.code === lang.code && <Check className="w-4 h-4 ml-auto text-green-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;
