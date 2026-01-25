import React from 'react';

interface HeaderProps {
    gameId: number;
    targetScore: number;
    dealerName?: string;
    onNewGame?: () => void;
}

const Header: React.FC<HeaderProps> = ({ gameId, targetScore, dealerName, onNewGame }) => (
    <div className="bg-linear-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-lg shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-70">
            <div className="absolute top-2 left-2 text-5xl text-gray-900 drop-shadow-lg">♠</div>
            <div className="absolute top-2 right-2 text-5xl text-red-800 drop-shadow-lg">♥</div>
            <div className="absolute bottom-2 left-2 text-5xl text-gray-900 drop-shadow-lg">♣</div>
            <div className="absolute bottom-2 right-2 text-5xl text-red-800 drop-shadow-lg">♦</div>
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
                        <div className="w-12 h-12 bg-linear-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-2xl">🃏</span>
                        </div>
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-medium opacity-90">Дилер цього раунду</div>
                        <div className="text-lg font-bold text-center">{dealerName}</div>
                    </div>
                </div>
            )}
            {onNewGame && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={onNewGame}
                        className="px-6 py-4 bg-linear-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl
                                 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105
                                 shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">🎮</span>
                        Нова гра
                    </button>
                </div>
            )}
        </div>
    </div>
);

export default Header;