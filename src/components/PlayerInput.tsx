// src/components/PlayerInput.tsx
import React from 'react';

interface PlayerInputProps {
    idx: number;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>, idx: number) => void;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ idx, name, onChange }) => (
    <div className="mb-4">
        <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={`Імя гравця ${idx + 1}`}
            value={name}
            onChange={(e) => onChange(e, idx)}
        />
    </div>
);

export default PlayerInput;
