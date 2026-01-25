import React, {ChangeEvent} from 'react';
import {Player} from "../types";
import {Star} from "lucide-react";
import { GameRulesConfig } from './GameRules';

interface RoundFormProps {
    players: Player[];
    scores: Record<string, string | number>;
    onScoreChange: (e: ChangeEvent<HTMLInputElement>, id: number) => void;
    onAddRound: () => void;
    roundNumber: number;
    isAddDisabled: boolean;
    gameRules?: GameRulesConfig;
}

const RoundForm: React.FC<RoundFormProps> = ({
                                                 players,
                                                 scores,
                                                 onScoreChange,
                                                 onAddRound,
                                                 roundNumber,
                                                 isAddDisabled,
                                                 gameRules
                                             }) => {
    const placeholder = gameRules?.allowVis !== false ? "0, Б, ХВ, ВІС" : "0, Б, ХВ";

    return (
        <div className="mb-4 sm:mb-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-linear-to-r from-blue-500 to-purple-600 px-4 sm:px-6 py-3 sm:py-4">
                <h2 className="text-lg sm:text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 bg-white/20 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold">
                        {roundNumber}
                    </div>
                    Раунд
                    <Star className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-400"/>
                </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {players.map((p) => (
                    <div
                        key={p.id}
                        className="group relative bg-gray-50 hover:bg-blue-50 rounded-lg p-3 sm:p-4 transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="shrink-0 w-8 sm:w-10 h-8 sm:h-10 bg-linear-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                <span className="text-sm sm:text-lg">
                                    {(() => {
                                        const chars = Array.from(p.name);
                                        return chars[0]?.toUpperCase() || '';
                                    })()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                    {p.name}
                                </span>
                            </div>
                            <div className="shrink-0 w-24 sm:w-28">
                                <input
                                    type="text"
                                    value={scores[p.id] || ''}
                                    onChange={(e) => onScoreChange(e, p.id)}
                                    className="w-full p-2 sm:p-3 text-center text-base sm:text-lg font-semibold border-2 border-gray-200 rounded-lg
                                             focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                                             transition-all duration-200 bg-white hover:border-gray-300
                                             placeholder-gray-400"
                                    placeholder={placeholder}
                                    maxLength={4}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <button
                    onClick={onAddRound}
                    disabled={isAddDisabled}
                    className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 transform
                              ${isAddDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-linear-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]'
                    }`}
                >
                    {isAddDisabled ? '⏳ Заповніть всі поля' : '✅ Додати раунд'}
                </button>
            </div>
        </div>
    );
};

export default RoundForm;