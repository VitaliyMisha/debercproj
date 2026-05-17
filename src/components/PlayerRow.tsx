import React from 'react';

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
}

export const PlayerRow: React.FC<PlayerRowProps> = ({
  index,
  name,
  isDealer,
  onNameChange,
  onSetDealer,
}) => {
  const initial = Array.from(name.trim())[0]?.toUpperCase() || String(index + 1);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display text-lg shrink-0"
        style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
      >
        {initial}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(applyEasterEgg(e.target.value))}
        placeholder={`Гравець ${index + 1}`}
        className="flex-1 bg-transparent border-b border-white/20 text-white placeholder-muted
          font-sans text-base py-1 focus:outline-none focus:border-gold-from transition-colors"
      />

      <button
        type="button"
        onClick={onSetDealer}
        title="Призначити дилером"
        aria-pressed={isDealer}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0
          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
          ${
            isDealer
              ? 'bg-gold-from/20 border border-gold-from text-gold-to'
              : 'bg-transparent border border-white/15 text-muted hover:border-white/40 hover:text-white'
          }`}
      >
        👑
      </button>
    </div>
  );
};

export default PlayerRow;
