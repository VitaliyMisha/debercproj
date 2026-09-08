import type React from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameRulesConfig } from '../types';
import { BottomSheet } from './BottomSheet';

interface RulesSheetProps {
  gameRules: GameRulesConfig;
  targetScore: number;
  onClose: () => void;
}

/** Section ids in reading order. `vis` is dropped when the rule is disabled. */
const SECTION_IDS = ['players', 'input', 'b', 'hv', 'vis', 'finish', 'dealer', 'edge'] as const;

type SectionId = (typeof SECTION_IDS)[number];

/**
 * Full in-app rules reference, opened from the game header and the setup screen.
 *
 * The prose lives in i18n, but every NUMBER is interpolated from the active
 * `gameRules` / `targetScore` instead of being written into the translations —
 * otherwise the reference would keep claiming -100 after the player changed the
 * penalty in PenaltySheet. Keep it that way when editing the texts.
 */
export const RulesSheet: React.FC<RulesSheetProps> = ({ gameRules, targetScore, onClose }) => {
  const { t } = useTranslation();
  const bodyRef = useRef<HTMLDivElement>(null);

  const values = {
    secondB: gameRules.secondBPenalty,
    hv: gameRules.hvPenalty,
    target: targetScore,
  };

  /**
   * Section bodies are stored as arrays of paragraphs. i18next's types reject a
   * dynamic key together with `returnObjects`, so the call is widened here — the
   * Array.isArray guard is what actually keeps this safe at runtime.
   */
  const paragraphs = (key: string): string[] => {
    const translate = t as unknown as (k: string, o: Record<string, unknown>) => unknown;
    const value = translate(key, { returnObjects: true, ...values });
    return Array.isArray(value) ? (value as string[]) : [];
  };

  const sections = SECTION_IDS.filter((id) => id !== 'vis' || gameRules.allowVis);

  const scrollTo = (id: SectionId) => {
    const target = bodyRef.current?.querySelector(`#rules-section-${id}`);
    if (!target) return;
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (typeof target.scrollIntoView !== 'function') return;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <BottomSheet onClose={onClose} ariaLabelledBy="rules-sheet-title">
      <div className="flex items-center justify-between mb-4">
        <h3 id="rules-sheet-title" className="text-white font-display text-lg">
          {t('rules.title')}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="w-8 h-8 flex items-center justify-center rounded-full text-muted
            hover:text-white hover:bg-white/10 transition-colors text-lg leading-none"
        >
          ✕
        </button>
      </div>

      {/* Table of contents — what keeps a long document usable mid-game */}
      <nav aria-label={t('rules.contents')} className="mb-4">
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
          {sections.map((id) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => scrollTo(id)}
                className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/75 text-xs font-sans
                  hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
              >
                {t(`rules.sections.${id}.title`)}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <p className="text-muted text-xs mb-3">{t('rules.valuesNote')}</p>

      <div ref={bodyRef} className="max-h-[58vh] overflow-y-auto pr-1 flex flex-col gap-5">
        {sections.map((id) => (
          <section key={id} id={`rules-section-${id}`} aria-labelledby={`rules-heading-${id}`} className="scroll-mt-2">
            <h4 id={`rules-heading-${id}`} className="font-display text-score-chalk text-sm uppercase tracking-widest mb-2">
              {t(`rules.sections.${id}.title`)}
            </h4>
            <div className="flex flex-col gap-2">
              {paragraphs(`rules.sections.${id}.body`).map((line) => (
                <p key={line} className="text-white/80 text-sm font-sans leading-relaxed">
                  {line}
                </p>
              ))}

              {/* Token list depends on whether ВіС is allowed at all */}
              {id === 'input' && (
                <p className="text-white/80 text-sm font-sans leading-relaxed">
                  {gameRules.allowVis ? t('rules.sections.input.tokens') : t('rules.sections.input.tokensNoVis')}
                </p>
              )}

              {/* ВіС-specific edge cases are hidden together with the ВіС section */}
              {id === 'edge' &&
                gameRules.allowVis &&
                paragraphs('rules.sections.edge.visBody').map((line) => (
                  <p key={line} className="text-white/80 text-sm font-sans leading-relaxed">
                    {line}
                  </p>
                ))}
            </div>
          </section>
        ))}
      </div>
    </BottomSheet>
  );
};

export default RulesSheet;
