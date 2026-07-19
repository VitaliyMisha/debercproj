import type React from 'react';
import { useTranslation } from 'react-i18next';

const Block: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white/8 rounded-2xl ${className}`} />
);

/**
 * Shimmer placeholder mirroring the spectator layout (banner → scoreboard →
 * history) so the page doesn't jump when live data arrives.
 */
export const SpectatorSkeleton: React.FC = () => {
  const { t } = useTranslation();
  return (
    <main className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4" aria-busy="true" aria-label={t('share.spectatorLoading')}>
      <Block className="h-14" />
      <div>
        <div className="animate-pulse bg-white/8 rounded h-3 w-24 mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <Block className="h-28" />
          <Block className="h-28" />
        </div>
      </div>
      <Block className="h-12" />
    </main>
  );
};

export default SpectatorSkeleton;
