/// <reference types="node" />
import { existsSync, globSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Сторож розкладки налаштувань Claude Code. CLAUDE.md і PROGRESS.md йдуть у КОЖНУ сесію:
// до 2026-11-14 разом це було ~18,5k токенів, переважно історії. Тест стереже, щоб вони
// не розрослись знову, щоб правило в .claude/rules/ не стало невидимим (шаблон `paths:`
// ні з чим не збігся або без `paths:` правило вантажиться завжди) і щоб кожне правило й
// skill були в покажчику «Де що лежить». Тест упав — не піднімай бюджет: винеси текст у
// правило зі скоупом або в docs/claude-history/.

const ROOT = join(import.meta.dirname, '..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf-8');

// Груба міра: кирилиця ≈ символи/2, решта ≈ символи/4.
function estimateTokens(text: string): number {
  const cyrillic = text.match(/[Ѐ-ӿ]/g)?.length ?? 0;
  return Math.round(cyrillic / 2 + (text.length - cyrillic) / 4);
}

const BUDGET = { 'CLAUDE.md': 1_500, 'PROGRESS.md': 2_000 } as const;

const rules = readdirSync(join(ROOT, '.claude/rules')).map((f: string) => `.claude/rules/${f}`);
const skills = readdirSync(join(ROOT, '.claude/skills')).map((d: string) => `.claude/skills/${d}/SKILL.md`);
const claudeMd = read('CLAUDE.md');

// Суворо: `paths:` першим рядком frontmatter, елементи з відступом у 2 пробіли.
// .claude/ виключено з Biome (biome.json) — його Markdown-форматер ламає frontmatter.
function rulePaths(text: string): string[] {
  const front = text.match(/^---\npaths:\n((?: {2}- "[^"]+"\n)+)---\n/)?.[1] ?? '';
  return [...front.matchAll(/^ {2}- "([^"]+)"$/gm)].map((m) => m[1]);
}

describe('Claude Code config layout', () => {
  for (const [file, budget] of Object.entries(BUDGET)) {
    it(`${file} ≤ ${budget} токенів`, () => {
      expect(estimateTokens(read(file))).toBeLessThanOrEqual(budget);
    });
  }

  for (const rule of rules) {
    it(`${rule}: має paths:, і кожен шаблон збігається з файлом`, () => {
      const patterns = rulePaths(read(rule));
      expect(patterns.length).toBeGreaterThan(0);
      for (const pattern of patterns) {
        expect(globSync(pattern, { cwd: ROOT }), pattern).not.toEqual([]);
      }
    });
  }

  for (const file of [...rules, ...skills]) {
    it(`${file} є в покажчику CLAUDE.md`, () => {
      expect(claudeMd).toContain(`| \`${file}\``);
    });
  }

  it('кожен шлях з покажчика існує', () => {
    const listed = [...claudeMd.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((m) => m[1]);
    expect(listed.length).toBeGreaterThan(0);
    for (const path of listed) expect(existsSync(join(ROOT, path)), path).toBe(true);
  });
});
