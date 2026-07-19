import type React from 'react';

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

interface OdometerProps {
  value: number;
  /** Skip the roll animation (snapshot mode). Reduced motion is handled by CSS. */
  instant?: boolean;
}

/**
 * Casino-table odometer: every digit is a vertical strip of 0-9 that rolls to
 * its position, like a mechanical counter. Digit columns are keyed from the
 * right (ones = 1, tens = 2, …) so existing columns roll instead of remounting
 * when the number gains a digit (99 → 102).
 *
 * Inherits font family/size from the parent (Share Tech Mono in ScoreBoard).
 */
export const Odometer: React.FC<OdometerProps> = ({ value, instant = false }) => {
  const negative = value < 0;
  const digits = String(Math.abs(value)).split('');

  return (
    <span className="odometer" role="img" aria-label={String(value)}>
      {negative && <span aria-hidden="true">-</span>}
      {digits.map((d, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: intentional — keys count from the right so columns roll instead of remounting (99 → 102)
        <span key={digits.length - i} className="odometer-digit" aria-hidden="true">
          <span
            className="odometer-strip"
            style={{
              transform: `translateY(-${Number(d)}em)`,
              transition: instant ? 'none' : undefined,
            }}
          >
            {DIGITS.map((n) => (
              <span key={n} className="odometer-cell">
                {n}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
};

export default Odometer;
