import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { Player } from '../types';
import { Avatar } from './Avatar';

interface GameHistoryProps {
  players: Player[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ players }) => {
  const { t, i18n } = useTranslation();

  // Intl.PluralRules handles Ukrainian correctly (21 → one, 22 → few, 11 → many);
  // for English it yields one/other, and 'other' maps onto the 'many' key.
  const pluralCategory = (n: number): 'one' | 'few' | 'many' => {
    const cat = new Intl.PluralRules(i18n.language).select(n);
    return cat === 'one' || cat === 'few' ? cat : 'many';
  };

  const victoryLabel = (n: number): string => t(`gameHistory.wins.${pluralCategory(n)}`);

  if (players.length === 0) return null;

  const maxWins = Math.max(...players.map((p) => p.winCount));
  const totalGames = players.reduce((s, p) => s + p.winCount, 0);
  const hasWins = maxWins > 0;

  const champions = players.filter((p) => p.winCount === maxWins && hasWins);
  const isSharedLead = champions.length > 1;

  const sorted = [...players].sort((a, b) => b.winCount - a.winCount);

  const gamesLabel = t(`gameHistory.games.${pluralCategory(totalGames)}`);

  return (
    <div className="bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <Trophy className="w-4 h-4 text-gold-from shrink-0" />
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest flex-1">{t('gameHistory.title')}</h2>
        {hasWins && (
          <span className="text-muted text-xs bg-white/5 px-2 py-0.5 rounded-full">
            {totalGames} {gamesLabel}
          </span>
        )}
      </div>

      <div className="divide-y divide-white/5">
        {sorted.map((player, idx) => {
          const isLeader = hasWins && player.winCount === maxWins;
          const isChampion = isLeader && !isSharedLead;
          const isTied = isLeader && isSharedLead;
          const progress = hasWins ? (player.winCount / maxWins) * 100 : 0;

          return (
            <div key={player.id} className="flex items-center gap-3 px-4 py-3">
              {/* Rank */}
              <span className={`w-5 text-xs font-semibold text-center tabular-nums shrink-0 ${
                isChampion ? 'text-gold-to' : isTied ? 'text-gold-from' : 'text-muted'
              }`}>
                {isChampion || isTied ? '—' : `#${idx + 1}`}
              </span>

              {/* Avatar */}
              <Avatar
                name={player.name}
                fallback={String(idx + 1)}
                className={`w-9 h-9 text-base text-white ${isChampion ? 'ring-2 ring-gold-from' : ''}`}
                background={
                  isChampion
                    ? 'linear-gradient(135deg, #78350F, #D97706)'
                    : isTied
                      ? 'linear-gradient(135deg, #92400E, #F59E0B)'
                      : undefined
                }
              >
                {isChampion ? '👑' : undefined}
              </Avatar>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-sm font-semibold truncate ${
                    isChampion ? 'text-gold-to' : isTied ? 'text-gold-from' : 'text-white/80'
                  }`}>
                    {player.name}
                  </span>
                  <span className={`font-score text-sm font-bold shrink-0 ${
                    isChampion ? 'text-gold-to' : isTied ? 'text-gold-from' : 'text-white/50'
                  }`}>
                    {player.winCount} {victoryLabel(player.winCount)}
                  </span>
                </div>

                {hasWins && (
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: isChampion || isTied
                          ? 'linear-gradient(90deg, var(--color-gold-from), var(--color-gold-to))'
                          : 'var(--color-primary)',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameHistory;
