import React from 'react';
import { Game, Player } from '../types';
import { BarChart3, TrendingDown, TrendingUp, Activity, Award } from 'lucide-react';
import { GameRulesConfig } from './GameRules';
import { calculateGameTotals } from '../utils/gameHelpers';

interface PlayerStatisticsProps {
    game: Game;
    players: Player[];
    gameRules?: GameRulesConfig;
}

interface PlayerStats {
    totalScore: number;
    roundsPlayed: number;
    bCount: number;
    hvCount: number;
    visCount: number;
    averageScore: number;
    bestRound: number;
    worstRound: number;
    positiveRounds: number;
    negativeRounds: number;
}

const PlayerStatistics: React.FC<PlayerStatisticsProps> = ({ game, players, gameRules }) => {
    const calculatePlayerStats = (playerId: number): PlayerStats => {
        let bCount = 0;
        let hvCount = 0;
        let visCount = 0;
        let bestRound = -Infinity;
        let worstRound = Infinity;
        let positiveRounds = 0;
        let negativeRounds = 0;
        const roundScores: number[] = [];

        const hvPenalty = gameRules?.hvPenalty || -100;
        const secondBPenalty = gameRules?.secondBPenalty || -100;
        game.rounds.forEach((round) => {
            const score = round.scores[playerId];
            let effectiveRoundScore = 0;
            let shouldAddToRoundScores = true;
            console.log(`Player ${playerId}, Round score:`, score, 'Type:', typeof score);

            if (score === 'Б') {
                bCount++;
                if (bCount === 2) {
                    effectiveRoundScore = secondBPenalty;
                    negativeRounds++;
                } else {
                    effectiveRoundScore = 0;
                }
            } else if (score === 'ВІС') {
                visCount++;
                shouldAddToRoundScores = false;
            } else if (typeof score === 'number') {
                effectiveRoundScore = score;

                if (score === hvPenalty) {
                    hvCount++;
                }
                if (score > 0) {
                    positiveRounds++;
                } else if (score < 0) {
                    negativeRounds++;
                }
            } else{
                const upperScore = score.toUpperCase();
                if (upperScore === 'ХВ') {
                    hvCount++;
                    effectiveRoundScore = hvPenalty;
                    negativeRounds++;
                } else {
                    const numValue = parseInt(score);
                    if (!isNaN(numValue)) {
                        effectiveRoundScore = numValue;
                        if (numValue === hvPenalty) {
                            hvCount++;
                        }
                        if (numValue > 0) {
                            positiveRounds++;
                        } else if (numValue < 0) {
                            negativeRounds++;
                        }
                    }
                }
            }
            if (shouldAddToRoundScores) {
                roundScores.push(effectiveRoundScore);
                if (effectiveRoundScore > bestRound) {
                    bestRound = effectiveRoundScore;
                }
                if (effectiveRoundScore < worstRound) {
                    worstRound = effectiveRoundScore;
                }
            }
        });
        const gameTotals = calculateGameTotals(game, gameRules!);
        const totalScore = gameTotals[playerId] || 0;
        const averageScore = roundScores.length > 0
            ? roundScores.reduce((sum, s) => sum + s, 0) / roundScores.length
            : 0;

        console.log(`Player ${playerId} stats:`, {
            bCount,
            hvCount,
            visCount,
            totalScore,
            roundScores
        });

        return {
            totalScore,
            roundsPlayed: game.rounds.length,
            bCount,
            hvCount,
            visCount,
            averageScore,
            bestRound: bestRound === -Infinity ? 0 : bestRound,
            worstRound: worstRound === Infinity ? 0 : worstRound,
            positiveRounds,
            negativeRounds
        };
    };

    const allStats = players.map(player => ({
        player,
        stats: calculatePlayerStats(player.id)
    }));

    return (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-4 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5 animate-pulse"></div>

            <div className="relative z-10">
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                    <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6 text-white mr-2" />
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Детальна статистика</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {allStats.map(({ player, stats }) => (
                        <div
                            key={player.id}
                            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 sm:p-4 hover:bg-white/15 transition-all duration-300"
                        >
                            <div className="mb-3 sm:mb-4">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-1">{player.name}</h3>
                                <div className="flex items-center gap-2">
                                    <Award className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-400" />
                                    <span className="text-xs sm:text-sm text-white/80">
                                        {player.winCount} {player.winCount === 1 ? 'перемога' : 'перемог'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs sm:text-sm text-white/70">Загальний рахунок:</span>
                                    <span className={`font-bold ${stats.totalScore >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stats.totalScore}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-xs sm:text-sm text-white/70">Середній за раунд:</span>
                                    <span className="text-white font-medium">
                                        {stats.averageScore.toFixed(1)}
                                    </span>
                                </div>

                                <div className="border-t border-white/10 pt-2 sm:pt-3 space-y-1 sm:space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-white/70">Кількість "Б":</span>
                                        <span className="text-orange-400 font-medium">{stats.bCount}</span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm text-white/70">Кількість "ХВ":</span>
                                        <span className="text-red-400 font-medium">{stats.hvCount}</span>
                                    </div>

                                    {gameRules?.allowVis !== false && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm text-white/70">Кількість "ВІС":</span>
                                            <span className="text-purple-400 font-medium">{stats.visCount}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t border-white/10 pt-2 sm:pt-3 space-y-1 sm:space-y-2">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-green-400" />
                                        <span className="text-xs sm:text-sm text-white/70">Кращий раунд:</span>
                                        <span className="text-green-400 font-medium ml-auto">
                                            {stats.bestRound}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <TrendingDown className="w-3 sm:w-4 h-3 sm:h-4 text-red-400" />
                                        <span className="text-xs sm:text-sm text-white/70">Гірший раунд:</span>
                                        <span className="text-red-400 font-medium ml-auto">
                                            {stats.worstRound}
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-2 sm:pt-3">
                                    <div className="flex items-center justify-between">
                                        <Activity className="w-3 sm:w-4 h-3 sm:h-4 text-blue-400" />
                                        <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm">
                                            <span className="text-green-400">
                                                +{stats.positiveRounds}
                                            </span>
                                            <span className="text-white/50">/</span>
                                            <span className="text-red-400">
                                                -{stats.negativeRounds}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {game.rounds.length > 0 && (
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                        <div className="text-center text-xs sm:text-sm text-white/70">
                            <p>Всього зіграно раундів: <span className="font-semibold text-white">{game.rounds.length}</span></p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerStatistics;