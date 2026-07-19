import type React from 'react';

/** First letter of the (trimmed) name, uppercased — emoji-safe via Array.from. */
export const initialOf = (name: string, fallback = '?'): string => Array.from(name.trim())[0]?.toUpperCase() || fallback;

const GREEN_GRADIENT = 'linear-gradient(135deg, #15803D, #166534)';

interface AvatarProps {
  name: string;
  fallback?: string;
  /** Size, font and colour classes, e.g. 'w-9 h-9 text-base text-white'. */
  className?: string;
  /** CSS background. Defaults to the table-green gradient; pass null to style via className. */
  background?: string | null;
  /** Overrides the initial (e.g. 👑 for a champion). */
  children?: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  fallback = '?',
  className = 'w-8 h-8 text-sm text-white',
  background = GREEN_GRADIENT,
  children,
}) => (
  <div
    className={`rounded-full flex items-center justify-center font-display shrink-0 ${className}`}
    style={background ? { background } : undefined}
  >
    {children ?? initialOf(name, fallback)}
  </div>
);

export default Avatar;
