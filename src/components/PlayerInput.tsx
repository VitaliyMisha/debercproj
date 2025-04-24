import React from 'react';

interface PlayerInputProps {
    idx: number;
    name: string;
    onChange: (value: string, idx: number) => void; // змінено тип
}

const PlayerInput: React.FC<PlayerInputProps> = ({idx, name, onChange}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const zaets = ['заєць', 'заєц', 'заец', 'заець', 'косой']
        const baya = ['бая', 'кот']
        const kiw = ['киш', 'кіш']
        if (zaets.includes(value.trim().toLowerCase())) {
            value = '🐰 Заєць';
        }
        if (baya.includes(value.trim().toLowerCase())) {
            value = '😸 Бая';
        }
        if (kiw.includes(value.trim().toLowerCase())) {
            value = `🥷${value}`;
        }
        onChange(value, idx);
    };

    return (
        <div className="mb-4">
            <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Ім'я гравця ${idx + 1}`}
                value={name}
                onChange={handleChange}
            />
        </div>
    );
};

export default PlayerInput;
