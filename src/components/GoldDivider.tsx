import type React from 'react';

export const GoldDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`h-px w-full ${className}`}
    style={{ background: 'linear-gradient(90deg, transparent, #D97706, #FCD34D, #D97706, transparent)' }}
  />
);

export default GoldDivider;
