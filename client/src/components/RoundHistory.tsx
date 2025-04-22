import React from 'react';

interface Player {
    id: number;
    name: string;
}

interface Round {
    id: number;
    number: number;
    scores: Record<string, number | string>;
}

interface Props {
    rounds: Round[];
    players: Player[];
}

export default function RoundHistory({ rounds, players }: Props) {
    return (
        <ul className="list-disc pl-5">
            {rounds.map(r => (
                <li key={r.id} className="mb-1">
                    Раунд {r.number}:{' '}
                    {players.map((p, i) => (
                        <span key={p.id}>
              {p.name} {r.scores[p.id]}
                            {i !== players.length - 1 && ', '}
            </span>
                    ))}
                </li>
            ))}
        </ul>
    );
}
