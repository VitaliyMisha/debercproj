import React, {ChangeEvent} from 'react';
import {Player} from "../types";

interface RoundFormProps {
    players: Player[];
    scores: Record<string, string | number>;
    onScoreChange: (e: ChangeEvent<HTMLInputElement>, id: number) => void;
    onAddRound: () => void;
    roundNumber: number;
    isAddDisabled: boolean;
}

const RoundForm: React.FC<RoundFormProps> = ({
                                                 players,
                                                 scores,
                                                 onScoreChange,
                                                 onAddRound,
                                                 roundNumber,
                                                 isAddDisabled
                                             }) => (
    <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white text-center flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">
                    {roundNumber}
                </div>
                Раунд
            </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
            {players.map((p) => (
                <div
                    key={p.id}
                    className="group relative bg-gray-50 hover:bg-blue-50 rounded-lg p-4 transition-all duration-200 hover:shadow-md border border-transparent hover:border-blue-200"
                >
                    <div className="flex items-center gap-4">
                        {/* Player Avatar/Number */}
                        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                            {p.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Player Name */}
                        <div className="flex-1 min-w-0">
                            <span className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                {p.name}
                            </span>
                        </div>

                        {/* Score Input */}
                        <div className="flex-shrink-0 w-28">
                            <input
                                type="text"
                                value={scores[p.id] || ''}
                                onChange={(e) => onScoreChange(e, p.id)}
                                className="w-full p-3 text-center text-lg font-semibold border-2 border-gray-200 rounded-lg
                                         focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                                         transition-all duration-200 bg-white hover:border-gray-300
                                         placeholder-gray-400"
                                placeholder="0"
                                maxLength={4}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Footer with Add Button */}
        <div className="px-6 pb-6">
            <button
                onClick={onAddRound}
                disabled={isAddDisabled}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 transform
                          ${isAddDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 hover:scale-[1.02] shadow-lg hover:shadow-xl active:scale-[0.98]'
                }`}
            >
                {isAddDisabled ? '⏳ Заповніть всі поля' : '✅ Додати раунд'}
            </button>
        </div>
    </div>
);

export default RoundForm;