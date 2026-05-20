import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmSheet } from './ConfirmSheet';

interface GameHeaderProps {
  gameId: number;
  targetScore: number;
  dealerName?: string;
  onNewGame?: () => void;
  hasRounds?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  lang?: 'uk' | 'en';
  onLangChange?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  gameId,
  targetScore,
  dealerName,
  onNewGame,
  hasRounds = false,
  soundEnabled = true,
  onSoundToggle,
  lang = 'uk',
  onLangChange,
}) => {
  const { t } = useTranslation();
  const [confirming, setConfirming] = useState(false);

  const handleNewGame = () => {
    if (hasRounds) {
      setConfirming(true);
    } else {
      onNewGame?.();
    }
  };

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden bg-card-bg border border-white/8 p-4">
        {/* Watermark suits */}
        <div className="absolute inset-0 flex items-center justify-center text-7xl text-white/4 font-display pointer-events-none select-none tracking-widest" aria-hidden="true">
          ♠ ♥ ♦ ♣
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl gold-gradient-text">{t('app.title')}</h1>
            <p className="text-muted text-sm">
              {t('header.gameInfo', { id: gameId, score: targetScore })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {dealerName && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                <span className="text-sm">👑</span>
                <span className="text-sm text-white/80 font-sans">{dealerName}</span>
              </div>
            )}

            {onLangChange && (
              <button
                type="button"
                onClick={onLangChange}
                aria-label={lang === 'uk' ? 'Switch to English' : 'Перейти на Українську'}
                className="w-9 h-9 rounded-xl bg-card-bg border border-white/10 text-xs font-bold text-white/70
                  hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
                  flex items-center justify-center"
              >
                {t('header.langToggle')}
              </button>
            )}

            {onSoundToggle && (
              <button
                type="button"
                onClick={onSoundToggle}
                aria-label={soundEnabled ? t('header.soundOff') : t('header.soundOn')}
                className="w-9 h-9 rounded-xl bg-card-bg border border-white/10 text-base
                  hover:border-white/30 transition-all duration-150 active:scale-[0.97]
                  flex items-center justify-center"
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            )}

            {onNewGame && (
              <button
                type="button"
                onClick={handleNewGame}
                className="px-4 py-2 rounded-xl bg-card-bg border border-white/10 text-muted text-sm font-semibold
                  hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
              >
                {t('header.newGame')}
              </button>
            )}
          </div>
        </div>
      </div>

      {confirming && (
        <ConfirmSheet
          title={t('header.confirmNewGame')}
          description={t('header.confirmDesc')}
          confirmLabel={t('header.newGame')}
          onConfirm={() => { setConfirming(false); onNewGame?.(); }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  );
};

export default GameHeader;
