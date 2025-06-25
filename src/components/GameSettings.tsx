import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { GameRulesConfig } from './GameRules';

interface GameSettingsProps {
    playerCount: number;
    setPlayerCount: (count: number) => void;
    targetScore: number;
    setTargetScore: (score: number) => void;
    gameRules?: GameRulesConfig;
}

const GameSettings: React.FC<GameSettingsProps> = ({
                                                       playerCount,
                                                       setPlayerCount,
                                                       targetScore,
                                                       setTargetScore,
                                                       gameRules
                                                   }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const targetScoreOptions = gameRules?.customTargetScore && gameRules.targetScoreOptions.length > 0
        ? gameRules.targetScoreOptions
        : [510, 1020];

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Заголовок з кнопкою згортання/розгортання */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-200"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                        <span className="text-2xl">⚙️</span>
                        Налаштування гри
                    </h3>
                    <div className="flex items-center space-x-3">
                        {/* Показуємо поточні налаштування, коли згорнуто */}
                        {!isExpanded && (
                            <span className="text-sm text-white/90 font-medium">
                                {playerCount} гравців • {targetScore} очок
                            </span>
                        )}
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-white" />
                        )}
                    </div>
                </div>
            </button>

            {/* Згортуваний контент */}
            <div className={`transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
            } overflow-hidden`}>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">👥</span>
                                <label className="text-lg font-semibold text-gray-800">
                                    Кількість гравців
                                </label>
                            </div>

                            <div className="relative">
                                <select
                                    className="w-full p-4 text-lg font-semibold bg-gray-50 border-2 border-gray-200 rounded-lg
                                             focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100
                                             hover:border-gray-300 transition-all duration-200 cursor-pointer
                                             appearance-none"
                                    value={playerCount}
                                    onChange={(e) => setPlayerCount(Number(e.target.value))}
                                >
                                    {[2, 3, 4].map((n) => (
                                        <option key={n} value={n}>
                                            {n} {'гравців'}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <p className="text-sm text-blue-700 flex items-center gap-2">
                                    <span className="text-base">ℹ️</span>
                                    {playerCount === 2 && "Класична гра для двох"}
                                    {playerCount === 3 && "Компанія з трьох друзів"}
                                    {playerCount === 4 && "Повна команда з чотирьох"}
                                </p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🎯</span>
                                <label className="text-lg font-semibold text-gray-800">
                                    Рахунок для перемоги
                                </label>
                            </div>

                            <div className="relative">
                                <select
                                    className="w-full p-4 text-lg font-semibold bg-gray-50 border-2 border-gray-200 rounded-lg
                                             focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100
                                             hover:border-gray-300 transition-all duration-200 cursor-pointer
                                             appearance-none"
                                    value={targetScore}
                                    onChange={(e) => setTargetScore(Number(e.target.value))}
                                >
                                    {targetScoreOptions.map((score) => (
                                        <option key={score} value={score}>
                                            {score} очків
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-sm text-green-700 flex items-center gap-2">
                                    <span className="text-base">⏱️</span>
                                    {targetScore === 510 && "Швидка гра (~15-20 хвилин)"}
                                    {targetScore === 1020 && "Довга гра (~30-40 хвилин)"}
                                    {!targetScoreOptions.includes(targetScore) && "Користувацький рахунок"}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 border border-gray-200">
                        <div className="text-center">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Готові до гри?</h4>
                            <p className="text-gray-600">
                                <span className="font-semibold text-indigo-600">{playerCount} гравців</span>
                                {' '} грають до {' '}
                                <span className="font-semibold text-purple-600">{targetScore} очків</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameSettings;