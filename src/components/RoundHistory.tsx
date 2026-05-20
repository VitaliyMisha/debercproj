import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Player, Round } from '../types';
import { GameRulesConfig } from '../types';
import { isValidScore, getVisDisplayValue } from '../utils/gameHelpers';
import { ConfirmSheet } from './ConfirmSheet';

interface RoundHistoryProps {
  rounds: Round[];
  players: Player[];
  onUpdateRound: (roundNumber: number, newScores: Record<string, string>) => void;
  gameRules?: GameRulesConfig;
  snapshotRound?: number | null;
  onUndoLastRound?: () => void;
}

const RoundHistory: React.FC<RoundHistoryProps> = ({ rounds, players, onUpdateRound, gameRules, snapshotRound, onUndoLastRound }) => {
  const { t } = useTranslation();
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [editScores, setEditScores] = useState<Record<string, string>>({});
  const [confirmingUndo, setConfirmingUndo] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const prevLengthRef = useRef(rounds.length);
  const [newRoundId, setNewRoundId] = useState<number | null>(null);

  useEffect(() => {
    if (rounds.length > prevLengthRef.current) {
      setNewRoundId(rounds[rounds.length - 1].number);
      const timer = setTimeout(() => setNewRoundId(null), 600);
      prevLengthRef.current = rounds.length;
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = rounds.length;
    return undefined;
  }, [rounds.length]);

  useEffect(() => {
    if (editingRound !== null && !rounds.some((r) => r.number === editingRound)) {
      setEditingRound(null);
      setEditScores({});
    }
  }, [rounds, editingRound]);

  const startEditing = (round: Round) => {
    setEditingRound(round.number);
    const initial: Record<string, string> = {};
    players.forEach((p) => {
      const s = round.scores[String(p.id)];
      initial[String(p.id)] = s !== undefined ? String(s) : '';
    });
    setEditScores(initial);
  };

  const saveEdit = () => {
    if (editingRound !== null) {
      onUpdateRound(editingRound, editScores);
      setEditingRound(null);
      setEditScores({});
    }
  };

  const cancelEdit = () => {
    setEditingRound(null);
    setEditScores({});
  };

  const placeholder = gameRules?.allowVis !== false ? '0, Б, ХВ, ВІС' : '0, Б, ХВ';

  if (rounds.length === 0) {
    return (
      <div className="bg-card-bg rounded-2xl border border-white/8 p-6 text-center">
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">{t('history.title')}</h2>
        <p className="text-muted text-sm py-4">{t('history.empty')}</p>
      </div>
    );
  }

  return (
    <>
    <div className="bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer select-none"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.08)' }}
        onClick={() => setCollapsed((c) => !c)}
        role="button"
        aria-expanded={!collapsed}
        aria-label={t('history.toggle')}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted text-xs" aria-hidden="true">{collapsed ? '▶' : '▼'}</span>
          <h2 className="text-muted text-xs font-semibold uppercase tracking-widest">{t('history.title')}</h2>
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && onUndoLastRound && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setConfirmingUndo(true); }}
              aria-label={t('history.undoAriaLabel')}
              className="h-7 px-3 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.93]"
              style={{
                background: '#7F1D1D88',
                color: '#FCA5A5',
                border: '1px solid #DC262655',
              }}
            >
              ↩ {t('history.undoBtn')}
            </button>
          )}
          <span className="text-muted text-xs bg-white/5 px-2 py-0.5 rounded-full">{t('history.total', { n: rounds.length })}</span>
        </div>
      </div>

      {!collapsed && <div className="divide-y divide-white/5">
        {[...rounds].sort((a, b) => b.number - a.number).map((round) => {
          const isEditing = editingRound === round.number;
          const isSnapshot = round.number === snapshotRound;
          const isNew = round.number === newRoundId;
          const dealerName = round.dealerId !== undefined
            ? players.find((p) => p.id === round.dealerId)?.name
            : undefined;

          return (
            <div
              key={round.number}
              className={`transition-all duration-200
                ${isSnapshot ? 'border-l-2 border-gold-from bg-gold-from/5' : ''}
                ${isNew ? 'animate-[slideInStagger_300ms_ease_both]' : ''}
              `}
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${isSnapshot ? 'text-gold-to' : 'text-white/60'}`}>
                    {t('history.round', { n: round.number })}
                  </span>
                  {dealerName && (
                    <span className="text-xs bg-primary/20 border border-primary/40 text-score-pos px-2 py-0.5 rounded-full leading-none">
                      {t('history.dealer', { name: dealerName })}
                    </span>
                  )}
                  {isSnapshot && (
                    <span className="text-xs text-gold-from bg-gold-from/10 border border-gold-from/30 px-2 py-0.5 rounded-full">
                      {t('history.preview')}
                    </span>
                  )}
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEditing(round)}
                    className="text-muted text-xs hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    {t('history.edit')}
                  </button>
                )}
              </div>

              {/* Scores */}
              <div className="px-4 pb-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {players.map((player) => {
                        const val = editScores[String(player.id)] ?? '';
                        const valid = isValidScore(val, gameRules);
                        return (
                          <div key={player.id}>
                            <label className="text-muted text-xs mb-1 block">{player.name}</label>
                            <input
                              id={`edit-r${round.number}-p${player.id}`}
                              name={`edit-r${round.number}-p${player.id}`}
                              type="text"
                              autoComplete="off"
                              value={val}
                              onChange={(e) =>
                                setEditScores((prev) => ({ ...prev, [String(player.id)]: e.target.value }))
                              }
                              aria-label={`Рахунок для ${player.name}`}
                              placeholder={placeholder}
                              className={`w-full px-3 py-2 rounded-xl text-sm text-center bg-felt border transition-colors
                                focus:outline-none focus:ring-2 focus:ring-gold-from/40 text-white
                                ${valid ? 'border-white/15' : 'border-score-neg/60'}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    {!Object.values(editScores).every((s) => isValidScore(s, gameRules)) && (
                      <p className="text-score-neg text-xs text-center">{t('history.invalidHint')}</p>
                    )}
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-xs text-muted border border-white/10 rounded-lg hover:text-white hover:border-white/30 transition-colors"
                      >
                        {t('history.cancelEdit')}
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={!Object.values(editScores).every((s) => isValidScore(s, gameRules))}
                        className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('history.save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player) => {
                      const displayVal = gameRules
                        ? getVisDisplayValue(round.number - 1, player.id, rounds, gameRules)
                        : (round.scores[String(player.id)] ?? 0);
                      const isNeg = typeof displayVal === 'number' && displayVal < 0;
                      const isVis = displayVal === 'ВіС';
                      const isB = displayVal === 'Б';
                      const colorClass = isNeg
                        ? 'text-score-neg'
                        : isB
                          ? 'text-token-b'
                          : isVis
                            ? 'text-token-vis'
                            : 'text-score-chalk';
                      return (
                        <div key={player.id} className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-white/3">
                          <span className="text-white/50 text-xs">{player.name}</span>
                          <span className={`text-sm font-semibold ${colorClass}`}>
                            {displayVal}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>}
    </div>

    {confirmingUndo && (
      <ConfirmSheet
        title={t('history.confirmUndo')}
        description={t('history.confirmUndoDesc')}
        confirmLabel={t('history.undoConfirmLabel')}
        onConfirm={() => { setConfirmingUndo(false); onUndoLastRound?.(); }}
        onCancel={() => setConfirmingUndo(false)}
      />
    )}
  </>
  );
};

export default RoundHistory;
