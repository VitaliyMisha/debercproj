import React, { useEffect, useState } from 'react';

interface Suit {
  char: string;
  x: number;
  delay: number;
  duration: number;
  red: boolean;
}

const SUITS = ['♠', '♥', '♦', '♣'];

export const CardSuitsRain: React.FC = () => {
  const [visible, setVisible] = useState(true);

  const suits: Suit[] = Array.from({ length: 20 }, (_, i) => ({
    char: SUITS[i % 4],
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 1.5,
    red: i % 4 === 1 || i % 4 === 2,
  }));

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {suits.map((s, i) => (
        <span
          key={i}
          className={`absolute text-3xl select-none ${s.red ? 'text-red-500' : 'text-white'}`}
          style={{
            left: `${s.x}%`,
            top: '-2rem',
            animationName: 'cardSuitsRain',
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            animationTimingFunction: 'linear',
            animationFillMode: 'both',
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
};

export default CardSuitsRain;
