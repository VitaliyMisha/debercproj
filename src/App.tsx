import React, { useState, useEffect, useMemo } from 'react';
import { Player, Round, Game } from './types';

import GameSettings from './components/GameSettings';
import PlayerInput from './components/PlayerInput';
import RoundForm from './components/RoundForm';
import RoundHistory from './components/RoundHistory';
import WinnerMessage from './components/WinnerMessage';
import Header from './components/Header';
import GameHistory from './components/GameHistory';
import TotalScores from './components/TotalScores';
import {generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts} from './utils/gameHelpers';

const GAME_ID = 'gameId';

export default function App() {
    const [playerCount, setPlayerCount] = useState(2);
    const [targetScore, setTargetScore] = useState(510);
    const [names, setNames] = useState<string[]>(Array(2).fill(''));
    const [dealerIndex, setDealerIndex] = useState(0);
    const [game, setGame] = useState<Game | null>(null);
    const [scores, setScores] = useState<Record<string, number | string>>({});
    const [winnerPlayer, setWinnerPlayer] = useState<number | null>(null);
    const [error, setError] = useState<string>('');
    const [hasHistoryShown, setHasHistoryShown] = useState(false);

    const [gameId, setGameId] = useState(() => {
        const stored = localStorage.getItem(GAME_ID);
        return stored ? parseInt(stored, 10) : 1;
    });

    useEffect(() => {
        localStorage.setItem(GAME_ID, gameId.toString());
    }, [gameId]);

    useEffect(() => {
        setNames(Array(playerCount).fill(''));
    }, [playerCount]);

    const createGame = (
        reusePlayers?: Player[],
        showHistory = false,
        preserveWinCounts = false,
        startingDealerId?: number
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
        setScores(Object.fromEntries(players.map(p => [p.id.toString(), ''])));
        setGameId(prev => prev + 1);
        setError('');
        setHasHistoryShown(showHistory);
    };

    const isAddDisabled = game
        ? game.players.some(p => !isValidScore(scores[p.id]))
        : true;

    const calculateTotals = (currentGame: Game) => {
        const totals: Record<number, number> = {};
        const bCounts: Record<number, number> = {}; // к-сть Б для кожного гравця

        currentGame.players.forEach(p => {
            totals[p.id] = 0;
            bCounts[p.id] = 0;
        });

        const pendingVis: { playerId: number, roundIndex: number }[] = [];

        currentGame.rounds.forEach((round, idx, allRounds) => {
            const stillPendingVis = [...pendingVis];

            stillPendingVis.forEach(({ playerId: visPlayerId, roundIndex }) => {
                const prevRound = allRounds[roundIndex];
                const hangingScore = Math.max(
                    ...Object.values(prevRound.scores)
                        .map(val => typeof val === 'number' ? val : 0)
                );

                const opponentEntriesPrev = Object.entries(prevRound.scores)
                    .filter(([id]) => Number(id) !== visPlayerId)
                    .map(([id, val]) => ({
                        playerId: Number(id),
                        score: typeof val === 'number' ? val : 0
                    }));

                const bestOpponentPrev = opponentEntriesPrev.reduce((best, curr) =>
                    curr.score > best.score ? curr : best, { playerId: -1, score: -Infinity }
                );

                const visScore = typeof round.scores[visPlayerId] === 'number'
                    ? round.scores[visPlayerId] as number
                    : 0;

                const opponentScore = typeof round.scores[bestOpponentPrev.playerId] === 'number'
                    ? round.scores[bestOpponentPrev.playerId] as number
                    : 0;

                if (visScore > opponentScore) {
                    // ВІСник виграв -> отримує підвішені очки
                    totals[visPlayerId] += hangingScore;
                } else {
                    // ВІСник програв або нічия -> стає Б, суперник забирає підвіс
                    prevRound.scores[visPlayerId] = 'Б';
                    bCounts[visPlayerId] += 1;
                    if (bCounts[visPlayerId] === 2) {
                        totals[visPlayerId] -= 100;
                    }

                    totals[bestOpponentPrev.playerId] += opponentScore + hangingScore;
                    round.scores[bestOpponentPrev.playerId] = opponentScore + hangingScore;
                }

                pendingVis.splice(pendingVis.findIndex(p => p.playerId === visPlayerId && p.roundIndex === roundIndex), 1);
            });

            // Обробка нових результатів цього раунду
            for (const [pid, val] of Object.entries(round.scores)) {
                const playerId = Number(pid);

                if (val === 'Б') {
                    bCounts[playerId] += 1;
                    if (bCounts[playerId] === 2) {
                        totals[playerId] -= 100;
                    }
                } else if (val === 'ВІС') {
                    pendingVis.push({ playerId, roundIndex: idx });
                }
            }

            for (const [pid, val] of Object.entries(round.scores)) {
                const playerId = Number(pid);
                const isPending = pendingVis.some(p => p.playerId === playerId);

                if (!isPending) {
                    const score = typeof val === 'number' ? val : 0;
                    totals[playerId] += score;
                }
            }
        });

        return totals;
    };

    const updateWinner = (currentGame: Game) => {
        const totals = calculateTotals(currentGame);
        const contenders = currentGame.players.filter(p => totals[p.id] >= targetScore);
        if (contenders.length > 0) {
            const maxScore = Math.max(...contenders.map(p => totals[p.id]));
            const winners = contenders.filter(p => totals[p.id] === maxScore);
            if (winners.length === 1) {
                const winner = winners[0];
                setWinnerPlayer(winner.id);
                const updatedPlayers = currentGame.players.map(p =>
                    p.id === winner.id ? { ...p, winCount: p.winCount + 1 } : p
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
            setError('Заповніть всі поля валідними значеннями (число, Б, ХВ або ВІС).');
            return;
        }
        const roundNumber = game.rounds.length + 1;
        const updatedScores: Record<string, number | string> = {};
        game.players.forEach(p => {
            updatedScores[p.id] = parseScore(scores[p.id], p.id.toString(), game.rounds);
        });
        const newRound: Round = { id: roundNumber, number: roundNumber, scores: updatedScores };
        const nextDealerIndex = (game.players.findIndex(p => p.id === game.dealerId) + 1) % game.players.length;
        const updatedGame: Game = {
            ...game,
            rounds: [...game.rounds, newRound],
            dealerId: game.players[nextDealerIndex].id,
        };
        setGame(updatedGame);
        setScores(Object.fromEntries(updatedGame.players.map(p => [p.id.toString(), ''])));
        setError('');
        updateWinner(updatedGame);
    };

    const updateRound = (roundNumber: number, newScores: Record<string, string>) => {
        if (!game) return;
        const updatedRounds = game.rounds.map(r =>
            r.number === roundNumber
                ? { ...r, scores: Object.fromEntries(Object.entries(newScores)) }
                : r
        );
        const updatedGame = { ...game, rounds: updatedRounds };
        setGame(updatedGame);
        setError('');
        updateWinner(updatedGame);
    };

    const totals = useMemo(() => (game ? calculateTotals(game) : {}), [game]);

    const resetGame = () => {
        setGame(null);
        setNames(Array(playerCount).fill(''));
        setDealerIndex((dealerIndex + 1) % playerCount);
        setWinnerPlayer(null);
        setError('');
        setHasHistoryShown(false);
        setGameId(1);
    };

    const continueGame = () => {
        if (game) {
            createGame(game.players, true, true, game.dealerId);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
            {!game ? (
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <Header gameId={gameId} targetScore={targetScore} dealerName="" />
                    <GameSettings
                        playerCount={playerCount} setPlayerCount={setPlayerCount}
                        targetScore={targetScore} setTargetScore={setTargetScore}
                    />
                    <div className="mt-6">
                        <h2 className="text-lg font-medium mb-2 text-gray-700 text-center">Імена гравців</h2>
                        {names.map((n, idx) => (
                            <div key={idx} className="mb-3 flex  justify-center-safe">
                                <PlayerInput idx={idx} name={n} onChange={(value, i) => {
                                    const arr = [...names];
                                    arr[i] = value;
                                    setNames(arr);
                                }} />
                                <label className="ml-2 text-sm">
                                    <input
                                        type="radio"
                                        name="dealer"
                                        checked={dealerIndex === idx}
                                        onChange={() => setDealerIndex(idx)}
                                        className="mr-1"
                                    />
                                    Роздає
                                </label>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => createGame()}
                        className={`mt-6 w-full py-3 text-white font-semibold rounded-md transition-colors ${
                            names.every(n => n.trim()) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!names.every(n => n.trim())}
                    >
                        Start the Game
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-4xl flex flex-col gap-6 px-4">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <Header
                            gameId={game.id}
                            targetScore={targetScore}
                            dealerName={game.players.find(p => p.id === game.dealerId)?.name || ''}
                        />
                        {hasHistoryShown && <GameHistory players={game.players} />}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <TotalScores players={game.players} totals={totals} />
                        {winnerPlayer !== null ? (
                            <WinnerMessage
                                winnerName={game.players.find(p => p.id === winnerPlayer)!.name}
                                onNewGame={resetGame}
                                onContinue={continueGame}
                            />
                        ) : (
                            <>
                                {error && <div className="text-red-600 mb-4 font-medium">{error}</div>}
                                <RoundForm
                                    players={game.players}
                                    scores={scores}
                                    onScoreChange={(e, id) => setScores({ ...scores, [id]: e.target.value })}
                                    onAddRound={addRound}
                                    roundNumber={game.rounds.length + 1}
                                    isAddDisabled={isAddDisabled}
                                />
                            </>
                        )}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <RoundHistory
                            rounds={game.rounds}
                            players={game.players}
                            onUpdateRound={updateRound}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
