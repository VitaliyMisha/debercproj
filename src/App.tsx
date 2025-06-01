import React, {useEffect, useMemo, useState} from 'react';
import {Game, Player, Round} from './types';
import {Award, Crown, PartyPopper, Sparkles, Trophy, Users, Zap} from 'lucide-react';

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

const ParticleEffect = ({show}: { show: boolean }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {[...Array(15)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-bounce"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${1 + Math.random()}s`
                    }}
                >
                    <Sparkles className="w-6 h-6 text-yellow-400 drop-shadow-lg"/>
                </div>
            ))}
        </div>
    );
};
const GameButton = ({
                        onClick,
                        disabled,
                        children,
                        variant = "primary",
                        className = "",
                        type = "button"
                    }: {
    onClick?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
    variant?: "primary" | "success" | "danger" | "winner";
    className?: string;
    type?: "button" | "submit";
}) => {
    const baseClasses = "relative overflow-hidden font-bold py-3 px-6 rounded-xl transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105",
        success: "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl hover:scale-105",
        danger: "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl hover:scale-105",
        winner: "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-2xl hover:shadow-yellow-500/50 animate-pulse"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${className}`}
        >
            <div className="relative z-10 flex items-center justify-center space-x-2">
                {children}
            </div>
            {!disabled && (
                <div className="absolute inset-0 bg-white opacity-0 hover:opacity-20 transition-opacity duration-300"/>
            )}
        </button>
    );
};

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
    const [showCelebration, setShowCelebration] = useState(false);

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
            return {id, name, winCount: preserveWinCounts ? 0 : winCounts[id] || 0};
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
        setShowCelebration(false);
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

            stillPendingVis.forEach(({playerId: visPlayerId, roundIndex}) => {
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
                    curr.score > best.score ? curr : best, {playerId: -1, score: -Infinity}
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
            for (const [pid, val] of Object.entries(round.scores)) {
                const playerId = Number(pid);

                if (val === 'Б') {
                    bCounts[playerId] += 1;
                    if (bCounts[playerId] === 2) {
                        totals[playerId] -= 100;
                    }
                } else if (val === 'ВІС') {
                    pendingVis.push({playerId, roundIndex: idx});
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
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 4000);

                const updatedPlayers = currentGame.players.map(p =>
                    p.id === winner.id ? {...p, winCount: p.winCount + 1} : p
                );
                setGame({...currentGame, players: updatedPlayers});
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
        const newRound: Round = {id: roundNumber, number: roundNumber, scores: updatedScores};
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
                ? {...r, scores: Object.fromEntries(Object.entries(newScores))}
                : r
        );
        const updatedGame = {...game, rounds: updatedRounds};
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
        setShowCelebration(false);
        setGameId(1);
    };

    const continueGame = () => {
        if (game) {
            createGame(game.players, true, true, game.dealerId);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col items-center py-10 relative">
            {/* Анімовані частинки для перемоги */}
            <ParticleEffect show={showCelebration}/>

            {!game ? (
                <div className="w-full max-w-md relative">
                    {/* Декоративні елементи навколо форми */}
                    <div
                        className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-20 animate-pulse"></div>
                    <div
                        className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-20 animate-pulse animation-delay-1000"></div>

                    <div
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                        {/* Світловий ефект */}
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse"></div>

                        <div className="relative z-10">
                            {/* Ігровий заголовок */}
                            <div className="text-center mb-8">
                                <div
                                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4 animate-bounce shadow-lg">
                                    <Trophy className="w-10 h-10 text-white drop-shadow-lg"/>
                                </div>
                            </div>

                            <Header gameId={gameId} targetScore={targetScore} dealerName=""/>

                            <div className="space-y-6">
                                <GameSettings
                                    playerCount={playerCount}
                                    setPlayerCount={setPlayerCount}
                                    targetScore={targetScore}
                                    setTargetScore={setTargetScore}
                                />

                                <div className="mt-6">
                                    <h2 className="text-lg font-medium mb-4 text-white text-center flex items-center justify-center">
                                        <Users className="w-5 h-5 mr-2"/>
                                        Імена гравців
                                    </h2>
                                    {names.map((n, idx) => (
                                        <div key={idx}
                                             className="mb-4 flex justify-center items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                            <PlayerInput
                                                idx={idx}
                                                name={n}
                                                onChange={(value, i) => {
                                                    const arr = [...names];
                                                    arr[i] = value;
                                                    setNames(arr);
                                                }}
                                            />
                                            <label
                                                className="flex items-center text-white/90 cursor-pointer hover:text-white transition-colors">
                                                <input
                                                    type="radio"
                                                    name="dealer"
                                                    checked={dealerIndex === idx}
                                                    onChange={() => setDealerIndex(idx)}
                                                    className="w-4 h-4 text-yellow-600 bg-transparent border-2 border-white/50 focus:ring-yellow-500 focus:ring-2 mr-2"
                                                />
                                                <Crown
                                                    className={`w-5 h-5 transition-all duration-300 ${dealerIndex === idx ? 'text-yellow-400 animate-pulse' : 'text-white/70'}`}/>
                                                <span className="ml-1 text-sm font-medium">Роздає</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <GameButton
                                    onClick={() => createGame()}
                                    disabled={!names.every(n => n.trim())}
                                    className="w-full text-lg py-4"
                                >
                                    <Zap className="w-6 h-6"/>
                                    <span>🚀 Почати епічну гру!</span>
                                </GameButton>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-4xl flex flex-col gap-6 px-4 relative">
                    {/* Декоративні елементи для ігрового режиму */}
                    <div
                        className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 animate-pulse"></div>
                    <div
                        className="absolute top-20 right-10 w-24 h-24 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-10 animate-pulse animation-delay-2000"></div>

                    <div
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        {/* Анімований фон */}
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5 animate-pulse"></div>

                        <div className="relative z-10">
                            <Header
                                gameId={game.id}
                                targetScore={targetScore}
                                dealerName={game.players.find(p => p.id === game.dealerId)?.name || ''}
                            />
                            {hasHistoryShown && <GameHistory players={game.players}/>}
                        </div>
                    </div>

                    <div
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-green-600/5 via-blue-600/5 to-purple-600/5 animate-pulse"></div>

                        <div className="relative z-10">
                            <TotalScores players={game.players} totals={totals}/>
                            {winnerPlayer !== null ? (
                                <div className="text-center py-8 relative">
                                    {/* Святкові елементи */}
                                    <div
                                        className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl animate-pulse"></div>

                                    <div className="relative z-10">
                                        <div className="animate-bounce mb-6">
                                            <PartyPopper className="w-20 h-20 text-yellow-400 mx-auto drop-shadow-2xl"/>
                                        </div>
                                        <div className="mb-6">
                                            <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                                                🎉 ПЕРЕМОЖЕЦЬ! 🎉
                                            </h2>
                                            <p className="text-2xl text-white font-bold">
                                                {game.players.find(p => p.id === winnerPlayer)!.name}
                                            </p>
                                            <div className="flex items-center justify-center mt-4 space-x-2">
                                                <Award className="w-8 h-8 text-yellow-400"/>
                                                <span className="text-white/80 text-lg">Вітаємо з перемогою!</span>
                                                <Award className="w-8 h-8 text-yellow-400"/>
                                            </div>
                                        </div>

                                        <WinnerMessage
                                            winnerName={game.players.find(p => p.id === winnerPlayer)!.name}
                                            onNewGame={resetGame}
                                            onContinue={continueGame}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {error && (
                                        <div
                                            className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-xl mb-6 backdrop-blur-sm">
                                            <div className="flex items-center">
                                                <Zap className="w-5 h-5 mr-2"/>
                                                {error}
                                            </div>
                                        </div>
                                    )}
                                    <RoundForm
                                        players={game.players}
                                        scores={scores}
                                        onScoreChange={(e, id) => setScores({...scores, [id]: e.target.value})}
                                        onAddRound={addRound}
                                        roundNumber={game.rounds.length + 1}
                                        isAddDisabled={isAddDisabled}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-pink-600/5 to-red-600/5 animate-pulse"></div>

                        <div className="relative z-10">
                            <RoundHistory
                                rounds={game.rounds}
                                players={game.players}
                                onUpdateRound={updateRound}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}