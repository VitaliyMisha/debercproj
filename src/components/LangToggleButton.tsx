import type React from 'react';
import { useTranslation } from 'react-i18next';

interface LangToggleButtonProps {
  lang: 'uk' | 'en';
  onClick: () => void;
  /** Extra classes: background/border/positioning per call site. */
  className?: string;
}

export const LangToggleButton: React.FC<LangToggleButtonProps> = ({ lang, onClick, className = 'bg-white/5 border-white/10' }) => {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lang === 'uk' ? 'Switch to English' : 'Перейти на Українську'}
      className={`w-9 h-9 rounded-xl border text-xs font-bold text-white/70
        hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
        flex items-center justify-center ${className}`}
    >
      {t('header.langToggle')}
    </button>
  );
};

export default LangToggleButton;
