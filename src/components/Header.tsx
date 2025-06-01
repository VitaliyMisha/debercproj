import React from 'react';

interface HeaderProps {
    gameId: number;
    targetScore: number;
    dealerName?: string;
}

const Header: React.FC<HeaderProps> = ({ gameId, targetScore, dealerName }) => (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg text-center relative overflow-hidden">
        {/* Декоративні елементи фону */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-4 text-6xl">♠</div>
            <div className="absolute top-4 right-4 text-6xl">♥</div>
            <div className="absolute bottom-4 left-4 text-6xl">♣</div>
            <div className="absolute bottom-4 right-4 text-6xl">♦</div>
        </div>

        <div className="relative z-10">
            <h1 className="text-3xl font-semibold">
                Гра #{gameId}
            </h1>
            <p className="mt-2 text-xl">
                Ціль: <span className="font-bold">{targetScore}</span> очків
            </p>

            {dealerName && (
                <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 inline-flex items-center space-x-3 border border-white/30 hover:bg-white/30 transition-all duration-300">
                    <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl">🃏</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-medium opacity-90">Дилер цього раунду</div>
                        <div className="text-lg font-bold">{dealerName}</div>
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default Header;