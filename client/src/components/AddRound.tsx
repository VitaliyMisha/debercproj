import { useState } from 'react';
import axios from 'axios';

const AddRound = ({ gameId }: { gameId: number }) => {
    const [scores, setScores] = useState<{ [key: string]: number }>({});
    const [roundNumber, setRoundNumber] = useState(1);

    const handleAddRound = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/round`, {
                gameId,
                scores,
                number: roundNumber,
            });
            alert(`Раунд ${roundNumber} добавлен!`);
        } catch (error) {
            console.error('Error adding round', error);
        }
    };

    return (
        <div>
            <h2>Добавить раунд</h2>
            <input
                type="number"
                value={roundNumber}
                onChange={(e) => setRoundNumber(Number(e.target.value))}
                placeholder="Номер раунда"
            />
            {/* Введите очки для каждого игрока */}
            <input
                type="number"
                value={scores[1] || ''}
                onChange={(e) => setScores({ ...scores, 1: Number(e.target.value) })}
                placeholder="Очки Игрока 1"
            />
            <input
                type="number"
                value={scores[2] || ''}
                onChange={(e) => setScores({ ...scores, 2: Number(e.target.value) })}
                placeholder="Очки Игрока 2"
            />
            <button onClick={handleAddRound}>Добавить раунд</button>
        </div>
    );
};

export default AddRound;
