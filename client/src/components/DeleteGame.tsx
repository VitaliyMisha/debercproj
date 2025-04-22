// src/components/DeleteGame.tsx
import axios from 'axios';

const DeleteGame = ({ gameId }: { gameId: number }) => {
    const handleDeleteGame = async () => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/game/${gameId}`);
            alert('Игра удалена');
        } catch (error) {
            console.error('Error deleting game', error);
        }
    };

    return (
        <div>
            <button onClick={handleDeleteGame}>Удалить игру</button>
        </div>
    );
};

export default DeleteGame;
