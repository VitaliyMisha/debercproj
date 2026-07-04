import React from 'react';
import { useTranslation } from 'react-i18next';
import { SavedGameState, GameRulesConfig } from '../types';
import { calculateGameTotals } from '../utils/gameHelpers';
import { Button } from './Button';
import { Avatar } from './Avatar';

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
  const { t } = useTranslation();
  // Prefer the rules the saved game was played with; fall back for older saves.
  const totals = calculateGameTotals(game, savedState.gameRules ?? gameRules);
  const roundCount = game.rounds.length;
  const isFinished = winnerPlayer !== null;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-4xl gold-gradient-text">{t('app.title')} <span aria-hidden="true">♠</span></h1>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-card-bg border border-white/10 p-5 flex flex-col gap-4">
        {/* Title row */}
        <div>
          <h2 className="font-display text-xl gold-gradient-text">
            {isFinished ? t('recover.finishedGame', { id: game.id }) : t('recover.unfinishedGame', { id: game.id })}
          </h2>
          <p className="text-muted text-sm mt-0.5">
            {t('recover.roundInfo', { n: roundCount, score: targetScore })}
          </p>
        </div>

        {/* Mini scoreboard */}
        <div className="flex flex-col gap-3">
          {game.players.map((player) => {
            const score = totals[player.id] ?? 0;
            const safeTarget = targetScore > 0 ? targetScore : 1;
            const progress = Math.min(Math.max(score / safeTarget, 0), 1);
            const isWinner = player.id === winnerPlayer;

            return (
              <div key={player.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={player.name}
                      className="w-8 h-8 text-sm text-white/70 bg-white/10 border border-white/20"
                      background={null}
                    />
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
                    className="h-full rounded-full"
                    style={{
                      width: `${progress * 100}%`,
                      background: isWinner
                        ? 'linear-gradient(90deg, #D97706, #FBBF24)'
                        : score >= safeTarget * 0.85
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
          {isFinished ? t('recover.viewResult') : t('recover.continue')}
        </Button>
        <button
          type="button"
          onClick={onDiscard}
          className="w-full py-3 rounded-xl bg-card-bg border border-white/10 text-muted text-sm font-semibold
            hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
        >
          {t('recover.newGame')}
        </button>
      </div>
    </div>
  );
};

export default RecoverScreen;
