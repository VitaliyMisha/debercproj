import React from 'react';

interface RoundFormProps {
    players: { id: number; name: string }[];
    scores: Record<string, number | string>;
    onScoreChange: (e: React.ChangeEvent<HTMLInputElement>, playerId: number) => void;
    onAddRound: () => void;
    roundNumber: number; // Получаем номер раунда как пропс
}

const RoundForm: React.FC<RoundFormProps> = ({ players, scores, onScoreChange, onAddRound, roundNumber }) => (
    <div className="mb-6">
        <h2 className="font-semibold text-center mb-4">Раунд {roundNumber}</h2> {/* Используем номер раунда */}
        {players.map((p) => (
            <div key={p.id} className="flex items-center mb-4">
                <span className="w-32 text-lg font-medium">{p.name}</span>
                <input
                    type="text"
                    value={scores[p.id] || ''}
                    onChange={(e) => onScoreChange(e, p.id)}
                    className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введіть рахунок"
                />
            </div>
        ))}
        <div className="flex justify-center mt-4">
            <button
                onClick={onAddRound}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                Додати раунд
            </button>
        </div>
    </div>
);

export default RoundForm;
