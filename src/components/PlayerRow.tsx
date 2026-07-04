import React from 'react';
import { useTranslation } from 'react-i18next';
import { NameInput } from './NameInput';

const EASTER_EGGS: Array<{ keywords: string[]; emoji: string }> = [
  { keywords: ['заєць', 'заєц', 'заец', 'заець', 'косой'], emoji: '🐰' },
  { keywords: ['бая', 'кот'], emoji: '😸' },
  { keywords: ['киш', 'кіш'], emoji: '🥷' },
  { keywords: ['сірко', 'сирко'], emoji: '🐶' },
  { keywords: ['горох'], emoji: '🫛' },
  { keywords: ['ося'], emoji: '🥥' },
];

const applyEasterEgg = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  for (const { keywords, emoji } of EASTER_EGGS) {
    if (keywords.includes(trimmed)) return `${emoji} ${value}`;
  }
  return value;
};

interface PlayerRowProps {
  index: number;
  name: string;
  isDealer: boolean;
  onNameChange: (name: string) => void;
  onSetDealer: () => void;
  suggestions?: string[];
}

export const PlayerRow: React.FC<PlayerRowProps> = ({
  index,
  name,
  isDealer,
  onNameChange,
  onSetDealer,
  suggestions = [],
}) => {
  const { t } = useTranslation();
  const initial = Array.from(name.trim())[0]?.toUpperCase() || String(index + 1);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
      <button
        type="button"
        onClick={onSetDealer}
        title={t('setup.setDealer')}
        aria-pressed={isDealer}
        className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg shrink-0
          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
          ${isDealer
            ? 'text-gold-to ring-2 ring-gold-from'
            : 'text-white'
          }`}
        style={{ background: isDealer ? 'linear-gradient(135deg, #78350F, #92400E)' : 'linear-gradient(135deg, #15803D, #166534)' }}
      >
        {isDealer ? '👑' : initial}
      </button>

      <NameInput
        id={`player-name-${index}`}
        name={`player-name-${index}`}
        value={name}
        placeholder={t('setup.playerName', { n: index + 1 })}
        suggestions={suggestions}
        onChange={(value) => onNameChange(applyEasterEgg(value))}
      />
    </div>
  );
};

export default PlayerRow;
