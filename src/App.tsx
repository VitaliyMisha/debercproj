import React, { useEffect, useMemo, useState } from 'react';
import { Game, GameRulesConfig, Player, Round } from './types';

import SetupScreen from './components/SetupScreen';
import RoundForm from './components/RoundForm';
import RoundHistory from './components/RoundHistory';
import RoundTimeline from './components/RoundTimeline';
import WinnerScreen from './components/WinnerScreen';
import GameHeader from './components/GameHeader';
import GameHistory from './components/GameHistory';
import ScoreBoard from './components/ScoreBoard';
import PlayerStatistics from './components/PlayerStatistics';
import { generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts, calculateGameTotals } from './utils/gameHelpers';

const GAME_ID = 'gameId';
const GAME_RULES_KEY = 'gameRules';

const defaultGameRules: GameRulesConfig = {
  secondBPenalty: -100,
  hvPenalty: -100,
  allowVis: true,
  customTargetScore: false,
  targetScoreOptions: [510, 1020],
};

export default function App() {
  const [playerCount, setPlayerCount] = useState(2);
  const [targetScore, setTargetScore] = useState(1020);
  const [names, setNames] = useState<string[]>(Array(2).fill(''));
  const [dealerIndex, setDealerIndex] = useState(0);
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Record<string, number | string>>({});
  const [winnerPlayer, setWinnerPlayer] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [hasHistoryShown, setHasHistoryShown] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [snapshotRound, setSnapshotRound] = useState<number | null>(null);

  const [gameRules, setGameRules] = useState<GameRulesConfig>(() => {
    const stored = localStorage.getItem(GAME_RULES_KEY);
    return stored ? JSON.parse(stored) : defaultGameRules;
  });

  const [gameId, setGameId] = useState(() => {
    const stored = localStorage.getItem(GAME_ID);
    return stored ? parseInt(stored, 10) : 1;
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(GAME_ID, gameId.toString());
  }, [gameId]);

  useEffect(() => {
    localStorage.setItem(GAME_RULES_KEY, JSON.stringify(gameRules));
  }, [gameRules]);

  const createGame = (
    reusePlayers?: Player[],
    showHistory = false,
    preserveWinCounts = false,
    startingDealerId?: number,
  ) => {
    const winCounts = loadWinCounts();
    const players: Player[] = reusePlayers || names.map((name) => {
      const id = generateUniqueId();
      return { id, name, winCount: preserveWinCounts ? 0 : winCounts[id] || 0 };
    });
    const newGame: Game = {
      id: gameId,
      createdAt: new Date().toISOString(),
      players,
      rounds: [],
      dealerId: startingDealerId ?? players[dealerIndex].id,
    };
    setGame(newGame);
    setWinnerPlayer(null);
    setScores(Object.fromEntries(players.map((p) => [p.id.toString(), ''])));
    setGameId((prev) => prev + 1);
    setError('');
    setHasHistoryShown(showHistory);
    setShowStatistics(false);
  };

  const isAddDisabled = game
    ? game.players.some((p) => !isValidScore(scores[p.id], gameRules))
    : true;

  const updateWinner = (currentGame: Game) => {
    const totals = calculateGameTotals(currentGame, gameRules);
    const contenders = currentGame.players.filter((p) => totals[p.id] >= targetScore);
    if (contenders.length > 0) {
      const maxScore = Math.max(...contenders.map((p) => totals[p.id]));
      const winners = contenders.filter((p) => totals[p.id] === maxScore);
      if (winners.length === 1) {
        const winner = winners[0];
        setWinnerPlayer(winner.id);
        const updatedPlayers = currentGame.players.map((p) =>
          p.id === winner.id ? { ...p, winCount: p.winCount + 1 } : p,
        );
        setGame({ ...currentGame, players: updatedPlayers });
        const winCounts = loadWinCounts();
        winCounts[winner.id] = (winCounts[winner.id] || 0) + 1;
        saveWinCounts(winCounts);
      } else {
        setWinnerPlayer(null);
      }
    }
  };

  const addRound = () => {
    if (!game || winnerPlayer !== null) return;
    if (isAddDisabled) {
      setError('Заповніть всі поля валідними значеннями (число, Б, ХВ' + (gameRules.allowVis ? ' або ВІС' : '') + ').');
      return;
    }
    const roundNumber = game.rounds.length + 1;
    const updatedScores: Record<string, number | string> = {};
    game.players.forEach((p) => {
      updatedScores[p.id] = parseScore(scores[p.id], p.id.toString(), game.rounds, gameRules);
    });
    const newRound: Round = { id: roundNumber, number: roundNumber, scores: updatedScores };
    const nextDealerIndex = (game.players.findIndex((p) => p.id === game.dealerId) + 1) % game.players.length;
    const updatedGame: Game = {
      ...game,
      rounds: [...game.rounds, newRound],
      dealerId: game.players[nextDealerIndex].id,
    };
    setGame(updatedGame);
    setSnapshotRound(null);
    setScores(Object.fromEntries(updatedGame.players.map((p) => [p.id.toString(), ''])));
    setError('');
    updateWinner(updatedGame);
  };

  const updateRound = (roundNumber: number, newScores: Record<string, string>) => {
    if (!game) return;
    const convertedScores: Record<string, number | string> = {};
    Object.entries(newScores).forEach(([playerId, scoreStr]) => {
      convertedScores[playerId] = parseScore(scoreStr, playerId, game.rounds, gameRules);
    });
    const updatedRounds = game.rounds.map((r) =>
      r.number === roundNumber ? { ...r, scores: convertedScores } : r,
    );
    const updatedGame: Game = { ...game, rounds: updatedRounds };
    setGame(updatedGame);
    setError('');
    updateWinner(updatedGame);
  };

  const totals = useMemo(() => {
    if (!game) return {};
    return calculateGameTotals(game, gameRules);
  }, [game, gameRules]);

  const dealerByRound = useMemo(() => {
    if (!game) return [];
    const n = game.players.length;
    const currentDealerIdx = game.players.findIndex((p) => p.id === game.dealerId);
    return game.rounds.map((_, i) => {
      const roundNumber = i + 1;
      const stepsBack = game.rounds.length - roundNumber + 1;
      const idx = ((currentDealerIdx - stepsBack) % n + n) % n;
      return game.players[idx].id;
    });
  }, [game]);

  const displayTotals = useMemo((): Record<string, number> => {
    if (!game || snapshotRound === null) return totals;
    const snapshotGame = { ...game, rounds: game.rounds.slice(0, snapshotRound) };
    return calculateGameTotals(snapshotGame, gameRules) as Record<string, number>;
  }, [game, gameRules, snapshotRound, totals]);

  const resetGame = () => {
    setGame(null);
    setNames(Array(playerCount).fill(''));
    setDealerIndex((dealerIndex + 1) % playerCount);
    setWinnerPlayer(null);
    setError('');
    setHasHistoryShown(false);
    setShowStatistics(false);
    setGameId(1);
    localStorage.removeItem(GAME_ID);
  };

  const continueGame = () => {
    if (game) {
      createGame(game.players, true, true, game.dealerId);
    }
  };

  return (
    <div className="felt-bg min-h-dvh">
      {!game ? (
        <div className="flex items-center justify-center min-h-dvh py-4 px-4">
          <SetupScreen
            playerCount={playerCount}
            onPlayerCountChange={setPlayerCount}
            targetScore={targetScore}
            onTargetScoreChange={setTargetScore}
            names={names}
            onNamesChange={setNames}
            dealerIndex={dealerIndex}
            onDealerIndexChange={setDealerIndex}
            gameRules={gameRules}
            onRulesChange={setGameRules}
            onStart={() => createGame()}
          />
        </div>
      ) : (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
          <GameHeader
            gameId={game.id}
            targetScore={targetScore}
            dealerName={game.players.find((p) => p.id === game.dealerId)?.name || ''}
            onNewGame={resetGame}
          />

          {hasHistoryShown && <GameHistory players={game.players} />}

          {game.rounds.length > 0 && (
            <RoundTimeline
              totalRounds={game.rounds.length + (winnerPlayer !== null ? 0 : 1)}
              currentRound={game.rounds.length + (winnerPlayer !== null ? 0 : 1)}
              snapshotRound={snapshotRound}
              onSelectRound={(r) => setSnapshotRound(r)}
              onExitSnapshot={() => setSnapshotRound(null)}
            />
          )}

          <ScoreBoard
            players={game.players}
            totals={displayTotals}
            targetScore={targetScore}
            dealerId={game.dealerId}
            snapshotActive={snapshotRound !== null}
          />

          {winnerPlayer !== null ? (
            <WinnerScreen
              winner={game.players.find((p) => p.id === winnerPlayer)!}
              players={game.players}
              totals={totals}
              roundCount={game.rounds.length}
              onNewGame={resetGame}
              onContinue={continueGame}
            />
          ) : (
            <>
              {snapshotRound === null && (
                <>
                  {error && (
                    <div className="bg-score-neg/10 border border-score-neg/40 text-score-neg px-4 py-3 rounded-xl text-sm">
                      {error}
                    </div>
                  )}
                  <RoundForm
                    players={game.players}
                    scores={scores}
                    onScoreChange={(e, id) => setScores({ ...scores, [id]: e.target.value })}
                    onAddRound={addRound}
                    roundNumber={game.rounds.length + 1}
                    isAddDisabled={isAddDisabled}
                    gameRules={gameRules}
                  />
                </>
              )}
            </>
          )}

          <RoundHistory
            rounds={game.rounds}
            players={game.players}
            onUpdateRound={updateRound}
            gameRules={gameRules}
            snapshotRound={snapshotRound}
            dealerByRound={dealerByRound}
          />

          {game.rounds.length > 0 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowStatistics(!showStatistics)}
                className="px-4 py-2 bg-card-bg border border-white/10 text-muted text-sm rounded-xl
                  hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]"
              >
                {showStatistics ? 'Приховати статистику' : 'Показати статистику'}
              </button>
            </div>
          )}

          {showStatistics && game.rounds.length > 0 && (
            <PlayerStatistics
              game={game}
              players={game.players}
              gameRules={gameRules}
            />
          )}
        </div>
      )}
    </div>
  );
}
