import React, {useEffect, useMemo, useState} from 'react';
import {Game, GameRulesConfig, Player, Round} from './types';
import {Award, PartyPopper, Sparkles, Zap} from 'lucide-react';

import SetupScreen from './components/SetupScreen';
import RoundForm from './components/RoundForm';
import RoundHistory from './components/RoundHistory';
import WinnerMessage from './components/WinnerMessage';
import Header from './components/Header';
import GameHistory from './components/GameHistory';
import TotalScores from './components/TotalScores';
import PlayerStatistics from './components/PlayerStatistics';
import {generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts, calculateGameTotals} from './utils/gameHelpers';

const GAME_ID = 'gameId';
const GAME_RULES_KEY = 'gameRules';

const defaultGameRules: GameRulesConfig = {
    secondBPenalty: -100,
    hvPenalty: -100,
    allowVis: true,
    customTargetScore: false,
    targetScoreOptions: [510, 1020]
};

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
    const [targetScore, setTargetScore] = useState(1020);
    const [names, setNames] = useState<string[]>(Array(2).fill(''));
    const [dealerIndex, setDealerIndex] = useState(0);
    const [game, setGame] = useState<Game | null>(null);
    const [scores, setScores] = useState<Record<string, number | string>>({});
    const [winnerPlayer, setWinnerPlayer] = useState<number | null>(null);
    const [error, setError] = useState<string>('');
    const [hasHistoryShown, setHasHistoryShown] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showStatistics, setShowStatistics] = useState(false);

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

    useEffect(() => {
        if (game) {
            console.log('Game updated:', game.id, 'rounds:', game.rounds.length);
        }
    }, [game]);

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
        setShowStatistics(false);
    };

    const isAddDisabled = game
        ? game.players.some(p => !isValidScore(scores[p.id], gameRules))
        : true;

    const updateWinner = (currentGame: Game) => {
        const totals = calculateGameTotals(currentGame, gameRules);
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
            setError('Заповніть всі поля валідними значеннями (число, Б, ХВ' + (gameRules.allowVis ? ' або ВІС' : '') + ').');
            return;
        }
        const roundNumber = game.rounds.length + 1;
        const updatedScores: Record<string, number | string> = {};
        game.players.forEach(p => {
            updatedScores[p.id] = parseScore(scores[p.id], p.id.toString(), game.rounds, gameRules);
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

        console.log('Updating round:', roundNumber, 'with scores:', newScores);

        const convertedScores: Record<string, number | string> = {};
        Object.entries(newScores).forEach(([playerId, scoreStr]) => {
            convertedScores[playerId] = parseScore(scoreStr, playerId, game.rounds, gameRules);
        });

        const updatedRounds = game.rounds.map(r =>
            r.number === roundNumber
                ? { ...r, scores: convertedScores }
                : r
        );

        const updatedGame: Game = {
            ...game,
            rounds: updatedRounds
        };

        console.log('Updated game:', updatedGame);

        setGame(updatedGame);
        setError('');
        updateWinner(updatedGame);
    };

    const totals = useMemo(() => {
        if (!game) return {};
        console.log('Recalculating totals for game:', game.id, 'rounds:', game.rounds.length);
        return calculateGameTotals(game, gameRules);
    }, [game, gameRules]);

    const resetGame = () => {
        setGame(null);
        setNames(Array(playerCount).fill(''));
        setDealerIndex((dealerIndex + 1) % playerCount);
        setWinnerPlayer(null);
        setError('');
        setHasHistoryShown(false);
        setShowCelebration(false);
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
            <ParticleEffect show={showCelebration}/>

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
                <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 sm:gap-6 p-4">
                    <div
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-linear-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5 animate-pulse"></div>

                        <div className="relative z-10">
                            <Header
                                gameId={game.id}
                                targetScore={targetScore}
                                dealerName={game.players.find(p => p.id === game.dealerId)?.name || ''}
                                onNewGame={resetGame}
                            />
                            {hasHistoryShown && <GameHistory players={game.players}/>}
                        </div>
                    </div>

                    <div
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-linear-to-r from-green-600/5 via-blue-600/5 to-purple-600/5 animate-pulse"></div>

                        <div className="relative z-10">
                            <TotalScores players={game.players} totals={totals}/>

                            {game.rounds.length > 0 && (
                                <div className="mt-4 text-center">
                                    <button
                                        onClick={() => {
                                            console.log('Toggle statistics:', !showStatistics);
                                            setShowStatistics(!showStatistics);
                                        }}
                                        className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition-all duration-200 text-sm sm:text-base"
                                    >
                                        {showStatistics ? 'Приховати статистику' : 'Показати статистику'}
                                    </button>
                                </div>
                            )}

                            {winnerPlayer !== null ? (
                                <div className="text-center py-4 sm:py-8 relative">
                                    <div
                                        className="absolute inset-0 bg-linear-to-r from-yellow-400/20 to-orange-500/20 rounded-2xl animate-pulse"></div>

                                    <div className="relative z-10">
                                        <div className="animate-bounce mb-4 sm:mb-6">
                                            <PartyPopper className="w-16 sm:w-20 h-16 sm:h-20 text-yellow-400 mx-auto drop-shadow-2xl"/>
                                        </div>
                                        <div className="mb-4 sm:mb-6">
                                            <h2 className="text-2xl sm:text-4xl font-bold bg-linear-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
                                                🎉 ПЕРЕМОЖЕЦЬ! 🎉
                                            </h2>
                                            <p className="text-xl sm:text-2xl text-white font-bold">
                                                {game.players.find(p => p.id === winnerPlayer)!.name}
                                            </p>
                                            <div className="flex items-center justify-center mt-4 space-x-2">
                                                <Award className="w-6 sm:w-8 h-6 sm:h-8 text-yellow-400"/>
                                                <span className="text-white/80 text-base sm:text-lg">Вітаємо з перемогою!</span>
                                                <Award className="w-6 sm:w-8 h-6 sm:h-8 text-yellow-400"/>
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
                                            className="bg-red-500/20 border border-red-400/50 text-red-200 px-3 sm:px-4 py-2 sm:py-3 rounded-xl mb-4 sm:mb-6 backdrop-blur-sm">
                                            <div className="flex items-center text-sm sm:text-base">
                                                <Zap className="w-4 sm:w-5 h-4 sm:h-5 mr-2"/>
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
                                        gameRules={gameRules}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div
                        className="bg-white/10 backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
                        <div
                            className="absolute inset-0 bg-linear-to-r from-purple-600/5 via-pink-600/5 to-red-600/5 animate-pulse"></div>

                        <div className="relative z-10">
                            <RoundHistory
                                rounds={game.rounds}
                                players={game.players}
                                onUpdateRound={updateRound}
                                gameRules={gameRules}
                            />
                        </div>
                    </div>

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