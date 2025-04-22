import React, { useState, useEffect } from 'react';
import { Player, Round, Game } from './types';

import GameSettings from './components/GameSettings';
import PlayerInput from './components/PlayerInput';
import RoundForm from './components/RoundForm';
import RoundHistory from './components/RoundHistory';
import TotalScores from './components/TotalScores';
import WinnerMessage from './components/WinnerMessage';
import Header from './components/Header';

export default function App() {
    const [playerCount, setPlayerCount] = useState(2);
    const [targetScore, setTargetScore] = useState(510);
    const [names, setNames] = useState<string[]>(Array(2).fill(''));
    const [game, setGame] = useState<Game | null>(null);
    const [scores, setScores] = useState<Record<string, number | string>>({});
    const [winnerPlayer, setWinnerPlayer] = useState<number | null>(null);
    const [gameId, setGameId] = useState<number>(1); // Ідентифікатор гри починається з 1

    useEffect(() => {
        setNames(Array(playerCount).fill(''));
    }, [playerCount]);

    const createGame = () => {
        const players: Player[] = names.map((name, idx) => ({ id: idx + 1, name }));
        const newGame: Game = {
            id: gameId,
            createdAt: new Date().toISOString(),
            players,
            rounds: [],
        };
        setGame(newGame);
        setWinnerPlayer(null);
        setScores(Object.fromEntries(players.map(p => [p.id.toString(), 0])));
    };

    const parseScore = (value: string | number, pid: string, playerRounds: Round[]): number | string => {
        if (typeof value === 'number') return value;
        const trimmed = value.toString().trim().toUpperCase();
        if (trimmed === 'ХВ') return -100;
        if (trimmed === 'Б') {
            const hadBBefore = playerRounds.some(r => {
                const val = r.scores[pid];
                return typeof val === 'string' && val.trim().toUpperCase() === 'Б';
            });
            return hadBBefore ? -100 : 'Б';
        }
        const parsed = parseInt(trimmed);
        return isNaN(parsed) ? 0 : parsed;
    };

    const addRound = () => {
        if (!game || winnerPlayer !== null) return;
        const roundNumber = game.rounds.length + 1;

        const updatedScores: Record<string, number | string> = {};
        game.players.forEach(p => {
            updatedScores[p.id] = parseScore(scores[p.id], p.id.toString(), game.rounds);
        });

        const newRound: Round = {
            id: game.rounds.length + 1,
            number: roundNumber,
            scores: updatedScores,
        };

        const updatedRounds = [...game.rounds, newRound];
        const updatedGame = { ...game, rounds: updatedRounds };
        setGame(updatedGame);

        const resetScores: Record<string, number | string> = {};
        updatedGame.players.forEach(p => {
            resetScores[p.id] = 0;
        });
        setScores(resetScores);

        // determine winner
        const totals: Record<number, number> = {};
        updatedGame.players.forEach(p => (totals[p.id] = 0));
        updatedRounds.forEach((r, idx, arr) => {
            Object.entries(r.scores).forEach(([pid, val]) => {
                const before = arr.slice(0, idx);
                const score = parseScore(val, pid, before as Round[]);
                if (typeof score === 'number') totals[Number(pid)] += score;
            });
        });

        const contenders = updatedGame.players.filter(p => totals[p.id] >= targetScore);
        if (contenders.length === 1) setWinnerPlayer(contenders[0].id);
        else if (contenders.length > 1) {
            const maxScore = Math.max(...contenders.map(p => totals[p.id]));
            const winners = contenders.filter(p => totals[p.id] === maxScore);
            setWinnerPlayer(winners.length === 1 ? winners[0].id : null);
        }
    };

    // Pre-calc totals
    const totals: Record<number, number> = {};
    game?.players.forEach(p => (totals[p.id] = 0));
    game?.rounds.forEach((r, idx, arr) => {
        Object.entries(r.scores).forEach(([pid, val]) => {
            const before = arr.slice(0, idx);
            const score = parseScore(val, pid, before as Round[]);
            if (typeof score === 'number') totals[Number(pid)] += score;
        });
    });

    const restartGame = () => {
        setGame(null);
        setWinnerPlayer(null);
        setScores({});
        setNames(Array(playerCount).fill(''));
        setGameId(prevId => prevId + 1); // Збільшуємо ідентифікатор гри на 1 для наступного запуску
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
            {!game ? (
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <Header gameId={gameId} targetScore={targetScore} />
                    <GameSettings
                        playerCount={playerCount}
                        setPlayerCount={setPlayerCount}
                        targetScore={targetScore}
                        setTargetScore={setTargetScore}
                    />
                    <div className="mt-6">
                        <h2 className="text-lg font-medium mb-2 text-gray-700">Імена гравців</h2>
                        {names.map((n, idx) => (
                            <div key={idx} className="mb-3">
                                <PlayerInput
                                    idx={idx}
                                    name={n}
                                    onChange={(e, i) => {
                                        const arr = [...names];
                                        arr[i] = e.target.value;
                                        setNames(arr);
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        className={`mt-6 w-full py-3 text-white font-semibold rounded-md transition-colors ${
                            names.every(n => n.trim()) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        onClick={createGame}
                        disabled={!names.every(n => n.trim())}
                    >
                        Start the Game
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-4xl flex flex-col gap-6 px-4">
                    {/* Header */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <Header gameId={game.id} targetScore={targetScore} />
                    </div>

                    {/* TotalScores */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <TotalScores players={game.players} totals={totals} />
                    </div>

                    {/* RoundForm */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        {winnerPlayer !== null ? (
                            <WinnerMessage
                                winnerName={game.players.find(p => p.id === winnerPlayer)!.name}
                                onNewGame={restartGame} // Викликаємо функцію restartGame при завершенні
                            />
                        ) : (
                            <RoundForm
                                players={game.players}
                                scores={scores}
                                onScoreChange={(e, id) => setScores({ ...scores, [id]: e.target.value })}
                                onAddRound={addRound}
                                roundNumber={game.rounds.length + 1}
                            />
                        )}
                    </div>

                    {/* RoundHistory */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <RoundHistory rounds={game.rounds} players={game.players} />
                    </div>
                </div>
            )}
        </div>
    );
}
