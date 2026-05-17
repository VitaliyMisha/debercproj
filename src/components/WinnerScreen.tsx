import React, { useEffect } from 'react';
import { Player } from '../types';
import { CardSuitsRain } from './CardSuitsRain';
import { Button } from './Button';
import { GoldDivider } from './GoldDivider';
import { useSound } from '../hooks/useSound';

interface WinnerScreenProps {
  winner: Player;
  players: Player[];
  totals: Record<string, number>;
  roundCount: number;
  onNewGame: () => void;
  onContinue: () => void;
  soundEnabled?: boolean;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  winner,
  players,
  totals,
  roundCount,
  onNewGame,
  onContinue,
  soundEnabled = true,
}) => {
  const { fanfare } = useSound();

  useEffect(() => {
    if (soundEnabled) fanfare();
  }, [fanfare, soundEnabled]);
  const maxScore = Math.max(...players.map((p) => totals[String(p.id)] ?? 0));

  return (
    <div className="relative flex flex-col items-center gap-6 py-8 px-4">
      <CardSuitsRain />

      {/* Trophy */}
      <div className="text-7xl animate-bounce">🏆</div>

      {/* Title */}
      <h1 className="font-display text-3xl gold-gradient-text tracking-wide">ПЕРЕМОЖЕЦЬ</h1>

      {/* Winner card */}
      <div
        className="w-full max-w-xs bg-card-bg rounded-2xl border-2 border-gold-from p-6 text-center"
        style={{ animation: 'goldPulse 3s ease-in-out infinite' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-display"
          style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
        >
          {Array.from(winner.name.trim())[0]?.toUpperCase() || '?'}
        </div>
        <p className="font-display text-2xl text-white mb-1">{winner.name}</p>
        <p className="text-muted text-sm">
          {totals[String(winner.id)] ?? 0} очок · {roundCount} раундів
        </p>
      </div>

      <GoldDivider className="w-full max-w-xs" />

      {/* Summary table */}
      <div className="w-full max-w-xs bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-4 py-2 border-b border-white/8">
          <span className="text-muted text-xs uppercase tracking-widest font-semibold">Підсумок</span>
        </div>
        {[...players]
          .sort((a, b) => (totals[String(b.id)] ?? 0) - (totals[String(a.id)] ?? 0))
          .map((player) => {
            const score = totals[String(player.id)] ?? 0;
            const isWinner = player.id === winner.id;
            const progress = Math.min(Math.max(score / maxScore, 0), 1) * 100;

            return (
              <div key={player.id} className="px-4 py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${isWinner ? 'text-gold-to' : 'text-white/80'}`}>
                    {isWinner && '👑 '}{player.name}
                  </span>
                  <span className={`text-sm font-bold ${score < 0 ? 'text-score-neg' : 'text-score-pos'}`}>
                    {score}
                  </span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: isWinner
                        ? 'linear-gradient(90deg, var(--color-gold-from), var(--color-gold-to))'
                        : 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button fullWidth onClick={onNewGame} className="py-4 text-base">
          🎮 Нова гра
        </Button>
        <Button fullWidth variant="secondary" onClick={onContinue} className="py-3 text-base">
          ▶ Продовжити
        </Button>
      </div>
    </div>
  );
};

export default WinnerScreen;
