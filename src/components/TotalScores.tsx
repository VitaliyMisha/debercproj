import React from 'react';

interface TotalScoresProps {
    players: { id: number; name: string }[];
    totals: Record<string, number>;
}

const TotalScores: React.FC<TotalScoresProps> = ({ players, totals }) => (
    <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Загалом</h2>
        <div className="flex flex-col items-center">
            {players.map((p) => (
                <div key={p.id} className="flex justify-between items-center mb-2 p-2 border-b w-full max-w-md">
                    <span className="font-semibold">{p.name}:</span>
                    <span className="font-bold text-lg">{totals[p.id]}</span>
                </div>
            ))}
        </div>
    </div>
);

export default TotalScores;
