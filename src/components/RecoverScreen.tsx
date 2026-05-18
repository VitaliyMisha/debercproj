import React from 'react';
import { SavedGameState, GameRulesConfig } from '../types';
import { calculateGameTotals } from '../utils/gameHelpers';
import { Button } from './Button';

interface RecoverScreenProps {
  savedState: SavedGameState;
  gameRules: GameRulesConfig;
  onRecover: () => void;
  onDiscard: () => void;
}

export const RecoverScreen: React.FC<RecoverScreenProps> = ({
  savedState,
  gameRules,
  onRecover,
  onDiscard,
}) => {
  const { game, targetScore, winnerPlayer } = savedState;
  const totals = calculateGameTotals(game, gameRules);
  const roundCount = game.rounds.length;
  const isFinished = winnerPlayer !== null;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-4xl gold-gradient-text">Деберц ♠</h1>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-card-bg border border-white/10 p-5 flex flex-col gap-4">
        {/* Title row */}
        <div>
          <h2 className="font-display text-xl gold-gradient-text">
            {isFinished ? `Завершена гра #${game.id}` : `Незавершена гра #${game.id}`}
          </h2>
          <p className="text-muted text-sm mt-0.5">
            Раунд {roundCount} · до <span className="text-white font-semibold">{targetScore}</span> очок
          </p>
        </div>

        {/* Mini scoreboard */}
        <div className="flex flex-col gap-3">
          {game.players.map((player) => {
            const score = totals[player.id] ?? 0;
            const progress = Math.min(Math.max(score / targetScore, 0), 1);
            const isWinner = player.id === winnerPlayer;

            return (
              <div key={player.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-display text-white/70">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium font-sans">
                      {player.name}
                      {isWinner && <span className="ml-1.5 text-xs text-[#FBBF24]">👑</span>}
                    </span>
                  </div>
                  <span className="font-score text-white font-semibold tabular-nums">{score}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width: `${progress * 100}%`,
                      background: isWinner
                        ? 'linear-gradient(90deg, #D97706, #FBBF24)'
                        : score >= targetScore * 0.85
                        ? 'linear-gradient(90deg, #EA580C, #FBBF24)'
                        : 'linear-gradient(90deg, #1D4ED8, #3B82F6)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <Button fullWidth onClick={onRecover} className="py-4 text-lg">
          {isFinished ? '🏆 Переглянути результат' : '▶ Продовжити гру'}
        </Button>
        <button
          type="button"
          onClick={onDiscard}
          className="w-full py-3 rounded-xl bg-card-bg border border-white/10 text-muted text-sm font-semibold
            hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
        >
          Нова гра
        </button>
      </div>
    </div>
  );
};

export default RecoverScreen;
