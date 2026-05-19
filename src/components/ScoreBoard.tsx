import React from 'react';
import { Player } from '../types';
import { useCountUp } from '../hooks/useCountUp';

interface ScoreBoardProps {
  players: Player[];
  totals: Record<string, number>;
  targetScore: number;
  dealerId?: number;
  snapshotActive?: boolean;
  deltas?: Record<string, number> | null;
  deltaKey?: number;
}

interface PlayerCardProps {
  player: Player;
  score: number;
  targetScore: number;
  isLeader: boolean;
  isDealer: boolean;
  snapshotActive: boolean;
  delta?: number;
  deltaKey?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, score, targetScore, isLeader, isDealer, snapshotActive, delta, deltaKey }) => {
  const displayScore = useCountUp(score, snapshotActive ? 0 : 300);
  const progress = Math.min(Math.max(score / targetScore, 0), 1) * 100;
  const initial = Array.from(player.name.trim())[0]?.toUpperCase() || '?';
  const isCloseToFinish = !snapshotActive && score > 0 && targetScore - score <= 100;

  const leaderStyle = isLeader ? {
    background: 'linear-gradient(#192134, #192134) padding-box, linear-gradient(135deg, #78350F, #FCD34D 45%, #D97706 55%, #78350F) border-box',
    border: '1.5px solid transparent',
    boxShadow: '0 4px 24px rgba(120, 53, 15, 0.28), inset 0 0 0 0 transparent',
    animation: 'goldPulse 5s ease-in-out infinite',
  } : isCloseToFinish ? {
    animation: 'goldGlow 1.4s ease-in-out infinite',
  } : undefined;

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300
        ${isLeader
          ? 'bg-card-bg'
          : 'bg-card-bg/60 border border-white/8'
        }`}
      style={leaderStyle}
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
          {isCloseToFinish && !isLeader && (
            <span className="text-xs leading-none">🔥</span>
          )}
          {isDealer && (
            <span className="text-xs bg-primary/20 border border-primary/50 text-score-pos px-1.5 py-0.5 rounded-full leading-none">
              Д
            </span>
          )}
          {isLeader && <span className="text-gold-to text-xs">👑</span>}
        </div>
      </div>

      {/* Score — relative wrapper lets delta float from this position */}
      <div className="relative">
        <div
          className={`text-3xl text-center transition-all duration-300
            ${score < 0 ? 'text-score-neg' : 'text-score-pos'}`}
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            animation: snapshotActive ? 'none' : 'countUp 300ms ease-out',
          }}
        >
          {displayScore}
        </div>
        {delta !== undefined && delta !== 0 && (
          <div key={deltaKey} className={`score-delta ${delta > 0 ? 'pos' : 'neg'}`}>
            {delta > 0 ? '+' : ''}{delta}
          </div>
        )}
      </div>

      {/* Progress bar — inset / embossed into the felt */}
      <div
        className="h-1.5 bg-black/40 rounded-full overflow-hidden"
        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-600"
          style={{
            width: `${progress}%`,
            background: isLeader
              ? 'linear-gradient(90deg, #92400E, #FCD34D)'
              : isCloseToFinish
                ? 'linear-gradient(90deg, #EA580C, #FBBF24)'
                : 'var(--color-primary)',
            animation: snapshotActive ? 'none' : 'progressFill 600ms ease',
          }}
        />
      </div>
    </div>
  );
};

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  totals,
  targetScore,
  dealerId,
  snapshotActive = false,
  deltas,
  deltaKey,
}) => {
  const sorted = [...players].sort((a, b) => (totals[String(b.id)] ?? 0) - (totals[String(a.id)] ?? 0));
  const maxScore = players.length > 0 ? Math.max(...players.map((p) => totals[String(p.id)] ?? 0)) : 0;
  // Only highlight a leader once at least one score is non-zero (game has started).
  const hasLeader = players.length > 1 && players.some((p) => (totals[String(p.id)] ?? 0) !== 0);

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
            delta={snapshotActive ? undefined : (deltas?.[String(player.id)] ?? undefined)}
            deltaKey={deltaKey}
          />
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;
