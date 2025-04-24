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

    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mt-4">
            <h3 className="text-lg font-semibold mb-4 text-center">Історія ігор</h3>
            <div className="flex justify-center gap-4">
                {players.map(player => (
                    <div
                        key={player.id}
                        className={`p-4 rounded-lg text-center w-40 ${
                            player.winCount === maxWins && maxWins > 0
                                ? 'bg-green-200 font-bold border-2 border-green-400'
                                : 'bg-yellow-200'
                        }`}
                    >
                        <p className="text-gray-800">{player.name}</p>
                        <p className="text-sm">
                            {player.winCount} {getVictoryLabel(player.winCount)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameHistory;
