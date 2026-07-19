import { BarChart3 } from 'lucide-react';
import type React from 'react';
import { useTranslation } from 'react-i18next';
import type { Game, GameRulesConfig, Player } from '../types';
import { calculateGameTotals, getVisDisplayValue } from '../utils/gameHelpers';
import { Avatar } from './Avatar';

interface PlayerStatisticsProps {
  game: Game;
  players: Player[];
  gameRules: GameRulesConfig;
}

interface PlayerStats {
  totalScore: number;
  roundsPlayed: number;
  bCount: number;
  hvCount: number;
  visCount: number;
  averageScore: number;
  bestRound: number;
  worstRound: number;
  positiveRounds: number;
  negativeRounds: number;
}

interface StatCellProps {
  label: string;
  value: string;
  valueClass?: string;
}

const StatCell: React.FC<StatCellProps> = ({ label, value, valueClass = 'text-white/80' }) => (
  <div className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
    <span className="text-muted text-xs">{label}</span>
    <span className={`font-score text-sm font-semibold tabular-nums ${valueClass}`}>{value}</span>
  </div>
);

const PlayerStatistics: React.FC<PlayerStatisticsProps> = ({ game, players, gameRules }) => {
  const { t } = useTranslation();
  const hvPenalty = gameRules.hvPenalty;
  const secondBPenalty = gameRules.secondBPenalty;
  const totals = calculateGameTotals(game, gameRules);

  const calculatePlayerStats = (playerId: number): PlayerStats => {
    let bCount = 0;
    let hvCount = 0;
    let visCount = 0;
    let bestRound = -Infinity;
    let worstRound = Infinity;
    let positiveRounds = 0;
    let negativeRounds = 0;
    const roundScores: number[] = [];

    game.rounds.forEach((round) => {
      const score = round.scores[playerId];
      let effectiveScore = 0;
      let countInRounds = true;

      if (score === 'Б') {
        bCount++;
        effectiveScore = bCount >= 2 ? secondBPenalty : 0;
        if (bCount >= 2) negativeRounds++;
      } else if (typeof score === 'string' && score.toUpperCase() === 'ВІС') {
        visCount++;
        countInRounds = false;
        const idx = game.rounds.findIndex((r) => r.id === round.id);
        const resolved = getVisDisplayValue(idx, playerId, game.rounds, gameRules);
        if (resolved === 'Б' || (typeof resolved === 'number' && resolved < 0)) {
          bCount++;
        }
      } else if (typeof score === 'number') {
        effectiveScore = score;
        if (score === hvPenalty) hvCount++;
        if (score > 0) positiveRounds++;
        else if (score < 0) negativeRounds++;
      } else {
        const upper = String(score).toUpperCase();
        if (upper === 'ХВ') {
          hvCount++;
          effectiveScore = hvPenalty;
          negativeRounds++;
        } else {
          const n = parseInt(score, 10);
          if (!Number.isNaN(n)) {
            effectiveScore = n;
            if (n === hvPenalty) hvCount++;
            if (n > 0) positiveRounds++;
            else if (n < 0) negativeRounds++;
          }
        }
      }

      if (countInRounds) {
        roundScores.push(effectiveScore);
        if (effectiveScore > bestRound) bestRound = effectiveScore;
        if (effectiveScore < worstRound) worstRound = effectiveScore;
      }
    });

    const avg = roundScores.length > 0 ? roundScores.reduce((s, v) => s + v, 0) / roundScores.length : 0;

    return {
      totalScore: totals[playerId] ?? 0,
      roundsPlayed: game.rounds.length,
      bCount,
      hvCount,
      visCount,
      averageScore: avg,
      bestRound: bestRound === -Infinity ? 0 : bestRound,
      worstRound: worstRound === Infinity ? 0 : worstRound,
      positiveRounds,
      negativeRounds,
    };
  };

  const allStats = players.map((player) => ({ player, stats: calculatePlayerStats(player.id) }));

  return (
    <div className="bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-gold-from shrink-0" />
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest flex-1">{t('stats.title')}</h2>
        <span className="text-muted text-xs bg-white/5 px-2 py-0.5 rounded-full">{t('stats.rounds', { n: game.rounds.length })}</span>
      </div>

      <div className="divide-y divide-white/5">
        {allStats.map(({ player, stats }) => {
          return (
            <div key={player.id} className="px-4 py-4">
              {/* Player header */}
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={player.name} className="w-9 h-9 text-base text-white" />
                <span className="text-white font-semibold text-sm flex-1 truncate">{player.name}</span>
                <span
                  className={`font-score text-xl font-bold tabular-nums ${stats.totalScore >= 0 ? 'text-score-pos' : 'text-score-neg'}`}
                >
                  {stats.totalScore}
                </span>
              </div>

              {/* Main stats */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <StatCell label={t('stats.avg')} value={stats.averageScore.toFixed(1)} valueClass="text-score-chalk" />
                <StatCell
                  label={t('stats.roundsStat')}
                  value={`+${stats.positiveRounds} / −${stats.negativeRounds}`}
                  valueClass="text-white/60"
                />
                <StatCell label={t('stats.best')} value={String(stats.bestRound)} valueClass="text-score-pos" />
                <StatCell
                  label={t('stats.worst')}
                  value={String(stats.worstRound)}
                  valueClass={stats.worstRound < 0 ? 'text-score-neg' : 'text-score-chalk'}
                />
              </div>

              {/* Tokens row — only shown if player has any */}
              {(stats.bCount > 0 || stats.hvCount > 0 || (gameRules.allowVis !== false && stats.visCount > 0)) && (
                <div className="flex gap-2">
                  {stats.bCount > 0 && (
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between gap-1">
                      <span className="text-muted text-xs">Б</span>
                      <span className="font-score text-sm font-bold text-token-b">{stats.bCount}</span>
                    </div>
                  )}
                  {stats.hvCount > 0 && (
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between gap-1">
                      <span className="text-muted text-xs">ХВ</span>
                      <span className="font-score text-sm font-bold text-score-neg">{stats.hvCount}</span>
                    </div>
                  )}
                  {gameRules.allowVis !== false && stats.visCount > 0 && (
                    <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between gap-1">
                      <span className="text-muted text-xs">ВіС</span>
                      <span className="font-score text-sm font-bold text-token-vis">{stats.visCount}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlayerStatistics;
