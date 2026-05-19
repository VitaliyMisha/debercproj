import { useCallback, useRef } from 'react';

/**
 * Schedules a single synthesised tone on the given AudioContext.
 *
 * Uses an OscillatorNode routed through a GainNode so the volume envelope
 * decays exponentially — this avoids the audible "click" of an abrupt stop.
 */
const tone = (
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = 'sine',
  vol = 0.22,
): void => {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.connect(env);
  env.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  env.gain.setValueAtTime(vol, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.start(start);
  osc.stop(start + duration + 0.05);
};

/** Creates a short white-noise burst — used for ХВ crack effect. */
const noise = (ctx: AudioContext, start: number, duration: number, vol = 0.2): void => {
  const sampleCount = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const env = ctx.createGain();
  source.buffer = buffer;
  source.connect(env);
  env.connect(ctx.destination);
  env.gain.setValueAtTime(vol, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.start(start);
};

/**
 * Triggers a vibration pattern on devices that support the Vibration API
 * (most Android browsers, some PWA contexts). Silently no-ops elsewhere.
 */
const haptic = (pattern: number | number[]): void => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

/**
 * Provides programmatic sound effects for the Deberc scoring app.
 *
 * All audio is generated via the Web Audio API — no external files needed,
 * works fully offline. The AudioContext is created lazily on the first call
 * and reused for the lifetime of the component.
 *
 * Each effect also fires a haptic vibration pattern (Vibration API) so PWA
 * users on mobile get tactile feedback without needing a volume-on device.
 *
 * Browser policy: AudioContext may start in "suspended" state until a user
 * gesture occurs. `getCtx` calls `.resume()` automatically.
 */
export const useSound = () => {
  const ctxRef = useRef<AudioContext | null>(null);

  /** Returns the shared AudioContext, creating or resuming it as needed. */
  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current || ctxRef.current.state === 'closed') {
        ctxRef.current = new AudioContext();
      }
      if (ctxRef.current.state === 'suspended') {
        ctxRef.current.resume();
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  /** Short click when selecting a chip token (Б / ХВ / ВіС). */
  const chipClick = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    tone(c, 980, c.currentTime, 0.045, 'square', 0.11);
    haptic(12);
  }, [getCtx]);

  /** Two-note "deal" sound when a round is submitted. */
  const roundSubmit = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 523, t,        0.13, 'sine', 0.2);
    tone(c, 784, t + 0.14, 0.2,  'sine', 0.18);
    haptic([12, 8, 12]);
  }, [getCtx]);

  /** Descending two-note pop when undoing a round. */
  const undoPop = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 440, t,        0.08, 'sine', 0.18);
    tone(c, 330, t + 0.09, 0.1,  'sine', 0.15);
    haptic([10, 8, 20]);
  }, [getCtx]);

  /**
   * Triumphant ascending fanfare played when a winner is revealed.
   *
   * Sequence:
   *  1. Arpeggio — C5 → E5 → G5 → C6 (staggered 140 ms apart)
   *  2. Sustained chord — all four notes held for 1.4 s
   *
   * Total duration: ~2.1 s
   */
  const fanfare = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    const melody: [number, number][] = [
      [523, 0],
      [659, 0.14],
      [784, 0.28],
      [1047, 0.43],
    ];
    for (const [freq, dt] of melody) {
      tone(c, freq, t + dt, 0.28, 'sine', 0.2);
    }
    for (const freq of [523, 659, 784, 1047]) {
      tone(c, freq, t + 0.68, 1.4, 'sine', 0.14);
    }
    haptic([40, 20, 40, 20, 100]);
  }, [getCtx]);

  /** Low boom when a player receives their first Б. */
  const bSound = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    tone(c, 80, c.currentTime, 0.3, 'sine', 0.35);
    haptic(40);
  }, [getCtx]);

  /** Heavier double boom for the 2nd+ Б — escalates the drama. */
  const secondBSound = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 60, t,        0.3,  'sine', 0.4);
    tone(c, 55, t + 0.12, 0.2,  'sine', 0.3);
    haptic([40, 20, 60]);
  }, [getCtx]);

  /** Sharp noise crack + low thump when ХВ chip is selected. */
  const hvSound = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    noise(c, t, 0.08, 0.25);
    tone(c, 120, t + 0.04, 0.15, 'sine', 0.3);
    haptic(20);
  }, [getCtx]);

  /** Rising mysterious tone when ВіС chip is selected. */
  const visPlay = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const env = c.createGain();
    osc.connect(env);
    env.connect(c.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.4);
    env.gain.setValueAtTime(0.22, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.start(t);
    osc.stop(t + 0.6);
    haptic([8, 10, 8]);
  }, [getCtx]);

  /** Short ascending arpeggio when ВіС is won. */
  const visWin = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 523, t,        0.2, 'sine', 0.18);
    tone(c, 659, t + 0.12, 0.2, 'sine', 0.18);
    tone(c, 784, t + 0.24, 0.3, 'sine', 0.2);
    haptic([20, 15, 40]);
  }, [getCtx]);

  /** Descending tones when ВіС is lost. */
  const visLose = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 392, t,        0.2,  'sine', 0.2);
    tone(c, 330, t + 0.14, 0.2,  'sine', 0.2);
    tone(c, 262, t + 0.28, 0.35, 'sine', 0.22);
    haptic([30, 20, 30, 20, 50]);
  }, [getCtx]);

  /** One-shot tension tick when a player first enters the final 100-point stretch. */
  const closeFinish = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    tone(c, 1200, t,        0.04, 'square', 0.12);
    tone(c, 880,  t + 0.07, 0.08, 'sine',   0.15);
    haptic(15);
  }, [getCtx]);

  /** Card-shuffle burst at the start of every new game. */
  const newGame = useCallback(() => {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    for (let i = 0; i < 6; i++) {
      tone(c, 800 - i * 80, t + i * 0.04, 0.06, 'square', 0.08);
    }
    haptic([10, 5, 10, 5, 10]);
  }, [getCtx]);

  return { chipClick, roundSubmit, undoPop, fanfare, bSound, secondBSound, hvSound, visPlay, visWin, visLose, closeFinish, newGame };
};
