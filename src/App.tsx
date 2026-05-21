import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Game, GameRulesConfig, Player, Round, SavedGameState } from './types';
import { useSpectator } from './hooks/useSpectator';

import SetupScreen from './components/SetupScreen';
import RoundForm from './components/RoundForm';
import RoundHistory from './components/RoundHistory';
import RoundTimeline from './components/RoundTimeline';
import GameHeader from './components/GameHeader';
import GameHistory from './components/GameHistory';
import ScoreBoard from './components/ScoreBoard';

const WinnerScreen = lazy(() => import('./components/WinnerScreen'));
const PlayerStatistics = lazy(() => import('./components/PlayerStatistics'));
import { generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts, calculateGameTotals, saveGameState, loadGameState, clearGameState, loadPlayerNames, savePlayerNames } from './utils/gameHelpers';
import RecoverScreen from './components/RecoverScreen';
import { useSound } from './hooks/useSound';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import ShareSheet from './components/ShareSheet';

const GAME_ID = 'gameId';
const GAME_RULES_KEY = 'gameRules';
const SOUND_KEY = 'soundEnabled';
const LANG_KEY = 'lang';

const defaultGameRules: GameRulesConfig = {
  secondBPenalty: -100,
  hvPenalty: -100,
  allowVis: true,
  customTargetScore: false,
  targetScoreOptions: [510, 1020],
};

