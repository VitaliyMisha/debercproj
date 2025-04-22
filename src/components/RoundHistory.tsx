import React from 'react';

interface RoundHistoryProps {
    rounds: { id: number; number: number; scores: Record<string, number | string> }[];
    players: { id: number; name: string }[];
}

const RoundHistory: React.FC<RoundHistoryProps> = ({ rounds, players }) => (
    <div className="bg-gray-50 p-4 rounded-lg shadow-md mt-6">
        <h2 className="font-semibold text-xl mb-4 text-center">Історія раундів</h2>
        <ul className="space-y-3">
            {rounds.map((r) => (
                <li key={r.id} className="flex items-center text-lg">
                    <span className="font-medium text-blue-600 mr-2">Раунд {r.number}:</span>
                    <div className="flex flex-wrap gap-2">
                        {players.map((p, i) => (
                            <span
                                key={p.id}
                                className="text-gray-800 bg-gray-200 px-3 py-1 rounded-md"
                            >
                                {p.name}: {r.scores[p.id]}
                                {i !== players.length - 1 && ','}
                            </span>
                        ))}
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

export default RoundHistory;
