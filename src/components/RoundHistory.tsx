import React, {useState} from 'react';
import {Player, Round} from '../types';

interface RoundHistoryProps {
    rounds: Round[];
    players: Player[];
    onUpdateRound: (roundNumber: number, newScores: Record<string, string>) => void;
}

const RoundHistory: React.FC<RoundHistoryProps> = ({rounds, players, onUpdateRound}) => {
    const [editingRound, setEditingRound] = useState<number | null>(null);
    const [editScores, setEditScores] = useState<Record<string, string>>({});

    const startEditing = (r: Round) => {
        setEditingRound(r.number);
        // prefill with existing scores as strings
        const initial: Record<string, string> = {};
        players.forEach(p => {
            initial[p.id] = String(r.scores[p.id] ?? '');
        });
        setEditScores(initial);
    };

    const saveEdit = () => {
        if (editingRound != null) {
            onUpdateRound(editingRound, editScores);
            setEditingRound(null);
        }
    };

    const cancelEdit = () => {
        setEditingRound(null);
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-2 text-center">Історія раундів</h2>
            <ul>
                {rounds.map(r => (
                    <li key={r.number} className="mb-4 p-3 border rounded-sm text-center">
                        {editingRound === r.number ? (
                            <>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {players.map(p => (
                                        <input
                                            key={p.id}
                                            type="text"
                                            className="p-2 border rounded-sm"
                                            value={editScores[p.id] || ''}
                                            onChange={e => setEditScores({...editScores, [p.id]: e.target.value})}
                                        />
                                    ))}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className="px-4 py-1 bg-green-500 text-white rounded-sm"
                                        onClick={saveEdit}
                                    >Зберегти
                                    </button>
                                    <button
                                        className="px-4 py-1 bg-gray-300 text-gray-700 rounded-sm"
                                        onClick={cancelEdit}
                                    >Відмінити
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="mb-2">
                                    <strong>Раунд {r.number}:</strong>{' '}
                                    <div>
                                        {players.map((p, i) => (
                                            <span key={p.id}>{p.name} = {r.scores[p.id]}
                                                {i < players.length - 1 && ', '}</span>))}
                                    </div>
                                </div>
                                <button
                                    className="text-blue-500 text-sm"
                                    onClick={() => startEditing(r)}
                                >Редагувати
                                </button>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RoundHistory;
