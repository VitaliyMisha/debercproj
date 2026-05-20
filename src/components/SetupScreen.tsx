import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameRulesConfig } from '../types';
import { ChipGroup } from './ChipGroup';
import { GoldDivider } from './GoldDivider';
import { Button } from './Button';
import { PlayerRow } from './PlayerRow';
import { PenaltySheet } from './PenaltySheet';

interface SetupScreenProps {
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  targetScore: number;
  onTargetScoreChange: (score: number) => void;
  names: string[];
  onNamesChange: (names: string[]) => void;
  dealerIndex: number;
  onDealerIndexChange: (index: number) => void;
  gameRules: GameRulesConfig;
  onRulesChange: (rules: GameRulesConfig) => void;
  playerNames?: string[];
  onStart: () => void;
}

type PenaltyKey = 'secondBPenalty' | 'hvPenalty';

export const SetupScreen: React.FC<SetupScreenProps> = ({
  playerCount,
  onPlayerCountChange,
  targetScore,
  onTargetScoreChange,
  names,
  onNamesChange,
  dealerIndex,
  onDealerIndexChange,
  gameRules,
  onRulesChange,
  playerNames = [],
  onStart,
}) => {
  const { t } = useTranslation();
  const [penaltySheet, setPenaltySheet] = useState<PenaltyKey | null>(null);

  const PLAYER_COUNT_OPTIONS = [
    { label: t('setup.players2'), value: 2 as const },
    { label: t('setup.players3'), value: 3 as const },
    { label: t('setup.players4'), value: 4 as const },
  ];

  const handlePlayerCountChange = (count: number) => {
    onPlayerCountChange(count);
    const next = [...names];
    while (next.length < count) next.push('');
    onNamesChange(next.slice(0, count));
    if (dealerIndex >= count) onDealerIndexChange(0);
  };

  const handleNameChange = (idx: number, value: string) => {
    const next = [...names];
    next[idx] = value;
    onNamesChange(next);
  };

  const targetOptions = [
    { label: t('setup.target510'), value: 510 as const },
    { label: t('setup.target1020'), value: 1020 as const },
    ...(gameRules.customTargetScore
      ? gameRules.targetScoreOptions
          .filter((s) => s !== 510 && s !== 1020)
          .map((s) => ({ label: String(s), value: s as number }))
      : []),
  ];

  const canStart = names.every((n) => n.trim().length > 0);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 flex items-center justify-center text-8xl text-white/5 font-display pointer-events-none select-none" aria-hidden="true">
          ♥♦♣
        </div>
        <h1 className="font-display text-4xl gold-gradient-text relative z-10">{t('app.title')} ♠</h1>
      </div>

      {/* Кількість гравців */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">{t('setup.playersLabel')}</h2>
        <ChipGroup
          options={PLAYER_COUNT_OPTIONS}
          value={playerCount}
          onChange={handlePlayerCountChange}
        />
      </section>

      {/* До перемоги */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">{t('setup.targetLabel')}</h2>
        <ChipGroup
          options={targetOptions}
          value={targetScore}
          onChange={onTargetScoreChange}
        />
      </section>

      <GoldDivider />

      {/* Імена гравців */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">
          {t('setup.playersSection')} <span className="normal-case opacity-60">{t('setup.dealerHint')}</span>
        </h2>
        <div className="flex flex-col gap-3">
          {names.map((name, idx) => (
            <PlayerRow
              key={idx}
              index={idx}
              name={name}
              isDealer={dealerIndex === idx}
              onNameChange={(v) => handleNameChange(idx, v)}
              onSetDealer={() => onDealerIndexChange(idx)}
              suggestions={playerNames}
            />
          ))}
        </div>
      </section>

      <GoldDivider />

      {/* Правила */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">{t('setup.rulesLabel')}</h2>
        <div className="flex flex-wrap gap-2">
          {/* ВІС toggle */}
          <button
            type="button"
            onClick={() => onRulesChange({ ...gameRules, allowVis: !gameRules.allowVis })}
            aria-pressed={gameRules.allowVis}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 active:scale-[0.97]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
              ${gameRules.allowVis
                ? 'bg-token-vis/20 border-token-vis text-token-vis'
                : 'bg-card-bg border-white/10 text-muted hover:border-white/30'
              }`}
          >
            ВІС {gameRules.allowVis ? '✓' : '✗'}
          </button>

          {/* 2-га Б penalty */}
          <button
            type="button"
            onClick={() => setPenaltySheet('secondBPenalty')}
            className="px-4 py-2 rounded-full text-sm font-semibold border bg-card-bg border-white/10 text-score-neg hover:border-score-neg/50 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
          >
            {t('setup.penaltyBLabel')}: {gameRules.secondBPenalty}
          </button>

          {/* ХВ penalty */}
          <button
            type="button"
            onClick={() => setPenaltySheet('hvPenalty')}
            className="px-4 py-2 rounded-full text-sm font-semibold border bg-card-bg border-white/10 text-score-neg hover:border-score-neg/50 transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
          >
            {t('setup.penaltyHVLabel')}: {gameRules.hvPenalty}
          </button>
        </div>
      </section>

      {/* Start button */}
      <Button
        fullWidth
        disabled={!canStart}
        onClick={onStart}
        className="py-4 text-lg mt-2"
      >
        {t('setup.startGame')}
      </Button>

      {/* Penalty sheet */}
      {penaltySheet && (
        <PenaltySheet
          label={penaltySheet === 'secondBPenalty' ? t('setup.penaltyBLabel') : t('setup.penaltyHVLabel')}
          value={gameRules[penaltySheet]}
          onChange={(v) => onRulesChange({ ...gameRules, [penaltySheet]: v })}
          onClose={() => setPenaltySheet(null)}
        />
      )}
    </div>
  );
};

export default SetupScreen;
