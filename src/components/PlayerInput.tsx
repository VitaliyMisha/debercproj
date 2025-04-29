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
        if (zaets.includes(value.trim().toLowerCase())) {
            value = `🐰${value}`;
        }
        if (baya.includes(value.trim().toLowerCase())) {
            value = `😸${value}`;
        }
        if (kiw.includes(value.trim().toLowerCase())) {
            value = `🥷${value}`;
        }
        onChange(value, idx);
    };

    const handleClear = () => {
        onChange('', idx); // Очищаємо поле
    };

    return (
        <div className="relative mb-4">
            <input
                type="text"
                className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                placeholder={`Ім'я гравця ${idx + 1}`}
                value={name}
                onChange={handleChange}
                maxLength={10}
            />
            {name && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                >
                    ✖️
                </button>
            )}
        </div>
    );
};

export default PlayerInput;
