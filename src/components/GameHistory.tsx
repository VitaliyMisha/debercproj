import React from 'react';
import { Player } from '../types';

interface GameHistoryProps {
    players: Player[];
}

const getVictoryLabel = (count: number): string => {
    if (count === 1) return 'перемога';
    if (count >= 2 && count <= 4) return 'перемоги';
    return 'перемог';
};

const GameHistory: React.FC<GameHistoryProps> = ({ players }) => {
    if (players.length === 0) return null;

    const maxWins = Math.max(...players.map(p => p.winCount));
    const hasWins = maxWins > 0;

    return (
        <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-6 rounded-xl shadow-lg mt-6 border border-gray-200">
            <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-full mr-3 shadow-md">
                    <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">Історія ігор</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
                {players.map((player, index) => {
                    const championsCount = players.filter(p => p.winCount === maxWins).length;
                    const isChampion = hasWins && player.winCount === maxWins && championsCount === 1;
                    const isTied = hasWins && player.winCount === maxWins && championsCount > 1;
                    const hasNoWins = player.winCount === 0;

                    return (
                        <div
                            key={player.id}
                            className={`relative p-5 rounded-xl text-center w-full max-w-48 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                                isChampion
                                    ? 'bg-gradient-to-br from-yellow-100 to-amber-200 border-2 border-yellow-400 shadow-lg'
                                    : isTied
                                        ? 'bg-gradient-to-br from-orange-100 to-yellow-200 border-2 border-orange-400 shadow-lg'
                                        : hasNoWins
                                            ? 'bg-gradient-to-br from-gray-100 to-slate-200 border-2 border-gray-300'
                                            : 'bg-gradient-to-br from-blue-100 to-indigo-200 border-2 border-blue-300'
                            }`}
                        >
                            {isChampion && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-yellow-400 p-2 rounded-full shadow-md border-2 border-yellow-500">
                                        <span className="text-lg">👑</span>
                                    </div>
                                </div>
                            )}
                            {isTied && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-orange-400 p-2 rounded-full shadow-md border-2 border-orange-500">
                                        <span className="text-lg">🤝</span>
                                    </div>
                                </div>
                            )}
                            {hasWins && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-800 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                                    {isTied ? '=' : `#${index + 1}`}
                                </div>
                            )}

                            {/* Аватар гравця */}
                            <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold shadow-md ${
                                isChampion
                                    ? 'bg-gradient-to-br from-yellow-300 to-amber-400 text-yellow-800'
                                    : isTied
                                        ? 'bg-gradient-to-br from-orange-300 to-yellow-400 text-orange-800'
                                        : hasNoWins
                                            ? 'bg-gradient-to-br from-gray-300 to-slate-400 text-gray-600'
                                            : 'bg-gradient-to-br from-blue-300 to-indigo-400 text-blue-800'
                            }`}>
                                {(() => {
                                    const chars = Array.from(player.name);
                                    return chars[0]?.toUpperCase() || '';
                                })()}
                            </div>
                            <h4 className={`font-bold text-lg mb-2 ${
                                isChampion ? 'text-yellow-800' : isTied ? 'text-orange-800' : 'text-gray-800'
                            }`}>
                                {player.name}
                            </h4>
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                                isChampion
                                    ? 'bg-yellow-300 text-yellow-800'
                                    : isTied
                                        ? 'bg-orange-300 text-orange-800'
                                        : hasNoWins
                                            ? 'bg-gray-300 text-gray-600'
                                            : 'bg-blue-300 text-blue-800'
                            }`}>
                            <span className="mr-1">
                                {hasNoWins ? '💤' : isTied ? '🤝' : isChampion ? '🏆' : '🎯'}
                            </span>
                                {player.winCount} {getVictoryLabel(player.winCount)}
                            </div>
                            {hasWins && (
                                <div className="mt-3">
                                    <div className="w-full bg-gray-300 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                isChampion
                                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                                                    : isTied
                                                        ? 'bg-gradient-to-r from-orange-400 to-yellow-500'
                                                        : 'bg-gradient-to-r from-blue-400 to-indigo-500'
                                            }`}
                                            style={{
                                                width: `${(player.winCount / maxWins) * 100}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {hasWins && (
                <div className="mt-6 text-center text-sm text-gray-600 bg-white/50 rounded-lg p-3">
                    <p>
                        Всього зіграно ігор: <span className="font-semibold">{players.reduce((sum, p) => sum + p.winCount, 0)}</span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default GameHistory;