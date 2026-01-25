import React, { useState } from 'react';
import { Player, Round } from '../types';
import { GameRulesConfig } from './GameRules';
import { isValidScore } from '../utils/gameHelpers';

interface RoundHistoryProps {
    rounds: Round[];
    players: Player[];
    onUpdateRound: (roundNumber: number, newScores: Record<string, string>) => void;
    gameRules?: GameRulesConfig;
}

const RoundHistory: React.FC<RoundHistoryProps> = ({ rounds, players, onUpdateRound, gameRules }) => {
    const [editingRound, setEditingRound] = useState<number | null>(null);
    const [editScores, setEditScores] = useState<Record<string, string>>({});
    const [collapsedRounds, setCollapsedRounds] = useState<Set<number>>(new Set());
    const [allCollapsed, setAllCollapsed] = useState<boolean>(false);

    const startEditing = (round: Round) => {
        setEditingRound(round.number);
        const initialScores: Record<string, string> = {};
        players.forEach(player => {
            const currentScore = round.scores[player.id];
            initialScores[String(player.id)] = currentScore !== undefined ? String(currentScore) : '';
        });
        setEditScores(initialScores);
    };

    const saveEdit = () => {
        if (editingRound !== null) {
            onUpdateRound(editingRound, editScores);
            setEditingRound(null);
            setEditScores({});
        }
    };

    const cancelEdit = () => {
        setEditingRound(null);
        setEditScores({});
    };

    const handleScoreChange = (playerId: string | number, value: string) => {
        setEditScores(prev => ({
            ...prev,
            [String(playerId)]: value
        }));
    };

    const toggleRoundCollapse = (roundNumber: number) => {
        setCollapsedRounds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(roundNumber)) {
                newSet.delete(roundNumber);
            } else {
                newSet.add(roundNumber);
            }
            return newSet;
        });
    };

    const toggleAllRounds = () => {
        if (allCollapsed) {
            setCollapsedRounds(new Set());
            setAllCollapsed(false);
        } else {
            setCollapsedRounds(new Set(rounds.map(round => round.number)));
            setAllCollapsed(true);
        }
    };

    const validateScore = (value: string): boolean => {
        return isValidScore(value, gameRules);
    };

    const calculateRoundTotal = (scores: Record<string | number, string | number | undefined>): number => {
        return Object.values(scores).reduce((sum: number, score) => {
            if (score === undefined || score === null || score === '') {
                return sum;
            }
            const numericScore = typeof score === 'number' ? score : Number(score);
            return sum + (isNaN(numericScore) ? 0 : numericScore);
        }, 0);
    };

    const placeholder = gameRules?.allowVis !== false ? "0, Б, ХВ або ВІС" : "0, Б або ХВ";

    if (rounds.length === 0) {
        return (
            <div className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg border border-gray-100">
                <div className="absolute top-0 left-0 w-32 h-32 bg-linear-to-br from-blue-200/30 to-transparent rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-linear-to-tl from-purple-200/30 to-transparent rounded-full translate-x-12 translate-y-12"></div>

                <div className="relative z-10 p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4 text-center">
                        Історія раундів
                    </h2>
                    <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
                        Поки що немає завершених раундів
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden bg-linear-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg border border-gray-100">
            <div className="absolute top-0 left-0 w-40 h-40 bg-linear-to-br from-blue-200/20 to-transparent rounded-full -translate-x-20 -translate-y-20"></div>
            <div className="absolute top-1/4 right-0 w-32 h-32 bg-linear-to-bl from-purple-200/20 to-transparent rounded-full translate-x-16"></div>
            <div className="absolute bottom-0 left-1/3 w-28 h-28 bg-linear-to-tr from-indigo-200/20 to-transparent rounded-full translate-y-14"></div>

            <div className="relative z-10 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl font-semibold bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                        Історія раундів
                    </h2>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        <span className="text-xs sm:text-sm text-gray-600 bg-white/60 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-gray-200">
                            Всього: {rounds.length}
                        </span>
                        <button
                            onClick={toggleAllRounds}
                            className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-blue-600 bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        >
                            {allCollapsed ? 'Розгорнути всі' : 'Згорнути всі'}
                        </button>
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {rounds
                        .sort((a, b) => b.number - a.number)
                        .map(round => {
                            const isCollapsed = collapsedRounds.has(round.number);
                            const isEditing = editingRound === round.number;

                            return (
                                <div
                                    key={round.number}
                                    className="relative bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl overflow-hidden hover:shadow-lg hover:bg-white/90 transition-all duration-300"
                                >
                                    {/* Заголовок раунду */}
                                    <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200/50">
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <button
                                                onClick={() => toggleRoundCollapse(round.number)}
                                                disabled={isEditing}
                                                className="flex items-center justify-center w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-linear-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <svg
                                                    className={`w-3 sm:w-4 h-3 sm:h-4 text-gray-600 transition-transform duration-200 ${
                                                        isCollapsed ? 'transform rotate-90' : ''
                                                    }`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 9l-7 7-7-7"
                                                    />
                                                </svg>
                                            </button>
                                            <h3 className="text-base sm:text-lg font-medium bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                                Раунд {round.number}
                                            </h3>
                                        </div>

                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            {isCollapsed && !isEditing && (
                                                <div className="text-xs sm:text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-gray-200/50">
                                                    Сума: <span className="font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                                        {calculateRoundTotal(round.scores)}
                                                    </span>
                                                </div>
                                            )}
                                            {!isCollapsed && !isEditing && (
                                                <button
                                                    onClick={() => startEditing(round)}
                                                    className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-blue-600 bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                                                >
                                                    Редагувати
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Контент раунду */}
                                    <div className={`transition-all duration-300 ease-in-out ${
                                        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-250 opacity-100'
                                    } overflow-hidden`}>
                                        <div className="p-3 sm:p-4">
                                            {isEditing ? (
                                                <div className="space-y-3 sm:space-y-4">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                                        {players.map(player => (
                                                            <div key={player.id} className="space-y-1 sm:space-y-2">
                                                                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                                                    {player.name}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={editScores[String(player.id)] || ''}
                                                                    onChange={(e) => handleScoreChange(player.id, e.target.value)}
                                                                    className={`w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                                                                        validateScore(editScores[String(player.id)] || '')
                                                                            ? 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                                                            : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                                                    }`}
                                                                    placeholder={placeholder}
                                                                />
                                                                {!validateScore(editScores[String(player.id)] || '') && (
                                                                    <p className="text-xs sm:text-sm text-red-600">
                                                                        Введіть коректне число
                                                                    </p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="flex justify-end space-x-2 sm:space-x-3 pt-3 sm:pt-4 border-t">
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                                                        >
                                                            Відмінити
                                                        </button>
                                                        <button
                                                            onClick={saveEdit}
                                                            disabled={!Object.values(editScores).every(score => validateScore(score))}
                                                            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Зберегти
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2 sm:space-y-3">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                                                        {players.map(player => (
                                                            <div
                                                                key={player.id}
                                                                className="flex justify-between items-center p-2 sm:p-3 bg-linear-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200/50"
                                                            >
                                                                <span className="font-medium text-gray-700 text-sm sm:text-base">
                                                                    {player.name}
                                                                </span>
                                                                <span className="text-base sm:text-lg font-semibold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                                    {round.scores[player.id] ?? 0}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="pt-2 border-t border-gray-200/50">
                                                        <div className="text-xs sm:text-sm text-gray-600 text-right bg-white/50 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full border border-gray-200/50 w-fit ml-auto">
                                                            Загальна сума: <span className="font-semibold bg-linear-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                                                {calculateRoundTotal(round.scores)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default RoundHistory;