import React, { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
  onChipClick?: (token: string) => void;
}

const TOKEN_HINTS = ['Б', 'ХВ', 'ВІС'] as const;

const TOKEN_COLORS: Record<string, string> = {
  Б: 'text-token-b border-token-b/60 bg-token-b/10',
  ХВ: 'text-score-neg border-score-neg/60 bg-score-neg/10',
  ВІС: 'text-token-vis border-token-vis/60 bg-token-vis/10',
};

/* Колір чіпа-кнопки */
const CHIP_STYLES: Record<string, { bg: string; accent: string; textColor: string }> = {
  Б:   { bg: '#78350F', accent: '#D97706', textColor: '#FCD34D' },
  ХВ:  { bg: '#7F1D1D', accent: '#DC2626', textColor: '#FCA5A5' },
  ВІС: { bg: '#3B0764', accent: '#7C3AED', textColor: '#C4B5FD' },
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
  onChipClick,
}) => {
  const { t } = useTranslation();
  const allowVis = gameRules?.allowVis !== false;
  const placeholder = allowVis ? t('round.placeholder') : t('round.placeholderNoVis');
  const validTokens = allowVis ? TOKEN_HINTS : (['Б', 'ХВ'] as const);

  const isBToken = (v: string | number) => String(v).toUpperCase() === 'Б';
  const isVisToken = (v: string | number) => String(v).toUpperCase() === 'ВІС';

  const tokenAlreadyTakenFor = (playerId: number, token: string): boolean => {
    if (token === 'Б') {
      return Object.entries(scores).some(([id, v]) => id !== String(playerId) && isBToken(v));
    }
    if (token === 'ВІС') {
      return allowVis && Object.entries(scores).some(([id, v]) => id !== String(playerId) && isVisToken(v));
    }
    return false;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, playerId: number) => {
    const val = e.target.value.trim().toUpperCase();
    if ((validTokens as readonly string[]).includes(val)) {
      if (tokenAlreadyTakenFor(playerId, val)) return;
      onScoreChange({ target: { value: val } } as ChangeEvent<HTMLInputElement>, playerId);
    }
  };

  const fillToken = (playerId: number, token: string) => {
    if (tokenAlreadyTakenFor(playerId, token)) return;
    onChipClick?.(token);
    onScoreChange({ target: { value: token } } as ChangeEvent<HTMLInputElement>, playerId);
  };

  return (
    <div className="bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-display text-sm">
          {roundNumber}
        </div>
        <span className="text-white font-sans font-semibold">{t('round.roundLabel')}</span>
      </div>

      {/* Player inputs */}
      <div className="p-4 space-y-4">
        {players.map((p) => {
          const val = String(scores[String(p.id)] ?? '');
          const activeToken = validTokens.find((t) => isTokenActive(val, t));

          return (
            <div key={p.id} className="space-y-2">
              {/* Player row: avatar + name + input */}
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-display shrink-0"
                  style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
                >
                  {Array.from(p.name.trim())[0]?.toUpperCase() || '?'}
                </div>
                <span className="flex-1 text-white/80 font-sans text-sm truncate">{p.name}</span>

                <div className="relative shrink-0 w-28">
                  <input
                    id={`score-r${roundNumber}-p${p.id}`}
                    name={`score-r${roundNumber}-p${p.id}`}
                    type="text"
                    autoComplete="off"
                    value={val}
                    onChange={(e) => onScoreChange(e, p.id)}
                    onBlur={(e) => handleBlur(e, p.id)}
                    placeholder={placeholder}
                    aria-label={t('round.scoreFor', { name: p.name })}
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

              {/* Token quick-fill chips for this player */}
              <div className="flex gap-1.5 pl-11">
                {validTokens.map((token) => {
                  const chip = CHIP_STYLES[token];
                  const isActive = isTokenActive(val, token);
                  const isDisabled = tokenAlreadyTakenFor(p.id, token);
                  return (
                    <button
                      key={token}
                      type="button"
                      onClick={() => fillToken(p.id, token)}
                      disabled={isDisabled}
                      aria-label={t('round.setToken', { token, name: p.name })}
                      className="h-7 px-2.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.93] disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{
                        background: isActive
                          ? `radial-gradient(circle at 35% 35%, ${chip.accent}dd, ${chip.bg})`
                          : `${chip.bg}88`,
                        color: chip.textColor,
                        border: `1px solid ${isActive ? chip.accent : chip.accent + '55'}`,
                        boxShadow: isActive
                          ? `inset 0 1px 2px rgba(255,255,255,0.15), inset 0 -1px 3px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.6)`
                          : 'none',
                        outline: isActive ? `2px dashed ${chip.accent}50` : 'none',
                        outlineOffset: '2px',
                      }}
                    >
                      {token}
                    </button>
                  );
                })}
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
          {isAddDisabled ? t('round.fillAll') : t('round.addRound')}
        </button>
      </div>
    </div>
  );
};

export default RoundForm;
