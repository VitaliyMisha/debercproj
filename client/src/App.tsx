import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Player { id: number; name: string; }
interface Round { id: number; number: number; scores: Record<string, number | string>; }
interface Game { id: number; createdAt: string; players: Player[]; rounds: Round[]; }

export default function App() {
    const [playerCount, setPlayerCount] = useState<number>(2);
    const [targetScore, setTargetScore] = useState<number>(510);
    const [names, setNames] = useState<string[]>(Array(2).fill(''));
    const [game, setGame] = useState<Game | null>(null);
    const [scores, setScores] = useState<Record<string, number | string>>({});
    const [winnerPlayer, setWinnerPlayer] = useState<number | null>(null);

    useEffect(() => {
        setNames(Array(playerCount).fill(''));
    }, [playerCount]);

    const createGame = async () => {
        const res = await axios.post<Game>(`${import.meta.env.VITE_API_URL}/game`, {
            players: names,
            targetScore,
        });
        setGame(res.data);
        setWinnerPlayer(null);
        const init: Record<string, number | string> = {};
        res.data.players.forEach(p => (init[p.id] = 0));
        setScores(init);
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

    const addRound = async () => {
        if (!game || winnerPlayer !== null) return;
        const roundNumber = game.rounds.length + 1;

        const updatedScores: Record<string, string | number> = {};
        game.players.forEach(p => {
            updatedScores[p.id] = parseScore(scores[p.id], p.id.toString(), game.rounds);
        });

        await axios.post<Round>(`${import.meta.env.VITE_API_URL}/round`, {
            gameId: game.id,
            number: roundNumber,
            scores: updatedScores,
        });

        const updated = await axios.get<Game>(`${import.meta.env.VITE_API_URL}/game/${game.id}`);
        setGame(updated.data);

        const reset: Record<string, number | string> = {};
        updated.data.players.forEach(p => {
            reset[p.id] = 0;
        });
        setScores(reset);

        const totals: Record<string, number> = {};
        updated.data.players.forEach(p => (totals[p.id] = 0));

        updated.data.rounds.forEach((r, i, arr) => {
            Object.entries(r.scores).forEach(([pid, val]) => {
                const playerRoundsBefore = arr.slice(0, i);
                const score = parseScore(val, pid, playerRoundsBefore);
                if (typeof score === 'number') {
                    totals[pid] += score;
                }
            });
        });

        const playersWithTargetScore = game.players.filter(p => totals[p.id] >= targetScore);

        if (playersWithTargetScore.length === 1) {
            setWinnerPlayer(playersWithTargetScore[0].id);
        } else if (playersWithTargetScore.length > 1) {
            const highestScore = Math.max(...playersWithTargetScore.map(p => totals[p.id]));
            const winners = playersWithTargetScore.filter(p => totals[p.id] === highestScore);

            if (winners.length === 1) {
                setWinnerPlayer(winners[0].id);
            } else {
                setWinnerPlayer(null);
            }
        }
    };

    if (!game) {
        return (
            <div className="max-w-md mx-auto mt-10 p-4 bg-white rounded shadow">
                <h1 className="text-xl font-bold mb-4 text-center">Налаштування гри</h1>

                <label className="block mb-2 text-center">
                    Кількість гравців:
                    <select
                        className="block w-full p-2 border rounded text-center"
                        value={playerCount}
                        onChange={e => setPlayerCount(Number(e.target.value))}
                    >
                        <option value={2}>2 гравців</option>
                        <option value={3}>3 гравців</option>
                        <option value={4}>4 гравців</option>
                    </select>
                </label>

                <label className="block mb-4 text-center">
                    До якого рахунку грати:
                    <select
                        className="block w-full p-2 border rounded text-center"
                        value={targetScore}
                        onChange={e => setTargetScore(Number(e.target.value))}
                    >
                        <option value={510}>510 очків</option>
                        <option value={1020}>1020 очків</option>
                    </select>
                </label>

                <h2 className="font-semibold mb-2 text-center">Імена гравців</h2>
                {names.map((n, idx) => (
                    <div key={idx} className="flex gap-2 items-center mb-2 text-center">
                        <input
                            className="flex-1 p-2 border rounded text-center"
                            placeholder={`Игрок ${idx + 1}`}
                            value={n}
                            onChange={e => {
                                const arr = [...names];
                                arr[idx] = e.target.value;
                                setNames(arr);
                            }}
                        />
                    </div>
                ))}

                <button
                    className={`mt-4 w-full p-2 text-white rounded ${names.every(n => n.trim()) ? 'bg-blue-500' : 'bg-gray-400 cursor-not-allowed'}`}
                    onClick={createGame}
                    disabled={!names.every(n => n.trim())}
                >
                    Start the game!
                </button>
            </div>
        );
    }

    const totals: Record<string, number> = {};
    game.players.forEach(p => (totals[p.id] = 0));
    game.rounds.forEach((r, i, arr) => {
        Object.entries(r.scores).forEach(([pid, val]) => {
            const playerRoundsBefore = arr.slice(0, i);
            const score = parseScore(val, pid, playerRoundsBefore);
            if (typeof score === 'number') {
                totals[pid] += score;
            }
        });
    });

    return (
        <div className="max-w-lg mx-auto mt-10 p-4 bg-white rounded shadow">
            <h1 className="text-xl font-bold mb-4 text-center">
                Гра #{game.id} (до {targetScore})
            </h1>

            {winnerPlayer !== null ? (
                <>
                    <div className="mb-6 text-center text-green-600 font-bold text-lg">
                        Победил игрок {game.players.find(p => p.id === winnerPlayer)?.name}!
                    </div>
                    <button
                        className="mb-6 p-2 w-full bg-blue-500 text-white rounded"
                        onClick={() => {
                            setGame(null);
                            setWinnerPlayer(null);
                            setNames(Array(playerCount).fill(''));
                        }}
                    >
                        Начать новую игру
                    </button>
                </>
            ) : (
                <div className="mb-6">
                    <h2 className="font-semibold mb-2 text-center">Раунд {game.rounds.length + 1}</h2>
                    {game.players.map(p => (
                        <div key={p.id} className="flex items-center mb-2">
                            <span className="w-24">{p.name}</span>
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded text-center"
                                value={scores[p.id] || ''}
                                onChange={e => setScores({ ...scores, [p.id]: e.target.value })}
                            />
                        </div>
                    ))}
                    <div className="flex items-center justify-center">
                        <button
                            className="p-2 bg-green-500 text-white rounded text-center"
                            onClick={addRound}
                        >
                            Додати раунд
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h2 className="font-semibold mb-2 text-center">Істория раундів</h2>
                <ul className="list-disc pl-5">
                    {game.rounds.map(r => (
                        <li key={r.id} className="mb-1">
                            Раунд {r.number}: {' '}
                            {game.players.map((p, i) => (
                                <span key={p.id}>
                                    {p.name} {r.scores[p.id]}
                                    {i !== game.players.length - 1 && ', '}
                                </span>
                            ))}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mb-6">
                <h2 className="font-semibold mb-2 text-center bg-gray-500 text-white p-2 rounded">
                    Загалом
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 justify-items-center mx-auto w-full max-w-3xl">
                    {game.players.map(p => (
                        <li key={p.id} className="text-center">
                            <span className="font-bold">{p.name}</span>: {totals[p.id]}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
