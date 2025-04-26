import React from 'react';

interface GameSettingsProps {
    playerCount: number;
    setPlayerCount: (count: number) => void;
    targetScore: number;
    setTargetScore: (score: number) => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({
                                                       playerCount,
                                                       setPlayerCount,
                                                       targetScore,
                                                       setTargetScore,
                                                   }) => (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <label className="flex-1 flex flex-col">
                <span className="text-gray-700 font-medium mb-1 text-center">Кількість гравців</span>
                <select
                    className="p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    value={playerCount}
                    onChange={(e) => setPlayerCount(Number(e.target.value))}
                >
                    {[2, 3, 4].map((n) => (
                        <option key={n} value={n} className="text-sm font-medium text-gray-500 text-center" >
                            {n}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex-1 flex flex-col">
                <span className="text-gray-700 font-medium mb-1 text-center">До скільки</span>
                <select
                    className="p-2 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                >
                    {[510, 1020].map((score) => (
                        <option key={score} value={score} className={`text-sm font-medium text-gray-500 text-center`}>
                            {score} очків
                        </option>
                    ))}
                </select>
            </label>
        </div>
    </div>
);

export default GameSettings;
