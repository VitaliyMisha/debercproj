import React from 'react';

interface HeaderProps {
    gameId: number;
    targetScore: number;
}

const Header: React.FC<HeaderProps> = ({ gameId, targetScore }) => (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-semibold">
            Гра #{gameId}
        </h1>
        <p className="mt-2 text-xl text-center" >
            Ціль: <span className="font-bold">{targetScore}</span> очків
        </p>
    </div>
);

export default Header;
