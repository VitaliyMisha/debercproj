import React from 'react';

interface TotalScoresProps {
    players: { id: number; name: string }[];
    totals: Record<string, number>;
}

const formatScore = (score: number): string => {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const getScoreColor = (score: number): string => {
    if (score < 0) return 'text-red-600';
    if (score >= 400) return 'text-green-600';
    return 'text-gray-800';
};

const TotalScores: React.FC<TotalScoresProps> = ({ players, totals }) => {
    const sortedPlayers = [...players].sort((a, b) => (totals[b.id] || 0) - (totals[a.id] || 0));
    const maxScore = Math.max(...players.map(p => totals[p.id] || 0));
    const minScore = Math.min(...players.map(p => totals[p.id] || 0));

    const hasRealLeader = maxScore > minScore;

    const getGridCols = (playerCount: number) => {
        if (playerCount === 1) return 'grid-cols-1';
        if (playerCount === 2) return 'grid-cols-2';
        if (playerCount === 3) return 'grid-cols-3';
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    };

    return (
        <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Загалом</h2>

            {/* Мобільна версія - вертикальний стек */}
            <div className="block sm:hidden space-y-3">
                {sortedPlayers.map((player, index) => (
                    <div
                        key={player.id}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                            totals[player.id] === maxScore && hasRealLeader
                                ? 'bg-yellow-50 border-yellow-300 shadow-md'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                {index === 0 && hasRealLeader && (
                                    <span className="text-yellow-500 text-lg">👑</span>
                                )}
                                <span className="font-semibold text-lg">{player.name}</span>
                            </div>
                            <span className={`font-bold text-2xl ${getScoreColor(totals[player.id] || 0)}`}>
                                {formatScore(totals[player.id] || 0)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="hidden sm:block">
                <div className={`grid ${getGridCols(sortedPlayers.length)} gap-4 justify-items-center max-w-4xl mx-auto`}>
                    {sortedPlayers.map((player, index) => (
                        <div
                            key={player.id}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-lg w-full max-w-xs ${
                                totals[player.id] === maxScore && hasRealLeader
                                    ? 'bg-yellow-50 border-yellow-300 shadow-md transform scale-105'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <div className="text-center">
                                {index === 0 && hasRealLeader && (
                                    <div className="text-yellow-500 text-2xl mb-1">👑</div>
                                )}
                                <div className="font-semibold text-lg mb-2 text-gray-700">
                                    {player.name}
                                </div>
                                <div className={`font-bold text-2xl ${getScoreColor(totals[player.id] || 0)}`}>
                                    {formatScore(totals[player.id] || 0)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {players.length > 0 && hasRealLeader && (
                <div className="mt-4 text-sm text-gray-500">
                    <p>Лідер: {sortedPlayers[0]?.name} з {formatScore(totals[sortedPlayers[0]?.id] || 0)} очками</p>
                </div>
            )}
        </div>
    );
};

export default TotalScores;