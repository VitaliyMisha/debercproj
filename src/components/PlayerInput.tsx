import React from 'react';

interface PlayerInputProps {
    idx: number;
    name: string;
    onChange: (value: string, idx: number) => void;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ idx, name, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const zaets = ['заєць', 'заєц', 'заец', 'заець', 'косой'];
        const baya = ['бая', 'кот'];
        const kiw = ['киш', 'кіш'];
        const sirko = ['сірко', 'сирко'];

        if (zaets.includes(value.trim().toLowerCase())) {
            value = `🐰${value}`;
        }
        if (baya.includes(value.trim().toLowerCase())) {
            value = `😸${value}`;
        }
        if (kiw.includes(value.trim().toLowerCase())) {
            value = `🥷${value}`;
        }
        if (sirko.includes(value.trim().toLowerCase())) {
            value = `🐶${value}`;
        }
        onChange(value, idx);
    };

    const handleClear = () => {
        onChange('', idx);
    };

    return (
        <div className="relative mb-6 group">
            <div className="absolute -left-2 -top-2 z-10 w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {idx + 1}
            </div>
            <div className="relative">
                <input
                    type="text"
                    className="w-full pl-6 pr-12 py-4 text-lg font-medium bg-white border-2 border-gray-200 rounded-xl
                             focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100
                             hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md
                             placeholder-gray-400"
                    placeholder={`Гравець ${idx + 1}`}
                    value={name}
                    onChange={handleChange}
                    maxLength={15}
                />
                {name && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-3 flex items-center justify-center w-8 h-8
                                 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full
                                 transition-all duration-200 hover:scale-110"
                        title="Очистити поле"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
                <div className="absolute -bottom-6 right-0 text-xs text-gray-400">
                    {name.length}/15
                </div>
            </div>
        </div>
    );
};

export default PlayerInput;