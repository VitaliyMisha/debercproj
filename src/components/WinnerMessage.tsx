import React from 'react';

interface WinnerMessageProps {
    winnerName: string;
    onNewGame: () => void;
    onContinue: () => void;
}

const WinnerMessage: React.FC<WinnerMessageProps> = ({ winnerName, onNewGame, onContinue }) => (
    <div className="relative overflow-hidden bg-linear-to-br from-yellow-100 via-orange-50 to-pink-100 rounded-2xl shadow-2xl border border-yellow-200">
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 text-6xl animate-bounce">🎉</div>
            <div className="absolute top-4 right-4 text-6xl animate-bounce" style={{ animationDelay: '0.5s' }}>🎊</div>
            <div className="absolute bottom-4 left-4 text-6xl animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
            <div className="absolute bottom-4 right-4 text-6xl animate-bounce" style={{ animationDelay: '1.5s' }}>🏆</div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center p-8">
            <div className="mb-6 text-8xl animate-pulse">
                🏆
            </div>
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-600 to-orange-600 mb-2">
                    ПЕРЕМОЖЕЦЬ!
                </h1>
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-yellow-300">
                    <p className="text-lg text-gray-600 mb-2">Вітаємо гравця</p>
                    <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-green-600 to-blue-600">
                        {winnerName}
                    </h2>
                </div>
            </div>
            <div className="mb-8 text-center">
                <p className="text-lg text-gray-700 font-medium">
                    🎯 Чудова гра! 🎯
                </p>
                <p className="text-sm text-gray-600 mt-1">
                    Що будемо робити далі?
                </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button
                    onClick={onNewGame}
                    className="flex-1 px-6 py-4 bg-linear-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl
                             hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105
                             shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="text-xl">🎮</span>
                    Нова гра
                </button>

                <button
                    onClick={onContinue}
                    className="flex-1 px-6 py-4 bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl
                             hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105
                             shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="text-xl">▶️</span>
                    Продовжити
                </button>
            </div>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
            </div>
        </div>
    </div>
);

export default WinnerMessage;