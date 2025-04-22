import React from 'react';

interface Player {
    id: number;
    name: string;
}

interface Props {
    players: Player[];
    scores: Record<string, number | string>;
    setScores: (scores: Record<string, number | string>) => void;
}

export default function ScoreInput({ players, scores, setScores }: Props) {
    return (
        <>
            {players.map(p => (
                <div key={p.id} className="flex items-center mb-2">
                    <span className="w-24">{p.name}</span>
                    <input
                        type="text"
                        className="flex-1 p-2 border rounded"
                        value={scores[p.id] || ''}
                        onChange={e =>
                            setScores({ ...scores, [p.id]: e.target.value })
                        }
                    />
                </div>
            ))}
        </>
    );
}
