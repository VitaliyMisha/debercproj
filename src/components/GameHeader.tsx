import React from 'react';

interface GameHeaderProps {
  gameId: number;
  targetScore: number;
  dealerName?: string;
  onNewGame?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameId, targetScore, dealerName, onNewGame }) => (
  <div className="relative rounded-2xl overflow-hidden bg-card-bg border border-white/8 p-4">
    {/* Watermark suits */}
    <div className="absolute inset-0 flex items-center justify-center text-7xl text-white/4 font-display pointer-events-none select-none tracking-widest">
      ♠ ♥ ♦ ♣
    </div>

    <div className="relative z-10 flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl gold-gradient-text">Деберц</h1>
        <p className="text-muted text-sm">
          Гра #{gameId} · до <span className="text-white font-semibold">{targetScore}</span> очок
        </p>
      </div>

      <div className="flex items-center gap-3">
        {dealerName && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <span className="text-sm">👑</span>
            <span className="text-sm text-white/80 font-sans">{dealerName}</span>
          </div>
        )}
        {onNewGame && (
          <button
            type="button"
            onClick={onNewGame}
            className="px-4 py-2 rounded-xl bg-card-bg border border-white/10 text-muted text-sm font-semibold
              hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
          >
            Нова гра
          </button>
        )}
      </div>
    </div>
  </div>
);

export default GameHeader;
