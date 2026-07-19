import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { Player, Round } from '../types';
import { winStreak } from '../utils/gameHelpers';
import { Avatar } from './Avatar';
import { Odometer } from './Odometer';

interface ScoreBoardProps {
  players: Player[];
  totals: Record<string, number>;
  targetScore: number;
  dealerId?: number;
  snapshotActive?: boolean;
  deltas?: Record<string, number> | null;
  deltaKey?: number;
  /** Rounds power the 🔥 hot-streak badge; omit to hide it. */
  rounds?: Round[];
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
  /** Card spans both grid columns (hero card for the top player in a 3-player game). */
  spanFull?: boolean;
  /** Consecutive round wins; badge shows from 3. */
  streak?: number;
  dealerBadgeRef?: React.Ref<HTMLSpanElement>;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  score,
  targetScore,
  isLeader,
  isDealer,
  snapshotActive,
  delta,
  deltaKey,
  spanFull = false,
  streak = 0,
  dealerBadgeRef,
}) => {
  const { t } = useTranslation();
  const progress = Math.min(Math.max(score / targetScore, 0), 1) * 100;
  const isCloseToFinish = !snapshotActive && score > 0 && targetScore - score <= 100;
  const remaining = targetScore - score;

  const leaderStyle = isLeader
    ? {
        background:
          'linear-gradient(#192134, #192134) padding-box, linear-gradient(135deg, #78350F, #FCD34D 45%, #D97706 55%, #78350F) border-box',
        border: '1.5px solid transparent',
        boxShadow: '0 4px 24px rgba(120, 53, 15, 0.28), inset 0 0 0 0 transparent',
        animation: 'goldPulse 5s ease-in-out infinite',
      }
    : isCloseToFinish
      ? {
          border: '1.5px solid rgba(251, 191, 36, 0.35)',
        }
      : undefined;

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300
        ${spanFull ? 'col-span-2' : ''}
        ${isLeader ? 'bg-card-bg' : 'bg-card-bg/60 border border-white/8'}`}
      style={leaderStyle}
    >
      {/* Warm overlay pulse when close to finish */}
      {isCloseToFinish && !isLeader && <div className="absolute inset-0 rounded-2xl pointer-events-none close-finish-overlay" />}

      {/* Avatar + name */}
      <div className="flex items-center gap-2">
        <Avatar name={player.name} background={isCloseToFinish && !isLeader ? 'linear-gradient(135deg, #c2410c, #ea580c)' : undefined} />
        <span className="text-white/80 font-sans text-sm font-medium truncate">{player.name}</span>
        <div className="ml-auto flex items-center gap-1">
          {streak >= 3 && (
            <span
              className="text-[10px] font-bold text-orange-300 bg-orange-500/15 border border-orange-400/30 rounded-full px-1.5 py-0.5 leading-none"
              title={t('score.streak', { n: streak })}
            >
              🔥{streak}
            </span>
          )}
          {isCloseToFinish && !isLeader && <span className="text-base leading-none">🔥</span>}
          {isDealer && (
            <span
              ref={dealerBadgeRef}
              className="text-xs bg-primary/20 border border-primary/50 text-score-pos px-1.5 py-0.5 rounded-full leading-none"
            >
              Д
            </span>
          )}
          {isLeader && <span className="text-gold-to text-xs">👑</span>}
        </div>
      </div>

      {/* Score — relative wrapper lets delta float from this position */}
      <div className="relative">
        <div
          className={`text-3xl flex justify-center transition-all duration-300
            ${score < 0 ? 'text-score-neg' : isCloseToFinish && !isLeader ? 'score-close-finish' : 'text-score-pos'}`}
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            animation: snapshotActive ? 'none' : undefined,
          }}
        >
          <Odometer value={score} instant={snapshotActive} />
        </div>
        {delta !== undefined && delta !== 0 && (
          // key restarts the CSS float animation each round without remounting the whole card
          <div key={deltaKey} className={`score-delta ${delta > 0 ? 'pos' : 'neg'}`}>
            {delta > 0 ? '+' : ''}
            {delta}
          </div>
        )}
      </div>

      {/* "X pts to win" label — only when close to finish */}
      {isCloseToFinish && !isLeader && (
        <p
          className="text-center text-xs font-semibold tracking-wide"
          style={{ color: '#fbbf24', animation: 'closeFinishScore 1.6s ease-in-out infinite' }}
        >
          {t('score.toWin', { n: remaining })}
        </p>
      )}

      {/* Progress bar — inset / embossed into the felt, with quarter ticks */}
      <div className="relative h-1.5 bg-black/40 rounded-full overflow-hidden" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.7)' }}>
        <div
          className="h-full rounded-full transition-all duration-600"
          style={{
            width: `${progress}%`,
            background: isLeader
              ? 'linear-gradient(90deg, #92400E, #FCD34D)'
              : isCloseToFinish
                ? 'linear-gradient(90deg, #15803d, #4ade80 65%, #fbbf24 85%, #ea580c)'
                : 'var(--color-primary)',
            animation: snapshotActive ? 'none' : 'progressFill 600ms ease',
          }}
        />
        {[25, 50, 75].map((tick) => (
          <span key={tick} className="absolute top-0 h-full w-px bg-white/20" style={{ left: `${tick}%` }} aria-hidden="true" />
        ))}
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
  rounds,
}) => {
  const { t } = useTranslation();
  const sorted = [...players].sort((a, b) => (totals[String(b.id)] ?? 0) - (totals[String(a.id)] ?? 0));
  const maxScore = players.length > 0 ? Math.max(...players.map((p) => totals[String(p.id)] ?? 0)) : 0;
  // Only highlight a leader once at least one score is non-zero (game has started).
  const hasLeader = players.length > 1 && players.some((p) => (totals[String(p.id)] ?? 0) !== 0);

  // FLIP flight of the Д chip: remember where the current dealer badge sits;
  // when the dealer changes, animate a fixed-position clone from the old spot
  // to the new one (Web Animations API, skipped under reduced motion / jsdom).
  const dealerBadgeRef = useRef<HTMLSpanElement | null>(null);
  const prevDealerRectRef = useRef<{ dealerId: number; rect: DOMRect } | null>(null);

  useLayoutEffect(() => {
    const badge = dealerBadgeRef.current;
    const prev = prevDealerRectRef.current;
    const reducedMotion = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (badge && prev && dealerId !== undefined && prev.dealerId !== dealerId && !reducedMotion && typeof badge.animate === 'function') {
      const to = badge.getBoundingClientRect();
      const from = prev.rect;
      const clone = badge.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        position: 'fixed',
        left: `${from.left}px`,
        top: `${from.top}px`,
        margin: '0',
        zIndex: '50',
        pointerEvents: 'none',
      });
      document.body.appendChild(clone);
      badge.style.opacity = '0';
      const flight = clone.animate(
        [
          { transform: 'translate(0, 0) scale(1)' },
          { transform: `translate(${(to.left - from.left) / 2}px, ${(to.top - from.top) / 2 - 12}px) scale(1.25)` },
          { transform: `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(1)` },
        ],
        { duration: 550, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
      flight.onfinish = () => {
        clone.remove();
        badge.style.opacity = '1';
      };
    }
    if (badge && dealerId !== undefined) {
      prevDealerRectRef.current = { dealerId, rect: badge.getBoundingClientRect() };
    }
  }, [dealerId]);

  // Always two columns: 3-player games get a full-width "hero" card for the top
  // player (grid-cols-3 made cards too narrow on mobile — truncated names/badges).
  return (
    <div>
      <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">{t('score.title')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {sorted.map((player, idx) => (
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
            spanFull={players.length === 3 && idx === 0}
            streak={rounds ? winStreak(rounds, player.id) : 0}
            dealerBadgeRef={player.id === dealerId ? dealerBadgeRef : undefined}
          />
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;
