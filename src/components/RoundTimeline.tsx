import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface RoundTimelineProps {
  totalRounds: number;
  currentRound: number;
  snapshotRound: number | null;
  onSelectRound: (round: number) => void;
  onExitSnapshot: () => void;
}

export const RoundTimeline: React.FC<RoundTimelineProps> = ({
  totalRounds,
  currentRound,
  snapshotRound,
  onSelectRound,
  onExitSnapshot,
}) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentRound, snapshotRound]);

  const pills = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-2">
      {snapshotRound !== null && (
        <button
          type="button"
          onClick={onExitSnapshot}
          className="text-gold-to text-sm font-semibold text-center py-2 bg-gold-from/10 border border-gold-from/30 rounded-xl active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
        >
          {t('timeline.backToGame')}
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {pills.map((round) => {
          const isPast = round < currentRound;
          const isCurrent = round === currentRound;
          const isSnapshot = round === snapshotRound;

          let pillClass = '';
          if (isSnapshot) {
            pillClass = 'bg-gold-from/30 border-gold-to text-gold-to font-bold';
          } else if (isCurrent) {
            pillClass = snapshotRound !== null
              ? 'bg-primary border-primary text-white font-bold cursor-pointer hover:bg-primary-dark'
              : 'bg-primary border-primary text-white font-bold';
          } else if (isPast) {
            pillClass = 'bg-score-pos/20 border-score-pos/50 text-score-pos cursor-pointer hover:bg-score-pos/30';
          } else {
            pillClass = 'bg-white/5 border-white/10 text-muted cursor-default';
          }

          return (
            <button
              key={round}
              type="button"
              data-active={isSnapshot || isCurrent ? 'true' : 'false'}
              onClick={
                isPast
                  ? () => onSelectRound(round)
                  : isCurrent && snapshotRound !== null
                    ? onExitSnapshot
                    : undefined
              }
              disabled={!isPast && !(isCurrent && snapshotRound !== null)}
              className={`
                shrink-0 w-9 h-9 rounded-full border text-sm flex items-center justify-center
                transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
                ${pillClass}
              `}
            >
              {isPast || isCurrent ? round : '·'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoundTimeline;
