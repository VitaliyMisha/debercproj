import React from 'react';

interface HeaderProps {
    gameId: number;
    targetScore: number;
    dealerName?: string;
}

const Header: React.FC<HeaderProps> = ({ gameId, targetScore, dealerName }) => (
    <div className="bg-linear-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-semibold">
            Гра #{gameId}
        </h1>
        <p className="mt-2 text-xl">
            Ціль: <span className="font-bold">{targetScore}</span> очків
        </p>
        {dealerName && (
            <p className="mt-4 text-lg flex items-center justify-center">
                <span className="text-5xl mr-2">🃏</span>
                <span>Роздає: <span className="font-semibold">{dealerName}</span></span>
            </p>
        )}
    </div>
);

export default Header;
