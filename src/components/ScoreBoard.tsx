import React from 'react';
import { Player } from '../types';
import { useCountUp } from '../hooks/useCountUp';

interface ScoreBoardProps {
  players: Player[];
  totals: Record<string, number>;
  targetScore: number;
  dealerId?: number;
  snapshotActive?: boolean;
}

interface PlayerCardProps {
  player: Player;
  score: number;
  targetScore: number;
  isLeader: boolean;
  isDealer: boolean;
  snapshotActive: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, score, targetScore, isLeader, isDealer, snapshotActive }) => {
  const displayScore = useCountUp(score, snapshotActive ? 0 : 300);
  const progress = Math.min(Math.max(score / targetScore, 0), 1) * 100;
  const initial = Array.from(player.name.trim())[0]?.toUpperCase() || '?';

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-300
        ${isLeader
          ? 'bg-card-bg border-gold-from'
          : 'bg-card-bg/60 border-white/8'
        }`}
      style={isLeader ? { animation: 'goldPulse 3s ease-in-out infinite' } : undefined}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-display shrink-0"
          style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
        >
          {initial}
        </div>
        <span className="text-white/80 font-sans text-sm font-medium truncate">{player.name}</span>
        <div className="ml-auto flex items-center gap-1">
          {isDealer && (
            <span className="text-xs bg-primary/20 border border-primary/50 text-score-pos px-1.5 py-0.5 rounded-full leading-none">
              Д
            </span>
          )}
          {isLeader && <span className="text-gold-to text-xs">👑</span>}
        </div>
      </div>

      {/* Score */}
      <div
        className={`font-display text-3xl text-center transition-all duration-300
          ${score < 0 ? 'text-score-neg' : 'text-score-pos'}`}
        style={{ animation: snapshotActive ? 'none' : 'countUp 300ms ease-out' }}
      >
        {displayScore}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-600"
          style={{
            width: `${progress}%`,
            background: isLeader
              ? 'linear-gradient(90deg, var(--color-gold-from), var(--color-gold-to))'
              : 'var(--color-primary)',
            animation: snapshotActive ? 'none' : 'progressFill 600ms ease',
          }}
        />
      </div>
    </div>
  );
};

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, totals, targetScore, dealerId, snapshotActive = false }) => {
  const sorted = [...players].sort((a, b) => (totals[String(b.id)] ?? 0) - (totals[String(a.id)] ?? 0));
  const maxScore = Math.max(...players.map((p) => totals[String(p.id)] ?? 0));
  const hasLeader = players.some((p) => (totals[String(p.id)] ?? 0) === maxScore) && players.length > 1;

  const gridClass =
    players.length === 2
      ? 'grid-cols-2'
      : players.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2';

  return (
    <div>
      <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">Рахунок</h2>
      <div className={`grid ${gridClass} gap-3`}>
        {sorted.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            score={totals[String(player.id)] ?? 0}
            targetScore={targetScore}
            isLeader={hasLeader && (totals[String(player.id)] ?? 0) === maxScore}
            isDealer={player.id === dealerId}
            snapshotActive={snapshotActive}
          />
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;
