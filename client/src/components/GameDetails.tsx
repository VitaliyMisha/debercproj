import { useEffect, useState } from 'react';
import axios from 'axios';

const GameDetails = ({ gameId }: { gameId: number }) => {
    const [game, setGame] = useState<any>(null);

    useEffect(() => {
        const fetchGame = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/game/${gameId}`);
                setGame(response.data);
            } catch (error) {
                console.error('Error fetching game details', error);
            }
        };

        fetchGame();
    }, [gameId]);

    if (!game) {
        return <div>Загрузка игры...</div>;
    }

    return (
        <div>
            <h2>Игроки:</h2>
            <ul>
                {game.players.map((player: any) => (
                    <li key={player.id}>{player.name}</li>
                ))}
            </ul>

            <h2>Раунды:</h2>
            <ul>
                {game.rounds.map((round: any) => (
                    <li key={round.id}>
                        Раунд {round.number}: {JSON.stringify(JSON.parse(round.scores))}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default GameDetails;
