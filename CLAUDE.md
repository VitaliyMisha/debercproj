# CLAUDE.md

React SPA для підрахунку очок у картковій грі Деберц. Без роутингу й сервера: весь стан у `src/App.tsx`, персистенс через `localStorage`,
режим глядача через Firebase Realtime Database. Форму даних задає `src/types.ts`, уся чиста логіка гри живе в `src/utils/gameHelpers.ts`.

## Сесія

- **Старт**: спершу прочитай `PROGRESS.md` (поточний стан і next steps). Без нього не відповідай на питання про стан проєкту.
- **Кінець**: онови `PROGRESS.md`: коротко, з сьогоднішньою датою. Історію туди не нарощуй, вона йде в `docs/claude-history/`.
- Ігноруй `node_modules`, `.next`, `public/assets`, `dist`.

## Команди

```bash
bun run dev | build | preview
bun run test                          # vitest run; один файл: bun x vitest run tests/game.test.ts
bun run lint | lint:fix               # Biome (не ESLint/Prettier) — обов'язково перед commit
bun run type-check                    # tsc --noEmit; tsconfig включає і src, і tests
```

## Завжди

- **Деплой — ЛИШЕ `git push origin main`** (Vercel підхоплює сам). Будь-яка команда `vercel` / `npx vercel` ЗАБОРОНЕНА, бо створює дублікат деплою.
- Логіка в `src/utils/` пишеться через TDD (Vitest).
- Штрафи (`hvPenalty`, `secondBPenalty`) можуть дорівнювати `0`, тому fallback завжди через `??`, ніколи через `||`.
- Biome сам виправляє формат та імпорти (`lint:fix`), руками не вирівнюй.

## Де що лежить

Правила з `.claude/rules/` вантажаться лише тоді, коли торкаєшся файлів з їхнього `paths:`.

| Файл                                   | Про що                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `.claude/rules/game-logic.md`          | значення в `Round.scores` (Б/ХВ/ВіС), `Round.tokens`, `calculateGameTotals`, `syncWinner`, ключі localStorage |
| `.claude/rules/game-rules-text.md`     | `docs/GAME_RULES.md` ↔ `rules.*` в i18n ↔ `RulesSheet`                                                        |
| `.claude/rules/spectator.md`           | Firebase: хост `useFirebaseSync`, глядач `useSpectator`, `.env.local`                                         |
| `.claude/rules/ui.md`                  | компоненти, іконки, анімації, a11y-пастки                                                                     |
| `.claude/rules/ui-tests.md`            | RTL-тести в `tests/ui/`                                                                                       |
| `.claude/skills/deps-refresh/SKILL.md` | `/deps-refresh` — планове оновлення залежностей                                                               |
| `.claude/skills/ship/SKILL.md`         | `/ship` — мерж гілки в `main`, деплой, прибирання worktree                                                    |
| `docs/GAME_RULES.md`                   | джерело правди для правил гри                                                                                 |
| `docs/claude-history/`                 | архів історії рішень, у контекст не вантажиться                                                               |

Розкладку стереже `tests/claudeConfig.test.ts`: бюджет токенів для `CLAUDE.md` і `PROGRESS.md`, кожне правило має `paths:`,
що збігається з реальними файлами, і кожне правило та skill згадані в таблиці вище. Тест упав? Не піднімай бюджет: винеси текст у правило зі скоупом
або в архів.
