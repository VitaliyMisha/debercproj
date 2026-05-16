import React, { ChangeEvent, useState } from 'react';
import { Player } from '../types';
import { GameRulesConfig } from '../types';

interface RoundFormProps {
  players: Player[];
  scores: Record<string, string | number>;
  onScoreChange: (e: ChangeEvent<HTMLInputElement>, id: number) => void;
  onAddRound: () => void;
  roundNumber: number;
  isAddDisabled: boolean;
  gameRules?: GameRulesConfig;
}

const TOKEN_HINTS = ['Б', 'ХВ', 'ВІС'] as const;
const TOKEN_COLORS: Record<string, string> = {
  Б: 'text-token-b border-token-b/60 bg-token-b/10',
  ХВ: 'text-score-neg border-score-neg/60 bg-score-neg/10',
  ВІС: 'text-token-vis border-token-vis/60 bg-token-vis/10',
};

const isTokenActive = (value: string, token: string): boolean =>
  value.trim().toUpperCase() === token;

const RoundForm: React.FC<RoundFormProps> = ({
  players,
  scores,
  onScoreChange,
  onAddRound,
  roundNumber,
  isAddDisabled,
  gameRules,
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const allowVis = gameRules?.allowVis !== false;
  const placeholder = allowVis ? '0, Б, ХВ, ВІС' : '0, Б, ХВ';
  const validTokens = allowVis ? TOKEN_HINTS : (['Б', 'ХВ'] as const);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, playerId: number) => {
    setTouched((prev) => ({ ...prev, [String(playerId)]: true }));
    const val = e.target.value.trim().toUpperCase();
    if (['Б', 'ХВ', 'ВІС'].includes(val)) {
      const syntheticEvent = { ...e, target: { ...e.target, value: val } } as ChangeEvent<HTMLInputElement>;
      onScoreChange(syntheticEvent, playerId);
    }
  };

  return (
    <div className="bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-display text-sm">
          {roundNumber}
        </div>
        <span className="text-white font-sans font-semibold">Раунд</span>

        {/* Token hint chips */}
        <div className="flex gap-1.5 ml-auto">
          {validTokens.map((token) => (
            <span
              key={token}
              className={`px-2 py-0.5 rounded-full text-xs border font-semibold ${TOKEN_COLORS[token]}`}
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      {/* Player inputs */}
      <div className="p-4 space-y-3">
        {players.map((p) => {
          const val = String(scores[p.id] ?? '');
          const activeToken = validTokens.find((t) => isTokenActive(val, t));

          return (
            <div key={p.id} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-display shrink-0"
                style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
              >
                {Array.from(p.name.trim())[0]?.toUpperCase() || '?'}
              </div>
              <span className="flex-1 text-white/80 font-sans text-sm truncate">{p.name}</span>

              <div className="relative shrink-0 w-28">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onScoreChange(e, p.id)}
                  onBlur={(e) => handleBlur(e, p.id)}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2 rounded-xl text-center text-base font-semibold
                    bg-felt border transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-gold-from/40
                    text-white
                    ${activeToken
                      ? TOKEN_COLORS[activeToken].split(' ').filter((c) => c.startsWith('border')).join(' ')
                      : 'border-white/15'
                    }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onAddRound}
          disabled={isAddDisabled}
          className={`w-full py-3 rounded-xl font-semibold text-base transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
            ${isAddDisabled
              ? 'bg-white/5 text-muted cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark text-white shadow-lg'
            }`}
        >
          {isAddDisabled ? '⏳ Заповніть всі поля' : '✅ Додати раунд'}
        </button>
      </div>
    </div>
  );
};

export default RoundForm;
