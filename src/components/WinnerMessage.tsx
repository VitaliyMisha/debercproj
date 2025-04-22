import React from 'react';

interface WinnerMessageProps {
    winnerName: string;
    onNewGame: () => void;
}

const WinnerMessage: React.FC<WinnerMessageProps> = ({ winnerName, onNewGame }) => (
    <div className="flex flex-col items-center justify-center text-center p-6 bg-green-100 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-green-600">
            Виграв гравець <span className="font-extrabold text-green-800">{winnerName}</span>!
        </h2>
        <button
            onClick={onNewGame}
            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-300"
        >
            Почати нову гру!
        </button>
    </div>
);

export default WinnerMessage;
