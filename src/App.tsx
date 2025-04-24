import React, { useState, useEffect } from 'react';
import { Player, Round, Game } from './types';

import GameSettings from './components/GameSettings';
import PlayerInput from './components/PlayerInput';
import RoundForm from './components/RoundForm';
import RoundHistory from './components/RoundHistory';
import WinnerMessage from './components/WinnerMessage';
import Header from './components/Header';
import GameHistory from './components/GameHistory';
import TotalScores from './components/TotalScores';

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

    // Retrieve the last gameId from localStorage, or set to 1 if none exists
    const [gameId, setGameId] = useState(() => {
        const storedGameId = localStorage.getItem('gameId');
        return storedGameId ? parseInt(storedGameId, 10) : 1;
    });

    useEffect(() => {
        localStorage.setItem('gameId', gameId.toString());
    }, [gameId]);

    useEffect(() => {
        setNames(Array(playerCount).fill(''));
    }, [playerCount]);

    const createGame = (reusePlayers?: Player[], showHistory:boolean = false) => {
        const players: Player[] = reusePlayers || names.map((name, idx) => ({
            id: idx + 1,
            name,
            winCount: 0,
        }));
        const newGame: Game = {
            id: gameId,
            createdAt: new Date().toISOString(),
            players,
            rounds: [],
            dealerId: players[dealerIndex].id,
        };
        setGame(newGame);
        setWinnerPlayer(null);
        setScores(Object.fromEntries(players.map(p => [p.id.toString(), ''])));
        setGameId(prev => prev + 1); // Increment the gameId after each new game creation
        setError('');
        setHasHistoryShown(showHistory);
    };

    const isValidScore = (val: string | number): boolean => {
        const trimmed = val?.toString().trim().toUpperCase();
        if (!trimmed) return false;
        if (/^\d+$/.test(trimmed)) return true;
        return trimmed === 'Б' || trimmed === 'ХВ';
    };

    const isAddDisabled: boolean = game
        ? game.players.some(p => !isValidScore(scores[p.id]))
        : true;

    const parseScore = (value: string | number, pid: string, playerRounds: Round[]): number | string => {
        if (typeof value === 'number') return value;
        const trimmed = value.toString().trim().toUpperCase();
        if (trimmed === 'ХВ') return -100;
        if (trimmed === 'Б') {
            const hadBBefore = playerRounds.some(r => r.scores[pid] === 'Б');
            return hadBBefore ? -100 : 'Б';
        }
        const parsed = parseInt(trimmed);
        return isNaN(parsed) ? 0 : parsed;
    };

    const updateWinner = (currentGame: Game) => {
        const totals: Record<number, number> = {};
        currentGame.players.forEach(p => (totals[p.id] = 0));
        currentGame.rounds.forEach((r, idx, arr) => {
            Object.entries(r.scores).forEach(([pid, val]) => {
                const before = arr.slice(0, idx);
                const score = parseScore(val, pid, before as Round[]);
                if (typeof score === 'number') totals[Number(pid)] += score;
            });
        });
        const contenders = currentGame.players.filter(p => totals[p.id] >= targetScore);
        if (contenders.length === 1) {
            const winner = contenders[0].id;
            setWinnerPlayer(winner);
            const updatedPlayers = currentGame.players.map(p =>
                p.id === winner ? { ...p, winCount: p.winCount + 1 } : p
            );
            setGame({ ...currentGame, players: updatedPlayers });
        } else if (contenders.length > 1) {
            const maxScore = Math.max(...contenders.map(p => totals[p.id]));
            const winners = contenders.filter(p => totals[p.id] === maxScore);
            setWinnerPlayer(winners.length === 1 ? winners[0].id : null);
        }
    };

    const addRound = () => {
        if (!game || winnerPlayer !== null) return;
        if (isAddDisabled) {
            setError('Заповніть всі поля валідними значеннями (число, Б або ХВ).');
            return;
        }
        const roundNumber = game.rounds.length + 1;
        const updatedScores: Record<string, number | string> = {};
        game.players.forEach(p => {
            updatedScores[p.id] = parseScore(scores[p.id], p.id.toString(), game.rounds);
        });
        const newRound: Round = { id: roundNumber, number: roundNumber, scores: updatedScores };
        const updatedRounds = [...game.rounds, newRound];
        const nextDealerIndex = (game.players.findIndex(p => p.id === game.dealerId) + 1) % game.players.length;
        const updatedGame: Game = { ...game, rounds: updatedRounds, dealerId: game.players[nextDealerIndex].id };
        setGame(updatedGame);
        setScores(Object.fromEntries(updatedGame.players.map(p => [p.id.toString(), ''])));
        setError('');
        updateWinner(updatedGame);
    };

    const updateRound = (roundNumber: number, newScores: Record<string, string>) => {
        if (!game) return;
        const updatedRounds = game.rounds.map(r =>
            r.number === roundNumber
                ? { ...r, scores: Object.fromEntries(Object.entries(newScores).map(([pid, val]) => [pid, val])) }
                : r
        );
        const updatedGame: Game = { ...game, rounds: updatedRounds };
        setGame(updatedGame);
        setError('');
        updateWinner(updatedGame);
    };

    const totals: Record<number, number> = {};
    game?.players.forEach(p => (totals[p.id] = 0));
    game?.rounds.forEach((r, idx, arr) => {
        Object.entries(r.scores).forEach(([pid, val]) => {
            const before = arr.slice(0, idx);
            const score = parseScore(val, pid, before as Round[]);
            if (typeof score === 'number') totals[Number(pid)] += score;
        });
    });

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
        if (game && game.players) {
            createGame(game.players as Player[],true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
            {!game ? (
                <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
                    <Header gameId={gameId} targetScore={targetScore} dealerName={''} />
                    <GameSettings
                        playerCount={playerCount} setPlayerCount={setPlayerCount}
                        targetScore={targetScore} setTargetScore={setTargetScore}
                    />
                    <div className="mt-6">
                        <h2 className="text-lg font-medium mb-2 text-gray-700">Імена гравців</h2>
                        {names.map((n, idx) => (
                            <div key={idx} className="mb-3 flex items-center justify-between">
                                <PlayerInput idx={idx} name={n} onChange={(value, i) => {
                                        const arr = [...names];
                                        arr[i] = value;
                                        setNames(arr);
                                    }}
                                />
                                <label className="ml-2 text-sm">
                                    <input type="radio" name="dealer" checked={dealerIndex===idx} onChange={()=>setDealerIndex(idx)} className="mr-1" />Роздає
                                </label>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => createGame()}
                            className={`mt-6 w-full py-3 text-white font-semibold rounded-md transition-colors ${names.every(n=>n.trim()) ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`}
                            disabled={!names.every(n=>n.trim())}
                    >Start the Game</button>
                </div>
            ) : (
                <div className="w-full max-w-4xl flex flex-col gap-6 px-4">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <Header gameId={game.id} targetScore={targetScore}
                                dealerName={game.players.find(p=>p.id===game.dealerId)?.name||''} />
                        {hasHistoryShown && <GameHistory players={game.players} />}
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <TotalScores players={game.players} totals={totals} />
                        {winnerPlayer !== null ? (
                            <WinnerMessage
                                winnerName={game.players.find(p=>p.id===winnerPlayer)!.name}
                                onNewGame={resetGame}
                                onContinue={continueGame}
                            />
                        ) : (
                            <>
                                {error && <div className="text-red-600 mb-4 font-medium">{error}</div>}
                                <RoundForm
                                    players={game.players} scores={scores}
                                    onScoreChange={(e,id)=>setScores({...scores,[id]:e.target.value})}
                                    onAddRound={addRound}
                                    roundNumber={game.rounds.length+1}
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