export default function App() {
  const watchId = useMemo(() => new URLSearchParams(window.location.search).get('watch'), []);
  const spectator = useSpectator(watchId);

  const [playerCount, setPlayerCount] = useState(2);
  const [targetScore, setTargetScore] = useState(1020);
  const [names, setNames] = useState<string[]>(Array(2).fill(''));
  const [dealerIndex, setDealerIndex] = useState(0);
  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<Record<string, number | string>>({});
  const [winnerPlayer, setWinnerPlayer] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [hasHistoryShown, setHasHistoryShown] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [snapshotRound, setSnapshotRound] = useState<number | null>(null);
  const [recoveredState, setRecoveredState] = useState<SavedGameState | null>(() => loadGameState());
  const [playerNames, setPlayerNames] = useState<string[]>(() => loadPlayerNames());

  const [isSharing, setIsSharing] = useState(false);
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [showShareSheet, setShowShareSheet] = useState(false);

  const [gameRules, setGameRules] = useState<GameRulesConfig>(() => {
    const stored = localStorage.getItem(GAME_RULES_KEY);
    return stored ? JSON.parse(stored) : defaultGameRules;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => localStorage.getItem(SOUND_KEY) !== 'false');
  const { i18n, t } = useTranslation();
  const [lang, setLang] = useState<'uk' | 'en'>(() =>
    (localStorage.getItem(LANG_KEY) as 'uk' | 'en') ?? 'uk'
  );
  const handleLangChange = useCallback(() => {
    const next: 'uk' | 'en' = lang === 'uk' ? 'en' : 'uk';
    setLang(next);
    localStorage.setItem(LANG_KEY, next);
    i18n.changeLanguage(next);
  }, [lang, i18n]);
  const handleShareOpen = useCallback(() => {
    if (!isSharing) {
      const code = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
      setShareCode(code);
      setIsSharing(true);
    }
    setShowShareSheet(true);
  }, [isSharing]);

  const handleStopSharing = useCallback(() => {
    setIsSharing(false);
    setShareCode(null);
    setShowShareSheet(false);
  }, []);

  const { chipClick, roundSubmit, undoPop, bSound, secondBSound, hvSound, visPlay, visWin, visLose, closeFinish, newGame } = useSound();
  useFirebaseSync({ game, targetScore, winnerPlayer, gameRules, isSharing, shareCode });
  const closeFinishFiredRef = useRef<Set<string>>(new Set());

  const [roundDeltas, setRoundDeltas] = useState<Record<string, number> | null>(null);
  const [deltaKey, setDeltaKey] = useState(0);
  const deltaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [gameId, setGameId] = useState(() => {
    const stored = localStorage.getItem(GAME_ID);
    return stored ? parseInt(stored, 10) : 1;
  });

  useEffect(() => {
    localStorage.setItem(GAME_ID, gameId.toString());
  }, [gameId]);

  useEffect(() => {
    localStorage.setItem(GAME_RULES_KEY, JSON.stringify(gameRules));
  }, [gameRules]);

  useEffect(() => {
    localStorage.setItem(SOUND_KEY, soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    if (!game || game.rounds.length === 0) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [game]);

  useEffect(() => {
    if (!game || game.rounds.length === 0) {
      // Skip clearing while RecoverScreen is visible — otherwise the save would be
      // erased on the very first render before the user decides whether to continue.
      if (!recoveredState) clearGameState();
      return;
    }
    saveGameState({ game, targetScore, winnerPlayer });
  }, [game, targetScore, winnerPlayer, recoveredState]);

  // Cleanup deltaTimerRef on unmount to prevent setState on unmounted component
  // warning in React 18 strict mode and tests.
  useEffect(() => {
    return () => {
      if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
    };
  }, []);

  const createGame = (
    reusePlayers?: Player[],
    showHistory = false,
    preserveWinCounts = false,
    startingDealerId?: number,
  ) => {
    closeFinishFiredRef.current.clear();
    if (soundEnabled) newGame();
    if (!reusePlayers) {
      savePlayerNames(names);
      setPlayerNames(loadPlayerNames());
    }
    const winCounts = loadWinCounts();
    const players: Player[] = reusePlayers || names.map((name) => {
      const id = generateUniqueId();
      return { id, name, winCount: preserveWinCounts ? 0 : winCounts[id] || 0 };
    });
    const createdGame: Game = {
      id: gameId,
      createdAt: new Date().toISOString(),
      players,
      rounds: [],
      dealerId: startingDealerId ?? players[dealerIndex].id,
    };
    setGame(createdGame);
    setWinnerPlayer(null);
    setScores(Object.fromEntries(players.map((p) => [p.id.toString(), ''])));
    setGameId((prev) => prev + 1);
    setError('');
    setHasHistoryShown(showHistory);
    setShowStatistics(false);
  };

  const visCount = game
    ? Object.values(scores).filter((v) => String(v).toUpperCase() === 'ВІС').length
    : 0;
  const bCount = game
    ? Object.values(scores).filter((v) => String(v).toUpperCase() === 'Б').length
    : 0;
  const isAddDisabled = game
    ? visCount > 1 || bCount > 1 || game.players.some((p) => !isValidScore(scores[String(p.id)], gameRules))
    : true;

  const updateWinner = (currentGame: Game) => {
    const totals = calculateGameTotals(currentGame, gameRules);
    const contenders = currentGame.players.filter((p) => totals[p.id] >= targetScore);
    if (contenders.length > 0) {
      const maxScore = Math.max(...contenders.map((p) => totals[p.id]));
      const winners = contenders.filter((p) => totals[p.id] === maxScore);
      if (winners.length === 1) {
        const winner = winners[0];
        setWinnerPlayer(winner.id);
        const updatedPlayers = currentGame.players.map((p) =>
          p.id === winner.id ? { ...p, winCount: p.winCount + 1 } : p,
        );
        setGame({ ...currentGame, players: updatedPlayers });
        const winCounts = loadWinCounts();
        winCounts[winner.id] = (winCounts[winner.id] || 0) + 1;
        saveWinCounts(winCounts);
      } else {
        setWinnerPlayer(null);
      }
    }
  };

  const addRound = () => {
    if (!game || winnerPlayer !== null) return;
    if (bCount > 1) {
      setError(t('error.oneB'));
      return;
    }
    if (visCount > 1) {
      setError(t('error.oneVis'));
      return;
    }
    if (isAddDisabled) {
      setError(gameRules.allowVis ? t('error.invalidScores') : t('error.invalidScoresNoVis'));
      return;
    }
    const roundNumber = game.rounds.length + 1;
    const updatedScores: Record<string, number | string> = {};
    game.players.forEach((p) => {
      updatedScores[p.id] = parseScore(scores[String(p.id)], p.id.toString(), game.rounds, gameRules);
    });
    const newRound: Round = { id: roundNumber, number: roundNumber, scores: updatedScores, dealerId: game.dealerId };
    const nextDealerIndex = (game.players.findIndex((p) => p.id === game.dealerId) + 1) % game.players.length;
    const updatedGame: Game = {
      ...game,
      rounds: [...game.rounds, newRound],
      dealerId: game.players[nextDealerIndex].id,
    };
    // Compute per-player score deltas for the floating animation
    const newTotals = calculateGameTotals(updatedGame, gameRules);
    const deltas: Record<string, number> = {};
    for (const p of game.players) {
      const key = String(p.id);
      deltas[key] = (newTotals[p.id] ?? 0) - (totals[p.id] ?? 0);
    }
    if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
    setRoundDeltas(deltas);
    setDeltaKey((k) => k + 1);
    deltaTimerRef.current = setTimeout(() => setRoundDeltas(null), 2000);

    setGame(updatedGame);
    setSnapshotRound(null);
    setScores(Object.fromEntries(updatedGame.players.map((p) => [p.id.toString(), ''])));
    setError('');

    if (soundEnabled) {
      roundSubmit();

      // Б sound — check raw input vs parsed result to distinguish 1st vs 2nd+ Б
      for (const p of game.players) {
        if (String(scores[String(p.id)] ?? '').trim().toUpperCase() === 'Б') {
          if (updatedScores[String(p.id)] === 'Б') bSound();
          else secondBSound();
        }
      }

      // ВіС resolution sound — fires when the round immediately after a ВіС resolves it
      if (game.rounds.length > 0) {
        const lastRound = game.rounds[game.rounds.length - 1];
        for (const [playerIdStr, val] of Object.entries(lastRound.scores)) {
          if (String(val).toUpperCase() === 'ВІС') {
            const playerId = Number(playerIdStr);
            const ownScore = typeof updatedScores[playerIdStr] === 'number' ? (updatedScores[playerIdStr] as number) : 0;
            const bestOpponent = Math.max(
              ...game.players
                .filter((p) => p.id !== playerId)
                .map((p) => (typeof updatedScores[String(p.id)] === 'number' ? (updatedScores[String(p.id)] as number) : 0)),
            );
            if (ownScore > bestOpponent) visWin();
            else if (ownScore < bestOpponent) visLose();
            // ownScore === bestOpponent → tie → no sound (ВіС carries forward)
          }
        }
      }
    }

    // Haptic fires when sound is off (roundSubmit() already includes haptic when sound is on)
    if (!soundEnabled && 'vibrate' in navigator) navigator.vibrate(30);

    updateWinner(updatedGame);
  };

  const updateRound = (roundNumber: number, newScores: Record<string, string>) => {
    if (!game) return;
    const convertedScores: Record<string, number | string> = {};
    // Exclude the round being edited so its own prior Б doesn't affect parseScore.
    const roundsExcludingCurrent = game.rounds.filter((r) => r.number !== roundNumber);
    Object.entries(newScores).forEach(([playerId, scoreStr]) => {
      convertedScores[playerId] = parseScore(scoreStr, playerId, roundsExcludingCurrent, gameRules);
    });
    const updatedRounds = game.rounds.map((r) =>
      r.number === roundNumber ? { ...r, scores: convertedScores } : r,
    );
    const updatedGame: Game = { ...game, rounds: updatedRounds };
    setGame(updatedGame);
    setError('');
    updateWinner(updatedGame);
  };

  const totals = useMemo(() => {
    if (!game) return {};
    return calculateGameTotals(game, gameRules);
  }, [game, gameRules]);

  const spectatorTotals = useMemo(() => {
    if (!watchId || !spectator.game || !spectator.gameRules) return {};
    return calculateGameTotals(spectator.game, spectator.gameRules);
  }, [watchId, spectator.game, spectator.gameRules]);

  const spectatorWinnerObj = useMemo(
    () =>
      spectator.game && spectator.winnerPlayer !== null
        ? (spectator.game.players.find((p) => p.id === spectator.winnerPlayer) ?? null)
        : null,
    [spectator.game, spectator.winnerPlayer],
  );

  useEffect(() => {
    if (!game || !soundEnabled) return;
    for (const p of game.players) {
      const score = totals[p.id] ?? 0;
      const key = String(p.id);
      if (score > 0 && targetScore - score <= 100 && !closeFinishFiredRef.current.has(key)) {
        closeFinishFiredRef.current.add(key);
        closeFinish();
      }
    }
  }, [totals, game, soundEnabled, targetScore, closeFinish]);

  const winnerObj = useMemo(
    () => (game && winnerPlayer !== null ? (game.players.find((p) => p.id === winnerPlayer) ?? null) : null),
    [game, winnerPlayer],
  );

  const displayTotals = useMemo((): Record<string, number> => {
    if (!game || snapshotRound === null) return totals;
    const snapshotGame = { ...game, rounds: game.rounds.slice(0, snapshotRound) };
    return calculateGameTotals(snapshotGame, gameRules) as Record<string, number>;
  }, [game, gameRules, snapshotRound, totals]);

  const resetGame = () => {
    setIsSharing(false);
    setShareCode(null);
    setShowShareSheet(false);
    clearGameState();
    setGame(null);
    setNames(Array(playerCount).fill(''));
    setDealerIndex((dealerIndex + 1) % playerCount);
    setWinnerPlayer(null);
    setError('');
    setHasHistoryShown(false);
    setShowStatistics(false);
    setGameId(1);
    localStorage.removeItem(GAME_ID);
  };

  const continueGame = () => {
    if (game) {
      clearGameState();
      createGame(game.players, true, true, game.dealerId);
    }
  };

  /**
   * Removes the last submitted round and rolls back all derived state.
   *
   * Dealer rotation: each Round stores the dealerId that was active when it was
   * submitted, so restoring game.dealerId to lastRound.dealerId correctly undoes
   * the rotation that happened in addRound().
   *
   * winnerPlayer is always cleared because the undone round might have been the
   * one that triggered a win.
   */
  const handleUndoLastRound = () => {
    if (!game || game.rounds.length === 0) return;
    const lastRound = game.rounds[game.rounds.length - 1];
    const updatedGame: Game = {
      ...game,
      rounds: game.rounds.slice(0, -1),
      dealerId: lastRound.dealerId ?? game.dealerId,
    };
    setGame(updatedGame);
    setWinnerPlayer(null);
    setScores(Object.fromEntries(updatedGame.players.map((p) => [p.id.toString(), ''])));
    setError('');
    if (soundEnabled) undoPop();
    else if ('vibrate' in navigator) navigator.vibrate([20, 30, 20]);
  };

  const handleRecover = () => {
    if (!recoveredState) return;
    setGame(recoveredState.game);
    setTargetScore(recoveredState.targetScore);
    setWinnerPlayer(recoveredState.winnerPlayer);
    setScores(Object.fromEntries(recoveredState.game.players.map((p) => [p.id.toString(), ''])));

    // Pre-populate so close-finish sound doesn't re-fire for players already near target
    const recoveredTotals = calculateGameTotals(recoveredState.game, gameRules);
    closeFinishFiredRef.current.clear();
    for (const p of recoveredState.game.players) {
      const score = recoveredTotals[p.id] ?? 0;
      if (score > 0 && recoveredState.targetScore - score <= 100) {
        closeFinishFiredRef.current.add(String(p.id));
      }
    }

    setRecoveredState(null);
  };

  const handleDiscard = () => {
    clearGameState();
    setRecoveredState(null);
  };

  const handleChipClick = useCallback((token: string) => {
    if (token === 'ВІС') visPlay();
    else if (token === 'ХВ') hvSound();
    else chipClick();
  }, [visPlay, hvSound, chipClick]);

  return (
    <div className="felt-bg min-h-dvh w-full overflow-x-hidden">
      {/* Corner card suit silhouettes — decorative table atmosphere */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ clipPath: 'inset(0)', contain: 'strict' }}
        aria-hidden="true"
      >
        <span className="absolute -top-4 -left-4 text-[22vw] opacity-[0.035] text-white leading-none select-none">♠</span>
        <span className="absolute -top-4 -right-4 text-[22vw] opacity-[0.035] text-white leading-none select-none">♥</span>
        <span className="absolute -bottom-4 -left-4 text-[22vw] opacity-[0.035] text-white leading-none select-none">♣</span>
        <span className="absolute -bottom-4 -right-4 text-[22vw] opacity-[0.035] text-white leading-none select-none">♦</span>
      </div>
      {!watchId ? (
        <>
          {/* Lang toggle — only on setup/recover screens; GameHeader handles it during active game */}
          {!game && (
            <button
              type="button"
              onClick={handleLangChange}
              aria-label={lang === 'uk' ? 'Switch to English' : 'Перейти на Українську'}
              className="fixed top-4 right-4 z-40 w-9 h-9 rounded-xl bg-card-bg border border-white/10 text-xs font-bold text-white/70
                hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
                flex items-center justify-center"
            >
              {t('header.langToggle')}
            </button>
          )}

          {recoveredState && !game ? (
            <main className="flex items-center justify-center min-h-dvh py-4 px-4">
              <RecoverScreen
                savedState={recoveredState}
                gameRules={gameRules}
                onRecover={handleRecover}
                onDiscard={handleDiscard}
              />
            </main>
          ) : !game ? (
            <main className="flex items-center justify-center min-h-dvh py-4 px-4">
              <SetupScreen
                playerCount={playerCount}
                onPlayerCountChange={setPlayerCount}
                targetScore={targetScore}
                onTargetScoreChange={setTargetScore}
                names={names}
                onNamesChange={setNames}
                dealerIndex={dealerIndex}
                onDealerIndexChange={setDealerIndex}
                gameRules={gameRules}
                onRulesChange={setGameRules}
                playerNames={playerNames}
                onStart={() => createGame()}
              />
            </main>
          ) : (
            <main className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
              <GameHeader
                gameId={game.id}
                targetScore={targetScore}
                dealerName={game.players.find((p) => p.id === game.dealerId)?.name || ''}
                onNewGame={resetGame}
                hasRounds={game.rounds.length > 0}
                soundEnabled={soundEnabled}
                onSoundToggle={() => setSoundEnabled((prev) => !prev)}
                lang={lang}
                onLangChange={handleLangChange}
                isSharing={isSharing}
                onShareOpen={handleShareOpen}
              />

              {hasHistoryShown && <GameHistory players={game.players} />}

              {game.rounds.length > 0 && (
                <RoundTimeline
                  totalRounds={game.rounds.length + (winnerPlayer !== null ? 0 : 1)}
                  currentRound={game.rounds.length + (winnerPlayer !== null ? 0 : 1)}
                  snapshotRound={snapshotRound}
                  onSelectRound={(r) => setSnapshotRound(r)}
                  onExitSnapshot={() => setSnapshotRound(null)}
                />
              )}

              <ScoreBoard
                players={game.players}
                totals={displayTotals}
                targetScore={targetScore}
                dealerId={
                  snapshotRound !== null
                    ? game.rounds[snapshotRound - 1]?.dealerId
                    : game.dealerId
                }
                snapshotActive={snapshotRound !== null}
                deltas={roundDeltas}
                deltaKey={deltaKey}
              />

              {winnerObj ? (
                <Suspense fallback={null}>
                  <WinnerScreen
                    winner={winnerObj}
                    players={game.players}
                    totals={totals}
                    roundCount={game.rounds.length}
                    onNewGame={resetGame}
                    onContinue={continueGame}
                    soundEnabled={soundEnabled}
                  />
                </Suspense>
              ) : (
                <>
                  {snapshotRound === null && (
                    <>
                      {error && (
                        <div className="bg-score-neg/10 border border-score-neg/40 text-score-neg px-4 py-3 rounded-xl text-sm">
                          {error}
                        </div>
                      )}
                      <RoundForm
                        players={game.players}
                        scores={scores}
                        onScoreChange={(e, id) => setScores({ ...scores, [id]: e.target.value })}
                        onAddRound={addRound}
                        roundNumber={game.rounds.length + 1}
                        isAddDisabled={isAddDisabled}
                        gameRules={gameRules}
                        onChipClick={soundEnabled ? handleChipClick : undefined}
                      />
                    </>
                  )}
                </>
              )}

              <RoundHistory
                rounds={game.rounds}
                players={game.players}
                onUpdateRound={updateRound}
                gameRules={gameRules}
                snapshotRound={snapshotRound}
                onUndoLastRound={winnerObj === null ? handleUndoLastRound : undefined}
              />

              {game.rounds.length > 0 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowStatistics(!showStatistics)}
                    className="px-4 py-2 bg-card-bg border border-white/10 text-muted text-sm rounded-xl
                      hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]"
                  >
                    {showStatistics ? 'Приховати статистику' : 'Показати статистику'}
                  </button>
                </div>
              )}

              {showStatistics && game.rounds.length > 0 && (
                <Suspense fallback={null}>
                  <PlayerStatistics
                    game={game}
                    players={game.players}
                    gameRules={gameRules}
                  />
                </Suspense>
              )}
            </main>
          )}
        </>
      ) : (
        <>
          {spectator.status === 'loading' && (
            <main className="flex items-center justify-center min-h-dvh">
              <p className="text-muted text-sm">{t('share.spectatorLoading')}</p>
            </main>
          )}
          {(spectator.status === 'not_found' || spectator.status === 'ended') && (
            <main className="flex items-center justify-center min-h-dvh px-6 text-center">
              <p className="text-muted text-sm">
                {spectator.status === 'not_found'
                  ? t('share.spectatorNotFound')
                  : t('share.spectatorEnded')}
              </p>
            </main>
          )}
          {spectator.status === 'live' && spectator.game && (
            <main className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
              <div className="rounded-2xl bg-card-bg border border-white/8 px-4 py-3 flex items-center">
                <div className="w-9 shrink-0" />
                <p className="flex-1 text-center text-sm font-semibold text-white/70">
                  {t('share.spectatorBanner', { id: spectator.game.id })}
                </p>
                <button
                  type="button"
                  onClick={handleLangChange}
                  aria-label={lang === 'uk' ? 'Switch to English' : 'Перейти на Українську'}
                  className="w-9 h-9 shrink-0 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white/70
                    hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
                    flex items-center justify-center"
                >
                  {t('header.langToggle')}
                </button>
              </div>
              <ScoreBoard
                players={spectator.game.players}
                totals={spectatorTotals as Record<string, number>}
                targetScore={spectator.targetScore}
                dealerId={spectator.game.dealerId}
                snapshotActive={false}
                deltas={null}
                deltaKey={0}
              />
              {spectatorWinnerObj && (
                <Suspense fallback={null}>
                  <WinnerScreen
                    winner={spectatorWinnerObj}
                    players={spectator.game.players}
                    totals={spectatorTotals as Record<string, number>}
                    roundCount={spectator.game.rounds.length}
                    soundEnabled={false}
                    hideAnimation
                  />
                </Suspense>
              )}
              <RoundHistory
                rounds={spectator.game.rounds}
                players={spectator.game.players}
                onUpdateRound={() => {}}
                gameRules={spectator.gameRules ?? undefined}
                readOnly
              />
              {spectator.game.rounds.length > 0 && spectator.gameRules && (
                <Suspense fallback={null}>
                  <PlayerStatistics
                    game={spectator.game}
                    players={spectator.game.players}
                    gameRules={spectator.gameRules}
                  />
                </Suspense>
              )}
            </main>
          )}
        </>
      )}
      {showShareSheet && shareCode && game && (
        <ShareSheet
          shareUrl={`${window.location.origin}?watch=${shareCode}`}
          onStopSharing={handleStopSharing}
          onClose={() => setShowShareSheet(false)}
        />
      )}
    </div>
  );
}
